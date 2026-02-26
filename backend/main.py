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
    allow_methods=["*"],
    allow_headers=["*"],
)

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