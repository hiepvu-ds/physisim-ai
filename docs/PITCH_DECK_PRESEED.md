# PhysiSim AI — Pre-Seed Investor Pitch Deck (Bản Gọi Vốn)

> **Mục tiêu vòng gọi vốn:** Pre-Seed Round ($350,000 – $500,000 USD)  
> **Lĩnh vực:** Physical AI / Embodied AI / Synthetic Data / Robotics Simulation  
> **Định vị:** *The Zero-CAPEX Synthetic Data & Simulation Cloud for Physical AI*  

---

## 🎯 CẤU TRÚC 12 SLIDES GỌI VỐN CHUẨN QUỐC TẾ (VC FRAMEWORK)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  1. VISION   │  │ 2. PROBLEM   │  │ 3. SOLUTION  │  │  4. PRODUCT  │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 5. MKT SIZE  │  │ 6. BIZ MODEL │  │ 7. TRACTION  │  │  8. MOATS    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 9. TECH ARCH │  │ 10. GTM PLAN │  │ 11. TEAM     │  │ 12. THE ASK  │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

### 🌟 SLIDE 1: COVER & VISION
- **Title**: **PhysiSim AI**
- **Tagline**: The Zero-CAPEX Synthetic Data & Simulation Cloud for Physical AI.
- **One-Liner**: *Democratizing robot manipulation training by replacing $100,000 hardware labs with high-fidelity, browser-first cloud physics.*
- **Key Metrics Highlight**: 
  - ⚡ **60 FPS** WebGL Simulation in Browser
  - 💰 **0 VNĐ** Hardware CAPEX for Developers
  - 🤖 **Multi-Embodiment** (Franka, UR5e, xArm, Mobile Base)
  - 🤗 **Native Hugging Face LeRobot & DeepMind RLDS** format

---

### 🚨 SLIDE 2: THE PROBLEM (Hardware Bottleneck in Physical AI)
*Cuộc cách mạng Physical AI đang bị chặn đứng bởi nút thắt Dữ Liệu và Phần Cứng:*

1. **Hardware is Prohibitively Expensive & Fragile**:
   - Một cánh tay robot chuẩn nghiên cứu (Franka Panda / UR5e) tốn **$25,000 – $60,000 USD**.
   - Thử nghiệm dễ va đập gây gãy vỡ, chi phí bảo trì hàng ngàn USD.
2. **Teleoperation Data Collection is Slow & Unscalable**:
   - Thu thập thủ công 10,000 trajectories mất **6–12 tháng** với đội ngũ kỹ sư vận hành liên tục.
3. **The "Embodiment Gap" & "Sim-to-Real Gap"**:
   - Dữ liệu thu trên robot A không chạy được trên robot B.
   - Các môi trường mô phỏng nặng nề (Isaac Sim) đòi hỏi máy trạm RTX 4090/A100 đắt tiền và cài đặt phức tạp.

---

### 💡 SLIDE 3: OUR SOLUTION (PhysiSim AI)
*Nền tảng Giả lập Đa Vật lý Đám Mây & Sinh Dữ liệu Tổng hợp 1-Click:*

- 🌐 **Zero-CAPEX Access**: Chạy 100% trên trình duyệt Web, backend GPU đám mây (Google Colab / Cloud GPU), không cần máy tính cấu hình mạnh.
- 🏗️ **Procedural Scene Studio**: Xây dựng môi trường thao tác 3D đa ngành (Bệnh viện, Nhà máy, Trường học, Phòng Lab) trong vài phút với 35+ asset library.
- 📊 **Instant Synthetic Dataset Generation**: Tự động sinh hàng triệu mẫu dữ liệu có nhãn Ground Truth (6DoF pose, lực tiếp xúc tactile force, ảnh camera cổ tay RGB-D).
- 🔗 **Direct Pipeline to AI Training**: Xuất trực tiếp sang **Hugging Face LeRobot**, **Google DeepMind RLDS**, **ROS2 Bag** và train Behavioral Cloning / Diffusion Policy ngay trên Cloud.

---

