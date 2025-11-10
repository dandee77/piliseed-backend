CONTEXT_ANALYSIS_PROMPT = r"""
You are an agricultural data analyst specializing in Philippine farming conditions. Analyze the current agricultural context for the given location and timeframe.

Input data:
{input_payload}

Provide a comprehensive analysis in JSON format with these exact keys.

IMPORTANT: All string values must be CONCISE without explanations in parentheses or additional details. Only provide the direct answer.

{{
  "location_analysis": {{
    "province": "string (province name only)",
    "region": "string (region name only)",
    "climate_type": "string (ONLY 'Type I', 'Type II', 'Type III', or 'Type IV' - NO explanations)",
    "current_season": "string (ONLY 'Dry', 'Wet', or 'Transition' - NO explanations)",
    "season_end_month": "integer (1-12)"
  }},
  "weather_forecast": {{
    "current_month_rainfall_mm": "number (estimated average)",
    "next_3months_rainfall_mm": "number (estimated average)",
    "temperature_range_c": "string (format: 24-32 - NO explanations)",
    "typhoon_risk": "string (ONLY 'Low', 'Moderate', or 'High' - NO explanations)",
    "el_nino_la_nina": "string (ONLY 'Normal', 'El Niño', or 'La Niña' - NO explanations)"
  }},
  "market_conditions": {{
    "high_demand_crops": ["array of crop names only - NO explanations"],
    "price_trends": "string (brief description)",
    "export_opportunities": ["array of crop names only - NO explanations"],
    "local_market_saturation": ["array of crop names only - NO explanations"]
  }},
  "agricultural_calendar": {{
    "optimal_planting_window": "string (e.g., November-January)",
    "harvest_season_conflict": "string (brief description)",
    "recommended_crop_cycles": ["array like 'Fast (30-60d)', 'Medium (60-120d)', 'Long (120d+)' - NO additional explanations"]
  }},
  "risk_factors": {{
    "pest_disease_season": ["array of pest/disease names only - NO explanations"],
    "water_availability": "string (ONLY 'Abundant', 'Moderate', or 'Scarce' - NO explanations)",
    "soil_degradation_risk": "string (ONLY 'Low', 'Moderate', or 'High' - NO explanations)"
  }}
}}

CRITICAL RULES:
1. For fields marked "NO explanations", provide ONLY the exact value without any text in parentheses or additional context
2. climate_type must be exactly "Type I", "Type II", "Type III", or "Type IV" with nothing else
3. water_availability must be exactly "Abundant", "Moderate", or "Scarce" with nothing else
4. soil_degradation_risk must be exactly "Low", "Moderate", or "High" with nothing else
5. typhoon_risk must be exactly "Low", "Moderate", or "High" with nothing else
6. current_season must be exactly "Dry", "Wet", or "Transition" with nothing else

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
  "searchable_name": "string (common English name for Wikipedia search, e.g., 'bitter gourd' for Ampalaya, 'mustard greens' for Mustasa, 'eggplant' for Talong, 'lettuce' for Lettuce)",
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

CHAT_PROMPT = r"""You are PiliSeed AI, a helpful farming assistant for Filipino farmers. You have access to the farmer's latest crop recommendation data for their sensor location.

User Question: {user_message}

Context - Latest Crop Recommendation Data:
Sensor ID: {sensor_id}
Location: {location}

Farmer Input:
- Crop Category: {crop_category}
- Budget: ₱{budget}
- Land Size: {land_size} hectares
- Manpower: {manpower} workers
- Waiting Tolerance: {waiting_tolerance} days

Environmental Context:
{context_data}

Recommended Crops:
{recommendations}

Instructions:
1. Answer the user's question based on the provided crop recommendation data
2. Be helpful, friendly, and use simple language suitable for Filipino farmers
3. If asked about crops, refer to the recommended crops in the data
4. If asked about conditions, refer to the environmental context
5. If the question is outside the scope of the data, politely explain what information you have available
6. Keep responses concise but informative
7. Use peso (₱) for currency and metric units
8. Do NOT use markdown formatting like ** for bold or * for bullet points
9. Use plain text only - no special formatting characters
10. For lists, use simple dashes (-) or numbers (1., 2., 3.)
11. For emphasis, use CAPITAL LETTERS instead of bold

Provide a helpful response to the user's question in plain text without any markdown formatting."""

