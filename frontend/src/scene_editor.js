/**
 * PhysiSim AI — Comprehensive Scene Studio & Environment Engine
 * Supports Multi-Environment Builder (School, Hospital, Factory, Lab, Architecture, Shapes),
 * Deep Object Inspector, Physics/Material tuning, Scene Persistence, Multi-Robot Placement,
 * and Realtime Environment Modulation.
 */

/* ════════════════════════════════════════════════
   SCENE & APP STATE
   ════════════════════════════════════════════════ */
let currentAppMode = 'simulation'; // 'simulation' | 'scene_studio'
const SCENE_REGISTRY = [];         // Array of { id, name, type, category, mesh, params, physics }
let selectedObjectId = null;
let currentActiveEnvKey = 'grid';
let activeStudioCategory = 'school';
let studioTransformSnap = 0.05;    // Grid snap in meters

/* ════════════════════════════════════════════════
   GLOBAL ENVIRONMENT & PHYSICS MODULATION STATE
   ════════════════════════════════════════════════ */
const ENV_STATE = {
  gravityPreset: 'earth', // 'earth' | 'moon' | 'mars' | 'zero_g' | 'jupiter' | 'custom'
  gravityVal: -9.81,
  lightingPreset: 'daylight', // 'daylight' | 'neon' | 'hospital' | 'factory' | 'sunset' | 'night'
  floorPreset: 'dark_grid',   // 'dark_grid' | 'hospital_tile' | 'factory_epoxy' | 'wood_floor' | 'clean_white'
  surfaceFriction: 0.6,
  domainRandomization: false,
  sensorNoiseLevel: 0.02
};

/* ════════════════════════════════════════════════
   MATERIAL PRESETS
   ════════════════════════════════════════════════ */
const MATERIAL_PRESETS = {
  metal:    { label: '🔩 Metal (Thép/Nhôm)', mass: 7.8, friction: 0.45, restitution: 0.1,  metalness: 0.9,  roughness: 0.2, color: '#94a3b8' },
  plastic:  { label: '🧴 Plastic (Nhựa ABS)', mass: 1.2, friction: 0.60, restitution: 0.3,  metalness: 0.1,  roughness: 0.6, color: '#38bdf8' },
  wood:     { label: '🪵 Wood (Gỗ Tự Nhiên)', mass: 0.6, friction: 0.70, restitution: 0.15, metalness: 0.0,  roughness: 0.8, color: '#b45309' },
  glass:    { label: '🍶 Glass (Kính Cường Lực)', mass: 2.5, friction: 0.35, restitution: 0.4,  metalness: 0.2,  roughness: 0.05,color: '#bae6fd', transparent: true, opacity: 0.7 },
  rubber:   { label: '🏀 Rubber (Cao Su)',   mass: 1.5, friction: 0.95, restitution: 0.75, metalness: 0.0,  roughness: 0.9, color: '#1e293b' },
  concrete: { label: '🧱 Concrete (Bê Tông)', mass: 2.4, friction: 0.85, restitution: 0.05, metalness: 0.05, roughness: 0.95,color: '#64748b' },
  fabric:   { label: '🧸 Fabric (Vải Y Tế)',  mass: 0.3, friction: 0.80, restitution: 0.02, metalness: 0.0,  roughness: 1.0, color: '#f59e0b' },
};

/* ════════════════════════════════════════════════
   ROBOT DEFINITIONS & PRESETS
   ════════════════════════════════════════════════ */
const ROBOT_PRESETS = {
  franka: {
    label: 'Franka Emika Panda', dof: 7, payload: '3 kg', reach: '855 mm',
    icon: '🦾', color: 0xffffff,
    description: '7-DoF research arm chuẩn quốc tế cho thao tác chính xác',
    defaultBase: { x: 0.0, y: 0.0, z: 0.0 },
    joints: [-166,166, -101,101, -166,166, -176,-4, -166,166, -1,215, -166,166],
  },
  ur5: {
    label: 'Universal Robots UR5e', dof: 6, payload: '5 kg', reach: '850 mm',
    icon: '🤖', color: 0x0096d6,
    description: '6-DoF robot cộng tác công nghiệp hàng đầu thế giới',
    defaultBase: { x: 0.0, y: 0.0, z: 0.0 },
    joints: [-360,360, -360,360, -360,360, -360,360, -360,360, -360,360],
  },
  xarm7: {
    label: 'UFACTORY xArm 7', dof: 7, payload: '3.5 kg', reach: '700 mm',
    icon: '⚙️', color: 0x00b4d8,
    description: '7-DoF tốc độ cao tích hợp camera và gripper điện tử',
    defaultBase: { x: 0.0, y: 0.0, z: 0.0 },
    joints: [-360,360, -130,130, -360,360, -11,225, -360,360, -97,180, -360,360],
  },
  mobile_manipulator: {
    label: 'AGV Mobile Base + Arm', dof: 9, payload: '10 kg', reach: 'Mobile',
    icon: '🚚', color: 0xf59e0b,
    description: 'Robot di động tự hành kết hợp cánh tay bốc dỡ hàng',
    defaultBase: { x: 0.0, y: 0.0, z: 0.0 },
    joints: [-360,360, -360,360, -360,360, -180,180, -180,180, -180,180, -180,180],
  },
};

let currentRobot = 'franka';
let ROBOT_REGISTRY = []; // Multi-robot instances in the scene
let activeRobotId = null;

/* ════════════════════════════════════════════════
   COMPREHENSIVE OBJECT LIBRARY (35+ ITEMS)
   ════════════════════════════════════════════════ */
