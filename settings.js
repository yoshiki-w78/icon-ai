// settings.js - AIcon Gemini設定

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
    keyStatus.textContent = "保存済み：このブラウザにGemini APIキーが登録されています。";
    keyStatus.classList.add("status-ok");
  } else {
    keyStatus.textContent = "未設定：APIキーが保存されていません。";
    keyStatus.classList.remove("status-ok");
  }
}

function applySavedModel() {
  if (!modelSelect) return;
  const current = sessionStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  if (!current) return;

  // value が存在していれば選択、なければ「Custom: ...」として追加
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
    alert("APIキーを入力してください。");
    return;
  }
  sessionStorage.setItem(GEMINI_KEY_STORAGE_KEY, key);
  refreshStatus();
  alert("Gemini APIキーを保存しました（このブラウザのみ）。");
});

clearKeyBtn?.addEventListener("click", () => {
  sessionStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
  geminiKeyInput.value = "";
  refreshStatus();
  alert("保存されていたGemini APIキーを削除しました。");
});

// モデル一覧取得
loadModelsBtn?.addEventListener("click", async () => {
  const key = sessionStorage.getItem(GEMINI_KEY_STORAGE_KEY);
  if (!key) {
    alert("先にGemini APIキーを保存してください。");
    return;
  }

  if (!modelSelect) return;

  modelSelect.innerHTML = "";
  const loadingOpt = document.createElement("option");
  loadingOpt.textContent = "取得中...";
  loadingOpt.value = "";
  modelSelect.appendChild(loadingOpt);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("models.list error:", text);
      throw new Error("モデル一覧の取得に失敗しました。キーや権限を確認してください。");
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
      opt.textContent = "generateContent対応モデルが見つかりませんでした";
      modelSelect.appendChild(opt);
      return;
    }

    // ソート（flash / pro 優先）
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

      // 推奨モデル判定：gemini-2.5-flash があればそれをおすすめ
      if (base.startsWith("gemini-2.5-flash") && !hasExplicitRecommended) {
        label += "（推奨）";
        recommendedValue = base;
        hasExplicitRecommended = true;
      }

      opt.textContent = label;
      modelSelect.appendChild(opt);
    });

    // 推奨モデルが見つからなければ、先頭を推奨扱いにする
    if (!recommendedValue && modelSelect.options.length > 0) {
      const firstOpt = modelSelect.options[0];
      firstOpt.textContent = firstOpt.textContent + "（推奨）";
      recommendedValue = firstOpt.value;
    }

    // 以前の選択を尊重しつつ、なければ推奨モデルを選ぶ
    const saved = sessionStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
    if (saved && [...modelSelect.options].some((o) => o.value === saved)) {
      modelSelect.value = saved;
    } else if (recommendedValue) {
      modelSelect.value = recommendedValue;
      sessionStorage.setItem(GEMINI_MODEL_STORAGE_KEY, recommendedValue);
    }

    alert("モデル一覧を取得しました。（推奨）マークを参考にモデルを選択できます。");
  } catch (e) {
    console.error(e);
    modelSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "モデル一覧の取得に失敗しました";
    modelSelect.appendChild(opt);
    alert("モデル一覧の取得に失敗しました。コンソールを確認してください。");
  }
});

// モデル選択変更時に保存
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