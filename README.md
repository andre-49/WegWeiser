# The steps to running the project

### Backend first
cd backend; python -m venv venv; & venv\Scripts\Activate.ps1; pip install -r requirements.txt;
cd ../; uvicorn backend.main:app --host 127.0.0.1 --port 8001;

### Frontend second
cd frontend;
bun install; bun dev
