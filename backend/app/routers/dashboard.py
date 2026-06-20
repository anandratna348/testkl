from fastapi import APIRouter
from app.db import get_connection
from app.services.completeness_checker import check_missing_documents

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats():

    conn = get_connection()
    cur = conn.cursor()

    try:
        # ── Stat cards ────────────────────────────────────────────────
        cur.execute("SELECT COUNT(*) FROM cases")
        total_cases = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM documents")
        documents_uploaded = cur.fetchone()[0]

        # Live high-risk: cases where health_score < 70
        cur.execute("SELECT COUNT(*) FROM cases WHERE health_score IS NOT NULL AND health_score < 70")
        high_risk_cases = cur.fetchone()[0]

        # Completed: health_score = 100
        cur.execute("SELECT COUNT(*) FROM cases WHERE health_score = 100")
        completed_cases = cur.fetchone()[0]

        # Missing docs: count across all cases live
        cur.execute("SELECT id, case_type FROM cases")
        all_cases = cur.fetchall()

        cur.execute("SELECT case_id, document_type FROM documents")
        all_docs = cur.fetchall()

        uploaded_by_case = {}
        for case_id, doc_type in all_docs:
            uploaded_by_case.setdefault(case_id, []).append(doc_type)

        total_missing = 0
        cases_with_missing = 0
        for case_id, case_type in all_cases:
            uploaded = uploaded_by_case.get(case_id, [])
            missing = check_missing_documents(case_type, uploaded)
            if missing:
                total_missing += len(missing)
                cases_with_missing += 1

        active_cases = total_cases - completed_cases

        # ── Cases by status (pie chart) ───────────────────────────────
        cur.execute("""
            SELECT
                COALESCE(status, 'Active') as status,
                COUNT(*) as count
            FROM cases
            GROUP BY status
        """)
        status_rows = cur.fetchall()

        STATUS_COLORS = {
            'Active':    '#6366f1',
            'Review':    '#f59e0b',
            'High Risk': '#ef4444',
            'Pending':   '#94a3b8',
            'Completed': '#10b981',
        }
        status_chart = [
            {"name": row[0], "value": row[1], "color": STATUS_COLORS.get(row[0], '#94a3b8')}
            for row in status_rows
        ]

        # ── Monthly trend (last 6 months) ─────────────────────────────
        cur.execute("""
            SELECT
                TO_CHAR(created_at, 'Mon') as month,
                EXTRACT(MONTH FROM created_at) as month_num,
                EXTRACT(YEAR FROM created_at) as year,
                COUNT(*) as new_cases
            FROM cases
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY month, month_num, year
            ORDER BY year, month_num
        """)
        trend_rows = cur.fetchall()

        # Build completed count per month from cases with health_score=100
        cur.execute("""
            SELECT
                TO_CHAR(created_at, 'Mon') as month,
                EXTRACT(MONTH FROM created_at) as month_num,
                EXTRACT(YEAR FROM created_at) as year,
                COUNT(*) as completed
            FROM cases
            WHERE health_score = 100
              AND created_at >= NOW() - INTERVAL '6 months'
            GROUP BY month, month_num, year
            ORDER BY year, month_num
        """)
        completed_rows = {(r[0]): r[3] for r in cur.fetchall()}

        trend_data = [
            {
                "month": r[0],
                "new": r[3],
                "completed": completed_rows.get(r[0], 0)
            }
            for r in trend_rows
        ]

        # If no trend data yet (new app), return current month snapshot
        if not trend_data:
            from datetime import datetime
            trend_data = [{"month": datetime.now().strftime("%b"), "new": total_cases, "completed": completed_cases}]

        return {
            "total_cases": total_cases,
            "active_cases": active_cases,
            "documents_uploaded": documents_uploaded,
            "high_risk_cases": high_risk_cases,
            "completed_cases": completed_cases,
            "missing_documents": cases_with_missing,
            "total_missing_docs": total_missing,
            "status_chart": status_chart,
            "trend_data": trend_data,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()