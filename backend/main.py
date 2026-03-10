import os
import json
import shutil
import io
import asyncio
import numpy as np
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from deepface import DeepFace
from pydantic import BaseModel
from PIL import Image

app = FastAPI()

# --- CORS Setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DIRECTORY & FILE SETUP
# ==========================================
STORAGE_DIR = "storage"
UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")
KNOWN_FACES_DIR = os.path.join(STORAGE_DIR, "known_faces")
THUMBNAILS_DIR = os.path.join(STORAGE_DIR, "thumbnails")

MAPPINGS_FILE = os.path.join(STORAGE_DIR, "photo_mappings.json")
EVENTS_FILE = os.path.join(STORAGE_DIR, "events.json")
USER_PHOTOS_FILE = os.path.join(STORAGE_DIR, "user_photos.json")
EVENT_PHOTOS_FILE = os.path.join(STORAGE_DIR, "event_photos.json")

# Create directories if they don't exist
os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
os.makedirs(THUMBNAILS_DIR, exist_ok=True)

# Mount Static Files
app.mount("/photos", StaticFiles(directory=UPLOADS_DIR), name="photos")
app.mount("/thumbnails", StaticFiles(directory=THUMBNAILS_DIR), name="thumbnails")

# --- Temporary Stores ---
otp_store = {}

# ==========================================
# AUTH & SELFIE ENDPOINTS
# ==========================================
@app.post("/api/auth/send-otp")
async def send_otp(phone: str):
    otp = "123456" 
    otp_store[phone] = otp
    return {"status": "success", "message": "OTP sent successfully"}

@app.post("/api/auth/verify-otp")
async def verify_otp(phone: str, otp: str):
    if phone in otp_store and otp_store[phone] == otp:
        return {"status": "success"}
    raise HTTPException(status_code=400, detail="Invalid OTP")

@app.get("/api/auth/check-user/{phone}")
async def check_user(phone: str):
    user_img_path = os.path.join(KNOWN_FACES_DIR, f"{phone}.jpg")
    return {"exists": os.path.exists(user_img_path)}

@app.post("/api/auth/photographer-login")
async def photographer_login(email: str = Form(...), password: str = Form(...)):
    if email == "admin@eventsnap.com" and password == "asdfghjkl":
        return {"status": "success", "role": "photographer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/auth/verify-selfie")
async def verify_selfie(phone: str = Form(...), selfie: UploadFile = File(...)):
    try:
        file_path = os.path.join(KNOWN_FACES_DIR, f"{phone}.jpg")
        with open(file_path, "wb") as buffer:
            buffer.write(await selfie.read())

        # Extract Embedding using fast VGG-Face
        def scan_face():
            return DeepFace.represent(
                img_path=file_path, 
                model_name="VGG-Face", 
                detector_backend="opencv", 
                enforce_detection=True
            )
            
        embedding_objs = await asyncio.to_thread(scan_face)

        if not embedding_objs:
            os.remove(file_path)
            raise ValueError("No face detected")

        # Save to database/JSON
        mappings = {}
        if os.path.exists(MAPPINGS_FILE):
            with open(MAPPINGS_FILE, "r") as f:
                mappings = json.load(f)
                
        mappings[phone] = embedding_objs[0]["embedding"]
        with open(MAPPINGS_FILE, "w") as f:
            json.dump(mappings, f)

        return {"status": "success", "message": "Face verified instantly!"}
    except Exception as e:
        print(f"Selfie Error: {e}")
        return JSONResponse(status_code=400, content={"message": "Please upload a clear selfie with 1 face."})


# ==========================================
# DYNAMIC EVENTS LOGIC
# ==========================================
class EventModel(BaseModel):
    name: str
    date: str
    clients: int
    photos: int

@app.post("/api/events/create")
async def create_new_event(event: EventModel):
    events = []
    if os.path.exists(EVENTS_FILE):
        with open(EVENTS_FILE, "r") as f:
            events = json.load(f)
            
    new_event = {
        "name": event.name,
        "date": event.date,
        "clients": event.clients,
        "photos": event.photos,
        "thumbnail": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400" 
    }
    events.insert(0, new_event)
    with open(EVENTS_FILE, "w") as f:
        json.dump(events, f)
    return {"status": "success"}

@app.get("/api/photographer/events")
async def get_photographer_events():
    if os.path.exists(EVENTS_FILE):
        with open(EVENTS_FILE, "r") as f:
            return {"events": json.load(f)}
    return {"events": []}


