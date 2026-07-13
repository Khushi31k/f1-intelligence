"""
F1 Intelligence API — FastAPI backend
Uses Jolpica F1 API (Ergast-compatible) for historical data + XGBoost for predictions
"""
import os
import json
import time
import logging
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from f1_data import F1DataService
from ml_model import F1Predictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
data_service = F1DataService()
predictor = F1Predictor()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: pre-warm data cache and train model"""
    logger.info("F1 Intelligence API starting up...")
    try:
        data_service.warm_cache()
        predictor.train(data_service)
        logger.info("Model trained successfully")
    except Exception as e:
        logger.warning(f"Startup warm-up failed (non-fatal): {e}")
    yield
    logger.info("F1 Intelligence API shutting down")


app = FastAPI(
    title="F1 Intelligence API",
    description="AI-powered Formula 1 race prediction and analytics",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Request / Response models
# ──────────────────────────────────────────────

class PredictionRequest(BaseModel):
    year: int
    round: int
    driver: Optional[str] = None
    constructor: Optional[str] = None


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────

@app.get("/api/healthz")
def health_check():
    return {
        "status": "ok",
        "model_ready": predictor.is_trained,
        "data_cached": data_service.is_cached,
    }


# ──────────────────────────────────────────────
# Races
# ──────────────────────────────────────────────

@app.get("/api/races")
def list_races(year: int = 2024):
    return data_service.get_races(year)


# ──────────────────────────────────────────────
# Drivers
# ──────────────────────────────────────────────

@app.get("/api/drivers")
def list_drivers(year: int = 2024):
    return data_service.get_drivers(year)


# ──────────────────────────────────────────────
# Constructors
# ──────────────────────────────────────────────

@app.get("/api/constructors")
def list_constructors(year: int = 2024):
    return data_service.get_constructors(year)


# ──────────────────────────────────────────────
# Prediction
# ──────────────────────────────────────────────

@app.post("/api/predict")
def run_prediction(req: PredictionRequest):
    try:
        if not predictor.is_trained:
            predictor.train(data_service)
        result = predictor.predict(data_service, req.year, req.round)
        return result
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────
# Analytics
# ──────────────────────────────────────────────

@app.get("/api/analytics/driver-performance")
def driver_performance(driver: str = Query(...), year: int = 2024):
    return data_service.get_driver_performance(driver, year)


@app.get("/api/analytics/constructor-standings")
def constructor_standings(year: int = 2024):
    return data_service.get_constructor_standings_progression(year)


@app.get("/api/analytics/driver-standings")
def driver_standings(year: int = 2024):
    return data_service.get_driver_standings(year)


@app.get("/api/analytics/win-percentage")
def win_percentage(year: int = 2024):
    return data_service.get_win_percentage(year)


@app.get("/api/analytics/pole-positions")
def pole_positions(year: int = 2024):
    return data_service.get_pole_positions(year)


@app.get("/api/analytics/circuit-performance")
def circuit_performance(driver: str = Query(...), year: int = 2024):
    return data_service.get_circuit_performance(driver, year)


@app.get("/api/analytics/avg-finish")
def avg_finish(year: int = 2024):
    return data_service.get_avg_finish(year)


# ──────────────────────────────────────────────
# Dataset Explorer
# ──────────────────────────────────────────────

@app.get("/api/dataset")
def get_dataset(
    search: Optional[str] = None,
    year: Optional[int] = None,
    driver: Optional[str] = None,
    constructor: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    return data_service.get_dataset(
        search=search,
        year=year,
        driver=driver,
        constructor=constructor,
        limit=min(limit, 200),
        offset=offset,
    )


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
