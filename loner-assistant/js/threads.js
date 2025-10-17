/**
 * LONER ASSISTANT v2.0 - Narrative Thread Management
 * 
 * Track ongoing storylines and plot threads
 */

/**
 * Display Threads quick reference in sidebar
 */
async function showThreadPanel() {
  const state = App.getState();
  
  if (!state.campaignId) {
    UI.showAlert('Select a campaign first!', 'error');
    return;
  }
  
  const threads = await LonerDB.getThreadsForCampaign(state.campaignId, 'active');
  
  const panelHTML = `
    <div class="panel">
      <div class="panel-header">
        <h3>Active Threads</h3>
        <button class="btn btn-sm btn-primary" onclick="showNewThreadForm()">+ Add</button>
      </div>
      ${threads.length === 0 ? '<p class="text-muted">No active threads</p>' : `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${threads.map(thread => `
            <div class="thread-quick-card" style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 3px solid var(--primary);">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <strong>${UI.escapeHtml(thread.title)}</strong>
                  ${thread.description ? `
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                      ${UI.escapeHtml(thread.description).substring(0, 60)}${thread.description.length > 60 ? '...' : ''}
                    </div>
                  ` : ''}
                </div>
                <button class="btn btn-sm btn-outline" onclick="viewThreadDetails(${thread.id})" style="padding: 0.25rem 0.5rem;">
                  View
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  
  const sidebar = document.querySelector('.sidebar-left');
  let threadPanelContainer = document.getElementById('thread-panel-container');
  
  if (!threadPanelContainer) {
    threadPanelContainer = document.createElement('div');
    threadPanelContainer.id = 'thread-panel-container';
    sidebar.appendChild(threadPanelContainer);
  }
  
  threadPanelContainer.innerHTML = panelHTML;
}

/**
 * Get thread status color
 */
function getThreadStatusColor(status) {
  switch(status) {
    case 'active': return 'var(--primary)';
    case 'resolved': return 'var(--success)';
    case 'abandoned': return 'var(--text-muted)';
    default: return 'var(--text-muted)';
  }
}

/**
 * Show new thread form
 */
function showNewThreadForm() {
  const formHTML = `
    <form id="new-thread-form">
      <div class="form-group">
        <label>Title *</label>
        <input type="text" id="thread-title" required placeholder="Thread title">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="thread-description" placeholder="What's this storyline about?" rows="4"></textarea>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="thread-status">
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Thread</button>
      </div>
    </form>
  `;
  
  UI.showModal('New Narrative Thread', formHTML);
  
  setTimeout(() => {
    const form = document.getElementById('new-thread-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewThread();
      });
    }
  }, 100);
}

/**
 * Create new thread
 */
async function createNewThread() {
  const state = App.getState();
  
  if (!state.campaignId) {
    UI.showAlert('Select a campaign first!', 'error');
    return;
  }
  
  const title = document.getElementById('thread-title').value.trim();
  const description = document.getElementById('thread-description').value.trim();
  const status = document.getElementById('thread-status').value;
  
  if (!title) {
    UI.showAlert('Title is required', 'error');
    return;
  }
  
  try {
    const threadId = await LonerDB.createThread(state.campaignId, title, description);
    
    if (status !== 'active') {
      await LonerDB.updateThreadStatus(threadId, status);
    }
    
    UI.closeModal();
    UI.showAlert('Thread created!', 'success');
    
    // Refresh displays
    const panel = document.getElementById('thread-panel-container');
    if (panel) {
      await showThreadPanel();
    }
    
    if (document.getElementById('view-threads')?.classList.contains('active')) {
      await loadThreadsList();
    }
    
  } catch (error) {
    console.error('Error creating thread:', error);
    UI.showAlert('Error creating thread: ' + error.message, 'error');
  }
}

/**
 * View thread details
 */
async function viewThreadDetails(threadId) {
  const thread = await LonerDB.db.threads.get(threadId);
  
  const detailsHTML = `
    <div class="thread-details">
      <div class="form-group">
        <label>Title</label>
        <div>${UI.escapeHtml(thread.title)}</div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <div>${UI.escapeHtml(thread.description || 'No description')}</div>
      </div>
      <div class="form-group">
        <label>Status</label>
        <div style="color: ${getThreadStatusColor(thread.status)};">
          ${UI.escapeHtml(thread.status || 'active').toUpperCase()}
        </div>
      </div>
      <div class="form-group">
        <label>Created</label>
        <div>${UI.formatDate(thread.createdAt)}</div>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
        ${thread.status === 'active' ? `
          <button class="btn btn-secondary" onclick="resolveThreadAndClose(${threadId})">
            Mark Resolved
          </button>
        ` : ''}
        <button class="btn btn-outline" onclick="editThread(${threadId})">Edit</button>
        <button class="btn btn-danger" onclick="deleteThreadConfirm(${threadId})">Delete</button>
      </div>
    </div>
  `;
  
  UI.showModal(thread.title, detailsHTML);
}

/**
 * Resolve thread and close modal
 */
async function resolveThreadAndClose(threadId) {
  await LonerDB.updateThreadStatus(threadId, 'resolved');
  UI.closeModal();
  UI.showAlert('Thread marked as resolved!', 'success');
  
  // Refresh displays
  const panel = document.getElementById('thread-panel-container');
  if (panel) {
    await showThreadPanel();
  }
  
  if (document.getElementById('view-threads')?.classList.contains('active')) {
    await loadThreadsList();
  }

  const thread = await LonerDB.db.threads.get(threadId);
  await EventManager.logEvent('thread', `Thread resolved: ${thread.title}`, {
  threadTitle: thread.title,
  status: 'resolved'
  });

}

/**
 * Edit thread
 */
async function editThread(threadId) {
  const thread = await LonerDB.db.threads.get(threadId);
  
  const formHTML = `
    <form id="edit-thread-form">
      <div class="form-group">
        <label>Title *</label>
        <input type="text" id="edit-thread-title" required value="${UI.escapeHtml(thread.title)}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="edit-thread-description" rows="4">${UI.escapeHtml(thread.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="edit-thread-status">
          <option value="active" ${thread.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="resolved" ${thread.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          <option value="abandoned" ${thread.status === 'abandoned' ? 'selected' : ''}>Abandoned</option>
        </select>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  
  UI.showModal('Edit Thread', formHTML);
  
  setTimeout(() => {
    const form = document.getElementById('edit-thread-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveThreadEdit(threadId);
      });
    }
  }, 100);
}

/**
 * Save thread edits
 */
async function saveThreadEdit(threadId) {
  const title = document.getElementById('edit-thread-title').value.trim();
  const description = document.getElementById('edit-thread-description').value.trim();
  const status = document.getElementById('edit-thread-status').value;
  
  if (!title) {
    UI.showAlert('Title is required', 'error');
    return;
  }
  
  try {
    await LonerDB.updateThread(threadId, {
      title,
      description,
      status
    });
    
    UI.closeModal();
    UI.showAlert('Thread updated!', 'success');
    
    // Refresh displays
    const panel = document.getElementById('thread-panel-container');
    if (panel) {
      await showThreadPanel();
    }
    
    if (document.getElementById('view-threads')?.classList.contains('active')) {
      await loadThreadsList();
    }
    
  } catch (error) {
    console.error('Error saving thread:', error);
    UI.showAlert('Error saving thread: ' + error.message, 'error');
  }
}

/**
 * Delete thread with confirmation
 */
async function deleteThreadConfirm(threadId) {
  const thread = await LonerDB.db.threads.get(threadId);
  
  if (UI.confirmDialog(`Delete "${thread.title}"? This cannot be undone.`)) {
    await LonerDB.deleteThread(threadId);
    UI.closeModal();
    UI.showAlert('Thread deleted', 'success');
    
    // Refresh displays
    const panel = document.getElementById('thread-panel-container');
    if (panel) {
      await showThreadPanel();
    }
    
    if (document.getElementById('view-threads')?.classList.contains('active')) {
      await loadThreadsList();
    }
  }
}

/**
 * Load threads list view
 */
async function loadThreadsList() {
  const state = App.getState();
  
  if (!state.campaignId) {
    const container = document.getElementById('threads-list');
    if (container) {
      container.innerHTML = '<p class="text-muted text-center">Select a campaign first</p>';
    }
    return;
  }
  
  const threads = await LonerDB.getThreadsForCampaign(state.campaignId);
  const container = document.getElementById('threads-list');
  
  if (!container) return;
  
  if (threads.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No threads yet. Create one!</p>';
    return;
  }
  
  // Group by status
  const active = threads.filter(t => t.status === 'active');
  const resolved = threads.filter(t => t.status === 'resolved');
  const abandoned = threads.filter(t => t.status === 'abandoned');
  
  let html = '';
  
  if (active.length > 0) {
    html += '<h3 style="margin-bottom: 1rem;">Active Threads</h3>';
    html += '<div class="grid-list" style="margin-bottom: 2rem;">';
    html += active.map(thread => renderThreadCard(thread)).join('');
    html += '</div>';
  }
  
  if (resolved.length > 0) {
    html += '<h3 style="margin-bottom: 1rem;">Resolved Threads</h3>';
    html += '<div class="grid-list" style="margin-bottom: 2rem;">';
    html += resolved.map(thread => renderThreadCard(thread)).join('');
    html += '</div>';
  }
  
  if (abandoned.length > 0) {
    html += '<h3 style="margin-bottom: 1rem;">Abandoned Threads</h3>';
    html += '<div class="grid-list">';
    html += abandoned.map(thread => renderThreadCard(thread)).join('');
    html += '</div>';
  }
  
  container.innerHTML = html;
}

/**
 * Render thread card
 */
function renderThreadCard(thread) {
  return `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <h3 style="margin: 0;">${UI.escapeHtml(thread.title)}</h3>
        <span style="background: ${getThreadStatusColor(thread.status)}; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">
          ${UI.escapeHtml(thread.status || 'active').toUpperCase()}
        </span>
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        ${UI.escapeHtml(thread.description || 'No description')}
      </p>
      <div class="card-footer">
        <span>Created: ${UI.formatDate(thread.createdAt)}</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm btn-outline" onclick="viewThreadDetails(${thread.id})">View</button>
          <button class="btn btn-sm btn-outline" onclick="editThread(${thread.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteThreadConfirm(${thread.id})">Delete</button>
        </div>
      </div>
    </div>
  `;
}

// Export functions
window.ThreadManager = {
  showThreadPanel,
  showNewThreadForm,
  createNewThread,
  viewThreadDetails,
  resolveThreadAndClose,
  editThread,
  saveThreadEdit,
  deleteThreadConfirm,
  loadThreadsList
};