const OBJECT_LIBRARY = {
  school: {
    categoryLabel: '🏫 Trường Học (School)',
    items: [
      { id: 'student_desk', label: 'Bàn Học Sinh', icon: '🪑', defaultDim: [0.7, 0.75, 0.5], matKey: 'wood',
        builder: () => buildCompoundDesk(0.7, 0.75, 0.5, 0xb45309) },
      { id: 'student_chair', label: 'Ghế Học Sinh', icon: '💺', defaultDim: [0.45, 0.8, 0.45], matKey: 'plastic',
        builder: () => buildCompoundChair(0.45, 0.8, 0.45, 0x38bdf8) },
      { id: 'teacher_desk', label: 'Bàn Giáo Viên', icon: '🧑‍🏫', defaultDim: [1.4, 0.8, 0.7], matKey: 'wood',
        builder: () => buildCompoundDesk(1.4, 0.8, 0.7, 0x78350f) },
      { id: 'blackboard', label: 'Bảng Lớp Học', icon: '📋', defaultDim: [2.2, 1.2, 0.08], matKey: 'concrete',
        builder: () => buildBlackboard(2.2, 1.2, 0.08) },
      { id: 'bookshelf', label: 'Kệ Sách Lớp', icon: '📚', defaultDim: [1.0, 1.8, 0.35], matKey: 'wood',
        builder: () => buildBookshelf(1.0, 1.8, 0.35) },
      { id: 'projector', label: 'Máy Chiếu & Bục', icon: '📽️', defaultDim: [0.4, 1.0, 0.4], matKey: 'metal',
        builder: () => buildProjectorPillar(0.4, 1.0, 0.4) },
      { id: 'laptop', label: 'Laptop Học Tập', icon: '💻', defaultDim: [0.32, 0.18, 0.24], matKey: 'metal',
        builder: () => buildLaptop(0.32, 0.18, 0.24) },
      { id: 'backpack', label: 'Cặp Sách Học Sinh', icon: '🎒', defaultDim: [0.3, 0.4, 0.2], matKey: 'fabric',
        builder: () => buildBackpack(0.3, 0.4, 0.2) },
      { id: 'book_pile', label: 'Chồng Sách Vở', icon: '📖', defaultDim: [0.25, 0.12, 0.2], matKey: 'wood',
        builder: () => buildBookPile(0.25, 0.12, 0.2) },
    ]
  },
  hospital: {
    categoryLabel: '🏥 Bệnh Viện (Hospital)',
    items: [
      { id: 'hospital_bed', label: 'Giường Bệnh Viện', icon: '🛏️', defaultDim: [1.1, 0.8, 2.2], matKey: 'metal',
        builder: () => buildHospitalBed(1.1, 0.8, 2.2) },
      { id: 'patient_monitor', label: 'Máy Monitor Tim Mạch', icon: '📈', defaultDim: [0.45, 1.5, 0.45], matKey: 'plastic',
        builder: () => buildPatientMonitor(0.45, 1.5, 0.45) },
      { id: 'iv_stand', label: 'Trụ Truyền Dịch IV', icon: '💉', defaultDim: [0.4, 1.8, 0.4], matKey: 'metal',
        builder: () => buildIVStand(0.4, 1.8, 0.4) },
      { id: 'med_trolley', label: 'Xe Đẩy Thuốc & Tiêm', icon: '🛒', defaultDim: [0.6, 0.9, 0.45], matKey: 'metal',
        builder: () => buildMedTrolley(0.6, 0.9, 0.45) },
      { id: 'surgical_lamp', label: 'Đèn Mổ Phẫu Thuật', icon: '💡', defaultDim: [0.6, 2.1, 0.6], matKey: 'metal',
        builder: () => buildSurgicalLamp(0.6, 2.1, 0.6) },
      { id: 'stretcher', label: 'Cáng Cứu Thương', icon: '🚑', defaultDim: [0.7, 0.65, 2.0], matKey: 'metal',
        builder: () => buildStretcher(0.7, 0.65, 2.0) },
      { id: 'medicine_cabinet', label: 'Tủ Thuốc Kính', icon: '🗄️', defaultDim: [0.8, 1.7, 0.4], matKey: 'glass',
        builder: () => buildMedicineCabinet(0.8, 1.7, 0.4) },
    ]
  },
  factory: {
    categoryLabel: '🏭 Nhà Máy & Kho Bãi (Factory)',
    items: [
      { id: 'conveyor_belt', label: 'Băng Chuyền Sản Xuất', icon: '🏭', defaultDim: [2.5, 0.8, 0.65], matKey: 'metal',
        builder: () => buildConveyorBelt(2.5, 0.8, 0.65) },
      { id: 'wooden_pallet', label: 'Pallet Gỗ Xếp Hàng', icon: '🪵', defaultDim: [1.2, 0.15, 1.0], matKey: 'wood',
        builder: () => buildWoodenPallet(1.2, 0.15, 1.0) },
      { id: 'warehouse_rack', label: 'Kệ Kho Hàng Cao Tầng', icon: '🏬', defaultDim: [2.0, 2.4, 0.8], matKey: 'metal',
        builder: () => buildWarehouseRack(2.0, 2.4, 0.8) },
      { id: 'cargo_box', label: 'Thùng Hàng Carton', icon: '📦', defaultDim: [0.4, 0.35, 0.4], matKey: 'wood',
        builder: () => buildCargoBox(0.4, 0.35, 0.4) },
      { id: 'chemical_drum', label: 'Thùng Phi Hóa Chất', icon: '🛢️', defaultDim: [0.6, 0.9, 0.6], matKey: 'metal',
        builder: () => buildChemicalDrum(0.6, 0.9, 0.6) },
      { id: 'hand_forklift', label: 'Xe Nâng Tay (Pallet Jack)', icon: '🚜', defaultDim: [0.6, 0.9, 1.4], matKey: 'metal',
        builder: () => buildHandForklift(0.6, 0.9, 1.4) },
      { id: 'safety_fence', label: 'Hàng Rào An Toàn', icon: '🚧', defaultDim: [1.8, 1.2, 0.1], matKey: 'metal',
        builder: () => buildSafetyFence(1.8, 1.2, 0.1) },
    ]
  },
  lab: {
    categoryLabel: '🧪 Phòng Thí Nghiệm & Bếp (Lab)',
    items: [
      { id: 'lab_workbench', label: 'Bàn Thí Nghiệm Hóa Sinh', icon: '🔬', defaultDim: [2.2, 0.85, 0.9], matKey: 'metal',
        builder: () => buildLabWorkbench(2.2, 0.85, 0.9) },
      { id: 'microscope', label: 'Kính Hiển Vi Quang Học', icon: '🔍', defaultDim: [0.25, 0.4, 0.2], matKey: 'metal',
        builder: () => buildMicroscope(0.25, 0.4, 0.2) },
      { id: 'centrifuge', label: 'Máy Ly Tâm Mẫu', icon: '⚗️', defaultDim: [0.35, 0.3, 0.35], matKey: 'metal',
        builder: () => buildCentrifuge(0.35, 0.3, 0.35) },
      { id: 'test_tube_rack', label: 'Giá Ống Nghiệm Đa Màu', icon: '🧪', defaultDim: [0.3, 0.15, 0.12], matKey: 'plastic',
        builder: () => buildTestTubeRack(0.3, 0.15, 0.12) },
      { id: 'kitchen_counter', label: 'Quầy Bếp & Tủ Đá', icon: '🍳', defaultDim: [2.0, 0.88, 0.8], matKey: 'wood',
        builder: () => buildKitchenCounter(2.0, 0.88, 0.8) },
      { id: 'refrigerator', label: 'Tủ Lạnh / Bảo Quản', icon: '❄️', defaultDim: [0.75, 1.8, 0.7], matKey: 'metal',
        builder: () => buildRefrigerator(0.75, 1.8, 0.7) },
    ]
  },
  architecture: {
    categoryLabel: '🧱 Kiến Trúc & Ngăn Phòng (Architecture)',
    items: [
      { id: 'wall_plain', label: 'Bức Tường Bê Tông', icon: '🧱', defaultDim: [2.5, 2.6, 0.15], matKey: 'concrete',
        builder: () => buildWall(2.5, 2.6, 0.15, 0xe2e8f0) },
      { id: 'wall_window', label: 'Tường Có Cửa Sổ Kính', icon: '🪟', defaultDim: [2.5, 2.6, 0.15], matKey: 'glass',
        builder: () => buildWindowWall(2.5, 2.6, 0.15) },
      { id: 'door_frame', label: 'Cửa Phòng Mở Rộng', icon: '🚪', defaultDim: [1.1, 2.2, 0.15], matKey: 'wood',
        builder: () => buildDoorFrame(1.1, 2.2, 0.15) },
      { id: 'glass_divider', label: 'Vách Kính Cách Ly', icon: '🛡️', defaultDim: [2.0, 2.2, 0.08], matKey: 'glass',
        builder: () => buildGlassDivider(2.0, 2.2, 0.08) },
      { id: 'pillar_column', label: 'Cột Trụ Chịu Lực', icon: '🏛️', defaultDim: [0.4, 3.0, 0.4], matKey: 'concrete',
        builder: () => buildPillarColumn(0.4, 3.0, 0.4) },
    ]
  },
  shapes: {
    categoryLabel: '📐 Hình Học & Vật Cản (Shapes)',
    items: [
      { id: 'geom_box', label: 'Hộp Khối (Cube)', icon: '🟦', defaultDim: [0.3, 0.3, 0.3], matKey: 'plastic',
        builder: () => buildBasicMesh('box', [0.3, 0.3, 0.3], 0x3b82f6) },
      { id: 'geom_sphere', label: 'Khối Cầu (Sphere)', icon: '🔴', defaultDim: [0.3, 0.3, 0.3], matKey: 'rubber',
        builder: () => buildBasicMesh('sphere', [0.15, 24, 24], 0xef4444) },
      { id: 'geom_cylinder', label: 'Khối Trụ (Cylinder)', icon: '🥫', defaultDim: [0.25, 0.5, 0.25], matKey: 'metal',
        builder: () => buildBasicMesh('cylinder', [0.12, 0.12, 0.5, 24], 0x10b981) },
      { id: 'geom_capsule', label: 'Khối Con Nhộng (Capsule)', icon: '💊', defaultDim: [0.2, 0.45, 0.2], matKey: 'plastic',
        builder: () => buildBasicMesh('capsule', [0.1, 0.25, 12, 16], 0xf59e0b) },
      { id: 'geom_cone', label: 'Khối Nón (Cone)', icon: '🔺', defaultDim: [0.3, 0.45, 0.3], matKey: 'plastic',
        builder: () => buildBasicMesh('cone', [0.15, 0.45, 24], 0x8b5cf6) },
    ]
  }
};