### 📱 SLIDE 4: PRODUCT DEMO & CORE FEATURES
*Sản phẩm đã hoàn thiện và chạy thực tế (Production-Ready MVP):*

| Tính Năng Cốt Lõi | Giá Trị Mang Lại |
|-------------------|------------------|
| **🎮 Simulation Studio** | Điều khiển 6DoF Cartesian + Joint space, đo lực Tactile Force & stream Wrist Cam thời gian thực. |
| **🏗️ Dedicated Scene Studio** | Thư viện 35+ vật thể 3D procedural (School, Hospital, Factory, Lab, Archi, Shapes) kèm Deep Inspector. |
| **🤖 Cross-Embodiment System** | Hỗ trợ Franka Panda 7DoF, UR5e 6DoF, Mobile Base + Arm và import custom URDF/MJCF. |
| **🧠 Policy Rollout & Replay** | Huấn luyện BC/Diffusion policy, chạy rollout tự động với Domain Randomization, tua timeline 3D ghosting. |
| **🛡️ Persistent Cloud Storage** | Gắn kết Google Drive + Hugging Face Hub Auto-sync, không bao giờ mất dữ liệu. |

---

### 📈 SLIDE 5: MARKET OPPORTUNITY (TAM / SAM / SOM)
*Sự bùng nổ của Physical AI, Robot hình người (Humanoid) và Tự động hóa thông minh:*

- **TAM ($28.5B by 2030)**: Toàn bộ thị trường Robotics Simulation, Synthetic Data Generation và Physical AI Tooling.
- **SAM ($4.8B)**: Thị trường dữ liệu huấn luyện AI cho Robot Manipulation và AI Agents công nghiệp/y tế.
- **SOM ($180M trong 3 năm đầu)**: 50,000+ nhà nghiên cứu robotics, AI labs trường đại học, startup AI và SME công nghiệp chế tạo.

> *"Synthetic Data will account for over 60% of all data used for AI training by 2026." — Gartner Research*

---

### 💰 SLIDE 6: BUSINESS MODEL & MONETIZATION
*Mô hình Doanh Thu Đa Tầng (Product-Led Growth & SaaS):*

1. **Freemium Tier ($0 / month)**:
   - Truy cập Web Studio miễn phí, chạy backend Colab GPU T4, lưu trữ Google Drive, xuất LeRobot/RLDS dataset.
   - *Mục tiêu:* Thu hút hàng chục ngàn developer, sinh viên và researcher toàn cầu.
2. **Pro Tier ($49 / month)**:
   - Cung cấp Cloud GPU cluster chuyên dụng (không bị timeout), sinh dữ liệu tốc độ cao 10,000+ FPS, private HuggingFace sync.
3. **Enterprise / API Tier ($1,500 – $10,000 / month)**:
   - Custom Robot Embodiment CAD/URDF ingestion.
   - Domain-specific synthetic datasets (Dây chuyền sản xuất bán dẫn, bệnh viện phẫu thuật, kho tự động).
   - On-Premise GPU cluster deployment & SLA support.

---

### 🚀 SLIDE 7: TRACTION & MILESTONES
- ✅ **MVP Hoàn Thiện 100%**: 24/24 Backend Unit Tests PASSED (`pytest`).
- ✅ **WebGL 60 FPS Engine**: Hoạt động mượt mà trên Chrome, Safari, Edge không cần cài plugin.
- ✅ **Pipeline Chuẩn Quốc Tế**: Tích hợp trực tiếp Hugging Face LeRobot, DeepMind RLDS, MuJoCo CUDA Physics.
- ✅ **Zero-CAPEX Stack Đã Kiểm Chứng**: Google Colab T4 + Google Drive persistent storage + Cloudflare Tunnel.

---

### 🛡️ SLIDE 8: COMPETITIVE ADVANTAGE (OUR MOATS)

