from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SensorData(BaseModel):
    soil_moisture_pct: float
    temperature_c: float
    humidity_pct: float
    light_lux: float

class SensorLocation(BaseModel):
    name: str
    location: str
    description: Optional[str] = None

class SensorLocationResponse(BaseModel):
    sensor_id: str
    name: str
    location: str
    description: Optional[str]
    created_at: datetime
    last_updated: Optional[datetime] = None
    current_sensors: Optional[SensorData] = None

class FarmerInput(BaseModel):
    crop_category: str
    budget_php: float
    waiting_tolerance_days: int
    land_size_ha: float
    manpower: int

class RecommendationRequest(BaseModel):
    sensor_id: str
    farmer: FarmerInput

class SensorUpdateResponse(BaseModel):
    message: str
    sensors: SensorData

class ContextAnalysisResponse(BaseModel):
    id: str
    location_analysis: Dict[str, Any]
    weather_forecast: Dict[str, Any]
    market_conditions: Dict[str, Any]
    agricultural_calendar: Dict[str, Any]
    risk_factors: Dict[str, Any]

class Score(BaseModel):
    overall_score: float
    confidence_pct: int
    env_score: float
    econ_score: float
    time_fit_score: float
    season_score: float
    labor_score: float
    risk_score: float
    market_score: float

class GrowthRequirements(BaseModel):
    crop_cycle_days: int
    water_requirement: str
    sunlight_hours_daily: int
    optimal_temp_range_c: str
    soil_ph_range: str
    soil_type_preferred: str

class Tolerances(BaseModel):
    drought_tolerance: str
    flood_tolerance: str
    salinity_tolerance: str
    frost_tolerance: str
    shade_tolerance: str
    pest_disease_resistance: str

class Management(BaseModel):
    management_intensity: str
    labor_hours_per_ha_per_week: float
    organic_suitable: bool
    mechanization_possible: bool
    requires_irrigation: bool
    requires_trellising: bool

class CostBreakdown(BaseModel):
    seeds_php: float
    fertilizer_php: float
    pesticides_php: float
    labor_php: float
    irrigation_php: float
    others_php: float

class Economics(BaseModel):
    estimated_cost_php: float
    cost_breakdown: CostBreakdown
    estimated_yield_kg_per_ha: float
    estimated_revenue_php: float
    profit_margin_pct: float
    roi_pct: float
    break_even_days: int

class MarketStrategy(BaseModel):
    best_selling_locations: List[str]
    current_market_price_php_per_kg: float
    projected_harvest_price_php_per_kg: float
    price_volatility: str
    demand_level: str
    export_potential: bool
    buyer_types: List[str]

class PlantingSchedule(BaseModel):
    recommended_planting_date: str
    expected_harvest_date: str
    succession_planting_possible: bool
    intercropping_compatible_with: List[str]

class RiskAssessment(BaseModel):
    weather_risks: List[str]
    pest_disease_risks: List[str]
    market_risks: List[str]
    mitigation_strategies: List[str]

class CropRecommendation(BaseModel):
    crop: str
    scientific_name: str
    category: str
    scores: Score
    growth_requirements: GrowthRequirements
    tolerances: Tolerances
    management: Management
    economics: Economics
    market_strategy: MarketStrategy
    planting_schedule: PlantingSchedule
    risk_assessment: RiskAssessment
    reasoning: str

class RecommendationResponse(BaseModel):
    id: str
    recommendations: List[CropRecommendation]
