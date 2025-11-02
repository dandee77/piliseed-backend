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
from app.services.prompts import CONTEXT_ANALYSIS_PROMPT, RECOMMENDATION_PROMPT
from app.core.config import DEFAULT_SENSOR_VALUES, START_MONTH
from app.core.database import mongodb

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/{sensor_id}/context-analysis", response_model=ContextAnalysisResponse)
async def analyze_context(sensor_id: str, refresh: bool = False):
    db = mongodb.get_database()
    sensors_collection = db["sensor_locations"]
    context_collection = db[f"sensor_{sensor_id}_context_analysis"]
    
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
        
        document_id = await save_to_mongodb(f"sensor_{sensor_id}_context_analysis", {
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
        context_prompt = CONTEXT_ANALYSIS_PROMPT.replace(
            "{input_payload}", 
            json.dumps(input_payload, ensure_ascii=False)
        )
        context_prompt = context_prompt.replace("{location}", location)
        
        context_data = call_gemini(context_prompt)
        
        await save_to_mongodb(f"sensor_{request.sensor_id}_context_analysis", {
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
        
        document_id = await save_to_mongodb(f"sensor_{request.sensor_id}_crop_recommendations", {
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
    collection_name = f"sensor_{sensor_id}_context_analysis"
    
    try:
        collection = db[collection_name]
        result = await collection.delete_many({"data.sensor_id": sensor_id})
        
        return {
            "message": f"Deleted {result.deleted_count} context analysis records for sensor {sensor_id}",
            "deleted_count": result.deleted_count,
            "collection": collection_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete context analysis: {str(e)}")

@router.delete("/{sensor_id}/recommendations")
async def delete_recommendations(sensor_id: str):
    db = mongodb.get_database()
    collection_name = f"sensor_{sensor_id}_crop_recommendations"
    
    try:
        collection = db[collection_name]
        result = await collection.delete_many({"data.sensor_id": sensor_id})
        
        return {
            "message": f"Deleted {result.deleted_count} recommendation records for sensor {sensor_id}",
            "deleted_count": result.deleted_count,
            "collection": collection_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete recommendations: {str(e)}")

@router.delete("/{sensor_id}/all-data")
async def delete_all_sensor_data(sensor_id: str):
    db = mongodb.get_database()
    
    try:
        context_collection = db[f"sensor_{sensor_id}_context_analysis"]
        context_result = await context_collection.delete_many({"data.sensor_id": sensor_id})
        
        recommendations_collection = db[f"sensor_{sensor_id}_crop_recommendations"]
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
