/**
 * PhysiSim AI — Scene Generator Wizard
 * Procedural generation: Hospital, Factory, Office, Lab, Warehouse
 * Outputs: Three.js preview + YAML config + MJCF XML
 */

/* ═══════════════════════════════════════════════════════════
   TEMPLATES
   ═══════════════════════════════════════════════════════════ */
const SCENE_TEMPLATES = {
  hospital: {
    label: '🏥 Hospital', color: '#38bdf8',
    desc: 'Multi-floor hospital with patient rooms, surgery, ICU, corridors',
    defaults: { floors: 3, roomsPerFloor: 20, roomW: 4, roomD: 8, ceilH: 3,
      types: { patient: 60, surgery: 10, icu: 10, corridor: 20 },
      npcCount: 30, npcTypes: ['nurse','doctor','patient'],
      robots: ['franka'], randProfile: 'medium' }
  },
  factory: {
    label: '🏭 Factory', color: '#f59e0b',
    desc: 'Industrial facility with conveyor belts, assembly lines, storage zones',
    defaults: { areaW: 50, areaD: 100, ceilH: 8,
      zones: { assembly: 40, storage: 30, qc: 20, loading: 10 },
      conveyors: 6, conveyorSpeed: 0.3,
      npcCount: 20, npcTypes: ['worker','forklift_operator'],
      robots: ['ur5','franka'], randProfile: 'hard' }
  },
  office: {
    label: '🏢 Office', color: '#a78bfa',
    desc: 'Open-plan office with desks, meeting rooms, kitchen area',
    defaults: { floors: 2, roomsPerFloor: 15, roomW: 3, roomD: 5, ceilH: 2.7,
      types: { openplan: 50, meeting: 20, kitchen: 10, corridor: 20 },
      npcCount: 40, npcTypes: ['employee'],
      robots: ['ur5'], randProfile: 'light' }
  },
  lab: {
    label: '🔬 Lab', color: '#10b981',
    desc: 'Research laboratory with workbenches, microscopes, chemical storage',
    defaults: { floors: 1, roomsPerFloor: 8, roomW: 5, roomD: 10, ceilH: 3.5,
      types: { wet_lab: 40, dry_lab: 30, storage: 20, corridor: 10 },
      npcCount: 10, npcTypes: ['scientist'],
      robots: ['franka','kinova'], randProfile: 'precise' }
  },
  warehouse: {
    label: '🏪 Warehouse', color: '#ef4444',
    desc: 'Large storage facility with racks, loading docks, pick stations',
    defaults: { areaW: 80, areaD: 120, ceilH: 12,
      zones: { storage: 60, pick: 20, receiving: 10, shipping: 10 },
      rackRows: 10, rackHeight: 10,
      npcCount: 15, npcTypes: ['picker','dock_worker'],
      robots: ['ur5','spot'], randProfile: 'medium' }
  },
  home: {
    label: '🏠 Home', color: '#f97316',
    desc: 'Residential home with living room, kitchen, bedroom, bathroom',
    defaults: { floors: 1, roomW: 4, roomD: 5, ceilH: 2.5,
      rooms: ['living','kitchen','bedroom','bathroom','hallway'],
      npcCount: 3, npcTypes: ['resident'],
      robots: ['franka'], randProfile: 'light' }
  },
};

const RAND_PROFILES = {
  light:   { frictionRange:[0.5,0.8], massJitter:0.05, lightRange:[0.9,1.2], posNoise:0.02 },
  medium:  { frictionRange:[0.4,0.9], massJitter:0.10, lightRange:[0.7,1.5], posNoise:0.05 },
  hard:    { frictionRange:[0.3,1.0], massJitter:0.20, lightRange:[0.5,2.0], posNoise:0.10 },
  precise: { frictionRange:[0.55,0.65], massJitter:0.02, lightRange:[0.95,1.05], posNoise:0.01 },
};

/* Generated scene stored here */
let GENERATED_SCENE = { objects: [], npcs: [], config: null, mjcf: '' };
let wizardStep = 1;
let selectedTemplate = null;
let wizardConfig = {};

/* ═══════════════════════════════════════════════════════════
   OPEN / CLOSE WIZARD
   ═══════════════════════════════════════════════════════════ */
function openSceneGeneratorWizard() {
  wizardStep = 1;
  selectedTemplate = null;
  wizardConfig = {};
  document.getElementById('sceneGenOverlay').classList.add('open');
  renderWizardStep(1);
}
function closeSceneGeneratorWizard() {
  document.getElementById('sceneGenOverlay').classList.remove('open');
}

/* ═══════════════════════════════════════════════════════════
   WIZARD STEPS
   ═══════════════════════════════════════════════════════════ */
