"""
Petition generation service.

Builds an AI-drafted immigration petition from:
  - case data (client, case type, priority)
  - extracted text from uploaded documents
  - prior AI case analysis (if available)
  - the firm profile (attorney name/title/firm/bar number) for the
    signature block and filing date

Also computes the Filing Readiness Score — a 0-100 score that reflects
how ready a case is to actually be filed (stricter than the general
case Health Score, since it also penalizes for petition-specific gaps).
"""

from datetime import date

import google.generativeai as genai

from app.services.completeness_checker import check_missing_documents
from app.services.recommendations import generate_recommendations

# Reuse the same model configuration already initialized in gemini_service.
# (genai.configure() is called once on import of gemini_service; importing
# it here ensures that configuration has happened before we build a model.)
from app.services import gemini_service  # noqa: F401  (ensures genai.configure() ran)

model = genai.GenerativeModel("gemini-2.5-flash-lite")


DOC_LABELS = {
    "passport": "Passport",
    "resume": "Resume / CV",
    "degree_certificate": "Degree Certificate",
    "experience_letter": "Experience Letter",
    "unknown": "Other Document",
}


def _build_prompt(case_row, uploaded_docs, missing_documents, combined_text,
                   prior_summary, firm_profile):
    """
    case_row: tuple from `SELECT * FROM cases WHERE id=%s`
              -> id, client_name, case_type, priority, status, health_score, ...
    firm_profile: dict with attorney_name, attorney_title, law_firm_name, bar_number
    """
    client_name = case_row[1]
    case_type = case_row[2]
    priority = case_row[3] if len(case_row) > 3 else "Standard"

    uploaded_labels = [DOC_LABELS.get(d, d) for d in uploaded_docs] or ["None"]
    missing_labels = [DOC_LABELS.get(d, d) for d in missing_documents] or ["None"]

    prior_section = f"\nPrior AI case analysis notes:\n{prior_summary}\n" if prior_summary else ""

    law_firm_name = (firm_profile or {}).get("law_firm_name") or "[Information not available in submitted documents]"

    return f"""You are an expert immigration paralegal drafting a formal petition support letter.

Case details:
- Client Name (the beneficiary of this petition): {client_name}
- Petition / Case Type: {case_type}
- Priority: {priority}
- Filing Law Firm: {law_firm_name}
- Documents on file: {', '.join(uploaded_labels)}
- Documents still missing: {', '.join(missing_labels)}
{prior_section}
Source material extracted from the client's uploaded documents:
\"\"\"
{combined_text[:12000] if combined_text else "No document text was available."}
\"\"\"

CRITICAL — BENEFICIARY IDENTITY: This petition is being filed for the client named
"{client_name}" and for no one else. The source material above was extracted
automatically from uploaded files and may contain other names (e.g. references,
sample letters, third parties, or names from unrelated boilerplate). You MUST
refer to the beneficiary as "{client_name}" throughout the entire letter. Never
substitute, infer, or use any other person's name as the beneficiary, even if a
different name appears more prominently in the source material. If the source
material does not clearly describe "{client_name}", use the qualifications/
experience described but still attribute them to "{client_name}".

Draft a formal petition support letter for this case. Structure it with these sections:
1. Statement of Purpose (why this petition is being filed)
2. Summary of Qualifications (drawn from the source material above, attributed
   to {client_name})
3. Supporting Evidence Summary (list the documents on file and what each demonstrates)
4. Conclusion / Request for Approval

Write in formal, professional legal-letter tone. Do not invent facts that are not
supported by the source material — if information is missing, write
"[Information not available in submitted documents]" instead of guessing.
Keep it concise (under 700 words). Do not use markdown bold (**) around plain
prose — only use it for the section number headings themselves.

IMPORTANT: Do NOT include a "Petitioner / Beneficiary Information" section (it is
added separately), and do NOT include a date line, a "Sincerely," closing, a
signature block, attorney name, attorney title, or bar number at the end of the
letter. End the letter immediately after the Conclusion / Request for Approval
section. The signature block will be appended separately.
"""


