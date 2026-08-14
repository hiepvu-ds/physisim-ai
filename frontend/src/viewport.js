/**
 * PhysiSim AI — Three.js 3D Viewport Module
 * Manages scene, robot mesh, camera, OrbitControls
 */

let scene, camera, renderer, robotGroup;
let frameCount = 0, lastFpsTime = performance.now(), currentFps = 60;

// Selection + Drag state
let _selectedMesh = null;
let _dragPlane = new THREE.Plane();
let _dragOffset = new THREE.Vector3();
let _isDraggingObject = false;
let _raycaster = null;   // initialized after scene exists


function initViewport() {
  const container = document.getElementById('viewport-container-sim') || document.getElementById('viewport-container');


  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020408);
  scene.fog = new THREE.FogExp2(0x020408, 0.06);

  // Camera
  camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.05, 500);
  camera.position.set(2.5, 2.2, 3.2);
  camera.lookAt(0, 0.8, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0x1a2040, 3);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const pointLight1 = new THREE.PointLight(0x00f2fe, 2, 8);
  pointLight1.position.set(0, 3, 0);
  scene.add(pointLight1);

  // Grid
  const gridHelper = new THREE.GridHelper(12, 24, 0x00f2fe, 0x1e293b);
  gridHelper.material.opacity = 0.4;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Axes
  const axesHelper = new THREE.AxesHelper(0.5);
  scene.add(axesHelper);

  // Robot group
  buildRobotMesh();

  // Simple orbit via mouse events (OrbitControls not bundled with r128 CDN)
  setupOrbitControls(container);

  // Animate
  animateViewport();

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

function buildRobotMesh() {
  robotGroup = new THREE.Group();

  // Base plate
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.08, 24), baseMat);
  base.position.y = 0.04;
  robotGroup.add(base);

  // Link 1
  const linkMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
  const link1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 12), linkMat);
  link1.position.y = 0.35;
  robotGroup.add(link1);

  // Joint sphere
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.9, roughness: 0.1 });
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), jointMat);
  joint.position.y = 0.65;
  robotGroup.add(joint);

  // Forearm
  const link2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.07), linkMat);
  link2.position.set(0, 0.95, 0);
  link2.rotation.z = 0.3;
  robotGroup.add(link2);

  // End-effector cylinder
  const eeMat = new THREE.MeshStandardMaterial({ color: 0x7f00ff, metalness: 0.85, roughness: 0.15 });
  const ee = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.14, 12), eeMat);
  ee.position.set(0.14, 1.2, 0);
  robotGroup.add(ee);

  // Gripper fingers
  const fingerMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, wireframe: false, metalness: 0.6 });
  const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.09, 0.025), fingerMat);
  const f2 = f1.clone();
  f1.position.set(0.12, 1.14, 0.04);
  f2.position.set(0.12, 1.14, -0.04);
  robotGroup.add(f1, f2);

  scene.add(robotGroup);
}

/* Update robot position from slider values */
function updateRobotPose(x, y, z, roll, pitch, yaw) {
  if (!robotGroup) return;
  robotGroup.position.set(x, y - 1.2, z);
  robotGroup.rotation.set(
    THREE.MathUtils.degToRad(roll),
    THREE.MathUtils.degToRad(yaw),
    THREE.MathUtils.degToRad(pitch)
  );
}

/* ────────────────────────────────────────────────
   Orbit + Click-to-select + XZ Drag
   ─────────────────────────────────────────────── */
