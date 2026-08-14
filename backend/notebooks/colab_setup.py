# PhysiSim AI — Google Colab Setup Notebook
# Copy từng cell này vào Google Colab và chạy theo thứ tự

# ============================================================
# CELL 0 ⚡ QUICK RESTART — chạy cell này nếu backend bị mất
#          (không cần chạy lại từ đầu)
# ============================================================
"""
import subprocess, time, re, os

# 1. Kill process cũ nếu còn
os.system("pkill -f 'uvicorn' 2>/dev/null; sleep 1")

# 2. Start FastAPI lại
proc = subprocess.Popen(
    ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    cwd="/content/physisim-ai/backend"  # ← sửa path nếu khác
)
time.sleep(3)

# Kiểm tra server up chưa
import httpx
try:
    r = httpx.get("http://localhost:8000/api/status", timeout=5)
    print(f"✅ Backend OK: {r.json()}")
except Exception as e:
    print(f"❌ Backend not responding: {e}")
    print("→ Kiểm tra error: proc.stderr.read().decode()")

# 3. Tạo tunnel mới (chọn 1 trong 3 cách bên dưới)

# --- Cách A: Cloudflare (KHÔNG cần tài khoản, khuyến nghị) ---
cf = subprocess.Popen(
    ['cloudflared', 'tunnel', '--url', 'http://localhost:8000'],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT
)
api_url = None
for _ in range(40):
    line = cf.stdout.readline().decode('utf-8', errors='ignore')
    m = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
    if m:
        api_url = m.group(0)
        break
    time.sleep(0.5)

# --- Cách B: ngrok (cần authtoken, dùng nếu Cloudflare lỗi) ---
# from pyngrok import ngrok
# api_url = ngrok.connect(8000).public_url

print(f"\n{'='*50}")
print(f"✅ NEW URL: {api_url}")
print(f"📊 Swagger: {api_url}/docs")
print(f"{'='*50}")
print(f"\n👉 Paste URL này vào ô input trên Frontend rồi click 🔌 Connect")
"""

# ============================================================
# CELL 1: Verify GPU & Install Dependencies
# ============================================================
"""
!nvidia-smi
!pip install -q fastapi "uvicorn[standard]" h5py numpy httpx pytest cloudflared
print("✅ Dependencies installed")
"""

# ============================================================
# CELL 2: Clone / Upload Project
# ============================================================
"""
# Option A — Clone từ GitHub
!git clone https://github.com/your-username/physisim-ai.git
%cd physisim-ai/backend

# Option B — Upload zip thủ công
# from google.colab import files
# uploaded = files.upload()
# !unzip physisim-ai.zip && cd physisim-ai/backend
"""

# ============================================================
# CELL 3: (Optional) Install Physics Engine
# ============================================================
"""
!pip install -q mujoco          # MuJoCo (stable)
# !pip install -q genesis-world  # Genesis (faster, experimental)
print("✅ Physics engine installed")
"""

# ============================================================
# CELL 4: Start FastAPI Server (background)
# ============================================================
"""
import subprocess, time

proc = subprocess.Popen(
    ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
time.sleep(3)
print(f"✅ Server PID: {proc.pid} | Running on port 8000")
"""

# ============================================================
# CELL 5A ⭐ Tunnel: Cloudflare (KHUYẾN NGHỊ — không cần tài khoản)
# ============================================================
"""
import subprocess, time, re

# Install cloudflared  ← LƯU Ý: dpkg KHÔNG có flag -q
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
!dpkg -i cloudflared-linux-amd64.deb

# Start tunnel
cf = subprocess.Popen(
    ['cloudflared', 'tunnel', '--url', 'http://localhost:8000'],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT
)

# Đọc URL (chờ tối đa 20s)
api_url = None
for _ in range(40):
    line = cf.stdout.readline().decode('utf-8', errors='ignore')
    m = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
    if m:
        api_url = m.group(0)
        break
    time.sleep(0.5)

print(f"✅ API URL : {api_url}")
print(f"   Swagger : {api_url}/docs")
print(f"\n👉 Copy URL → Paste vào Frontend header → Click Connect")
"""

