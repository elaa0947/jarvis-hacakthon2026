import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="Bottleneck-to-Decision Production Digital Twin API",
    version="1.0.0",
    description="Backend API foundation for 5-stage manufacturing line discrete event simulation."
)

raw_origins = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()] if raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Production Digital Twin Engine"
    }
