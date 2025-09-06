from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import router
app = FastAPI()

# Allow CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

@app.get("/")
def read_root():
    return {"message": "Tabiya Taxonomy Graph API is running."}