# ============================================================
# CELL 5B  Tunnel: localhost.run (backup — SSH, không cần install gì)
# ============================================================
"""
import subprocess, threading, time, re

lines = []
p = subprocess.Popen(
    ['ssh', '-o', 'StrictHostKeyChecking=no',
     '-R', '80:localhost:8000', 'nokey@localhost.run'],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT
)
threading.Thread(
    target=lambda: [lines.append(l.decode('utf-8', errors='ignore')) for l in p.stdout],
    daemon=True
).start()

time.sleep(8)
api_url = next(
    (re.search(r'https://\S+\.lhr\.life', l).group(0)
     for l in lines if re.search(r'https://\S+\.lhr\.life', l)),
    None
)
if api_url:
    print(f"✅ API URL: {api_url}")
    print(f"   Swagger: {api_url}/docs")
else:
    print("⚠ Không lấy được URL. Raw output:")
    print("".join(lines[-5:]))
"""

# ============================================================
# CELL 5C  Tunnel: ngrok (cần authtoken — đăng ký miễn phí 1 lần)
# ============================================================
"""
# Lấy token tại: https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_TOKEN = "PASTE_YOUR_TOKEN_HERE"   # ← thay vào đây (KHÔNG commit token thật lên git!)

!pip install -q pyngrok
from pyngrok import ngrok
ngrok.set_auth_token(NGROK_TOKEN)

tunnel  = ngrok.connect(8000, "http")
api_url = tunnel.public_url
print(f"✅ API URL: {api_url}")
print(f"   Swagger: {api_url}/docs")
print(f"\n👉 Copy URL → Paste vào Frontend header → Click Connect")
"""

# ============================================================
# CELL 6: Quick API Test (chạy sau khi có api_url từ Cell 5x)
# ============================================================
"""
import httpx, json

# Test /api/status
r = httpx.get(f"{api_url}/api/status")
print("Status:", json.dumps(r.json(), indent=2))

# Test /api/step
r = httpx.post(f"{api_url}/api/step", json={
    "pos_x": 0.1, "pos_y": 1.3, "pos_z": 0.0,
    "roll": 0.0,  "pitch": 0.0, "yaw": 0.0,
    "gripper": 0.5
})
print("Step:", json.dumps(r.json(), indent=2))
"""

# ============================================================
# CELL 7: Diagnostics — chạy khi gặp lỗi kết nối
# ============================================================
"""
import httpx, subprocess

def backend_status():
    print("=" * 50)
    # 1. Check server process
    ps = subprocess.run(['pgrep', '-a', 'uvicorn'], capture_output=True, text=True)
    if ps.stdout:
        print(f"✅ uvicorn running: {ps.stdout.strip()}")
    else:
        print("❌ uvicorn NOT running → re-run Cell 4")

    # 2. Check local API
    try:
        r = httpx.get("http://localhost:8000/api/status", timeout=3)
        print(f"✅ Local API OK: {r.json()}")
    except Exception as e:
        print(f"❌ Local API not responding: {e}")

    # 3. Check tunnel
    try:
        r = httpx.get(f"{api_url}/api/status",
                      headers={"ngrok-skip-browser-warning": "true"}, timeout=5)
        if r.status_code == 200:
            print(f"✅ Tunnel OK → Frontend có thể kết nối")
        else:
            print(f"⚠ Tunnel returns HTTP {r.status_code} → Re-run Cell 5")
    except Exception as e:
        print(f"❌ Tunnel unreachable: {e} → Re-run Cell 5 to get new URL")
    print("=" * 50)

backend_status()
"""

# ============================================================
# CELL 8: Stop — chạy khi xong việc
# ============================================================
"""
cf.terminate()   # hoặc p.terminate() / ngrok.kill()
proc.terminate()
print("🛑 Server và tunnel đã dừng")
"""


# ============================================================
# CELL 1: Verify GPU & Install Dependencies
# ============================================================
"""
!nvidia-smi
!pip install -q fastapi "uvicorn[standard]" h5py numpy httpx pytest
print("✅ Dependencies installed")
"""

# ============================================================
# CELL 2: Clone / Upload Project
# ============================================================
"""
# Option A — Clone từ GitHub
!git clone https://github.com/your-username/physisim-ai.git
%cd physisim-ai/backend

# Option B — Upload zip thủ công
# from google.colab import files
# uploaded = files.upload()
# !unzip physisim-ai.zip && cd physisim-ai/backend
"""

# ============================================================
# CELL 3: (Optional) Install Physics Engine
# ============================================================
"""
!pip install -q mujoco          # MuJoCo (stable)
# !pip install -q genesis-world  # Genesis (faster, experimental)
print("✅ Physics engine installed")
"""

# ============================================================
# CELL 4: Start FastAPI Server (background)
# ============================================================
"""
import subprocess, time

proc = subprocess.Popen(
    ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
time.sleep(3)
print(f"✅ Server PID: {proc.pid} | Running on port 8000")
"""

