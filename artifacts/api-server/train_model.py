#!/usr/bin/env python3
"""
Pre-train and save the F1 XGBoost model.
Run this locally to generate model/f1_model.ubj before deploying to Vercel.

Usage:
    cd artifacts/api-server
    python train_model.py
"""
import sys
import os
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.dirname(__file__))

from f1_data import F1DataService
from ml_model import F1Predictor, MODEL_PATH, MODEL_DIR

def main():
    logger.info("=== F1 Model Pre-trainer ===")
    logger.info("Fetching training data from Jolpica API (this may take 30-60s)...")

    data_service = F1DataService()

    # Warm cache for training years
    for year in [2021, 2022, 2023, 2024]:
        logger.info(f"  Loading {year} season data...")
        data_service._fetch_all_results(year)

    logger.info("Training XGBoost model...")
    predictor = F1Predictor.__new__(F1Predictor)
    predictor.model = None
    predictor.is_trained = False
    predictor.accuracy = 0.0
    predictor.feature_names = [
        "grid_position", "driver_cumulative_points", "team_cumulative_points",
        "driver_wins", "driver_races", "driver_avg_position", "driver_experience",
    ]
    predictor.trained_on_rows = 0

    success = predictor.train(data_service)

    if success:
        os.makedirs(MODEL_DIR, exist_ok=True)
        saved = predictor.save_model(MODEL_PATH)
        if saved:
            size_kb = os.path.getsize(MODEL_PATH) // 1024
            logger.info(f"✓ Model saved to {MODEL_PATH} ({size_kb} KB)")
            logger.info(f"  Rows: {predictor.trained_on_rows}")
            logger.info(f"  Accuracy proxy: {predictor.accuracy:.1%}")
            logger.info("  Commit model/f1_model.ubj and model/f1_meta.json to git.")
        else:
            logger.error("Failed to save model file.")
            sys.exit(1)
    else:
        logger.error("Training failed — check API connectivity.")
        sys.exit(1)

if __name__ == "__main__":
    main()
