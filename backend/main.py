from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from deepface import DeepFace
import os
import shutil
import json 

app = FastAPI()

# --- CORS Setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Directory Setup ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
PHOTOS_DIR = os.path.join(STORAGE_DIR, "uploads")
KNOWN_FACES_DIR = os.path.join(STORAGE_DIR, "known_faces")

for path in [PHOTOS_DIR, KNOWN_FACES_DIR]:
    os.makedirs(path, exist_ok=True)

app.mount("/photos", StaticFiles(directory=PHOTOS_DIR), name="photos")

# --- Temporary Stores & Credentials ---
otp_store = {}
PHOTO_CREDENTIALS = {"admin": "123"}

# ==========================================
# 1. AUTH ENDPOINTS (MOBILE + OTP + EMAIL)
# ==========================================

@app.post("/api/auth/send-otp")
async def send_otp(phone: str):
    otp = "123456" 
    otp_store[phone] = otp
    print(f"📱 OTP Sent to {phone}: {otp}")
    return {"status": "success", "message": "OTP sent successfully"}

@app.post("/api/auth/verify-otp")
async def verify_otp(phone: str, otp: str):
    if phone in otp_store and otp_store[phone] == otp:
        return {"status": "success", "message": "Mobile verified! Now upload selfie."}
    raise HTTPException(status_code=400, detail="Invalid OTP")

@app.get("/api/auth/check-user/{phone}")
async def check_user(phone: str):
    user_img_path = os.path.join(KNOWN_FACES_DIR, f"{phone}.jpg")
    if os.path.exists(user_img_path):
        return {"exists": True}
    return {"exists": False}

# NAYA: Photographer Login Endpoint (422 Error Fixed)
@app.post("/api/auth/photographer-login")
async def photographer_login(email: str = Form(...), password: str = Form(...)):
    
    # 👇 ASLI PASSWORD CHECK YAHAN HOTA HAI (Quotes ke andar) 👇
    if email == "admin@eventsnap.com" and password == "asdfghjkl":
        
        return {"status": "success", "role": "photographer", "token": "photo_secure_token"}
    else:
        raise HTTPException(status_code=401, detail="Invalid email or password")


# ==========================================
# 2. AI ENDPOINTS (FACE SCANNER)
# ==========================================

# YE FUNCTION MISSING THA (500 Error Fixed)
def check_face_match(photo_path, user_embedding):
    try:
        result = DeepFace.verify(
            img1_path=photo_path, 
            img2_path=user_embedding, 
            model_name="Facenet",
            distance_metric="cosine",
            enforce_detection=False
        )
        score = result["distance"]
        is_match = result["verified"]
        print(f"🔍 AI Check: {os.path.basename(photo_path)} | Score: {score:.4f} | Match: {is_match}")
        return is_match
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

@app.post("/api/auth/verify-selfie")
async def verify_selfie(phone: str = Form(...), selfie: UploadFile = File(...)):
    user_img_path = os.path.join(KNOWN_FACES_DIR, f"{phone}.jpg")
    
    try:
        with open(user_img_path, "wb") as buffer:
            shutil.copyfileobj(selfie.file, buffer)
        
        DeepFace.extract_faces(img_path=user_img_path, enforce_detection=True)
        return {"status": "success", "token": f"session_{phone}"}
    except Exception as e:
        if os.path.exists(user_img_path): 
            os.remove(user_img_path)
        raise HTTPException(status_code=400, detail="Face detection failed. Try a clear photo.")


# ==========================================
# 3. GALLERY ENDPOINT (WITH SUPERFAST CACHE)
# ==========================================

@app.get("/api/photos")
async def get_all_photos(phone: str): 
    user_img_path = os.path.join(KNOWN_FACES_DIR, f"{phone}.jpg")
    cache_file_path = os.path.join(KNOWN_FACES_DIR, f"{phone}_gallery.json") 
    
    # Agar user ne photo hi upload nahi ki
    if not os.path.exists(user_img_path):
        return {"photos": []}
        
    # Caching Logic: Agar pehle scan ho chuka hai, toh 0 second mein bhejo
    if os.path.exists(cache_file_path):
        print(f"⚡ FAST LOAD: {phone} ki saved gallery bheji ja rahi hai!")
        with open(cache_file_path, "r") as f:
            saved_results = json.load(f)
        return {"photos": saved_results}
    
    # Agar nayi scan karni hai
    if not os.path.exists(PHOTOS_DIR):
        os.makedirs(PHOTOS_DIR, exist_ok=True)

    files = [f for f in os.listdir(PHOTOS_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    results = []
    print(f"🐢 SLOW LOAD: {phone} ke liye pehli baar AI scan ho raha hai...")
    for f in files:
        full_path = os.path.join(PHOTOS_DIR, f)
        is_match = check_face_match(full_path, user_img_path) 
        
        results.append({
            "filename": f,
            "url": "http://localhost:8000/photos/" + f,
            "is_dhruw": is_match
        })
        
    # Scan ke baad results ko file mein save kar lo agli baar ke liye
    with open(cache_file_path, "w") as f:
        json.dump(results, f)
        
    return {"photos": results}