/* ════════════════════════════════════════════════
   3D PROCEDURAL OBJECT BUILDER HELPERS
   ════════════════════════════════════════════════ */
function buildCompoundDesk(w, h, d, color) {
  const group = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });

  const topH = 0.04;
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, topH, d), topMat);
  top.position.y = h - topH / 2;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const legR = 0.02;
  const legH = h - topH;
  const offsets = [
    [-w / 2 + 0.05, -d / 2 + 0.05],
    [ w / 2 - 0.05, -d / 2 + 0.05],
    [-w / 2 + 0.05,  d / 2 - 0.05],
    [ w / 2 - 0.05,  d / 2 - 0.05],
  ];
  offsets.forEach(([ox, oz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(legR, legR, legH, 12), legMat);
    leg.position.set(ox, legH / 2, oz);
    leg.castShadow = true;
    group.add(leg);
  });
  return group;
}

function buildCompoundChair(w, h, d, color) {
  const group = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });

  const seatH = h * 0.55;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), seatMat);
  seat.position.y = seatH;
  seat.castShadow = true;
  group.add(seat);

  const backH = h * 0.4;
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, backH, 0.03), seatMat);
  back.position.set(0, seatH + backH / 2 + 0.02, -d / 2 + 0.02);
  back.castShadow = true;
  group.add(back);

  const legOffsets = [
    [-w/2 + 0.04, -d/2 + 0.04], [w/2 - 0.04, -d/2 + 0.04],
    [-w/2 + 0.04,  d/2 - 0.04], [w/2 - 0.04,  d/2 - 0.04]
  ];
  legOffsets.forEach(([ox, oz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, seatH, 8), frameMat);
    leg.position.set(ox, seatH / 2, oz);
    leg.castShadow = true;
    group.add(leg);
  });
  return group;
}

function buildBlackboard(w, h, d) {
  const group = new THREE.Group();
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.9 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });

  const board = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, h - 0.08, d), boardMat);
  board.position.y = h / 2 + 0.6;
  board.castShadow = true;
  group.add(board);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, d * 0.8), frameMat);
  frame.position.y = h / 2 + 0.6;
  frame.position.z = -0.01;
  group.add(frame);
  return group;
}

function buildBookshelf(w, h, d) {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, d), woodMat);
  left.position.set(-w/2, h/2, 0);
  const right = left.clone(); right.position.x = w/2;
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), woodMat); top.position.set(0, h, 0);
  const bot = top.clone(); bot.position.y = 0.02;
  group.add(left, right, top, bot);

  const shelves = 4;
  for (let i = 1; i < shelves; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.02, d), woodMat);
    s.position.y = (h / shelves) * i;
    group.add(s);
  }
  return group;
}

function buildProjectorPillar(w, h, d) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h, 12), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
  pole.position.y = h / 2;
  const proj = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2 }));
  proj.position.set(0, h + 0.06, 0);
  group.add(pole, proj);
  return group;
}

function buildLaptop(w, h, d) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.3 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.015, d), bodyMat);
  base.position.y = 0.01;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(w, d * 0.9, 0.01), screenMat);
  lid.position.set(0, (d * 0.9) / 2, -d / 2 + 0.02);
  lid.rotation.x = -0.3;
  group.add(base, lid);
  return group;
}

function buildBackpack(w, h, d) {
  const bag = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.9 }));
  bag.position.y = h / 2;
  return bag;
}

function buildBookPile(w, h, d) {
  const group = new THREE.Group();
  const colors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444];
  colors.forEach((c, idx) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h / 4 - 0.005, d), new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    b.position.set((idx % 2 === 0 ? 0.01 : -0.01), (h / 4) * idx + (h / 8), 0);
    group.add(b);
  });
  return group;
}

function buildHospitalBed(w, h, d) {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
  const matMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), frameMat);
  frame.position.y = 0.35;
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.18, d * 0.95), matMat);
  mattress.position.y = 0.55;
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.1, 0.35), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
  pillow.position.set(0, 0.68, -d / 2 + 0.3);
  group.add(frame, mattress, pillow);
  return group;
}

function buildPatientMonitor(w, h, d) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, h - 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
  pole.position.y = (h - 0.3) / 2;
  const screen = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x10b981, emissiveIntensity: 0.4 }));
  screen.position.set(0, h - 0.15, 0);
  group.add(pole, screen);
  return group;
}

function buildIVStand(w, h, d) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, h, 12), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9 }));
  pole.position.y = h / 2;
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.04), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }));
  bag.position.set(0.1, h - 0.15, 0);
  group.add(pole, bag);
  return group;
}

function buildMedTrolley(w, h, d) {
  const group = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), steelMat); t1.position.y = h;
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), steelMat); t2.position.y = h / 2;
  group.add(t1, t2);
  return group;
}

function buildSurgicalLamp(w, h, d) {
  const group = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, h, 12), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }));
  arm.position.y = h / 2;
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.15, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 }));
  dome.position.set(0.3, h, 0);
  dome.rotation.z = Math.PI;
  group.add(arm, dome);
  return group;
}

function buildStretcher(w, h, d) {
  return buildHospitalBed(w, h * 0.7, d);
}

function buildMedicineCabinet(w, h, d) {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.5, roughness: 0.2 }));
  frame.position.y = h / 2;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, h * 0.8, 0.02), new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.6 }));
  glass.position.set(0, h / 2, d / 2 + 0.01);
  group.add(frame, glass);
  return group;
}

function buildConveyorBelt(w, h, d) {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  const bed = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), frameMat);
  bed.position.y = h - 0.05;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.02, d * 0.85), beltMat);
  belt.position.y = h + 0.01;
  group.add(bed, belt);

  [-w/2 + 0.15, w/2 - 0.15].forEach(ox => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h - 0.1, 8), frameMat);
    leg.position.set(ox, (h - 0.1) / 2, 0);
    group.add(leg);
  });
  return group;
}

function buildWoodenPallet(w, h, d) {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), woodMat);
  top.position.y = h - 0.02;
  const bot = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), woodMat);
  bot.position.y = 0.015;
  group.add(top, bot);
  return group;
}

function buildWarehouseRack(w, h, d) {
  const group = new THREE.Group();
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.6 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6 });

  [[-w/2, -d/2], [w/2, -d/2], [-w/2, d/2], [w/2, d/2]].forEach(([ox, oz]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.06), blueMat);
    p.position.set(ox, h / 2, oz);
    group.add(p);
  });

  [0.8, 1.6, 2.3].forEach(yh => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), orangeMat);
    beam.position.y = yh;
    group.add(beam);
  });
  return group;
}

function buildCargoBox(w, h, d) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }));
  box.position.y = h / 2;
  return box;
}

function buildChemicalDrum(w, h, d) {
  const r = Math.min(w, d) / 2;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 }));
  drum.position.y = h / 2;
  return drum;
}

function buildHandForklift(w, h, d) {
  const group = new THREE.Group();
  const yelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7 });
  const fork1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, d), yelMat); fork1.position.set(-0.15, 0.08, 0);
  const fork2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, d), yelMat); fork2.position.set(0.15, 0.08, 0);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  handle.position.set(0, h / 2, -d / 2);
  group.add(fork1, fork2, handle);
  return group;
}

function buildSafetyFence(w, h, d) {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5 }));
  frame.position.y = h / 2;
  group.add(frame);
  return group;
}

function buildLabWorkbench(w, h, d) {
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.2 }));
  top.position.y = h;
  const base = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, h - 0.06, d * 0.9), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 }));
  base.position.y = (h - 0.06) / 2;
  group.add(top, base);
  return group;
}