# ============================================================
# CELL 5A ⭐ Tunnel: Cloudflare (KHUYẾN NGHỊ — không cần tài khoản)
# ============================================================
"""
import subprocess, time, re

# Install cloudflared  ← LƯU Ý: dpkg KHÔNG có flag -q
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
!dpkg -i cloudflared-linux-amd64.deb

# Start tunnel
cf = subprocess.Popen(
    ['cloudflared', 'tunnel', '--url', 'http://localhost:8000'],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT
)

# Đọc URL (chờ tối đa 20s)
api_url = None
for _ in range(40):
    line = cf.stdout.readline().decode('utf-8', errors='ignore')
    m = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
    if m:
        api_url = m.group(0)
        break
    time.sleep(0.5)

print(f"✅ API URL : {api_url}")
print(f"   Swagger : {api_url}/docs")
print(f"\n👉 Copy URL → Paste vào Frontend header → Click Connect")
"""

# ============================================================
# CELL 5B  Tunnel: localhost.run (backup — SSH, không cần install gì)
# ============================================================
"""
import subprocess, threading, time, re

lines = []
p = subprocess.Popen(
    ['ssh', '-o', 'StrictHostKeyChecking=no',
     '-R', '80:localhost:8000', 'nokey@localhost.run'],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT
)
threading.Thread(
    target=lambda: [lines.append(l.decode('utf-8', errors='ignore')) for l in p.stdout],
    daemon=True
).start()

time.sleep(8)
api_url = next(
    (re.search(r'https://\S+\.lhr\.life', l).group(0)
     for l in lines if re.search(r'https://\S+\.lhr\.life', l)),
    None
)
if api_url:
    print(f"✅ API URL: {api_url}")
    print(f"   Swagger: {api_url}/docs")
else:
    print("⚠ Không lấy được URL. Raw output:")
    print("".join(lines[-5:]))
"""

# ============================================================
# CELL 5C  Tunnel: ngrok (cần authtoken — đăng ký miễn phí 1 lần)
# ============================================================
"""
# Lấy token tại: https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_TOKEN = "PASTE_YOUR_TOKEN_HERE"   # <── thay vào đây (KHÔNG commit token thật lên git!)

!pip install -q pyngrok
from pyngrok import ngrok
ngrok.set_auth_token(NGROK_TOKEN)

tunnel  = ngrok.connect(8000, "http")
api_url = tunnel.public_url
print(f"✅ API URL: {api_url}")
print(f"   Swagger: {api_url}/docs")
print(f"\n👉 Copy URL → Paste vào Frontend header → Click Connect")
"""

# ============================================================
# CELL 6: Quick API Test (chạy sau khi có api_url từ Cell 5x)
# ============================================================
"""
import httpx, json

# Test /api/status
r = httpx.get(f"{api_url}/api/status")
print("Status:", json.dumps(r.json(), indent=2))

# Test /api/step
r = httpx.post(f"{api_url}/api/step", json={
    "pos_x": 0.1, "pos_y": 1.3, "pos_z": 0.0,
    "roll": 0.0,  "pitch": 0.0, "yaw": 0.0,
    "gripper": 0.5
})
     "gripper": 0.5
})
print("Step:", json.dumps(r.json(), indent=2))
"""

# ============================================================
# CELL 6B: PyTorch Diffusion Policy Training on Colab GPU
# ============================================================
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import h5py
import glob
import os

print(f"CUDA Available: {torch.cuda.is_available()}")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 1. Dataset Loader for LeRobot HDF5 Files
class PhysiSimDataset(Dataset):
    def __init__(self, dataset_dir, obs_horizon=2, pred_horizon=16):
        self.episode_files = glob.glob(os.path.join(dataset_dir, "*.h5"))
        self.obs_horizon = obs_horizon
        self.pred_horizon = pred_horizon
        self.data_samples = []
        self._load_episodes()

    def _load_episodes(self):
        for fpath in self.episode_files:
            try:
                with h5py.File(fpath, "r") as f:
                    # Load states (EE pose [7] + joint angles [7] + gripper [1])
                    obs_pose = f["observation/pose"][:]
                    obs_joints = f["observation/joints"][:]
                    actions = f["action"][:]
                    
                    # Compute sliding windows
                    total_steps = len(actions)
                    for i in range(total_steps - self.pred_horizon - self.obs_horizon + 1):
                        obs = np.concatenate([
                            obs_pose[i : i + self.obs_horizon].flatten(),
                            obs_joints[i : i + self.obs_horizon].flatten()
                        ])
                        act = actions[i + self.obs_horizon : i + self.obs_horizon + self.pred_horizon]
                        self.data_samples.append((obs, act))
            except Exception as e:
                print(f"Error loading {fpath}: {e}")

    def __len__(self):
        return len(self.data_samples)

    def __getitem__(self, idx):
        obs, act = self.data_samples[idx]
        return torch.tensor(obs, dtype=torch.float32), torch.tensor(act, dtype=torch.float32)

