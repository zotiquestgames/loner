/**
 * LONER ASSISTANT v2.0 - Event Log
 * 
 * Track story moments automatically and manually
 */

/**
 * Event type configurations
 */
const EVENT_TYPES = {
  oracle: { 
    label: 'Oracle Roll', 
    icon: '🎲', 
    color: 'var(--primary)' 
  },
  twist: { 
    label: 'Twist', 
    icon: '⚡', 
    color: 'var(--warning)' 
  },
  conflict: { 
    label: 'Conflict', 
    icon: '⚔️', 
    color: 'var(--danger)' 
  },
  scene: { 
    label: 'Scene', 
    icon: '🎬', 
    color: 'var(--info)' 
  },
  npc: { 
    label: 'NPC Encounter', 
    icon: '👤', 
    color: 'var(--success)' 
  },
  location: { 
    label: 'Location', 
    icon: '📍', 
    color: 'var(--info)' 
  },
  thread: { 
    label: 'Thread Update', 
    icon: '🧵', 
    color: 'var(--primary)' 
  },
  revelation: { 
    label: 'Revelation', 
    icon: '💡', 
    color: 'var(--warning)' 
  },
  custom: { 
    label: 'Custom Event', 
    icon: '📝', 
    color: 'var(--text-muted)' 
  }
};

/**
 * Log an event (called by other systems)
 */

async function logEvent(type, description, metadata = {}) {
  const state = App.getState();
  
  if (!state.campaignId || !state.sessionId) {
    console.warn('Cannot log event: no active campaign/session');
    return null;
  }
  
  try {
    const eventId = await LonerDB.logEvent(
      state.campaignId,
      state.sessionId,
      type,
      description,
      metadata
    );
    
    console.log(`📜 Event logged: ${type} - ${description}`);
    
    // Refresh event panel if visible
    const panel = document.getElementById('event-panel-container');
    if (panel) {
      await showEventPanel();
    }
    
    // Refresh timeline if visible
    if (document.getElementById('view-events')?.classList.contains('active')) {
      await loadEventTimeline();
    }
    
    return eventId;
  } catch (error) {
    console.error('Error logging event:', error);
    return null;
  }
}

/**
 * Show event panel in sidebar (recent events)
 */
