import os
import json
import shutil
import io
import asyncio
import numpy as np
import time
import csv
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from deepface import DeepFace
from pydantic import BaseModel
from PIL import Image
import cloudinary
import cloudinary.uploader

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
# CLOUDINARY CONFIGURATION
# ==========================================
cloudinary.config(
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "YOUR_CLOUD_NAME"),
    api_key = os.environ.get("CLOUDINARY_API_KEY", "YOUR_API_KEY"),
    api_secret = os.environ.get("CLOUDINARY_API_SECRET", "YOUR_API_SECRET"),
    secure = True
)

def upload_to_cloud(file_path, file_name):
    print(f"☁️ Uploading {file_name} to Cloudinary...", flush=True)
    try:
        result = cloudinary.uploader.upload(
            file_path,
            public_id=f"eventsnap/{os.path.splitext(file_name)[0]}",
            overwrite=True,
            resource_type="image"
        )
        cloud_url = result.get("secure_url")
        print(f"✅ Successfully uploaded to Cloudinary: {cloud_url}", flush=True)
        return cloud_url
    except Exception as e:
        print(f"❌ Cloud Upload Failed: {e}", flush=True)
        return None

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
DRIVE_LINKS_FILE = os.path.join(STORAGE_DIR, "drive_links.json") # Cloud links tracker
LOGIN_LOGS_FILE = os.path.join(STORAGE_DIR, "login_logs.csv")
USERS_REGISTRY_FILE = os.path.join(STORAGE_DIR, "users_registry.json")

# Create directories if they don't exist
os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
os.makedirs(THUMBNAILS_DIR, exist_ok=True)

# Mount Static Files
app.mount("/photos", StaticFiles(directory=UPLOADS_DIR), name="photos")
app.mount("/thumbnails", StaticFiles(directory=THUMBNAILS_DIR), name="thumbnails")
app.mount("/known_faces", StaticFiles(directory=KNOWN_FACES_DIR), name="known_faces")

# --- Temporary Stores ---
otp_store = {}

# ==========================================
# LOGGING & REGISTRY HELPERS
# ==========================================
def log_activity(role: str, identifier: str, action: str, status: str = "success", note: str = ""):
    """Append a row to login_logs.csv for admin tracking."""
    fieldnames = ["timestamp", "role", "identifier", "action", "status", "note"]
    file_exists = os.path.exists(LOGIN_LOGS_FILE)
    with open(LOGIN_LOGS_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "role": role,
            "identifier": identifier,
            "action": action,
            "status": status,
            "note": note,
        })

def upsert_user_registry(phone: str, action: str, profile: dict = None):
    """Keep a live registry of all users with their metadata."""
    registry = {}
    if os.path.exists(USERS_REGISTRY_FILE):
        with open(USERS_REGISTRY_FILE, "r") as f:
            registry = json.load(f)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if phone not in registry:
        registry[phone] = {
            "phone": phone,
            "registered_at": now,
            "last_login": now,
            "login_count": 1,
            "name": "",
            "email": "",
            "city": "",
            "selfie_registered": False,
        }
    else:
        registry[phone]["last_login"] = now
        registry[phone]["login_count"] = registry[phone].get("login_count", 0) + 1
    if action == "selfie_registered":
        registry[phone]["selfie_registered"] = True
        registry[phone]["registered_at"] = now
    if profile:
        registry[phone].update({k: v for k, v in profile.items() if v})
    with open(USERS_REGISTRY_FILE, "w") as f:
        json.dump(registry, f, indent=2)

# ==========================================
# PIPELINE MONITOR - In-Memory Job Tracker
# ==========================================
# Each job: {filename, event_name, status, stages: [{name, status, started_at, completed_at, message}], created_at}
pipeline_jobs = {}  # key = filename

def create_pipeline_job(filename: str, event_name: str):
    pipeline_jobs[filename] = {
        "filename": filename,
        "event_name": event_name or "Unknown",
        "status": "running",  # running | completed | failed
        "created_at": time.time(),
        "stages": [
            {"name": "Upload", "status": "completed", "started_at": time.time(), "completed_at": time.time(), "message": "File saved to server"},
            {"name": "Thumbnail", "status": "queued", "started_at": None, "completed_at": None, "message": ""},
            {"name": "AI Scan", "status": "queued", "started_at": None, "completed_at": None, "message": ""},
            {"name": "Cloud Upload", "status": "queued", "started_at": None, "completed_at": None, "message": ""},
        ]
    }