function renderWizardStep(step) {
  wizardStep = step;
  // Update step indicators
  [1,2,3].forEach(s => {
    const el = document.getElementById(`wizStep${s}`);
    if (el) {
      el.style.background = s < step ? 'var(--accent-emerald)' : s === step ? 'var(--primary-cyan)' : 'rgba(255,255,255,0.1)';
      el.style.color = s <= step ? '#fff' : '#64748b';
    }
  });
  // Update nav buttons
  document.getElementById('wizPrevBtn').style.display = step > 1 ? 'inline-block' : 'none';
  document.getElementById('wizNextBtn').textContent = step === 3 ? '🚀 Generate Scene' : 'Next →';

  const body = document.getElementById('wizardBody');
  if (step === 1) body.innerHTML = renderStep1();
  else if (step === 2) body.innerHTML = renderStep2();
  else if (step === 3) renderStep3();
}

function renderStep1() {
  return `
    <div style="font-size:0.85rem;color:#94a3b8;margin-bottom:16px;">
      Choose a scene template to procedurally generate.
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
      ${Object.entries(SCENE_TEMPLATES).map(([key, t]) => `
        <div class="template-card ${selectedTemplate===key?'selected':''}" onclick="selectTemplate('${key}')"
          style="border-color:${selectedTemplate===key ? t.color : 'rgba(255,255,255,0.08)'}">
          <div style="font-size:2rem">${t.label.split(' ')[0]}</div>
          <div style="font-size:0.78rem;font-weight:800;color:#fff;margin:6px 0 4px">${t.label.split(' ').slice(1).join(' ')}</div>
          <div style="font-size:0.63rem;color:#94a3b8;line-height:1.4">${t.desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function selectTemplate(key) {
  selectedTemplate = key;
  wizardConfig = JSON.parse(JSON.stringify(SCENE_TEMPLATES[key].defaults));
  renderWizardStep(1);
}

function renderStep2() {
  if (!selectedTemplate) return '<div style="color:#ef4444;">Please select a template first.</div>';
  const t = SCENE_TEMPLATES[selectedTemplate];
  const d = wizardConfig;

  if (selectedTemplate === 'hospital' || selectedTemplate === 'office') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div class="wiz-section">🏗️ Building Layout</div>
          ${wizField('Floors', 'floors', d.floors, 1, 20)}
          ${wizField('Rooms per Floor', 'roomsPerFloor', d.roomsPerFloor, 5, 50)}
          ${wizField('Room Width (m)', 'roomW', d.roomW, 2, 10, 0.5)}
          ${wizField('Room Depth (m)', 'roomD', d.roomD, 4, 20, 0.5)}
          ${wizField('Ceiling Height (m)', 'ceilH', d.ceilH, 2, 6, 0.1)}

          <div class="wiz-section" style="margin-top:12px;">👥 Population</div>
          ${wizField('NPC Count', 'npcCount', d.npcCount, 0, 200)}
          ${wizField('Robots', 'robotCount', d.robots?.length||1, 0, 10)}
        </div>
        <div>
          <div class="wiz-section">🏠 Room Type Distribution (%)</div>
          ${Object.entries(d.types||{}).map(([k,v]) => wizField(k.charAt(0).toUpperCase()+k.slice(1), `type_${k}`, v, 0, 100)).join('')}

          <div class="wiz-section" style="margin-top:12px;">🎲 Domain Randomization</div>
          ${wizSelect('rand_profile', d.randProfile||'medium', RAND_PROFILES)}
          <div style="font-size:0.62rem;color:#64748b;margin-top:4px;">
            Controls physics/visual noise per episode for sim-to-real transfer
          </div>
        </div>
      </div>
    `;
  }

  if (selectedTemplate === 'factory' || selectedTemplate === 'warehouse') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div class="wiz-section">🏗️ Facility Layout</div>
          ${wizField('Area Width (m)', 'areaW', d.areaW, 20, 200, 5)}
          ${wizField('Area Depth (m)', 'areaD', d.areaD, 20, 200, 5)}
          ${wizField('Ceiling Height (m)', 'ceilH', d.ceilH, 4, 20, 0.5)}
          ${selectedTemplate==='factory' ? wizField('Conveyors', 'conveyors', d.conveyors, 0, 20) : wizField('Rack Rows', 'rackRows', d.rackRows, 2, 30)}

          <div class="wiz-section" style="margin-top:12px;">👥 Population</div>
          ${wizField('Worker Count', 'npcCount', d.npcCount, 0, 100)}
          ${wizField('Robots', 'robotCount', d.robots?.length||1, 0, 10)}
        </div>
        <div>
          <div class="wiz-section">📍 Zone Distribution (%)</div>
          ${Object.entries(d.zones||{}).map(([k,v]) => wizField(k.charAt(0).toUpperCase()+k.slice(1), `zone_${k}`, v, 0, 100)).join('')}

          <div class="wiz-section" style="margin-top:12px;">🎲 Domain Randomization</div>
          ${wizSelect('rand_profile', d.randProfile||'medium', RAND_PROFILES)}
        </div>
      </div>
    `;
  }

  // Generic fallback
  return `
    <div style="font-size:0.8rem;color:#94a3b8;">
      Template "${selectedTemplate}" is being configured with defaults.<br>
      Proceed to Step 3 to preview and generate.
    </div>
  `;
}

function wizField(label, key, val, min, max, step=1) {
  return `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
        <label style="font-size:0.65rem;color:#94a3b8;">${label}</label>
        <span style="font-size:0.65rem;color:#00f2fe;font-family:monospace;" id="wv_${key}">${val}</span>
      </div>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${val}"
        style="width:100%;accent-color:#00f2fe;"
        oninput="wizardConfig['${key}']=parseFloat(this.value);document.getElementById('wv_${key}').textContent=this.value">
    </div>
  `;
}

function wizSelect(key, val, options) {
  return `
    <select onchange="wizardConfig['${key}']=this.value"
      style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:5px;color:#e2e8f0;font-size:0.72rem;">
      ${Object.keys(options).map(k => `<option value="${k}" ${k===val?'selected':''}>${k.charAt(0).toUpperCase()+k.slice(1)}</option>`).join('')}
    </select>
  `;
}

function renderStep3() {
  const body = document.getElementById('wizardBody');
  body.innerHTML = `
    <div style="display:flex;gap:12px;height:100%;">
      <!-- 3D Preview Canvas -->
      <div style="flex:1;border:1px solid rgba(0,242,254,0.2);border-radius:10px;overflow:hidden;position:relative;min-height:340px;">
        <canvas id="genPreviewCanvas" style="width:100%;height:100%;"></canvas>
        <div style="position:absolute;top:8px;left:8px;font-size:0.65rem;color:#00f2fe;background:rgba(7,11,20,0.8);padding:4px 8px;border-radius:5px;">
          Three.js Preview
        </div>
      </div>
      <!-- Summary + Controls -->
      <div style="width:220px;display:flex;flex-direction:column;gap:8px;">
        <div class="wiz-section">📊 Scene Summary</div>
        <div id="sceneSummary" style="font-size:0.68rem;color:#94a3b8;line-height:1.8;"></div>

        <div class="wiz-section" style="margin-top:8px;">⬇️ Export</div>
        <button onclick="exportGeneratedYAML()" style="width:100%;padding:7px;border-radius:7px;border:1px solid rgba(0,242,254,0.3);background:transparent;color:#00f2fe;font-size:0.72rem;cursor:pointer;margin-bottom:4px;">
          📋 Export YAML Config
        </button>
        <button onclick="exportGeneratedMJCF()" style="width:100%;padding:7px;border-radius:7px;border:1px solid rgba(16,185,129,0.3);background:transparent;color:#10b981;font-size:0.72rem;cursor:pointer;margin-bottom:4px;">
          ⚙️ Export MJCF (MuJoCo)
        </button>
        <button onclick="loadGeneratedScene()" style="width:100%;padding:10px;border:none;border-radius:8px;background:linear-gradient(135deg,#7f00ff,#4facfe);color:#fff;font-size:0.78rem;font-weight:800;cursor:pointer;">
          🚀 Load into Viewport
        </button>

        <div class="wiz-section" style="margin-top:8px;">🎲 Randomization</div>
        <div id="randSummary" style="font-size:0.62rem;color:#64748b;line-height:1.6;"></div>
      </div>
    </div>
  `;
  // Run generator
  setTimeout(() => buildGeneratedScene(), 100);
}

/* ═══════════════════════════════════════════════════════════
   SCENE BUILDERS
   ═══════════════════════════════════════════════════════════ */
function buildGeneratedScene() {
  GENERATED_SCENE = { objects: [], npcs: [], config: { template: selectedTemplate, ...wizardConfig }, mjcf: '' };

  if (selectedTemplate === 'hospital') buildHospitalScene();
  else if (selectedTemplate === 'factory') buildFactoryScene();
  else if (selectedTemplate === 'office') buildOfficeScene();
  else if (selectedTemplate === 'lab') buildLabScene();
  else if (selectedTemplate === 'warehouse') buildWarehouseScene();
  else if (selectedTemplate === 'home') buildHomeScene();

  initPreviewRenderer();
  updateSceneSummary();
  generateMJCFString();
}

/* ─── Hospital ─── */
function buildHospitalScene() {
  const c = wizardConfig;
  const floors = Math.round(c.floors||3);
  const rCount = Math.round(c.roomsPerFloor||20);
  const rW = c.roomW||4, rD = c.roomD||8, rH = c.ceilH||3;
  const cols = Math.ceil(Math.sqrt(rCount));

  for (let f = 0; f < floors; f++) {
    const baseY = f * (rH + 0.2);
    // Floor slab
    addGenObject('box', [cols*rW, 0.15, cols*rD + 2],
      [(cols*rW)/2 - rW, baseY - 0.07, (cols*rD)/2], 0xf1f5f9, 'Floor');

    for (let r = 0; r < rCount; r++) {
      const col = r % cols, row = Math.floor(r / cols);
      const px = col * rW, pz = row * rD;

      // Assign room type
      const rand = Math.random() * 100;
      const types = c.types || c.type_ || {};
      let roomType = 'patient', roomColor = 0x38bdf8;
      let cumulative = 0;
      for (const [k,v] of Object.entries(types)) {
        cumulative += v;
        if (rand < cumulative) { roomType = k; break; }
      }
      if (roomType === 'surgery') roomColor = 0xef4444;
      else if (roomType === 'icu') roomColor = 0xf59e0b;
      else if (roomType === 'corridor') roomColor = 0x64748b;

      // Room walls (thin boxes)
      addGenObject('box', [rW, rH, 0.12], [px+rW/2, baseY+rH/2, pz], roomColor, roomType);
      addGenObject('box', [0.12, rH, rD],  [px, baseY+rH/2, pz+rD/2], roomColor, roomType);

      // Add room equipment
      addRoomEquipment(roomType, px, baseY, pz, rW, rD);
    }
    // Corridor between rows
    addGenObject('box', [cols*rW, 0.04, 2], [(cols*rW)/2-rW, baseY+0.02, cols*rD+1], 0x94a3b8, 'Corridor');
  }

  // NPCs
  const npcTypes = c.npcTypes || ['nurse','doctor'];
  for (let i = 0; i < Math.round(c.npcCount||30); i++) {
    const t = npcTypes[i % npcTypes.length];
    addGenNPC(t, [Math.random()*cols*rW, 0, Math.random()*cols*rD]);
  }
}

function addRoomEquipment(roomType, px, baseY, pz, rW, rD) {
  const cx = px + rW/2, cy = baseY, cz = pz + rD/2;
  if (roomType === 'patient') {
    addGenObject('box',[0.9,0.5,2.0],[cx-0.3,cy+0.35,cz], 0x38bdf8, 'Med Bed');
    addGenObject('box',[0.3,0.8,0.3],[cx+0.7,cy+0.6,cz-0.5], 0x0f172a, 'Monitor');
    addGenObject('cyl',[0.02,0.02,1.6],[cx+0.5,cy+1.0,cz+0.5], 0xcbd5e1, 'IV Stand');
  } else if (roomType === 'surgery') {
    addGenObject('box',[0.7,0.8,2.0],[cx,cy+0.6,cz], 0xe2e8f0, 'Op. Table');
    addGenObject('cyl',[0.25,0.25,0.2],[cx,cy+1.5,cz], 0xfef08a, 'Op. Light');
    addGenObject('box',[0.6,0.9,0.4],[cx-0.8,cy+0.65,cz], 0x334155, 'Anesthesia');
  } else if (roomType === 'icu') {
    addGenObject('box',[0.9,0.4,2.0],[cx,cy+0.3,cz], 0x38bdf8, 'ICU Bed');
    addGenObject('box',[0.4,1.2,0.3],[cx+0.8,cy+0.9,cz-0.8], 0x0f172a, 'Monitors');
    addGenObject('cyl',[0.1,0.1,1.0],[cx-0.5,cy+0.7,cz+0.5], 0x10b981, 'Ventilator');
  }
}

/* ─── Factory ─── */
function buildFactoryScene() {
  const c = wizardConfig;
  const W = c.areaW||50, D = c.areaD||100, H = c.ceilH||8;

  // Floor
  addGenObject('box',[W,0.2,D],[W/2,0,D/2], 0x374151, 'Factory Floor');
  // Ceiling structure
  addGenObject('box',[W,0.3,D],[W/2,H,D/2], 0x1e293b, 'Ceiling');

  const zones = c.zones || { assembly:40, storage:30, qc:20, loading:10 };
  let zStart = 0;
  const zColors = { assembly:0xf59e0b, storage:0x64748b, qc:0x10b981, loading:0xef4444 };

  for (const [zone, pct] of Object.entries(zones)) {
    const zD = D * (pct / 100);
    const color = zColors[zone] || 0x475569;

    // Zone floor marker
    addGenObject('box',[W,0.02,zD],[W/2,0.11,zStart+zD/2], color, zone+' Zone');

    if (zone === 'assembly') {
      // Conveyor belts
      const convCount = Math.round(c.conveyors||6);
      for (let i = 0; i < convCount; i++) {
        const cx = 3 + i * (W-6) / Math.max(convCount-1,1);
        addGenObject('box',[0.8,0.5,zD*0.8],[cx,0.5,zStart+zD*0.4], 0x1e293b, 'Conveyor');
        addGenObject('box',[0.7,0.08,zD*0.8],[cx,0.75,zStart+zD*0.4], 0x374151, 'Belt');
        // Boxes on conveyor
        for (let b = 0; b < 4; b++) {
          addGenObject('box',[0.3,0.3,0.3],[cx,0.95,zStart+1+b*zD*0.2], 0xd97706, 'Box');
        }
      }
    } else if (zone === 'storage') {
      // Pallet racks
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
          const rx = 2 + col * (W-4)/7, rz = zStart + 1 + row * (zD-2)/4;
          addGenObject('box',[1.0,3.0,0.1],[rx,1.5,rz], 0x475569, 'Rack');
          addGenObject('box',[0.8,0.15,0.7],[rx,0.5,rz], 0xd97706, 'Pallet');
          addGenObject('box',[0.8,0.15,0.7],[rx,1.5,rz], 0xd97706, 'Pallet');
        }
      }
    } else if (zone === 'qc') {
      for (let t = 0; t < 4; t++) {
        const tx = 5 + t*(W-10)/3, tz = zStart + zD/2;
        addGenObject('box',[1.5,0.9,0.8],[tx,0.65,tz], 0x334155, 'QC Table');
        addGenObject('box',[0.4,0.3,0.1],[tx,1.05,tz-0.3], 0x0f172a, 'Monitor');
      }
    } else if (zone === 'loading') {
      for (let d = 0; d < 3; d++) {
        const dx = 5 + d*(W-10)/2;
        addGenObject('box',[3,3,0.3],[dx,1.5,zStart+0.2], 0x64748b, 'Dock Door');
        addGenObject('box',[2.5,0.4,6],[dx,0.3,zStart+3.5], 0xd97706, 'Loading Platform');
      }
    }

    zStart += zD;
  }

  // Workers
  const npcT = c.npcTypes || ['worker'];
  for (let i = 0; i < Math.round(c.npcCount||20); i++) {
    addGenNPC(npcT[i%npcT.length], [Math.random()*W, 0, Math.random()*D]);
  }
}

