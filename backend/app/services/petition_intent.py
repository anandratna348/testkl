import re

# Matches things like:
#   "generate a petition for case 3"
#   "create petition for case #12"
#   "draft a petition for case 7"
#   "make petition case 4"
_PETITION_INTENT_RE = re.compile(
    r"(generate|create|draft|make|build)\b.{0,30}\bpetition\b.{0,30}\bcase\s*#?\s*(\d+)",
    re.IGNORECASE,
)

# Fallback: "petition for case 3" / "petition case 3" without a leading verb
_PETITION_FALLBACK_RE = re.compile(
    r"\bpetition\b.{0,30}\bcase\s*#?\s*(\d+)",
    re.IGNORECASE,
)


def detect_petition_case_id(message: str):
    """
    Returns an int case_id if the message looks like a request to generate
    a petition for a specific case, otherwise None.
    """
    if not message:
        return None

    match = _PETITION_INTENT_RE.search(message)
    if match:
        return int(match.group(2))

    match = _PETITION_FALLBACK_RE.search(message)
    if match:
        return int(match.group(1))

    return None