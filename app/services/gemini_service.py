import json
import time
import requests
from typing import Dict, Any
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL, HTTP_TIMEOUT, MAX_RETRIES, RETRY_DELAY

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
            "maxOutputTokens": 8192,
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
            
        except requests.exceptions.HTTPError as e:
            last_error = e
            # Handle rate limiting with longer wait
            if e.response.status_code == 429 and attempt < MAX_RETRIES - 1:
                wait_time = 5 * (attempt + 1)  # 5s, 10s, 15s for rate limits
                print(f"Rate limit hit, waiting {wait_time}s before retry {attempt + 2}/{MAX_RETRIES}...")
                time.sleep(wait_time)
            elif attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (attempt + 1)
                time.sleep(wait_time)
        except json.JSONDecodeError as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (attempt + 1)
                time.sleep(wait_time)
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (attempt + 1)
                time.sleep(wait_time)
    
    raise RuntimeError(f"Failed after {MAX_RETRIES} attempts. Last error: {last_error}")