| Tiêu Chí So Sánh | Nvidia Isaac Sim | Webots / Gazebo | **PhysiSim AI** |
|------------------|-------------------|-----------------|-----------------|
| **Chi phí phần cứng** | Yêu cầu RTX GPU ($3,000+) | Cài đặt local phức tạp | **0 VNĐ (Chạy trên Web)** |
| **Thời gian setup** | 2–4 giờ cài Omniverse | 1–2 giờ build Linux | **10 giây (Mở URL là chạy)** |
| **Tích hợp Hugging Face** | Không có sẵn | Không có | **1-Click Auto Sync** |
| **Định dạng Physical AI** | USD / Custom format | ROS / C++ | **LeRobot HDF5 + RLDS** |
| **Dựng cảnh Procedural** | Thủ công bằng USD Composer | File text URDF | **Thư viện 35+ Object trực quan** |

---

### 🏗️ SLIDE 9: TECHNICAL ARCHITECTURE
*Kiến trúc Cloud-Native, Decoupled & Siêu Nhẹ:*

```
[ FRONTEND ] SPA Three.js WebGL (60 FPS) + Chart.js Telemetry + Vanilla CSS Tokens
     │
     │ REST API / WebSockets / Cloudflare Tunnel
     ▼
[ BACKEND ] FastAPI Microservice + MuJoCo Physics Solver + DH Kinematics + Offscreen RGB-D
     │
     ├── Google Drive Storage (Persistent .h5 Datasets)
     └── Hugging Face Hub (Community Datasets & Trained Policies)
```

---

### 🎯 SLIDE 10: GO-TO-MARKET (GTM) STRATEGY
*Chiến lược tăng trưởng Bottom-Up từ Cộng đồng AI:*

1. **Phase 1: Open Ecosystem & AI Hackathons (Tháng 1–6)**:
   - Phát hành open playground cho cộng đồng Hugging Face LeRobot, Discord Robotics, ROS community.
   - Hợp tác với 10+ phòng lab robotics tại các trường đại học hàng đầu.
2. **Phase 2: Self-Serve Pro Cloud (Tháng 6–12)**:
   - Ra mắt gói Pro GPU Cloud 1-click không giới hạn thời gian.
3. **Phase 3: B2B Enterprise Synthetic Data Sales (Năm 2)**:
   - Cung cấp giải pháp synthetic data cho các hãng sản xuất robot công nghiệp và logistics.

---

### 👥 SLIDE 11: TEAM & FOUNDERS
*Đội ngũ kết hợp giữa Kỹ thuật Robotics, AI Engineering và Tăng trưởng Sản phẩm:*

- **Founder & Lead AI Robotics Engineer**: Chuyên gia thiết kế hệ thống phần mềm, am hiểu sâu sắc về Kinematics, MuJoCo, Three.js và Imitation Learning.
- **Advisors**: Các chuyên gia đầu ngành trong lĩnh vực Computer Vision, Autonomous Manipulation và AI Venture Capital.

---

### 💵 SLIDE 12: THE ASK & FUND USE (VÒNG GỌI VỐN PRE-SEED)

- **Số Vốn Gọi**: **$350,000 – $500,000 USD** (SAFE Note / Equity).
- **Mục Tiêu Đạt Được Trong 18 Tháng**:
  - Đạt **25,000 Active Developers** & **500+ Paying Pro Users**.
  - Xây dựng kho **1,000+ Procedural 3D Industrial Assets** & **50+ Robot Embodiments**.
  - Đạt **$30,000 MRR (Monthly Recurring Revenue)**.

#### Phân Bổ Nguồn Vốn (Use of Funds):
```
┌─────────────────────────────────────────────────────────────┐
│  ■ 50% R&D & Core Engineering (Physics, Diffusion Sim-to-Real)
│  ■ 25% GPU Cloud Infrastructure (Server clusters & bandwidth)
│  ■ 15% Developer Relations, Community & GTM Hackathons
│  ■ 10% Legal, Operations & Contingency
└─────────────────────────────────────────────────────────────┘
```

---

## 📞 LIÊN HỆ ĐẦU TƯ (INVESTOR CONTACT)
- **Dự án**: PhysiSim AI
- **Website Demo**: [https://physisim-ai.vercel.app](https://physisim-ai.vercel.app)
- **GitHub Repository**: [https://github.com/your-username/physisim-ai](https://github.com/your-username/physisim-ai)
- **Email**: contact@physisim.ai
