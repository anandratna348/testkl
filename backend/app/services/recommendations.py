def generate_recommendations(
    health_score: int,
    missing_documents: list
):

    recommendations = []

    if health_score == 100:
        recommendations.append(
            "Case is complete and ready for submission"
        )

    if health_score < 100:

        for doc in missing_documents:
            recommendations.append(
                f"Upload missing {doc}"
            )

    if health_score < 70:
        recommendations.append(
            "High risk case needs immediate review"
        )

    if health_score >= 70:
        risk_level = "Low"

    elif health_score >= 40:
        risk_level = "Medium"

    else:
        risk_level = "High"

    return {
        "risk_level": risk_level,
        "recommendations": recommendations
    }