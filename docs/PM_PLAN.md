# PhysiSim AI — PM Plan

> **Version:** v1.0 | **Updated:** 2026-08-13 | **Overall Progress: ~30%**

---

## 1. Tóm Tắt & Mục Tiêu

**PhysiSim AI** = Multi-Physics Simulation Platform, Zero-CAPEX, Cloud-native.

| Mục tiêu | Chỉ số |
|----------|--------|
| Chi phí vận hành | **0 VNĐ** |
| Output | Dataset (LeRobot / RLDS / ROS2 Bag) |
| Robot target (MVP) | Franka Emika Panda (7DoF) |
| Timeline MVP | 7 tuần |

---

## 2. Hiện Trạng

```
Frontend UI:    ████████░░  ~75%  ✅ 3D Viewport, Charts, Sliders, Drawer
Colab Backend:  ░░░░░░░░░░    0%  ❌ FastAPI, IK, Physics Engine, h5py
Overall:        ████░░░░░░  ~30%
```

---

## 3. Roadmap

### Sprint 0 — Foundation (Tuần 1)
| Task | Status |
|------|--------|
| Setup GitHub repo | ⬜ |
| Setup Vercel deploy | ⬜ |
| Colab + ngrok test | ⬜ |
| Review SRS & PM Plan | ✅ |

### Sprint 1 — Frontend Polish + API Wire (Tuần 2–3)
| Task | Status |
|------|--------|
| OrbitControls (drag/zoom/pan) | ⬜ |
| Joint sliders q1...q7 | ⬜ |
| Wire Run Step → `POST /api/step` | ⬜ |
| Latency display từ API response | ⬜ |
| ngrok URL config + localStorage | ⬜ |

### Sprint 2 — Colab Backend MVP (Tuần 3–4)
| Task | Status |
|------|--------|
| FastAPI server (port 8000, CORS) | ⬜ |
| `POST /api/step` endpoint | ⬜ |
| IK Solver (pinocchio / scipy) | ⬜ |
| Genesis hoặc MuJoCo CUDA | ⬜ |
| Trajectory buffer in-memory | ⬜ |

### Sprint 3 — Data Pipeline (Tuần 5–6)
| Task | Status |
|------|--------|
| Export LeRobot HDF5 (.h5) | ⬜ |
| Export RLDS converter | ⬜ |
| Export ROS2 Bag writer | ⬜ |
| Upload dataset → HuggingFace Hub | ⬜ |
| Import URDF → physics engine | ⬜ |

### Sprint 4 — QA & Release (Tuần 7)
| Task | Status |
|------|--------|
| User Testing (Chrome/Safari Mobile) | ⬜ |
| Integration Test (DevTools Network) | ⬜ |
| Data Validation (.h5 → h5py verify) | ⬜ |
| Financial Audit (0 VNĐ check) | ⬜ |
| Deploy Frontend → Vercel production | ⬜ |

---

## 4. Risk Register

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|-----------|
| Colab disconnect | 🔴 Cao | Auto-reconnect + checkpoint buffer |
| ngrok session timeout | 🔴 Cao | Restart script + webhook notify |
| Genesis CUDA ≠ Colab T4 | 🟡 Trung | Fallback sang MuJoCo CPU |
| Sim-to-Real gap | 🟡 Trung | Sensor noise + domain randomization |

---

## 5. Open Questions

> [!IMPORTANT]
> Cần xác nhận trước Sprint 2:

1. **Physics Engine:** Genesis hay MuJoCo?
2. **IK Solver:** pinocchio / scipy / roboticstoolbox?
3. **Wrist Cam:** Colab JPEG stream hay Three.js viewport only?
4. **Dataset Scale:** Bao nhiêu episodes là MVP đủ?
5. **Robot:** Chỉ Franka hay thêm UR5/xArm ngay MVP?

---

## 6. Acceptance Criteria

| # | Pass Condition |
|---|----------------|
| AC-1 | Frontend 3D viewport smooth, drawer không giật |
| AC-2 | API connectivity: slider → Colab → force response |
| AC-3 | Export .h5 đọc được bằng `h5py` |
| AC-4 | 0 VNĐ, không credit card |
| AC-5 | Latency ≤ 150ms qua ngrok |

---

*PhysiSim AI © 2026 — PM Plan v1.0*