def update_stage(filename: str, stage_name: str, status: str, message: str = ""):
    if filename not in pipeline_jobs:
        return
    for stage in pipeline_jobs[filename]["stages"]:
        if stage["name"] == stage_name:
            stage["status"] = status
            if status == "running":
                stage["started_at"] = time.time()
            elif status in ("completed", "failed"):
                stage["completed_at"] = time.time()
            stage["message"] = message
            break
    # Update overall job status
    all_stages = pipeline_jobs[filename]["stages"]
    if any(s["status"] == "failed" for s in all_stages):
        pipeline_jobs[filename]["status"] = "failed"
    elif all(s["status"] == "completed" for s in all_stages):
        pipeline_jobs[filename]["status"] = "completed"

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
    exists = os.path.exists(user_img_path)
    if exists:
        # Returning user login
        log_activity("user", phone, "login", "success", "Returning user")
        upsert_user_registry(phone, "login")
    return {"exists": exists}

@app.post("/api/auth/photographer-login")
async def photographer_login(email: str = Form(...), password: str = Form(...)):
    if email == "admin@eventsnap.com" and password == "asdfghjkl":
        log_activity("photographer", email, "login", "success")
        return {"status": "success", "role": "photographer"}
    log_activity("photographer", email, "login", "failed", "Invalid credentials")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/auth/verify-selfie")
