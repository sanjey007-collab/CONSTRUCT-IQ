import time
import uuid
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.entities import User
from app.seed_demo_data import seed_database
from app.api.v1 import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="ConstructIQ — Intelligent AI-Powered Construction Resource Optimization Platform API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    req_id = str(uuid.uuid4())[:8]
    request.state.request_id = req_id
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
        response.headers["X-Request-ID"] = req_id
        return response
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred during processing.",
                    "request_id": req_id
                }
            }
        )

@app.on_event("startup")
def startup_event():
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)
    # Check if database has users; if empty, automatically run seed
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("No existing records found. Seeding initial demo construction data...")
            seed_database(db)
    finally:
        db.close()

@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "mode": "DEMO_READY",
        "version": "1.0.0"
    }

app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
