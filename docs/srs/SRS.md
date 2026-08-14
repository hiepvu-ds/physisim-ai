# PhysiSim AI — Software Requirements Specification (SRS)

> **Version:** v1.0 (MVP) | **Status:** Approved | **Language:** Tiếng Việt

---

## 1. Tổng Quan Dự Án

**PhysiSim AI** là nền tảng giả lập đa vật lý (Multi-Physics Simulation Platform) vận hành hoàn toàn trên điện toán đám mây. Sản phẩm cho phép các nhà nghiên cứu AI, kỹ sư Robotics sinh ra dữ liệu tổng hợp (Synthetic Data) để huấn luyện mô hình Physical AI / Embodied AI với **chi phí phần cứng bằng 0 (Zero-CAPEX)**.

### 1.1 Tầm Nhìn Sản Phẩm

| Bài toán (Pain Point) | Giải pháp PhysiSim AI |
|----------------------|----------------------|
| Dữ liệu thao tác 3D đắt đỏ, thu thập thủ công | Synthetic Data Generator — sinh hàng triệu samples có Ground Truth |
| CAPEX hardware $10k–$100k, dễ hỏng | Zero-CAPEX Cloud Simulation trên Colab GPU |
| Embodiment Gap: dữ liệu robot A ≠ robot B | Cross-Embodiment Engine qua URDF/MJCF mapping |
| Sim-to-Real Gap: model "vỡ" khi deploy | High-Fidelity Physics + Sensor Noise simulation |

### 1.2 Kiến Trúc Hệ Thống

```
[ Browser Client ]           [ Tunneling ]         [ Colab GPU T4 ]
  Three.js + Chart.js  ──→  ngrok/localtunnel  ──→  FastAPI + MuJoCo/Genesis
  Fetch API                  HTTPS tunnel             h5py Dataset Exporter
```

---

## 2. Yêu Cầu Chức Năng (FR)

### Module 1: 3D Viewport

| ID | Mô tả | Priority |
|----|-------|----------|
| FR-1.1 | Render mô hình 3D robot, vật thể thời gian thực bằng Three.js/WebGL | Must |
| FR-1.2 | Orbit, Zoom, Pan camera bằng chuột | Must |
| FR-1.3 | Grid floor, axes helper, ambient + directional lighting | Must |

### Module 2: Control Panel (6DoF)

| ID | Mô tả | Priority |
|----|-------|----------|
| FR-2.1 | Slider Cartesian X/Y/Z (meters) cho End-Effector | Must |
| FR-2.2 | Slider orientation Roll/Pitch/Yaw (degrees) | Must |
| FR-2.3 | Slider Gripper Close 0%–100% + force limit | Must |
| FR-2.4 | Button "Run Physics Step" gửi lệnh lên Colab | Must |
| FR-2.5 | Button "Reset Pose" về default | Should |
| FR-2.6 | Slider Joint Control q1...q7 (individual joints) | Should |

### Module 3: Telemetry

| ID | Mô tả | Priority |
|----|-------|----------|
| FR-3.1 | Wrist Cam RGB-D feed preview (640×480) | Must |
| FR-3.2 | Real-time Tactile Force Chart (Chart.js, rolling window 30s) | Must |
| FR-3.3 | End-Effector Pose display (X, Y, Z, Force readout) | Must |
| FR-3.4 | API Response Log (timestamp, latency, result) | Must |

### Module 4: Data Hub

| ID | Mô tả | Priority |
|----|-------|----------|
| FR-4.1 | Import: Drag-drop .urdf, .mjcf, .usd, .gltf, .h5, .json | Must |
| FR-4.2 | Export: LeRobot HDF5 (.h5) với progress bar | Must |
| FR-4.3 | Export: RLDS (Google DeepMind standard) | Should |
| FR-4.4 | Export: ROS2 Bag (.db3) | Could |
| FR-4.5 | Chọn channels: RGB-D, 6DoF Pose, Tactile Force, Joint Torques | Must |

### Module 5: Colab Backend

| ID | Mô tả | Priority |
|----|-------|----------|
| FR-5.1 | `GET /api/status` — health check với latency | Must |
| FR-5.2 | `POST /api/step` — IK solve + physics step + lưu trajectory | Must |
| FR-5.3 | `POST /api/export` — xuất trajectory buffer thành dataset file | Must |
| FR-5.4 | `DELETE /api/reset` — xóa buffer, reset session | Must |
| FR-5.5 | `GET /api/buffer` — metadata buffer hiện tại | Should |
| FR-5.6 | CORS enabled cho tất cả origins | Must |

---

## 3. Yêu Cầu Phi Chức Năng (NFR)

| ID | Hạng mục | Mục tiêu | Đo lường |
|----|----------|----------|----------|
| NFR-1.1 | Frontend FPS | ≥ 60 FPS (desktop), ≥ 30 FPS (mobile) | Chrome DevTools |
| NFR-1.2 | Backend throughput | > 1,000 FPS (headless simulation) | Colab benchmark |
| NFR-1.3 | API Latency | ≤ 150ms (ngrok tunnel round-trip) | DevTools Network |
| NFR-2.1 | Responsive | Mobile-First, hoạt động trên iPhone Safari | Manual test |
| NFR-3.1 | Zero-CAPEX | 0 VNĐ, không cần credit card | Financial audit |
| NFR-4.1 | Offline-capable | Frontend chạy offline (không cần backend để xem UI) | Open file:// |

---

## 4. API Contracts

Xem chi tiết tại: [API_REFERENCE.md](../api/API_REFERENCE.md)

### Endpoint chính: `POST /api/step`

**Request:**
```json
{ "pos_x": 0.0, "pos_y": 1.2, "pos_z": 0.0,
  "roll": 0.0, "pitch": 0.0, "yaw": 0.0, "gripper": 0.75 }
```

**Response:**
```json
{ "success": true, "end_effector_pose": [0.0, 1.2, 0.0],
  "joint_angles": [0.0, 24.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  "tactile_force": 2.63, "buffer_size": 43, "compute_ms": 3.14 }
```

---

## 5. Chiến Lược Deployment Zero-CAPEX

| Thành phần | Dịch vụ | Tier |
|------------|---------|------|
| Frontend Hosting | Vercel / Cloudflare Pages | Free |
| Backend Compute | Google Colab GPU T4 | Free |
| Network Tunnel | ngrok / localtunnel | Free |
| Model/Asset Storage | HuggingFace Hub / GitHub Releases | Free |
| Dataset Storage | HuggingFace Datasets | Free |

---

## 6. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

| # | Hạng mục | Pass Condition | Test Method |
|---|----------|----------------|-------------|
| AC-1 | Frontend UI | 3D Viewport mượt, Side Drawer không giật | Chrome/Safari Mobile |
| AC-2 | API Connectivity | Slider → Colab → Force response nhận được | DevTools Network tab |
| AC-3 | Import | Upload .json thành công, parser không crash | Data Validation |
| AC-4 | Export | File .h5 sinh ra, đọc được bằng `h5py` | `python -c "import h5py; h5py.File('out.h5')"` |
| AC-5 | Zero-CAPEX | Toàn bộ không phát sinh chi phí | Financial Audit |
| AC-6 | Performance | API latency ≤ 150ms qua ngrok | DevTools timing |

---

## 7. Lịch Sử Thay Đổi

| Version | Ngày | Thay đổi | Author |
|---------|------|---------|--------|
| v1.0 | 2026-08-13 | Initial SRS | BA / System Architect |
