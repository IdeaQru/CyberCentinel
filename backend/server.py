from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from models import (
    User, UserCreate, UserLogin, Token,
    Monitor, MonitorCreate, MonitorUpdate,
    MonitorLog, DashboardStats
)
from auth import hash_password, verify_password, create_access_token, get_current_user
from monitoring_service import run_monitoring_cycle, check_monitor

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Cyber-Sentinel Monitoring API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Scheduler for background monitoring
scheduler = AsyncIOScheduler()

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user['id']})
    return Token(access_token=access_token)

@api_router.get("/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Monitor Routes
@api_router.post("/monitors", response_model=Monitor)
async def create_monitor(monitor_data: MonitorCreate, user_id: str = Depends(get_current_user)):
    monitor = Monitor(
        user_id=user_id,
        name=monitor_data.name,
        monitor_type=monitor_data.monitor_type,
        target=monitor_data.target
    )
    
    monitor_dict = monitor.model_dump()
    monitor_dict['created_at'] = monitor_dict['created_at'].isoformat()
    monitor_dict['last_checked'] = None
    monitor_dict['last_notified'] = None
    
    await db.monitors.insert_one(monitor_dict)
    
    # Trigger immediate check
    await check_monitor(monitor_dict)
    
    return monitor

@api_router.get("/monitors", response_model=List[Monitor])
async def get_monitors(user_id: str = Depends(get_current_user)):
    monitors = await db.monitors.find({"user_id": user_id}, {"_id": 0}).to_list(None)
    
    # Convert ISO strings back to datetime objects
    for monitor in monitors:
        if monitor.get('created_at') and isinstance(monitor['created_at'], str):
            monitor['created_at'] = datetime.fromisoformat(monitor['created_at'])
        if monitor.get('last_checked') and isinstance(monitor['last_checked'], str):
            monitor['last_checked'] = datetime.fromisoformat(monitor['last_checked'])
        if monitor.get('last_notified') and isinstance(monitor['last_notified'], str):
            monitor['last_notified'] = datetime.fromisoformat(monitor['last_notified'])
    
    return monitors

@api_router.get("/monitors/{monitor_id}", response_model=Monitor)
async def get_monitor(monitor_id: str, user_id: str = Depends(get_current_user)):
    monitor = await db.monitors.find_one({"id": monitor_id, "user_id": user_id}, {"_id": 0})
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Convert ISO strings
    if monitor.get('created_at') and isinstance(monitor['created_at'], str):
        monitor['created_at'] = datetime.fromisoformat(monitor['created_at'])
    if monitor.get('last_checked') and isinstance(monitor['last_checked'], str):
        monitor['last_checked'] = datetime.fromisoformat(monitor['last_checked'])
    if monitor.get('last_notified') and isinstance(monitor['last_notified'], str):
        monitor['last_notified'] = datetime.fromisoformat(monitor['last_notified'])
    
    return monitor

@api_router.put("/monitors/{monitor_id}", response_model=Monitor)
async def update_monitor(monitor_id: str, monitor_data: MonitorUpdate, user_id: str = Depends(get_current_user)):
    # Check if monitor exists and belongs to user
    existing = await db.monitors.find_one({"id": monitor_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Update only provided fields
    update_data = monitor_data.model_dump(exclude_unset=True)
    if update_data:
        await db.monitors.update_one(
            {"id": monitor_id},
            {"$set": update_data}
        )
    
    # Get updated monitor
    updated = await db.monitors.find_one({"id": monitor_id}, {"_id": 0})
    
    # Convert ISO strings
    if updated.get('created_at') and isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('last_checked') and isinstance(updated['last_checked'], str):
        updated['last_checked'] = datetime.fromisoformat(updated['last_checked'])
    if updated.get('last_notified') and isinstance(updated['last_notified'], str):
        updated['last_notified'] = datetime.fromisoformat(updated['last_notified'])
    
    return updated

@api_router.delete("/monitors/{monitor_id}")
async def delete_monitor(monitor_id: str, user_id: str = Depends(get_current_user)):
    result = await db.monitors.delete_one({"id": monitor_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Also delete associated logs
    await db.monitor_logs.delete_many({"monitor_id": monitor_id})
    
    return {"message": "Monitor deleted successfully"}

# Dashboard & Stats
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    monitors = await db.monitors.find({"user_id": user_id}, {"_id": 0}).to_list(None)
    
    total = len(monitors)
    up = sum(1 for m in monitors if m.get('status') == 'up')
    down = sum(1 for m in monitors if m.get('status') == 'down')
    pending = sum(1 for m in monitors if m.get('status') == 'pending')
    
    # Get recent logs (last 50)
    recent_logs = await db.monitor_logs.find(
        {"monitor_id": {"$in": [m['id'] for m in monitors]}},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    # Convert timestamps
    for log in recent_logs:
        if log.get('timestamp') and isinstance(log['timestamp'], str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return DashboardStats(
        total_monitors=total,
        up_monitors=up,
        down_monitors=down,
        pending_monitors=pending,
        recent_logs=recent_logs
    )

# Logs Routes
@api_router.get("/monitors/{monitor_id}/logs", response_model=List[MonitorLog])
async def get_monitor_logs(monitor_id: str, limit: int = 100, user_id: str = Depends(get_current_user)):
    # Verify monitor belongs to user
    monitor = await db.monitors.find_one({"id": monitor_id, "user_id": user_id}, {"_id": 0})
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    logs = await db.monitor_logs.find(
        {"monitor_id": monitor_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Convert timestamps
    for log in logs:
        if log.get('timestamp') and isinstance(log['timestamp'], str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

@api_router.get("/logs", response_model=List[MonitorLog])
async def get_all_logs(limit: int = 100, user_id: str = Depends(get_current_user)):
    # Get all user's monitors
    monitors = await db.monitors.find({"user_id": user_id}, {"_id": 0}).to_list(None)
    monitor_ids = [m['id'] for m in monitors]
    
    logs = await db.monitor_logs.find(
        {"monitor_id": {"$in": monitor_ids}},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Convert timestamps
    for log in logs:
        if log.get('timestamp') and isinstance(log['timestamp'], str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

# Manual trigger check
@api_router.post("/monitors/{monitor_id}/check")
async def manual_check(monitor_id: str, user_id: str = Depends(get_current_user)):
    monitor = await db.monitors.find_one({"id": monitor_id, "user_id": user_id}, {"_id": 0})
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    await check_monitor(monitor)
    
    # Get updated monitor
    updated = await db.monitors.find_one({"id": monitor_id}, {"_id": 0})
    return {"message": "Check completed", "status": updated.get('status')}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Cyber-Sentinel Monitoring System...")
    
    # Schedule monitoring job to run every 30 minutes
    scheduler.add_job(
        run_monitoring_cycle,
        trigger=IntervalTrigger(minutes=30),
        id='monitoring_job',
        name='Monitor all targets',
        replace_existing=True
    )
    scheduler.start()
    logger.info("Monitoring scheduler started (30-minute interval)")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    client.close()
    logger.info("Application shutdown complete")