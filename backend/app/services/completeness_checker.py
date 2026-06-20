# Maps case_type values stored in DB → required document list.
#
# Standardized: every visa/case type requires the same uniform set of
# documents. This matches the only 4 document types the upload detector
# (see routers/documents.py -> detect_document_type) actually recognizes,
# and keeps health score / filing readiness score consistent and fair
# across all case types (no case type is structurally easier to max out
# than another).
UNIFORM_REQUIRED_DOCS = [
    "passport",
    "resume",
    "degree_certificate",
    "experience_letter",
]

CASE_TYPES = [
    "H-1B Visa",
    "H-4 EAD",
    "L-1 Visa",
    "O-1 Visa",
    "E-3 Visa",
    "TN Visa",
    "Green Card (EB-2)",
    "Green Card (EB-3)",
    "EB-2 NIW",
    "PERM Labor Certification",
    "Asylum",
    "Family Petition",
]

REQUIRED_DOCS = {case_type: UNIFORM_REQUIRED_DOCS for case_type in CASE_TYPES}


def check_missing_documents(case_type: str, uploaded_docs: list):
    required = REQUIRED_DOCS.get(case_type, UNIFORM_REQUIRED_DOCS)
    return list(set(required) - set(uploaded_docs))


def get_required_document_count(case_type: str) -> int:
    """Total number of documents required for a case type (used for
    proportional score calculations, e.g. health_score / filing readiness)."""
    return len(REQUIRED_DOCS.get(case_type, UNIFORM_REQUIRED_DOCS))