/* ─── Office ─── */
function buildOfficeScene() {
  const c = wizardConfig;
  const floors = Math.round(c.floors||2), rW = c.roomW||3, rD = c.roomD||5;
  const cols = 5, rows = Math.round((c.roomsPerFloor||15)/cols);

  for (let f = 0; f < floors; f++) {
    const bY = f * (c.ceilH||2.7 + 0.2);
    addGenObject('box',[cols*rW,0.15,rows*rD],[cols*rW/2,bY-0.07,rows*rD/2], 0xf8fafc,'Floor');
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      const px = col*rW, pz = r*rD;
      addGenObject('box',[1.2,0.75,0.6],[px+0.6,bY+0.55,pz+0.5], 0x334155,'Desk');
      addGenObject('box',[0.6,0.4,0.08],[px+0.6,bY+0.8,pz+0.2], 0x0f172a,'Monitor');
      addGenObject('cyl',[0.2,0.2,0.35],[px+0.6,bY+0.27,pz+0.8], 0x475569,'Chair');
    }
  }
  for (let i = 0; i < Math.round(c.npcCount||40); i++)
    addGenNPC('employee',[Math.random()*cols*rW,0,Math.random()*rows*rD]);
}

/* ─── Lab ─── */
function buildLabScene() {
  const c = wizardConfig;
  const rCount = Math.round(c.roomsPerFloor||8);
  for (let r = 0; r < rCount; r++) {
    const px = (r%4)*6, pz = Math.floor(r/4)*12;
    addGenObject('box',[5,2.5,10],[px+2.5,1.25,pz+5], 0x0f172a,'Lab Room');
    addGenObject('box',[2,0.8,0.7],[px+1,0.65,pz+1], 0x1e293b,'Workbench');
    addGenObject('cyl',[0.06,0.09,0.35],[px+1,1.22,pz+1], 0x1e293b,'Microscope');
    addGenObject('cyl',[0.12,0.12,0.2],[px+1.5,1.12,pz+1.5], 0x334155,'Centrifuge');
    addGenObject('box',[0.3,0.08,0.15],[px+0.8,1.05,pz+1.8], 0xf59e0b,'Tube Rack');
  }
  for (let i = 0; i < Math.round(c.npcCount||10); i++)
    addGenNPC('scientist',[Math.random()*24,0,Math.random()*24]);
}

