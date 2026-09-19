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
   * Builds a structured Fare Card element matching Section 10 specs
   */
  function createFareCard(fare) {
    const card = document.createElement('div');
    card.className = 'fare-card';

    const routeEl = document.createElement('div');
    routeEl.className = 'fare-card-route';
    routeEl.innerHTML = `<span>${fare.origin}</span> <span style="color:#38bdf8">→</span> <span>${fare.destination}</span>`;
    card.appendChild(routeEl);

    const priceRow = document.createElement('div');
    priceRow.className = 'fare-card-row';
    priceRow.innerHTML = `
      <span class="fare-card-label">Estimated Fare</span>
      <span class="fare-card-price">₹${fare.fare.min} – ₹${fare.fare.max}</span>
    `;
    card.appendChild(priceRow);

    const vehicleRow = document.createElement('div');
    vehicleRow.className = 'fare-card-vehicle';
    vehicleRow.innerHTML = `
      <span>Vehicle:</span>
      <strong>${fare.vehicleType}</strong>
    `;
    card.appendChild(vehicleRow);

    const badge = document.createElement('div');
    badge.className = 'fare-card-status-badge';
    badge.textContent = 'DEMO / ESTIMATE';
    card.appendChild(badge);

    const notice = document.createElement('div');
    notice.className = 'fare-card-notice';
    notice.textContent = fare.disclaimer || 'Demo / Estimated data — actual fare may vary by operator.';
    card.appendChild(notice);

    return card;
  }

  /**
   * Builds a structured Route Card element matching Stage 3 specs
   */
  function createRouteCard(route) {
    const card = document.createElement('div');
    card.className = 'route-card';

    const titleEl = document.createElement('div');
    titleEl.className = 'route-card-title';
    titleEl.textContent = 'ROUTE';
    card.appendChild(titleEl);

    const waypointsContainer = document.createElement('div');
    waypointsContainer.className = 'route-card-waypoints';

    (route.waypoints || []).forEach((wp, idx, arr) => {
      const item = document.createElement('div');
      item.className = 'route-waypoint-item';
      item.innerHTML = `
        <div class="route-waypoint-bullet"></div>
        <span>${wp}</span>
      `;
      waypointsContainer.appendChild(item);

      if (idx < arr.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'route-waypoint-arrow';
        arrow.textContent = '↓';
        waypointsContainer.appendChild(arrow);
      }
    });
    card.appendChild(waypointsContainer);

    const badge = document.createElement('div');
    badge.className = 'route-card-status-badge';
    badge.textContent = 'DEMO / ESTIMATE';
    card.appendChild(badge);

    const notice = document.createElement('div');
    notice.className = 'route-card-notice';
    notice.textContent = route.disclaimer || 'Demo route information — actual route and stops may vary.';
    card.appendChild(notice);

    return card;
  }

  /**
   * Builds a structured Schedule Card element matching Stage 4 specs
   */
  function createScheduleCard(schedule) {
    const card = document.createElement('div');
    card.className = 'schedule-card';

    const titleEl = document.createElement('div');
    titleEl.className = 'schedule-card-title';
    titleEl.textContent = 'SCHEDULE';
    card.appendChild(titleEl);

    const routeEl = document.createElement('div');
    routeEl.className = 'schedule-card-route';
    routeEl.innerHTML = `<span>${schedule.origin}</span> <span style="color:#38bdf8">→</span> <span>${schedule.destination}</span>`;
    card.appendChild(routeEl);

    const grid = document.createElement('div');
    grid.className = 'schedule-card-grid';
    grid.innerHTML = `
      <div class="schedule-card-item">
        <span class="schedule-card-label">First Departure</span>
        <span class="schedule-card-value">${schedule.firstDeparture}</span>
      </div>
      <div class="schedule-card-item">
        <span class="schedule-card-label">Last Departure</span>
        <span class="schedule-card-value">${schedule.lastDeparture}</span>
      </div>
      <div class="schedule-card-item" style="grid-column: span 2;">
        <span class="schedule-card-label">Typical Frequency</span>
        <span class="schedule-card-value">${schedule.frequency}</span>
      </div>
    `;
    card.appendChild(grid);

    const modeRow = document.createElement('div');
    modeRow.className = 'schedule-card-mode';
    modeRow.innerHTML = `<span>Vehicle:</span> <strong>${schedule.vehicleType}</strong>`;
    card.appendChild(modeRow);

    const badge = document.createElement('div');
    badge.className = 'schedule-card-status-badge';
    badge.textContent = 'DEMO / ESTIMATE';
    card.appendChild(badge);

    const notice = document.createElement('div');
    notice.className = 'schedule-card-notice';
    notice.textContent = schedule.disclaimer || 'This is the listed schedule, not live vehicle information.';
    card.appendChild(notice);

    return card;
  }

  /**
   * Builds a structured Complaint Card element matching Stage 5 specs
   */
  function createComplaintCard(complaint) {
    const card = document.createElement('div');
    card.className = 'complaint-card';

    const titleEl = document.createElement('div');
    titleEl.className = 'complaint-card-title';
    titleEl.textContent = 'COMPLAINT DRAFT';
    card.appendChild(titleEl);

    const issueEl = document.createElement('div');
    issueEl.className = 'complaint-card-issue';
    issueEl.textContent = complaint.fields?.issueLabel || complaint.issueLabel || complaint.issue || 'Transport Issue';
    card.appendChild(issueEl);

    const grid = document.createElement('div');
    grid.className = 'complaint-card-grid';
    grid.innerHTML = `
      <div class="complaint-card-item">
        <span class="complaint-card-label">Route</span>
        <span class="complaint-card-value">${complaint.fields?.route || 'Not specified'}</span>
      </div>
      <div class="complaint-card-item">
        <span class="complaint-card-label">Vehicle</span>
        <span class="complaint-card-value">${complaint.fields?.vehicleType || 'Not specified'}</span>
      </div>
      <div class="complaint-card-item">
        <span class="complaint-card-label">Amount Charged</span>
        <span class="complaint-card-value">${complaint.fields?.amountCharged || 'Not specified'}</span>
      </div>
      <div class="complaint-card-item">
        <span class="complaint-card-label">Expected Amount</span>
        <span class="complaint-card-value">${complaint.fields?.expectedFare || 'Not specified'}</span>
      </div>
    `;
    card.appendChild(grid);

    if (complaint.fields?.description && complaint.fields.description !== 'Not specified') {
      const descEl = document.createElement('div');
      descEl.className = 'complaint-card-desc';
      descEl.textContent = complaint.fields.description;
      card.appendChild(descEl);
    }

    const badge = document.createElement('div');
    badge.className = 'complaint-card-status-badge';
    badge.textContent = 'DRAFT — NOT SUBMITTED';
    card.appendChild(badge);

    const notice = document.createElement('div');
    notice.className = 'complaint-card-notice';
    notice.textContent = complaint.disclaimer || 'This is a draft complaint summary. It has not been automatically filed with any authority.';
    card.appendChild(notice);

    // Actions: Copy, Download, Share
    const actions = document.createElement('div');
    actions.className = 'complaint-card-actions';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'complaint-btn copy';
    copyBtn.innerHTML = '📋 Copy Complaint';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(complaint.complaintText);
        copyBtn.innerHTML = '✓ Copied';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copy Complaint';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (e) {
        alert('Complaint copied.');
      }
    });
    actions.appendChild(copyBtn);

    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'complaint-btn download';
    downloadBtn.innerHTML = '💾 Download .txt';
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([complaint.complaintText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'safar-complaint-draft.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    actions.appendChild(downloadBtn);

    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'complaint-btn share';
    shareBtn.innerHTML = '🔗 Share';
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Transport Service Complaint Draft',
            text: complaint.complaintText
          });
        } catch (err) {
          // User dismissed or aborted share
        }
      } else {
        alert('Sharing is not supported on this device. You can copy or download the complaint instead.');
      }
    });
    actions.appendChild(shareBtn);

    card.appendChild(actions);

    return card;
  }

  /**
   * Appends a message bubble to the chat window
   */
  function appendMessage(text, sender = 'assistant', meta = null, cardData = null) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    
    // If structured cardData is present
    if (cardData) {
      if (cardData.type === 'ROUTE') {
        const card = createRouteCard(cardData);
        bubble.appendChild(card);
      } else if (cardData.type === 'SCHEDULE') {
        const card = createScheduleCard(cardData);
        bubble.appendChild(card);
      } else if (cardData.type === 'COMPLAINT_DRAFT' || cardData.type === 'COMPLAINT') {
        const card = createComplaintCard(cardData);
        bubble.appendChild(card);
      } else {
        const card = createFareCard(cardData);
        bubble.appendChild(card);
      }
    } else {
      const formattedText = text.replace(/\n/g, '<br>');
      bubble.innerHTML = formattedText;
    }

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
      if (data.complaintData) {
        appendMessage('', 'assistant', 'DRAFT — NOT SUBMITTED', data.complaintData);
      } else if (data.scheduleData) {
        appendMessage('', 'assistant', 'DEMO / ESTIMATE', data.scheduleData);
      } else if (data.routeData) {
        appendMessage('', 'assistant', 'DEMO / ESTIMATE', data.routeData);
      } else if (data.fareData) {
        appendMessage('', 'assistant', 'DEMO / ESTIMATE', data.fareData);
      } else {
        const reply = data.reply || 'Safar AI is ready to help with fares, routes, schedules, and complaints.';
        appendMessage(reply, 'assistant', 'DEMO MODE');
      }
    } catch (err) {
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