function buildMicroscope(w, h, d) {
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, h, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
  scope.position.y = h / 2;
  return scope;
}

function buildCentrifuge(w, h, d) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(w/2, w/2, h, 20), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 }));
  c.position.y = h / 2;
  return c;
}

function buildTestTubeRack(w, h, d) {
  const group = new THREE.Group();
  const rMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.3, d), rMat);
  base.position.y = (h * 0.3) / 2;
  group.add(base);
  return group;
}

function buildKitchenCounter(w, h, d) {
  return buildLabWorkbench(w, h, d);
}

function buildRefrigerator(w, h, d) {
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.2 }));
  fridge.position.y = h / 2;
  return fridge;
}

function buildWall(w, h, d, color) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  wall.position.y = h / 2;
  return wall;
}

function buildWindowWall(w, h, d) {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
  frame.position.y = h / 2;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, h * 0.5, d * 0.5), new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.5 }));
  glass.position.set(0, h / 2, 0);
  group.add(frame, glass);
  return group;
}

function buildDoorFrame(w, h, d) {
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  frame.position.y = h / 2;
  return frame;
}

function buildGlassDivider(w, h, d) {
  const divider = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.4, metalness: 0.1 }));
  divider.position.y = h / 2;
  return divider;
}

function buildPillarColumn(w, h, d) {
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(w/2, w/2, h, 20), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 }));
  pillar.position.y = h / 2;
  return pillar;
}

function buildBasicMesh(type, args, color) {
  let geo;
  if (type === 'box') geo = new THREE.BoxGeometry(...args);
  else if (type === 'sphere') geo = new THREE.SphereGeometry(...args);
  else if (type === 'cylinder') geo = new THREE.CylinderGeometry(...args);
  else if (type === 'capsule') {
    geo = typeof THREE.CapsuleGeometry !== 'undefined'
      ? new THREE.CapsuleGeometry(...args)
      : new THREE.CylinderGeometry(args[0], args[0], args[1], args[2]);
  } else if (type === 'cone') geo = new THREE.ConeGeometry(...args);
  else geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);

  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = (type === 'sphere') ? args[0] : (args[1] ? args[1] / 2 : 0.15);
  return mesh;
}

/* ════════════════════════════════════════════════
   APP MODE SWITCHER (SIMULATION vs SCENE STUDIO)
   ════════════════════════════════════════════════ */
function switchAppMode(mode) {
  currentAppMode = mode;
  const btnSim = document.getElementById('modeBtnSim');
  const btnStudio = document.getElementById('modeBtnStudio');
  const viewSim = document.getElementById('view-simulation');
  const viewStudio = document.getElementById('view-scenestudio');

  if (btnSim) btnSim.classList.toggle('active', mode === 'simulation');
  if (btnStudio) btnStudio.classList.toggle('active', mode === 'scene_studio');

  if (viewSim) viewSim.style.display = (mode === 'simulation') ? 'grid' : 'none';
  if (viewStudio) viewStudio.style.display = (mode === 'scene_studio') ? 'grid' : 'none';

  // Move 3D viewport canvas to active container
  const canvasHost = document.getElementById(mode === 'simulation' ? 'viewport-container-sim' : 'viewport-container-studio');
  const webglCanvas = renderer?.domElement;
  if (canvasHost && webglCanvas && webglCanvas.parentElement !== canvasHost) {
    canvasHost.appendChild(webglCanvas);
  }

  // Trigger resize on Three.js renderer
  setTimeout(() => {
    if (renderer && camera && canvasHost) {
      camera.aspect = canvasHost.clientWidth / Math.max(canvasHost.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(canvasHost.clientWidth, canvasHost.clientHeight);
    }
  }, 50);

  if (mode === 'scene_studio') {
    renderStudioObjectLibrary();
    renderStudioSceneHierarchy();
    renderStudioPropertiesPanel();
    renderStudioSavedScenes();
    renderStudioEnvModulation();
    addLog('🏗️ Switched to Scene Studio Mode', 'info');
  } else {
    addLog('🎮 Switched to Simulation Mode', 'info');
  }
}

/* ════════════════════════════════════════════════
   SCENE STUDIO: OBJECT CREATION & SELECTION
   ════════════════════════════════════════════════ */
function switchStudioCategory(catKey) {
  activeStudioCategory = catKey;
  document.querySelectorAll('.studio-cat-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cat === catKey);
  });
  renderStudioObjectLibrary();
}

function renderStudioObjectLibrary() {
  const panel = document.getElementById('studioObjectGrid');
  if (!panel) return;

  const catData = OBJECT_LIBRARY[activeStudioCategory];
  if (!catData) return;

  panel.innerHTML = catData.items.map(item => `
    <div class="studio-item-card" onclick="addObjectToStudioScene('${activeStudioCategory}', '${item.id}')">
      <div class="studio-item-icon">${item.icon}</div>
      <div class="studio-item-name">${item.label}</div>
      <div class="studio-item-tag">+ Thêm vào Cảnh</div>
    </div>
  `).join('');
}

function addObjectToStudioScene(catKey, itemId, customPos = null) {
  if (!scene) return;

  const cat = OBJECT_LIBRARY[catKey];
  const item = cat?.items.find(i => i.id === itemId);
  if (!item) return;

  const mesh = item.builder();
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Position
  if (customPos) {
    mesh.position.set(customPos.x, customPos.y, customPos.z);
  } else {
    const r = 0.8 + Math.random() * 0.8;
    const ang = Math.random() * Math.PI * 2;
    mesh.position.set(Math.cos(ang) * r, mesh.position.y, Math.sin(ang) * r);
  }

  scene.add(mesh);

  const matPreset = MATERIAL_PRESETS[item.matKey] || MATERIAL_PRESETS.metal;
  const entry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: `${item.label} #${SCENE_REGISTRY.length + 1}`,
    type: itemId,
    category: catKey,
    mesh,
    params: {
      x: mesh.position.x, y: mesh.position.y, z: mesh.position.z,
      sx: 1.0, sy: 1.0, sz: 1.0,
      rx: 0.0, ry: 0.0, rz: 0.0,
      color: matPreset.color,
      roughness: matPreset.roughness,
      metalness: matPreset.metalness,
      opacity: matPreset.opacity || 1.0
    },
    physics: {
      mass: matPreset.mass,
      friction: matPreset.friction,
      restitution: matPreset.restitution,
      material: item.matKey,
      is_static: (catKey === 'architecture' || itemId === 'table' || itemId === 'warehouse_rack'),
      is_sensor: false
    }
  };

  SCENE_REGISTRY.push(entry);
  renderStudioSceneHierarchy();
  selectStudioObject(entry.id);
  addLog(`➕ Added "${entry.name}" to scene`, 'ok');
}

function selectStudioObject(id) {
  selectedObjectId = id;
  renderStudioSceneHierarchy();
  renderStudioPropertiesPanel();
  highlightSelectedObjectIn3D();
}

function highlightSelectedObjectIn3D() {
  SCENE_REGISTRY.forEach(obj => {
    if (!obj.mesh) return;
    obj.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (obj.id === selectedObjectId) {
          if (!child.userData.origEmissive) {
            child.userData.origEmissive = child.material.emissive ? child.material.emissive.getHex() : 0x000000;
          }
          child.material.emissive = new THREE.Color(0x00f2fe);
          child.material.emissiveIntensity = 0.35;
        } else if (child.userData.origEmissive !== undefined) {
          child.material.emissive = new THREE.Color(child.userData.origEmissive);
          child.material.emissiveIntensity = 0.0;
        }
      }
    });
  });
}

/* ════════════════════════════════════════════════
   SCENE STUDIO: DEEP OBJECT INSPECTOR
   ════════════════════════════════════════════════ */
