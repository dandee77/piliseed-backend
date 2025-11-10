# Load More Recommendations - Implementation Guide

## Overview
Implemented a batch recommendation system that allows users to load additional crop recommendations without getting duplicates. The system now generates 8 initial crops, and users can request more in batches of 8 by clicking "Load More Recommendations".

## How It Works

### Initial Request (Hardware Sensor)
1. Hardware sends sensor data to `/recommendations/hardware/{sensor_id}/readings`
2. Backend generates **8 unique crops** based on sensor conditions
3. Stores recommendations in database linked to sensor_id
4. Returns top 3 crop names to hardware

### Load More Request (Frontend)
1. User clicks "Load More Recommendations" button
2. Frontend extracts all currently displayed crop names
3. Sends sensor data + `already_generated` list to same endpoint
4. Backend generates **8 NEW unique crops** (avoiding duplicates)
5. Appends new crops to the same session
6. Frontend refreshes to show all crops (old + new)

## Backend Changes

### 1. Updated Schema (`app/models/schemas.py`)
```python
class HardwareSensorData(BaseModel):
    soil_moisture_pct: float
    temperature_c: float
    humidity_pct: float
    light_lux: float
    already_generated: Optional[List[str]] = []  # NEW FIELD
```

**Purpose**: Accept list of crop names already generated to avoid duplicates

### 2. Updated Prompt (`app/services/prompts.py`)
```python
HARDWARE_RECOMMENDATION_PROMPT = r"""
...
ALREADY GENERATED CROPS (DO NOT REPEAT THESE):
{already_generated}

Generate detailed crop recommendations...

CRITICAL: Your 8 crops MUST be completely different from the crops listed above!
...
"""
```

**Changes**:
- Added `{already_generated}` placeholder
- Added clear instructions to avoid duplicates
- Changed from "8-12 crops" to "exactly 8 crops" for consistency

### 3. Updated Endpoint (`app/routers/recommendations.py`)
```python
@router.post("/hardware/{sensor_id}/readings", response_model=AutoRecommendationResponse)
async def auto_generate_recommendations(sensor_id: str, sensor_data: HardwareSensorData):
    # Extract already_generated list
    already_generated_crops = sensor_data.already_generated or []
    
    if already_generated_crops and len(already_generated_crops) > 0:
        crops_list = "\n".join([f"- {crop}" for crop in already_generated_crops])
        logger.info(f"Excluding already generated crops: {', '.join(already_generated_crops)}")
    else:
        crops_list = "None yet (this is the first batch)"
    
    # Pass to prompt
    recommendation_prompt = HARDWARE_RECOMMENDATION_PROMPT.format(
        context_data=json.dumps(context_data, indent=2),
        input_payload=json.dumps(recommendation_input, indent=2),
        start_month=START_MONTH,
        already_generated=crops_list  # NEW PARAMETER
    )
    ...
```

**Purpose**: 
- Format already_generated list for Gemini
- Log which crops are being excluded
- Pass formatted list to prompt

## Frontend Changes

### Updated Page (`frontend/src/pages/HistoryDetailPage.tsx`)

#### New State Variables
```typescript
const [sensorData, setSensorData] = useState<SensorData | null>(null);
const [isLoadingMore, setIsLoadingMore] = useState(false);
```

#### Enhanced Session Fetch
```typescript
const fetchSessionDetails = async () => {
  // ... existing code to fetch recommendations ...
  
  // NEW: Fetch sensor's current data for "Load More"
  if (data.sensor_id) {
    try {
      const sensorResponse = await fetch(`${API_BASE_URL}/sensors/${data.sensor_id}`);
      if (sensorResponse.ok) {
        const sensorInfo = await sensorResponse.json();
        setSensorData(sensorInfo.current_sensors);
      }
    } catch (err) {
      console.error('Failed to fetch sensor data:', err);
    }
  }
};
```

#### New Load More Function
```typescript
const handleLoadMore = async () => {
  if (!sensorId || !sensorData) {
    setError('Cannot load more recommendations: sensor data not available');
    return;
  }

  try {
    setIsLoadingMore(true);
    setError(null);

    // Extract already generated crop names
    const alreadyGenerated = recommendations.map(crop => crop.crop);

    // Call hardware endpoint with already_generated list
    const response = await fetch(`${API_BASE_URL}/recommendations/hardware/${sensorId}/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        soil_moisture_pct: sensorData.soil_moisture_pct,
        temperature_c: sensorData.temperature_c,
        humidity_pct: sensorData.humidity_pct,
        light_lux: sensorData.light_lux,
        already_generated: alreadyGenerated,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate more recommendations');
    }

    // Refetch session to show new crops
    await fetchSessionDetails();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load more recommendations');
  } finally {
    setIsLoadingMore(false);
  }
};
```

#### New UI Button
```tsx
{/* Load More Button */}
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onClick={handleLoadMore}
  disabled={isLoadingMore || !sensorData}
  className={`w-full py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all ${
    isLoadingMore || !sensorData
      ? 'bg-gray-300 cursor-not-allowed'
      : 'bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700'
  }`}
>
  {isLoadingMore ? (
    <>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
      />
      <span className="text-white font-semibold">Generating More Crops...</span>
    </>
  ) : (
    <>
      <PlusCircleIcon className="w-6 h-6 text-white" />
      <span className="text-white font-semibold">Load More Recommendations</span>
    </>
  )}
