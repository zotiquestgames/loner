/**
 * LONER ASSISTANT v2.0 - NPC Management
 * 
 * Manage non-player characters
 */

/**
 * Display NPC quick reference in sidebar
 */
async function showNPCPanel() {
  const state = App.getState();
  
  if (!state.campaignId) {
    UI.showAlert('Select a campaign first!', 'error');
    return;
  }
  
  const npcs = await LonerDB.getNPCsForCampaign(state.campaignId);
  
  const panelHTML = `
    <div class="panel">
      <div class="panel-header">
        <h3>NPCs</h3>
        <button class="btn btn-sm btn-primary" onclick="showNewNPCForm()">+ Add</button>
      </div>
      ${npcs.length === 0 ? '<p class="text-muted">No NPCs yet</p>' : `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${npcs.map(npc => `
            <div class="npc-quick-card" style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 3px solid ${getRelationshipColor(npc.relationship)};">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                  <strong>${UI.escapeHtml(npc.name)}</strong>
                  <div style="font-size: 0.85rem; color: var(--text-muted);">${UI.escapeHtml(npc.relationship || 'neutral')}</div>
                </div>
                <button class="btn btn-sm btn-outline" onclick="viewNPCDetails(${npc.id})" style="padding: 0.25rem 0.5rem;">
                  View
                </button>
              </div>
              ${npc.tags && npc.tags.length > 0 ? `
                <div style="display: flex; gap: 0.25rem; margin-top: 0.5rem; flex-wrap: wrap;">
                  ${npc.tags.map(tag => `
                    <span style="background: var(--bg-tertiary); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem;">
                      ${UI.escapeHtml(tag)}
                    </span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  
  // Find or create sidebar panel
  const sidebar = document.querySelector('.sidebar-left');
  let npcPanelContainer = document.getElementById('npc-panel-container');
  
  if (!npcPanelContainer) {
    npcPanelContainer = document.createElement('div');
    npcPanelContainer.id = 'npc-panel-container';
    sidebar.appendChild(npcPanelContainer);
  }
  
  npcPanelContainer.innerHTML = panelHTML;
}

/**
 * Get relationship color
 */
function getRelationshipColor(relationship) {
  switch(relationship) {
    case 'ally': return 'var(--success)';
    case 'enemy': return 'var(--danger)';
    default: return 'var(--text-muted)';
  }
}

/**
 * Show new NPC form
 */
function showNewNPCForm() {
  const formHTML = `
    <form id="new-npc-form">
      <div class="form-group">
        <label>Name *</label>
        <input type="text" id="npc-name" required placeholder="NPC name">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="npc-description" placeholder="What do you know about them?" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Relationship</label>
        <select id="npc-relationship">
          <option value="neutral">Neutral</option>
          <option value="ally">Ally</option>
          <option value="enemy">Enemy</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tags (comma-separated)</label>
        <input type="text" id="npc-tags" placeholder="merchant, suspicious, helpful">
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create NPC</button>
      </div>
    </form>
  `;
  
  UI.showModal('New NPC', formHTML);
  
  setTimeout(() => {
    const form = document.getElementById('new-npc-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewNPC();
      });
    }
  }, 100);
}

/**
 * Create new NPC
 */
async function createNewNPC() {
  const state = App.getState();
  
  if (!state.campaignId) {
    UI.showAlert('Select a campaign first!', 'error');
    return;
  }
  
  const name = document.getElementById('npc-name').value.trim();
  const description = document.getElementById('npc-description').value.trim();
  const relationship = document.getElementById('npc-relationship').value;
  const tags = document.getElementById('npc-tags').value
    .split(',')
    .map(t => t.trim())
    .filter(t => t);
  
  if (!name) {
    UI.showAlert('Name is required', 'error');
    return;
  }
  
  try {
    await LonerDB.createNPC(state.campaignId, name, description, tags);
    
    // Update relationship
    const npcs = await LonerDB.getNPCsForCampaign(state.campaignId);
    const newNPC = npcs[npcs.length - 1];
    await LonerDB.updateNPC(newNPC.id, { relationship });
    
    UI.closeModal();
    UI.showAlert('NPC created!', 'success');
    
    // Refresh panel if open
    const panel = document.getElementById('npc-panel-container');
    if (panel) {
      await showNPCPanel();
    }
    
    // If on NPCs view, reload list
    if (document.getElementById('view-npcs')?.classList.contains('active')) {
      await loadNPCsList();
    }
    
  } catch (error) {
    console.error('Error creating NPC:', error);
    UI.showAlert('Error creating NPC: ' + error.message, 'error');
  }

  await EventManager.logEvent('npc', `Met ${name}`, {
  npcName: name,
  relationship: relationship
  });


}


/**
 * View NPC details
 */
async function viewNPCDetails(npcId) {
  const npc = await LonerDB.db.npcs.get(npcId);
  
  const detailsHTML = `
    <div class="npc-details">
      <div class="form-group">
        <label>Name</label>
        <div>${UI.escapeHtml(npc.name)}</div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <div>${UI.escapeHtml(npc.description || 'No description')}</div>
      </div>
      <div class="form-group">
        <label>Relationship</label>
        <div style="color: ${getRelationshipColor(npc.relationship)};">
          ${UI.escapeHtml(npc.relationship || 'neutral')}
        </div>
      </div>
      ${npc.tags && npc.tags.length > 0 ? `
        <div class="form-group">
          <label>Tags</label>
          <div>${npc.tags.map(t => UI.escapeHtml(t)).join(', ')}</div>
        </div>
      ` : ''}
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
        <button class="btn btn-outline" onclick="editNPC(${npcId})">Edit</button>
        <button class="btn btn-danger" onclick="deleteNPCConfirm(${npcId})">Delete</button>
      </div>
    </div>
  `;
  
  UI.showModal(npc.name, detailsHTML);
}

/**
 * Edit NPC
 */
async function editNPC(npcId) {
  const npc = await LonerDB.db.npcs.get(npcId);
  
  const formHTML = `
    <form id="edit-npc-form">
      <div class="form-group">
        <label>Name *</label>
        <input type="text" id="edit-npc-name" required value="${UI.escapeHtml(npc.name)}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="edit-npc-description" rows="3">${UI.escapeHtml(npc.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Relationship</label>
        <select id="edit-npc-relationship">
          <option value="neutral" ${npc.relationship === 'neutral' ? 'selected' : ''}>Neutral</option>
          <option value="ally" ${npc.relationship === 'ally' ? 'selected' : ''}>Ally</option>
          <option value="enemy" ${npc.relationship === 'enemy' ? 'selected' : ''}>Enemy</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tags (comma-separated)</label>
        <input type="text" id="edit-npc-tags" value="${npc.tags ? npc.tags.join(', ') : ''}">
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  
  UI.showModal('Edit NPC', formHTML);
  
  setTimeout(() => {
    const form = document.getElementById('edit-npc-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveNPCEdit(npcId);
      });
    }
  }, 100);
}

/**
 * Save NPC edits
 */
async function saveNPCEdit(npcId) {
  const name = document.getElementById('edit-npc-name').value.trim();
  const description = document.getElementById('edit-npc-description').value.trim();
  const relationship = document.getElementById('edit-npc-relationship').value;
  const tags = document.getElementById('edit-npc-tags').value
    .split(',')
    .map(t => t.trim())
    .filter(t => t);
  
  if (!name) {
    UI.showAlert('Name is required', 'error');
    return;
  }
  
  try {
    await LonerDB.updateNPC(npcId, {
      name,
      description,
      relationship,
      tags
    });
    
    UI.closeModal();
    UI.showAlert('NPC updated!', 'success');
    
    // Refresh displays
    const panel = document.getElementById('npc-panel-container');
    if (panel) {
      await showNPCPanel();
    }
    
    if (document.getElementById('view-npcs')?.classList.contains('active')) {
      await loadNPCsList();
    }
    
  } catch (error) {
    console.error('Error saving NPC:', error);
    UI.showAlert('Error saving NPC: ' + error.message, 'error');
  }
}

/**
 * Delete NPC with confirmation
 */
async function deleteNPCConfirm(npcId) {
  const npc = await LonerDB.db.npcs.get(npcId);
  
  if (UI.confirmDialog(`Delete "${npc.name}"? This cannot be undone.`)) {
    await LonerDB.deleteNPC(npcId);
    UI.closeModal();
    UI.showAlert('NPC deleted', 'success');
    
    // Refresh displays
    const panel = document.getElementById('npc-panel-container');
    if (panel) {
      await showNPCPanel();
    }
    
    if (document.getElementById('view-npcs')?.classList.contains('active')) {
      await loadNPCsList();
    }
  }
}

/**
 * Load NPCs list view
 */
async function loadNPCsList() {
  const state = App.getState();
  
  if (!state.campaignId) {
    const container = document.getElementById('npcs-list');
    if (container) {
      container.innerHTML = '<p class="text-muted text-center">Select a campaign first</p>';
    }
    return;
  }
  
  const npcs = await LonerDB.getNPCsForCampaign(state.campaignId);
  const container = document.getElementById('npcs-list');
  
  if (!container) return;
  
  if (npcs.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No NPCs yet. Create one!</p>';
    return;
  }
  
  container.innerHTML = npcs.map(npc => `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <h3 style="margin: 0;">${UI.escapeHtml(npc.name)}</h3>
        <span style="background: ${getRelationshipColor(npc.relationship)}; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">
          ${UI.escapeHtml(npc.relationship || 'neutral').toUpperCase()}
        </span>
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        ${UI.escapeHtml(npc.description || 'No description')}
      </p>
      ${npc.tags && npc.tags.length > 0 ? `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
          ${npc.tags.map(tag => `
            <span style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.85rem;">
              ${UI.escapeHtml(tag)}
            </span>
          `).join('')}
        </div>
      ` : ''}
      <div class="card-footer">
        <span>Created: ${UI.formatDate(npc.createdAt)}</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm btn-outline" onclick="viewNPCDetails(${npc.id})">View</button>
          <button class="btn btn-sm btn-outline" onclick="editNPC(${npc.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteNPCConfirm(${npc.id})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Export functions
window.NPCManager = {
  showNPCPanel,
  showNewNPCForm,
  createNewNPC,
  viewNPCDetails,
  editNPC,
  saveNPCEdit,
  deleteNPCConfirm,
  loadNPCsList
};