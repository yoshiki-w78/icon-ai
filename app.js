// ============================
// Google OAuth Configuration
// ============================
let googleInitialized = false;

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
  const loginBtn = document.getElementById('logout-btn');
  if (loginBtn) {
    loginBtn.textContent = 'ログアウト';
    loginBtn.onclick = handleLogout;
  }
  
  console.log('UI updated for logged in user:', user.email);
}

// ログアウト処理
function handleLogout() {
  localStorage.removeItem('user');
  
  // Google のセッションもクリア
  if (googleInitialized && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  
  const loginBtn = document.getElementById('logout-btn');
  if (loginBtn) {
    loginBtn.textContent = 'ログイン';
    loginBtn.onclick = () => {
      const modal = document.getElementById('login-modal');
      modal.classList.add('active');
    };
  }
  
  alert('ログアウトしました');
  console.log('User logged out');
}

// ============================
// Login Modal Control
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('logout-btn');
  const modal = document.getElementById('login-modal');
  const closeBtn = document.getElementById('close-modal');
  const loginTabs = document.querySelectorAll('.login-tab');
  const loginPanels = document.querySelectorAll('.login-panel');
  
  // Show modal when login button is clicked
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
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
      alert('GitHub ログインは開発中です');
      // Implement GitHub OAuth here
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
  
  // 既存のログイン状態をチェック
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      updateUIForLoggedInUser(user);
      console.log('既存のログイン状態を復元:', user.email);
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