function renderStudioPropertiesPanel() {
  const panel = document.getElementById('studioInspectorPanel');
  if (!panel) return;

  const obj = SCENE_REGISTRY.find(o => o.id === selectedObjectId);
  if (!obj) {
    panel.innerHTML = `
      <div style="color:var(--text-muted);font-size:0.75rem;padding:24px 12px;text-align:center;line-height:1.6;">
        <div style="font-size:2rem;margin-bottom:8px;">👆</div>
        <strong>Chưa chọn đối tượng</strong><br>
        Click vào vật thể trong 3D Viewport<br>hoặc chọn từ tab Cây Phân Cấp (Hierarchy).
      </div>
    `;
    return;
  }

  const p = obj.params;
  const ph = obj.physics;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;margin-bottom:12px;">
      <input type="text" value="${obj.name}" onchange="updateObjName(${obj.id}, this.value)" style="
        background:rgba(255,255,255,0.06);border:1px solid var(--border-color);border-radius:6px;
        color:var(--text-bright);font-weight:700;font-size:0.82rem;padding:4px 8px;width:170px;
      " />
      <div style="display:flex;gap:4px;">
        <button onclick="duplicateStudioObject(${obj.id})" title="Nhân bản" style="background:rgba(0,242,254,0.15);border:1px solid var(--primary-cyan);color:#00f2fe;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.7rem;">⧉ Nhân Bản</button>
        <button onclick="removeStudioObject(${obj.id})" title="Xóa" style="background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#ef4444;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.7rem;">✕</button>
      </div>
    </div>

    <!-- 1. Transform Section -->
    <div class="inspector-section-hdr">📐 Tọa Độ & Kích Thước (Transform)</div>
    <div class="inspector-grid">
      <div class="inspector-field"><label>Pos X (m)</label><input type="number" step="0.05" value="${p.x.toFixed(2)}" onchange="updateStudioProp(${obj.id}, 'x', this.value)"></div>
      <div class="inspector-field"><label>Pos Y (m)</label><input type="number" step="0.05" value="${p.y.toFixed(2)}" onchange="updateStudioProp(${obj.id}, 'y', this.value)"></div>
      <div class="inspector-field"><label>Pos Z (m)</label><input type="number" step="0.05" value="${p.z.toFixed(2)}" onchange="updateStudioProp(${obj.id}, 'z', this.value)"></div>
    </div>

    <div class="inspector-grid" style="margin-top:6px;">
      <div class="inspector-field"><label>Scale X</label><input type="number" step="0.1" min="0.05" value="${p.sx.toFixed(2)}" onchange="updateStudioProp(${obj.id}, 'sx', this.value)"></div>
      <div class="inspector-field"><label>Scale Y</label><input type="number" step="0.1" min="0.05" value="${p.sy.toFixed(2)}" onchange="updateStudioProp(${obj.id}, 'sy', this.value)"></div>
      <div class="inspector-field"><label>Scale Z</label><input type="number" step="0.1" min="0.05" value="${p.sz.toFixed(2)}" onchange="updateStudioProp(${obj.id}, 'sz', this.value)"></div>
    </div>

    <div class="inspector-grid" style="margin-top:6px;">
      <div class="inspector-field"><label>Rot X (°)</label><input type="number" step="5" value="${p.rx}" onchange="updateStudioProp(${obj.id}, 'rx', this.value)"></div>
      <div class="inspector-field"><label>Rot Y (°)</label><input type="number" step="5" value="${p.ry}" onchange="updateStudioProp(${obj.id}, 'ry', this.value)"></div>
      <div class="inspector-field"><label>Rot Z (°)</label><input type="number" step="5" value="${p.rz}" onchange="updateStudioProp(${obj.id}, 'rz', this.value)"></div>
    </div>

    <!-- 2. Visual Material Section -->
    <div class="inspector-section-hdr" style="margin-top:12px;">🎨 Vật Liệu Trực Quan (Visual Material)</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <input type="color" value="${p.color}" onchange="updateStudioProp(${obj.id}, 'color', this.value)" style="width:36px;height:28px;border:none;border-radius:6px;cursor:pointer;">
      <span style="font-size:0.7rem;color:var(--text-muted);">Màu sắc bề mặt</span>
      <div style="margin-left:auto;display:flex;gap:4px;">
        <button onclick="focusOnStudioObject(${obj.id})" style="background:rgba(255,255,255,0.08);border:1px solid var(--border-color);color:var(--text-bright);padding:3px 8px;border-radius:6px;font-size:0.65rem;cursor:pointer;">🎯 Focus Camera</button>
      </div>
    </div>

    <!-- Material Presets -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:8px;">
      ${Object.entries(MATERIAL_PRESETS).map(([k, m]) => `
        <button onclick="applyStudioMaterialPreset(${obj.id}, '${k}')" style="
          padding:5px 2px;border-radius:6px;border:1px solid ${ph.material === k ? '#00f2fe' : 'rgba(255,255,255,0.1)'};
          background:${ph.material === k ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.03)'};
          color:${ph.material === k ? '#00f2fe' : '#94a3b8'};font-size:0.62rem;cursor:pointer;
        ">${m.label.split(' ')[0]} ${k}</button>
      `).join('')}
    </div>

    <!-- 3. Physics & Dynamic Properties -->
    <div class="inspector-section-hdr" style="margin-top:12px;">⚛️ Thuộc Tính Vật Lý (Physics & Dynamics)</div>
    <div class="inspector-grid">
      <div class="inspector-field"><label>Mass m (kg)</label><input type="number" step="0.1" min="0" value="${ph.mass.toFixed(1)}" onchange="updateStudioPhysProp(${obj.id}, 'mass', this.value)"></div>
      <div class="inspector-field"><label>Friction μ</label><input type="number" step="0.05" min="0" max="2" value="${ph.friction.toFixed(2)}" onchange="updateStudioPhysProp(${obj.id}, 'friction', this.value)"></div>
      <div class="inspector-field"><label>Restitution e</label><input type="number" step="0.05" min="0" max="1" value="${ph.restitution.toFixed(2)}" onchange="updateStudioPhysProp(${obj.id}, 'restitution', this.value)"></div>
    </div>

    <div style="display:flex;gap:12px;margin-top:8px;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;">
      <label style="display:flex;align-items:center;gap:6px;font-size:0.7rem;cursor:pointer;">
        <input type="checkbox" ${ph.is_static ? 'checked' : ''} onchange="updateStudioPhysProp(${obj.id}, 'is_static', this.checked)">
        🧱 <strong>Static</strong> (Cố định sàn)
      </label>
      <label style="display:flex;align-items:center;gap:6px;font-size:0.7rem;cursor:pointer;">
        <input type="checkbox" ${ph.is_sensor ? 'checked' : ''} onchange="updateStudioPhysProp(${obj.id}, 'is_sensor', this.checked)">
        📡 <strong>Sensor</strong> (Không va chạm)
      </label>
    </div>

    <!-- 4. MuJoCo XML Export Snippet -->
    <div class="inspector-section-hdr" style="margin-top:12px;">📄 MuJoCo MJCF XML Code Preview</div>
    <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:8px;font-size:0.6rem;font-family:var(--font-mono);color:#10b981;overflow-x:auto;max-height:100px;">
      ${generateSingleObjectMJCF(obj)}
    </div>
  `;
}

function updateObjName(id, val) {
  const obj = SCENE_REGISTRY.find(o => o.id === id);
  if (obj) {
    obj.name = val.trim();
    renderStudioSceneHierarchy();
  }
}

function updateStudioProp(id, prop, value) {
  const obj = SCENE_REGISTRY.find(o => o.id === id);
  if (!obj || !obj.mesh) return;

  const num = parseFloat(value);
  obj.params[prop] = (prop === 'color') ? value : num;

  if (prop === 'x') obj.mesh.position.x = num;
  else if (prop === 'y') obj.mesh.position.y = num;
  else if (prop === 'z') obj.mesh.position.z = num;
  else if (prop === 'sx') obj.mesh.scale.x = num;
  else if (prop === 'sy') obj.mesh.scale.y = num;
  else if (prop === 'sz') obj.mesh.scale.z = num;
  else if (prop === 'rx') obj.mesh.rotation.x = THREE.MathUtils.degToRad(num);
  else if (prop === 'ry') obj.mesh.rotation.y = THREE.MathUtils.degToRad(num);
  else if (prop === 'rz') obj.mesh.rotation.z = THREE.MathUtils.degToRad(num);
  else if (prop === 'color') {
    obj.mesh.traverse(c => {
      if (c.isMesh && c.material) c.material.color.set(value);
    });
  }
}

function updateStudioPhysProp(id, prop, value) {
  const obj = SCENE_REGISTRY.find(o => o.id === id);
  if (!obj) return;
  obj.physics[prop] = (typeof value === 'boolean') ? value : parseFloat(value);
}

function applyStudioMaterialPreset(id, matKey) {
  const obj = SCENE_REGISTRY.find(o => o.id === id);
  const p = MATERIAL_PRESETS[matKey];
  if (!obj || !p) return;

  obj.physics.material = matKey;
  obj.physics.mass = p.mass;
  obj.physics.friction = p.friction;
  obj.physics.restitution = p.restitution;

  obj.params.color = p.color;
  obj.params.roughness = p.roughness;
  obj.params.metalness = p.metalness;

  if (obj.mesh) {
    obj.mesh.traverse(c => {
      if (c.isMesh && c.material) {
        c.material.color.set(p.color);
        c.material.roughness = p.roughness;
        c.material.metalness = p.metalness;
        if (p.transparent) {
          c.material.transparent = true;
          c.material.opacity = p.opacity || 0.7;
        }
      }
    });
  }
  renderStudioPropertiesPanel();
}

function duplicateStudioObject(id) {
  const obj = SCENE_REGISTRY.find(o => o.id === id);
  if (!obj) return;
  addObjectToStudioScene(obj.category || 'shapes', obj.type, {
    x: obj.params.x + 0.35,
    y: obj.params.y,
    z: obj.params.z + 0.35
  });
}

function removeStudioObject(id) {
  const idx = SCENE_REGISTRY.findIndex(o => o.id === id);
  if (idx < 0) return;
  scene.remove(SCENE_REGISTRY[idx].mesh);
  SCENE_REGISTRY.splice(idx, 1);
  if (selectedObjectId === id) selectedObjectId = null;
  renderStudioSceneHierarchy();
  renderStudioPropertiesPanel();
  addLog('🗑️ Removed object from scene', 'warn');
}

function focusOnStudioObject(id) {
  const obj = SCENE_REGISTRY.find(o => o.id === id);
  if (!obj || !obj.mesh || !camera) return;
  camera.position.set(obj.params.x + 1.2, obj.params.y + 1.0, obj.params.z + 1.5);
  camera.lookAt(obj.params.x, obj.params.y, obj.params.z);
}

/* ════════════════════════════════════════════════
   SCENE HIERARCHY TREE
   ════════════════════════════════════════════════ */
function renderStudioSceneHierarchy() {
  const list = document.getElementById('studioHierarchyList');
  if (!list) return;

  if (!SCENE_REGISTRY.length) {
    list.innerHTML = `<div style="color:var(--text-muted);font-size:0.72rem;padding:12px;text-align:center;">Trống. Hãy chọn object bên trái để thêm vào cảnh.</div>`;
    return;
  }

  list.innerHTML = SCENE_REGISTRY.map(obj => `
    <div class="studio-hier-row ${obj.id === selectedObjectId ? 'active' : ''}" onclick="selectStudioObject(${obj.id})">
      <span>${getItemIcon(obj.type)}</span>
      <span class="studio-hier-name">${obj.name}</span>
      <span class="studio-hier-cat">${obj.category || 'prop'}</span>
      <button class="studio-hier-del" onclick="event.stopPropagation(); removeStudioObject(${obj.id})">✕</button>
    </div>
  `).join('');
}

function getItemIcon(id) {
  for (const cat of Object.values(OBJECT_LIBRARY)) {
    const it = cat.items.find(i => i.id === id);
    if (it) return it.icon;
  }
  return '📦';
}

/* ════════════════════════════════════════════════
   SCENE PERSISTENCE & MANAGER (LOCALSTORAGE & FILES)
   ════════════════════════════════════════════════ */
const DEFAULT_PRESET_SCENES = {
  classroom: {
    name: '🏫 Modern Classroom (Phòng Học)',
    category: 'school',
    objects: [
      { type: 'teacher_desk', category: 'school', pos: { x: 0.0, y: 0.0, z: -1.4 } },
      { type: 'blackboard',   category: 'school', pos: { x: 0.0, y: 0.0, z: -2.3 } },
      { type: 'student_desk', category: 'school', pos: { x: -0.8, y: 0.0, z: 0.3 } },
      { type: 'student_chair',category: 'school', pos: { x: -0.8, y: 0.0, z: 0.9 } },
      { type: 'student_desk', category: 'school', pos: { x:  0.8, y: 0.0, z: 0.3 } },
      { type: 'student_chair',category: 'school', pos: { x:  0.8, y: 0.0, z: 0.9 } },
      { type: 'bookshelf',    category: 'school', pos: { x: -2.0, y: 0.0, z: -0.5 } },
    ]
  },
  icu_room: {
    name: '🏥 Hospital ICU & Surgery Room',
    category: 'hospital',
    objects: [
      { type: 'hospital_bed',    category: 'hospital', pos: { x: -0.8, y: 0.0, z: 0.0 } },
      { type: 'patient_monitor', category: 'hospital', pos: { x: -1.6, y: 0.0, z: -0.8 } },
      { type: 'iv_stand',        category: 'hospital', pos: { x: -0.2, y: 0.0, z: -1.0 } },
      { type: 'med_trolley',     category: 'hospital', pos: { x:  0.7, y: 0.0, z: 0.3 } },
      { type: 'surgical_lamp',   category: 'hospital', pos: { x: -0.8, y: 0.0, z: 0.0 } },
      { type: 'medicine_cabinet',category: 'hospital', pos: { x:  1.6, y: 0.0, z: -1.2 } },
    ]
  },
  factory_line: {
    name: '🏭 Automated Factory Cell',
    category: 'factory',
    objects: [
      { type: 'conveyor_belt',  category: 'factory', pos: { x:  0.0, y: 0.0, z:  0.4 } },
      { type: 'warehouse_rack', category: 'factory', pos: { x:  1.8, y: 0.0, z: -1.0 } },
      { type: 'wooden_pallet',  category: 'factory', pos: { x: -1.4, y: 0.0, z:  0.2 } },
      { type: 'cargo_box',      category: 'factory', pos: { x: -1.4, y: 0.15, z: 0.2 } },
      { type: 'chemical_drum',  category: 'factory', pos: { x: -1.8, y: 0.0, z: -1.2 } },
      { type: 'safety_fence',   category: 'factory', pos: { x:  0.0, y: 0.0, z:  1.6 } },
    ]
  },
  biochem_lab: {
    name: '🧪 Biochemical Research Lab',
    category: 'lab',
    objects: [
      { type: 'lab_workbench',  category: 'lab', pos: { x:  0.0, y: 0.0, z:  0.0 } },
      { type: 'microscope',     category: 'lab', pos: { x:  0.5, y: 0.85, z: 0.0 } },
      { type: 'centrifuge',     category: 'lab', pos: { x: -0.5, y: 0.85, z: 0.0 } },
      { type: 'test_tube_rack', category: 'lab', pos: { x:  0.0, y: 0.85, z: 0.2 } },
      { type: 'refrigerator',   category: 'lab', pos: { x: -1.8, y: 0.0, z: -1.0 } },
    ]
  }
};

function loadPresetTemplate(templateKey) {
  const tpl = DEFAULT_PRESET_SCENES[templateKey];
  if (!tpl) return;

  clearAllStudioObjects();
  tpl.objects.forEach(o => {
    addObjectToStudioScene(o.category, o.type, o.pos);
  });
  addLog(`🌟 Loaded preset scene: ${tpl.name}`, 'ok');
}

function renderStudioSavedScenes() {
  const list = document.getElementById('studioSavedScenesList');
  if (!list) return;

  const raw = localStorage.getItem('physisim_saved_scenes');
  const userScenes = raw ? JSON.parse(raw) : [];

  list.innerHTML = `
    <div style="font-size:0.68rem;font-weight:700;color:var(--primary-cyan);margin-bottom:6px;">⭐ Mẫu Có Sẵn (Built-in Templates):</div>
    ${Object.entries(DEFAULT_PRESET_SCENES).map(([k, t]) => `
      <div class="saved-scene-card" onclick="loadPresetTemplate('${k}')">
        <div style="font-weight:700;font-size:0.75rem;">${t.name}</div>
        <div style="font-size:0.63rem;color:var(--text-muted);">${t.objects.length} objects · Built-in</div>
      </div>
    `).join('')}

    <div style="font-size:0.68rem;font-weight:700;color:var(--accent-emerald);margin-top:14px;margin-bottom:6px;">💾 Cảnh Người Dùng Đã Lưu (User Scenes):</div>
    ${userScenes.length === 0 ? `<div style="font-size:0.65rem;color:var(--text-muted);padding:8px 0;">Chưa có cảnh nào được lưu. Bấm "Save Current Scene" bên dưới.</div>` : ''}
    ${userScenes.map((s, idx) => `
      <div class="saved-scene-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:0.75rem;">${s.name}</strong>
          <button onclick="event.stopPropagation(); deleteSavedUserScene(${idx})" style="background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:0.75rem;">✕</button>
        </div>
        <div style="font-size:0.63rem;color:var(--text-muted);margin-top:2px;">${s.objects?.length || 0} objects · ${new Date(s.timestamp).toLocaleDateString()}</div>
        <button onclick="loadUserSceneByIndex(${idx})" style="margin-top:6px;width:100%;padding:4px;border-radius:4px;border:1px solid var(--primary-cyan);background:rgba(0,242,254,0.1);color:#00f2fe;font-size:0.68rem;cursor:pointer;">📂 Nạp Cảnh Này</button>
      </div>
    `).join('')}
  `;
}

function saveCurrentStudioScene() {
  const sceneName = prompt('Nhập tên cho Scene mới:', `Scene_${new Date().toLocaleTimeString()}`);
  if (!sceneName) return;

  const data = {
    name: sceneName,
    timestamp: Date.now(),
    robot: currentRobot,
    envState: ENV_STATE,
    objects: SCENE_REGISTRY.map(o => ({
      name: o.name,
      type: o.type,
      category: o.category,
      params: o.params,
      physics: o.physics
    }))
  };

  const raw = localStorage.getItem('physisim_saved_scenes');
  const userScenes = raw ? JSON.parse(raw) : [];
  userScenes.push(data);
  localStorage.setItem('physisim_saved_scenes', JSON.stringify(userScenes));

  renderStudioSavedScenes();
  addLog(`💾 Đã lưu scene "${sceneName}" thành công!`, 'ok');
}

function loadUserSceneByIndex(idx) {
  const raw = localStorage.getItem('physisim_saved_scenes');
  if (!raw) return;
  const userScenes = JSON.parse(raw);
  const data = userScenes[idx];
  if (!data) return;

  clearAllStudioObjects();
  if (data.objects) {
    data.objects.forEach(o => {
      addObjectToStudioScene(o.category || 'shapes', o.type, {
        x: o.params.x, y: o.params.y, z: o.params.z
      });
      const last = SCENE_REGISTRY[SCENE_REGISTRY.length - 1];
      if (last) {
        last.name = o.name;
        Object.assign(last.params, o.params);
        Object.assign(last.physics, o.physics);
        if (last.mesh) {
          last.mesh.scale.set(o.params.sx, o.params.sy, o.params.sz);
          last.mesh.rotation.set(
            THREE.MathUtils.degToRad(o.params.rx),
            THREE.MathUtils.degToRad(o.params.ry),
            THREE.MathUtils.degToRad(o.params.rz)
          );
        }
      }
    });
  }
  renderStudioSceneHierarchy();
  addLog(`📂 Đã nạp thành công scene "${data.name}"`, 'ok');
}

function deleteSavedUserScene(idx) {
  const raw = localStorage.getItem('physisim_saved_scenes');
  if (!raw) return;
  const userScenes = JSON.parse(raw);
  userScenes.splice(idx, 1);
  localStorage.setItem('physisim_saved_scenes', JSON.stringify(userScenes));
  renderStudioSavedScenes();
  addLog('🗑️ Đã xóa scene khỏi danh sách lưu.', 'warn');
}

function clearAllStudioObjects() {
  SCENE_REGISTRY.forEach(o => { if (o.mesh) scene.remove(o.mesh); });
  SCENE_REGISTRY.length = 0;
  selectedObjectId = null;
  renderStudioSceneHierarchy();
  renderStudioPropertiesPanel();
  addLog('🧹 Đã xóa sạch toàn bộ objects trên scene.', 'info');
}

/* ════════════════════════════════════════════════
   GLOBAL ENVIRONMENT & PHYSICS MODULATION
   ════════════════════════════════════════════════ */
function renderStudioEnvModulation() {
  const panel = document.getElementById('studioEnvModulationPanel');
  if (!panel) return;

  panel.innerHTML = `
    <!-- Gravity -->
    <div class="inspector-section-hdr">🌌 Trọng Lực Không Gian (Gravity)</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:8px;">
      ${[
        { k: 'earth', lbl: '🌍 Earth (9.81 m/s²)', g: -9.81 },
        { k: 'moon',  lbl: '🌕 Moon (1.62 m/s²)',  g: -1.62 },
        { k: 'zero_g',lbl: '🛸 Zero-G (0.0 m/s²)', g: 0.0 },
        { k: 'mars',  lbl: '🔴 Mars (3.72 m/s²)',  g: -3.72 },
        { k: 'jupiter',lbl:'🪐 Jupiter (24.79)',   g: -24.79 },
        { k: 'custom',lbl: '⚙️ Tùy Chỉnh',         g: ENV_STATE.gravityVal }
      ].map(item => `
        <button onclick="setStudioGravity('${item.k}', ${item.g})" style="
          padding:6px 2px;border-radius:6px;border:1px solid ${ENV_STATE.gravityPreset === item.k ? '#00f2fe' : 'rgba(255,255,255,0.1)'};
          background:${ENV_STATE.gravityPreset === item.k ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.03)'};
          color:${ENV_STATE.gravityPreset === item.k ? '#00f2fe' : '#94a3b8'};font-size:0.65rem;cursor:pointer;
        ">${item.lbl}</button>
      `).join('')}
    </div>

    <!-- Lighting -->
    <div class="inspector-section-hdr" style="margin-top:12px;">💡 Ánh Sáng & Thời Gian (Lighting Presets)</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:8px;">
      ${[
        { k: 'daylight', lbl: '☀️ Daylight 6500K' },
        { k: 'neon',     lbl: '🟣 Cyberpunk Neon' },
        { k: 'hospital', lbl: '🏥 Hospital Clean' },
        { k: 'factory',  lbl: '🏭 Factory Warm' },
        { k: 'sunset',   lbl: '🌇 Sunset Orange' },
        { k: 'night',    lbl: '🌙 Dark Night' },
      ].map(item => `
        <button onclick="setStudioLighting('${item.k}')" style="
          padding:6px 2px;border-radius:6px;border:1px solid ${ENV_STATE.lightingPreset === item.k ? '#00f2fe' : 'rgba(255,255,255,0.1)'};
          background:${ENV_STATE.lightingPreset === item.k ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.03)'};
          color:${ENV_STATE.lightingPreset === item.k ? '#00f2fe' : '#94a3b8'};font-size:0.65rem;cursor:pointer;
        ">${item.lbl}</button>
      `).join('')}
    </div>

    <!-- Floor Grid Style -->
    <div class="inspector-section-hdr" style="margin-top:12px;">🏁 Mặt Sàn & Kết Cấu (Floor Material)</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;margin-bottom:8px;">
      ${[
        { k: 'dark_grid',     lbl: '🌐 Cyber Dark Grid' },
        { k: 'hospital_tile', lbl: '🏥 Hospital Tile' },
        { k: 'factory_epoxy', lbl: '🏭 Factory Epoxy Green' },
        { k: 'wood_floor',    lbl: '🪵 Parquet Wood' },
      ].map(item => `
        <button onclick="setStudioFloorPreset('${item.k}')" style="
          padding:6px 2px;border-radius:6px;border:1px solid ${ENV_STATE.floorPreset === item.k ? '#00f2fe' : 'rgba(255,255,255,0.1)'};
          background:${ENV_STATE.floorPreset === item.k ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.03)'};
          color:${ENV_STATE.floorPreset === item.k ? '#00f2fe' : '#94a3b8'};font-size:0.65rem;cursor:pointer;
        ">${item.lbl}</button>
      `).join('')}
    </div>

    <!-- Domain Randomization -->
    <div class="inspector-section-hdr" style="margin-top:12px;">🎲 Domain Randomization (Sim-to-Real)</div>
    <label style="display:flex;align-items:center;gap:6px;font-size:0.72rem;cursor:pointer;margin-top:6px;">
      <input type="checkbox" ${ENV_STATE.domainRandomization ? 'checked' : ''} onchange="toggleStudioDomainRand(this.checked)">
      Kích hoạt nhiễu cảm biến & ma sát ngẫu nhiên (±20%)
    </label>
  `;
}

function setStudioGravity(preset, val) {
  ENV_STATE.gravityPreset = preset;
  ENV_STATE.gravityVal = val;
  renderStudioEnvModulation();
  addLog(`🌌 Trọng lực đặt thành: ${preset.toUpperCase()} (${val} m/s²)`, 'info');
}

function setStudioLighting(preset) {
  ENV_STATE.lightingPreset = preset;
  if (typeof setEnvironmentLightingPreset === 'function') {
    setEnvironmentLightingPreset(preset);
  }
  renderStudioEnvModulation();
  addLog(`💡 Ánh sáng môi trường: ${preset.toUpperCase()}`, 'info');
}

function setStudioFloorPreset(preset) {
  ENV_STATE.floorPreset = preset;
  if (typeof setFloorGridPreset === 'function') {
    setFloorGridPreset(preset);
  }
  renderStudioEnvModulation();
  addLog(`🏁 Kết cấu sàn đặt thành: ${preset.toUpperCase()}`, 'info');
}

function toggleStudioDomainRand(val) {
  ENV_STATE.domainRandomization = val;
  addLog(`🎲 Domain Randomization: ${val ? 'ON' : 'OFF'}`, 'ok');
}

/* ════════════════════════════════════════════════
   LAUNCH SIMULATION WITH THIS SCENE
   ════════════════════════════════════════════════ */
function launchSimulationWithCurrentScene() {
  switchAppMode('simulation');
  addLog(`🚀 Đang chạy mô phỏng với ${SCENE_REGISTRY.length} objects & ${ENV_STATE.lightingPreset} lighting!`, 'ok');
}

/* ════════════════════════════════════════════════
   MUJOCO XML / MJCF CODE GENERATOR
   ════════════════════════════════════════════════ */
function generateSingleObjectMJCF(obj) {
  const p = obj.params;
  const ph = obj.physics || {};
  return `<body name="${obj.name.replace(/[^a-zA-Z0-9_]/g, '_')}" pos="${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p.z.toFixed(2)}">
  <geom type="box" size="${(p.sx * 0.15).toFixed(3)} ${(p.sy * 0.15).toFixed(3)} ${(p.sz * 0.15).toFixed(3)}"
        mass="${ph.mass.toFixed(2)}" friction="${ph.friction.toFixed(2)} 0.005 0.0001"
        solref="0.02 1" solimp="0.9 0.95 0.001"
        rgba="0.8 0.8 0.8 1"/>
  ${ph.is_static ? '<!-- static object: weld to world -->' : '<joint type="free"/>'}
</body>`;
}

function exportFullSceneMJCF() {
  const bodies = SCENE_REGISTRY.map(generateSingleObjectMJCF).join('\n  ');
  const fullMJCF = `<mujoco model="physisim_custom_scene">
  <compiler angle="degree" coordinate="local"/>
  <option gravity="0 0 ${ENV_STATE.gravityVal}" timestep="0.002"/>
  <worldbody>
    <light pos="0 0 4" dir="0 0 -1" diffuse="1 1 1"/>
    <geom name="floor" type="plane" size="10 10 0.1" rgba="0.2 0.2 0.2 1"/>
    ${bodies}
  </worldbody>
</mujoco>`;

  const blob = new Blob([fullMJCF], { type: 'application/xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `physisim_scene_${Date.now()}.mjcf.xml`;
  a.click();
  addLog('📄 Đã xuất file MuJoCo XML (MJCF) thành công!', 'ok');
}

function exportFullSceneJSON() {
  const data = {
    version: '2.0',
    timestamp: Date.now(),
    robot: currentRobot,
    envState: ENV_STATE,
    objects: SCENE_REGISTRY.map(o => ({
      name: o.name,
      type: o.type,
      category: o.category,
      params: o.params,
      physics: o.physics
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `physisim_scene_${Date.now()}.json`;
  a.click();
  addLog('💾 Đã xuất file Scene JSON thành công!', 'ok');
}

/* ════════════════════════════════════════════════
   EXPOSE GLOBALS TO WINDOW
   ════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════
   RIGHT SIDEBAR TAB SWITCHER IN SCENE STUDIO
   ════════════════════════════════════════════════ */
function switchStudioRightTab(tabKey) {
  ['detail', 'hierarchy', 'saved', 'env'].forEach(t => {
    const btn = document.getElementById(`studioRightTabBtn-${t}`);
    const content = document.getElementById(`studioRightTabContent-${t}`);
    if (btn) btn.classList.toggle('active', t === tabKey);
    if (content) content.style.display = (t === tabKey) ? 'block' : 'none';
  });
  if (tabKey === 'hierarchy') renderStudioSceneHierarchy();
  else if (tabKey === 'saved') renderStudioSavedScenes();
  else if (tabKey === 'env') renderStudioEnvModulation();
  else if (tabKey === 'detail') renderStudioPropertiesPanel();
}

window.switchStudioRightTab = switchStudioRightTab;
window.switchAppMode = switchAppMode;
window.switchStudioCategory = switchStudioCategory;
window.addObjectToStudioScene = addObjectToStudioScene;
window.selectStudioObject = selectStudioObject;
window.duplicateStudioObject = duplicateStudioObject;
window.removeStudioObject = removeStudioObject;
window.focusOnStudioObject = focusOnStudioObject;
window.updateStudioProp = updateStudioProp;
window.updateStudioPhysProp = updateStudioPhysProp;
window.applyStudioMaterialPreset = applyStudioMaterialPreset;
window.loadPresetTemplate = loadPresetTemplate;
window.saveCurrentStudioScene = saveCurrentStudioScene;
window.loadUserSceneByIndex = loadUserSceneByIndex;
window.deleteSavedUserScene = deleteSavedUserScene;
window.clearAllStudioObjects = clearAllStudioObjects;
window.setStudioGravity = setStudioGravity;
window.setStudioLighting = setStudioLighting;
window.setStudioFloorPreset = setStudioFloorPreset;
window.toggleStudioDomainRand = toggleStudioDomainRand;
window.launchSimulationWithCurrentScene = launchSimulationWithCurrentScene;
window.exportFullSceneMJCF = exportFullSceneMJCF;
window.exportFullSceneJSON = exportFullSceneJSON;
window.SCENE_REGISTRY = SCENE_REGISTRY;
window.ENV_STATE = ENV_STATE;

