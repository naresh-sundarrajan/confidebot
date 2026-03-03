import { addMessage, togglePanel, subscribe, answeredCount } from '../chat/chatState.js';
import { initGemini, sendMessage, sendGreeting } from '../chat/geminiClient.js';
import { initStructuredPanel } from '../chat/structuredPanel.js';
import { submitChatAssessment } from '../actions/submitChat.js';
import { showToast } from '../utils/toast.js';
import { formatMarkdown } from '../utils/formatMarkdown.js';

let initialized = false;
let isSending = false;

export async function initChatAssessment() {
  if (initialized) return;
  initialized = true;

  const apiKeyScreen = document.getElementById('chat-api-key-screen');
  const chatInterface = document.getElementById('chat-interface');
  const connectBtn = document.getElementById('chat-connect-btn');
  const apiKeyInput = document.getElementById('chat-api-key');
  const apiKeyError = document.getElementById('chat-api-key-error');

  // Check for existing API key in sessionStorage
  const savedKey = sessionStorage.getItem('gemini_api_key');
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  connectBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      apiKeyError.textContent = 'Please enter an API key.';
      apiKeyError.style.display = 'block';
      return;
    }

    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting...';
    apiKeyError.style.display = 'none';

    try {
      await initGemini(key);
      sessionStorage.setItem('gemini_api_key', key);

      apiKeyScreen.style.display = 'none';
      chatInterface.style.display = 'flex';

      initStructuredPanel();
      initChatEvents();
      await startGreeting();
    } catch (err) {
      console.error(err);
      apiKeyError.textContent = 'Failed to connect. Please check your API key.';
      apiKeyError.style.display = 'block';
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect';
    }
  });

  // Allow Enter key on API key input
  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') connectBtn.click();
  });
}

function initChatEvents() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const toggleBtn = document.getElementById('chat-panel-toggle');

  sendBtn.addEventListener('click', () => handleSend());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  toggleBtn.addEventListener('click', () => togglePanel());

  // Close drawer button
  document.getElementById('chat-drawer-close').addEventListener('click', () => togglePanel());

  // Update badge from state
  subscribe(() => {
    const badge = document.getElementById('panel-badge');
    if (badge) badge.textContent = `${answeredCount()}/9`;
  });

  // Delegate submit button click (rendered dynamically in panel)
  document.getElementById('chat-structured-panel').addEventListener('click', (e) => {
    if (e.target.closest('#chat-submit-btn')) {
      submitChatAssessment();
    }
  });
}

async function handleSend() {
  if (isSending) return;

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  isSending = true;
  setSendEnabled(false);

  appendMessage('user', text);
  addMessage('user', text);

  const botBubble = appendMessage('bot', '');
  showTypingState(botBubble, true);

  try {
    await sendMessage(text, {
      onChunk(chunk) {
        showTypingState(botBubble, false);
        appendToMessage(botBubble, chunk);
      },
      onToolCall(idx, score, reasoning) {
        // Visual feedback is handled by structured panel via state subscription
      },
      onDone(fullText) {
        addMessage('bot', fullText);
        scrollToBottom();
      },
    });
  } catch (err) {
    console.error(err);
    showTypingState(botBubble, false);
    botBubble.querySelector('.chat-bubble__text').innerHTML =
      formatMarkdown('Sorry, something went wrong. Please try again.');
    showToast('Chat error: ' + err.message, 'error');
  }

  isSending = false;
  setSendEnabled(true);
  document.getElementById('chat-input').focus();
}

async function startGreeting() {
  const botBubble = appendMessage('bot', '');
  showTypingState(botBubble, true);

  try {
    await sendGreeting({
      onChunk(chunk) {
        showTypingState(botBubble, false);
        appendToMessage(botBubble, chunk);
      },
      onDone(fullText) {
        addMessage('bot', fullText);
        scrollToBottom();
      },
    });
  } catch (err) {
    console.error(err);
    showTypingState(botBubble, false);
    botBubble.querySelector('.chat-bubble__text').innerHTML =
      formatMarkdown('Hello! I\'m here to walk you through the PHQ-9 depression screening. Let\'s begin — over the past two weeks, how often have you had little interest or pleasure in doing things?');
  }

  setSendEnabled(true);
}

// DOM Helpers

function appendMessage(role, text) {
  const messagesEl = document.getElementById('chat-messages');
  const wrapper = document.createElement('div');
  wrapper.className = `chat-bubble chat-bubble--${role}`;

  const textEl = document.createElement('div');
  textEl.className = 'chat-bubble__text';
  if (text) {
    textEl.dataset.raw = text;
    textEl.innerHTML = formatMarkdown(text);
  }
  wrapper.appendChild(textEl);

  messagesEl.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

function appendToMessage(bubble, chunk) {
  const textEl = bubble.querySelector('.chat-bubble__text');
  const raw = (textEl.dataset.raw || '') + chunk;
  textEl.dataset.raw = raw;
  textEl.innerHTML = formatMarkdown(raw);
  scrollToBottom();
}

function showTypingState(bubble, show) {
  const textEl = bubble.querySelector('.chat-bubble__text');
  if (show) {
    textEl.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
  }
}

function scrollToBottom() {
  const messagesEl = document.getElementById('chat-messages');
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setSendEnabled(enabled) {
  const btn = document.getElementById('chat-send-btn');
  const input = document.getElementById('chat-input');
  if (btn) btn.disabled = !enabled;
  if (input) input.disabled = !enabled;
}
