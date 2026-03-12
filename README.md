# EventSnap 📸
**An AI-Powered Smart Event Photo Sharing Application**

> **⚠️ Development Status**: This project is currently in the **Active Development Phase**. Core features are being implemented, and the codebase is updated frequently as part of an iterative development lifecycle.

EventSnap is an intelligent photo management platform designed to streamline the way event memories are shared. Utilizing advanced facial recognition, the application automatically organizes galleries, ensuring users only see the photos they appear in, thereby eliminating the manual effort of searching through large event datasets.

---

## 🚀 Key Features

* **Neural Search Engine**: Implements high-performance facial recognition using `DeepFace` (Facenet512 + RetinaFace) to detect, extract embeddings, and index faces within bulk event uploads.
* **Intelligent Authentication**: A secure, passwordless 3-step login flow featuring Mobile OTP and instant Selfie-based identity verification.
* **Photographer Dashboard & Bulk Upload**: A comprehensive management interface for professionals to create events, drag-and-drop entire folders, and monitor asynchronous upload pipelines.
* **Cloud-Optimized Delivery**: Original high-resolution photos are securely offloaded to Cloudinary CDN, ensuring lightning-fast delivery while minimizing local server storage.
* **Live Admin Monitoring**: Real-time admin dashboard built on Streamlit to monitor user registries, authentication logs, and photo matching statistics.
* **Non-Blocking Architecture**: Heavy AI scanning and cloud uploading tasks are handled via robust background processing to keep the UI highly responsive.

## 🛠 Tech Stack

* **Frontend**: Next.js 16 (Turbopack), Tailwind CSS v4, Radix UI, Lucide Icons.
* **Backend**: Python 3.10+, FastAPI, Uvicorn.
* **AI & Vision**: TensorFlow (CPU Optimized), DeepFace, OpenCV, Pillow.
* **Admin Interface**: Streamlit, Pandas.
* **Storage & DB**: Cloudinary API, Local JSON/CSV lightweight data mapping.
* **Containerization & DevOps**: Docker, Docker Compose, automated PowerShell/Bash setup scripts for rapid deployment.

## 📦 Getting Started

### Prerequisites
* Docker & Docker Desktop installed.
* Git installed for version control.
* Cloudinary API Credentials.

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone [https://github.com/dhruwizmyname/sepsa.git](https://github.com/dhruwizmyname/sepsa.git)
    cd sepsa
    ```
2.  **Environment Setup**:
    Create a `.env` file in the `backend/` directory with your Cloudinary credentials:
    ```env
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```
3.  **Initialize the Environment**:
    Run the custom automation script to build containers and sync UI dependencies:
    ```powershell
    .\setup.ps1
    ```
    *(Alternatively, you can run `docker-compose up --build`)*

## 🐳 Architecture & Services

Once deployed, the isolated containers are accessible at:
* **Frontend Service (User/Photographer)**: `http://localhost:3000`
* **Backend API & Swagger Docs**: `http://localhost:8000/docs`
* **Admin Panel Service**: `http://localhost:8501`

---

## 🎓 Academic Context
This project is developed as part of professional growth during the **Executive M.Tech in Data Science and Data Analytics at IIT Bhilai**. It demonstrates the practical application of Big Data technologies, Containerization, and Neural Networks in a real-world software product.

## 👤 Author
**Dhruw** *IT Analyst & M.Tech Data Science Candidate, IIT Bhilai*
