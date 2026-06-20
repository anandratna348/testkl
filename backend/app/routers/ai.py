from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from app.db import get_connection

from app.services.pdf_extractor import extract_text_from_pdf
from app.services.gemini_service import analyze_document, chat_with_gemini
from app.services.completeness_checker import check_missing_documents, get_required_document_count
from app.services.health_score import calculate_health_score
from app.services.recommendations import generate_recommendations
from app.services.petition_intent import detect_petition_case_id
from app.services.petition_generator import generate_petition
from app.routers.petitions import _fetch_firm_profile


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.post("/analyze/{case_id}")
def analyze_case(case_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            "SELECT document_type, file_path FROM documents WHERE case_id = %s",
            (case_id,)
        )
        documents = cur.fetchall()

        if not documents:
            return {"success": False, "message": "No documents found for this case"}

        uploaded_docs = []
        combined_text = ""

        for doc_type, file_path in documents:
            uploaded_docs.append(doc_type)
            try:
                text = extract_text_from_pdf(file_path)
                if text:
                    combined_text += text + "\n"
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

        cur.execute("SELECT case_type FROM cases WHERE id = %s", (case_id,))
        case_row = cur.fetchone()
        if not case_row:
            return {"success": False, "message": "Case not found"}

        case_type = case_row[0]

        missing_documents = check_missing_documents(case_type, uploaded_docs)
        health_score = calculate_health_score(len(missing_documents), get_required_document_count(case_type))
        recommendation_data = generate_recommendations(health_score, missing_documents)
        ai_summary = analyze_document(combined_text)

        cur.execute(
            """
            INSERT INTO ai_analysis (case_id, summary, missing_documents, health_score)
            VALUES (%s, %s, %s, %s) RETURNING id
            """,
            (case_id, str(ai_summary), ",".join(missing_documents), health_score)
        )
        analysis_id = cur.fetchone()[0]

        cur.execute(
            "UPDATE cases SET health_score = %s WHERE id = %s",
            (health_score, case_id)
        )

        conn.commit()

        return {
            "success": True,
            "analysis_id": analysis_id,
            "case_id": case_id,
            "health_score": health_score,
            "risk_level": recommendation_data["risk_level"],
            "recommendations": recommendation_data["recommendations"],
            "missing_documents": missing_documents,
            "analysis": ai_summary,
        }

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


