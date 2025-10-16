/**
 * LONER ASSISTANT v2.0 - Campaign Management
 * 
 * All campaign-related functions
 */

/**
 * Display current campaign info in sidebar
 */
function displayCurrentCampaign(campaign) {
  const infoDiv = document.getElementById('current-campaign-info');
  if (!infoDiv) return;
  
  infoDiv.innerHTML = `
    <h4 style="margin-bottom: 0.5rem;">${UI.escapeHtml(campaign.name)}</h4>
    <p style="font-size: 0.85rem; color: var(--text-muted);">
      Last played: ${UI.formatDate(campaign.lastPlayed)}
    </p>
    <button class="btn btn-sm btn-outline" onclick="showView('campaigns')" style="margin-top: 0.5rem;">
      Switch Campaign
    </button>
  `;
}

/**
 * Show new campaign form
 */
function showNewCampaignForm() {
  const formHTML = `
    <form id="new-campaign-form">
      <div class="form-group">
        <label>Campaign Name *</label>
        <input type="text" id="campaign-name" required placeholder="e.g., Cyberpunk Heist">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="campaign-desc" placeholder="What's this campaign about?" rows="3"></textarea>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Campaign</button>
      </div>
    </form>
  `;
  
  UI.showModal('New Campaign', formHTML);
  
  // Attach event listener to form after it's in the DOM
  setTimeout(() => {
    const form = document.getElementById('new-campaign-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewCampaign();
      });
    }
  }, 100);
}

/**
 * Create a new campaign
 */
async function createNewCampaign() {
  const nameInput = document.getElementById('campaign-name');
  const descInput = document.getElementById('campaign-desc');
  
  if (!nameInput || !nameInput.value.trim()) {
    UI.showAlert('Please enter a campaign name', 'error');
    return;
  }
  
  const name = nameInput.value.trim();
  const desc = descInput ? descInput.value.trim() : '';
  
  try {
    console.log('Creating campaign:', name);
    
    // Create campaign
    const campaignId = await LonerDB.createCampaign(name, desc);
    console.log('Campaign created with ID:', campaignId);
    
    // Create first session
    const sessionId = await LonerDB.createSession(campaignId, 'Session 1');
    console.log('Session created with ID:', sessionId);
    
    // Set as active and save state
    App.setCurrentCampaign(campaignId, sessionId);
    
    // Close modal
    UI.closeModal();
    
    // Show success message
    UI.showAlert('Campaign created!', 'success');
    
    // Load the new campaign
    const campaign = await LonerDB.getCampaign(campaignId);
    displayCurrentCampaign(campaign);
    
    // ADD THESE LINES TO DISPLAY SESSION:
    const session = await LonerDB.getSession(sessionId);
    SessionManager.displayCurrentSession(session);
    
    // Load the session into editor
    await Editor.loadSession(sessionId);
    
    // Refresh campaign list and switch to campaigns view
    await loadCampaignsList();
    showView('campaigns');
    
  } catch (error) {
    console.error('Error creating campaign:', error);
    UI.showAlert('Error creating campaign: ' + error.message, 'error');
  }
}

/**
 * Load and display campaigns list
 */
