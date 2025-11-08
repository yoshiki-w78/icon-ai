// ============================
// Google OAuth Configuration
// ============================
let googleInitialized = false;

// ============================
// GitHub OAuth Configuration
// ============================
let githubAuthWindow = null;

// GitHub ログインを開始
function handleGithubLogin() {
  // Client ID のチェック
  if (!CONFIG.GITHUB_CLIENT_ID || CONFIG.GITHUB_CLIENT_ID === 'YOUR_GITHUB_CLIENT_ID_HERE') {
    alert('GitHub Client ID が設定されていません。\nconfig.js を確認してください。');
    console.error('GitHub Client ID not configured');
    return;
  }

  // GitHub OAuth URL を構築
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CONFIG.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.GITHUB_REDIRECT_URI)}&scope=read:user user:email`;

  // ポップアップウィンドウで GitHub 認証ページを開く
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  githubAuthWindow = window.open(
    githubAuthUrl,
    'github-auth',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no`
  );

  console.log('GitHub OAuth popup opened');
}

// GitHub 認証後のメッセージを受信
window.addEventListener('message', (event) => {
  // セキュリティ: origin をチェック
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data.type === 'github-auth-success') {
    const code = event.data.code;
    console.log('GitHub auth code received:', code);

    // 簡易版: code を使ってユーザー情報を取得
    // 注意: 本番環境では code をバックエンドに送信してアクセストークンを取得する必要があります
    handleGithubAuthCode(code);
  }
});

// GitHub 認証コードを処理(簡易版)
async function handleGithubAuthCode(code) {
  try {
    // 注意: これは簡易版です
    // 本番環境では、code をバックエンドに送信し、
    // バックエンドで GitHub API にアクセストークンを要求する必要があります
    
    // 簡易版: ダミーのユーザー情報を保存
    const user = {
      provider: 'github',
      code: code, // 本来はここにアクセストークンを保存
      loginTime: new Date().toISOString(),
      // 実際のユーザー情報は GitHub API から取得する必要があります
      note: 'バックエンド連携が必要です'
    };

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('github_auth_code', code);

    // モーダルを閉じる
    const modal = document.getElementById('login-modal');
    modal.classList.remove('active');

    // UI を更新
    updateUIForLoggedInUser(user);

    alert('GitHub ログイン成功!\n\n注意: これは簡易版です。\n本番環境ではバックエンドでトークン交換が必要です。\n\nauth code: ' + code.substring(0, 20) + '...');
  } catch (error) {
    console.error('GitHub auth processing error:', error);
    alert('GitHub ログイン処理に失敗しました');
  }
}

// ============================
// JWT Parser (for Google)
// ============================

// JWT トークンをデコードする関数
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('JWT decode error:', e);
    return null;
  }
}

