from fastapi import APIRouter
from pydantic import BaseModel

from app.db import get_connection

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


class FirmProfileUpdate(BaseModel):
    attorney_name: str = ""
    attorney_title: str = ""
    law_firm_name: str = ""
    bar_number: str = ""


@router.get("/profile")
def get_firm_profile():
    """Returns the firm profile (single row, id=1). Used to pre-fill the
    Settings form and to auto-fill petition signature blocks."""

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT attorney_name, attorney_title, law_firm_name, bar_number FROM firm_profile WHERE id = 1"
        )
        row = cur.fetchone()

        if not row:
            return {
                "success": True,
                "attorney_name": "",
                "attorney_title": "",
                "law_firm_name": "",
                "bar_number": "",
            }

        attorney_name, attorney_title, law_firm_name, bar_number = row

        return {
            "success": True,
            "attorney_name": attorney_name or "",
            "attorney_title": attorney_title or "",
            "law_firm_name": law_firm_name or "",
            "bar_number": bar_number or "",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


@router.put("/profile")
def save_firm_profile(profile: FirmProfileUpdate):
    """Creates or updates the single firm_profile row (id=1)."""

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO firm_profile (id, attorney_name, attorney_title, law_firm_name, bar_number, updated_at)
            VALUES (1, %s, %s, %s, %s, NOW())
            ON CONFLICT (id) DO UPDATE SET
                attorney_name = EXCLUDED.attorney_name,
                attorney_title = EXCLUDED.attorney_title,
                law_firm_name = EXCLUDED.law_firm_name,
                bar_number = EXCLUDED.bar_number,
                updated_at = NOW()
            """,
            (
                profile.attorney_name.strip(),
                profile.attorney_title.strip(),
                profile.law_firm_name.strip(),
                profile.bar_number.strip(),
            )
        )
        conn.commit()

        return {
            "success": True,
            "attorney_name": profile.attorney_name.strip(),
            "attorney_title": profile.attorney_title.strip(),
            "law_firm_name": profile.law_firm_name.strip(),
            "bar_number": profile.bar_number.strip(),
        }

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()