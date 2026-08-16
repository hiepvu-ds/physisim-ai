# PhysiSim AI — Tài Liệu Đặc Tả Chức Năng Cốt Lõi (Functional Specification v2.0)

> **Dự án:** PhysiSim AI — Nền Tảng Giả Lập Đa Vật Lý & Sinh Dữ Liệu Physical AI Đám Mây  
> **Phiên bản:** v2.0 (Full Platform)  
> **Trạng thái:** Production Ready  

---

## 📑 MỤC LỤC
1. [Tổng Quan Nền Tảng](#1-tổng-quan-nền-tảng)
2. [Phân Hệ 1: Simulation Studio & Robot Control](#2-phân-hệ-1-simulation-studio--robot-control)
3. [Phân Hệ 2: Dedicated Scene Studio & Thư Viện 3D](#3-phân-hệ-2-dedicated-scene-studio--thư-viện-3d)
4. [Phân Hệ 3: Deep Object Inspector & Physics Tuning](#4-phân-hệ-3-deep-object-inspector--physics-tuning)
5. [Phân Hệ 4: Trình Quản Lý Cảnh & Persistence](#5-phân-hệ-4-trình-quản-lý-cảnh--persistence)
6. [Phân Hệ 5: Hệ Thống Đa Robot (Cross-Embodiment)](#6-phân-hệ-5-hệ-thống-đa-robot-cross-embodiment)
7. [Phân Hệ 6: AI Policy Training & Timeline Replay](#7-phân-hệ-6-ai-policy-training--timeline-replay)
8. [Phân Hệ 7: Data Hub & Hugging Face Hub Auto-Sync](#8-phân-hệ-7-data-hub--hugging-face-hub-auto-sync)
9. [Phân Hệ 8: Zero-CAPEX Cloud Stack (Colab + Drive + Docker)](#9-phân-hệ-8-zero-capex-cloud-stack-colab--drive--docker)

---

## 1. Tổng Quan Nền Tảng

**PhysiSim AI** giải quyết nút thắt lớn nhất của ngành **Physical AI / Embodied AI**: *Sự khan hiếm và đắt đỏ của dữ liệu thao tác thực tế (Real-world Robot Teleoperation Data)*.

Nền tảng cho phép kỹ sư AI, nhà nghiên cứu robotics và doanh nghiệp:
- Dựng môi trường 3D đa ngành (Trường học, Bệnh viện, Nhà máy, Phòng Lab).
- Điều khiển robot ảo, sinh hàng triệu mẫu dữ liệu có nhãn Ground Truth (RGB-D, 6DoF Pose, Lực tiếp xúc Tactile Force, Joint Torques).
- Huấn luyện mô hình Behavioral Cloning / Diffusion Policy trên GPU đám mây.
- Xuất dữ liệu chuẩn quốc tế (**LeRobot HDF5, Google DeepMind RLDS, ROS2 Bag**) và đồng bộ lên **Hugging Face Hub** với chi phí **0 VNĐ (Zero-CAPEX)**.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                             WEB FRONTEND (SPA)                             │
│  Three.js 3D WebGL (60 FPS) ── Chart.js Telemetry ── Scene Studio 35+ Objs │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ REST API / ngrok / Cloudflare Tunnel
┌─────────────────────────────────────▼──────────────────────────────────────┐
│                        BACKEND GPU ENGINE (FastAPI)                        │
│   MuJoCo CUDA Physics ── DH Forward Kinematics ── Offscreen RGB-D Render   │
└──────────────────┬──────────────────────────────────────────┬──────────────┘
                   │                                          │
┌──────────────────▼───────────────────┐    ┌─────────────────▼──────────────┐
│  Google Drive (Persistent Storage)   │    │  Hugging Face Hub Dataset Hub  │
│  Lưu dataset .h5 & policy checkpoint │    │  Chia sẻ cộng đồng & AI models │
└──────────────────────────────────────┘    └────────────────────────────────┘
```

---

## 2. Phân Hệ 1: Simulation Studio & Robot Control

### 2.1 Điều Khiển Không Gian Cartesian (6DoF End-Effector)
- **Position ($X, Y, Z$)**: Điều khiển vị trí đầu gắp trong phạm vi $[-2.0\text{ m}, +2.0\text{ m}]$ với bước nhảy $0.01\text{ m}$.
- **Orientation (Euler RPY)**: Điều khiển góc xoay $\text{Roll } [-180^\circ, +180^\circ]$, $\text{Pitch } [-180^\circ, +180^\circ]$, $\text{Yaw } [-180^\circ, +180^\circ]$.
- **Gripper State**: Độ đóng/mở tay gắp $0\% - 100\%$ kèm mô phỏng lực kẹp đàn hồi.

### 2.2 Điều Khiển Không Gian Khớp (Joint Space Control)
- Hỗ trợ điều khiển độc lập từng khớp từ $q_1 \dots q_7$ (Shoulder Pan, Shoulder Lift, Upper Arm Roll, Elbow Flex, Forearm Roll, Wrist Pitch, Wrist Flange) theo đúng giới hạn vật lý của Franka Emika Panda và UR5e.
- Nút **"↺ Reset Joints"** đưa robot về cấu hình tĩnh an toàn.

### 2.3 Đo Đạc Cảm Biến Thời Gian Thực (Telemetry)
- **Tactile Force Chart (Chart.js)**: Đồ thị lực tiếp xúc thời gian thực (rolling window 30 điểm đo), hiển thị lực va chạm và lực ma sát khi kẹp vật thể.
- **Wrist Cam RGB-D Live Stream**: Stream hình ảnh từ camera gắn trên cổ tay robot, kết xuất từ MuJoCo offscreen renderer (độ phân giải $280\times140$, tần số cập nhật theo step vật lý).
- **Joint Angles Bar Readout**: 7 thanh đo IK result với màu gradient Cyan phát sáng.

---

## 3. Phân Hệ 2: Dedicated Scene Studio & Thư Viện 3D

Trang quản lý và dựng cảnh chuyên nghiệp toàn màn hình với **35+ đối tượng hình học 3D procedural**:

### 🏫 Danh Mục 1: Trường Học (School)
- **Student Desk**: Bàn học sinh khung kim loại mặt gỗ.
- **Student Chair**: Ghế học sinh kèm tựa lưng cong.
- **Teacher Desk**: Bàn giáo viên kích thước lớn kèm ngăn kéo.
- **Blackboard**: Bảng xanh viết phấn khung nhôm.
- **Bookshelf**: Giá sách 3 tầng.
- **Projector**: Máy chiếu trần.
- **Laptop**: Máy tính xách tay mở góc $110^\circ$.
- **Backpack**: Cặp sách học sinh.
- **Book Pile**: Chồng sách nhiều màu.

### 🏥 Danh Mục 2: Bệnh Viện (Hospital)
- **Hospital Bed**: Giường bệnh nhân có đệm y tế và gối.
- **Patient Monitor**: Máy đo nhịp tim phát sáng màn hình LED.
- **IV Stand**: Trụ truyền dịch inox có 2 bình dung dịch.
- **Medical Trolley**: Xe đẩy tiêm thuốc 2 tầng có bánh xe.
- **Surgical Lamp**: Đèn mổ phẫu thuật treo trần.
- **Stretcher**: Cáng cứu thương gập.
- **Medicine Cabinet**: Tủ thuốc y tế có kính trong suốt.

### 🏭 Danh Mục 3: Nhà Máy & Kho Hàng (Factory)
- **Conveyor Belt**: Băng chuyền công nghiệp có ray dẫn hướng và chân đỡ.
- **Wooden Pallet**: Pallet gỗ kê hàng tiêu chuẩn EU.
- **Heavy Warehouse Rack**: Kệ kho hàng 3 tầng chịu tải nặng.
- **Cargo Box**: Thùng carton đóng gói hàng hóa.
- **Chemical Drum**: Thùng phi hóa chất xanh chống rỉ.
- **Hand Forklift**: Xe nâng tay (Pallet Jack) cơ khí.
- **Safety Fence**: Hàng rào lưới bảo vệ vùng làm việc của robot.

### 🧪 Danh Mục 4: Phòng Thí Nghiệm & Bếp (Lab & Kitchen)
- **Lab Workbench**: Bàn thí nghiệm mặt đá chống acid.
- **Microscope**: Kính hiển vi quang học có thị kính và mâm xoay.
- **Centrifuge**: Máy ly tâm tách mẫu.
- **Test Tube Rack**: Giá cắm 5 ống nghiệm hóa học đa sắc.
- **Kitchen Counter**: Quầy bếp mặt đá có bồn rửa.
- **Refrigerator**: Tủ lạnh bảo quản 2 cánh.

### 🧱 Danh Mục 5: Kiến Trúc & Vách Ngăn (Architecture)
- **Wall Plain**: Tường bê tông nguyên khối.
- **Window Wall**: Tường có khoét khung cửa sổ kính.
- **Door Frame**: Khung cửa phòng mở rộng.
- **Glass Divider**: Vách kính cách ly trong suốt.
- **Pillar Column**: Cột trụ chịu lực hình vuông/tròn.

### 📐 Danh Mục 6: Hình Học Cơ Bản (Shapes)
- **Cube Box**: Khối hộp tham số $W \times H \times D$.
- **Sphere**: Khối cầu bán kính $R$.
- **Cylinder**: Khối trụ tròn.
- **Capsule**: Khối con nhộng (đầu bo tròn).
- **Cone**: Khối nón chóp.

---

## 4. Phân Hệ 3: Deep Object Inspector & Physics Tuning

Khi chọn bất kỳ vật thể nào trong không gian 3D, panel Inspector hiển thị chi tiết:

1. **Biến đổi Hình học (Transforms)**:
   - Tọa độ vị trí: $X, Y, Z$ (m).
   - Tỷ lệ kích thước: $Sx, Sy, Sz$ (Scale factor).
   - Góc xoay Euler: $Rx, Ry, Rz$ ($^\circ$).
2. **Vật liệu Trực quan (Visual Materials)**:
   - Color Picker đổi màu tức thì.
   - 7 Preset vật liệu chuẩn:
     - 🔩 **Metal (Kim loại)**: Roughness 0.2, Metalness 0.9.
     - 🧴 **Plastic ABS (Nhựa)**: Roughness 0.4, Metalness 0.1.
     - 🪵 **Wood (Gỗ)**: Roughness 0.8, Warm color.
     - 🧊 **Glass (Kính trong suốt)**: Opacity 0.35, Transparent.
     - ⬛ **Rubber (Cao su)**: Roughness 0.9, Dark friction.
     - 🧱 **Concrete (Bê tông)**: Roughness 0.95.
     - 🧵 **Fabric (Vải nỉ)**: Roughness 1.0.
3. **Động lực học & Vật lý (Physics Properties)**:
   - Khối lượng $m$ ($0.05\text{ kg} - 500\text{ kg}$).
   - Hệ số ma sát $\mu$ ($0.01 - 2.0$).
   - Hệ số đàn hồi $e$ ($0.0 - 1.0$).
   - **Static Weld**: Cố định vật thể vào sàn/tường (không bị rơi do trọng lực).
   - **Sensor Collision**: Chế độ cảm biến ảo (không cản trở di chuyển).
4. **MuJoCo MJCF Code Generator**:
   - Tự động sinh thẻ XML `<geom .../>` và `<body ...>` chuẩn MuJoCo để nhúng vào file huấn luyện.

---

## 5. Phân Hệ 4: Trình Quản Lý Cảnh & Persistence

- **Template Có Sẵn (Built-in Presets)**:
  - 🏫 *Modern Classroom*: Bàn giáo viên, bảng, 4 bộ bàn ghế học sinh.
  - 🏥 *Hospital ICU Room*: Giường bệnh, máy monitor, trụ truyền dịch, tủ thuốc.
  - 🏭 *Automated Factory Cell*: Băng chuyền, kệ kho hàng, pallet, thùng phi, rào an toàn.
  - 🧪 *Biochemical Lab*: Bàn thí nghiệm, kính hiển vi, máy ly tâm, giá ống nghiệm.
- **LocalStorage Scene Persistence**:
  - Lưu và nạp không giới hạn các cảnh do người dùng tự dựng.
- **Export Toàn Cảnh**:
  - `📄 Xuất MuJoCo XML (.mjcf.xml)`: File mô tả toàn bộ cấu trúc vật lý, ánh sáng và sàn.
  - `📥 Xuất JSON (.json)`: File sao lưu toàn bộ thuộc tính đối tượng.

---

## 6. Phân Hệ 5: Hệ Thống Đa Robot (Cross-Embodiment)

Hỗ trợ chuyển đổi và đặt nhiều robot trong cùng một môi trường:
- 🦾 **Franka Emika Panda**: Cánh tay robot 7 bậc tự do (7DoF), chuẩn công nghiệp và nghiên cứu AI Manipulation.
- 🤖 **Universal Robots UR5e**: Cánh tay robot công nghiệp 6 bậc tự do (6DoF).
- ⚙️ **xArm 7**: Robot 7DoF hiệu năng cao.
- 🚚 **Mobile Manipulator**: Robot di động kết hợp chân đế Omni-wheel và cánh tay gắp.
- 📥 **Custom URDF / MJCF Robot Importer**:
  - Endpoint `POST /api/import/urdf` phân tích cấu trúc XML URDF, trích xuất danh sách khớp, giới hạn góc quay và liên kết hình học.

---

## 7. Phân Hệ 6: AI Policy Training & Timeline Replay

1. **Training Behavioral Cloning / Diffusion Policy**:
   - `POST /api/train/bc`: Huấn luyện mô hình mạng nơ-ron (MLP / Diffusion) từ buffer quỹ đạo đã thu thập.
2. **Policy Rollout Simulation**:
   - `POST /api/policy/rollout`: Cho phép mô hình AI tự điều khiển robot thực hiện các nhiệm vụ:
     - 📦 *Pick and Place*: Gắp vật thể từ vị trí A sang vị trí B.
     - 🏭 *Conveyor Sorting*: Phân loại hàng trên băng chuyền.
     - 💊 *Medical Vial Handling*: Thao tác với lọ thuốc phòng lab.
   - Hỗ trợ **Domain Randomization**: Thêm nhiễu ngẫu nhiên vào vị trí mục tiêu và cảm biến để tăng tính tổng quát hóa (Sim-to-Real).
3. **Visual Timeline Replay & Ghosting**:
   - Replay từng frame chuyển động của robot với thanh tua timeline.
   - Vẽ vệt đường cong quỹ đạo (Trajectory Ribbon) 3D phát sáng và bóng mờ (Ghosting) vị trí trước/sau.

---

## 8. Phân Hệ 7: Data Hub & Hugging Face Hub Auto-Sync

- **Các Định Dạng Xuất Chuẩn Quốc Tế**:
  - 🤗 **LeRobot HDF5 (`.h5`)**: Định dạng chuẩn của Hugging Face LeRobot dành cho huấn luyện Imitation Learning / ACT / Diffusion Policy.
  - 🧠 **RLDS (`.jsonl`)**: Chuẩn dữ liệu Reinforcement Learning của Google DeepMind (Open X-Embodiment dataset format).
  - 🤖 **ROS2 Message Bag (`.json`)**: Định dạng tương thích với ROS2 và Foxglove Studio / Webviz.
- **Hugging Face Hub 1-Click Upload (`POST /api/upload/hf`)**:
  - Tự động tạo Dataset repository trên Hugging Face.
  - Tải file `.h5` lên cloud Hugging Face ngay khi xuất dữ liệu hoặc theo dõi thư mục tự động.

---

## 9. Phân Hệ 8: Zero-CAPEX Cloud Stack (Colab + Drive + Docker)

- **Google Colab GPU T4 (`physisim_colab.ipynb`)**:
  - 1-Click cài đặt môi trường, chạy MuJoCo GPU solver hoàn toàn miễn phí.
  - Tự động mở đường truyền **Cloudflare Quick Tunnel** (không cần token) hoặc **ngrok**.
- **Google Drive Persistent Storage**:
  - Tự động mount `/content/drive/MyDrive/PhysiSim_AI/datasets/` $\rightarrow$ **Không bao giờ bị mất file khi Colab ngắt kết nối**.
- **Docker Production Deployment**:
  - Cung cấp sẵn `Dockerfile` (CUDA 12.2 + OpenGL/EGL) và `docker-compose.yml` để deploy lên RunPod, Vast.ai, AWS, GCP hoặc server On-Prem.