async function showEventPanel() {
  const state = App.getState();
  
  if (!state.sessionId) {
    return;
  }
  
  const events = await LonerDB.getEventsForSession(state.sessionId);
  
  // Get last 5 events
  const recentEvents = events.slice(-5).reverse();
  
  const panelHTML = `
    <div class="panel">
      <div class="panel-header">
        <h3>Recent Events</h3>
        <button class="btn btn-sm btn-primary" onclick="showNewEventForm()">+ Add</button>
      </div>
      ${recentEvents.length === 0 ? '<p class="text-muted">No events yet</p>' : `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${recentEvents.map(event => {
            const config = EVENT_TYPES[event.type] || EVENT_TYPES.custom;
            return `
              <div class="event-quick-card" style="padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 3px solid ${config.color};">
                <div style="display: flex; align-items: start; gap: 0.5rem;">
                  <span style="font-size: 1.2rem;">${config.icon}</span>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                      ${UI.formatTime(event.timestamp)}
                    </div>
                    <div style="font-size: 0.9rem; margin-top: 0.25rem;">
                      ${UI.escapeHtml(event.description).substring(0, 80)}${event.description.length > 80 ? '...' : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
      ${events.length > 5 ? `
        <button class="btn btn-sm btn-outline" onclick="showView('events')" style="width: 100%; margin-top: 0.5rem;">
          View All (${events.length} total)
        </button>
      ` : ''}
    </div>
  `;
  
  const sidebar = document.querySelector('.sidebar-left');
  let eventPanelContainer = document.getElementById('event-panel-container');
  
  if (!eventPanelContainer) {
    eventPanelContainer = document.createElement('div');
    eventPanelContainer.id = 'event-panel-container';
    sidebar.appendChild(eventPanelContainer);
  }
  
  eventPanelContainer.innerHTML = panelHTML;
}

/**
 * Show new event form
 */
function showNewEventForm() {
  const typeOptions = Object.entries(EVENT_TYPES)
    .map(([key, config]) => `
      <option value="${key}">${config.icon} ${config.label}</option>
    `).join('');
  
  const formHTML = `
    <form id="new-event-form">
      <div class="form-group">
        <label>Event Type</label>
        <select id="event-type">
          ${typeOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Description *</label>
        <textarea id="event-description" required placeholder="What happened?" rows="3"></textarea>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Log Event</button>
      </div>
    </form>
  `;
  
  UI.showModal('Log Event', formHTML);
  
  setTimeout(() => {
    const form = document.getElementById('new-event-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewEvent();
      });
    }
  }, 100);
}

/**
 * Create new event manually
 */
async function createNewEvent() {
  const type = document.getElementById('event-type').value;
  const description = document.getElementById('event-description').value.trim();
  
  if (!description) {
    UI.showAlert('Description is required', 'error');
    return;
  }
  
  await logEvent(type, description);
  
  UI.closeModal();
  UI.showAlert('Event logged!', 'success');
}

/**
 * Load event timeline view
 */
async function loadEventTimeline() {
  const state = App.getState();
  
  if (!state.sessionId) {
    const container = document.getElementById('events-timeline');
    if (container) {
      container.innerHTML = '<p class="text-muted text-center">Select a campaign and session first</p>';
    }
    return;
  }
  
  const events = await LonerDB.getEventsForSession(state.sessionId);
  const container = document.getElementById('events-timeline');
  
  if (!container) return;
  
  if (events.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No events yet. Start playing!</p>';
    return;
  }
  
  // Group events by hour
  const grouped = groupEventsByTime(events);
  
  let html = '';
  
  for (const [timeLabel, groupEvents] of Object.entries(grouped)) {
    html += `
      <div class="timeline-group" style="margin-bottom: 2rem;">
        <h3 style="font-size: 1rem; color: var(--text-muted); margin-bottom: 1rem;">
          ${timeLabel}
        </h3>
        <div class="timeline-events">
          ${groupEvents.map(event => renderEventCard(event)).join('')}
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

/**
 * Group events by time periods
 */
function groupEventsByTime(events) {
  const grouped = {};
  
  events.forEach(event => {
    const date = new Date(event.timestamp);
    const timeLabel = UI.formatDate(date);
    
    if (!grouped[timeLabel]) {
      grouped[timeLabel] = [];
    }
    grouped[timeLabel].push(event);
  });
  
  return grouped;
}

/**
 * Render individual event card
 */
function renderEventCard(event) {
  const config = EVENT_TYPES[event.type] || EVENT_TYPES.custom;
  
  return `
    <div class="card" style="border-left: 4px solid ${config.color};">
      <div style="display: flex; align-items: start; gap: 1rem;">
        <div style="font-size: 2rem; line-height: 1;">
          ${config.icon}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <div>
              <span style="background: ${config.color}; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">
                ${config.label}
              </span>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              ${UI.formatTime(event.timestamp)}
            </span>
          </div>
          <p style="margin: 0; font-size: 0.95rem;">
            ${UI.escapeHtml(event.description)}
          </p>
          ${event.metadata && Object.keys(event.metadata).length > 0 ? `
            <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-muted);">
              ${renderMetadata(event.metadata)}
            </div>
          ` : ''}
        </div>
        <button class="btn btn-sm btn-danger" onclick="deleteEventConfirm(${event.id})" title="Delete event">
          ×
        </button>
      </div>
    </div>
  `;
}

/**
 * Render event metadata
 */
function renderMetadata(metadata) {
  const parts = [];
  
  if (metadata.result) {
    parts.push(`Result: <strong>${metadata.result}</strong>`);
  }
  if (metadata.advantage !== undefined) {
    parts.push(`Advantage: ${metadata.advantage ? 'Yes' : 'No'}`);
  }
  if (metadata.npcName) {
    parts.push(`NPC: <strong>${UI.escapeHtml(metadata.npcName)}</strong>`);
  }
  if (metadata.locationName) {
    parts.push(`Location: <strong>${UI.escapeHtml(metadata.locationName)}</strong>`);
  }
  if (metadata.harmTaken) {
    parts.push(`Harm: <strong>${metadata.harmTaken}</strong>`);
  }
  
  return parts.join(' • ');
}

/**
 * Delete event with confirmation
 */
async function deleteEventConfirm(eventId) {
  if (UI.confirmDialog('Delete this event? This cannot be undone.')) {
    await LonerDB.db.events.delete(eventId);
    UI.showAlert('Event deleted', 'success');
    await loadEventTimeline();
    await showEventPanel();
  }
}

/**
 * Export session recap
 */
async function exportSessionRecap() {
  const state = App.getState();
  
  if (!state.sessionId) {
    UI.showAlert('No active session', 'error');
    return;
  }
  
  const session = await LonerDB.getSession(state.sessionId);
  const events = await LonerDB.getEventsForSession(state.sessionId);
  const campaign = await LonerDB.getCampaign(state.campaignId);
  
  // Build markdown recap
  let markdown = `# ${campaign.name}\n`;
  markdown += `## ${session.name}\n`;
  markdown += `Date: ${UI.formatDate(session.date)}\n\n`;
  markdown += `---\n\n`;
  
  if (events.length === 0) {
    markdown += `*No events logged for this session.*\n`;
  } else {
    markdown += `## Timeline\n\n`;
    
    events.forEach(event => {
      const config = EVENT_TYPES[event.type] || EVENT_TYPES.custom;
      markdown += `**${UI.formatTime(event.timestamp)}** - ${config.icon} ${config.label}\n`;
      markdown += `${event.description}\n\n`;
    });
  }
  
  // Download as file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.name.replace(/\s+/g, '_')}_recap.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  UI.showAlert('Session recap exported!', 'success');
}

/**
 * Show quick events in Play Panel
 */
async function showQuickEvents() {
  const state = App.getState();
  
  if (!state.sessionId) {
    const container = document.getElementById('quick-events');
    if (container) {
      container.innerHTML = '<p class="text-muted" style="font-size: 0.85rem;">No active session</p>';
    }
    return;
  }
  
  const events = await LonerDB.getEventsForSession(state.sessionId);
  
  // Get last 3 events for quick view
  const recentEvents = events.slice(-3).reverse();
  
  const container = document.getElementById('quick-events');
  if (!container) return;
  
  if (recentEvents.length === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size: 0.85rem;">No events yet</p>';
    return;
  }
  
  container.innerHTML = recentEvents.map(event => {
    const config = EVENT_TYPES[event.type] || EVENT_TYPES.custom;
    return `
      <div style="padding: 0.5rem; background: var(--bg-secondary); border-radius: 0.25rem; margin-bottom: 0.5rem; border-left: 3px solid ${config.color};">
        <div style="display: flex; align-items: start; gap: 0.5rem;">
          <span style="font-size: 1rem;">${config.icon}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              ${UI.formatTime(event.timestamp)}
            </div>
            <div style="font-size: 0.85rem; margin-top: 0.125rem;">
              ${UI.escapeHtml(event.description).substring(0, 50)}${event.description.length > 50 ? '...' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


// Export functions
window.EventManager = {
  logEvent,
  showEventPanel,
  showNewEventForm,
  createNewEvent,
  loadEventTimeline,
  deleteEventConfirm,
  exportSessionRecap
};