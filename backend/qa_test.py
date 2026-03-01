import requests
import os
from datetime import datetime

BASE_URL = "http://localhost:8000/api"
TEST_PHONE = "8962744270"
TEST_OTP = "230786"
TEST_IMAGE = "backend/test.jpg"

print("🚀 Starting Full End-to-End QA Test...\n")

# --- Step 1: Request OTP ---
print(f"Step 1: Requesting OTP for {TEST_PHONE}...")
try:
    res1 = requests.post(f"{BASE_URL}/auth/request-otp", json={"phone": TEST_PHONE})
    if res1.status_code == 200:
        print("  ✅ SUCCESS:", res1.json())
    else:
        print("  ❌ FAIL:", res1.text)
        exit()
except Exception as e:
    print("  ❌ CONNECTION ERROR:", e)
    exit()

# --- Step 2: Verify OTP ---
print(f"\nStep 2: Verifying OTP ({TEST_OTP})...")
res2 = requests.post(f"{BASE_URL}/auth/verify-otp", json={"phone": TEST_PHONE, "otp": TEST_OTP})
if res2.status_code == 200:
    token = res2.json().get("token")
    print("  ✅ SUCCESS: Token Received ->", token)
else:
    print("  ❌ FAIL:", res2.text)
    exit()

# --- Step 3: Upload Selfie (With REAL Dummy Image) ---
print("\nStep 3: Uploading Selfie for 5-Day Rule Check...")
if not os.path.exists(TEST_IMAGE):
    os.makedirs("backend", exist_ok=True)
    try:
        from PIL import Image
        # Ek asli neele rang ki image banate hain taaki server crash na ho
        dummy_img = Image.new('RGB', (400, 600), color='blue') 
        dummy_img.save(TEST_IMAGE)
    except Exception as e:
        print(f"  ❌ Failed to create dummy image: {e}")

with open(TEST_IMAGE, "rb") as img:
    files = {"selfie": ("test.jpg", img, "image/jpeg")}
    headers = {"Authorization": f"Bearer {token}"}
    res3 = requests.post(f"{BASE_URL}/auth/verify-selfie", files=files, headers=headers)
    
    if res3.status_code == 200:
        print("  ✅ SUCCESS:", res3.json())
    else:
        print("  ⚠️ WARNING / FAIL:", res3.text)

# --- Step 4: Create Event (DYNAMIC NAMING) ---
print("\nStep 4: Creating a New Event...")

# Dynamic Name Generation: Test_DD_MM_YYYY_Run_HHMMSS
now = datetime.now()
dynamic_event_name = f"Test_{now.strftime('%d_%m_%Y')}_Run_{now.strftime('%H%M%S')}"

event_data = {
    "event_name": dynamic_event_name,
    "created_by": "QA Automated Bot"
}
res4 = requests.post(f"{BASE_URL}/events/create", params=event_data)

if res4.status_code == 200:
    print(f"  ✅ SUCCESS: Event Created -> {res4.json().get('folder')}")
else:
    print("  ❌ FAIL:", res4.text)

print("\n🎉 All tests completed! Check your Admin Dashboard.")