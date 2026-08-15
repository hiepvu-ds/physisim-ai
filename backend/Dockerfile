# =======================================================
# PhysiSim AI — Production GPU Server Dockerfile
# Supports NVIDIA CUDA GPUs (T4, RTX 30xx/40xx, A100, etc.)
# =======================================================
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Cài đặt Python 3.11 và các thư viện hệ thống cần cho MuJoCo / OpenGL / EGL
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3-pip \
    git \
    curl \
    libgl1-mesa-dev \
    libgl1-mesa-glx \
    libglew-dev \
    libosmesa6-dev \
    libglfw3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3.11 /usr/bin/python

WORKDIR /app

# Cài đặt Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code backend
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Khởi chạy server FastAPI hỗ trợ GPU
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
