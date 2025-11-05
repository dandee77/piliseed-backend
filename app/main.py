from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import mongodb
from app.routers import sensors, recommendations

app = FastAPI(
    title="PiliSeed API",
    description="Intelligent crop recommendation system for Philippine farmers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await mongodb.connect()

@app.on_event("shutdown")
async def shutdown_event():
    await mongodb.disconnect()

app.include_router(sensors.router)
app.include_router(recommendations.router)

@app.get("/")
async def root():
    return {
        "message": "PiliSeed API - Intelligent Crop Recommendation System",
        "version": "1.0.0",
        "endpoints": {
            "sensors": "/sensors",
            "recommendations": "/recommendations"
        }
    }