from fastapi import APIRouter, UploadFile, File, Form
from app.db import get_connection

import os
import shutil

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


def detect_document_type(filename: str):

    filename = filename.lower()

    if "resume" in filename:
        return "resume"

    elif "passport" in filename:
        return "passport"

    elif "degree" in filename:
        return "degree_certificate"

    elif "experience" in filename:
        return "experience_letter"

    elif "cv" in filename:
        return "resume"

    return "unknown"


@router.post("/upload")
async def upload_document(
    case_id: int = Form(...),
    file: UploadFile = File(...)
):

    conn = get_connection()
    cur = conn.cursor()

    try:

        file_path = os.path.join(
            UPLOAD_DIR,
            file.filename
        )

        # Save file
        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # Detect document type automatically
        document_type = detect_document_type(
            file.filename
        )

        # Insert into database
        cur.execute(
            """
            INSERT INTO documents
            (
                case_id,
                document_type,
                file_path
            )
            VALUES (%s,%s,%s)
            RETURNING id
            """,
            (
                case_id,
                document_type,
                file_path
            )
        )

        document_id = cur.fetchone()[0]

        conn.commit()

        return {
            "success": True,
            "document_id": document_id,
            "case_id": case_id,
            "document_type": document_type,
            "file_name": file.filename,
            "file_path": file_path
        }

    except Exception as e:

        conn.rollback()

        return {
            "success": False,
            "error": str(e)
        }

    finally:

        cur.close()
        conn.close()

@router.get("/all")
def get_all_documents():
    """Return all uploaded docs + missing docs across all cases."""
    conn = get_connection()
    cur = conn.cursor()

    from app.services.completeness_checker import check_missing_documents

    try:
        # Get all uploaded documents with case info
        cur.execute("""
            SELECT d.id, d.case_id, d.document_type, d.file_path,
                   c.client_name, c.case_type
            FROM documents d
            JOIN cases c ON c.id = d.case_id
            ORDER BY d.id DESC
        """)
        rows = cur.fetchall()

        uploaded = []
        for r in rows:
            doc_id, case_id, doc_type, file_path, client_name, case_type = r
            fname = file_path.replace("\\", "/").split("/")[-1]
            ext = fname.split(".")[-1].upper() if "." in fname else "DOC"
            uploaded.append({
                "id": doc_id,
                "case_id": case_id,
                "client_name": client_name,
                "case_type": case_type,
                "document_type": doc_type,
                "file_name": fname,
                "file_ext": ext,
                "status": "uploaded",
            })

        # Get missing docs per case
        cur.execute("SELECT id, client_name, case_type FROM cases")
        cases = cur.fetchall()

        already_uploaded = {}
        for r in rows:
            cid = r[1]
            already_uploaded.setdefault(cid, []).append(r[2])

        missing = []
        for case_id, client_name, case_type in cases:
            uploaded_types = already_uploaded.get(case_id, [])
            missing_types = check_missing_documents(case_type, uploaded_types)
            for mt in missing_types:
                missing.append({
                    "id": f"missing-{case_id}-{mt}",
                    "case_id": case_id,
                    "client_name": client_name,
                    "case_type": case_type,
                    "document_type": mt,
                    "file_name": None,
                    "file_ext": None,
                    "status": "missing",
                })

        return {"success": True, "uploaded": uploaded, "missing": missing}

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()