/**
 * PhysiSim AI — Side Drawer Module
 * Manages Import/Export Data Hub drawer panel
 */

let activeTab = 'import';

function openDrawer() {
  document.getElementById('sideDrawer').classList.add('open');
  document.getElementById('backdrop').classList.add('active');
  document.getElementById('drawerEpisodeCount').textContent = stepCount || 0;
}

function closeDrawer() {
  document.getElementById('sideDrawer').classList.remove('open');
  document.getElementById('backdrop').classList.remove('active');
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tabImportBtn').classList.toggle('active', tab === 'import');
  document.getElementById('tabExportBtn').classList.toggle('active', tab === 'export');
  document.getElementById('importTab').classList.toggle('active', tab === 'import');
  document.getElementById('exportTab').classList.toggle('active', tab === 'export');
  document.getElementById('actionBtn').textContent =
    tab === 'import' ? 'Load Asset to Simulator' : 'Generate Dataset Package';
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('fileInfo').textContent = `Selected: ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
}

async function executeDrawerAction() {
  const wrapper = document.getElementById('progressWrapper');
  const fill    = document.getElementById('progressFill');
  const percent = document.getElementById('progressPercent');
  const status  = document.getElementById('progressStatus');
  const btn     = document.getElementById('actionBtn');

  wrapper.style.display = 'block';
  btn.disabled = true;

  if (activeTab === 'export' && isConnected) {
    // Real export request to Colab
    const format = document.getElementById('exportFormat').value;
    const channels = {
      rgb_d:        document.getElementById('chRGB').checked,
      pose_6dof:    document.getElementById('chPose').checked,
      tactile_force:document.getElementById('chForce').checked,
      joint_torques:document.getElementById('chJoint').checked,
    };

    status.textContent = 'Requesting export from Colab...';
    animateProgress(fill, percent, 0, 60, 800);

    try {
      const result = await requestExport(format, channels);
      animateProgress(fill, percent, 60, 100, 600);
      if (result.download_url) {
        status.textContent = `✅ Ready! Downloading...`;
        const fullUrl = result.download_url.startsWith('http') ? result.download_url : `${apiBaseUrl}${result.download_url}`;
        window.open(fullUrl, '_blank');
      } else {
        status.textContent = `✅ Export complete: ${result.file_path ?? 'done'}`;
      }
    } catch (err) {
      status.textContent = `❌ Export failed: ${err.message}`;
    }
  } else {
    // Mock progress (no connection)
    status.textContent = activeTab === 'import' ? 'Uploading...' : 'Generating...';
    await animateProgressAsync(fill, percent, 0, 100, 1200);
    status.textContent = 'Completed!';
  }

  setTimeout(() => {
    wrapper.style.display = 'none';
    fill.style.width = '0%';
    btn.disabled = false;
    closeDrawer();
  }, 1200);
}

function animateProgress(fill, percent, from, to, ms) {
  const steps = 20;
  const step = (to - from) / steps;
  const interval = ms / steps;
  let current = from;
  const timer = setInterval(() => {
    current += step;
    fill.style.width = current + '%';
    percent.textContent = Math.round(current) + '%';
    if (current >= to) clearInterval(timer);
  }, interval);
}

function animateProgressAsync(fill, percent, from, to, ms) {
  return new Promise(resolve => {
    animateProgress(fill, percent, from, to, ms);
    setTimeout(resolve, ms + 100);
  });
}
