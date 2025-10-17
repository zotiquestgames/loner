/**
 * LONER ASSISTANT v2.0 - Location Management
 * 
 * Track places in your adventure
 */

/**
 * Display Location quick reference in sidebar
 */
async function showLocationPanel() {
  const state = App.getState();
  
  if (!state.campaignId) {
    UI.showAlert('Select a campaign first!', 'error');
    return;
  }
  
  const locations = await LonerDB.getLocationsForCampaign(state.campaignId);
  
  const panelHTML = `
    <div class="panel">
      <div class="panel-header">
        <h3>Locations</h3>
        <button class="btn btn-sm btn-primary" onclick="showNewLocationForm()">+ Add</button>
      </div>
      ${locations.length === 0 ? '<p class="text-muted">No locations yet</p>' : `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${locations.map(loc => `
            <div class="location-quick-card" style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 3px solid ${loc.visited ? 'var(--success)' : 'var(--text-muted)'};">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <strong>${UI.escapeHtml(loc.name)}</strong>
                    ${loc.visited ? '<span style="font-size: 0.75rem;">✓</span>' : ''}
                  </div>
                  ${loc.description ? `
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                      ${UI.escapeHtml(loc.description).substring(0, 60)}${loc.description.length > 60 ? '...' : ''}
                    </div>
                  ` : ''}
                </div>
                <button class="btn btn-sm btn-outline" onclick="viewLocationDetails(${loc.id})" style="padding: 0.25rem 0.5rem;">
                  View
                </button>
              </div>
              ${!loc.visited ? `
                <button class="btn btn-sm" onclick="markLocationVisited(${loc.id})" style="margin-top: 0.5rem; font-size: 0.75rem;">
                  Mark as Visited
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  
  const sidebar = document.querySelector('.sidebar-left');
  let locationPanelContainer = document.getElementById('location-panel-container');
  
  if (!locationPanelContainer) {
    locationPanelContainer = document.createElement('div');
    locationPanelContainer.id = 'location-panel-container';
    sidebar.appendChild(locationPanelContainer);
  }
  
  locationPanelContainer.innerHTML = panelHTML;
}

/**
 * Show new location form
 */
function showNewLocationForm() {
  const formHTML = `
    <form id="new-location-form">
      <div class="form-group">
        <label>Name *</label>
        <input type="text" id="location-name" required placeholder="Location name">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="location-description" placeholder="Describe this place..." rows="4"></textarea>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="location-visited">
          Mark as visited
        </label>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Location</button>
      </div>
    </form>
  `;
  
  UI.showModal('New Location', formHTML);
  
  setTimeout(() => {
    const form = document.getElementById('new-location-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewLocation();
      });
    }
  }, 100);
}

/**
 * Create new location
 */
async function createNewLocation() {
  const nameInput = document.getElementById('location-name');
  
  if (!nameInput || !nameInput.value.trim()) {
    UI.showAlert('Please enter a location name', 'error');
    return;
  }
  
  try {
    const state = App.getState();
    
    if (!state.campaignId) {
      UI.showAlert('Please create or select a campaign first!', 'error');
      UI.closeModal();
      return;
    }
    
    const name = nameInput.value.trim();
    const description = document.getElementById('location-description').value.trim();
    
    const locationId = await LonerDB.createLocation(state.campaignId, name, description);
    
    console.log('Location created with ID:', locationId);
    
    UI.closeModal();
    UI.showAlert('Location created!', 'success');
    
    // Refresh the quick panel if it's open
    const panel = document.getElementById('locations-panel');
    if (panel && !panel.classList.contains('hidden')) {
      await showLocationPanel();
    }
    
    // Reload locations list if on Locations view
    if (document.getElementById('view-locations').classList.contains('active')) {
      await loadLocationsList();
    }
    
  } catch (error) {
    console.error('Error creating location:', error);
    UI.showAlert('Error creating location: ' + error.message, 'error');
  }
}

/**
 * View location details
 */
async function viewLocationDetails(locationId) {
  const location = await LonerDB.db.locations.get(locationId);
  
  const detailsHTML = `
    <div class="location-details">
      <div class="form-group">
        <label>Name</label>
        <div>${UI.escapeHtml(location.name)}</div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <div>${UI.escapeHtml(location.description || 'No description')}</div>
      </div>
      <div class="form-group">
        <label>Status</label>
        <div style="color: ${location.visited ? 'var(--success)' : 'var(--text-muted)'};">
          ${location.visited ? '✓ Visited' : 'Not yet visited'}
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
        ${!location.visited ? `
          <button class="btn btn-secondary" onclick="markLocationVisitedAndClose(${locationId})">
            Mark as Visited
          </button>
        ` : ''}
        <button class="btn btn-outline" onclick="editLocation(${locationId})">Edit</button>
        <button class="btn btn-danger" onclick="deleteLocationConfirm(${locationId})">Delete</button>
      </div>
    </div>
  `;
  
  UI.showModal(location.name, detailsHTML);
}

/**
 * Mark location as visited
 */
async function markLocationVisited(locationId) {
  try {
    const location = await LonerDB.db.locations.get(locationId);
    await LonerDB.markLocationVisited(locationId);
    
    // LOG EVENT
    if (typeof EventManager !== 'undefined' && location) {
      await EventManager.logEvent('location', `Visited ${location.name}`, {
        locationName: location.name
      });
    }
    
    UI.showAlert('Location marked as visited!', 'success');
    
    // Refresh displays
    const panel = document.getElementById('location-panel-container');
    if (panel) {
      await showLocationPanel();
    }
    
    if (document.getElementById('view-locations')?.classList.contains('active')) {
      await loadLocationsList();
    }
    
  } catch (error) {
    console.error('Error marking location:', error);
    UI.showAlert('Error: ' + error.message, 'error');
  }
}

