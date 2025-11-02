import json
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.models.schemas import (
    ContextAnalysisResponse,
    RecommendationRequest,
    RecommendationResponse,
    SensorData
)
from app.services.gemini_service import call_gemini
from app.services.database_service import save_to_mongodb
from app.services.wikipedia_service import fetch_wikipedia_thumbnail
from app.services.prompts import CONTEXT_ANALYSIS_PROMPT, RECOMMENDATION_PROMPT
from app.core.config import DEFAULT_SENSOR_VALUES, START_MONTH
from app.core.database import mongodb

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

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
        history_cursor = recommendations_collection.find().sort("timestamp", -1)
        
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
    
    return RecommendationResponse(
        id=str(recommendation_doc["_id"]),
        recommendations=recommendations
    )

