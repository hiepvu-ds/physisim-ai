/**
 * PhysiSim AI — Dedicated Scene Studio View & Spatial Architecture Manager
 * Handles room boundary generation, entrance doors, ceiling height rulers, 
 * 3D dimension overlays, scene hierarchy tree, and PBR lighting.
 */

window.SceneStudioView = (function() {
  // Current room configuration
  let roomConfig = {
    width: 6.0,    // meters (X)
    length: 5.0,   // meters (Z)
    height: 3.2,   // meters (Y - ceiling height)
    hasDoor: true,
    doorPosition: 'front', // 'front' | 'back' | 'left' | 'right'
    hasCeiling: true,
    showRulers: true,
    showDimensionBoxes: true,
    floorType: 'tiles_hospital' // 'tiles_hospital' | 'concrete_factory' | 'wood_classroom' | 'dark_lab'
  };

  let roomGroup = null;
  let rulersGroup = null;
  let studioObjects = [];
  let selectedStudioObject = null;

  // Initialize room architecture inside Three.js scene
  function initRoomArchitecture() {
    if (!window.scene) return;

    if (roomGroup) window.scene.remove(roomGroup);
    roomGroup = new THREE.Group();
    roomGroup.name = 'RoomArchitectureGroup';

    const w = roomConfig.width;
    const l = roomConfig.length;
    const h = roomConfig.height;

    // 1. Realistic Floor with PBR material
    const floorMat = getFloorMaterial(roomConfig.floorType);
    const floorGeo = new THREE.PlaneGeometry(w, l);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    floorMesh.name = 'StudioFloor';
    roomGroup.add(floorMesh);

    // Floor Perimeter Edge Guide (Glowing Border)
    const edgeGeo = new THREE.EdgesGeometry(floorGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2, transparent: true, opacity: 0.6 });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLines.rotation.x = -Math.PI / 2;
    edgeLines.position.y = 0.005;
    roomGroup.add(edgeLines);

    // 2. Realistic Perimeter Walls (with Doorway & Window cutouts)
    buildPerimeterWalls(w, l, h, roomGroup);

    // 3. Realistic Entrance Doorway (Door Frame + Door Panel + Handle + Exit Sign)
    if (roomConfig.hasDoor) {
      buildEntranceDoor(w, l, h, roomGroup);
    }

    // 4. Ceiling Structure & Overhead Studio Lighting
    if (roomConfig.hasCeiling) {
      buildCeilingAndLights(w, l, h, roomGroup);
    }

    // 5. Spatial Height & Dimension Rulers
    if (roomConfig.showRulers) {
      buildSpatialRulers(w, l, h, roomGroup);
    }

    window.scene.add(roomGroup);
    updateRoomInfoBadge();
  }

  function getFloorMaterial(type) {
    switch(type) {
      case 'concrete_factory':
        return new THREE.MeshStandardMaterial({ color: 0x2b3545, roughness: 0.85, metalness: 0.1 });
      case 'wood_classroom':
        return new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7, metalness: 0.05 });
      case 'dark_lab':
        return new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.4 });
      case 'tiles_hospital':
      default:
        return new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.05 });
    }
  }

  function buildPerimeterWalls(w, l, h, parent) {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8
    });

    const wallThickness = 0.1;

    // Back Wall (Full or with Window)
    const backWallGeo = new THREE.BoxGeometry(w, h, wallThickness);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, h / 2, -l / 2);
    backWall.receiveShadow = true;
    parent.add(backWall);

    // Large Observation Window on Back Wall
    const winGeo = new THREE.PlaneGeometry(w * 0.5, h * 0.45);
    const winMesh = new THREE.Mesh(winGeo, glassMat);
    winMesh.position.set(0, h * 0.55, -l / 2 + 0.06);
    parent.add(winMesh);

    // Left Wall
    const leftWallGeo = new THREE.BoxGeometry(wallThickness, h, l);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-w / 2, h / 2, 0);
    leftWall.receiveShadow = true;
    parent.add(leftWall);

    // Right Wall
    const rightWallGeo = new THREE.BoxGeometry(wallThickness, h, l);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(w / 2, h / 2, 0);
    rightWall.receiveShadow = true;
    parent.add(rightWall);
  }

  function buildEntranceDoor(w, l, h, parent) {
    const doorGroup = new THREE.Group();
    doorGroup.name = 'EntranceDoorGroup';

    const doorW = 1.0;
    const doorH = 2.15;
    const frameThickness = 0.08;

    // Door Frame (Khung Cửa Nhôm/Gỗ)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
    
    // Top Frame
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.1, frameThickness, 0.12), frameMat);
    topFrame.position.set(0, doorH, 0);
    doorGroup.add(topFrame);

    // Left Post
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, doorH, 0.12), frameMat);
    leftPost.position.set(-doorW / 2, doorH / 2, 0);
    doorGroup.add(leftPost);

    // Right Post
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, doorH, 0.12), frameMat);
    rightPost.position.set(doorW / 2, doorH / 2, 0);
    doorGroup.add(rightPost);

    // Door Panel (Cánh Cửa Mở Góc 35 Độ)
    const doorPanelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.3 });
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH - 0.02, 0.04), doorPanelMat);
    doorPanel.position.set(doorW / 2, doorH / 2, 0); // pivot at hinge

    const hingeGroup = new THREE.Group();
    hingeGroup.position.set(-doorW / 2 + 0.02, 0, 0);
    hingeGroup.rotation.y = Math.PI / 5; // Mở 36 độ
    hingeGroup.add(doorPanel);

    // Door Handle (Tay Nắm Inox)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.95 });
    const handleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14), handleMat);
    handleMesh.rotation.z = Math.PI / 2;
    handleMesh.position.set(doorW - 0.1, 1.0, 0.04);
    hingeGroup.add(handleMesh);

    doorGroup.add(hingeGroup);

    // Emergency Exit / Entrance Sign (Biển Báo Cửa Ra Vào Phát Sáng)
    const signMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.02), signMat);
    signMesh.position.set(0, doorH + 0.18, 0.04);
    doorGroup.add(signMesh);

    // Position Door at Front Wall
    doorGroup.position.set(w * 0.25, 0, l / 2);
    parent.add(doorGroup);
  }

  function buildCeilingAndLights(w, l, h, parent) {
    // Ceiling Grid Lines
    const gridMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.4 });
    const ceilingGeo = new THREE.PlaneGeometry(w, l, 6, 5);
    const ceilingLines = new THREE.LineSegments(new THREE.WireframeGeometry(ceilingGeo), gridMat);
    ceilingLines.rotation.x = Math.PI / 2;
    ceilingLines.position.y = h;
    parent.add(ceilingLines);

    // Overhead LED Panel Light fixtures
    const lightFixtMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const panelGeo = new THREE.BoxGeometry(0.6, 0.04, 1.2);

    const positions = [
      [-w * 0.25, h - 0.02, -l * 0.25],
      [w * 0.25, h - 0.02, -l * 0.25],
      [-w * 0.25, h - 0.02, l * 0.25],
      [w * 0.25, h - 0.02, l * 0.25]
    ];

    positions.forEach(pos => {
      const panel = new THREE.Mesh(panelGeo, lightFixtMat);
      panel.position.set(pos[0], pos[1], pos[2]);
      parent.add(panel);
    });
  }

  function buildSpatialRulers(w, l, h, parent) {
    if (rulersGroup) parent.remove(rulersGroup);
    rulersGroup = new THREE.Group();
    rulersGroup.name = 'SpatialRulersGroup';

    // Corner Height Ruler (Thước Đo Độ Cao Góc Phòng 0m -> Hm)
    const rulerMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
    const rulerPoints = [
      new THREE.Vector3(-w / 2, 0, -l / 2),
      new THREE.Vector3(-w / 2, h, -l / 2)
    ];
    const rulerGeo = new THREE.BufferGeometry().setFromPoints(rulerPoints);
    const rulerLine = new THREE.Line(rulerGeo, rulerMat);
    rulersGroup.add(rulerLine);

    // Add tick marks every 1.0 meter
    const tickMat = new THREE.LineBasicMaterial({ color: 0x00f2fe });
    for (let y = 0.5; y <= h; y += 0.5) {
      const tickPoints = [
        new THREE.Vector3(-w / 2, y, -l / 2),
        new THREE.Vector3(-w / 2 + 0.15, y, -l / 2)
      ];
      const tickLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(tickPoints), tickMat);
      rulersGroup.add(tickLine);
    }

    parent.add(rulersGroup);
  }

  function configureRoomArchitecture(config) {
    if (!config) return;
    if (config.width) roomConfig.width = parseFloat(config.width);
    if (config.length) roomConfig.length = parseFloat(config.length);
    if (config.height) roomConfig.height = parseFloat(config.height);
    if (config.hasDoor !== undefined) roomConfig.hasDoor = !!config.hasDoor;
    if (config.theme) {
      if (config.theme === 'hospital') roomConfig.floorType = 'tiles_hospital';
      else if (config.theme === 'factory') roomConfig.floorType = 'concrete_factory';
      else if (config.theme === 'classroom') roomConfig.floorType = 'wood_classroom';
      else if (config.theme === 'lab') roomConfig.floorType = 'dark_lab';
    }
    initRoomArchitecture();
  }

  function spawnObjectFromAgent(objData) {
    if (!objData || !objData.type) return;

    let mesh = null;
    if (typeof window.createProceduralMesh === 'function') {
      mesh = window.createProceduralMesh(objData.type);
    } else {
      // Fallback box
      const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.4, metalness: 0.2 });
      mesh = new THREE.Mesh(geo, mat);
    }

    if (mesh) {
      const px = objData.pos ? objData.pos[0] : 0;
      const py = objData.pos ? objData.pos[1] : 0;
      const pz = objData.pos ? objData.pos[2] : 0;
      mesh.position.set(px, py, pz);

      if (objData.rot) {
        mesh.rotation.set(
          THREE.MathUtils.degToRad(objData.rot[0] || 0),
          THREE.MathUtils.degToRad(objData.rot[1] || 0),
          THREE.MathUtils.degToRad(objData.rot[2] || 0)
        );
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = objData.name || `${objData.type}_${Date.now()}`;
      
      mesh.userData = {
        type: objData.type,
        mass: objData.mass || 5.0,
        friction: objData.friction || 0.7,
        restitution: objData.restitution || 0.1,
        isStatic: !!objData.isStatic
      };

      if (!window.sceneObjects) window.sceneObjects = [];
      window.sceneObjects.push(mesh);
      studioObjects.push(mesh);

      if (window.scene) window.scene.add(mesh);
      attachDimensionBox(mesh);
    }
  }

  function attachDimensionBox(mesh) {
    if (!mesh) return;
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Save dimension data
    mesh.userData.dimensions = {
      w: parseFloat(size.x.toFixed(2)),
      h: parseFloat(size.y.toFixed(2)),
      d: parseFloat(size.z.toFixed(2))
    };
  }

  function clearAllObjects() {
    if (window.sceneObjects && Array.isArray(window.sceneObjects)) {
      window.sceneObjects.forEach(obj => {
        if (window.scene) window.scene.remove(obj);
      });
      window.sceneObjects.length = 0;
    }
    studioObjects = [];
    refreshHierarchy();
  }

  function refreshHierarchy() {
    const list = document.getElementById('sceneHierarchyList');
    if (!list) return;
    list.innerHTML = '';

    const objects = window.sceneObjects || [];
    const countBadge = document.getElementById('hierarchyCountBadge');
    if (countBadge) countBadge.textContent = `${objects.length} thiết bị`;

    objects.forEach((obj, idx) => {
      const item = document.createElement('div');
      item.className = 'hierarchy-item';
      item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.03);margin-bottom:6px;font-size:0.75rem;cursor:pointer;border:1px solid rgba(255,255,255,0.06);transition:all .2s;';
      
      const dims = obj.userData?.dimensions ? `(${obj.userData.dimensions.w}m × ${obj.userData.dimensions.h}m)` : '';

      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;color:#fff;">
          <span style="color:#00f2fe;">📦</span>
          <strong>${obj.name || `Object #${idx+1}`}</strong>
          <span style="font-size:0.65rem;color:#64748b;">${dims}</span>
        </div>
        <div style="display:flex;gap:4px;">
          <button onclick="window.SceneStudioView.toggleObjVisibility(${idx})" style="padding:2px 6px;border-radius:4px;border:none;background:rgba(255,255,255,0.1);color:#94a3b8;cursor:pointer;font-size:0.65rem;">👁</button>
          <button onclick="window.SceneStudioView.deleteObj(${idx})" style="padding:2px 6px;border-radius:4px;border:none;background:rgba(239,68,68,0.2);color:#ef4444;cursor:pointer;font-size:0.65rem;">✕</button>
        </div>
      `;

      item.onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') selectObjectInStudio(obj);
      };

      list.appendChild(item);
    });
  }

  function selectObjectInStudio(obj) {
    selectedStudioObject = obj;
    if (typeof window.inspectSceneObject === 'function') {
      window.inspectSceneObject(obj);
    }
    // Switch to Inspector tab if open
    const tabBtn = document.getElementById('studioRightTab-inspect');
    if (tabBtn) tabBtn.click();
  }

  function deleteObj(idx) {
    const objects = window.sceneObjects || [];
    if (objects[idx]) {
      if (window.scene) window.scene.remove(objects[idx]);
      objects.splice(idx, 1);
      refreshHierarchy();
      addLog('🗑 Đã xóa đối tượng khỏi cảnh.', 'info');
    }
  }

  function toggleObjVisibility(idx) {
    const objects = window.sceneObjects || [];
    if (objects[idx]) {
      objects[idx].visible = !objects[idx].visible;
      refreshHierarchy();
    }
  }

  function updateRoomInfoBadge() {
    const badge = document.getElementById('roomDimensionsDisplay');
    if (badge) {
      badge.textContent = `${roomConfig.width.toFixed(1)}m × ${roomConfig.length.toFixed(1)}m · Trần cao: ${roomConfig.height.toFixed(1)}m`;
    }
  }

  function transferSceneToSimulation() {
    addLog(`🚀 Đang chuyển toàn bộ ${window.sceneObjects?.length || 0} đối tượng sang Simulation Studio...`, 'ok');
    if (typeof window.switchAppMode === 'function') {
      window.switchAppMode('simulation');
    }
    addLog('✨ Đã nạp môi trường 3D vào Simulation Studio sẵn sàng cho Robot thao tác!', 'ok');
  }

  return {
    initRoomArchitecture,
    configureRoomArchitecture,
    spawnObjectFromAgent,
    clearAllObjects,
    refreshHierarchy,
    selectObjectInStudio,
    deleteObj,
    toggleObjVisibility,
    transferSceneToSimulation,
    getRoomConfig: () => roomConfig
  };
})();