@router.get("/result/{case_id}")
def get_analysis(case_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            """
            SELECT id, summary, health_score, created_at
            FROM ai_analysis
            WHERE case_id = %s
            ORDER BY id DESC LIMIT 1
            """,
            (case_id,)
        )
        result = cur.fetchone()

        if not result:
            return {"success": False, "message": "Analysis not found"}

        cur.execute(
            "SELECT document_type FROM documents WHERE case_id = %s",
            (case_id,)
        )
        uploaded_docs = [row[0] for row in cur.fetchall()]

        cur.execute("SELECT case_type FROM cases WHERE id = %s", (case_id,))
        case_row = cur.fetchone()
        case_type = case_row[0] if case_row else ""

        missing_docs = check_missing_documents(case_type, uploaded_docs)
        health_score = calculate_health_score(len(missing_docs), get_required_document_count(case_type))
        recommendation_data = generate_recommendations(health_score, missing_docs)

        return {
            "success": True,
            "analysis_id": result[0],
            "summary": result[1],
            "missing_documents": missing_docs,
            "health_score": health_score,
            "risk_level": recommendation_data["risk_level"],
            "recommendations": recommendation_data["recommendations"],
            "created_at": result[3],
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        cur.close()
        conn.close()


# ── Chat ──────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]


@router.post("/chat")
def chat(request: ChatRequest):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(
            "SELECT id, client_name, case_type, priority, status, health_score FROM cases ORDER BY id DESC"
        )
        rows = cur.fetchall()

        # Build context with live missing docs per case
        case_lines = []
        for r in rows:
            case_id_ctx, client, case_type_ctx, priority, status, health = r

            cur.execute(
                "SELECT document_type FROM documents WHERE case_id = %s", (case_id_ctx,)
            )
            uploaded = [d[0] for d in cur.fetchall()]
            missing = check_missing_documents(case_type_ctx, uploaded)
            missing_str = ", ".join(missing) if missing else "None"

            case_lines.append(
                f"Case #{case_id_ctx} | Client: {client} | Type: {case_type_ctx} | Priority: {priority} "
                f"| Status: {status or 'Active'} | Health: {health or 0}% "
                f"| Uploaded docs: {', '.join(uploaded) if uploaded else 'None'} "
                f"| Missing docs: {missing_str}"
            )

        case_context = "\n".join(case_lines) or "No cases found."

        system_prompt = f"""You are AscendAI Copilot, an expert immigration case management assistant.
You have access to the following live case data:

{case_context}

Answer questions about these cases accurately and concisely.
Use **bold** for key information. Use bullet points for lists.
Base all answers on the case data above. Always mention missing documents when asked."""

        history = [
            {"role": m.role, "content": m.content}
            for m in request.messages[:-1]
        ]
        last_message = request.messages[-1].content

        # ── Petition intent interception ────────────────────────────
        # If the user is clearly asking to generate a petition for a
        # specific case, handle it directly instead of a normal chat
        # reply. Any other message falls through to Gemini unchanged.
        petition_case_id = detect_petition_case_id(last_message)

        if petition_case_id is not None:
            case_match = next((r for r in rows if r[0] == petition_case_id), None)

            if not case_match:
                return {
                    "success": True,
                    "reply": f"I couldn't find Case #{petition_case_id}. Please check the case number and try again.",
                }

            cur.execute("SELECT * FROM cases WHERE id = %s", (petition_case_id,))
            case_row = cur.fetchone()

            cur.execute(
                "SELECT document_type, file_path FROM documents WHERE case_id = %s",
                (petition_case_id,)
            )
            pet_documents = cur.fetchall()

            if not pet_documents:
                return {
                    "success": True,
                    "reply": (
                        f"Case #{petition_case_id} ({case_match[1]}) has no uploaded documents yet. "
                        f"Please upload documents before generating a petition."
                    ),
                }

            combined_text = ""
            for doc_type, file_path in pet_documents:
                try:
                    text = extract_text_from_pdf(file_path)
                    if text:
                        combined_text += text + "\n"
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

            cur.execute(
                "SELECT summary FROM ai_analysis WHERE case_id = %s ORDER BY id DESC LIMIT 1",
                (petition_case_id,)
            )
            analysis_row = cur.fetchone()
            prior_summary = analysis_row[0] if analysis_row else None

            firm_profile = _fetch_firm_profile(cur)

            result = generate_petition(case_row, pet_documents, combined_text, prior_summary, firm_profile)

            if not result["petition_text"]:
                return {
                    "success": True,
                    "reply": f"I wasn't able to generate a petition for Case #{petition_case_id} right now. Please try again from the case page.",
                }

            cur.execute(
                """
                INSERT INTO petitions
                (case_id, content, filing_readiness_score, risk_level, missing_documents, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    petition_case_id,
                    result["petition_text"],
                    result["filing_readiness_score"],
                    result["risk_level"],
                    ",".join(result["missing_documents"]),
                    "draft",
                )
            )
            petition_id = cur.fetchone()[0]
            conn.commit()

            reply = (
                f"✅ Petition generated for **Case #{petition_case_id} ({case_match[1]})**.\n\n"
                f"**Filing Readiness Score:** {result['filing_readiness_score']}%\n"
                f"**Risk Level:** {result['risk_level']}\n\n"
                f"You can view and download it from the case's Petition page."
            )

            return {
                "success": True,
                "reply": reply,
                "petition_id": petition_id,
                "case_id": petition_case_id,
            }

        # ── Normal chat flow (unchanged) ────────────────────────────
        reply = chat_with_gemini(system_prompt, history, last_message)

        return {"success": True, "reply": reply}

    except Exception as e:
        print(f"[chat error] {e}")
        return {"success": False, "error": str(e), "reply": f"Error: {str(e)}"}

    finally:
        cur.close()
        conn.close()