// Google ログイン成功時のコールバック
function handleGoogleCredentialResponse(response) {
  try {
    // JWT トークンをデコード
    const userInfo = parseJwt(response.credential);
    
    console.log('Google ログイン成功:', userInfo);
    
    // ユーザー情報を保存
    const user = {
      provider: 'google',
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    
    // モーダルを閉じる
    const modal = document.getElementById('login-modal');
    modal.classList.remove('active');
    
    // UI を更新
    updateUIForLoggedInUser(user);
    
    alert(`ようこそ、${user.name} さん！\nメール: ${user.email}`);
  } catch (error) {
    console.error('Google ログイン処理エラー:', error);
    alert('ログイン処理に失敗しました');
  }
}

// Google ライブラリが読み込まれたら初期化
function initGoogleSignIn() {
  if (typeof google === 'undefined' || !google.accounts) {
    console.error('Google Sign-In library not loaded');
    return;
  }

  try {
    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    googleInitialized = true;
    console.log('Google Sign-In initialized successfully');
    
    // Google ボタンをレンダリング
    renderGoogleButton();
  } catch (error) {
    console.error('Google Sign-In initialization error:', error);
  }
}

// Google One Tap ボタンをレンダリング
function renderGoogleButton() {
  const buttonContainer = document.getElementById('google-signin-button');
  if (buttonContainer && googleInitialized) {
    google.accounts.id.renderButton(
      buttonContainer,
      {
        theme: 'outline',
        size: 'large',
        width: 400,
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );
    console.log('Google button rendered');
  }
}

// ログイン後の UI 更新
function updateUIForLoggedInUser(user) {
  const authBtn = document.getElementById('auth-btn');
  if (authBtn) {
    authBtn.textContent = 'ログアウト';
    // 既存のイベントリスナーを削除して新しいものを設定
    const newBtn = authBtn.cloneNode(true);
    authBtn.parentNode.replaceChild(newBtn, authBtn);
    newBtn.id = 'auth-btn'; // ID を保持
    newBtn.addEventListener('click', handleLogout);
  }
  
  console.log('UI updated for logged in user:', user.email);
}

// ログアウト処理
function handleLogout() {
  localStorage.removeItem('user');
  localStorage.removeItem('iconforge_token');
  
  // Google のセッションもクリア
  if (googleInitialized && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  
  // /logout にリダイレクト
  window.location.href = '/logout';
}

// ============================
// Login Modal Control
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const authBtn = document.getElementById('auth-btn');
  const modal = document.getElementById('login-modal');
  const closeBtn = document.getElementById('close-modal');
  const loginTabs = document.querySelectorAll('.login-tab');
  const loginPanels = document.querySelectorAll('.login-panel');
  
  // Show modal when login button is clicked
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      modal.classList.add('active');
      
      // モーダルが開いたら Google ボタンをレンダリング
      setTimeout(() => {
        renderGoogleButton();
      }, 100);
    });
  }
  
  // Close modal when close button is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
  
  // Close modal when clicking outside the modal content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
  
  // Tab switching
  loginTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Remove active class from all tabs and panels
      loginTabs.forEach(t => t.classList.remove('active'));
      loginPanels.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding panel
      tab.classList.add('active');
      document.getElementById(`${targetTab}-login`).classList.add('active');
    });
  });
  
  // Social login button handlers
  const githubBtn = document.querySelector('.github-btn');
  
  if (githubBtn) {
    githubBtn.addEventListener('click', () => {
      console.log('GitHub login clicked');
      handleGithubLogin();
    });
  }
  
  // Google ボタンは initGoogleSignIn() で自動レンダリングされる
  
  // Email login form handler
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      
      console.log('Email login submitted:', { email });
      alert(`メールアドレス: ${email} でログイン処理を実行します（開発中）`);
      // Implement email login logic here
      
      modal.classList.remove('active');
    });
  }
});

// ============================
// Page Load Initialization
// ============================
window.addEventListener('load', () => {
  // Google Sign-In を初期化
  initGoogleSignIn();
  
  // GitHub の認証コードがある場合の処理
  const githubCode = localStorage.getItem('github_auth_code');
  if (githubCode) {
    console.log('GitHub auth code found in localStorage');
    // コードは既に処理済みなので削除
    localStorage.removeItem('github_auth_code');
  }
  
  // 既存のログイン状態をチェック
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      updateUIForLoggedInUser(user);
      console.log('既存のログイン状態を復元:', user.email || user.provider);
    } catch (e) {
      console.error('ログイン状態の復元に失敗:', e);
      localStorage.removeItem('user');
    }
  }
});

// ============================
// Icon Generation (Placeholder)
// ============================
// Add your icon generation logic here
// app.js
// AIcon - AIアシスタントチャット + プロンプト編集 + アイコン生成（最新版）

// ==== 設定 ====
const API_BASE = "http://localhost:8080";
const GEMINI_KEY_STORAGE_KEY = "aicon_gemini_api_key";
const GEMINI_MODEL_STORAGE_KEY = "aicon_gemini_model";

// ==== 要素参照 ====
// ログイン/ログアウトボタンは auth-btn として参照
// (実際の取得は各関数内で行う)

const chatWindow = document.getElementById("chat-window");
const chatInput = document.getElementById("chat-input"); // textarea想定
const chatSendBtn = document.getElementById("chat-send-btn");
// （グローバルの「このままプロンプト生成」ボタンは使わず、メッセージ単位で付ける）

const sizeSelect = document.getElementById("size-select");
const styleSelect = document.getElementById("style-select");
const resetPromptBtn = document.getElementById("reset-prompt-btn");
const finalPromptInput = document.getElementById("final-prompt");

const generateBtn = document.getElementById("generate-btn");
const errorMsg = document.getElementById("error-msg");
const iconsGrid = document.getElementById("icons-grid");
const downloadBtn = document.getElementById("download-btn");

let selectedIconUrl = null;

// チャット履歴（Geminiに投げる用：role=user/assistant, text=素のテキスト）
const chatHistory = [];

// ==== 共通ヘルパー ====

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==== ログアウト ====
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("iconforge_token");
    localStorage.removeItem("user");
    window.location.href = "/logout";
  });
}

// ==== チャットUI描画 ====

