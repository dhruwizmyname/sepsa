# EventSnap 📸
**An AI-Powered Smart Event Photo Sharing Application**

> **⚠️ Development Status**: This project is currently in the **Active Development Phase**. Core features are being implemented, and the codebase is updated frequently as part of an iterative development lifecycle.

EventSnap is an intelligent photo management platform designed to streamline the way event memories are shared. Utilizing advanced facial recognition, the application automatically organizes galleries, ensuring users only see the photos they appear in, thereby eliminating the manual effort of searching through large event datasets.

---

## 🚀 Key Features (Current & Incoming)

* **Neural Search Engine**: Implementing high-performance facial recognition (DeepFace/OpenCV) to detect and index faces within event uploads.
* **Intelligent Authentication**: A secure 3-step login flow featuring Mobile OTP and Selfie-based identity verification for automated photo matching.
* **Photographer Dashboard**: A comprehensive management interface for professionals to create events, manage client lists, and monitor upload statistics.
* **Automated Privacy**: Sophisticated filtering logic that provides clients with personalized galleries containing only their identified images.

## 🛠 Tech Stack

* **Frontend**: Next.js 16 (Turbopack), Tailwind CSS, Lucide Icons.
* **Backend**: Python (FastAPI), Uvicorn.
* **Containerization**: Docker & Docker Compose for seamless environment orchestration.
* **DevOps**: Automated PowerShell and Bash setup scripts for rapid deployment.

## 📦 Getting Started

### Prerequisites
* Docker & Docker Compose installed.
* Git installed for version control.

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone [https://github.com/dhruwizmyname/sepsa.git](https://github.com/dhruwizmyname/sepsa.git)
    cd sepsa
    ```
2.  **Initialize the Environment**:
    Run the custom automation script to build containers and sync UI dependencies:
    ```powershell
    .\setup.ps1
    ```

## 🐳 Architecture


* **Frontend Service**: Accessible at `http://localhost:3000`
* **Backend Service**: Accessible at `http://localhost:8000`

---

## 🎓 Academic Context
This project is developed as part of professional growth during the **Executive M.Tech in Data Science and Data Analytics at IIT Bhilai**. It demonstrates the practical application of Big Data technologies and Neural Networks in a real-world software product.

## 👤 Author
**Dhruw** *IT Analyst & M.Tech Data Science Candidate, IIT Bhilai*