async function loadCampaignsList() {
  const campaigns = await LonerDB.getAllCampaigns();
  
  const container = document.getElementById('campaigns-list');
  if (!container) return;
  
  if (campaigns.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No campaigns yet. Create one!</p>';
    return;
  }
  
  const state = App.getState();
  const activeCampaignId = state.campaignId;
  
  container.innerHTML = campaigns.map(campaign => `
    <div class="card campaign-card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <h3 style="margin: 0;">${UI.escapeHtml(campaign.name)}</h3>
        ${campaign.id === activeCampaignId ? '<span style="background: var(--success); color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">ACTIVE</span>' : ''}
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        ${UI.escapeHtml(campaign.description || 'No description')}
      </p>
      <div class="card-footer">
        <span>Last played: ${UI.formatDate(campaign.lastPlayed)}</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm btn-outline" onclick="viewCampaignDetails(${campaign.id})">
            View
          </button>
          <button class="btn btn-sm btn-outline" onclick="editCampaign(${campaign.id})">
            Edit
          </button>
          ${campaign.id !== activeCampaignId ? `
            <button class="btn btn-sm btn-primary" onclick="setAsActiveCampaign(${campaign.id})">
              Set Active
            </button>
          ` : ''}
          <button class="btn btn-sm btn-danger" onclick="deleteCampaignConfirm(${campaign.id})">
            Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * View campaign details in modal
 */
async function viewCampaignDetails(campaignId) {
  const campaign = await LonerDB.getCampaign(campaignId);
  const sessions = await LonerDB.getSessionsForCampaign(campaignId);
  const characters = await LonerDB.getCharacters(campaignId);
  
  const detailsHTML = `
    <div class="campaign-details">
      <div class="form-group">
        <label>Name</label>
        <div>${UI.escapeHtml(campaign.name)}</div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <div>${UI.escapeHtml(campaign.description || 'No description')}</div>
      </div>
      <div class="form-group">
        <label>Created</label>
        <div>${UI.formatDate(campaign.createdAt)}</div>
      </div>
      <div class="form-group">
        <label>Last Played</label>
        <div>${UI.formatDate(campaign.lastPlayed)}</div>
      </div>
      <div class="form-group">
        <label>Sessions</label>
        <div>${sessions.length} session${sessions.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="form-group">
        <label>Characters</label>
        <div>${characters.length} character${characters.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
  `;
  
  UI.showModal(campaign.name, detailsHTML);
}

/**
 * Edit campaign
 */
async function editCampaign(campaignId) {
  const campaign = await LonerDB.getCampaign(campaignId);
  
  const formHTML = `
    <form id="edit-campaign-form">
      <div class="form-group">
        <label>Campaign Name *</label>
        <input type="text" id="edit-campaign-name" required value="${UI.escapeHtml(campaign.name)}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="edit-campaign-desc" rows="3">${UI.escapeHtml(campaign.description || '')}</textarea>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  
  UI.showModal('Edit Campaign', formHTML);
  
  // Attach event listener to form after it's in the DOM
  setTimeout(() => {
    const form = document.getElementById('edit-campaign-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCampaignEdit(campaignId);
      });
    }
  }, 100);
}

/**
 * Save campaign edits
 */
async function saveCampaignEdit(campaignId) {
  try {
    const name = document.getElementById('edit-campaign-name').value.trim();
    const description = document.getElementById('edit-campaign-desc').value.trim();
    
    if (!name) {
      UI.showAlert('Campaign name is required', 'error');
      return;
    }
    
    await LonerDB.db.campaigns.update(campaignId, {
      name: name,
      description: description
    });
    
    UI.closeModal();
    UI.showAlert('Campaign updated!', 'success');
    
    // Reload list
    await loadCampaignsList();
    
    // If this was the active campaign, update display
    const state = App.getState();
    if (campaignId === state.campaignId) {
      const campaign = await LonerDB.getCampaign(campaignId);
      displayCurrentCampaign(campaign);
    }
    
  } catch (error) {
    console.error('Error saving campaign:', error);
    UI.showAlert('Error saving campaign: ' + error.message, 'error');
  }
}

/**
 * Set campaign as active
 */
async function setAsActiveCampaign(campaignId) {
  try {
    // Load the campaign
    const campaign = await LonerDB.getCampaign(campaignId);
    
    // Update last played
    await LonerDB.updateCampaignLastPlayed(campaignId);
    
    // Get or create first session
    const sessions = await LonerDB.getSessionsForCampaign(campaignId);
    let sessionId;
    
    if (sessions.length > 0) {
      sessionId = sessions[0].id;
    } else {
      sessionId = await LonerDB.createSession(campaignId, 'Session 1');
    }
    
    // Set as active and save state
    App.setCurrentCampaign(campaignId, sessionId);
    
    // Update sidebar display
    displayCurrentCampaign(campaign);
    
    // Load session into editor
    await Editor.loadSession(sessionId);

    const session = await LonerDB.getSession(sessionId);
    SessionManager.displayCurrentSession(session);
    
    // Refresh list to show new active state
    await loadCampaignsList();
    
    UI.showAlert('Campaign activated!', 'success');
    
    // Optionally switch to play view
    showView('play');
    
  } catch (error) {
    console.error('Error setting active campaign:', error);
    UI.showAlert('Error activating campaign: ' + error.message, 'error');
  }
}

/**
 * Select a campaign
 */
async function selectCampaign(campaignId) {
  try {
    console.log('Selecting campaign:', campaignId);
    
    const campaign = await LonerDB.getCampaign(campaignId);
    console.log('Campaign loaded:', campaign);
    
    displayCurrentCampaign(campaign);
    
    // Update last played
    await LonerDB.updateCampaignLastPlayed(campaignId);
    
    // Load sessions
    const sessions = await LonerDB.getSessionsForCampaign(campaignId);
    console.log('Found sessions:', sessions.length);
    
    let sessionId;
    if (sessions.length > 0) {
      sessionId = sessions[0].id;
    } else {
      // Create a first session if none exists
      console.log('No sessions found, creating first session');
      sessionId = await LonerDB.createSession(campaignId, 'Session 1');
    }
    
    // Set as active and save state
    App.setCurrentCampaign(campaignId, sessionId);
    
    // Load session into editor
    await Editor.loadSession(sessionId);
    
    // Go to play view
    showView('play');
    UI.showAlert('Campaign loaded!', 'success');
    
    console.log('✅ Campaign selection complete');
  } catch (error) {
    console.error('Error selecting campaign:', error);
    UI.showAlert('Error loading campaign: ' + error.message, 'error');
  }
}

/**
 * Delete campaign with confirmation
 */
async function deleteCampaignConfirm(campaignId) {
  const campaign = await LonerDB.getCampaign(campaignId);
  
  if (UI.confirmDialog(`Delete campaign "${campaign.name}"? This will delete all sessions, characters, and data. This cannot be undone.`)) {
    await LonerDB.deleteCampaign(campaignId);
    UI.showAlert('Campaign deleted', 'success');
    await loadCampaignsList();
    
    // If this was the active campaign, clear it
    const state = App.getState();
    if (campaignId === state.campaignId) {
      App.clearCurrentCampaign();
      document.getElementById('current-campaign-info').innerHTML = '<p class="text-muted">No campaign selected</p><button class="btn btn-primary" onclick="showView(\'campaigns\')">Select Campaign</button>';
    }
  }
}

// Export functions
window.CampaignManager = {
  displayCurrentCampaign,
  showNewCampaignForm,
  createNewCampaign,
  loadCampaignsList,
  selectCampaign,
  deleteCampaignConfirm,
  viewCampaignDetails,
  editCampaign,
  saveCampaignEdit,
  setAsActiveCampaign
};

