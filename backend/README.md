# PhysiSim AI — Backend README

## Cấu Trúc

```
backend/
├── app/
│   ├── main.py             # 🚀 FastAPI server (entry point)
│   ├── api/                # (TODO) Router modules tách biệt
│   ├── core/               # (TODO) Config, dependencies
│   └── services/           # (TODO) IK solver, physics engine wrappers
├── notebooks/
│   └── physisim_colab.ipynb  # 📓 Google Colab notebook
├── tests/
│   └── test_api.py           # 🧪 API unit tests
└── requirements.txt
```

## Chạy Trên Google Colab

1. **Mở notebook:** `notebooks/physisim_colab.ipynb` trên [Google Colab](https://colab.research.google.com)
2. **Chọn GPU:** Runtime → Change runtime type → **GPU (T4)**
3. **Chạy Setup Cell:**
   ```python
   !pip install -q fastapi uvicorn h5py numpy pyngrok
   ```
4. **Start server:**
   ```python
   !uvicorn app.main:app --host 0.0.0.0 --port 8000 &
   ```
5. **Mở tunnel:**
   ```python
   from pyngrok import ngrok
   url = ngrok.connect(8000).public_url
   print(f"✅ API URL: {url}")
   ```
6. Copy URL → Paste vào Frontend header

## Chạy Local (Development)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs  (Swagger UI)
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET  | `/api/status` | Health check |
| POST | `/api/step`   | Run physics step |
| POST | `/api/export` | Export dataset |
| GET  | `/api/buffer` | Buffer info |
| DELETE | `/api/reset` | Clear session |

## TODO — Tích Hợp Engine Thật

Xem `app/main.py` → functions `solve_ik()` và `run_physics_step()` có comment TODO.

**IK Solver options:**
- `pinocchio` (pin3) — khuyến nghị
- `roboticstoolbox-python`
- `scipy.optimize.minimize`

**Physics Engine options:**
- `mujoco>=3.1` — ổn định, nhiều tài liệu
- `genesis-world` — nhanh hơn nhưng mới hơn
