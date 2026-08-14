/**
 * PhysiSim AI — Global Configuration
 * Chỉnh sửa file này để cấu hình Colab backend URL
 */

const CONFIG = {
  // Paste ngrok URL từ Colab vào đây (hoặc dùng UI input)
  // Ví dụ: "https://abcd-1234.ngrok-free.app"
  COLAB_API_URL: '',

  // API Endpoints
  ENDPOINTS: {
    step:        '/api/step',
    export:      '/api/export',
    import:      '/api/import',
    status:      '/api/status',
    reset:       '/api/reset',
  },

  // Simulation settings
  SIM: {
    maxSteps:       10000,
    autoSaveEvery:  100,    // episodes
    targetFPS:      60,
  },

  // Force chart settings
  CHART: {
    windowSize:   30,       // số điểm dữ liệu hiển thị
    maxForce:     10,       // Newton
    updateHz:     10,       // Hz
  },

  // Default robot pose
  DEFAULT_POSE: {
    x: 0.0, y: 1.2, z: 0.0,
    roll: 0, pitch: 0, yaw: 0,
    gripper: 0,
  },
};

// Lock object
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.SIM);
Object.freeze(CONFIG.DEFAULT_POSE);
