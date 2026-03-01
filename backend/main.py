from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from pydantic import BaseModel
import os
import csv
from datetime import datetime, timedelta
from PIL import Image
from PIL.ExifTags import TAGS
import io

app = FastAPI()

# --- Configuration & Paths ---
LOG_FILE = "storage/login_logs.csv"
EVENT_SHEET = "storage/events_record.csv"
STORAGE_BASE = "storage/events"

# --- Request Models (Zaroori hain 404 error bachane ke liye) ---
class PhoneRequest(BaseModel):
    phone: str

class VerifyRequest(BaseModel):
    phone: str
    otp: str

# --- Helper 1: CSV Logging ---
def log_to_csv(file_path, data_row, headers):
    file_exists = os.path.isfile(file_path)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, mode='a', newline='') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(headers)
        writer.writerow(data_row)

# --- Helper 2: Data Science Metadata Extractor ---
def get_image_creation_date(img: Image.Image):
    try:
        exif_data = img._getexif()
        if not exif_data:
            return None # WhatsApp ya compressed photos ke liye
        
        for tag, value in exif_data.items():
            decoded = TAGS.get(tag, tag)
            if decoded == "DateTimeOriginal":
                # Convert string "YYYY:MM:DD HH:MM:SS" to Python datetime object
                return datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
    except Exception:
        return None
    return None

# ==========================================
#               API ENDPOINTS
# ==========================================

# --- 1. Request OTP ---
@app.post("/api/auth/request-otp")
async def request_otp(request: PhoneRequest):
    return {"status": "success", "message": f"OTP sent to {request.phone}"}

# --- 2. Verify OTP ---
@app.post("/api/auth/verify-otp")
async def verify_otp(request: VerifyRequest):
    if request.otp == "230786": 
        return {"status": "success", "token": "dummy_token_123"}
    raise HTTPException(status_code=400, detail="Invalid OTP")

# --- 3. Create Event ---
@app.post("/api/events/create")
async def create_event(event_name: str, created_by: str = "Admin"):
    safe_name = event_name.strip().replace(" ", "_").lower()
    folder_path = os.path.join(STORAGE_BASE, safe_name)
    
    if os.path.exists(folder_path):
        raise HTTPException(status_code=400, detail="Event already exists")
    
    os.makedirs(folder_path, exist_ok=True)
    log_event_data = [datetime.now().strftime("%Y-%m-%d %H:%M:%S"), event_name, folder_path, created_by]
    log_to_csv(EVENT_SHEET, log_event_data, ["Timestamp", "Event Name", "Path", "Created By"])
    
    return {"status": "success", "folder": safe_name}

# --- 4. Verify Selfie (The AI Pre-processing Step) ---
@app.post("/api/auth/verify-selfie")
async def verify_selfie(selfie: UploadFile = File(...)):
    contents = await selfie.read()
    img = Image.open(io.BytesIO(contents))
    width, height = img.size
    
    # Rule 1: Aspect Ratio (Passport Size check)
    if width > height:
        log_to_csv(LOG_FILE, [datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Unknown", "FAILED", "Landscape photo rejected"], ["Timestamp", "User", "Status", "Message"])
        raise HTTPException(status_code=400, detail="Please upload a Portrait/Passport style photo.")

    # Rule 2: 5-Day Data Validation (EXIF Check)
    creation_date = get_image_creation_date(img)
    if creation_date:
        age_in_days = (datetime.now() - creation_date).days
        if age_in_days > 5:
            log_to_csv(LOG_FILE, [datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Unknown", "FAILED", f"Photo is {age_in_days} days old"], ["Timestamp", "User", "Status", "Message"])
            raise HTTPException(status_code=400, detail=f"Photo is too old ({age_in_days} days). Must be taken within the last 5 days.")
    else:
        # Edge Case: Metadata missing (e.g. WhatsApp forward)
        # As a Data Scientist, we allow it but log a warning to keep our dataset clean.
        log_to_csv(LOG_FILE, [datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "TestUser", "WARNING", "No metadata, but accepted"], ["Timestamp", "User", "Status", "Message"])

    # Success Logging
    log_to_csv(LOG_FILE, [datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "TestUser", "SUCCESS", "Photo validated"], ["Timestamp", "User", "Status", "Message"])
    
    return {"status": "success", "message": "Photo rules passed & logged"}