/**
 * Mark visited and close modal
 */
async function markLocationVisitedAndClose(locationId) {
  await markLocationVisited(locationId);
  UI.closeModal();
}

/**
 * Edit location
 */
async function editLocation(locationId) {
  const location = await LonerDB.db.locations.get(locationId);
  
  const formHTML = `
    <form id="edit-location-form">
      <div class="form-group">
        <label>Name *</label>
        <input type="text" id="edit-location-name" required value="${UI.escapeHtml(location.name)}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="edit-location-description" rows="4">${UI.escapeHtml(location.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="edit-location-visited" ${location.visited ? 'checked' : ''}>
          Visited
        </label>
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  
  UI.showModal('Edit Location', formHTML);
  
  setTimeout(() => {
    const form = document.getElementById('edit-location-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveLocationEdit(locationId);
      });
    }
  }, 100);
}

/**
 * Save location edits
 */
async function saveLocationEdit(locationId) {
  const name = document.getElementById('edit-location-name').value.trim();
  const description = document.getElementById('edit-location-description').value.trim();
  const visited = document.getElementById('edit-location-visited').checked;
  
  if (!name) {
    UI.showAlert('Name is required', 'error');
    return;
  }
  
  try {
    await LonerDB.updateLocation(locationId, {
      name,
      description,
      visited
    });
    
    UI.closeModal();
    UI.showAlert('Location updated!', 'success');
    
    // Refresh displays
    const panel = document.getElementById('location-panel-container');
    if (panel) {
      await showLocationPanel();
    }
    
    if (document.getElementById('view-locations')?.classList.contains('active')) {
      await loadLocationsList();
    }
    
  } catch (error) {
    console.error('Error saving location:', error);
    UI.showAlert('Error saving location: ' + error.message, 'error');
  }
}

/**
 * Delete location with confirmation
 */
async function deleteLocationConfirm(locationId) {
  const location = await LonerDB.db.locations.get(locationId);
  
  if (UI.confirmDialog(`Delete "${location.name}"? This cannot be undone.`)) {
    await LonerDB.deleteLocation(locationId);
    UI.closeModal();
    UI.showAlert('Location deleted', 'success');
    
    // Refresh displays
    const panel = document.getElementById('location-panel-container');
    if (panel) {
      await showLocationPanel();
    }
    
    if (document.getElementById('view-locations')?.classList.contains('active')) {
      await loadLocationsList();
    }
  }
}

/**
 * Load locations list view
 */
async function loadLocationsList() {
  const state = App.getState();
  
  if (!state.campaignId) {
    const container = document.getElementById('locations-list');
    if (container) {
      container.innerHTML = '<p class="text-muted text-center">Select a campaign first</p>';
    }
    return;
  }
  
  const locations = await LonerDB.getLocationsForCampaign(state.campaignId);
  const container = document.getElementById('locations-list');
  
  if (!container) return;
  
  if (locations.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No locations yet. Create one!</p>';
    return;
  }
  
  container.innerHTML = locations.map(loc => `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <h3 style="margin: 0;">${UI.escapeHtml(loc.name)}</h3>
        <span style="background: ${loc.visited ? 'var(--success)' : 'var(--text-muted)'}; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">
          ${loc.visited ? '✓ VISITED' : 'UNVISITED'}
        </span>
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        ${UI.escapeHtml(loc.description || 'No description')}
      </p>
      <div class="card-footer">
        <span>Created: ${UI.formatDate(loc.createdAt)}</span>
        <div style="display: flex; gap: 0.5rem;">
          ${!loc.visited ? `
            <button class="btn btn-sm btn-secondary" onclick="markLocationVisited(${loc.id})">
              Mark Visited
            </button>
          ` : ''}
          <button class="btn btn-sm btn-outline" onclick="viewLocationDetails(${loc.id})">View</button>
          <button class="btn btn-sm btn-outline" onclick="editLocation(${loc.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteLocationConfirm(${loc.id})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function showLocationPanel() {
  const state = App.getState();
  if (!state.campaignId) {
    document.getElementById('locations-quick-list').innerHTML = '<p class="text-muted">No campaign selected</p>';
    return;
  }
  
  const locations = await LonerDB.getLocationsForCampaign(state.campaignId);
  const container = document.getElementById('locations-quick-list');
  
  if (locations.length === 0) {
    container.innerHTML = '<p class="text-muted">No locations yet</p>';
    return;
  }
  
  container.innerHTML = locations.slice(0, 5).map(location => `
    <div class="quick-link-item" onclick="viewLocationDetails(${location.id})">
      <strong>${UI.escapeHtml(location.name)}</strong>
      ${location.visited ? '<span style="color: var(--success); font-size: 0.75rem;">✓ Visited</span>' : ''}
    </div>
  `).join('');
}

// Export functions
window.LocationManager = {
  showLocationPanel,
  showNewLocationForm,
  createNewLocation,
  viewLocationDetails,
  markLocationVisited,
  markLocationVisitedAndClose,
  editLocation,
  saveLocationEdit,
  deleteLocationConfirm,
  loadLocationsList
};