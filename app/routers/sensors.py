from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from app.models.schemas import SensorData, SensorUpdateResponse, SensorLocation, SensorLocationResponse
from app.core.config import DEFAULT_SENSOR_VALUES
from app.core.database import mongodb

router = APIRouter(prefix="/sensors", tags=["sensors"])

@router.post("/locations", response_model=SensorLocationResponse)
async def create_sensor_location(location: SensorLocation):
    db = mongodb.get_database()
    sensors_collection = db["sensor_locations"]
    
    sensor_document = {
        "name": location.name,
        "location": location.location,
        "description": location.description,
        "created_at": datetime.utcnow(),
        "last_updated": None,
        "current_sensors": DEFAULT_SENSOR_VALUES
    }
    
    result = await sensors_collection.insert_one(sensor_document)
    sensor_id = str(result.inserted_id)
    
    return SensorLocationResponse(
        sensor_id=sensor_id,
        name=location.name,
        location=location.location,
        description=location.description,
        created_at=sensor_document["created_at"],
        last_updated=None,
        current_sensors=SensorData(**DEFAULT_SENSOR_VALUES)
    )

@router.get("/locations", response_model=List[SensorLocationResponse])
async def get_all_sensor_locations():
    db = mongodb.get_database()
    sensors_collection = db["sensor_locations"]
    
    cursor = sensors_collection.find()
    locations = []
    
    async for doc in cursor:
        locations.append(SensorLocationResponse(
            sensor_id=str(doc["_id"]),
            name=doc["name"],
            location=doc["location"],
            description=doc.get("description"),
            created_at=doc["created_at"],
            last_updated=doc.get("last_updated"),
            current_sensors=SensorData(**doc["current_sensors"]) if doc.get("current_sensors") else None
        ))
    
    return locations

@router.get("/locations/{sensor_id}", response_model=SensorLocationResponse)
async def get_sensor_location(sensor_id: str):
    db = mongodb.get_database()
    sensors_collection = db["sensor_locations"]
    
    from bson import ObjectId
    try:
        doc = await sensors_collection.find_one({"_id": ObjectId(sensor_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid sensor_id format")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Sensor location not found")
    
    return SensorLocationResponse(
        sensor_id=str(doc["_id"]),
        name=doc["name"],
        location=doc["location"],
        description=doc.get("description"),
        created_at=doc["created_at"],
        last_updated=doc.get("last_updated"),
        current_sensors=SensorData(**doc["current_sensors"]) if doc.get("current_sensors") else None
    )

@router.put("/locations/{sensor_id}/update", response_model=SensorUpdateResponse)
async def update_sensor_data(sensor_id: str, sensors: SensorData):
    db = mongodb.get_database()
    sensors_collection = db["sensor_locations"]
    
    from bson import ObjectId
    try:
        result = await sensors_collection.update_one(
            {"_id": ObjectId(sensor_id)},
            {
                "$set": {
                    "current_sensors": sensors.dict(),
                    "last_updated": datetime.utcnow()
                }
            }
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid sensor_id format")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sensor location not found")
    
    return SensorUpdateResponse(
        message=f"Sensor data updated successfully for sensor {sensor_id}",
        sensors=sensors
    )

@router.get("/locations/{sensor_id}/current", response_model=SensorData)
async def get_current_sensor_data(sensor_id: str):
    db = mongodb.get_database()
    sensors_collection = db["sensor_locations"]
    
    from bson import ObjectId
    try:
        doc = await sensors_collection.find_one({"_id": ObjectId(sensor_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid sensor_id format")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Sensor location not found")
    
    return SensorData(**doc.get("current_sensors", DEFAULT_SENSOR_VALUES))

