/**
 * Display active character in sidebar
 */
function displayActiveCharacter(character) {
  const infoDiv = document.getElementById('active-character-info');
  if (!infoDiv) return;
  
  infoDiv.innerHTML = `
    <h4>${UI.escapeHtml(character.name)}</h4>
    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
      ${UI.escapeHtml(character.concept || 'No concept')}
    </p>
    <div style="margin-top: 0.5rem;">
      <strong>Luck:</strong> ${character.luck}/${character.maxLuck}
    </div>
    ${character.skills.length > 0 ? `
      <div style="margin-top: 0.5rem;">
        <strong>Skills:</strong><br>
        <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem;">
          ${character.skills.map(skill => `
            <span style="background: var(--bg-tertiary); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem;">
              ${UI.escapeHtml(skill)}
            </span>
          `).join('')}
        </div>
      </div>
    ` : ''}
    <button class="btn btn-sm btn-outline" onclick="showView('characters')" style="margin-top: 0.75rem; width: 100%;">
      Manage Characters
    </button>
  `;
}/**
 * LONER ASSISTANT v2.0 - Main Application Controller
 * 
 * This file initializes the app and ties everything together
 */

// Global state
let currentCampaignId = null;
let currentSessionId = null;
let currentCharacterId = null;
let quillEditor = null;

/**
 * Save current state to localStorage
 */
function saveAppState() {
  localStorage.setItem('lonerAppState', JSON.stringify({
    campaignId: currentCampaignId,
    sessionId: currentSessionId,
    characterId: currentCharacterId
  }));
  console.log('💾 App state saved');
}

/**
 * Load state from localStorage
 */
function loadAppState() {
  const saved = localStorage.getItem('lonerAppState');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      currentCampaignId = state.campaignId;
      currentSessionId = state.sessionId;
      currentCharacterId = state.characterId;
      console.log('📂 App state loaded:', state);
      return state;
    } catch (e) {
      console.warn('Could not parse saved app state:', e);
    }
  }
  return null;
}

/**
 * Initialize the application when page loads
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🎲 Loner Assistant v2.0 starting...');
  
  try {
    // 1. Initialize UI
    UI.initializeNavigation();
    console.log('✅ UI initialized');
    
    // 2. Load theme preference
    loadThemePreference();
    console.log('✅ Theme loaded');
    
    // 3. Initialize Quill editor
    initializeEditor();
    console.log('✅ Editor initialized');
    
    // 4. Wait a moment for database to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 5. Load saved app state (campaign, session, character)
    const savedState = loadAppState();
    
    // 6. Load campaign and session if saved
    if (savedState && savedState.campaignId) {
      try {
        console.log('Loading saved campaign:', savedState.campaignId);
        const campaign = await LonerDB.getCampaign(savedState.campaignId);
        
        if (campaign) {
          currentCampaignId = campaign.id;
          displayCurrentCampaign(campaign);
          
          // Load session if saved
          if (savedState.sessionId) {
            console.log('Loading saved session:', savedState.sessionId);
            const session = await LonerDB.getSession(savedState.sessionId);
            if (session) {
              await loadSession(savedState.sessionId);
            } else {
              // Session doesn't exist, create a new one
              console.log('Saved session not found, creating new session');
              const sessionId = await LonerDB.createSession(currentCampaignId, 'Session 1');
              await loadSession(sessionId);
            }
          } else {
            // No saved session, load or create first session
            const sessions = await LonerDB.getSessionsForCampaign(currentCampaignId);
            if (sessions.length > 0) {
              await loadSession(sessions[0].id);
            } else {
              const sessionId = await LonerDB.createSession(currentCampaignId, 'Session 1');
              await loadSession(sessionId);
            }
          }
          
          console.log('✅ Campaign and session loaded from saved state');
        } else {
          console.log('Saved campaign not found');
          loadAppState(); // Clear invalid state
        }
      } catch (error) {
        console.warn('Could not load saved campaign/session:', error);
      }
    } else {
      // No saved state, try to load most recent campaign
      try {
        await loadLastCampaign();
        console.log('✅ Loaded most recent campaign');
      } catch (error) {
        console.warn('No campaigns found or error loading:', error);
      }
    }
    
    // 7. Load active character if any
    try {
      const characters = await LonerDB.getCharacters();
      const activeChar = characters.find(c => c.isActive);
      if (activeChar) {
        currentCharacterId = activeChar.id;
        displayActiveCharacter(activeChar);
        console.log('✅ Active character loaded:', activeChar.name);
      }
    } catch (error) {
      console.warn('Could not load active character:', error);
    }
    
    // 8. Set up auto-save for notes
    startAutoSave();
    console.log('✅ Auto-save enabled');
    
    console.log('✅ App initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    // Show a less scary message
    UI.showAlert('App started with warnings. Check console for details.', 'warning');
  }
});

/**
 * Initialize Quill rich text editor
 */
