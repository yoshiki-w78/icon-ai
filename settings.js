// settings.js - AIcon Gemini險ｭ螳・

const GEMINI_KEY_STORAGE_KEY = "aicon_gemini_api_key";
const GEMINI_MODEL_STORAGE_KEY = "aicon_gemini_model";

const geminiKeyInput = document.getElementById("gemini-api-key");
const saveKeyBtn = document.getElementById("save-key-btn");
const clearKeyBtn = document.getElementById("clear-key-btn");
const keyStatus = document.getElementById("key-status");

const modelSelect = document.getElementById("gemini-model-select");
const loadModelsBtn = document.getElementById("load-models-btn");

const logoutBtn = document.getElementById("logout-btn");

function refreshStatus() {
  const saved = sessionStorage.getItem(GEMINI_KEY_STORAGE_KEY);
  if (saved) {
    keyStatus.textContent = "菫晏ｭ俶ｸ医∩・壹％縺ｮ繝悶Λ繧ｦ繧ｶ縺ｫGemini API繧ｭ繝ｼ縺檎匳骭ｲ縺輔ｌ縺ｦ縺・∪縺吶・;
    keyStatus.classList.add("status-ok");
  } else {
    keyStatus.textContent = "譛ｪ險ｭ螳夲ｼ哂PI繧ｭ繝ｼ縺御ｿ晏ｭ倥＆繧後※縺・∪縺帙ｓ縲・;
    keyStatus.classList.remove("status-ok");
  }
}

function applySavedModel() {
  if (!modelSelect) return;
  const current = sessionStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  if (!current) return;

  // value 縺悟ｭ伜惠縺励※縺・ｌ縺ｰ驕ｸ謚槭√↑縺代ｌ縺ｰ縲靴ustom: ...縲阪→縺励※霑ｽ蜉
  const opt = Array.from(modelSelect.options).find(
    (o) => o.value === current
  );
  if (opt) {
    modelSelect.value = current;
  } else if (current) {
    const custom = document.createElement("option");
    custom.value = current;
    custom.textContent = `Custom: ${current}`;
    modelSelect.appendChild(custom);
    modelSelect.value = current;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const savedKey = sessionStorage.getItem(GEMINI_KEY_STORAGE_KEY);
  if (savedKey && geminiKeyInput) {
    geminiKeyInput.value = savedKey;
  }
  refreshStatus();
  applySavedModel();
});