/* ─── Warehouse ─── */
function buildWarehouseScene() {
  const c = wizardConfig;
  const W = c.areaW||80, D = c.areaD||120;
  addGenObject('box',[W,0.2,D],[W/2,0,D/2], 0x374151,'Floor');
  const rows = Math.round(c.rackRows||10);
  for (let r = 0; r < rows; r++) {
    for (let level = 0; level < 4; level++) {
      addGenObject('box',[W-10,0.1,0.9],[W/2,1+level*2.5,2+r*(D-4)/rows], 0x475569,'Shelf');
      for (let b = 0; b < 8; b++)
        addGenObject('box',[0.6,0.6,0.5],[3+b*(W-10)/8, 1.4+level*2.5, 2+r*(D-4)/rows], 0xd97706,'Box');
    }
  }
  for (let i = 0; i < Math.round(c.npcCount||15); i++)
    addGenNPC('picker',[Math.random()*W,0,Math.random()*D]);
}

/* ─── Home ─── */
function buildHomeScene() {
  const rooms = [
    { name:'Living Room', w:5,d:6, x:0,z:0, color:0xf97316, equip:[]},
    { name:'Kitchen',     w:4,d:4, x:5,z:0, color:0x10b981, equip:[]},
    { name:'Bedroom',     w:4,d:5, x:0,z:7, color:0xa78bfa, equip:[]},
    { name:'Bathroom',    w:2,d:3, x:5,z:5, color:0x38bdf8, equip:[]},
    { name:'Hallway',     w:2,d:7, x:4,z:0, color:0x94a3b8, equip:[]},
  ];
  rooms.forEach(r => {
    addGenObject('box',[r.w,0.15,r.d],[r.x+r.w/2,0,r.z+r.d/2], r.color, r.name+' Floor');
    addGenObject('box',[r.w,2.5,0.1],[r.x+r.w/2,1.25,r.z], 0xf1f5f9, r.name+' Wall');
    addGenObject('box',[0.1,2.5,r.d],[r.x,1.25,r.z+r.d/2], 0xf1f5f9, r.name+' Wall');
  });
  addGenNPC('resident',[2,0,2]);
  addGenNPC('resident',[6,0,2]);
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function addGenObject(type, size, pos, color, name) {
  GENERATED_SCENE.objects.push({ type, size, pos, color, name });
}

function addGenNPC(npcType, pos) {
  const colors = { nurse:0x38bdf8, doctor:0xffffff, patient:0xfde68a,
    worker:0xf59e0b, forklift_operator:0xef4444, picker:0x10b981,
    scientist:0xa78bfa, employee:0x94a3b8, resident:0xf97316 };
  GENERATED_SCENE.npcs.push({
    type: npcType, pos, color: colors[npcType]||0xffffff,
    task: getNPCTask(npcType),
    waypoints: generateWaypoints(pos, 3),
  });
}

function getNPCTask(type) {
  const tasks = {
    nurse: 'deliver_medication', doctor: 'check_patient',
    worker: 'move_box', forklift_operator: 'move_pallet',
    picker: 'pick_order', scientist: 'run_experiment',
    employee: 'walk_to_meeting', resident: 'walk_around',
  };
  return tasks[type] || 'patrol';
}

function generateWaypoints(startPos, count) {
  const wps = [startPos];
  for (let i = 0; i < count; i++) {
    wps.push([
      startPos[0] + (Math.random()-0.5)*8,
      0,
      startPos[2] + (Math.random()-0.5)*8,
    ]);
  }
  return wps;
}

/* ═══════════════════════════════════════════════════════════
   THREE.JS PREVIEW RENDERER
   ═══════════════════════════════════════════════════════════ */
let previewRenderer = null, previewScene = null, previewCamera = null;
let previewAnimId = null;

function initPreviewRenderer() {
  if (previewAnimId) cancelAnimationFrame(previewAnimId);
  if (previewRenderer) { previewRenderer.dispose(); previewRenderer = null; }

  const canvas = document.getElementById('genPreviewCanvas');
  if (!canvas) return;
  const w = canvas.parentElement.clientWidth || 500;
  const h = canvas.parentElement.clientHeight || 340;

  previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0x020408);
  previewScene.fog = new THREE.FogExp2(0x020408, 0.02);

  previewCamera = new THREE.PerspectiveCamera(55, w/h, 0.1, 1000);
  previewCamera.position.set(30, 25, 40);
  previewCamera.lookAt(15, 0, 20);

  previewRenderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  previewRenderer.setSize(w, h);
  previewRenderer.shadowMap.enabled = true;

  // Lights
  previewScene.add(new THREE.AmbientLight(0x1a2040, 4));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2);
  dl.position.set(20, 30, 20);
  previewScene.add(dl);

  // Grid
  const grid = new THREE.GridHelper(200, 40, 0x00f2fe, 0x1e293b);
  grid.material.opacity = 0.3; grid.material.transparent = true;
  previewScene.add(grid);

  // Build objects
  GENERATED_SCENE.objects.forEach(obj => {
    let geo;
    if (obj.type === 'box') geo = new THREE.BoxGeometry(...obj.size);
    else if (obj.type === 'cyl') geo = new THREE.CylinderGeometry(obj.size[0], obj.size[1], obj.size[2], 10);
    else geo = new THREE.BoxGeometry(0.3,0.3,0.3);

    const mat = new THREE.MeshStandardMaterial({ color:obj.color, roughness:0.5, metalness:0.1, transparent:true, opacity:0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...obj.pos);
    mesh.castShadow = true; mesh.receiveShadow = true;
    previewScene.add(mesh);
  });

  // NPCs as capsules (sphere + cylinder)
  GENERATED_SCENE.npcs.forEach(npc => {
    const g = new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.2, 0.8, 4, 8) : new THREE.CylinderGeometry(0.2, 0.2, 1.6, 8);
    const m = new THREE.MeshStandardMaterial({ color: npc.color, roughness:0.7 });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(npc.pos[0], 0.9, npc.pos[2]);
    previewScene.add(mesh);
  });

  // Simple orbit for preview
  let isDrag = false, px = 0, py = 0, theta = 0.5, phi = 0.4, rad = 45;
  canvas.addEventListener('mousedown', e => { isDrag=true; px=e.clientX; py=e.clientY; });
  window.addEventListener('mouseup', () => isDrag=false);
  window.addEventListener('mousemove', e => {
    if (!isDrag) return;
    theta -= (e.clientX-px)*0.008; phi += (e.clientY-py)*0.005;
    phi = Math.max(-0.5, Math.min(1.2, phi)); px=e.clientX; py=e.clientY;
    updatePreviewCamera();
  });
  canvas.addEventListener('wheel', e => { rad=Math.max(5,Math.min(150,rad+e.deltaY*0.05)); updatePreviewCamera(); });

  function updatePreviewCamera() {
    previewCamera.position.set(rad*Math.sin(theta)*Math.cos(phi), rad*Math.sin(phi), rad*Math.cos(theta)*Math.cos(phi));
    previewCamera.lookAt(15,0,20);
  }

  function animate() {
    previewAnimId = requestAnimationFrame(animate);
    previewRenderer.render(previewScene, previewCamera);
  }
  animate();
}

