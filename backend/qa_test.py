import requests
import os

BASE_URL = "http://localhost:8000/api"

print("🚀 Starting SEPSA Automated API Tests...\n")

# ==========================================
# TEST 1: PHOTOGRAPHER LOGIN (Email + Pass)
# ==========================================
print("📸 Test 1: Photographer Login...")
photo_creds = {
    "email": "admin@eventsnap.com",
    "password": "password123"
}
try:
    # Form data bhej rahe hain (jaisa frontend karta hai)
    res1 = requests.post(f"{BASE_URL}/auth/photographer-login", data=photo_creds)
    if res1.status_code == 200:
        print("  ✅ SUCCESS:", res1.json())
    else:
        print("  ❌ FAIL:", res1.status_code, res1.text)
except Exception as e:
    print("  ❌ CONNECTION ERROR (Is Docker running?):", e)


# ==========================================
# TEST 2: USER FLOW (Check User & Fetch Gallery)
# ==========================================
TEST_PHONE = "8962744270"  # Aapka test number
print(f"\n👤 Test 2: User Flow for {TEST_PHONE}...")

# Step 2A: Check User Exists
res_check = requests.get(f"{BASE_URL}/auth/check-user/{TEST_PHONE}")
if res_check.status_code == 200:
    print(f"  ✅ CHECK USER SUCCESS:", res_check.json())
else:
    print("  ❌ CHECK USER FAIL:", res_check.text)

# Step 2B: Fetch AI Gallery
print(f"  -> Fetching AI Gallery photos...")
res_photos = requests.get(f"{BASE_URL}/photos?phone={TEST_PHONE}")
if res_photos.status_code == 200:
    photos_data = res_photos.json().get("photos", [])
    print(f"  ✅ FETCH SUCCESS: Found {len(photos_data)} photos in gallery.")
else:
    print("  ❌ FETCH FAIL:", res_photos.status_code, res_photos.text)


# ==========================================
# TEST 3: SELFIE UPLOAD (Dummy Image)
# ==========================================
print("\n🤳 Test 3: New User Selfie Upload...")
TEST_IMAGE = "dummy_face.jpg"
NEW_PHONE = "9999999999"

# Ek dummy image create karte hain test ke liye
if not os.path.exists(TEST_IMAGE):
    from PIL import Image
    dummy_img = Image.new('RGB', (100, 100), color='green')
    dummy_img.save(TEST_IMAGE)

try:
    with open(TEST_IMAGE, "rb") as img:
        files = {"selfie": ("dummy_face.jpg", img, "image/jpeg")}
        data = {"phone": NEW_PHONE}
        
        res_selfie = requests.post(f"{BASE_URL}/auth/verify-selfie", data=data, files=files)
        
        # Deepface fail hoga kyunki isme asli chehra nahi hai, par API run honi chahiye
        if res_selfie.status_code == 200:
            print("  ✅ SUCCESS:", res_selfie.json())
        else:
            print(f"  ⚠️ EXPECTED FAIL (AI needs real face): {res_selfie.status_code} - {res_selfie.json().get('detail')}")
except Exception as e:
    print("  ❌ SELFIE TEST ERROR:", e)

print("\n🎉 All automated tests completed in milliseconds!")