# 2. Diffusion U-Net MLP Architecture
class DiffusionPolicyNet(nn.Module):
    def __init__(self, obs_dim, act_dim, pred_horizon=16):
        super().__init__()
        self.obs_dim = obs_dim
        self.act_dim = act_dim
        self.pred_horizon = pred_horizon
        
        # Simple conditional feed-forward U-Net style architecture
        self.time_embed = nn.Sequential(
            nn.Linear(1, 64),
            nn.Mish(),
            nn.Linear(64, 64)
        )
        
        self.net = nn.Sequential(
            nn.Linear(obs_dim + act_dim * pred_horizon + 64, 512),
            nn.Mish(),
            nn.Linear(512, 512),
            nn.Mish(),
            nn.Linear(512, act_dim * pred_horizon)
        )

    def forward(self, obs, action_noisy, timestep):
        t_emb = self.time_embed(timestep.unsqueeze(-1))
        # Flatten action window
        act_flat = action_noisy.view(action_noisy.shape[0], -1)
        x = torch.cat([obs, act_flat, t_emb], dim=-1)
        out = self.net(x)
        return out.view(action_noisy.shape)

# 3. Simple DDPM Scheduler for training
def cosine_beta_schedule(timesteps, s=0.008):
    steps = timesteps + 1
    x = torch.linspace(0, timesteps, steps)
    alphas_cumprod = torch.cos(((x / timesteps) + s) / (1 + s) * torch.pi * 0.5) ** 2
    alphas_cumprod = alphas_cumprod / alphas_cumprod[0]
    betas = 1 - (alphas_cumprod[1:] / alphas_cumprod[:-1])
    return torch.clip(betas, 0.0001, 0.9999)

# 4. Training loop simulation / actual training
def train_diffusion(dataset_dir="/tmp", epochs=20, batch_size=32):
    # Setup dummy data if directory doesn't have .h5
    if not glob.glob(os.path.join(dataset_dir, "*.h5")):
        print("Creating dummy HDF5 trajectories to verify PyTorch model workflow...")
        os.makedirs(dataset_dir, exist_ok=True)
        for i in range(5):
            with h5py.File(f"{dataset_dir}/episode_{i}.h5", "w") as f:
                f.create_dataset("observation/pose", data=np.random.rand(50, 7))
                f.create_dataset("observation/joints", data=np.random.rand(50, 7))
                f.create_dataset("action", data=np.random.rand(50, 8))

    dataset = PhysiSimDataset(dataset_dir)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    # Obs horizon=2, pred horizon=16
    obs_dim = (7 + 7) * 2
    model = DiffusionPolicyNet(obs_dim=obs_dim, act_dim=8).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=1e-4)
    
    timesteps = 100
    betas = cosine_beta_schedule(timesteps).to(device)
    alphas = 1.0 - betas
    alphas_cumprod = torch.cumprod(alphas, dim=0)
    
    print(f"Loaded {len(dataset)} samples. Beginning training...")
    for epoch in range(epochs):
        epoch_loss = 0.0
        for obs, act in loader:
            obs = obs.to(device)
            act = act.to(device)
            
            # Sample noise
            noise = torch.randn_like(act)
            t = torch.randint(0, timesteps, (obs.shape[0],), device=device).long()
            
            # Get noisy action
            alpha_cumprod = alphas_cumprod[t].view(-1, 1, 1)
            act_noisy = torch.sqrt(alpha_cumprod) * act + torch.sqrt(1 - alpha_cumprod) * noise
            
            # Predict noise
            noise_pred = model(obs, act_noisy, t.float() / timesteps)
            
            loss = nn.MSELoss()(noise_pred, noise)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        print(f"Epoch {epoch+1:02d}/{epochs} | Loss: {epoch_loss / len(loader):.6f}")
        
    torch.save(model.state_dict(), "/content/diffusion_policy_franka.pt")
    print("✅ Model trained & saved to /content/diffusion_policy_franka.pt")

train_diffusion(epochs=5)
"""

# ============================================================
# CELL 7: Stop — chạy khi xong việc
# ============================================================
"""
cf.terminate()   # hoặc p.terminate() / ngrok.kill()
proc.terminate()
print("🛑 Server và tunnel đã dừng")
"""