function updateSceneSummary() {
  const el = document.getElementById('sceneSummary');
  if (!el) return;
  const c = wizardConfig;
  const profile = RAND_PROFILES[c.rand_profile||c.randProfile||'medium'];
  const t = SCENE_TEMPLATES[selectedTemplate];
  el.innerHTML = `
    Template: <strong style="color:#00f2fe">${t.label}</strong><br>
    Objects: <strong style="color:#10b981">${GENERATED_SCENE.objects.length}</strong><br>
    NPCs: <strong style="color:#f59e0b">${GENERATED_SCENE.npcs.length}</strong><br>
    ${c.floors ? `Floors: <strong>${Math.round(c.floors)}</strong><br>` : ''}
    ${c.areaW ? `Area: <strong>${c.areaW}×${c.areaD}m</strong><br>` : ''}
    ${c.conveyors ? `Conveyors: <strong>${Math.round(c.conveyors)}</strong><br>` : ''}
  `;
  const re = document.getElementById('randSummary');
  if (re && profile) re.innerHTML = `
    Friction: ${profile.frictionRange[0]}–${profile.frictionRange[1]}<br>
    Mass jitter: ±${(profile.massJitter*100).toFixed(0)}%<br>
    Lighting: ${profile.lightRange[0]}–${profile.lightRange[1]}×<br>
    Pos noise: ±${(profile.posNoise*100).toFixed(0)}cm
  `;
}

