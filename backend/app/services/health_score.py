def calculate_health_score(
    missing_docs_count: int,
    total_required_docs: int = 4,
):
    """
    Health score is proportional to the share of required documents
    actually uploaded for the case (0 uploaded -> 0%, all uploaded -> 100%).

    total_required_docs defaults to 4 to match the standardized uniform
    document set in completeness_checker.UNIFORM_REQUIRED_DOCS, but callers
    should pass the real required count for the case's type when available.
    """
    if total_required_docs <= 0:
        return 0

    uploaded_count = max(total_required_docs - missing_docs_count, 0)
    score = round((uploaded_count / total_required_docs) * 100)

    return max(min(score, 100), 0)