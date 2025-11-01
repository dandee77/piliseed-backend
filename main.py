import os
import sys
import json
import time
import datetime
import requests
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
HTTP_TIMEOUT = 30
MAX_RETRIES = 3
RETRY_DELAY = 2

SENSOR_CONSTANTS = {
    "soil_moisture_pct": 28,
    "temperature_c": 26.7,
    "humidity_pct": 78,
    "light_lux": 20000,
}

@dataclass
class FarmerInputs:
    crop_category: str
    budget_php: float
    waiting_tolerance_days: int
    land_size_ha: float
    manpower: int
    location: str
    start_month: int

def safe_input(prompt: str, default: str) -> str:
    try:
        v = input(f"{prompt} [{default}]: ").strip()
        return v if v != "" else default
    except EOFError:
        return default


def collect_user_inputs() -> FarmerInputs:
    print("=== Plant Recommender System ===")
    cat = safe_input("Crop category (Vegetables/Fruits/Cereals/Legumes/Cash/Fodder/Herbs/Ornamentals/Any)", "Any")
    budget = float(safe_input("Budget in PHP", "10000"))
    wait = int(safe_input("Waiting tolerance (days)", "90"))
    land = float(safe_input("Land size (ha)", "0.5"))
    manpower = int(safe_input("Manpower (number of workers)", "2"))
    location = safe_input("Location (province/city)", "Bulacan")
    start_month = int(safe_input("Start month (1-12)", str(datetime.datetime.now().month)))
    return FarmerInputs(cat, budget, wait, land, manpower, location, start_month)

CONTEXT_ANALYSIS_PROMPT = r"""
You are an agricultural data analyst specializing in Philippine farming conditions. Analyze the current agricultural context for the given location and timeframe.

Input data:
{input_payload}

Provide a comprehensive analysis in JSON format with these exact keys:

{{
  "location_analysis": {{
    "province": "string",
    "region": "string",
    "climate_type": "string (Type I-IV Philippine classification)",
    "current_season": "string (Dry/Wet/Transition)",
    "season_end_month": "integer (1-12)"
  }},
  "weather_forecast": {{
    "current_month_rainfall_mm": "number (estimated average)",
    "next_3months_rainfall_mm": "number (estimated average)",
    "temperature_range_c": "string (e.g., 24-32)",
    "typhoon_risk": "string (Low/Moderate/High)",
    "el_nino_la_nina": "string (Normal/El Niño/La Niña)"
  }},
  "market_conditions": {{
    "high_demand_crops": ["array of crop names currently in high demand"],
    "price_trends": "string (Rising/Stable/Declining for common crops)",
    "export_opportunities": ["array of crops with export potential"],
    "local_market_saturation": ["array of oversupplied crops to avoid"]
  }},
  "agricultural_calendar": {{
    "optimal_planting_window": "string (e.g., November-January)",
    "harvest_season_conflict": "string (describe if harvest timing conflicts with typhoon season)",
    "recommended_crop_cycles": ["Fast (30-60d)", "Medium (60-120d)", "Long (120d+)"]
  }},
  "risk_factors": {{
    "pest_disease_season": ["array of common pests/diseases active in this period"],
    "water_availability": "string (Abundant/Moderate/Scarce)",
    "soil_degradation_risk": "string (Low/Moderate/High)"
  }}
}}

Base your analysis on typical Philippine agricultural patterns, regional climate data, and current month context. Be realistic and specific to {location}.
"""

