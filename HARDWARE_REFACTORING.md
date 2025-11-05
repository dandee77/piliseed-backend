# System Refactoring: Hardware-Driven Recommendations

## Overview
The system has been refactored to support a new hardware-driven workflow where IoT sensors automatically trigger crop recommendations without requiring farmer input.

## Architecture Changes

### Previous Flow (User-Driven)
1. User fills out FarmerForm (budget, land size, manpower, waiting tolerance, crop category)
2. System generates context analysis
3. System generates recommendations based on farmer constraints
4. Recommendations stored and displayed

### New Flow (Hardware-Driven)
1. **Hardware device POSTs sensor readings** (4 values only)
2. System automatically generates context analysis
3. System generates **exactly 8 crop recommendations**
4. System marks **top 3 crops** with `is_top_3 = True`
5. All 8 crops stored in database
6. **Returns only top 3 crop names** to hardware

---

## New Endpoint

### `POST /recommendations/hardware/{sensor_id}/readings`

**Purpose**: Hardware devices send sensor data to automatically trigger recommendations

**Request Body** (`HardwareSensorData`):
```json
{
  "soil_moisture_pct": 45.5,
  "temperature_c": 28.3,
  "humidity_pct": 72.0,
  "light_lux": 15000.0
}
```

**Response** (`AutoRecommendationResponse`):
```json
{
  "success": true,
  "sensor_id": "SENSOR001",
  "top_3_crops": [
    "Lettuce - Black Seeded Simpson",
    "Pechay - Chinese Cabbage",
    "Mustasa - Green Wave"
  ],
  "total_crops_generated": 8,
  "message": "Successfully generated 8 recommendations. Top 3 crops returned."
}
```

**Process**:
1. Validates sensor exists in `sensor_locations` collection
2. Generates context analysis using sensor data + location
3. Generates exactly 8 crop recommendations using `HARDWARE_RECOMMENDATION_PROMPT`
4. Marks top 3 with `is_top_3 = True`
5. Fetches Wikipedia thumbnails for all crops
6. Stores all 8 recommendations with `user_id = "hardware_{sensor_id}"`
7. Returns only top 3 crop names (lightweight response for hardware)

---

## Schema Changes

### Added: `HardwareSensorData`
```python
class HardwareSensorData(BaseModel):
    soil_moisture_pct: float
    temperature_c: float
    humidity_pct: float
    light_lux: float
```

### Added: `AutoRecommendationResponse`
```python
class AutoRecommendationResponse(BaseModel):
    success: bool
    sensor_id: str
    top_3_crops: List[str]  # Only crop names
    total_crops_generated: int
    message: str
```

### Modified: `CropRecommendation`
Added new field:
```python
is_top_3: bool = False  # Marks if this is in top 3 recommendations
```

---

## New Prompt

### `HARDWARE_RECOMMENDATION_PROMPT`

**Key Differences from `RECOMMENDATION_PROMPT`**:
1. ❌ No farmer budget constraint
2. ❌ No land size scaling (uses 1 hectare baseline)
3. ❌ No manpower consideration
4. ❌ No waiting tolerance filter
5. ✅ Must return **exactly 8 crops**
6. ✅ Focuses solely on sensor compatibility (temp, moisture, light, humidity)
7. ✅ Lower confidence scores (60-75%) due to basic sensors only
8. ✅ Emphasizes current environmental conditions

---

## Database Structure

### Storage Format (MongoDB `crop_recommendations` collection)
```json
{
  "_id": ObjectId("..."),
  "timestamp": ISODate("2025-01-15T10:30:00Z"),
  "data": {
    "user_id": "hardware_SENSOR001",
    "sensor_id": "SENSOR001",
    "input": {
      "sensor_data": {
        "soil_moisture_pct": 45.5,
        "temperature_c": 28.3,
        "humidity_pct": 72.0,
        "light_lux": 15000.0
      },
      "location": {
        "latitude": 14.5995,
        "longitude": 120.9842,
        "location_name": "Manila"
      }
    },
    "context": { /* Full context analysis */ },
    "output": {
      "recommendations": [
        {
          "crop": "Lettuce - Black Seeded Simpson",
          "is_top_3": true,
          "scores": { /* ... */ },
          /* ... all other fields ... */
        },
        /* ... 7 more crops (3 with is_top_3=true, 5 with is_top_3=false) ... */
      ]
    }
  }
}
```

