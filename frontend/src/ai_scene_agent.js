/**
 * PhysiSim AI — AI LLM Scene Agent (Text-to-3D-Scene & Conversational Layout Engine)
 * Generates, arranges, and modulates realistic 3D environments from natural language prompts.
 */

class AISceneAgent {
  constructor() {
    this.history = [];
    this.apiKey = localStorage.getItem('physisim_llm_api_key') || '';
    this.provider = localStorage.getItem('physisim_llm_provider') || 'gemini'; // 'gemini' | 'openai' | 'local'
    this.isProcessing = false;
  }

  setProviderConfig(provider, apiKey) {
    this.provider = provider;
    this.apiKey = apiKey;
    localStorage.setItem('physisim_llm_provider', provider);
    if (apiKey) localStorage.setItem('physisim_llm_api_key', apiKey);
  }

  async processPrompt(promptText) {
    if (!promptText || !promptText.trim()) return null;
    this.isProcessing = true;
    const cleanPrompt = promptText.trim();
    this.addChatMessage('user', cleanPrompt);

    addLog(`🤖 AI Scene Agent: Đang phân tích yêu cầu "${cleanPrompt.substring(0, 40)}..."`, 'info');

    try {
      let scenePlan = null;

      // 1. Try LLM API if key is available
      if (this.apiKey && this.provider !== 'local') {
        scenePlan = await this.callLLMProvider(cleanPrompt);
      }

      // 2. Fallback to Built-in Smart Natural Language Rule Engine (100% Offline & Instant)
      if (!scenePlan) {
        scenePlan = this.parsePromptLocally(cleanPrompt);
      }

      if (scenePlan) {
        this.executeScenePlan(scenePlan);
        const reply = this.generateSummaryReply(scenePlan);
        this.addChatMessage('agent', reply);
        addLog(`✨ AI Scene Agent: Đã tạo xong cảnh 3D với ${scenePlan.objects?.length || 0} thiết bị!`, 'ok');
      } else {
        this.addChatMessage('agent', 'Tôi chưa hiểu rõ yêu cầu. Bạn có thể thử các mẫu như: "Tạo phòng mổ bệnh viện 6x5m trần cao 3.2m", hoặc "Tạo xưởng tự động có băng chuyền và 2 kệ hàng".');
      }
    } catch (err) {
      console.error('AI Agent Error:', err);
      // Fallback to local parser
      const fallbackPlan = this.parsePromptLocally(cleanPrompt);
      if (fallbackPlan) {
        this.executeScenePlan(fallbackPlan);
        this.addChatMessage('agent', `(Chế độ Offline) ${this.generateSummaryReply(fallbackPlan)}`);
      } else {
        this.addChatMessage('agent', `⚠ Đã xảy ra lỗi: ${err.message}. Đã chuyển sang chế độ phân tích cục bộ.`);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  parsePromptLocally(text) {
    const lower = text.toLowerCase();

    // Default room parameters
    let room = { width: 6.0, length: 5.0, height: 3.2, hasDoor: true, doorWall: 'front', hasCeiling: true, theme: 'hospital' };
    let objects = [];
    let clearOld = !lower.includes('thêm') && !lower.includes('add') && !lower.includes('đổi') && !lower.includes('chỉnh');

    // Parse dimensions if user mentioned e.g. "6x5m" or "5x4" or "trần 3.5m"
    const dimMatch = lower.match(/(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
    if (dimMatch) {
      room.width = parseFloat(dimMatch[1]);
      room.length = parseFloat(dimMatch[2]);
    }
    const heightMatch = lower.match(/(?:trần|cao|height)\s*(?:cao)?\s*(\d+(?:\.\d+)?)\s*m?/);
    if (heightMatch) {
      room.height = parseFloat(heightMatch[1]);
    }

    // 1. DOMAIN: HOSPITAL / PHÒNG MỔ / ICU / BỆNH VIỆN
    if (lower.includes('bệnh viện') || lower.includes('hospital') || lower.includes('icu') || lower.includes('mổ') || lower.includes('phẫu thuật') || lower.includes('y tế')) {
      room.theme = 'hospital';
      objects = [
        { type: 'hospital_bed', name: 'Giường Bệnh Nhân ICU', pos: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1], material: 'metal_plastic', mass: 45.0, friction: 0.7 },
        { type: 'patient_monitor', name: 'Máy Monitor Tim Mạch LED', pos: [-1.2, 0.9, -0.2], rot: [0, 25, 0], scale: [1, 1, 1], material: 'plastic_led', mass: 8.0, friction: 0.5 },
        { type: 'iv_stand', name: 'Trụ Truyền Dịch Inox', pos: [1.2, 0, 0.4], rot: [0, 0, 0], scale: [1, 1, 1], material: 'chrome_metal', mass: 5.0, friction: 0.6 },
        { type: 'medical_trolley', name: 'Xe Đẩy Thuốc Y Tế', pos: [-1.4, 0, 0.8], rot: [0, -15, 0], scale: [1, 1, 1], material: 'stainless_steel', mass: 12.0, friction: 0.6 },
        { type: 'surgical_lamp', name: 'Đèn Mổ Phẫu Thuật Trần', pos: [0, room.height - 0.6, 0], rot: [0, 0, 0], scale: [1, 1, 1], material: 'lamp_glow', isStatic: true },
        { type: 'medicine_cabinet', name: 'Tủ Thuốc Kính Y Tế', pos: [2.0, 0, -1.8], rot: [0, 0, 0], scale: [1, 1, 1], material: 'glass_metal', mass: 35.0, isStatic: true }
      ];
    }
    // 2. DOMAIN: FACTORY / NHÀ MÁY / KHO HÀNG / LOGISTICS
    else if (lower.includes('nhà máy') || lower.includes('factory') || lower.includes('kho') || lower.includes('băng chuyền') || lower.includes('conveyor') || lower.includes('pallet')) {
      room.theme = 'factory';
      room.height = Math.max(room.height, 3.8);
      objects = [
        { type: 'conveyor_belt', name: 'Băng Chuyền Sản Xuất 3m', pos: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1], material: 'industrial_steel', mass: 120.0, isStatic: true },
        { type: 'warehouse_rack', name: 'Kệ Kho Hàng 3 Tầng', pos: [-2.0, 0, -1.2], rot: [0, 0, 0], scale: [1, 1, 1], material: 'heavy_steel', isStatic: true },
        { type: 'warehouse_rack', name: 'Kệ Kho Hàng 3 Tầng (Phải)', pos: [2.0, 0, -1.2], rot: [0, 0, 0], scale: [1, 1, 1], material: 'heavy_steel', isStatic: true },
        { type: 'wooden_pallet', name: 'Pallet Gỗ EU', pos: [-1.8, 0, 1.2], rot: [0, 10, 0], scale: [1, 1, 1], material: 'wood', mass: 15.0, friction: 0.85 },
        { type: 'cargo_box', name: 'Thùng Carton Hàng Hóa A', pos: [-1.8, 0.15, 1.2], rot: [0, 15, 0], scale: [1, 1, 1], material: 'cardboard', mass: 4.0, friction: 0.6 },
        { type: 'cargo_box', name: 'Thùng Carton Hàng Hóa B', pos: [0, 0.82, 0.4], rot: [0, 0, 0], scale: [1, 1, 1], material: 'cardboard', mass: 3.5, friction: 0.6 },
        { type: 'chemical_drum', name: 'Thùng Phi Hóa Chất Xanh', pos: [1.8, 0, 1.4], rot: [0, 0, 0], scale: [1, 1, 1], material: 'metal_blue', mass: 40.0, friction: 0.7 },
        { type: 'safety_fence', name: 'Hàng Rào An Toàn Robot', pos: [0, 0, -2.1], rot: [0, 0, 0], scale: [1, 1, 1], material: 'yellow_steel', isStatic: true }
      ];
    }
    // 3. DOMAIN: BIOCHEM LAB / PHÒNG THÍ NGHIỆM / BẾP
    else if (lower.includes('lab') || lower.includes('thí nghiệm') || lower.includes('sinh học') || lower.includes('hóa học') || lower.includes('kính hiển vi') || lower.includes('bếp')) {
      room.theme = 'lab';
      objects = [
        { type: 'lab_workbench', name: 'Bàn Thí Nghiệm Mặt Đá Granit', pos: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1], material: 'granite_steel', mass: 60.0, isStatic: true },
        { type: 'microscope', name: 'Kính Hiển Vi Quang Học', pos: [-0.4, 0.82, 0.05], rot: [0, 15, 0], scale: [1, 1, 1], material: 'white_optic', mass: 3.2, friction: 0.5 },
        { type: 'test_tube_rack', name: 'Giá Ống Nghiệm Đa Màu', pos: [0.35, 0.82, 0.1], rot: [0, -10, 0], scale: [1, 1, 1], material: 'glass_acrylic', mass: 0.8, friction: 0.4 },
        { type: 'centrifuge', name: 'Máy Ly Tâm Tách Mẫu', pos: [0.55, 0.82, -0.15], rot: [0, 0, 0], scale: [1, 1, 1], material: 'lab_plastic', mass: 6.5, friction: 0.6 },
        { type: 'refrigerator', name: 'Tủ Lạnh Bảo Quản Mẫu', pos: [-2.0, 0, -1.6], rot: [0, 0, 0], scale: [1, 1, 1], material: 'white_metal', isStatic: true }
      ];
    }
    // 4. DOMAIN: CLASSROOM / TRƯỜNG HỌC / LỚP HỌC
    else if (lower.includes('lớp học') || lower.includes('trường') || lower.includes('classroom') || lower.includes('bàn học') || lower.includes('bảng')) {
      room.theme = 'classroom';
      objects = [
        { type: 'teacher_desk', name: 'Bàn Giáo Viên Lớn', pos: [0, 0, -1.5], rot: [0, 0, 0], scale: [1, 1, 1], material: 'wood_dark', isStatic: true },
        { type: 'blackboard', name: 'Bảng Xanh Khung Nhôm', pos: [0, 1.2, -2.4], rot: [0, 0, 0], scale: [1, 1, 1], material: 'blackboard', isStatic: true },
        { type: 'student_desk', name: 'Bàn Học Sinh Hàng 1 (Trái)', pos: [-1.2, 0, 0.2], rot: [0, 0, 0], scale: [1, 1, 1], material: 'wood_light', mass: 12.0 },
        { type: 'student_chair', name: 'Ghế Học Sinh Hàng 1 (Trái)', pos: [-1.2, 0, 0.7], rot: [0, 0, 0], scale: [1, 1, 1], material: 'wood_light', mass: 4.5 },
        { type: 'student_desk', name: 'Bàn Học Sinh Hàng 1 (Phải)', pos: [1.2, 0, 0.2], rot: [0, 0, 0], scale: [1, 1, 1], material: 'wood_light', mass: 12.0 },
        { type: 'student_chair', name: 'Ghế Học Sinh Hàng 1 (Phải)', pos: [1.2, 0, 0.7], rot: [0, 0, 0], scale: [1, 1, 1], material: 'wood_light', mass: 4.5 },
        { type: 'bookshelf', name: 'Giá Sách 3 Tầng', pos: [2.2, 0, 0], rot: [0, -90, 0], scale: [1, 1, 1], material: 'wood_dark', isStatic: true }
      ];
    }
    // 5. INCREMENTAL EDIT: Thêm vật thể cụ thể (e.g. "thêm 2 hộp", "thêm pallet")
    else {
      clearOld = false;
      let count = 1;
      const countMatch = lower.match(/(\d+)\s*(?:cái|chiếc|thùng|hộp|bàn|ghế|pallet)/);
      if (countMatch) count = parseInt(countMatch[1]);

      let itemType = 'cube_box';
      let itemName = 'Khối Hộp Mới';

      if (lower.includes('hộp') || lower.includes('thùng') || lower.includes('box')) {
        itemType = 'cargo_box'; itemName = 'Thùng Carton';
      } else if (lower.includes('pallet')) {
        itemType = 'wooden_pallet'; itemName = 'Pallet Gỗ';
      } else if (lower.includes('ghế') || lower.includes('chair')) {
        itemType = 'student_chair'; itemName = 'Ghế';
      } else if (lower.includes('bàn') || lower.includes('desk') || lower.includes('table')) {
        itemType = 'student_desk'; itemName = 'Bàn';
      } else if (lower.includes('phi') || lower.includes('drum')) {
        itemType = 'chemical_drum'; itemName = 'Thùng Phi';
      } else if (lower.includes('giường') || lower.includes('bed')) {
        itemType = 'hospital_bed'; itemName = 'Giường';
      }

      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 0.7;
        objects.push({
          type: itemType,
          name: `${itemName} #${Date.now().toString().slice(-3)}${i+1}`,
          pos: [offset, 0, 0.5],
          rot: [0, Math.random() * 20 - 10, 0],
          scale: [1, 1, 1],
          material: 'default',
          mass: 5.0,
          friction: 0.7
        });
      }
    }

    return {
      clearOld: clearOld,
      room: room,
      objects: objects,
      summary: `Đã thiết kế không gian [${room.theme.toUpperCase()}] kích thước ${room.width}m × ${room.length}m, trần cao ${room.height}m với cửa vào và ${objects.length} thiết bị thực tế.`
    };
  }

  async callLLMProvider(prompt) {
    // OpenAI / Gemini function calling or structured JSON response
    const systemPrompt = `You are an expert 3D Robotics Scene Architect for PhysiSim AI.
Given a user prompt, return a valid JSON object matching this schema:
{
  "clearOld": boolean,
  "room": {
    "width": number (in meters, e.g. 6.0),
    "length": number (in meters, e.g. 5.0),
    "height": number (ceiling height in meters, e.g. 3.2),
    "hasDoor": boolean,
    "theme": "hospital" | "factory" | "lab" | "classroom" | "custom"
  },
  "objects": [
    {
      "type": "hospital_bed" | "patient_monitor" | "iv_stand" | "medical_trolley" | "conveyor_belt" | "warehouse_rack" | "wooden_pallet" | "cargo_box" | "chemical_drum" | "lab_workbench" | "microscope" | "test_tube_rack" | "student_desk" | "student_chair" | "teacher_desk" | "blackboard" | "bookshelf" | "cube_box" | "cylinder",
      "name": string,
      "pos": [x, y, z] (floats in meters, collision-free),
      "rot": [rx, ry, rz] (in degrees),
      "scale": [sx, sy, sz],
      "material": string,
      "mass": number (kg),
      "friction": number,
      "isStatic": boolean
    }
  ],
  "summary": string (Vietnamese explanation)
}`;

    if (this.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser request: "${prompt}"\nReturn ONLY raw JSON.` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) return JSON.parse(rawText);
      }
    } else if (this.provider === 'openai') {
      const url = 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data.choices?.[0]?.message?.content;
        if (rawText) return JSON.parse(rawText);
      }
    }
    return null;
  }

  executeScenePlan(plan) {
    if (!plan) return;

    // 1. Update Room Architecture (Dimensions, Door, Ceiling, Lighting)
    if (plan.room && window.SceneStudioView && typeof window.SceneStudioView.configureRoomArchitecture === 'function') {
      window.SceneStudioView.configureRoomArchitecture(plan.room);
    }

    // 2. Clear old objects if requested
    if (plan.clearOld && window.SceneStudioView && typeof window.SceneStudioView.clearAllObjects === 'function') {
      window.SceneStudioView.clearAllObjects();
    }

    // 3. Instantiate and place objects
    if (plan.objects && Array.isArray(plan.objects)) {
      plan.objects.forEach(objData => {
        if (window.SceneStudioView && typeof window.SceneStudioView.spawnObjectFromAgent === 'function') {
          window.SceneStudioView.spawnObjectFromAgent(objData);
        } else if (typeof window.addProceduralObject === 'function') {
          window.addProceduralObject(objData.type, objData.pos);
        }
      });
    }

    // 4. Refresh Scene Tree Hierarchy
    if (window.SceneStudioView && typeof window.SceneStudioView.refreshHierarchy === 'function') {
      window.SceneStudioView.refreshHierarchy();
    }
  }

  generateSummaryReply(plan) {
    if (plan.summary) return plan.summary;
    const room = plan.room || { width: 6, length: 5, height: 3.2 };
    const objCount = plan.objects?.length || 0;
    return `✅ Đã thiết lập phòng ${room.width}m × ${room.length}m (Trần cao ${room.height}m) kèm cửa ra vào và sắp đặt thành công ${objCount} thiết bị 3D tiêu chuẩn!`;
  }

  addChatMessage(sender, text) {
    this.history.push({ sender, text, time: new Date().toLocaleTimeString() });
    const container = document.getElementById('agentChatMessages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `agent-msg agent-msg-${sender}`;
    msgDiv.style.cssText = sender === 'user'
      ? 'background:rgba(0,242,254,0.12);border:1px solid rgba(0,242,254,0.3);border-radius:12px 12px 2px 12px;padding:10px 14px;margin-bottom:10px;align-self:flex-end;max-width:85%;color:#fff;font-size:0.78rem;'
      : 'background:rgba(127,0,255,0.12);border:1px solid rgba(127,0,255,0.3);border-radius:12px 12px 12px 2px;padding:10px 14px;margin-bottom:10px;align-self:flex-start;max-width:88%;color:#e2e8f0;font-size:0.78rem;line-height:1.4;';

    msgDiv.innerHTML = `
      <div style="font-size:0.62rem;color:${sender === 'user' ? '#00f2fe' : '#a855f7'};font-weight:700;margin-bottom:3px;">
        ${sender === 'user' ? '👤 BẠN' : '🤖 AI SCENE AGENT'}
      </div>
      <div>${text}</div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }
}

// Global instance
window.aiSceneAgent = new AISceneAgent();