function setupOrbitControls(container) {
  _raycaster = new THREE.Raycaster();
  let isOrbitDragging = false, prevX = 0, prevY = 0;
  let phi = 0.6, theta = 0.5, radius = 5;

  const updateCamera = () => {
    camera.position.set(
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.sin(phi),
      radius * Math.cos(theta) * Math.cos(phi)
    );
    camera.lookAt(0, 0.8, 0);
  };

  // Convert mouse to NDC [-1,1]
  function getNDC(e) {
    const rect = container.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
     -((e.clientY - rect.top)  / rect.height) * 2 + 1
    );
  }

  // Collect all scene-editor objects that can be picked
  function getPickableObjects() {
    const objs = [];
    if (typeof SCENE_REGISTRY !== 'undefined') {
      SCENE_REGISTRY.forEach(o => { if (o.mesh) objs.push(o.mesh); });
    }
    return objs;
  }

  container.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const ndc = getNDC(e);
    _raycaster.setFromCamera(ndc, camera);

    const pickable = getPickableObjects();
    const hits = _raycaster.intersectObjects(pickable, true);

    if (hits.length > 0) {
      // ─ Hit an object: start drag ─
      const hitMesh = hits[0].object;
      // find root mesh in SCENE_REGISTRY
      let rootMesh = hitMesh;
      if (typeof SCENE_REGISTRY !== 'undefined') {
        for (const o of SCENE_REGISTRY) {
          if (o.mesh === hitMesh || o.mesh.children.includes(hitMesh)) {
            rootMesh = o.mesh;
            break;
          }
        }
      }
      _isDraggingObject = true;
      _selectedMesh = rootMesh;

      // Select in editor
      if (typeof SCENE_REGISTRY !== 'undefined') {
        const entry = SCENE_REGISTRY.find(o => o.mesh === rootMesh);
        if (entry && typeof selectSceneObject === 'function') {
          selectSceneObject(entry.id);
        }
      }

      // Set drag plane at object Y height, facing up
      _dragPlane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        rootMesh.position
      );
      // Offset so we grab from the point of intersection
      const pt = new THREE.Vector3();
      _raycaster.ray.intersectPlane(_dragPlane, pt);
      _dragOffset.subVectors(rootMesh.position, pt);
    } else {
      // ─ Missed: start orbit ─
      if (_selectedMesh) {
        _selectedMesh = null;
        if (typeof selectSceneObject === 'function') selectSceneObject(null);
        if (typeof highlightSelected === 'function') highlightSelected();
        if (typeof renderPropertiesPanel === 'function') renderPropertiesPanel();
      }
      isOrbitDragging = true;
      prevX = e.clientX; prevY = e.clientY;
    }
  });

  window.addEventListener('mouseup', () => {
    _isDraggingObject = false;
    isOrbitDragging = false;
  });

  window.addEventListener('mousemove', e => {
    if (_isDraggingObject && _selectedMesh) {
      // ─ Drag selected object on XZ plane ─
      const ndc = getNDC(e);
      _raycaster.setFromCamera(ndc, camera);
      const pt = new THREE.Vector3();
      if (_raycaster.ray.intersectPlane(_dragPlane, pt)) {
        const newPos = pt.add(_dragOffset);
        _selectedMesh.position.x = Math.round(newPos.x * 20) / 20; // snap 0.05m
        _selectedMesh.position.z = Math.round(newPos.z * 20) / 20;
        // Sync back to registry params
        if (typeof SCENE_REGISTRY !== 'undefined') {
          const entry = SCENE_REGISTRY.find(o => o.mesh === _selectedMesh);
          if (entry) {
            entry.params.x = _selectedMesh.position.x;
            entry.params.z = _selectedMesh.position.z;
            // Live-update properties panel without full re-render
            const px = document.querySelector('[data-prop="x"]');
            const pz = document.querySelector('[data-prop="z"]');
            if (px) px.value = entry.params.x.toFixed(2);
            if (pz) pz.value = entry.params.z.toFixed(2);
          }
        }
      }
    } else if (isOrbitDragging) {
      // ─ Orbit ─
      theta -= (e.clientX - prevX) * 0.008;
      phi   += (e.clientY - prevY) * 0.005;
      phi = Math.max(-Math.PI / 3, Math.min(Math.PI / 2.2, phi));
      prevX = e.clientX; prevY = e.clientY;
      updateCamera();
    }
  });

  container.addEventListener('wheel', e => {
    radius = Math.max(1.5, Math.min(12, radius + e.deltaY * 0.01));
    updateCamera();
  });

  // Touch: two-finger pinch to zoom, single finger orbit
  updateCamera();
}


let envGroup = null;

function changeEnvironment(envType) {
  if (!scene) return;
  
  // Remove existing environment group
  if (envGroup) {
    scene.remove(envGroup);
    envGroup = null;
  }

  envGroup = new THREE.Group();

  if (envType === 'hospital') {
    buildHospitalRoom(envGroup);
    if (typeof addLog === 'function') addLog('🏥 Loaded Hospital Room Environment', 'ok');
  } else if (envType === 'lab') {
    buildMedicalLab(envGroup);
    if (typeof addLog === 'function') addLog('🧪 Loaded Medical Laboratory Environment', 'ok');
  } else if (envType === 'home') {
    buildHomeKitchen(envGroup);
    if (typeof addLog === 'function') addLog('🏠 Loaded Home Kitchen Environment', 'ok');
  } else {
    if (typeof addLog === 'function') addLog('🌐 Switched to Default Grid Viewport', 'info');
  }

  scene.add(envGroup);
}

