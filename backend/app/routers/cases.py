from fastapi import APIRouter
from app.db import get_connection
from app.models.case import CaseCreate
from app.services.completeness_checker import check_missing_documents, get_required_document_count
from app.services.health_score import calculate_health_score

router = APIRouter(
    prefix="/cases",
    tags=["Cases"]
)


@router.post("/")
def create_case(case: CaseCreate):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO cases
        (client_name, case_type, priority)
        VALUES (%s,%s,%s)
        RETURNING id
        """,
        (
            case.client_name,
            case.case_type,
            case.priority
        )
    )

    case_id = cur.fetchone()[0]

    conn.commit()

    cur.close()
    conn.close()

    return {
        "message": "Case created",
        "case_id": case_id
    }


@router.get("/")
def get_cases():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT *
        FROM cases
        ORDER BY id DESC
        """
    )

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows

@router.get("/{case_id}")
def get_case_details(case_id: int):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT *
        FROM cases
        WHERE id=%s
        """,
        (case_id,)
    )
    case = cur.fetchone()

    cur.execute(
        """
        SELECT document_type, file_path
        FROM documents
        WHERE case_id=%s
        """,
        (case_id,)
    )
    documents = cur.fetchall()

    cur.execute(
        """
        SELECT summary, health_score
        FROM ai_analysis
        WHERE case_id=%s
        ORDER BY id DESC
        LIMIT 1
        """,
        (case_id,)
    )
    analysis = cur.fetchone()

    # ── Live missing docs + health score (no AI analysis required) ──
    case_type = case[2] if case else ""
    uploaded_doc_types = [d[0] for d in documents]
    missing_documents = check_missing_documents(case_type, uploaded_doc_types)
    total_required = get_required_document_count(case_type)
    live_health_score = calculate_health_score(len(missing_documents), total_required)

    # Keep DB health score in sync
    if case:
        cur.execute(
            "UPDATE cases SET health_score = %s WHERE id = %s",
            (live_health_score, case_id)
        )
        conn.commit()

    cur.close()
    conn.close()

    return {
        "case": case,
        "documents": documents,
        "analysis": analysis,
        "missing_documents": missing_documents,
        "live_health_score": live_health_score,
    }