function initializeEditor() {
  quillEditor = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Write your adventure here...',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
      ]
    }
  });
  
  console.log('📝 Editor initialized');
}

/**
 * Load the last active campaign
 */
async function loadLastCampaign() {
  const campaigns = await LonerDB.getAllCampaigns();
  
  if (campaigns.length > 0) {
    // Load the most recently played campaign
    const lastCampaign = campaigns[0];
    currentCampaignId = lastCampaign.id;
    
    // Update UI
    displayCurrentCampaign(lastCampaign);
    
    // Load last session for this campaign
    const sessions = await LonerDB.getSessionsForCampaign(lastCampaign.id);
    if (sessions.length > 0) {
      await loadSession(sessions[0].id);
    }
    
    console.log('📚 Loaded campaign:', lastCampaign.name);
  } else {
    console.log('ℹ️ No campaigns found - showing sample data');
  }
}

/**
 * Display current campaign info
 */
function displayCurrentCampaign(campaign) {
  const infoDiv = document.getElementById('current-campaign-info');
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
 * Load a session
 */
async function loadSession(sessionId) {
  try {
    currentSessionId = sessionId;
    saveAppState(); // Save state when session changes
    
    const session = await LonerDB.getSession(sessionId);
    console.log('Loading session:', session);
    
    // Load notes into editor
    if (session.notes) {
      try {
        const notesContent = JSON.parse(session.notes);
        quillEditor.setContents(notesContent);
      } catch (e) {
        console.warn('Could not parse session notes:', e);
        quillEditor.setText('');
      }
    } else {
      quillEditor.setText('');
    }
    
    // Load twist counter
    if (session.twistCounter !== undefined) {
      currentTwistCounter = session.twistCounter;
      document.getElementById('twist-count').textContent = currentTwistCounter;
    }
    
    console.log('✅ Session loaded:', session.name);
  } catch (error) {
    console.error('Error loading session:', error);
    throw error;
  }
}

/**
 * Save current session notes
 */
async function saveNotes() {
  console.log('Attempting to save notes. Session ID:', currentSessionId);
  
  if (!currentSessionId) {
    console.warn('No active session');
    UI.showAlert('No active session. Create a campaign first!', 'error');
    return;
  }
  
  try {
    const contents = quillEditor.getContents();
    const json = JSON.stringify(contents);
    
    console.log('Saving notes to session:', currentSessionId);
    await LonerDB.updateSessionNotes(currentSessionId, json);
    
    // Update save indicator
    const saveStatus = document.getElementById('save-status');
    if (saveStatus) {
      saveStatus.textContent = `Saved at ${UI.formatTime(new Date())}`;
      saveStatus.style.color = 'var(--success)';
    }
    
    console.log('✅ Notes saved successfully');
  } catch (error) {
    console.error('Error saving notes:', error);
    UI.showAlert('Error saving notes: ' + error.message, 'error');
  }
}

/**
 * Auto-save notes every 30 seconds
 */
function startAutoSave() {
  setInterval(async () => {
    if (currentSessionId && quillEditor.getLength() > 1) {
      await saveNotes();
    }
  }, 30000); // 30 seconds
  
  console.log('🔄 Auto-save enabled (every 30s)');
}

/**
 * Insert text into editor at cursor position
 */
function insertIntoEditor(text) {
  if (!quillEditor) return;
  
  const range = quillEditor.getSelection() || { index: quillEditor.getLength() };
  quillEditor.insertText(range.index, text + '\n');
  quillEditor.setSelection(range.index + text.length + 1);
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
    
    // Set as active
    currentCampaignId = campaignId;
    currentSessionId = sessionId;
    saveAppState(); // Save state
    
    // Close modal
    UI.closeModal();
    
    // Show success message
    UI.showAlert('Campaign created!', 'success');
    
    // Load the new campaign
    const campaign = await LonerDB.getCampaign(campaignId);
    displayCurrentCampaign(campaign);
    
    // Load the session
    await loadSession(sessionId);
    
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
  if (campaigns.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No campaigns yet. Create one!</p>';
    return;
  }
  
  container.innerHTML = campaigns.map(campaign => `
    <div class="card campaign-card" onclick="selectCampaign(${campaign.id})" style="cursor: pointer;">
      <h3>${UI.escapeHtml(campaign.name)}</h3>
      <p>${UI.escapeHtml(campaign.description || 'No description')}</p>
      <div class="card-footer">
        <span>Last played: ${UI.formatDate(campaign.lastPlayed)}</span>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteCampaignConfirm(${campaign.id})">
          Delete
        </button>
      </div>
    </div>
  `).join('');
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
    if (campaignId === currentCampaignId) {
      currentCampaignId = null;
      currentSessionId = null;
      saveAppState(); // Clear saved state
      
      document.getElementById('current-campaign-info').innerHTML = '<p class="text-muted">No campaign selected</p><button class="btn btn-primary" onclick="showView(\'campaigns\')">Select Campaign</button>';
      quillEditor.setText('');
    }
  }
}