/* 🏥 Hospital Room Scene Builder */
function buildHospitalRoom(group) {
  // Floor mat
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Hospital Bed
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-1.2, 0, -0.8);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.8 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 2.2), frameMat);
  bedFrame.position.y = 0.3;
  bedGroup.add(bedFrame);

  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 2.1), mattressMat);
  mattress.position.y = 0.55;
  bedGroup.add(mattress);

  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.4), pillowMat);
  pillow.position.set(0, 0.68, -0.75);
  bedGroup.add(pillow);

  group.add(bedGroup);

  // Patient Monitor Unit
  const monGroup = new THREE.Group();
  monGroup.position.set(-0.3, 0, -1.5);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.1 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8), poleMat);
  pole.position.y = 0.9;
  monGroup.add(pole);

  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x10b981, emissiveIntensity: 0.4 });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.1), screenMat);
  screen.position.set(0, 1.4, 0);
  monGroup.add(screen);

  group.add(monGroup);

  // Overbed Medical Table (target for robot manipulation)
  const tableGroup = new THREE.Group();
  tableGroup.position.set(0.6, 0, 0.2);

  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), frameMat);
  tableTop.position.y = 0.85;
  tableGroup.add(tableTop);

  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85), poleMat);
  leg.position.set(0.35, 0.425, 0);
  tableGroup.add(leg);

  // Medical Tray items
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.5, roughness: 0.2 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.2), trayMat);
  tray.position.set(0.1, 0.88, 0);
  tableGroup.add(tray);

  group.add(tableGroup);
}

/* 🧪 Medical Laboratory Scene Builder */
function buildMedicalLab(group) {
  // Stainless steel floor
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.1, metalness: 0.5 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorMat);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // Lab Workbench
  const benchGroup = new THREE.Group();
  benchGroup.position.set(0, 0, -0.2);

  const topMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.2 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.0), topMat);
  top.position.y = 0.85;
  benchGroup.add(top);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
  [[-1.1,-0.45],[1.1,-0.45],[-1.1,0.45],[1.1,0.45]].forEach(([x,z]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85), legMat);
    l.position.set(x, 0.425, z);
    benchGroup.add(l);
  });

  // Test Tube Rack
  const rackGroup = new THREE.Group();
  rackGroup.position.set(-0.5, 0.89, 0.1);

  const rackMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
  const rackBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.15), rackMat);
  rackGroup.add(rackBase);

  // Test tubes
  const colors = [0xef4444, 0x10b981, 0x00f2fe, 0x7f00ff, 0xf59e0b];
  colors.forEach((c, idx) => {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: c, transmission: 0.8, opacity: 1, transparent: true, roughness: 0.1 });
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14), glassMat);
    tube.position.set(-0.12 + idx * 0.06, 0.08, 0);
    rackGroup.add(tube);
  });

  benchGroup.add(rackGroup);

  // Microscope
  const scopeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.35), scopeMat);
  scope.position.set(0.4, 1.05, -0.1);
  benchGroup.add(scope);

  group.add(benchGroup);
}

/* 🏠 Home Kitchen Scene Builder */
function buildHomeKitchen(group) {
  // Wood floor
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorMat);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // Kitchen Counter
  const counterGroup = new THREE.Group();
  counterGroup.position.set(0, 0, -0.4);

  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.2 });
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.9), graniteMat);
  counterTop.position.y = 0.88;
  counterGroup.add(counterTop);

  const woodCabinet = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.84, 0.85), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }));
  woodCabinet.position.y = 0.42;
  counterGroup.add(woodCabinet);

  // Coffee Mugs & Pitcher
  const mugMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1), mugMat);
  mug.position.set(-0.4, 0.97, 0.1);
  counterGroup.add(mug);

  const pitcherMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transmission: 0.9, transparent: true, roughness: 0.1 });
  const pitcher = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.25), pitcherMat);
  pitcher.position.set(0.3, 1.05, -0.05);
  counterGroup.add(pitcher);

  group.add(counterGroup);
}

/* FPS Counter */
function animateViewport() {
  requestAnimationFrame(animateViewport);
  renderer.render(scene, camera);

  if (typeof updateNPCPositions === 'function') {
    updateNPCPositions(0.016);
  }

  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    lastFpsTime = now;
    const el = document.getElementById('fpsCounter');
    if (el) el.textContent = `${currentFps} FPS`;
  }
}

/* ────────────────────────────────────────────────
   Sprint 6: Multi-Robot Embodiment Switcher
   ─────────────────────────────────────────────── */

let currentRobotType = 'franka_panda';
let ghostingGroup = null;
let trajectoryRibbonMesh = null;