async def verify_selfie(phone: str = Form(...), selfie: UploadFile = File(...)):
    try:
        file_path = os.path.join(KNOWN_FACES_DIR, f"{phone}.jpg")
        with open(file_path, "wb") as buffer:
            buffer.write(await selfie.read())

        # Extract Embedding using Facenet512 + retinaface for best quality base embedding
        def scan_face():
            return DeepFace.represent(
                img_path=file_path, 
                model_name="Facenet512", 
                detector_backend="retinaface", 
                enforce_detection=True,
                align=True
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

        print(f"✅ Selfie registered for {phone} (Facenet512 + retinaface)", flush=True)
        log_activity("user", phone, "selfie_registered", "success", "New user face enrolled")
        upsert_user_registry(phone, "selfie_registered")
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

@app.delete("/api/events/{event_name}")
async def delete_event(event_name: str):
    event_name = event_name.strip()
    print(f"🗑️ Deleting event: {event_name}", flush=True)

    # 1. Remove from events list
    if os.path.exists(EVENTS_FILE):
        with open(EVENTS_FILE, "r") as f:
            events = json.load(f)
        events = [e for e in events if e["name"] != event_name]
        with open(EVENTS_FILE, "w") as f:
            json.dump(events, f)

    # 2. Remove associated photos from uploads & thumbnails
    photos_to_delete = []
    if os.path.exists(EVENT_PHOTOS_FILE):
        with open(EVENT_PHOTOS_FILE, "r") as f:
            event_photos = json.load(f)
        photos_to_delete = event_photos.pop(event_name, [])
        with open(EVENT_PHOTOS_FILE, "w") as f:
            json.dump(event_photos, f)

    for filename in photos_to_delete:
        for directory in [UPLOADS_DIR, THUMBNAILS_DIR]:
            path = os.path.join(directory, filename)
            if os.path.exists(path):
                os.remove(path)

    # 3. Remove drive links for those photos
    if photos_to_delete and os.path.exists(DRIVE_LINKS_FILE):
        with open(DRIVE_LINKS_FILE, "r") as f:
            drive_links = json.load(f)
        for filename in photos_to_delete:
            drive_links.pop(filename, None)
        with open(DRIVE_LINKS_FILE, "w") as f:
            json.dump(drive_links, f)

    return {"status": "success", "deleted_photos": len(photos_to_delete)}


# ==========================================
# BULLETPROOF BACKGROUND AI TASK
# ==========================================
def process_photo_background(file_path: str, filename: str):
    print(f"\n▶️ Background processing started for: {filename}", flush=True)
    
    # 1. Generate Thumbnail (for UI display only, NOT for AI scanning)
    update_stage(filename, "Thumbnail", "running")
    try:
        img = Image.open(file_path)
        if img.mode in ("RGBA", "P"): img = img.convert("RGB")
        img.thumbnail((400, 400))
        thumb_path = os.path.join(THUMBNAILS_DIR, filename)
        img.save(thumb_path, "JPEG", quality=70)
        print(f"🖼️ Thumbnail created for {filename}", flush=True)
        update_stage(filename, "Thumbnail", "completed", "Thumbnail generated (400x400)")
    except Exception as e:
        print(f"⚠️ Thumbnail failed: {e}", flush=True)
        update_stage(filename, "Thumbnail", "failed", str(e))

    # 2. Prepare a high-res scan image (max 1600px) for accurate face detection
    scan_path = file_path
    try:
        scan_img = Image.open(file_path)
        if scan_img.mode in ("RGBA", "P"): scan_img = scan_img.convert("RGB")
        max_dim = max(scan_img.size)
        if max_dim > 1600:
            scan_img.thumbnail((1600, 1600))
            scan_path = os.path.join(THUMBNAILS_DIR, f"scan_{filename}")
            scan_img.save(scan_path, "JPEG", quality=90)
    except Exception as e:
        print(f"⚠️ Scan image prep failed, using original: {e}", flush=True)

    # 3. DeepFace AI Match (Scanning HIGH-RES image with retinaface + Facenet512)
    update_stage(filename, "AI Scan", "running")
    try:
        print(f"🧠 DeepFace Scanning Started (Facenet512 + retinaface): {filename}", flush=True)
        group_faces = DeepFace.represent(
            img_path=scan_path,
            model_name="Facenet512",
            detector_backend="retinaface",
            enforce_detection=False,
            align=True
        )

        print(f"👁️ Detected {len(group_faces)} face(s) in {filename}", flush=True)

        match_found = False
        if group_faces and os.path.exists(MAPPINGS_FILE):
            with open(MAPPINGS_FILE, "r") as f:
                known_users = json.load(f)

            user_photos = {}
            if os.path.exists(USER_PHOTOS_FILE):
                with open(USER_PHOTOS_FILE, "r") as f:
                    user_photos = json.load(f)

            for phone, known_embedding in known_users.items():
                a = np.array(known_embedding, dtype=np.float64)
                a_norm = np.linalg.norm(a)
                if a_norm == 0:
                    continue
                best_distance = float('inf')
                for face_obj in group_faces:
                    group_embedding = face_obj["embedding"]
                    b = np.array(group_embedding, dtype=np.float64)
                    b_norm = np.linalg.norm(b)
                    if b_norm == 0:
                        continue
                    
                    # Cosine Distance
                    distance = 1 - np.dot(a, b) / (a_norm * b_norm)
                    best_distance = min(best_distance, distance)

                    if distance < 0.30:  # Strong match
                        print(f"🎉 STRONG MATCH! {filename} -> {phone} (dist: {distance:.4f})", flush=True)
                        if phone not in user_photos: user_photos[phone] = []
                        if filename not in user_photos[phone]: user_photos[phone].append(filename)
                        match_found = True
                        break  # This face matched, move to next user
                    elif distance < 0.45:  # Relaxed match (different angle/lighting)
                        print(f"🟡 SOFT MATCH! {filename} -> {phone} (dist: {distance:.4f})", flush=True)
                        if phone not in user_photos: user_photos[phone] = []
                        if filename not in user_photos[phone]: user_photos[phone].append(filename)
                        match_found = True
                        break

                if best_distance < float('inf'):
                    print(f"   📊 Best distance for {phone}: {best_distance:.4f}", flush=True)

            if match_found:
                with open(USER_PHOTOS_FILE, "w") as f:
                    json.dump(user_photos, f)
                update_stage(filename, "AI Scan", "completed", "Face match found")
            else:
                print(f"ℹ️ No matched users for {filename}", flush=True)
                update_stage(filename, "AI Scan", "completed", "No face matches")

    except Exception as e:
        print(f"❌ Scan Error for {filename}: {e}\n", flush=True)
        update_stage(filename, "AI Scan", "failed", str(e))

    # Cleanup scan image if we created one
    try:
        temp_scan = os.path.join(THUMBNAILS_DIR, f"scan_{filename}")
        if os.path.exists(temp_scan):
            os.remove(temp_scan)
    except:
        pass

    # 3. Cloudinary Upload
    update_stage(filename, "Cloud Upload", "running")
    cloud_link = upload_to_cloud(file_path, filename)
    
    if cloud_link:
        # Save link to JSON
        drive_links = {}
        if os.path.exists(DRIVE_LINKS_FILE):
            with open(DRIVE_LINKS_FILE, "r") as f:
                drive_links = json.load(f)
                
        drive_links[filename] = cloud_link
        with open(DRIVE_LINKS_FILE, "w") as f:
            json.dump(drive_links, f)
            
        print(f"\u2705 Cloud upload done. Local file retained: {filename}\n", flush=True)
        update_stage(filename, "Cloud Upload", "completed", "Uploaded to Cloudinary")
    else:
        update_stage(filename, "Cloud Upload", "failed", "Cloud upload failed")
# ==========================================
# BULK PHOTOGRAPHER UPLOAD ENDPOINT
# ==========================================
@app.post("/api/photographer/upload")
async def upload_photo(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...), event_name: Optional[str] = Form(None)):
    try:
        uploaded_filenames = []
        for file in files:
            # 🌟 Jadu Yahan Hai: Sirf file ka asli naam lo, folder path nahi
            original_filename = os.path.basename(file.filename)
            print(f"📥 Processing: {original_filename} for Event: {event_name}", flush=True)
            
            base, ext = os.path.splitext(original_filename)
            final_filename = original_filename
            file_path = os.path.join(UPLOADS_DIR, final_filename)
            
            # Duplicate handling
            counter = 1
            while os.path.exists(file_path):
                final_filename = f"{base}_{counter}{ext}"
                file_path = os.path.join(UPLOADS_DIR, final_filename)
                counter += 1
            
            # File ko temporary local save karo scan karne ke liye
            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())

            # JSON Database mein entry
            if event_name:
                event_name = event_name.strip()
                event_photos = {}
                if os.path.exists(EVENT_PHOTOS_FILE):
                    with open(EVENT_PHOTOS_FILE, "r") as f:
                        event_photos = json.load(f)

                if event_name not in event_photos: event_photos[event_name] = []
                if final_filename not in event_photos[event_name]: 
                    event_photos[event_name].append(final_filename)

                with open(EVENT_PHOTOS_FILE, "w") as f:
                    json.dump(event_photos, f)

            # Create pipeline job for monitoring
            create_pipeline_job(final_filename, event_name)

            # AI aur Drive upload ko background mein bhejo
            background_tasks.add_task(process_photo_background, file_path, final_filename)
            uploaded_filenames.append(final_filename)

        return {"filenames": uploaded_filenames, "status": "success"}
    except Exception as e:
        print(f"❌ Upload error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))
        
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
        
    # Read Cloud Links
    drive_links = {}
    if os.path.exists(DRIVE_LINKS_FILE):
        with open(DRIVE_LINKS_FILE, "r") as f:
            drive_links = json.load(f)
            
    files = event_photos.get(event_name, [])
    
    photos = []
    for f in files:
        thumb_path = os.path.join(THUMBNAILS_DIR, f)
        thumb_url = f"http://localhost:8000/thumbnails/{f}" if os.path.exists(thumb_path) else f"http://localhost:8000/photos/{f}"
        
        # Original Photo: Cloudinary if available, else local
        full_url = drive_links.get(f, f"http://localhost:8000/photos/{f}")
        
        photos.append({
            "thumbnail": thumb_url,
            "full_url": full_url, 
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
        
    # Read Cloud Links
    drive_links = {}
    if os.path.exists(DRIVE_LINKS_FILE):
        with open(DRIVE_LINKS_FILE, "r") as f:
            drive_links = json.load(f)
            
    matched_files = user_photos.get(phone, [])
    
    photos = []
    for f in matched_files:
        thumb_path = os.path.join(THUMBNAILS_DIR, f)
        thumb_url = f"http://localhost:8000/thumbnails/{f}" if os.path.exists(thumb_path) else f"http://localhost:8000/photos/{f}"
        
        # Original Photo: Cloudinary if available, else local
        full_url = drive_links.get(f, f"http://localhost:8000/photos/{f}")
        
        photos.append({
            "thumbnail": thumb_url,
            "url": full_url,
            "filename": f
        })
        
    return {"photos": photos}


# ==========================================
# PIPELINE MONITOR ENDPOINTS
# ==========================================
@app.get("/api/monitor/jobs")
async def get_pipeline_jobs(event_name: Optional[str] = None):
    jobs = list(pipeline_jobs.values())
    # Sort by most recent first
    jobs.sort(key=lambda j: j["created_at"], reverse=True)
    if event_name:
        jobs = [j for j in jobs if j["event_name"] == event_name.strip()]
    return {"jobs": jobs}

@app.delete("/api/monitor/jobs")
async def clear_pipeline_jobs():
    pipeline_jobs.clear()
    return {"status": "success"}


# ==========================================
# RESCAN ALL PHOTOS FOR A USER (after re-registration or model upgrade)
# ==========================================
@app.post("/api/user/rescan/{phone}")
async def rescan_user_photos(phone: str, background_tasks: BackgroundTasks):
    """Re-scan all uploaded event photos against this user's face embedding."""
    if not os.path.exists(MAPPINGS_FILE):
        raise HTTPException(status_code=400, detail="No face mappings found")
    
    with open(MAPPINGS_FILE, "r") as f:
        mappings = json.load(f)
    
    if phone not in mappings:
        raise HTTPException(status_code=404, detail="User face not registered")
    
    known_embedding = np.array(mappings[phone], dtype=np.float64)
    a_norm = np.linalg.norm(known_embedding)
    
    # Gather all uploaded photos
    all_files = [f for f in os.listdir(UPLOADS_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    
    if not all_files:
        return {"status": "no_photos", "matched": 0}
    
    def rescan_all():
        matched_count = 0
        user_photos = {}
        if os.path.exists(USER_PHOTOS_FILE):
            with open(USER_PHOTOS_FILE, "r") as f:
                user_photos = json.load(f)
        
        # Clear old matches for this user
        user_photos[phone] = []
        
        for filename in all_files:
            file_path = os.path.join(UPLOADS_DIR, filename)
            try:
                # Prepare scan image
                scan_img = Image.open(file_path)
                if scan_img.mode in ("RGBA", "P"): scan_img = scan_img.convert("RGB")
                max_dim = max(scan_img.size)
                scan_path = file_path
                if max_dim > 1600:
                    scan_path = os.path.join(THUMBNAILS_DIR, f"rescan_{filename}")
                    scan_img.thumbnail((1600, 1600))
                    scan_img.save(scan_path, "JPEG", quality=90)
                
                faces = DeepFace.represent(
                    img_path=scan_path,
                    model_name="Facenet512",
                    detector_backend="retinaface",
                    enforce_detection=False,
                    align=True
                )
                
                # Cleanup temp scan
                temp_path = os.path.join(THUMBNAILS_DIR, f"rescan_{filename}")
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
                for face_obj in faces:
                    b = np.array(face_obj["embedding"], dtype=np.float64)
                    b_norm = np.linalg.norm(b)
                    if b_norm == 0:
                        continue
                    distance = 1 - np.dot(known_embedding, b) / (a_norm * b_norm)
                    if distance < 0.45:
                        print(f"🔄 RESCAN MATCH: {filename} -> {phone} (dist: {distance:.4f})", flush=True)
                        if filename not in user_photos[phone]:
                            user_photos[phone].append(filename)
                        matched_count += 1
                        break
                        
            except Exception as e:
                print(f"⚠️ Rescan skip {filename}: {e}", flush=True)
        
        with open(USER_PHOTOS_FILE, "w") as f:
            json.dump(user_photos, f)
        
        print(f"✅ Rescan complete for {phone}: {matched_count}/{len(all_files)} photos matched", flush=True)
    
    background_tasks.add_task(rescan_all)
    return {"status": "rescan_started", "total_photos": len(all_files)}
# USER PROFILE ENDPOINTS
# ==========================================
PROFILES_FILE = os.path.join(STORAGE_DIR, "user_profiles.json")

def load_profiles():
    if os.path.exists(PROFILES_FILE):
        with open(PROFILES_FILE, "r") as f:
            return json.load(f)
    return {}

def save_profiles(profiles):
    with open(PROFILES_FILE, "w") as f:
        json.dump(profiles, f)

@app.get("/api/user/selfie/{phone}")
async def get_user_selfie(phone: str):
    """Serve selfie with no-cache headers so browser always gets the latest."""
    selfie_path = os.path.join(KNOWN_FACES_DIR, f"{phone}.jpg")
    if not os.path.exists(selfie_path):
        raise HTTPException(status_code=404, detail="No selfie found")
    return FileResponse(
        selfie_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
    )

@app.get("/api/user/profile/{phone}")
async def get_user_profile(phone: str):
    profiles = load_profiles()
    profile = profiles.get(phone, {})
    # Use the dynamic no-cache selfie endpoint
    selfie_path = os.path.join(KNOWN_FACES_DIR, f"{phone}.jpg")
    selfie_url = f"http://localhost:8000/api/user/selfie/{phone}" if os.path.exists(selfie_path) else None
    return {
        "phone": phone,
        "name": profile.get("name", ""),
        "email": profile.get("email", ""),
        "city": profile.get("city", ""),
        "selfie_url": selfie_url,
    }

@app.post("/api/user/profile/{phone}")
async def update_user_profile(phone: str, name: str = Form(""), email: str = Form(""), city: str = Form("")):
    profiles = load_profiles()
    profiles[phone] = {"name": name, "email": email, "city": city}
    save_profiles(profiles)
    upsert_user_registry(phone, "profile_updated", {"name": name, "email": email, "city": city})
    return {"status": "success"}