function appendMessage(role, text) {
  if (!chatWindow) return;

  const row = document.createElement("div");
  row.className = `chat-row ${role === "assistant" ? "assistant" : "user"}`;

  const avatar = document.createElement("div");
  avatar.className = `chat-avatar ${role === "assistant" ? "assistant" : "user"}`;
  avatar.textContent = role === "assistant" ? "AI" : "You";

  const bubble = document.createElement("div");
  bubble.className = `chat-message ${role === "assistant" ? "assistant" : "user"}`;
  bubble.textContent = text;

  if (role === "assistant") {
    row.appendChild(avatar);
    row.appendChild(bubble);
  } else {
    row.appendChild(bubble);
    row.appendChild(avatar);
  }

  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 「英語プロンプト: ...」付きメッセージ用：下に専用ブロック＋ボタンを表示
function appendAssistantPromptBlock(promptText) {
  if (!chatWindow) return;
  const row = document.createElement("div");
  row.className = "chat-row assistant";

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar assistant";
  avatar.textContent = "AI";

  const box = document.createElement("div");
  box.className = "chat-prompt-block";
  box.innerHTML = `
    <div class="chat-prompt-label">英語プロンプト案</div>
    <div class="chat-prompt-text">${escapeHtml(promptText)}</div>
    <button class="btn-gemini-inline chat-apply-prompt-btn">
      このままプロンプト生成
    </button>
  `;

  row.appendChild(avatar);
  row.appendChild(box);

  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// プロンプト反映ボタン（チャット内）のイベント委譲
if (chatWindow) {
  chatWindow.addEventListener("click", (e) => {
    const btn = e.target.closest(".chat-apply-prompt-btn");
    if (!btn) return;
    const wrapper = btn.closest(".chat-prompt-block");
    const textEl = wrapper?.querySelector(".chat-prompt-text");
    const prompt = textEl?.textContent?.trim();
    if (prompt && finalPromptInput) {
      finalPromptInput.value = prompt;
      // ちょっとだけフィードバック
      btn.textContent = "反映しました ✔";
      setTimeout(() => {
        btn.textContent = "このままプロンプト生成";
      }, 1200);
    }
  });
}

// 初期メッセージ
function initChat() {
  const initial =
    "こんにちは！どんなアイコンを作成したいですか？スタイル、色、テーマなどを教えてください。";
  chatHistory.length = 0;
  chatHistory.push({ role: "assistant", text: initial });
  appendMessage("assistant", `AIアシスタント: ${initial}`);
}

initChat();

// ==== 生成結果プレースホルダ ====

function showInitialPlaceholder() {
  if (!iconsGrid) return;
  iconsGrid.innerHTML = `
    <div class="placeholder-block">
      <p class="placeholder-title">まだアイコンは表示されていません</p>
      <p class="placeholder-text">
        左のAIアシスタントと相談してプロンプトを作成し、
        <span class="placeholder-highlight">「アイコンを生成」</span>
        を押すと、ここに候補が表示されます。
      </p>
    </div>
  `;
  selectedIconUrl = null;
  if (downloadBtn) {
    downloadBtn.disabled = true;
  }
}

showInitialPlaceholder();

// ==== チャット送信 ====

// Enter は改行のみ。送信はボタン。
if (chatSendBtn) {
  chatSendBtn.addEventListener("click", handleChatSend);
}

async function handleChatSend() {
  if (!chatInput) return;
  const userText = chatInput.value.trim();
  if (!userText) return;

  chatInput.value = "";

  appendMessage("user", userText);
  chatHistory.push({ role: "user", text: userText });

  await generateAssistantReply();
}

// ==== Geminiでチャット返信（簡潔＋英語プロンプト案付き） ====

async function generateAssistantReply() {
  const key = sessionStorage.getItem(GEMINI_KEY_STORAGE_KEY);
  if (!key) {
    const msg =
      "Gemini APIキーが設定されていません。右上の「Gemini設定」からキーを登録してください。";
    appendMessage("assistant", `AIアシスタント: ${msg}`);
    chatHistory.push({ role: "assistant", text: msg });
    return;
  }

  const model =
    sessionStorage.getItem(GEMINI_MODEL_STORAGE_KEY) || "gemini-2.5-flash";

  const systemPrompt = `
あなたは「AIアシスタント」です。
ユーザーと日本語で会話しながら、AIアイコン生成用の英語プロンプトを一緒に考えます。

回答ルール:
- 日本語部分は最大2文まで。シンプルに要点だけ。
- 必要な場合のみ、最後に「英語プロンプト: ...」という形式で1つだけ英語プロンプト案を付ける。
- Markdownや箇条書き、コードブロックは使わない。
`.trim();

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...chatHistory.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini chat error:", text);
      const msg =
        "プロンプト生成中にエラーが発生しました。APIキーやモデル設定を確認してください。";
      appendMessage("assistant", `AIアシスタント: ${msg}`);
      chatHistory.push({ role: "assistant", text: msg });
      return;
    }

    const data = await res.json();
    const full =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join(" ")
        .trim() || "";

    if (!full) {
      const msg = "うまく返答を生成できませんでした。もう一度要件を教えてください。";
      appendMessage("assistant", `AIアシスタント: ${msg}`);
      chatHistory.push({ role: "assistant", text: msg });
      return;
    }

    // 行ごとに分解して「英語プロンプト: ...」を探す
    const lines = full
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const promptIndex = lines.findIndex((l) =>
      l.startsWith("英語プロンプト:")
    );

    let jpMessage = full;
    let promptText = "";

    if (promptIndex !== -1) {
      promptText = lines[promptIndex].replace("英語プロンプト:", "").trim();
      // 日本語部分は「英語プロンプト:」より前だけ
      jpMessage = lines.slice(0, promptIndex).join(" ");
    }

    // 日本語メッセージを表示
    if (jpMessage) {
      appendMessage("assistant", `AIアシスタント: ${jpMessage}`);
    }

    // チャット履歴には元の全文を保存（次の文脈用）
    chatHistory.push({ role: "assistant", text: full });

    // 英語プロンプトがあれば、専用ブロック＋ボタン表示（自動反映はしない）
    if (promptText) {
      appendAssistantPromptBlock(promptText);
    }
  } catch (e) {
    console.error(e);
    const msg =
      "Geminiへの接続でエラーが発生しました。ネットワークや設定を確認してください。";
    appendMessage("assistant", `AIアシスタント: ${msg}`);
    chatHistory.push({ role: "assistant", text: msg });
  }
}