function switchRobotEmbodiment(robotType) {
  currentRobotType = robotType;
  if (robotGroup) {
    scene.remove(robotGroup);
    robotGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  robotGroup = new THREE.Group();

  if (robotType === 'ur5e') {
    buildUR5eMesh(robotGroup);
  } else if (robotType === 'mobile_manipulator') {
    buildMobileManipulatorMesh(robotGroup);
  } else {
    // Default Franka Emika Panda
    buildFrankaPandaMesh(robotGroup);
  }

  scene.add(robotGroup);
  addLog(`🦾 Switched Robot Embodiment to: [${robotType.toUpperCase()}]`, 'ok');
}

function buildFrankaPandaMesh(group) {
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.08, 24), baseMat);
  base.position.y = 0.04;
  group.add(base);

  const linkMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
  const link1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 12), linkMat);
  link1.position.y = 0.35;
  group.add(link1);

  const jointMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.9, roughness: 0.1 });
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), jointMat);
  joint.position.y = 0.65;
  group.add(joint);

  const link2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.07), linkMat);
  link2.position.set(0, 0.95, 0);
  link2.rotation.z = 0.3;
  group.add(link2);

  const eeMat = new THREE.MeshStandardMaterial({ color: 0x7f00ff, metalness: 0.85, roughness: 0.15 });
  const ee = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.14, 12), eeMat);
  ee.position.set(0.14, 1.2, 0);
  group.add(ee);

  const fingerMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.6 });
  const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.09, 0.025), fingerMat);
  const f2 = f1.clone();
  f1.position.set(0.12, 1.14, 0.04);
  f2.position.set(0.12, 1.14, -0.04);
  group.add(f1, f2);
}

function buildUR5eMesh(group) {
  const urBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.1, 24), steelMat);
  base.position.y = 0.05;
  group.add(base);

  // Shoulder
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16), urBlue);
  shoulder.position.y = 0.22;
  group.add(shoulder);

  // Upper arm
  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16), steelMat);
  upperArm.position.set(0.1, 0.52, 0);
  upperArm.rotation.z = -0.3;
  group.add(upperArm);

  // Elbow & Forearm
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 16), urBlue);
  forearm.position.set(0.2, 0.85, 0);
  forearm.rotation.z = 0.4;
  group.add(forearm);

  // Wrist 1,2,3
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 12), steelMat);
  wrist.position.set(0.15, 1.15, 0);
  group.add(wrist);

  // RobotiQ 2F Gripper
  const gripBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), steelMat);
  gripBase.position.set(0.15, 1.25, 0);
  const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.02), urBlue);
  const fin2 = fin1.clone();
  fin1.position.set(0.15, 1.3, 0.03);
  fin2.position.set(0.15, 1.3, -0.03);
  group.add(gripBase, fin1, fin2);
}

function buildMobileManipulatorMesh(group) {
  // Mobile Base Chassis
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.55), chassisMat);
  chassis.position.y = 0.15;
  group.add(chassis);

  // 4 Mecanum / Rugged Wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
  const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16);
  const wPositions = [
    [-0.28, 0.1, 0.25],
    [0.28, 0.1, 0.25],
    [-0.28, 0.1, -0.25],
    [0.28, 0.1, -0.25]
  ];
  wPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(...pos);
    group.add(wheel);
  });

  // LiDAR Dome
  const lidarMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.6 });
  const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), lidarMat);
  lidar.position.set(0.25, 0.28, 0);
  group.add(lidar);

  // Mounted Arm on Base
  const armGroup = new THREE.Group();
  armGroup.position.set(-0.1, 0.26, 0);
  buildFrankaPandaMesh(armGroup);
  group.add(armGroup);
}

/* ────────────────────────────────────────────────
   Sprint 6: 3D Trajectory Ghosting & Path Ribbon
   ─────────────────────────────────────────────── */

function clearTrajectoryGhosting() {
  if (ghostingGroup) {
    scene.remove(ghostingGroup);
    ghostingGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    ghostingGroup = null;
  }
}

function renderTrajectoryGhosting(actionChunk) {
  clearTrajectoryGhosting();
  if (!actionChunk || actionChunk.length === 0) return;

  ghostingGroup = new THREE.Group();
  const points = [];

  const sphereGeo = new THREE.SphereGeometry(0.02, 12, 12);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });

  actionChunk.forEach((action, idx) => {
    const [x, y, z] = action.pos;
    points.push(new THREE.Vector3(x, y, z));

    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(x, y, z);
    ghostingGroup.add(sphere);
  });

  // Spline line
  if (points.length >= 2) {
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(50);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
    const splineLine = new THREE.Line(lineGeo, lineMat);
    ghostingGroup.add(splineLine);
  }

  scene.add(ghostingGroup);
}

