from pydantic import BaseModel


class CaseCreate(BaseModel):
    client_name: str
    case_type: str
    priority: str


class CaseResponse(BaseModel):
    id: int
    client_name: str
    case_type: str
    priority: str
    status: str
    health_score: int