# ==========================================
# BULLETPROOF BACKGROUND AI TASK
# ==========================================
def process_photo_background(file_path: str, filename: str):
    print(f"\n▶️ Background processing started for: {filename}", flush=True)
    
    # 1. Generate Thumbnail
    try:
        img = Image.open(file_path)
        if img.mode in ("RGBA", "P"): img = img.convert("RGB")
        img.thumbnail((400, 400))
        thumb_path = os.path.join(THUMBNAILS_DIR, filename)
        img.save(thumb_path, "JPEG", quality=70)
        print(f"🖼️ Thumbnail created for {filename}", flush=True)
    except Exception as e:
        print(f"⚠️ Thumbnail failed: {e}", flush=True)

    # 2. DeepFace AI Match
    try:
        print(f"🧠 DeepFace Scanning Started: {filename}", flush=True)
        group_faces = DeepFace.represent(
            img_path=file_path,
            model_name="VGG-Face",
            detector_backend="opencv",
            enforce_detection=False
        )

        if not group_faces:
            print(f"⚠️ No faces found in {filename}", flush=True)
            return

        if not os.path.exists(MAPPINGS_FILE): return
        with open(MAPPINGS_FILE, "r") as f:
            known_users = json.load(f)

        user_photos = {}
        if os.path.exists(USER_PHOTOS_FILE):
            with open(USER_PHOTOS_FILE, "r") as f:
                user_photos = json.load(f)

        match_found = False
        for phone, known_embedding in known_users.items():
            for face_obj in group_faces:
                group_embedding = face_obj["embedding"]
                
                # Math Logic (Cosine Similarity)
                a = np.array(known_embedding)
                b = np.array(group_embedding)
                distance = 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

                if distance < 0.40: # Match!
                    print(f"🎉 MATCH! {filename} belongs to {phone} (Dist: {distance:.2f})", flush=True)
                    if phone not in user_photos: user_photos[phone] = []
                    if filename not in user_photos[phone]: user_photos[phone].append(filename)
                    match_found = True
                    break

        if not match_found:
            print(f"ℹ️ No matched users for {filename}", flush=True)

        with open(USER_PHOTOS_FILE, "w") as f:
            json.dump(user_photos, f)
            
        print(f"✅ Scanning FINISHED for: {filename}\n", flush=True)

    except Exception as e:
        print(f"❌ Scan Error for {filename}: {e}\n", flush=True)


# ==========================================
# PHOTOGRAPHER UPLOAD ENDPOINT
# ==========================================
@app.post("/api/photographer/upload")
async def upload_photo(background_tasks: BackgroundTasks, file: UploadFile = File(...), event_name: Optional[str] = Form(None)):
    try:
        print(f"📥 Received Upload: {file.filename} | Event Name: {event_name}", flush=True)
        
        # Save original file (handle duplicate filenames)
        base, ext = os.path.splitext(file.filename)
        final_filename = file.filename
        file_path = os.path.join(UPLOADS_DIR, final_filename)
        counter = 1
        while os.path.exists(file_path):
            final_filename = f"{base}_{counter}{ext}"
            file_path = os.path.join(UPLOADS_DIR, final_filename)
            counter += 1
        
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Link to Event
        if event_name:
            event_name = event_name.strip()
            event_photos = {}
            if os.path.exists(EVENT_PHOTOS_FILE):
                with open(EVENT_PHOTOS_FILE, "r") as f:
                    event_photos = json.load(f)

            if event_name not in event_photos: event_photos[event_name] = []
            if final_filename not in event_photos[event_name]: event_photos[event_name].append(final_filename)

            with open(EVENT_PHOTOS_FILE, "w") as f:
                json.dump(event_photos, f)
            print(f"🔗 Linked '{final_filename}' to Event: '{event_name}'", flush=True)

        # Trigger AI Background Task
        background_tasks.add_task(process_photo_background, file_path, final_filename)

        return {"filename": final_filename, "status": "success"}
    except Exception as e:
        print(f"❌ Upload error: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Upload failed")


# ==========================================
# GET PHOTOS FOR SPECIFIC EVENT
# ==========================================
@app.get("/api/photographer/photos")
async def get_event_photos(event_name: Optional[str] = None):
    if event_name:
        event_name = event_name.strip()
    print(f"🔍 Frontend is asking for photos of Event: '{event_name}'", flush=True)
    if not event_name or not os.path.exists(EVENT_PHOTOS_FILE):
        return {"photos": []}
        
    with open(EVENT_PHOTOS_FILE, "r") as f:
        event_photos = json.load(f)
        
    files = event_photos.get(event_name, [])
    
    photos = []
    for f in files:
        thumb_path = os.path.join(THUMBNAILS_DIR, f)
        thumb_url = f"http://localhost:8000/thumbnails/{f}" if os.path.exists(thumb_path) else f"http://localhost:8000/photos/{f}"
        photos.append({
            "thumbnail": thumb_url,
            "full_url": f"http://localhost:8000/photos/{f}", 
            "filename": f
        })
        
    return {"photos": photos}


# ==========================================
# GET USER'S MATCHED PHOTOS
# ==========================================
@app.get("/api/photos")
async def get_user_photos(phone: str):
    if not os.path.exists(USER_PHOTOS_FILE):
        return {"photos": []}
    
    with open(USER_PHOTOS_FILE, "r") as f:
        user_photos = json.load(f)
        
    matched_files = user_photos.get(phone, [])
    
    photos = []
    for f in matched_files:
        thumb_path = os.path.join(THUMBNAILS_DIR, f)
        thumb_url = f"http://localhost:8000/thumbnails/{f}" if os.path.exists(thumb_path) else f"http://localhost:8000/photos/{f}"
        photos.append({
            "thumbnail": thumb_url,
            "url": f"http://localhost:8000/photos/{f}",
            "filename": f
        })
        
    return {"photos": photos}