function renderTrajectoryRibbon(trajectoryFrames) {
  if (trajectoryRibbonMesh) {
    scene.remove(trajectoryRibbonMesh);
    if (trajectoryRibbonMesh.geometry) trajectoryRibbonMesh.geometry.dispose();
    if (trajectoryRibbonMesh.material) trajectoryRibbonMesh.material.dispose();
    trajectoryRibbonMesh = null;
  }

  if (!trajectoryFrames || trajectoryFrames.length < 2) return;

  const points = trajectoryFrames.map(f => new THREE.Vector3(...f.pose));
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.008, 8, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x7f00ff,
    emissive: 0x7f00ff,
    emissiveIntensity: 0.5,
    roughness: 0.3
  });

  trajectoryRibbonMesh = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(trajectoryRibbonMesh);
}

window.switchRobotEmbodiment = switchRobotEmbodiment;
window.renderTrajectoryGhosting = renderTrajectoryGhosting;
window.renderTrajectoryRibbon = renderTrajectoryRibbon;
window.clearTrajectoryGhosting = clearTrajectoryGhosting;

/* ════════════════════════════════════════════════
   ENVIRONMENT MODULATION HANDLERS
   ════════════════════════════════════════════════ */
let _ambientLight = null, _dirLight = null, _pointLight = null, _floorMesh = null, _gridHelper = null;

function setEnvironmentLightingPreset(preset) {
  if (!scene) return;
  if (!_ambientLight) {
    scene.traverse(c => {
      if (c.isAmbientLight) _ambientLight = c;
      else if (c.isDirectionalLight) _dirLight = c;
      else if (c.isPointLight) _pointLight = c;
    });
  }

  const presets = {
    daylight: { bg: 0x0f172a, ambient: 0xffffff, ambInt: 1.5, dir: 0xffffff, dirInt: 1.8, pColor: 0x00f2fe, fog: 0x0f172a },
    neon:     { bg: 0x030712, ambient: 0x7f00ff, ambInt: 2.0, dir: 0x00f2fe, dirInt: 1.2, pColor: 0xff007f, fog: 0x030712 },
    hospital: { bg: 0x0c1322, ambient: 0xe0f2fe, ambInt: 2.5, dir: 0xffffff, dirInt: 2.0, pColor: 0x38bdf8, fog: 0x0c1322 },
    factory:  { bg: 0x111827, ambient: 0xfef08a, ambInt: 1.8, dir: 0xfbbf24, dirInt: 1.6, pColor: 0xf59e0b, fog: 0x111827 },
    sunset:   { bg: 0x1c1018, ambient: 0xfda4af, ambInt: 1.8, dir: 0xf97316, dirInt: 1.9, pColor: 0xf43f5e, fog: 0x1c1018 },
    night:    { bg: 0x020408, ambient: 0x1e293b, ambInt: 0.8, dir: 0x38bdf8, dirInt: 0.6, pColor: 0x00f2fe, fog: 0x020408 }
  };

  const cfg = presets[preset] || presets.daylight;
  scene.background = new THREE.Color(cfg.bg);
  if (scene.fog) scene.fog.color = new THREE.Color(cfg.fog);
  if (_ambientLight) { _ambientLight.color.set(cfg.ambient); _ambientLight.intensity = cfg.ambInt; }
  if (_dirLight) { _dirLight.color.set(cfg.dir); _dirLight.intensity = cfg.dirInt; }
  if (_pointLight) { _pointLight.color.set(cfg.pColor); }
}

function setFloorGridPreset(preset) {
  if (!scene) return;
  if (!_gridHelper) {
    scene.traverse(c => { if (c.isGridHelper) _gridHelper = c; });
  }

  const gridColors = {
    dark_grid:     { c1: 0x00f2fe, c2: 0x1e293b },
    hospital_tile: { c1: 0x38bdf8, c2: 0x64748b },
    factory_epoxy: { c1: 0x10b981, c2: 0x064e3b },
    wood_floor:    { c1: 0xd97706, c2: 0x78350f },
  };

  const c = gridColors[preset] || gridColors.dark_grid;
  if (_gridHelper) {
    scene.remove(_gridHelper);
    _gridHelper = new THREE.GridHelper(16, 32, c.c1, c.c2);
    _gridHelper.material.opacity = 0.45;
    _gridHelper.material.transparent = true;
    scene.add(_gridHelper);
  }
}

function setRobotBasePosition(x, y, z) {
  if (!robotGroup) return;
  robotGroup.position.set(x, y, z);
}

window.setEnvironmentLightingPreset = setEnvironmentLightingPreset;
window.setFloorGridPreset = setFloorGridPreset;
window.setRobotBasePosition = setRobotBasePosition;