/* ═══════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════ */
function exportGeneratedYAML() {
  const yaml = buildYAML(GENERATED_SCENE.config);
  downloadText(yaml, `physisim_${selectedTemplate}_${Date.now()}.yaml`);
  addLog(`📋 Scene YAML exported (${GENERATED_SCENE.objects.length} objects)`, 'ok');
}

function buildYAML(config) {
  const lines = ['# PhysiSim AI — Scene Config', `template: ${config.template}`];
  for (const [k,v] of Object.entries(config)) {
    if (k === 'template') continue;
    if (typeof v === 'object') {
      lines.push(`${k}:`);
      for (const [sk,sv] of Object.entries(v)) lines.push(`  ${sk}: ${sv}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push('');
  lines.push(`# Generated stats:`);
  lines.push(`# objects: ${GENERATED_SCENE.objects.length}`);
  lines.push(`# npcs: ${GENERATED_SCENE.npcs.length}`);
  return lines.join('\n');
}

function generateMJCFString() {
  const bodies = GENERATED_SCENE.objects.slice(0,100).map(obj => {
    const type = obj.type === 'cyl' ? 'cylinder' : 'box';
    const size = obj.type === 'cyl'
      ? `${obj.size[0]} ${obj.size[2]/2}`
      : obj.size.map(s => s/2).join(' ');
    return `    <body name="${obj.name.replace(/\s/g,'_')}_${Math.random().toString(36).slice(2,6)}" pos="${obj.pos.join(' ')}">
      <geom type="${type}" size="${size}" rgba="0.7 0.7 0.7 1" mass="1"/>
    </body>`;
  }).join('\n');

  GENERATED_SCENE.mjcf = `<?xml version="1.0" encoding="utf-8"?>
<mujoco model="${selectedTemplate}_scene">
  <compiler angle="radian" coordinate="local"/>
  <option timestep="0.002" gravity="0 -9.81 0"/>
  <worldbody>
    <geom name="floor" type="plane" size="100 100 0.1" rgba="0.5 0.5 0.5 1"/>
${bodies}
  </worldbody>
</mujoco>`;
}

function exportGeneratedMJCF() {
  if (!GENERATED_SCENE.mjcf) generateMJCFString();
  downloadText(GENERATED_SCENE.mjcf, `physisim_${selectedTemplate}_${Date.now()}.xml`);
  addLog(`⚙️ MJCF exported (${Math.min(GENERATED_SCENE.objects.length,100)} bodies)`, 'ok');
}

function downloadText(content, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type:'text/plain'}));
  a.download = filename;
  a.click();
}