RECOMMENDATION_PROMPT = r"""
You are an expert agronomist AI system providing personalized crop recommendations for Philippine farmers.

CONTEXTUAL DATA:
{context_data}

FARMER PROFILE & SENSORS:
{input_payload}

Generate detailed crop recommendations as a JSON object with key "recommendations" containing an array of crop objects.

Each recommendation must include ALL these fields:

{{
  "crop": "string (specific variety if applicable, e.g., 'Ampalaya - Jade 20')",
  "scientific_name": "string",
  "category": "string (Vegetables/Fruits/Cereals/Legumes/Cash/Fodder/Herbs/Ornamentals)",
  
  "scores": {{
    "overall_score": "number 0.0-1.0 (weighted composite)",
    "confidence_pct": "integer 0-100",
    "env_score": "number 0.0-1.0",
    "econ_score": "number 0.0-1.0", 
    "time_fit_score": "number 0.0-1.0",
    "season_score": "number 0.0-1.0",
    "labor_score": "number 0.0-1.0",
    "risk_score": "number 0.0-1.0 (higher is better, means lower risk)",
    "market_score": "number 0.0-1.0"
  }},
  
  "growth_requirements": {{
    "crop_cycle_days": "integer",
    "water_requirement": "string (Low/Moderate/High, with liters/plant/day if applicable)",
    "sunlight_hours_daily": "integer",
    "optimal_temp_range_c": "string (e.g., 20-30)",
    "soil_ph_range": "string (e.g., 5.5-6.5)",
    "soil_type_preferred": "string"
  }},
  
  "tolerances": {{
    "drought_tolerance": "string (Low/Moderate/High)",
    "flood_tolerance": "string (Low/Moderate/High)",
    "salinity_tolerance": "string (Low/Moderate/High)",
    "frost_tolerance": "string (Low/Moderate/High)",
    "shade_tolerance": "string (Low/Moderate/High)",
    "pest_disease_resistance": "string (Low/Moderate/High)"
  }},
  
  "management": {{
    "management_intensity": "string (Low/Moderate/High)",
    "labor_hours_per_ha_per_week": "number",
    "organic_suitable": "boolean",
    "mechanization_possible": "boolean",
    "requires_irrigation": "boolean",
    "requires_trellising": "boolean"
  }},
  
  "economics": {{
    "estimated_cost_php": "number (total for farmer's land size)",
    "cost_breakdown": {{
      "seeds_php": "number",
      "fertilizer_php": "number",
      "pesticides_php": "number",
      "labor_php": "number",
      "irrigation_php": "number",
      "others_php": "number"
    }},
    "estimated_yield_kg_per_ha": "number",
    "estimated_revenue_php": "number (total for farmer's land size)",
    "profit_margin_pct": "number",
    "roi_pct": "number",
    "break_even_days": "integer"
  }},
  
  "market_strategy": {{
    "best_selling_locations": ["array of specific markets/cities"],
    "current_market_price_php_per_kg": "number",
    "projected_harvest_price_php_per_kg": "number",
    "price_volatility": "string (Low/Moderate/High)",
    "demand_level": "string (Low/Moderate/High/Very High)",
    "export_potential": "boolean",
    "buyer_types": ["array: e.g., Wet market, Supermarket, Restaurant, Processor, Exporter"]
  }},
  
  "planting_schedule": {{
    "recommended_planting_date": "string (e.g., November 15-30, 2025)",
    "expected_harvest_date": "string (e.g., February 15-28, 2026)",
    "succession_planting_possible": "boolean",
    "intercropping_compatible_with": ["array of crop names"]
  }},
  
  "risk_assessment": {{
    "weather_risks": ["array of specific risks based on season"],
    "pest_disease_risks": ["array of likely threats in the planting period"],
    "market_risks": ["array of economic risks"],
    "mitigation_strategies": ["array of 2-3 actionable recommendations"]
  }},
  
  "reasoning": "string (2-3 sentences explaining why this crop is recommended for this specific farmer)"
}}

CRITICAL REQUIREMENTS:
1. Return maximum 8 recommendations, ranked by overall_score descending
2. Consider the waiting_tolerance_days: heavily penalize time_fit_score if crop_cycle_days exceeds it
3. Use the contextual weather and market data to influence season_score and market_score
4. Confidence_pct should be reduced if sensor data is incomplete (no pH, EC, NPK sensors)
5. Risk_score should account for typhoon season, pest outbreaks, and market saturation from context
6. All financial figures must be realistic for Philippines 2025 and scaled to farmer's land_size_ha
7. Consider the current month ({start_month}) and ensure harvest doesn't coincide with worst weather
8. Respect budget constraint strictly - do not recommend crops where estimated_cost_php > budget_php

Output ONLY valid JSON. No markdown, no explanations outside the JSON structure.
"""

def call_gemini(prompt: str) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 2048,
        }
    }
    
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=HTTP_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            if "candidates" not in data or not data["candidates"]:
                raise ValueError("No candidates in response")
            
            text_content = data["candidates"][0]["content"]["parts"][0]["text"]
            
            text_content = text_content.strip()
            if text_content.startswith("```json"):
                text_content = text_content[7:]
            elif text_content.startswith("```"):
                text_content = text_content[3:]
            if text_content.endswith("```"):
                text_content = text_content[:-3]
            text_content = text_content.strip()
            
            return json.loads(text_content)
            
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (attempt + 1)
                print(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...", file=sys.stderr)
                time.sleep(wait_time)
    
    raise RuntimeError(f"Failed after {MAX_RETRIES} attempts. Last error: {last_error}")


def main():
    farmer = collect_user_inputs()

    input_payload = {
        "sensors": SENSOR_CONSTANTS,
        "farmer": asdict(farmer)
    }

    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY environment variable not set.")
        sys.exit(1)

    print("\n[Stage 1/2] Analyzing agricultural context...")
    context_prompt = CONTEXT_ANALYSIS_PROMPT.replace("{input_payload}", json.dumps(input_payload, ensure_ascii=False))
    context_prompt = context_prompt.replace("{location}", farmer.location)
    
    try:
        context_data = call_gemini(context_prompt)
        print("✓ Context analysis complete")
    except Exception as e:
        print(f"Error getting context: {e}")
        sys.exit(1)

    print("\n[Stage 2/2] Generating personalized crop recommendations...")
    recommendation_prompt = RECOMMENDATION_PROMPT.replace("{context_data}", json.dumps(context_data, ensure_ascii=False, indent=2))
    recommendation_prompt = recommendation_prompt.replace("{input_payload}", json.dumps(input_payload, ensure_ascii=False))
    recommendation_prompt = recommendation_prompt.replace("{start_month}", str(farmer.start_month))
    
    try:
        ai_response = call_gemini(recommendation_prompt)
    except Exception as e:
        print(f"Error getting recommendations: {e}")
        sys.exit(1)

    if isinstance(ai_response, dict) and "recommendations" in ai_response:
        output = ai_response
    elif isinstance(ai_response, list):
        output = {"recommendations": ai_response}
    else:
        if isinstance(ai_response, dict):
            recs = ai_response.get("data") or ai_response.get("items") or []
        else:
            recs = []
        output = {"recommendations": recs}

    print("\n" + "="*80)
    print("CROP RECOMMENDATIONS")
    print("="*80)
    print(json.dumps(output, indent=2, ensure_ascii=False))



if __name__ == "__main__":
    main()