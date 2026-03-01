# Python ka slim version use kar rahe hain image size chota rakhne ke liye
FROM python:3.10-slim

# System dependencies install kar rahe hain jo face-recognition/dlib ke liye zaroori hain
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    g++ \
    make \
    libopenblas-dev \
    liblapack-dev \
    libx11-6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Sabse pehle requirements copy aur install karte hain (Caching optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Baaki code copy karte hain
COPY . .

# Backend run karne ki command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]