---

## Testing

### Test Script
Run `test_hardware_endpoint.py` to test the new endpoint:

```bash
python test_hardware_endpoint.py
```

### Manual Testing with cURL
```bash
curl -X POST "http://localhost:8000/recommendations/hardware/SENSOR001/readings" \
  -H "Content-Type: application/json" \
  -d "{
    \"soil_moisture_pct\": 45.5,
    \"temperature_c\": 28.3,
    \"humidity_pct\": 72.0,
    \"light_lux\": 15000.0
  }"
```

---

## Impact on Existing Features

### ✅ No Breaking Changes
- Old user-driven flow (`/generate`) still works
- Chat feature still works
- History pages still work
- All existing endpoints unchanged

### 🆕 New Features
- Hardware devices can now POST sensor data
- Automatic recommendation generation
- Top 3 marking in database
- Lightweight hardware responses (just crop names)

### 📊 Frontend Considerations
- History page can now display `is_top_3` badge on crops
- Can filter/sort by top 3 crops
- Hardware-generated recommendations have `user_id = "hardware_{sensor_id}"`

---

## API Summary

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `/recommendations/generate` | POST | User-driven (with farmer form) | `RecommendationRequest` | Full recommendations |
| `/recommendations/hardware/{sensor_id}/readings` | POST | **Hardware-driven (sensor only)** | `HardwareSensorData` | Top 3 crop names only |
| `/recommendations/{sensor_id}/latest` | GET | Get latest recommendations | Query params | Full recommendations |
| `/recommendations/context-analysis` | POST | Generate context only | Sensor + location | Context analysis |
| `/recommendations/chat` | POST | AI chatbot | Question + sensor | AI response |
| `/recommendations/history/all` | GET | Get all history | `user_id` | All recommendations |

---

## Hardware Integration Example

### Arduino/ESP32 Code (Pseudo)
```cpp
void sendSensorData() {
  float moisture = readSoilMoisture();
  float temp = readTemperature();
  float humidity = readHumidity();
  float light = readLightLevel();
  
  String json = "{";
  json += "\"soil_moisture_pct\":" + String(moisture) + ",";
  json += "\"temperature_c\":" + String(temp) + ",";
  json += "\"humidity_pct\":" + String(humidity) + ",";
  json += "\"light_lux\":" + String(light);
  json += "}";
  
  HTTPClient http;
  http.begin("http://api.piliseed.com/recommendations/hardware/SENSOR001/readings");
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(json);
  
  if (httpCode == 200) {
    String response = http.getString();
    // Parse top_3_crops from response
    // Display on LCD/OLED screen
  }
  
  http.end();
}
```

---

## Benefits

### For Hardware
- ✅ Lightweight request (only 4 sensor values)
- ✅ Lightweight response (only 3 crop names)
- ✅ No need to handle complex farmer input
- ✅ Fully automated workflow

### For System
- ✅ Separates hardware flow from user flow
- ✅ Maintains data quality (8 crops always stored)
- ✅ Top 3 marking enables better UI/UX
- ✅ Hardware requests don't mix with user requests (`hardware_*` user_id)

### For Farmers
- ✅ Get immediate crop suggestions on hardware display
- ✅ Can still access full web interface for detailed analysis
- ✅ History shows which crops were top 3 recommendations

---

## Future Enhancements

1. **Webhook/Callback**: Allow hardware to register webhook URL for async responses
2. **Batch Processing**: Accept multiple sensor readings in one request
3. **Confidence Threshold**: Only return top 3 if confidence > X%
4. **Scheduled Updates**: Auto-generate recommendations every N hours
5. **Hardware Dashboard**: Admin panel to monitor all hardware sensors
6. **OTA Updates**: Push configuration changes to hardware devices

---

## Migration Notes

### No Database Migration Required
- `is_top_3` field defaults to `False` for existing records
- Old recommendations without `is_top_3` are treated as non-top-3

### Frontend Updates (Optional)
To display top 3 badges in History page:
```tsx
{crop.is_top_3 && (
  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
    TOP 3
  </span>
)}
```

---

## Conclusion

The system now supports **two complementary workflows**:

1. **User-Driven**: Full control with farmer input, detailed constraints
2. **Hardware-Driven**: Fully automated, sensor-only, lightweight responses

Both workflows coexist without conflicts and serve different use cases effectively.