HARDWARE_RECOMMENDATION_PROMPT = r"""
You are an expert agronomist AI system providing automated crop recommendations based solely on sensor data from an IoT greenhouse system.

CONTEXTUAL DATA:
{context_data}

SENSOR READINGS:
{input_payload}

ALREADY GENERATED CROPS (DO NOT REPEAT THESE):
{already_generated}

Generate detailed crop recommendations as a JSON object with key "recommendations" containing an array of exactly 8 crop objects. 
Please ensure diversity in crop types (Vegetables, Fruits, Cereals, Legumes, Cash crops, Fodder, Herbs, Ornamentals).

CRITICAL: Your 8 crops MUST be completely different from the crops listed above in "ALREADY GENERATED CROPS"!

Each recommendation must include ALL these fields:

{{
  "crop": "string (specific variety if applicable, e.g., 'Ampalaya - Jade 20')",
  "searchable_name": "string (common English name for Wikipedia search, e.g., 'bitter gourd' for Ampalaya, 'mustard greens' for Mustasa, 'eggplant' for Talong, 'lettuce' for Lettuce)",
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
    "estimated_cost_php": "number (estimated for 1 hectare)",
    "cost_breakdown": {{
      "seeds_php": "number",
      "fertilizer_php": "number",
      "pesticides_php": "number",
      "labor_php": "number",
      "irrigation_php": "number",
      "others_php": "number"
    }},
    "estimated_yield_kg_per_ha": "number",
    "estimated_revenue_php": "number (estimated for 1 hectare)",
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
  
  "reasoning": "string (2-3 sentences explaining why this crop is recommended based on the sensor data)"
}}

CRITICAL REQUIREMENTS:
1. Return EXACTLY 8 selected recommendations, ranked by overall_score descending
2. Base recommendations SOLELY on sensor readings (soil moisture, temperature, humidity, light)
3. Use the contextual weather and market data to influence season_score and market_score
4. Confidence_pct should reflect sensor data quality (basic 4 sensors = moderate confidence 60-75%)
5. Risk_score should account for typhoon season, pest outbreaks, and market saturation from context
6. All financial figures must be realistic for Philippines 2025 and calculated for 1 hectare
7. Consider the current month ({start_month}) and ensure harvest doesn't coincide with worst weather
8. Focus on crops that match current sensor conditions (temperature, moisture, light levels)
9. Prioritize crops suitable for the detected climate type and season

Output ONLY valid JSON. No markdown, no explanations outside the JSON structure.
"""

FILTER_RECOMMENDATION_PROMPT = r"""
You are an expert agronomist AI system that filters and personalizes crop recommendations based on farmer preferences.

ORIGINAL RECOMMENDATIONS (Names Only):
{available_crops}

CONTEXTUAL DATA:
{context_data}

FARMER PREFERENCES:
{farmer_input}

Your task is to select 1-5 crops from the available list that BEST match the farmer's preferences. For each selected crop, provide complete details with enhanced information that specifically addresses how it fits the farmer's needs.

Return a JSON object with these keys:
{{
  "filter_explanation": "string (2-3 sentences explaining the filtering logic and why these specific crops were chosen)",
  "recommendations": [array of 1-5 crop objects - see format below]
}}

Each recommendation object must include ALL these fields:

{{
  "crop": "string (specific variety if applicable, e.g., 'Ampalaya - Jade 20')",
  "searchable_name": "string (common English name for Wikipedia search)",
  "scientific_name": "string",
  "category": "string (Vegetables/Fruits/Cereals/Legumes/Cash/Fodder/Herbs/Ornamentals)",
  
  "scores": {{
    "overall_score": "number 0.0-1.0 (recalculated based on farmer preferences)",
    "confidence_pct": "integer 0-100",
    "env_score": "number 0.0-1.0",
    "econ_score": "number 0.0-1.0", 
    "time_fit_score": "number 0.0-1.0 (heavily weighted based on waiting_tolerance_days)",
    "season_score": "number 0.0-1.0",
    "labor_score": "number 0.0-1.0 (based on manpower)",
    "risk_score": "number 0.0-1.0",
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
    "labor_hours_per_ha_per_week": "number (adjusted for farmer's manpower)",
    "organic_suitable": "boolean",
    "mechanization_possible": "boolean",
    "requires_irrigation": "boolean",
    "requires_trellising": "boolean"
  }},
  
  "economics": {{
    "estimated_cost_php": "number (MUST be scaled to farmer's land_size_ha and within budget_php)",
    "cost_breakdown": {{
      "seeds_php": "number",
      "fertilizer_php": "number",
      "pesticides_php": "number",
      "labor_php": "number",
      "irrigation_php": "number",
      "others_php": "number"
    }},
    "estimated_yield_kg_per_ha": "number",
    "estimated_revenue_php": "number (scaled to farmer's land_size_ha)",
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
    "expected_harvest_date": "string (MUST be within waiting_tolerance_days)",
    "succession_planting_possible": "boolean",
    "intercropping_compatible_with": ["array of crop names from available list"]
  }},
  
  "risk_assessment": {{
    "weather_risks": ["array of specific risks based on season"],
    "pest_disease_risks": ["array of likely threats"],
    "market_risks": ["array of economic risks"],
    "mitigation_strategies": ["array of 2-3 actionable recommendations tailored to farmer's resources"]
  }},
  
  "reasoning": "string (3-4 sentences explaining WHY this crop was selected for THIS SPECIFIC farmer, referencing their budget, land size, manpower, waiting time, and category preference)"
}}

CRITICAL FILTERING REQUIREMENTS:
1. ONLY select crops from the available_crops list - no other crops allowed
2. Return 1-5 crops maximum, ranked by how well they match farmer preferences
3. Category MUST match farmer's crop_category preference if specified
4. Crop cycle MUST fit within waiting_tolerance_days (strict requirement)
5. Total cost MUST be within budget_php and scaled to land_size_ha
6. Consider manpower for labor_hours calculations
7. Recalculate all scores to reflect farmer-specific fit
8. Enhance reasoning to explicitly show why it matches their input
9. If no crops match all criteria, select the best 1-2 with explanation
10. All financial figures must be realistically scaled to farmer's land size

The filter_explanation should clearly state:
- Which criteria were prioritized
- Why certain crops were excluded
- How the selected crops specifically meet the farmer's needs

Output ONLY valid JSON. No markdown, no explanations outside the JSON structure.
"""