/* ═══════════════════════════════════════════════════════════
   LOAD INTO MAIN VIEWPORT
   ═══════════════════════════════════════════════════════════ */
function loadGeneratedScene() {
  if (!scene) { addLog('⚠ Main viewport not initialized', 'warn'); return; }

  // Clear env group
  if (envGroup) { scene.remove(envGroup); envGroup = null; }
  envGroup = new THREE.Group();

  GENERATED_SCENE.objects.forEach(obj => {
    let geo;
    if (obj.type === 'box') geo = new THREE.BoxGeometry(...obj.size);
    else if (obj.type === 'cyl') geo = new THREE.CylinderGeometry(obj.size[0], obj.size[1], obj.size[2], 10);
    else geo = new THREE.BoxGeometry(0.3,0.3,0.3);
    const mat = new THREE.MeshStandardMaterial({ color:obj.color, roughness:0.5, metalness:0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...obj.pos);
    mesh.castShadow = true; mesh.receiveShadow = true;
    envGroup.add(mesh);
  });

  // NPCs
  GENERATED_SCENE.npcs.forEach(npc => {
    const g = new THREE.CylinderGeometry(0.2, 0.2, 1.6, 8);
    const m = new THREE.MeshStandardMaterial({ color: npc.color });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(npc.pos[0], 0.9, npc.pos[2]);
    envGroup.add(mesh);

    // Register for animation
    if (typeof NPC_REGISTRY !== 'undefined') {
      NPC_REGISTRY.push({ ...npc, mesh, wpIdx:0, speed:1.0+Math.random()*0.5 });
    }
  });

  scene.add(envGroup);
  closeSceneGeneratorWizard();
  addLog(`🚀 Scene loaded: ${GENERATED_SCENE.objects.length} objects, ${GENERATED_SCENE.npcs.length} NPCs`, 'ok');
}

/* ═══════════════════════════════════════════════════════════
   NPC ANIMATION SYSTEM
   ═══════════════════════════════════════════════════════════ */
const NPC_REGISTRY = [];

function updateNPCPositions(dt) {
  if (!NPC_REGISTRY.length) return;
  NPC_REGISTRY.forEach(npc => {
    if (!npc.mesh || !npc.waypoints?.length) return;
    const target = npc.waypoints[npc.wpIdx % npc.waypoints.length];
    const dx = target[0] - npc.mesh.position.x;
    const dz = target[2] - npc.mesh.position.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < 0.2) {
      npc.wpIdx = (npc.wpIdx + 1) % npc.waypoints.length;
    } else {
      const speed = npc.speed * dt;
      npc.mesh.position.x += (dx/dist) * speed;
      npc.mesh.position.z += (dz/dist) * speed;
      // Face direction
      npc.mesh.rotation.y = Math.atan2(dx, dz);
    }
  });
}

