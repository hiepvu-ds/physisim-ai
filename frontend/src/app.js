/**
 * PhysiSim AI — App Entry Point
 * Initializes all modules after DOM is ready
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load saved API URL if any & Auto-Connect
  const savedUrl = localStorage.getItem('physisim_api_url') || (typeof CONFIG !== 'undefined' ? CONFIG.COLAB_API_URL : '');
  if (savedUrl) {
    const input = document.getElementById('apiUrlInput');
    if (input) input.value = savedUrl;
    apiBaseUrl = savedUrl;
    // Tự động kết nối ngay lập tức
    setTimeout(() => {
      if (typeof connectAPI === 'function') connectAPI();
    }, 400);
  }


  // 2. Init Three.js viewport
  initViewport();

  // 3. Init Charts + Wrist Cam
  initForceChart();
  initWristCam();

  // 4. Bind sliders
  initControls();
  updateAllDisplayValues();

  // 5. Save API URL on connect
  document.getElementById('connectBtn').addEventListener('click', () => {
    const url = document.getElementById('apiUrlInput').value.trim();
    if (url) localStorage.setItem('physisim_api_url', url);
  });

  // 6. Drag & drop on dropzone
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        document.getElementById('fileInfo').textContent = `Selected: ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
      }
    });
  }

  // 7. Pre-render Scene Studio panels
  if (typeof renderStudioObjectLibrary === 'function') renderStudioObjectLibrary();
  if (typeof renderStudioSavedScenes === 'function') renderStudioSavedScenes();
  if (typeof renderStudioPropertiesPanel === 'function') renderStudioPropertiesPanel();
  if (typeof renderStudioEnvModulation === 'function') renderStudioEnvModulation();

  console.log('%cPhysiSim AI initialized ✅', 'color:#00f2fe; font-weight:bold; font-size:14px;');
});

/**
 * Full Frontend State Reset
 * Restores all robot sliders, joints, scene objects, environment modulation, charts, and modal states
 */
function resetFrontendState() {
  // 1. Reset Cartesian Sliders
  const defaults = {
    posX: 0.0, posY: 1.2, posZ: 0.0,
    roll: 0.0, pitch: 0.0, yaw: 0.0,
    gripSlider: 0
  };
  Object.keys(defaults).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = defaults[id];
  });
  if (window.updateAllDisplayValues) window.updateAllDisplayValues();

  // 2. Reset Joint Sliders
  if (window.resetJoints) window.resetJoints();

  // 3. Reset 3D Robot Pose & Embodiment
  const robotSelect = document.getElementById('robotSelect');
  if (robotSelect) {
    robotSelect.value = 'franka_panda';
    if (window.switchRobotEmbodiment) window.switchRobotEmbodiment('franka_panda');
  }
  if (window.updateRobotPose) window.updateRobotPose(0.0, 1.2, 0.0, 0.0, 0.0, 0.0);
  if (window.setRobotBasePosition) window.setRobotBasePosition(0.0, 0.0, 0.0);

  // 4. Clear Scene Studio Objects
  if (window.clearAllStudioObjects) window.clearAllStudioObjects();
  if (window.clearSceneObjects) window.clearSceneObjects();

  // 5. Reset Environment & Physics Modulation
  if (window.ENV_STATE) {
    window.ENV_STATE.gravityPreset = 'earth';
    window.ENV_STATE.gravityVal = -9.81;
    window.ENV_STATE.lightingPreset = 'daylight';
    window.ENV_STATE.floorPreset = 'dark_grid';
    window.ENV_STATE.domainRandomization = false;
  }
  if (window.setEnvironmentLightingPreset) window.setEnvironmentLightingPreset('daylight');
  if (window.setFloorGridPreset) window.setFloorGridPreset('dark_grid');
  if (window.renderStudioEnvModulation) window.renderStudioEnvModulation();

  // 6. Reset Camera Position
  if (window.camera) {
    window.camera.position.set(2.5, 2.2, 3.2);
    window.camera.lookAt(0, 0.8, 0);
  }

  // 7. Clear 3D Trajectory Ribbon & Ghosting
  if (window.clearTrajectoryGhosting) window.clearTrajectoryGhosting();
  if (window.renderTrajectoryRibbon) window.renderTrajectoryRibbon([]);

  // 8. Clear Force Telemetry
  if (window.clearForceData) window.clearForceData();

  // 9. Reset Policy Rollout & Inspector State
  if (window.resetPolicyRollout) window.resetPolicyRollout();
  if (window.closePolicyModal) window.closePolicyModal();
  if (window.closeInspectorModal) window.closeInspectorModal();
  if (window.closeSceneGeneratorWizard) window.closeSceneGeneratorWizard();
  if (window.closeSceneEditor) window.closeSceneEditor();

  // 10. Switch App Mode back to Simulation Studio
  if (window.switchAppMode) window.switchAppMode('simulation');

  // 11. Reset Session counters
  const stepCount = document.getElementById('stepCount');
  if (stepCount) stepCount.textContent = '0';
  const bufferSize = document.getElementById('bufferSize');
  if (bufferSize) bufferSize.textContent = '0 ep';
  const studioEpisodes = document.getElementById('studioEpisodes');
  if (studioEpisodes) studioEpisodes.textContent = '0';
  const studioSteps = document.getElementById('studioSteps');
  if (studioSteps) studioSteps.textContent = '0';

  // 12. Log message
  if (window.addLog) {
    addLog('🔄 Frontend state has been completely reset to factory clean default.', 'ok');
  }
}

window.resetFrontendState = resetFrontendState;