/**
 * Select a campaign
 */
async function selectCampaign(campaignId) {
  try {
    console.log('Selecting campaign:', campaignId);
    
    currentCampaignId = campaignId;
    saveAppState(); // Save state
    
    const campaign = await LonerDB.getCampaign(campaignId);
    console.log('Campaign loaded:', campaign);
    
    displayCurrentCampaign(campaign);
    
    // Update last played
    await LonerDB.updateCampaignLastPlayed(campaignId);
    
    // Load sessions
    const sessions = await LonerDB.getSessionsForCampaign(campaignId);
    console.log('Found sessions:', sessions.length);
    
    if (sessions.length > 0) {
      await loadSession(sessions[0].id);
    } else {
      // Create a first session if none exists
      console.log('No sessions found, creating first session');
      const sessionId = await LonerDB.createSession(campaignId, 'Session 1');
      await loadSession(sessionId);
    }
    
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
 * Show new character form
 */
function showNewCharacterForm() {
  const formHTML = `
    <form onsubmit="event.preventDefault(); createNewCharacter();">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="char-name" required placeholder="Character name">
      </div>
      <div class="form-group">
        <label>Concept</label>
        <input type="text" id="char-concept" placeholder="e.g., Street-smart hacker">
      </div>
      <div class="form-group">
        <label>Skills (comma-separated)</label>
        <input type="text" id="char-skills" placeholder="Hacking, Stealth">
      </div>
      <div class="form-group">
        <label>Frailty</label>
        <input type="text" id="char-frailty" placeholder="Haunted by past">
      </div>
      <div class="form-group">
        <label>Gear (comma-separated)</label>
        <input type="text" id="char-gear" placeholder="Cyberdeck, Lockpicks">
      </div>
      <div class="form-group">
        <label>Goal & Motive</label>
        <textarea id="char-goal" placeholder="What do they want and why?"></textarea>
      </div>
      <div class="form-group">
        <label>Nemesis</label>
        <input type="text" id="char-nemesis" placeholder="The Syndicate">
      </div>
      <button type="submit" class="btn btn-primary">Create Character</button>
    </form>
  `;
  
  UI.showModal('New Character', formHTML);
}

/**
 * Create a new character
 */
async function createNewCharacter() {
  const name = document.getElementById('char-name').value;
  const concept = document.getElementById('char-concept').value;
  const skills = document.getElementById('char-skills').value.split(',').map(s => s.trim()).filter(s => s);
  const frailty = document.getElementById('char-frailty').value;
  const gear = document.getElementById('char-gear').value.split(',').map(s => s.trim()).filter(s => s);
  const goal = document.getElementById('char-goal').value;
  const nemesis = document.getElementById('char-nemesis').value;
  
  const charId = await LonerDB.createCharacter({
    name,
    concept,
    skills,
    frailty,
    gear,
    goalMotive: goal,
    nemesis,
    campaignId: currentCampaignId
  });
  
  UI.closeModal();
  UI.showAlert('Character created!', 'success');
  
  // Reload characters list
  showView('characters');
  loadCharactersList();
}

/**
 * Load and display characters list
 */
async function loadCharactersList() {
  const characters = await LonerDB.getCharacters();
  
  const container = document.getElementById('characters-list');
  if (characters.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No characters yet. Create one!</p>';
    return;
  }
  
  container.innerHTML = characters.map(character => `
    <div class="card character-card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <h3 style="margin: 0;">${UI.escapeHtml(character.name)}</h3>
        ${character.isActive ? '<span style="background: var(--success); color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">ACTIVE</span>' : ''}
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        ${UI.escapeHtml(character.concept || 'No concept')}
      </p>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
        ${character.skills.map(skill => `
          <span style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.85rem;">
            ${UI.escapeHtml(skill)}
          </span>
        `).join('')}
      </div>
      <div class="card-footer">
        <span>Luck: ${character.luck}/${character.maxLuck}</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm btn-outline" onclick="viewCharacterSheet(${character.id})">
            View
          </button>
          <button class="btn btn-sm btn-outline" onclick="editCharacter(${character.id})">
            Edit
          </button>
          ${!character.isActive ? `
            <button class="btn btn-sm btn-primary" onclick="setAsActiveCharacter(${character.id})">
              Set Active
            </button>
          ` : ''}
          <button class="btn btn-sm btn-danger" onclick="deleteCharacterConfirm(${character.id})">
            Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * View full character sheet in modal
 */
async function viewCharacterSheet(characterId) {
  const character = await LonerDB.getCharacter(characterId);
  
  const sheetHTML = `
    <div class="character-sheet">
      <div class="form-group">
        <label>Name</label>
        <div>${UI.escapeHtml(character.name)}</div>
      </div>
      <div class="form-group">
        <label>Concept</label>
        <div>${UI.escapeHtml(character.concept)}</div>
      </div>
      <div class="form-group">
        <label>Skills</label>
        <div>${character.skills.map(s => UI.escapeHtml(s)).join(', ') || 'None'}</div>
      </div>
      <div class="form-group">
        <label>Frailty</label>
        <div>${UI.escapeHtml(character.frailty)}</div>
      </div>
      <div class="form-group">
        <label>Gear</label>
        <div>${character.gear.map(g => UI.escapeHtml(g)).join(', ') || 'None'}</div>
      </div>
      <div class="form-group">
        <label>Goal & Motive</label>
        <div>${UI.escapeHtml(character.goalMotive)}</div>
      </div>
      <div class="form-group">
        <label>Nemesis</label>
        <div>${UI.escapeHtml(character.nemesis)}</div>
      </div>
      <div class="form-group">
        <label>Luck</label>
        <div>${character.luck} / ${character.maxLuck}</div>
      </div>
    </div>
  `;
  
  UI.showModal(character.name, sheetHTML);
}

/**
 * Edit character
 */
async function editCharacter(characterId) {
  const character = await LonerDB.getCharacter(characterId);
  
  const formHTML = `
    <form id="edit-character-form">
      <div class="form-group">
        <label>Name *</label>
        <input type="text" id="edit-char-name" required value="${UI.escapeHtml(character.name)}">
      </div>
      <div class="form-group">
        <label>Concept</label>
        <input type="text" id="edit-char-concept" value="${UI.escapeHtml(character.concept)}">
      </div>
      <div class="form-group">
        <label>Skills (comma-separated)</label>
        <input type="text" id="edit-char-skills" value="${character.skills.join(', ')}">
      </div>
      <div class="form-group">
        <label>Frailty</label>
        <input type="text" id="edit-char-frailty" value="${UI.escapeHtml(character.frailty)}">
      </div>
      <div class="form-group">
        <label>Gear (comma-separated)</label>
        <input type="text" id="edit-char-gear" value="${character.gear.join(', ')}">
      </div>
      <div class="form-group">
        <label>Goal & Motive</label>
        <textarea id="edit-char-goal" rows="2">${UI.escapeHtml(character.goalMotive)}</textarea>
      </div>
      <div class="form-group">
        <label>Nemesis</label>
        <input type="text" id="edit-char-nemesis" value="${UI.escapeHtml(character.nemesis)}">
      </div>
      <div class="form-group">
        <label>Luck</label>
        <input type="number" id="edit-char-luck" value="${character.luck}" min="0" max="${character.maxLuck}">
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  
  UI.showModal('Edit Character', formHTML);
  
  // Attach event listener to form after it's in the DOM
  setTimeout(() => {
    const form = document.getElementById('edit-character-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCharacterEdit(characterId);
      });
    }
  }, 100);
}

/**
 * Save character edits
 */
async function saveCharacterEdit(characterId) {
  try {
    const name = document.getElementById('edit-char-name').value.trim();
    const concept = document.getElementById('edit-char-concept').value.trim();
    const skills = document.getElementById('edit-char-skills').value
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
    const frailty = document.getElementById('edit-char-frailty').value.trim();
    const gear = document.getElementById('edit-char-gear').value
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
    const goal = document.getElementById('edit-char-goal').value.trim();
    const nemesis = document.getElementById('edit-char-nemesis').value.trim();
    const luck = parseInt(document.getElementById('edit-char-luck').value);
    
    await LonerDB.updateCharacter(characterId, {
      name,
      concept,
      skills,
      frailty,
      gear,
      goalMotive: goal,
      nemesis,
      luck
    });
    
    UI.closeModal();
    UI.showAlert('Character updated!', 'success');
    
    // Reload list
    await loadCharactersList();
    
    // If this was the active character, update display
    if (characterId === currentCharacterId) {
      await selectCharacter(characterId);
    }
    
  } catch (error) {
    console.error('Error saving character:', error);
    UI.showAlert('Error saving character: ' + error.message, 'error');
  }
}

/**
 * Set character as active
 */
async function setAsActiveCharacter(characterId) {
  await LonerDB.setActiveCharacter(characterId);
  await selectCharacter(characterId);
  await loadCharactersList();
  UI.showAlert('Active character set!', 'success');
}

/**
 * Delete character with confirmation
 */
async function deleteCharacterConfirm(characterId) {
  const character = await LonerDB.getCharacter(characterId);
  
  if (UI.confirmDialog(`Delete "${character.name}"? This cannot be undone.`)) {
    await LonerDB.deleteCharacter(characterId);
    UI.showAlert('Character deleted', 'success');
    await loadCharactersList();
    
    // If this was the active character, clear it
    if (characterId === currentCharacterId) {
      currentCharacterId = null;
      saveAppState(); // Clear saved state
      document.getElementById('active-character-info').innerHTML = '<p class="text-muted">No character selected</p>';
    }
  }
}

/**
 * Select an active character
 */
async function selectCharacter(characterId) {
  currentCharacterId = characterId;
  
  const character = await LonerDB.getCharacter(characterId);
  
  // Update UI
  const infoDiv = document.getElementById('active-character-info');
  infoDiv.innerHTML = `
    <h4>${UI.escapeHtml(character.name)}</h4>
    <p style="font-size: 0.85rem; color: var(--text-muted);">
      ${UI.escapeHtml(character.concept)}
    </p>
    <div style="margin-top: 0.5rem;">
      <strong>Luck:</strong> ${character.luck}/${character.maxLuck}
    </div>
  `;
  
  UI.showAlert('Character selected!', 'success');
}

/**
 * Placeholder functions (to be implemented)
 */
function showNPCPanel() {
  UI.showAlert('NPC manager coming soon!', 'info');
}

function showLocationPanel() {
  UI.showAlert('Location manager coming soon!', 'info');
}

function showThreadPanel() {
  UI.showAlert('Thread tracker coming soon!', 'info');
}

/**
 * Theme switching
 */
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.querySelector('.theme-icon');
  
  if (body.classList.contains('dark-theme')) {
    body.classList.remove('dark-theme');
    themeIcon.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    body.classList.add('dark-theme');
    themeIcon.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
}

function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme');
  const themeIcon = document.querySelector('.theme-icon');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeIcon.textContent = '☀️';
  } else {
    themeIcon.textContent = '🌙';
  }
}