def _build_beneficiary_section(case_row, firm_profile: dict) -> str:
    """
    Deterministically builds the "1. Petitioner / Beneficiary Information"
    section from case data, instead of relying on the model to fill it in.
    This guarantees the beneficiary name always matches the case's
    client_name, even if uploaded document text references other names.
    """
    client_name = case_row[1]
    case_type = case_row[2]
    priority = case_row[3] if len(case_row) > 3 else "Standard"

    return (
        "1. Petitioner / Beneficiary Information\n\n"
        f"* Beneficiary Name: {client_name}\n"
        "* Petitioner Name/Company Name: [Information not available in submitted documents]\n"
        f"* Case Type: {case_type}\n"
        f"* Priority: {priority}\n"
    )


def _build_signature_block(firm_profile: dict) -> str:
    """
    Deterministically builds the closing signature block from the firm
    profile (Settings page), instead of relying on the model to fill it in.
    Falls back to bracketed placeholders for any field left blank, so the
    output is always well-formed even before a profile has been saved.
    """
    firm_profile = firm_profile or {}

    attorney_name = firm_profile.get("attorney_name") or "[Attorney Name not set — add it in Settings]"
    attorney_title = firm_profile.get("attorney_title") or "[Title not set]"
    law_firm_name = firm_profile.get("law_firm_name") or "[Law Firm Name not set]"
    bar_number = firm_profile.get("bar_number") or ""

    filing_date = date.today().strftime("%B %d, %Y")

    bar_line = f"\n{bar_number}" if bar_number else ""

    return (
        f"\n\nDate: {filing_date}\n\n"
        f"Sincerely,\n\n"
        f"{attorney_name}\n"
        f"{attorney_title}\n"
        f"{law_firm_name}{bar_line}"
    )


def _filing_readiness_score(uploaded_count: int, required_count: int,
                             has_ai_analysis: bool, has_petition_text: bool) -> int:
    """
    Filing Readiness Score: stricter cousin of the general Health Score.

    Base score is proportional to the share of required documents actually
    uploaded (0 required docs uploaded -> 0 base score, all uploaded -> 100),
    then deducts further for:
      - no AI case analysis run yet (10 pts)
      - petition text could not be generated (20 pts)
    Floors at 0.
    """
    if required_count > 0:
        base_score = round((uploaded_count / required_count) * 100)
    else:
        # Case type has no required docs on file (e.g. unmapped case type) —
        # don't reward with a free 100; treat as not yet assessable.
        base_score = 0 if uploaded_count == 0 else 100

    score = base_score

    if not has_ai_analysis:
        score -= 10

    if not has_petition_text:
        score -= 20

    return max(min(score, 100), 0)


def generate_petition(case_row, documents, combined_text, prior_analysis_summary=None, firm_profile=None):
    """
    case_row:       tuple from cases table (SELECT *)
    documents:      list of (document_type, file_path) tuples
    combined_text:  extracted text from all uploaded docs (already concatenated)
    prior_analysis_summary: str | None — latest ai_analysis.summary for this case
    firm_profile:   dict | None — attorney_name, attorney_title, law_firm_name,
                     bar_number (from Settings); used to auto-fill the
                     signature block and filing date

    Returns a dict ready to persist + return to the client.
    """
    case_type = case_row[2]
    uploaded_doc_types = [d[0] for d in documents]
    missing_documents = check_missing_documents(case_type, uploaded_doc_types)
    required_count = len(uploaded_doc_types) + len(missing_documents)

    petition_text = ""
    generation_error = None
    try:
        prompt = _build_prompt(
            case_row, uploaded_doc_types, missing_documents, combined_text,
            prior_analysis_summary, firm_profile,
        )
        response = model.generate_content(prompt)
        body_text = (response.text or "").strip()
        if body_text:
            beneficiary_section = _build_beneficiary_section(case_row, firm_profile)
            petition_text = (
                beneficiary_section + "\n\n" + body_text + _build_signature_block(firm_profile)
            )
    except Exception as e:
        generation_error = str(e)

    has_petition_text = bool(petition_text)
    readiness_score = _filing_readiness_score(
        uploaded_count=len(uploaded_doc_types),
        required_count=required_count,
        has_ai_analysis=bool(prior_analysis_summary),
        has_petition_text=has_petition_text,
    )
    recommendation_data = generate_recommendations(readiness_score, missing_documents)

    return {
        "petition_text": petition_text,
        "generation_error": generation_error,
        "filing_readiness_score": readiness_score,
        "risk_level": recommendation_data["risk_level"],
        "recommendations": recommendation_data["recommendations"],
        "missing_documents": missing_documents,
    }