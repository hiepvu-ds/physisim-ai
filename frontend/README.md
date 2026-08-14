# PhysiSim AI — Frontend README

## Cấu Trúc

```
frontend/
├── index.html          # Entry point — 3-column WebGL UI
├── public/
│   └── assets/         # Static assets (icons, fonts offline)
└── src/
    ├── config.js       # ⚙️ Cấu hình URL Colab & settings
    ├── api.js          # 🔌 Colab REST API client
    ├── viewport.js     # 🎮 Three.js 3D viewport + robot mesh
    ├── telemetry.js    # 📊 Chart.js force chart + wrist cam canvas
    ├── controls.js     # 🎛️ Slider bindings → 3D viewport
    ├── drawer.js       # 📦 Import/Export side drawer
    ├── app.js          # 🚀 Entry point — initializes all modules
    └── styles.css      # 🎨 Dark cyberpunk theme
```

## Quick Start

1. **Mở trực tiếp:** Mở `index.html` bằng trình duyệt (Chrome/Edge recommended)
2. **Hoặc deploy lên Vercel:**
   ```bash
   # Kéo folder frontend/ vào vercel.com/new
   # Hoặc dùng CLI:
   npm i -g vercel && vercel .
   ```

## Kết Nối Colab Backend

1. Chạy notebook Colab → Lấy ngrok URL (ví dụ: `https://xxxx.ngrok-free.app`)
2. Paste URL vào ô input trên header của app
3. Click **🔌 Connect** → Đèn chuyển sang màu xanh

## Thêm Tính Năng Mới

Mỗi module là file JS riêng biệt. Để thêm tính năng:
- `viewport.js` — Thêm mesh robot khác, lighting, orbit controls
- `telemetry.js` — Thêm thêm chart (joint torques, velocity)
- `api.js` — Thêm endpoint mới
- `controls.js` — Thêm slider/button control mới