saveKeyBtn?.addEventListener("click", () => {
  const key = (geminiKeyInput.value || "").trim();
  if (!key) {
    alert("API繧ｭ繝ｼ繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・);
    return;
  }
  sessionStorage.setItem(GEMINI_KEY_STORAGE_KEY, key);
  refreshStatus();
  alert("Gemini API繧ｭ繝ｼ繧剃ｿ晏ｭ倥＠縺ｾ縺励◆・医％縺ｮ繝悶Λ繧ｦ繧ｶ縺ｮ縺ｿ・峨・);
});

clearKeyBtn?.addEventListener("click", () => {
  sessionStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
  geminiKeyInput.value = "";
  refreshStatus();
  alert("菫晏ｭ倥＆繧後※縺・◆Gemini API繧ｭ繝ｼ繧貞炎髯､縺励∪縺励◆縲・);
});

// 繝｢繝・Ν荳隕ｧ蜿門ｾ・
loadModelsBtn?.addEventListener("click", async () => {
  const key = sessionStorage.getItem(GEMINI_KEY_STORAGE_KEY);
  if (!key) {
    alert("蜈医↓Gemini API繧ｭ繝ｼ繧剃ｿ晏ｭ倥＠縺ｦ縺上□縺輔＞縲・);
    return;
  }

  if (!modelSelect) return;

  modelSelect.innerHTML = "";
  const loadingOpt = document.createElement("option");
  loadingOpt.textContent = "蜿門ｾ嶺ｸｭ...";
  loadingOpt.value = "";
  modelSelect.appendChild(loadingOpt);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("models.list error:", text);
      throw new Error("繝｢繝・Ν荳隕ｧ縺ｮ蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆縲ゅく繝ｼ繧・ｨｩ髯舌ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
    }

    const data = await res.json();
    const models = Array.isArray(data.models) ? data.models : [];

    const usable = models.filter((m) => {
      const methods = m.supportedGenerationMethods || m.supportedActions || [];
      return methods.includes("generateContent");
    });

    modelSelect.innerHTML = "";

    if (!usable.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "generateContent蟇ｾ蠢懊Δ繝・Ν縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆";
      modelSelect.appendChild(opt);
      return;
    }

    // 繧ｽ繝ｼ繝茨ｼ・lash / pro 蜆ｪ蜈茨ｼ・
    usable.sort((a, b) => {
      const na = (a.baseModelId || a.name || "").toLowerCase();
      const nb = (b.baseModelId || b.name || "").toLowerCase();
      const order = (id) => {
        if (id.includes("2.5-flash")) return 0;
        if (id.includes("2.5-pro")) return 1;
        if (id.includes("flash")) return 2;
        if (id.includes("pro")) return 3;
        return 4;
      };
      return order(na) - order(nb);
    });

    let recommendedValue = "";
    let hasExplicitRecommended = false;

    usable.forEach((m) => {
      const base =
        m.baseModelId ||
        (typeof m.name === "string"
          ? m.name.replace("models/", "")
          : "");
      if (!base) return;

      const opt = document.createElement("option");
      opt.value = base;

      let label = m.displayName || base;

      // 謗ｨ螂ｨ繝｢繝・Ν蛻､螳夲ｼ喩emini-2.5-flash 縺後≠繧後・縺昴ｌ繧偵♀縺吶☆繧・
      if (base.startsWith("gemini-2.5-flash") && !hasExplicitRecommended) {
        label += "・域耳螂ｨ・・;
        recommendedValue = base;
        hasExplicitRecommended = true;
      }

      opt.textContent = label;
      modelSelect.appendChild(opt);
    });

    // 謗ｨ螂ｨ繝｢繝・Ν縺瑚ｦ九▽縺九ｉ縺ｪ縺代ｌ縺ｰ縲∝・鬆ｭ繧呈耳螂ｨ謇ｱ縺・↓縺吶ｋ
    if (!recommendedValue && modelSelect.options.length > 0) {
      const firstOpt = modelSelect.options[0];
      firstOpt.textContent = firstOpt.textContent + "・域耳螂ｨ・・;
      recommendedValue = firstOpt.value;
    }

    // 莉･蜑阪・驕ｸ謚槭ｒ蟆企㍾縺励▽縺､縲√↑縺代ｌ縺ｰ謗ｨ螂ｨ繝｢繝・Ν繧帝∈縺ｶ
    const saved = sessionStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
    if (saved && [...modelSelect.options].some((o) => o.value === saved)) {
      modelSelect.value = saved;
    } else if (recommendedValue) {
      modelSelect.value = recommendedValue;
      sessionStorage.setItem(GEMINI_MODEL_STORAGE_KEY, recommendedValue);
    }

    alert("繝｢繝・Ν荳隕ｧ繧貞叙蠕励＠縺ｾ縺励◆縲ゑｼ域耳螂ｨ・峨・繝ｼ繧ｯ繧貞盾閠・↓繝｢繝・Ν繧帝∈謚槭〒縺阪∪縺吶・);
  } catch (e) {
    console.error(e);
    modelSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "繝｢繝・Ν荳隕ｧ縺ｮ蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆";
    modelSelect.appendChild(opt);
    alert("繝｢繝・Ν荳隕ｧ縺ｮ蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆縲ゅさ繝ｳ繧ｽ繝ｼ繝ｫ繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
  }
});

// 繝｢繝・Ν驕ｸ謚槫､画峩譎ゅ↓菫晏ｭ・
modelSelect?.addEventListener("change", () => {
  const value = modelSelect.value;
  if (value) {
    sessionStorage.setItem(GEMINI_MODEL_STORAGE_KEY, value);
  }
});

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("iconforge_token");
  window.location.href = "login.html";
});
