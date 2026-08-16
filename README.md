# PhysiSim AI 🤖

> **Multi-Physics Simulation Platform — Zero-CAPEX Cloud Stack**

Nền tảng giả lập đa vật lý chạy hoàn toàn trên đám mây, sinh dữ liệu tổng hợp (Synthetic Data) cho huấn luyện Physical AI / Embodied AI với chi phí **0 VNĐ**.

---

## 🗂️ Cấu Trúc Project

```
physisim-ai/
├── frontend/          # Web UI — Three.js + Chart.js
├── backend/           # Colab GPU Backend — FastAPI + MuJoCo/Genesis
└── docs/              # SRS, PM Plan, API Reference
```

## 🚀 Quick Start

### Frontend
```bash
cd frontend
# Mở index.html trên browser hoặc deploy lên Vercel
```

### Backend (Google Colab)
```
1. Mở backend/notebooks/physisim_colab.ipynb trên Google Colab
2. Runtime → Change runtime type → GPU (T4)
3. Run All
4. Copy ngrok URL → dán vào frontend/src/config.js
```

## 📄 Tech Stack

| Layer | Tech | Cost |
|-------|------|------|
| Frontend | Three.js r128 + Chart.js | Free |
| Backend | FastAPI + Genesis/MuJoCo | Free (Colab T4) |
| Tunnel | ngrok / localtunnel | Free |
| Hosting | Vercel / Cloudflare Pages | Free |
| Storage | HuggingFace Hub | Free |

## 📋 Tài Liệu & Đầu Tư

- 📄 [**Đặc Tả Chức Năng Cốt Lõi (Functional Specification v2.0)**](docs/FUNCTIONAL_SPECIFICATION.md)
- 💼 [**Bản Thuyết Trình Gọi Vốn Pre-Seed (Pitch Deck 12 Slides)**](docs/PITCH_DECK_PRESEED.md)
- 📐 [Software Requirements Specification (SRS)](docs/srs/SRS.md)
- 🗺️ [PM Implementation Plan](docs/PM_PLAN.md)
- 🔌 [API Reference](docs/api/API_REFERENCE.md)

---

*PhysiSim AI © 2026 — The Zero-CAPEX Synthetic Data & Simulation Cloud for Physical AI*

