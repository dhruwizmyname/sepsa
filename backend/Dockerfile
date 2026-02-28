<<<<<<< HEAD
FROM python:3.10

WORKDIR /app

# System tools for dlib and OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

=======
FROM python:3.10-slim

# Install system dependencies for dlib
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
>>>>>>> 2b00d43e24ddfb811e85ec2f6ce0c3ae9e4c1c1b
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

<<<<<<< HEAD
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
=======
# Run with hot-reload enabled for testing
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
>>>>>>> 2b00d43e24ddfb811e85ec2f6ce0c3ae9e4c1c1b
