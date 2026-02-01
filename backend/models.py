from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone
import uuid

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Monitor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    monitor_type: Literal["https", "socket", "udp"]
    target: str  # URL for https, host:port for socket/udp
    status: Literal["up", "down", "pending"] = "pending"
    last_checked: Optional[datetime] = None
    last_notified: Optional[datetime] = None
    response_time: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # UDP monitoring specific fields
    last_packet_count: Optional[int] = None  # For UDP activity monitoring
    last_activity_time: Optional[datetime] = None  # Last time packet count changed

class MonitorCreate(BaseModel):
    name: str
    monitor_type: Literal["https", "socket", "udp"]
    target: str

class MonitorUpdate(BaseModel):
    name: Optional[str] = None
    monitor_type: Optional[Literal["https", "socket", "udp"]] = None
    target: Optional[str] = None

class MonitorLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    monitor_id: str
    status: Literal["up", "down"]
    response_time: Optional[float] = None
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DashboardStats(BaseModel):
    total_monitors: int
    up_monitors: int
    down_monitors: int
    pending_monitors: int
    recent_logs: list