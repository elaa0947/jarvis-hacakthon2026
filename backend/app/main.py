from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="Bottleneck-to-Decision Production Digital Twin API",
    version="1.0.0",
    description="Backend API foundation for 5-stage manufacturing line discrete event simulation."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
