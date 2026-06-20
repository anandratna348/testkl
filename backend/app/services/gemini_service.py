import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# gemini-1.5-flash is widely available on all free/paid tiers
model = genai.GenerativeModel("gemini-2.5-flash-lite")


def analyze_document(text: str):
    prompt = f"""You are an immigration case analyst.

Analyze the following document and provide:
1. A brief case summary (2-3 sentences)
2. Key extracted information (name, education, experience if present)
3. Any concerns or notable points

Document:
{text}
"""
    response = model.generate_content(prompt)
    return response.text


def chat_with_gemini(system_prompt: str, history: list, user_message: str) -> str:
    parts = [system_prompt, ""]

    for msg in history:
        role = "User" if msg.get("role") == "user" else "Assistant"
        parts.append(f"{role}: {msg.get('content', '')}")

    parts.append(f"User: {user_message}")
    parts.append("Assistant:")

    full_prompt = "\n".join(parts)
    response = model.generate_content(full_prompt)
    return response.text.strip()