/**
 * SAFAR AI MVP — Frontend Chat Controller (Stage 1 Foundation)
 */

document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const quickActionButtons = document.querySelectorAll('.action-btn');
  const routeChips = document.querySelectorAll('.route-chip');

  /**
   * Appends a message bubble to the chat window
   */
  function appendMessage(text, sender = 'assistant', meta = null) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    
    // Convert newlines to breaks safely
    const formattedText = text.replace(/\n/g, '<br>');
    bubble.innerHTML = formattedText;

    if (meta) {
      const metaEl = document.createElement('div');
      metaEl.className = 'meta-tag';
      metaEl.textContent = meta;
      bubble.appendChild(metaEl);
    }

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Sends user query to the backend API
   */
  async function handleSendMessage(query) {
    const trimmed = (query || '').trim();
    if (!trimmed) return;

    // Display user bubble
    appendMessage(trimmed, 'user');
    chatInput.value = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || 'Safar AI is ready to help with fares, routes, schedules, and complaints.';
      appendMessage(reply, 'assistant', 'STAGE 1 • DEMO MODE');
    } catch (err) {
      // Offline / fallback response for Stage 1
      appendMessage('Safar AI is ready to help with fares, routes, schedules, and complaints.', 'assistant', 'DEMO MODE (OFFLINE)');
    }
  }

  // Handle form submission
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage(chatInput.value);
    });
  }

  // Handle Quick Action button clicks
  quickActionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      if (prompt) {
        chatInput.value = prompt;
        handleSendMessage(prompt);
      }
    });
  });

  // Handle Popular Route chip clicks
  routeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        chatInput.value = prompt;
        handleSendMessage(prompt);
      }
    });
  });
});