</motion.button>

{!sensorData && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
    <p className="text-amber-800 text-xs text-center">
      Sensor data unavailable. Cannot load more recommendations.
    </p>
  </div>
)}
```

## User Flow

### Scenario 1: Hardware Initial Request
```
1. Hardware sends sensor readings
   POST /recommendations/hardware/{sensor_id}/readings
   Body: { soil_moisture_pct: 28, temperature_c: 26.7, ... }

2. Backend generates 8 crops:
   - Tomato
   - Eggplant
   - Pechay
   - Okra
   - Kangkong
   - Lettuce
   - Cabbage
   - Bell Pepper

3. Hardware receives: ["Tomato", "Eggplant", "Pechay"]
```

### Scenario 2: User Loads More
```
1. User opens session in app, sees 8 crops

2. User clicks "Load More Recommendations"

3. Frontend sends:
   POST /recommendations/hardware/{sensor_id}/readings
   Body: {
     soil_moisture_pct: 28,
     temperature_c: 26.7,
     humidity_pct: 78,
     light_lux: 20000,
     already_generated: [
       "Tomato", "Eggplant", "Pechay", "Okra", 
       "Kangkong", "Lettuce", "Cabbage", "Bell Pepper"
     ]
   }

4. Backend generates 8 NEW crops:
   - Ampalaya
   - Sitaw
   - Mustasa
   - Radish
   - Carrots
   - Chili Pepper
   - Cucumber
   - Squash

5. Frontend refreshes, now shows 16 crops total
```

### Scenario 3: Load Even More
```
1. User clicks "Load More" again

2. Frontend sends all 16 crop names in already_generated

3. Backend generates 8 MORE unique crops:
   - Sweet Potato
   - Ginger
   - Turmeric
   - Basil
   - Parsley
   - Coriander
   - Lemongrass
   - Mint

4. Frontend now shows 24 crops total
```

## Key Features

### 1. **Duplicate Prevention**
- Gemini receives explicit list of crops to avoid
- Clear instructions: "Your 8 crops MUST be completely different"
- Works across unlimited batches

### 2. **Progressive Loading**
- Start with 8 crops (fast initial response)
- Load more only when needed
- No limit on total crops (8, 16, 24, 32, ...)

### 3. **User Experience**
- ✅ Loading indicator while generating
- ✅ Disabled state when sensor data unavailable
- ✅ Error messages for failures
- ✅ Smooth animations with Framer Motion
- ✅ Auto-refresh after new crops generated

### 4. **Backend Efficiency**
- Reuses same endpoint for initial + batch requests
- Single parameter change (`already_generated`)
- Logs excluded crops for debugging

## Testing Checklist

- [ ] Initial hardware request generates 8 crops
- [ ] Click "Load More" generates 8 NEW different crops
- [ ] Click "Load More" again generates 8 MORE different crops
- [ ] All crops are unique (no duplicates across batches)
- [ ] Button shows loading state during generation
- [ ] Button disabled when sensor data unavailable
- [ ] Error message appears if generation fails
- [ ] Frontend refreshes and shows all crops after load more
- [ ] Crops displayed in grid layout (2 columns)
- [ ] Can navigate to individual crop details

## API Endpoint Reference

### POST `/recommendations/hardware/{sensor_id}/readings`

**Request Body:**
```json
{
  "soil_moisture_pct": 28.0,
  "temperature_c": 26.7,
  "humidity_pct": 78.0,
  "light_lux": 20000.0,
  "already_generated": ["Tomato", "Eggplant", "Pechay"]  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "sensor_id": "690775fbd4b2e905b8da38cb",
  "top_3_crops": ["Ampalaya", "Sitaw", "Mustasa"],
  "total_crops_generated": 8,
  "message": "Successfully generated 8 recommendations. Top 3 crops returned."
}
```

### GET `/recommendations/session/{session_id}`

**Response:**
```json
{
  "id": "session_id_here",
  "sensor_id": "690775fbd4b2e905b8da38cb",
  "sensor_name": "Greenhouse Sensor 1",
  "location": "Malolos, Bulacan",
  "recommendations": [
    {
      "crop": "Tomato",
      "category": "Vegetables",
      "scores": { "overall_score": 0.92, ... },
      ...
    },
    // ... 7 more crops initially
    // ... 8 more after first "Load More"
    // ... 8 more after second "Load More"
  ]
}
```

## Benefits

1. **Scalable**: Users can load as many batches as needed
2. **Smart**: Avoids duplicates using AI prompt engineering
3. **Fast**: Initial 8 crops load quickly, more on demand
4. **Clean**: Reuses existing endpoint with one new parameter
5. **User-Friendly**: Clear visual feedback and error handling

## Future Enhancements

1. **Pagination**: Show "Showing 1-8 of 24" counter
2. **Category Filter**: "Load More Vegetables Only"
3. **Favorite Crops**: Mark crops and get similar recommendations
4. **Batch Size Control**: Let user choose 5, 8, or 10 crops per batch
5. **Undo**: Remove last batch if not satisfied
6. **Save Batches**: Name and save different batches separately

---

**Implementation Date**: November 11, 2025  
**Status**: ✅ Completed and Ready for Testing
