"""
Test script for the new hardware-driven recommendation endpoint
"""
import requests
import json

# Test data
SENSOR_ID = "6906f1bf5b521c6a2c1319b0"
BASE_URL = "http://localhost:8000"

# Sample sensor data from hardware
sensor_data = {
    "soil_moisture_pct": 45.5,
    "temperature_c": 28.3,
    "humidity_pct": 72.0,
    "light_lux": 15000.0
}

def test_hardware_endpoint():
    """Test the new POST /recommendations/hardware/{sensor_id}/readings endpoint"""
    
    url = f"{BASE_URL}/recommendations/hardware/{SENSOR_ID}/readings"
    
    print(f"Testing endpoint: {url}")
    print(f"Sensor data: {json.dumps(sensor_data, indent=2)}")
    print("\nSending request...\n")
    
    try:
        response = requests.post(url, json=sensor_data, timeout=120)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS!")
            print(f"Top 3 Crops: {', '.join(data['top_3_crops'])}")
            print(f"Total crops generated: {data['total_crops_generated']}")
            print(f"Message: {data['message']}")
        else:
            print("\n❌ FAILED!")
            print(f"Error: {response.json().get('detail', 'Unknown error')}")
            
    except requests.exceptions.Timeout:
        print("\n⏱️ Request timed out (AI processing can take time)")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("HARDWARE ENDPOINT TEST")
    print("=" * 60)
    test_hardware_endpoint()
    print("=" * 60)