// Make functions available globally
window.App = {
  insertIntoEditor,
  saveNotes,
  showNewCampaignForm,
  createNewCampaign,
  loadCampaignsList,
  selectCampaign,
  showNewCharacterForm,
  createNewCharacter,
  loadCharactersList,
  selectCharacter,
  showNPCPanel,
  showLocationPanel,
  showThreadPanel
};

// Make these functions available in onclick handlers
window.showView = UI.showView;
window.closeModal = UI.closeModal;
window.saveNotes = saveNotes;
window.rollOracle = OracleSystem.rollOracle;
window.rollScene = OracleSystem.rollScene;
window.getInspired = OracleSystem.getInspired;
window.resetTwistCounter = OracleSystem.resetTwistCounter;
window.startConflict = OracleSystem.startConflict;
window.rollConflict = OracleSystem.rollConflict;
window.endConflict = OracleSystem.endConflict;
window.showNewCampaignForm = showNewCampaignForm;
window.createNewCampaign = createNewCampaign;
window.loadCampaignsList = loadCampaignsList;
window.selectCampaign = selectCampaign;
window.deleteCampaignConfirm = deleteCampaignConfirm;
window.showNewCharacterForm = showNewCharacterForm;
window.createNewCharacter = createNewCharacter;
window.loadCharactersList = loadCharactersList;
window.selectCharacter = selectCharacter;
window.viewCharacterSheet = viewCharacterSheet;
window.editCharacter = editCharacter;
window.saveCharacterEdit = saveCharacterEdit;
window.setAsActiveCharacter = setAsActiveCharacter;
window.deleteCharacterConfirm = deleteCharacterConfirm;
window.showNPCPanel = showNPCPanel;
window.showLocationPanel = showLocationPanel;
window.showThreadPanel = showThreadPanel;
window.toggleTheme = toggleTheme;

// Debug helper - check app state from console
window.LonerDebug = {
  getCurrentState: () => ({
    campaignId: currentCampaignId,
    sessionId: currentSessionId,
    characterId: currentCharacterId,
    hasEditor: !!quillEditor
  }),
  getCampaigns: () => LonerDB.getAllCampaigns(),
  getSessions: (campaignId) => LonerDB.getSessionsForCampaign(campaignId || currentCampaignId),
  getCharacters: () => LonerDB.getCharacters(),
  testSave: () => saveNotes(),
  saveState: () => saveAppState(),
  loadState: () => loadAppState(),
  clearState: () => {
    localStorage.removeItem('lonerAppState');
    console.log('State cleared');
  },
  clearAll: async () => {
    if (confirm('This will DELETE ALL DATA. Are you sure?')) {
      localStorage.clear();
      await LonerDB.db.delete();
      location.reload();
    }
  }
};

console.log('💡 Debug tools available: Type LonerDebug.getCurrentState() to check app state');