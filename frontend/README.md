# 🛡️ SEPSA: Smart Event Photo Sharing App

![Development Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Version](https://img.shields.io/badge/Version-0.1.0--Alpha-blue)

> **⚠️ NOTE:** This project is currently in the **Active Development Phase**. APIs and features are subject to change. Not yet intended for production use [cite: 2026-03-01].

**SEPSA** (Smart Event Photo Sharing App) is an AI-driven image distribution system designed to automate photo sharing using Face Recognition [cite: 2026-03-01].

---

## 🏗️ Project Status: Alpha
Currently, we are focusing on the **Core Infrastructure** and **Data Validation Pipeline** [cite: 2026-03-01].
- [x] Backend & Admin Dashboard Architecture [cite: 2026-03-01].
- [x] Automated QA & Metadata Validation [cite: 2026-03-01].
- [ ] **NEXT UP:** DeepFace Biometric Encoding [cite: 2026-03-01].

---

## 🚀 Current Architecture
The project follows a microservices-oriented approach via **Docker Compose** [cite: 2026-03-01].

* **Backend:** FastAPI (Python) with Uvicorn [cite: 2026-03-01].
* **Admin Dashboard:** Streamlit interface for real-time monitoring [cite: 2026-03-01].
* **Frontend:** Next.js with Tailwind CSS [cite: 2026-03-01].
* **Storage:** Local volume mapping for event-based organization [cite: 2026-03-01].

---

## 🛠️ Implemented Features

### 1. Smart Login & Auth
- **OTP Flow:** Simulated authentication for secure access [cite: 2026-03-01].
- **5-Day Photo Rule:** Ensures selfies are captured within 5 days using EXIF analysis [cite: 2026-03-01].
- **Portrait Validation:** Automatic aspect ratio checks [cite: 2026-03-01].

### 2. Event Engine
- **Dynamic Creation:** Automatic folder and registry generation [cite: 2026-03-01].
- **Logging:** Persistent CSV-based audit trails [cite: 2026-03-01].

---

## 📦 Quick Start

```bash
# Clone the repository
git clone [https://github.com/dhruwizmyname/sepsa.git](https://github.com/dhruwizmyname/sepsa.git)
cd sepsa

# Deploy using Docker
docker-compose up -d --build  