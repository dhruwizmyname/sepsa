<<<<<<< HEAD
import os
import json
import pickle
import face_recognition
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends # <-- NEW IMPORTS
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm # <-- NEW IMPORTS
import shutil
import numpy as np
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
=======
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps
import face_recognition
import os
import io
import pickle
import cv2
import numpy as np

app = FastAPI()

# 1. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
>>>>>>> 2b00d43e24ddfb811e85ec2f6ce0c3ae9e4c1c1b
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
UPLOAD_DIR = "storage/uploads"
KNOWN_DIR = "known_faces"
DB_FILE = "storage/metadata.json"
FACE_BANK_FILE = "storage/face_bank.pkl"

# Tightened the tolerance slightly because the Deep Scan is much more accurate
TOLERANCE = 0.68 

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(KNOWN_DIR, exist_ok=True)
os.makedirs("storage", exist_ok=True)

if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w") as f:
        json.dump([], f)

# Hardcoded for prototype
ADMIN_USERNAME = "admin@eventsnap.com"
ADMIN_PASSWORD = "password123"

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != ADMIN_USERNAME or form_data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    return {"access_token": "valid_token", "token_type": "bearer"}



# 1. Load the Master Identity with DEEP SCAN (10 Jitters)
MASTER_IMG_PATH = f"{KNOWN_DIR}/master_dhruw.jpg"
known_encodings = []
dynamic_encodings = []

if os.path.exists(MASTER_IMG_PATH):
    master_image = face_recognition.load_image_file(MASTER_IMG_PATH)
    # Jitter=10 means the AI calculates 10 different angles of your master photo to build an ironclad baseline
    encodings = face_recognition.face_encodings(master_image, num_jitters=10)
    if len(encodings) > 0:
        known_encodings.append(encodings[0])
        print("✅ Master Identity Loaded (Deep Scan Complete)")
else:
    print("❌ CRITICAL: Master Identity NOT FOUND")

# 2. Load the "Temp Face Memory" (The Face Bank)
if os.path.exists(FACE_BANK_FILE):
    try:
        with open(FACE_BANK_FILE, "rb") as f:
            dynamic_encodings = pickle.load(f)
            known_encodings.extend(dynamic_encodings)
        print(f"🧠 Face Bank Loaded: {len(dynamic_encodings)} additional angles memorized.")
    except Exception as e:
        print(f"⚠️ Face Bank empty or corrupted, starting fresh.")

def load_db():
    if not os.path.exists(DB_FILE): return []
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f)

@app.post("/upload")
async def upload_photo(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    is_dhruw = False
    
    if len(known_encodings) > 0:
        unknown_image = face_recognition.load_image_file(file_path)
        
        # DEEP SCAN UPGRADE: Upsample the image twice to catch faces further back, or at weird angles
        face_locations = face_recognition.face_locations(unknown_image, number_of_times_to_upsample=2, model="hog")
        
        # DEEP SCAN UPGRADE: Jitter the new faces 5 times to ensure we don't miss a match due to lighting
        unknown_encodings = face_recognition.face_encodings(unknown_image, known_face_locations=face_locations, num_jitters=5)
        
        print(f"\n📸 Deep Scanning {file.filename} (Found {len(unknown_encodings)} faces)...")
        
        for i, encoding in enumerate(unknown_encodings):
            face_distances = face_recognition.face_distance(known_encodings, encoding)
            
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                best_distance = face_distances[best_match_index]
                
                print(f"   Face {i+1} Best Math Score: {best_distance:.3f}")
                
                if best_distance <= TOLERANCE:
                    is_dhruw = True
                    print(f"   ✨ MATCH! ({best_distance:.3f} <= {TOLERANCE})")
                    
                    dynamic_encodings.append(encoding)
                    known_encodings.append(encoding)
                    
                    with open(FACE_BANK_FILE, "wb") as f:
                        pickle.dump(dynamic_encodings, f)
                    
                    print(f"   🧠 Face Bank Updated!")
                    break
                else:
                    print(f"   ❌ No Match ({best_distance:.3f} > {TOLERANCE})")
            
    # Save to JSON Database
    db = load_db()
    db = [entry for entry in db if entry["filename"] != file.filename] 
    new_entry = {"filename": file.filename, "is_dhruw": is_dhruw}
    db.append(new_entry)
    save_db(db)
            
    return new_entry


@app.get("/photos")
async def list_photos():
    return {"photos": load_db()}

@app.get("/view_photos/{filename}")
async def view_photo(filename: str):
    return FileResponse(os.path.join(UPLOAD_DIR, filename))
=======
KNOWN_FACES_DIR = "./storage"
ENCODINGS_FILE = "face_encodings.pkl"

if not os.path.exists(KNOWN_FACES_DIR):
    os.makedirs(KNOWN_FACES_DIR)

app.mount("/storage", StaticFiles(directory=KNOWN_FACES_DIR), name="storage")

# --- THE IMPROVED SEARCH FUNCTION ---

@app.post("/search")
async def search_photos(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        # 1. Load and Resize for Performance
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # If the image is huge, shrink it so Docker doesn't hang
        height, width = img.shape[:2]
        if width > 1200:
            img = cv2.resize(img, (1200, int(height * 1200 / width)))

        # 2. Enhance for better detection in low light
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # 3. Detect Face in Selfie
        # We upsample to find the face even if it's not perfectly clear
        user_face_locations = face_recognition.face_locations(img_rgb, number_of_times_to_upsample=2)
        user_encodings = face_recognition.face_encodings(img_rgb, user_face_locations)

        if not user_encodings:
            print("❌ Still no face found in selfie. Try a clearer photo.")
            return {"matches": [], "message": "No face found in selfie"}
        
        user_encode = user_encodings[0]
        matches = []
        
        # 4. Loop through Storage
        for photo_name in os.listdir(KNOWN_FACES_DIR):
            if photo_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                path = os.path.join(KNOWN_FACES_DIR, photo_name)
                
                # Load storage image
                storage_img = face_recognition.load_image_file(path)
                
                # Find faces in the storage photo
                storage_face_locs = face_recognition.face_locations(storage_img)
                storage_encodes = face_recognition.face_encodings(storage_img, storage_face_locs)

                for encode in storage_encodes:
                    dist = face_recognition.face_distance([encode], user_encode)[0]
                    
                    # LOGGING: Keep this to see the numbers in your terminal!
                    # Based on your logs (0.73-0.79), we set tolerance to 0.80
                    TOLERANCE = 0.74
                    is_match = dist < TOLERANCE
                    
                    print(f"🔍 File: {photo_name} | Distance: {dist:.4f} | Match: {is_match}")

                    if is_match:
                        matches.append(f"http://localhost:8000/storage/{photo_name}")
                        break

        return {"matches": matches}

    except Exception as e:
        print(f"❌ Error during search: {str(e)}")
        return {"matches": [], "message": "Search error"}


@app.get("/all-photos")
async def get_all_photos():
    all_photos = []
    if os.path.exists(KNOWN_FACES_DIR):
        for photo_name in os.listdir(KNOWN_FACES_DIR):
            if photo_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                all_photos.append(f"http://localhost:8000/storage/{photo_name}")
    return {"photos": all_photos}
>>>>>>> 2b00d43e24ddfb811e85ec2f6ce0c3ae9e4c1c1b
