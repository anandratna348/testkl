from fastapi import APIRouter
from fastapi.responses import FileResponse
import os

from app.db import get_connection

from app.services.pdf_extractor import extract_text_from_pdf
from app.services.petition_generator import generate_petition
from app.services.pdf_generator import render_petition_pdf

router = APIRouter(
    prefix="/petitions",
    tags=["Petitions"]
)


def _fetch_firm_profile(cur) -> dict:
    """Fetches the single firm_profile row (id=1) used to auto-fill
    petition signature blocks. Returns an empty dict if not set yet."""
    cur.execute(
        "SELECT attorney_name, attorney_title, law_firm_name, bar_number FROM firm_profile WHERE id = 1"
    )
    row = cur.fetchone()
    if not row:
        return {}
    attorney_name, attorney_title, law_firm_name, bar_number = row
    return {
        "attorney_name": attorney_name or "",
        "attorney_title": attorney_title or "",
        "law_firm_name": law_firm_name or "",
        "bar_number": bar_number or "",
    }


@router.post("/generate/{case_id}")
def generate_case_petition(case_id: int):
    """
    Generates an AI petition draft for a case using:
      - case data
      - extracted text from all uploaded documents
      - the latest AI case analysis (if one exists)
    Persists the result in the petitions table and returns it.
    """

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("SELECT * FROM cases WHERE id = %s", (case_id,))
        case_row = cur.fetchone()

        if not case_row:
            return {"success": False, "message": "Case not found"}

        cur.execute(
            "SELECT document_type, file_path FROM documents WHERE case_id = %s",
            (case_id,)
        )
        documents = cur.fetchall()

        if not documents:
            return {"success": False, "message": "No documents found for this case. Upload documents before generating a petition."}

        combined_text = ""
        for doc_type, file_path in documents:
            try:
                text = extract_text_from_pdf(file_path)
                if text:
                    combined_text += text + "\n"
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

        # Pull latest AI analysis summary, if any, to enrich the petition
        cur.execute(
            "SELECT summary FROM ai_analysis WHERE case_id = %s ORDER BY id DESC LIMIT 1",
            (case_id,)
        )
        analysis_row = cur.fetchone()
        prior_summary = analysis_row[0] if analysis_row else None

        firm_profile = _fetch_firm_profile(cur)

        result = generate_petition(case_row, documents, combined_text, prior_summary, firm_profile)

        if not result["petition_text"]:
            return {
                "success": False,
                "message": "Petition generation failed",
                "error": result.get("generation_error"),
            }

        cur.execute(
            """
            INSERT INTO petitions
            (case_id, content, filing_readiness_score, risk_level, missing_documents, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
            """,
            (
                case_id,
                result["petition_text"],
                result["filing_readiness_score"],
                result["risk_level"],
                ",".join(result["missing_documents"]),
                "draft",
            )
        )
        petition_id, created_at = cur.fetchone()
        conn.commit()

        return {
            "success": True,
            "petition_id": petition_id,
            "case_id": case_id,
            "content": result["petition_text"],
            "filing_readiness_score": result["filing_readiness_score"],
            "risk_level": result["risk_level"],
            "recommendations": result["recommendations"],
            "missing_documents": result["missing_documents"],
            "status": "draft",
            "created_at": created_at,
        }

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


@router.get("/{case_id}")
def get_case_petition(case_id: int):
    """Returns the latest petition generated for a case, if one exists."""

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT id, content, filing_readiness_score, risk_level,
                   missing_documents, status, pdf_path, created_at, updated_at
            FROM petitions
            WHERE case_id = %s
            ORDER BY id DESC
            LIMIT 1
            """,
            (case_id,)
        )
        row = cur.fetchone()

        if not row:
            return {"success": False, "message": "No petition found for this case"}

        (petition_id, content, filing_readiness_score, risk_level,
         missing_documents, status, pdf_path, created_at, updated_at) = row

        return {
            "success": True,
            "petition_id": petition_id,
            "case_id": case_id,
            "content": content,
            "filing_readiness_score": filing_readiness_score,
            "risk_level": risk_level,
            "missing_documents": missing_documents.split(",") if missing_documents else [],
            "status": status,
            "has_pdf": bool(pdf_path),
            "created_at": created_at,
            "updated_at": updated_at,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


@router.get("/download/{petition_id}")
def download_petition_pdf(petition_id: int):
    """
    Renders (if not already rendered) and returns the petition PDF for download.
    The rendered PDF path is cached on the petitions row so repeat downloads
    don't re-render the file.
    """

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT p.id, p.case_id, p.content, p.filing_readiness_score,
                   p.risk_level, p.pdf_path, c.client_name, c.case_type
            FROM petitions p
            JOIN cases c ON c.id = p.case_id
            WHERE p.id = %s
            """,
            (petition_id,)
        )
        row = cur.fetchone()

        if not row:
            return {"success": False, "message": "Petition not found"}

        (pid, case_id, content, filing_readiness_score,
         risk_level, pdf_path, client_name, case_type) = row

        # Reuse existing PDF if already rendered and still on disk
        if not pdf_path or not os.path.exists(pdf_path):
            pdf_path = render_petition_pdf(
                case_id=case_id,
                petition_id=pid,
                client_name=client_name,
                case_type=case_type,
                filing_readiness_score=filing_readiness_score,
                risk_level=risk_level or "Unknown",
                petition_text=content,
            )
            cur.execute(
                "UPDATE petitions SET pdf_path = %s, updated_at = NOW() WHERE id = %s",
                (pdf_path, pid)
            )
            conn.commit()

        safe_client = (client_name or "petition").replace(" ", "_")
        download_name = f"Petition_{safe_client}_{pid}.pdf"

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=download_name,
        )

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()