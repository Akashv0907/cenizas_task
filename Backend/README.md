# Backend

This is the FastAPI backend for the AI-powered document Q&A app.

## Setup

1. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the App

```bash
uvicorn main:app --reload
```

- The API will be available at http://localhost:8000

## Endpoints

- `POST /upload` — Upload a PDF file. Returns a session ID.
- `POST /chat` — Ask a question about the uploaded document. Requires session ID.

## Environment Variables

- To use Gemini Vision, set up your Google Generative AI API key as an environment variable:
  ```bash
  export GOOGLE_API_KEY=your_api_key_here
  ```

## Notes
- This backend stores session data in memory (for demo/dev only).
- PDF size limit: 10MB.
- Only PDF files are accepted. 
