import os
import re

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib import colors

PETITION_DIR = os.path.join("uploads", "petitions")
os.makedirs(PETITION_DIR, exist_ok=True)

# Numbered section headers produced by the petition_generator prompt, e.g.
# "1. Statement of Purpose" -> rendered as a bold heading line.
_SECTION_HEADER_RE = re.compile(r"^\s*\d+\.\s+.+$")


def _build_styles():
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "PetitionTitle",
        parent=styles["Title"],
        fontSize=16,
        spaceAfter=4,
        alignment=TA_LEFT,
    )
    meta_style = ParagraphStyle(
        "PetitionMeta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#64748b"),  # slate-500, matches frontend palette
        spaceAfter=14,
    )
    heading_style = ParagraphStyle(
        "PetitionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#1e293b"),  # slate-800
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "PetitionBody",
        parent=styles["Normal"],
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor("#334155"),  # slate-700
        spaceAfter=8,
    )
    return title_style, meta_style, heading_style, body_style


def _escape(text: str) -> str:
    # reportlab Paragraph treats text as a mini-XML; escape special chars
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


_BOLD_RE = re.compile(r"\*\*(.+?)\*\*")


def _markdown_to_reportlab(escaped_text: str) -> str:
    """Converts the small subset of markdown the AI model tends to emit
    (**bold**) into ReportLab's mini-XML <b> tags. Must run AFTER _escape,
    since the <b>/</b> tags it inserts should not themselves be escaped."""
    return _BOLD_RE.sub(r"<b>\1</b>", escaped_text)


def _strip_markdown_for_matching(text: str) -> str:
    """Strips markdown bold markers so heading/structure detection isn't
    thrown off by '**1. Section Title**' style headings."""
    return text.replace("**", "").strip()


def render_petition_pdf(case_id: int, petition_id: int, client_name: str,
                         case_type: str, filing_readiness_score: int,
                         risk_level: str, petition_text: str) -> str:
    """
    Renders the petition to a PDF on disk and returns the relative file path
    (same convention as documents: a path you can store in the DB and serve
    via the existing StaticFiles mount at /uploads).
    """
    file_name = f"petition_{case_id}_{petition_id}.pdf"
    file_path = os.path.join(PETITION_DIR, file_name)

    title_style, meta_style, heading_style, body_style = _build_styles()

    doc = SimpleDocTemplate(
        file_path,
        pagesize=LETTER,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.8 * inch,
        bottomMargin=0.8 * inch,
        title=f"Petition - {client_name}",
    )

    story = []
    story.append(Paragraph("Immigration Petition Support Letter", title_style))
    story.append(Paragraph(
        f"Client: {_escape(client_name)} &nbsp;|&nbsp; Case Type: {_escape(case_type)} "
        f"&nbsp;|&nbsp; Filing Readiness Score: {filing_readiness_score}/100 "
        f"&nbsp;|&nbsp; Risk Level: {_escape(risk_level)}",
        meta_style,
    ))

    # Split petition text into paragraphs; render numbered section headers
    # (e.g. "1. Statement of Purpose") as headings, everything else as body text.
    raw_paragraphs = [p.strip() for p in (petition_text or "").split("\n") if p.strip()]

    if not raw_paragraphs:
        story.append(Paragraph(
            "Petition content could not be generated. Please re-run AI generation.",
            body_style,
        ))
    else:
        for para in raw_paragraphs:
            # Detect (and strip) a leading markdown bullet marker, e.g. "* Beneficiary Name: ..."
            is_bullet = para.startswith("* ") or para.startswith("- ")
            content = para[2:].strip() if is_bullet else para

            # Detect section headings (e.g. "1. Statement of Purpose" or
            # "**1. Statement of Purpose**") on the markdown-stripped text,
            # so stray ** around a heading doesn't break detection.
            is_heading = (not is_bullet) and bool(
                _SECTION_HEADER_RE.match(_strip_markdown_for_matching(para))
            )

            safe = _markdown_to_reportlab(_escape(content))
            if is_bullet:
                safe = "• " + safe

            if is_heading:
                # Headings shouldn't carry redundant bold from markdown the
                # model may have added (the heading style is already bold).
                safe = safe.replace("<b>", "").replace("</b>", "")
                story.append(Paragraph(safe, heading_style))
            else:
                story.append(Paragraph(safe, body_style))

    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph(
        "Generated by AscendAI Case Copilot — AI-assisted draft. "
        "Review by a licensed immigration attorney is required before filing.",
        meta_style,
    ))

    doc.build(story)

    return file_path