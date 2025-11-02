from fastapi import APIRouter, HTTPException
from app.models.schemas import UserCreate, UserResponse
from app.core.database import mongodb
from datetime import datetime
import uuid

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    """
    Register a new user or return existing user with matching first and last name.
    Generates a unique user_id (UID) for new users.
    """
    try:
        db = mongodb.get_database()
        
        # Check if user with same first_name and last_name already exists
        existing_user = await db.users.find_one({
            "first_name": user.first_name,
            "last_name": user.last_name
        })
        
        if existing_user:
            # Return existing user
            existing_user.pop('_id', None)
            return UserResponse(**existing_user)
        
        # Generate unique user_id for new user
        user_id = str(uuid.uuid4())
        
        # Create user document
        user_doc = {
            "user_id": user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "created_at": datetime.utcnow()
        }
        
        # Insert into database
        await db.users.insert_one(user_doc)
        
        return UserResponse(**user_doc)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register user: {str(e)}")

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """
    Get user information by user_id.
    """
    try:
        db = mongodb.get_database()
        user = await db.users.find_one({"user_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove MongoDB's _id field
        user.pop('_id', None)
        
        return UserResponse(**user)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(e)}")
