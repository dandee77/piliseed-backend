import json
import logging
import uuid
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.models.schemas import (
    ContextAnalysisResponse,
    RecommendationRequest,
    RecommendationResponse,
    SensorData,
    HardwareSensorData,
    AutoRecommendationResponse,
    FilterRecommendationRequest,
    FilterRecommendationResponse
)
from app.services.gemini_service import call_gemini
from app.services.database_service import save_to_mongodb
from app.services.wikipedia_service import fetch_wikipedia_thumbnail
from app.services.prompts import CONTEXT_ANALYSIS_PROMPT, RECOMMENDATION_PROMPT, CHAT_PROMPT, HARDWARE_RECOMMENDATION_PROMPT, FILTER_RECOMMENDATION_PROMPT
from app.core.config import DEFAULT_SENSOR_VALUES, START_MONTH
from app.core.database import mongodb

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["recommendations"])

def generate_user_uid():
    return str(uuid.uuid4())

@router.get("/{sensor_id}/latest", response_model=RecommendationResponse)
async def get_latest_recommendations(sensor_id: str):
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    
    try:
        latest_recommendation = await recommendations_collection.find_one(
            {"data.sensor_id": sensor_id},
            sort=[("timestamp", -1)]
        )
        
        if not latest_recommendation or "data" not in latest_recommendation:
            raise HTTPException(status_code=404, detail="No recommendations found for this sensor")
        
        output = latest_recommendation["data"].get("output", {})
        recommendations = output.get("recommendations", [])
        
        if not recommendations:
            raise HTTPException(status_code=404, detail="No recommendations found for this sensor")
        
        return RecommendationResponse(
            id=str(latest_recommendation["_id"]),
            sensor_id=sensor_id,
            recommendations=recommendations
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendations: {str(e)}")

@router.get("/{sensor_id}/context-analysis", response_model=ContextAnalysisResponse)
async def analyze_context(sensor_id: str, refresh: bool = False):
    db = mongodb.get_database()
    sensors_collection = db["sensor_locations"]
    context_collection = db["location_analysis"]
    
    try:
        sensor_doc = await sensors_collection.find_one({"_id": ObjectId(sensor_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid sensor_id format")
    
    if not sensor_doc:
        raise HTTPException(status_code=404, detail="Sensor location not found")
    
    if not refresh:
        existing_context = await context_collection.find_one(
            {"data.sensor_id": sensor_id},
            sort=[("timestamp", -1)]
        )
        
        if existing_context and "data" in existing_context:
            context_data = existing_context["data"].get("output")
            if context_data:
                return ContextAnalysisResponse(
                    id=str(existing_context["_id"]),
                    sensor_id=sensor_id,
                    **context_data
                )
    
    sensors = sensor_doc.get("current_sensors", DEFAULT_SENSOR_VALUES)
    location = sensor_doc["location"]
    
    input_payload = {
        "sensors": sensors,
        "location": location,
        "start_month": START_MONTH
    }
    
    try:
        context_prompt = CONTEXT_ANALYSIS_PROMPT.replace(
            "{input_payload}",  
            json.dumps(input_payload, ensure_ascii=False)
        )
        context_prompt = context_prompt.replace("{location}", location)
        
        context_data = call_gemini(context_prompt)
        
        if refresh:
            await context_collection.delete_many({"data.sensor_id": sensor_id})
        
        document_id = await save_to_mongodb("location_analysis", {
            "sensor_id": sensor_id,
            "sensor_name": sensor_doc["name"],
            "input": input_payload,
            "output": context_data
        })
        
        return ContextAnalysisResponse(
            id=document_id,
            sensor_id=sensor_id,
            **context_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context analysis failed: {str(e)}")

@router.post("/generate", response_model=RecommendationResponse)
async def generate_recommendations(request: RecommendationRequest):
    db = mongodb.get_database()
    sensors_collection = db["sensor_locations"]
    context_collection = db["location_analysis"]
    
    try:
        sensor_doc = await sensors_collection.find_one({"_id": ObjectId(request.sensor_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid sensor_id format")
    
    if not sensor_doc:
        raise HTTPException(status_code=404, detail="Sensor location not found")
    
    sensors = sensor_doc.get("current_sensors", DEFAULT_SENSOR_VALUES)
    location = sensor_doc["location"]
    
    input_payload = {
        "sensors": sensors,
        "farmer": request.farmer.dict(),
        "location": location,
        "start_month": START_MONTH
    }
    
    try:
        existing_context = await context_collection.find_one(
            {"data.sensor_id": request.sensor_id},
            sort=[("timestamp", -1)]
        )
        
        if existing_context and "data" in existing_context:
            context_data = existing_context["data"].get("output")
        else:
            context_prompt = CONTEXT_ANALYSIS_PROMPT.replace(
                "{input_payload}", 
                json.dumps(input_payload, ensure_ascii=False)
            )
            context_prompt = context_prompt.replace("{location}", location)
            
            context_data = call_gemini(context_prompt)
            
            await save_to_mongodb("location_analysis", {
                "sensor_id": request.sensor_id,
                "sensor_name": sensor_doc["name"],
                "input": input_payload,
                "output": context_data
            })
        
        recommendation_prompt = RECOMMENDATION_PROMPT.replace(
            "{context_data}", 
            json.dumps(context_data, ensure_ascii=False, indent=2)
        )
        recommendation_prompt = recommendation_prompt.replace(
            "{input_payload}", 
            json.dumps(input_payload, ensure_ascii=False)
        )
        recommendation_prompt = recommendation_prompt.replace(
            "{start_month}", 
            str(START_MONTH)
        )
        
        ai_response = call_gemini(recommendation_prompt)
        
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
        
        for recommendation in output.get("recommendations", []):
            searchable_name = recommendation.get("searchable_name")
            if searchable_name:
                image_url = await fetch_wikipedia_thumbnail(searchable_name)
                recommendation["image_url"] = image_url
        
        document_id = await save_to_mongodb("crop_recommendations", {
            "sensor_id": request.sensor_id,
            "sensor_name": sensor_doc["name"],
            "input": input_payload,
            "context_data": context_data,
            "output": output
        })
        
        return RecommendationResponse(
            id=document_id,
            sensor_id=request.sensor_id,
            recommendations=output["recommendations"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

@router.delete("/{sensor_id}/context-analysis")
async def delete_context_analysis(sensor_id: str):
    db = mongodb.get_database()
    collection = db["location_analysis"]
    
    try:
        result = await collection.delete_many({"data.sensor_id": sensor_id})
        
        return {
            "message": f"Deleted {result.deleted_count} context analysis records for sensor {sensor_id}",
            "deleted_count": result.deleted_count,
            "collection": "location_analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete context analysis: {str(e)}")

@router.delete("/{sensor_id}/recommendations")
async def delete_recommendations(sensor_id: str):
    db = mongodb.get_database()
    collection = db["crop_recommendations"]
    
    try:
        result = await collection.delete_many({"data.sensor_id": sensor_id})
        
        return {
            "message": f"Deleted {result.deleted_count} recommendation records for sensor {sensor_id}",
            "deleted_count": result.deleted_count,
            "collection": "crop_recommendations"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete recommendations: {str(e)}")

@router.delete("/{sensor_id}/all-data")
async def delete_all_sensor_data(sensor_id: str):
    db = mongodb.get_database()
    
    try:
        context_collection = db["location_analysis"]
        context_result = await context_collection.delete_many({"data.sensor_id": sensor_id})
        
        recommendations_collection = db["crop_recommendations"]
        recommendations_result = await recommendations_collection.delete_many({"data.sensor_id": sensor_id})
        
        total_deleted = context_result.deleted_count + recommendations_result.deleted_count
        
        return {
            "message": f"Deleted all data for sensor {sensor_id}",
            "deleted_counts": {
                "context_analysis": context_result.deleted_count,
                "recommendations": recommendations_result.deleted_count,
                "total": total_deleted
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete sensor data: {str(e)}")

@router.patch("/{recommendation_id}/crops/{crop_index}/planted")
async def toggle_crop_planted(recommendation_id: str, crop_index: int, planted: bool):
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    
    try:
        recommendation_doc = await recommendations_collection.find_one({"_id": ObjectId(recommendation_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid recommendation_id format")
    
    if not recommendation_doc:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    output = recommendation_doc.get("data", {}).get("output", {})
    recommendations = output.get("recommendations", [])
    
    if crop_index < 0 or crop_index >= len(recommendations):
        raise HTTPException(status_code=404, detail="Crop index out of range")
    
    recommendations[crop_index]["planted"] = planted
    
    await recommendations_collection.update_one(
        {"_id": ObjectId(recommendation_id)},
        {"$set": {"data.output.recommendations": recommendations}}
    )
    
    return {
        "message": f"Crop {'marked as planted' if planted else 'unmarked'}",
        "crop": recommendations[crop_index]["crop"],
        "planted": planted
    }

@router.get("/{sensor_id}/history")
async def get_recommendation_history(sensor_id: str):
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    
    try:
        history_cursor = recommendations_collection.find(
            {"data.sensor_id": sensor_id}
        ).sort("timestamp", -1)
        
        history = []
        async for doc in history_cursor:
            output = doc.get("data", {}).get("output", {})
            recommendations = output.get("recommendations", [])
            
            planted_count = sum(1 for rec in recommendations if rec.get("planted", False))
            
            history.append({
                "id": str(doc["_id"]),
                "timestamp": doc["timestamp"],
                "sensor_name": doc.get("data", {}).get("sensor_name", "Unknown"),
                "total_crops": len(recommendations),
                "planted_count": planted_count,
                "farmer_input": doc.get("data", {}).get("input", {}).get("farmer", {})
            })
        
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/history/all")
async def get_all_recommendation_history():
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    sensors_collection = db["sensor_locations"]
    
    try:
        history_cursor = recommendations_collection.find({}).sort("timestamp", -1)
        
        history = []
        async for doc in history_cursor:
            sensor_id = doc.get("data", {}).get("sensor_id")
            output = doc.get("data", {}).get("output", {})
            recommendations = output.get("recommendations", [])
            
            sensor_doc = None
            if sensor_id:
                try:
                    sensor_doc = await sensors_collection.find_one({"_id": ObjectId(sensor_id)})
                except:
                    pass
            
            location = sensor_doc.get("location", "Unknown") if sensor_doc else "Unknown"
            
            planted_count = sum(1 for rec in recommendations if rec.get("planted", False))
            
            history.append({
                "id": str(doc["_id"]),
                "timestamp": doc["timestamp"],
                "sensor_id": sensor_id,
                "sensor_name": doc.get("data", {}).get("sensor_name", "Unknown"),
                "location": location,
                "total_crops": len(recommendations),
                "planted_count": planted_count,
                "farmer_input": doc.get("data", {}).get("input", {}).get("farmer", {})
            })
        
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/session/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation_session(recommendation_id: str):
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    
    try:
        recommendation_doc = await recommendations_collection.find_one({"_id": ObjectId(recommendation_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid recommendation_id format")
    
    if not recommendation_doc or "data" not in recommendation_doc:
        raise HTTPException(status_code=404, detail="Recommendation session not found")
    
    output = recommendation_doc["data"].get("output", {})
    recommendations = output.get("recommendations", [])
    
    if not recommendations:
        raise HTTPException(status_code=404, detail="No recommendations in this session")
    
    sensor_id = recommendation_doc["data"].get("sensor_id", "")
    
    return RecommendationResponse(
        id=str(recommendation_doc["_id"]),
        sensor_id=sensor_id,
        recommendations=recommendations
    )

@router.get("/session/{recommendation_id}/context")
async def get_session_context(recommendation_id: str):
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    
    try:
        recommendation_doc = await recommendations_collection.find_one({"_id": ObjectId(recommendation_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid recommendation_id format: {str(e)}")
    
    if not recommendation_doc:
        raise HTTPException(status_code=404, detail="Recommendation session not found")
    
    if "data" not in recommendation_doc:
        raise HTTPException(status_code=404, detail="Recommendation session has no data")
    
    # Check both possible key names for context data
    # "context_data" is used by manual recommendations
    # "context" is used by hardware auto-recommendations
    context_data = recommendation_doc["data"].get("context_data") or recommendation_doc["data"].get("context", {})
    sensor_name = recommendation_doc["data"].get("sensor_name", "")
    timestamp = recommendation_doc.get("timestamp", "")
    
    if not context_data:
        data_keys = list(recommendation_doc["data"].keys())
        raise HTTPException(status_code=404, detail=f"No context analysis found for this session. Available keys: {data_keys}")
    
    return {
        "id": str(recommendation_doc["_id"]),
        "sensor_name": sensor_name,
        "timestamp": timestamp,
        "context_analysis": context_data
    }

@router.post("/{sensor_id}/chat")
async def chat_with_ai(sensor_id: str, message: dict):
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    
    try:
        user_message = message.get("message", "")
        if not user_message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        latest_recommendation = await recommendations_collection.find_one(
            {"data.sensor_id": sensor_id},
            sort=[("timestamp", -1)]
        )
        
        if not latest_recommendation:
            return {
                "response": None,
                "error": "no_data",
                "message": "No crop recommendation data found for this sensor. Please generate recommendations first.",
                "sensor_id": sensor_id
            }
        
        recommendation_data = latest_recommendation.get("data", {})
        input_data = recommendation_data.get("input", {})
        context_data = recommendation_data.get("context_data", {})
        output_data = recommendation_data.get("output", {})
        recommendations = output_data.get("recommendations", [])
        
        if not context_data:
            return {
                "response": None,
                "error": "no_context",
                "message": "No environmental context data found. Please generate location analysis first.",
                "sensor_id": sensor_id
            }
        
        if not recommendations:
            return {
                "response": None,
                "error": "no_recommendations",
                "message": "No crop recommendations found. Please generate recommendations first.",
                "sensor_id": sensor_id
            }
        
        chat_prompt = CHAT_PROMPT.format(
            user_message=user_message,
            sensor_id=sensor_id,
            location=input_data.get('location', 'Unknown'),
            crop_category=input_data.get('crop_category', 'N/A'),
            budget=f"{input_data.get('budget_php', 0):,.2f}",
            land_size=input_data.get('land_size_ha', 0),
            manpower=input_data.get('manpower', 0),
            waiting_tolerance=input_data.get('waiting_tolerance_days', 0),
            context_data=json.dumps(context_data, indent=2),
            recommendations=json.dumps(recommendations, indent=2)
        )
        
        logger.info(f"Calling Gemini API for chat with sensor {sensor_id}")
        
        import requests
        from app.core.config import GEMINI_API_KEY, GEMINI_MODEL
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{
                    "text": chat_prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 2048,
            }
        }
        
        api_url = f"{url}?key={GEMINI_API_KEY}"
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        if "candidates" not in data or not data["candidates"]:
            raise ValueError("No response from AI")
        
        response_text = data["candidates"][0]["content"]["parts"][0]["text"]
        logger.info(f"Gemini API response received successfully")
        
        return {
            "response": response_text,
            "error": None,
            "sensor_id": sensor_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error for sensor {sensor_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/session/{session_id}/chat")
async def chat_with_session(session_id: str, message: dict):
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    
    try:
        user_message = message.get("message", "")
        user_uid = message.get("user_uid")
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        session_recommendation = await recommendations_collection.find_one(
            {"_id": ObjectId(session_id)}
        )
        
        if not session_recommendation:
            raise HTTPException(status_code=404, detail="Session not found")
        
        recommendation_data = session_recommendation.get("data", {})
        input_data = recommendation_data.get("input", {})
        context_data = recommendation_data.get("context_data", {})
        output_data = recommendation_data.get("output", {})
        recommendations = output_data.get("recommendations", [])
        
        if not context_data or not recommendations:
            return {
                "response": None,
                "error": "no_data",
                "message": "This session has incomplete data. Please use a session with full recommendations."
            }
        
        chat_prompt = CHAT_PROMPT.format(
            user_message=user_message,
            sensor_id=input_data.get('sensor_id', 'Historical Session'),
            location=input_data.get('location', 'Unknown'),
            crop_category=input_data.get('crop_category', 'N/A'),
            budget=f"{input_data.get('budget_php', 0):,.2f}",
            land_size=input_data.get('land_size_ha', 0),
            manpower=input_data.get('manpower', 0),
            waiting_tolerance=input_data.get('waiting_tolerance_days', 0),
            context_data=json.dumps(context_data, indent=2),
            recommendations=json.dumps(recommendations, indent=2)
        )
        
        logger.info(f"Calling Gemini API for chat with session {session_id}")
        
        import requests
        from app.core.config import GEMINI_API_KEY, GEMINI_MODEL
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{
                    "text": chat_prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 2048,
            }
        }
        
        api_url = f"{url}?key={GEMINI_API_KEY}"
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        if "candidates" not in data or not data["candidates"]:
            raise ValueError("No response from AI")
        
        response_text = data["candidates"][0]["content"]["parts"][0]["text"]
        logger.info(f"Gemini API response received successfully")
        
        return {
            "response": response_text,
            "error": None,
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error for session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/hardware/{sensor_id}/readings", response_model=AutoRecommendationResponse)
async def auto_generate_recommendations(sensor_id: str, sensor_data: HardwareSensorData):
    
    try:
        db = mongodb.get_database()
        sensors_collection = db["sensor_locations"]
        
        try:
            sensor_location = await sensors_collection.find_one({"_id": ObjectId(sensor_id)})
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid sensor_id format: {str(e)}")
        
        if not sensor_location:
            raise HTTPException(status_code=404, detail=f"Sensor {sensor_id} not found")
        
        location_string = sensor_location.get("location", "Unknown")
        location_info = {
            "location_name": sensor_location.get("name", "Unknown"),
            "location_string": location_string
        }
        
        logger.info(f"Generating context analysis for hardware sensor {sensor_id}")
        
        context_input = {
            "location": location_info,
            "sensor_data": {
                "soil_moisture_pct": sensor_data.soil_moisture_pct,
                "temperature_c": sensor_data.temperature_c,
                "humidity_pct": sensor_data.humidity_pct,
                "light_lux": sensor_data.light_lux
            },
            "start_month": START_MONTH
        }
        
        context_prompt = CONTEXT_ANALYSIS_PROMPT.format(
            input_payload=json.dumps(context_input, indent=2),
            location=location_string
        )
        
        context_response = call_gemini(context_prompt)
        context_data = context_response  # Already a dict from call_gemini
        
        # Step 3: Generate crop recommendations (8 crops)
        logger.info(f"Generating 8 crop recommendations for hardware sensor {sensor_id}")
        
        recommendation_input = {
            "sensor_data": {
                "soil_moisture_pct": sensor_data.soil_moisture_pct,
                "temperature_c": sensor_data.temperature_c,
                "humidity_pct": sensor_data.humidity_pct,
                "light_lux": sensor_data.light_lux
            },
            "location": location_info,
            "sensor_id": sensor_id
        }
        
        recommendation_prompt = HARDWARE_RECOMMENDATION_PROMPT.format(
            context_data=json.dumps(context_data, indent=2),
            input_payload=json.dumps(recommendation_input, indent=2),
            start_month=START_MONTH
        )
        
        recommendations_response = call_gemini(recommendation_prompt)
        recommendations_json = recommendations_response  # Already a dict from call_gemini
        recommendations = recommendations_json.get("recommendations", [])
        
        if len(recommendations) != 8:
            logger.warning(f"Expected 8 recommendations but got {len(recommendations)}")
        
        for i, rec in enumerate(recommendations):
            rec["is_top_3"] = (i < 3)
            
            searchable_name = rec.get("searchable_name", rec.get("crop"))
            if searchable_name:
                try:
                    thumbnail_url = await fetch_wikipedia_thumbnail(searchable_name)
                    rec["image_url"] = thumbnail_url
                except Exception as img_error:
                    logger.error(f"Failed to fetch image for {searchable_name}: {str(img_error)}")
                    rec["image_url"] = None
        
        logger.info(f"Storing 8 recommendations for hardware sensor {sensor_id}")

        storage_data = {
            "sensor_id": sensor_id,
            "input": {
                "sensor_data": sensor_data.dict(),
                "location": location_info
            },
            "context": context_data,
            "output": {
                "recommendations": recommendations
            }
        }
        
        await save_to_mongodb("crop_recommendations", storage_data)
        
        top_3_crops = [rec["crop"] for rec in recommendations[:3]]
        
        return AutoRecommendationResponse(
            success=True,
            sensor_id=sensor_id,
            top_3_crops=top_3_crops,
            total_crops_generated=len(recommendations),
            message=f"Successfully generated {len(recommendations)} recommendations. Top 3 crops returned."
        )
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error for hardware sensor {sensor_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        logger.error(f"Auto-recommendation error for hardware sensor {sensor_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@router.post("/session/{recommendation_id}/filter", response_model=FilterRecommendationResponse)
async def filter_recommendations(recommendation_id: str, request: FilterRecommendationRequest):
    db = mongodb.get_database()
    recommendations_collection = db["crop_recommendations"]
    context_collection = db["location_analysis"]
    
    user_uid = request.user_uid
    if not user_uid:
        user_uid = generate_user_uid()
    
    try:
        recommendation_doc = await recommendations_collection.find_one({"_id": ObjectId(recommendation_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid recommendation_id format")
    
    if not recommendation_doc:
        raise HTTPException(status_code=404, detail="Recommendation session not found")
    
    output = recommendation_doc.get("data", {}).get("output", {})
    original_recommendations = output.get("recommendations", [])
    
    if not original_recommendations:
        raise HTTPException(status_code=404, detail="No recommendations found in this session")
    
    available_crops = [rec.get("crop") for rec in original_recommendations if rec.get("crop")]
    
    if not available_crops:
        raise HTTPException(status_code=404, detail="No valid crop names found")
    
    context_data = recommendation_doc.get("data", {}).get("context_data") or recommendation_doc.get("data", {}).get("context", {})
    
    if not context_data:
        sensor_id = recommendation_doc.get("data", {}).get("sensor_id")
        if sensor_id:
            existing_context = await context_collection.find_one(
                {"data.sensor_id": sensor_id},
                sort=[("timestamp", -1)]
            )
            if existing_context and "data" in existing_context:
                context_data = existing_context["data"].get("output", {})
    
    farmer_input = request.farmer.dict()
    
    filter_input = {
        "available_crops": available_crops,
        "context_data": json.dumps(context_data) if context_data else "{}",
        "farmer_input": json.dumps(farmer_input)
    }
    
    try:
        prompt = FILTER_RECOMMENDATION_PROMPT.format(**filter_input)
        filter_response = call_gemini(prompt)
        
        filter_json = filter_response
        filter_explanation = filter_json.get("filter_explanation", "Filtered based on your preferences.")
        recommendations = filter_json.get("recommendations", [])
        
        if not recommendations:
            raise HTTPException(status_code=404, detail="No crops matched your criteria")
        
        if len(recommendations) > 5:
            recommendations = recommendations[:5]
        
        # Fetch images for filtered crops
        for rec in recommendations:
            searchable_name = rec.get("searchable_name", rec.get("crop"))
            if searchable_name:
                try:
                    thumbnail_url = await fetch_wikipedia_thumbnail(searchable_name)
                    rec["image_url"] = thumbnail_url
                except Exception as img_error:
                    logger.error(f"Failed to fetch image for {searchable_name}: {str(img_error)}")
                    rec["image_url"] = None
        
        storage_data = {
            "session_id": recommendation_id,
            "user_uid": user_uid,
            "farmer_input": farmer_input,
            "filter_explanation": filter_explanation,
            "available_crops": available_crops,
            "output": {
                "recommendations": recommendations
            }
        }
        
        document_id = await save_to_mongodb("filtered_recommendations", storage_data)
        
        return FilterRecommendationResponse(
            id=document_id,
            session_id=recommendation_id,
            user_uid=user_uid,
            filter_explanation=filter_explanation,
            farmer_input=request.farmer,
            recommendations=recommendations
        )
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error for filter: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        logger.error(f"Filter error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to filter recommendations: {str(e)}")

@router.get("/session/{session_id}/filters")
async def get_filtered_sessions(session_id: str, user_uid: str = None):
    db = mongodb.get_database()
    filtered_collection = db["filtered_recommendations"]
    
    try:
        filtered_sessions = []
        query = {"data.session_id": session_id}
        if user_uid:
            query["data.user_uid"] = user_uid
        
        cursor = filtered_collection.find(query).sort("timestamp", -1)
        
        async for doc in cursor:
            data = doc.get("data", {})
            farmer_input = data.get("farmer_input", {})
            output = data.get("output", {})
            recommendations = output.get("recommendations", [])
            
            filtered_sessions.append({
                "id": str(doc["_id"]),
                "timestamp": doc.get("timestamp"),
                "filter_explanation": data.get("filter_explanation", ""),
                "farmer_input": farmer_input,
                "crop_count": len(recommendations),
                "crops": [rec.get("crop") for rec in recommendations[:3]]  # Preview first 3
            })
        
        return {"session_id": session_id, "filtered_sessions": filtered_sessions}
        
    except Exception as e:
        logger.error(f"Error fetching filtered sessions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch filtered sessions: {str(e)}")

@router.get("/filter/{filter_id}")
async def get_filter_detail(filter_id: str):
    """Get detailed information about a specific filtered recommendation."""
    db = mongodb.get_database()
    filtered_collection = db["filtered_recommendations"]
    
    try:
        filter_doc = await filtered_collection.find_one({"_id": ObjectId(filter_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid filter_id format")
    
    if not filter_doc:
        raise HTTPException(status_code=404, detail="Filtered recommendation not found")
    
    data = filter_doc.get("data", {})
    output = data.get("output", {})
    recommendations = output.get("recommendations", [])
    
    return {
        "id": str(filter_doc["_id"]),
        "session_id": data.get("session_id"),
        "timestamp": filter_doc.get("timestamp"),
        "filter_explanation": data.get("filter_explanation", ""),
        "farmer_input": data.get("farmer_input", {}),
        "recommendations": recommendations
    }

