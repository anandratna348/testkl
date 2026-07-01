# AscendAI Case Copilot

AI-powered legal case management platform that streamlines case handling, document analysis, and petition generation using Large Language Models (LLMs). The platform helps legal professionals organize cases, analyze uploaded documents, identify missing documents, generate petitions, and receive AI-powered recommendations through an intuitive web interface.

---

## Overview

AscendAI Case Copilot is an end-to-end AI application built for law firms to improve productivity by automating repetitive legal workflows.

The platform combines:

- AI-powered document analysis
- Case management system
- Automatic document classification
- Petition generation
- Health score & case completeness tracking
- AI legal assistant
- Recommendation engine
- Modern full-stack architecture

---

# Features

## Case Management

- Create and manage legal cases
- Track client information
- Assign case priorities
- View case history

---

## Document Management

- Upload legal documents
- Automatic document type detection
- PDF storage
- Document retrieval
- Support for multiple documents per case

---

## AI Document Analysis

Analyze uploaded documents using Gemini AI.

Generates:

- Case summary
- Important observations
- Legal insights
- Missing information detection
- AI recommendations

---

## Petition Generator

Generate AI-powered legal petitions using uploaded case documents.

Automatically includes:

- Attorney details
- Law firm information
- Case context
- Supporting evidence
- Professional formatting

---

## AI Legal Assistant

Chat with AI regarding:

- Uploaded documents
- Case information
- Legal summaries
- Client queries
- Petition drafting assistance

---

## Health Score Dashboard

Each case receives a health score based on:

- Required documents uploaded
- Case completeness
- Missing documentation
- Overall readiness

Dashboard displays:

- Total cases
- Documents uploaded
- High-risk cases
- Completed cases
- Missing document statistics

---

## Recommendation Engine

Provides intelligent recommendations for improving case quality based on uploaded documents and AI analysis.

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Recharts

### Backend

- FastAPI
- Python
- PostgreSQL
- Pydantic

### AI

- Google Gemini
- PDF Text Extraction
- AI Petition Generation
- AI Case Analysis
- Recommendation Engine

### Deployment

- Docker
- REST APIs

---

# Architecture

```
                User
                  │
                  ▼
        React + Vite Frontend
                  │
                  ▼
          FastAPI Backend
                  │
      ┌───────────┼────────────┐
      │           │            │
      ▼           ▼            ▼
 Case Mgmt   Document AI   Petition AI
      │           │            │
      └───────────┼────────────┘
                  │
                  ▼
          Google Gemini AI
                  │
                  ▼
            PostgreSQL DB
```

---

# Project Structure

```
AscendAI-Case-Copilot/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── uploads/
│   │   ├── db.py
│   │   └── main.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
```

---

# Workflow

## 1. Create Case

- Add client information
- Select case type
- Assign priority

---

## 2. Upload Documents

Users upload:

- Resume
- Passport
- Degree Certificate
- Experience Letter
- Other legal documents

The platform:

- Stores PDFs
- Detects document type
- Associates files with the case

---

## 3. AI Analysis

Gemini AI:

- Reads uploaded PDFs
- Summarizes documents
- Detects missing documents
- Calculates case health score
- Generates recommendations

---

## 4. Petition Generation

The AI:

- Uses uploaded evidence
- Reads attorney profile
- Drafts a legal petition
- Generates a downloadable PDF

---

## 5. Dashboard

Provides real-time insights into:

- Active cases
- Uploaded documents
- Case completion
- High-risk cases
- Missing documentation

---

# API Endpoints

## Health Check

```
GET /
```

Response

```json
{
    "message":"AscendAI Case Copilot Running"
}
```

---

## Cases

### Create Case

```
POST /cases
```

### Get All Cases

```
GET /cases
```

### Get Case Details

```
GET /cases/{case_id}
```

---

## Documents

### Upload Document

```
POST /documents/upload
```

---

## AI

### Analyze Case

```
POST /ai/analyze/{case_id}
```

Returns

- Case summary
- AI insights
- Recommendations
- Health score

---

## Petitions

### Generate Petition

```
POST /petitions/generate/{case_id}
```

---

## Dashboard

### Statistics

```
GET /dashboard/stats
```

---

## Settings

### Get Firm Profile

```
GET /settings/profile
```

### Update Firm Profile

```
POST /settings/profile
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/AscendAI-Case-Copilot.git

cd AscendAI-Case-Copilot
```

---

## Backend

```bash
cd backend

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend:

```
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# Future Improvements

- Multi-Agent Legal AI
- Retrieval-Augmented Generation (RAG)
- OCR for scanned legal documents
- Role-Based Access Control (RBAC)
- Case timeline visualization
- Multi-language support
- Cloud deployment on GCP
- Docker Compose support
- Audit logs
- Email notifications
- AI-powered legal research
- Case similarity search

---

# Key Highlights

- Full-Stack AI Application
- AI-Powered Legal Assistant
- Automated Document Analysis
- Intelligent Petition Generation
- Legal Case Health Scoring
- Recommendation Engine
- RESTful FastAPI Backend
- React Dashboard
- PostgreSQL Integration
- Production-Ready Architecture

---