// ==== プロンプト編集リセット ====

if (resetPromptBtn) {
  resetPromptBtn.addEventListener("click", () => {
    if (finalPromptInput) finalPromptInput.value = "";
    if (sizeSelect) sizeSelect.value = "512x512";
    if (styleSelect) styleSelect.value = "";
  });
}

// ==== アイコン生成 ====

if (generateBtn) {
  generateBtn.addEventListener("click", handleGenerate);
}

async function handleGenerate() {
  if (!iconsGrid || !generateBtn) return;

  const prompt = (finalPromptInput?.value || "").trim();
  const size = (sizeSelect?.value || "512x512").trim();
  const style = (styleSelect?.value || "").trim();

  if (errorMsg) errorMsg.textContent = "";
  iconsGrid.innerHTML = "";
  selectedIconUrl = null;
  if (downloadBtn) downloadBtn.disabled = true;

  if (!prompt) {
    if (errorMsg) {
      errorMsg.textContent = "右側の「最終プロンプト」を入力してください。";
    }
    showInitialPlaceholder();
    return;
  }

  // ローディングスケルトン
  for (let i = 0; i < 4; i++) {
    const sk = document.createElement("div");
    sk.className = "icon-skeleton";
    iconsGrid.appendChild(sk);
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "生成中...";

  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("iconforge_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const payload = {
      prompt,
      size,
      style: style || null,
      count: 4,
    };

    const res = await fetch(`${API_BASE}/api/generate-icon`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`アイコン生成APIエラー (${res.status})`);
    }

    const data = await res.json();
    const icons = Array.isArray(data.icons) ? data.icons : [];

    if (!icons.length) {
      throw new Error("アイコンが返ってきませんでした。");
    }

    iconsGrid.innerHTML = "";
    icons.forEach((url, index) => {
      if (!url) return;

      const card = document.createElement("button");
      card.className = "icon-card";
      if (index === 0) {
        card.classList.add("icon-selected");
        selectedIconUrl = url;
        if (downloadBtn) downloadBtn.disabled = false;
      }

      const img = document.createElement("img");
      img.src = url;
      img.alt = "Generated icon";

      card.appendChild(img);

      card.addEventListener("click", () => {
        document
          .querySelectorAll(".icon-card")
          .forEach((c) => c.classList.remove("icon-selected"));
        card.classList.add("icon-selected");
        selectedIconUrl = url;
        if (downloadBtn) downloadBtn.disabled = false;
      });

      iconsGrid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    iconsGrid.innerHTML = `
      <p class="error-text">
        アイコン生成に失敗しました。バックエンドAPIまたはネットワーク設定を確認してください。
      </p>
    `;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "アイコンを生成";
  }
}

// ==== ダウンロード ====

if (downloadBtn) {
  downloadBtn.addEventListener("click", handleDownload);
}

async function handleDownload() {
  if (!selectedIconUrl) return;

  try {
    const resp = await fetch(selectedIconUrl);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "aicon.png";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert("ダウンロードに失敗しました。画像URLまたはネットワークを確認してください。");
  }
}