function wizNext() {
  if (wizardStep === 1 && !selectedTemplate) {
    alert('Please select a template first'); return;
  }
  if (wizardStep < 3) renderWizardStep(wizardStep + 1);
  else loadGeneratedScene();
}
function wizPrev() { if (wizardStep > 1) renderWizardStep(wizardStep - 1); }

/* ─── Domain Randomization Handlers ─── */
function setRandProfile(profileKey) {
  const p = RAND_PROFILES[profileKey];
  if (!p) return;
  
  const fMin = document.getElementById('randFrictMin');
  const fMax = document.getElementById('randFrictMax');
  const mass = document.getElementById('randMass');
  const lMin = document.getElementById('randLightMin');
  const lMax = document.getElementById('randLightMax');
  const pos = document.getElementById('randPos');

  if (fMin) fMin.value = p.frictionRange[0];
  if (fMax) fMax.value = p.frictionRange[1];
  if (mass) mass.value = p.massJitter * 100;
  if (lMin) lMin.value = p.lightRange[0];
  if (lMax) lMax.value = p.lightRange[1];
  if (pos) pos.value = p.posNoise * 100;
  
  updateRandUI();
}

function updateRandUI() {
  const fMinEl = document.getElementById('randFrictMin');
  const fMaxEl = document.getElementById('randFrictMax');
  const massEl = document.getElementById('randMass');
  const lMinEl = document.getElementById('randLightMin');
  const lMaxEl = document.getElementById('randLightMax');
  const posEl = document.getElementById('randPos');

  if (!fMinEl) return;

  const fMin = parseFloat(fMinEl.value);
  const fMax = parseFloat(fMaxEl.value);
  const massVal = parseInt(massEl.value);
  const lMin = parseFloat(lMinEl.value);
  const lMax = parseFloat(lMaxEl.value);
  const posVal = parseInt(posEl.value);

  const lblF = document.getElementById('lblFrict');
  const lblM = document.getElementById('lblMass');
  const lblL = document.getElementById('lblLight');
  const lblP = document.getElementById('lblPos');

  if (lblF) lblF.textContent = `${fMin.toFixed(2)} - ${fMax.toFixed(2)}`;
  if (lblM) lblM.textContent = `${massVal}%`;
  if (lblL) lblL.textContent = `${lMin.toFixed(2)} - ${lMax.toFixed(2)}x`;
  if (lblP) lblP.textContent = `±${posVal} cm`;
}

function applyRandConfig() {
  const fMin = parseFloat(document.getElementById('randFrictMin').value);
  const fMax = parseFloat(document.getElementById('randFrictMax').value);
  const massVal = parseInt(document.getElementById('randMass').value);
  const lMin = parseFloat(document.getElementById('randLightMin').value);
  const lMax = parseFloat(document.getElementById('randLightMax').value);
  const posVal = parseFloat(document.getElementById('randPos').value);

  if (typeof addLog === 'function') {
    addLog(`🎲 Applied Domain Randomization: Mass: ±${massVal}%, Friction: ${fMin.toFixed(2)}-${fMax.toFixed(2)}, Pos Noise: ±${posVal}cm`, 'ok');
  }
}

