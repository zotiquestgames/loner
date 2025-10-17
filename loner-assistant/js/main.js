/**
 * LONER ASSISTANT v2.0 - Main Application Controller
 * 
 * This file ONLY handles:
 * - Application initialization
 * - State management (save/load)
 * - Coordinating between modules
 * - Theme switching
 * - Debug tools
 */

// Global state
let currentCampaignId = null;
let currentSessionId = null;
let currentCharacterId = null;

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
 * Get current app state
 */
function getState() {
  return {
    campaignId: currentCampaignId,
    sessionId: currentSessionId,
    characterId: currentCharacterId
  };
}

/**
 * Set current campaign and session
 */
function setCurrentCampaign(campaignId, sessionId) {
  currentCampaignId = campaignId;
  currentSessionId = sessionId;
  saveAppState();
}

/**
 * Clear current campaign
 */
function clearCurrentCampaign() {
  currentCampaignId = null;
  currentSessionId = null;
  saveAppState();
}

/**
 * Set current character
 */
function setCurrentCharacter(characterId) {
  currentCharacterId = characterId;
  saveAppState();
}

/**
 * Clear current character
 */
function clearCurrentCharacter() {
  currentCharacterId = null;
  saveAppState();
}

/**
 * Initialize the application when page loads
 */

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🎲 Loner Assistant v2.0 starting...');
  
  try {
    // 1. Initialize UI first (doesn't need database)
    UI.initializeNavigation();
    loadThemePreference();
    console.log('✅ UI initialized');
    
    // 2. Initialize editor (doesn't need database)
    Editor.initializeEditor();
    console.log('✅ Editor initialized');
    
    // 3. WAIT for database to be fully ready
    await db.open();
    console.log('✅ Database ready');
    
    // 4. Give it a moment to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 5. NOW load saved state
    const savedState = loadAppState();
    
    if (savedState && savedState.campaignId) {
      try {
        const campaign = await LonerDB.getCampaign(savedState.campaignId);
        if (campaign) {
          CampaignManager.displayCurrentCampaign(campaign);
          
          // Load session
          if (savedState.sessionId) {
            const session = await LonerDB.getSession(savedState.sessionId);
            if (session) {
              await Editor.loadSession(savedState.sessionId);
              SessionManager.displayCurrentSession(session);
            }
          }
        }
      } catch (error) {
        console.warn('Could not load saved state:', error);
        localStorage.removeItem('lonerAppState');
      }
    }
    
    // 6. Load active character
    const characters = await LonerDB.getCharacters();
    const activeChar = characters.find(c => c.isActive);
    if (activeChar) {
      currentCharacterId = activeChar.id;
      CharacterManager.displayActiveCharacter(activeChar);
    }
    
    // 7. Start auto-save
    Editor.startAutoSave();
    
    console.log('✅ App initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    UI.showAlert('App started with errors. Check console (F12).', 'error');
  }
});

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
    CampaignManager.displayCurrentCampaign(lastCampaign);
    
    // Load last session for this campaign
    const sessions = await LonerDB.getSessionsForCampaign(lastCampaign.id);
    if (sessions.length > 0) {
      await Editor.loadSession(sessions[0].id);
      currentSessionId = sessions[0].id;
    } else {
      const sessionId = await LonerDB.createSession(lastCampaign.id, 'Session 1');
      await Editor.loadSession(sessionId);
      currentSessionId = sessionId;
    }
    
    saveAppState();
    console.log('📚 Loaded campaign:', lastCampaign.name);
  } else {
    console.log('ℹ️ No campaigns found');
  }
}

/**
 * Placeholder functions (to be implemented later)
 */
function showNPCPanel() {
  NPCManager.showNPCPanel();
}

function showLocationPanel() {
  LocationManager.showLocationPanel();
}

function showThreadPanel() {
  ThreadManager.showThreadPanel();
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
  
  if (themeIcon) {
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      themeIcon.textContent = '☀️';
    } else {
      themeIcon.textContent = '🌙';
    }
  }
}

// Export App interface
window.App = {
  getState,
  setCurrentCampaign,
  clearCurrentCampaign,
  setCurrentCharacter,
  clearCurrentCharacter,
  saveAppState,
  loadAppState
};

// Make functions available globally for onclick handlers
window.showView = UI.showView;
window.closeModal = UI.closeModal;

// ============================================
// GLOBAL FUNCTION EXPORTS (after all scripts load)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Campaign functions
  if (window.CampaignManager) {
    window.showNewCampaignForm = CampaignManager.showNewCampaignForm;
    window.createNewCampaign = CampaignManager.createNewCampaign;
    window.loadCampaignsList = CampaignManager.loadCampaignsList;
    window.selectCampaign = CampaignManager.selectCampaign;
    window.viewCampaignDetails = CampaignManager.viewCampaignDetails;
    window.editCampaign = CampaignManager.editCampaign;
    window.saveCampaignEdit = CampaignManager.saveCampaignEdit;
    window.deleteCampaignConfirm = CampaignManager.deleteCampaignConfirm;
  }
  
  // Character functions
  if (window.CharacterManager) {
    window.showNewCharacterForm = CharacterManager.showNewCharacterForm;
    window.createNewCharacter = CharacterManager.createNewCharacter;
    window.loadCharactersList = CharacterManager.loadCharactersList;
    window.viewCharacterDetails = CharacterManager.viewCharacterDetails;
    window.editCharacter = CharacterManager.editCharacter;
    window.saveCharacterEdit = CharacterManager.saveCharacterEdit;
    window.deleteCharacterConfirm = CharacterManager.deleteCharacterConfirm;
  }
  
  // NPC functions
  if (window.NPCManager) {
    window.showNPCPanel = NPCManager.showNPCPanel;
    window.showNewNPCForm = NPCManager.showNewNPCForm;
    window.createNewNPC = NPCManager.createNewNPC;
    window.viewNPCDetails = NPCManager.viewNPCDetails;
    window.editNPC = NPCManager.editNPC;
    window.saveNPCEdit = NPCManager.saveNPCEdit;
    window.deleteNPCConfirm = NPCManager.deleteNPCConfirm;
    window.loadNPCsList = NPCManager.loadNPCsList;
  }
  
  // Location functions
  if (window.LocationManager) {
    window.showLocationPanel = LocationManager.showLocationPanel;
    window.showNewLocationForm = LocationManager.showNewLocationForm;
    window.createNewLocation = LocationManager.createNewLocation;
    window.viewLocationDetails = LocationManager.viewLocationDetails;
    window.markLocationVisited = LocationManager.markLocationVisited;
    window.markLocationVisitedAndClose = LocationManager.markLocationVisitedAndClose;
    window.editLocation = LocationManager.editLocation;
    window.saveLocationEdit = LocationManager.saveLocationEdit;
    window.deleteLocationConfirm = LocationManager.deleteLocationConfirm;
    window.loadLocationsList = LocationManager.loadLocationsList;
  }
  
  // Thread functions
  if (window.ThreadManager) {
    window.showThreadPanel = ThreadManager.showThreadPanel;
    window.showNewThreadForm = ThreadManager.showNewThreadForm;
    window.createNewThread = ThreadManager.createNewThread;
    window.viewThreadDetails = ThreadManager.viewThreadDetails;
    window.resolveThreadAndClose = ThreadManager.resolveThreadAndClose;
    window.editThread = ThreadManager.editThread;
    window.saveThreadEdit = ThreadManager.saveThreadEdit;
    window.deleteThreadConfirm = ThreadManager.deleteThreadConfirm;
    window.loadThreadsList = ThreadManager.loadThreadsList;
  }

  // Event functions
  if (window.EventManager) {
    window.showEventPanel = EventManager.showEventPanel;
    window.showNewEventForm = EventManager.showNewEventForm;
    window.createNewEvent = EventManager.createNewEvent;
    window.loadEventTimeline = EventManager.loadEventTimeline;
    window.deleteEventConfirm = EventManager.deleteEventConfirm;
    window.exportSessionRecap = EventManager.exportSessionRecap;
  }

});

// Other functions
window.toggleTheme = toggleTheme;

// Debug helper
window.LonerDebug = {
  getCurrentState: () => ({
    ...getState(),
    hasEditor: !!Editor.getEditor(),
    dbVersion: LonerDB.db.verno
  }),
  getCampaigns: () => LonerDB.getAllCampaigns(),
  getSessions: (campaignId) => LonerDB.getSessionsForCampaign(campaignId || currentCampaignId),
  getCharacters: () => LonerDB.getCharacters(),
  testSave: () => Editor.saveNotes(),
  saveState: () => saveAppState(),
  loadState: () => loadAppState(),
  clearState: () => {
    localStorage.removeItem('lonerAppState');
    console.log('✅ State cleared');
  },
  clearAll: async () => {
    if (confirm('This will DELETE ALL DATA. Are you sure?')) {
      localStorage.clear();
      await LonerDB.db.delete();
      console.log('✅ All data cleared. Refreshing...');
      location.reload();
    }
  }
};

console.log('💡 Debug tools available:');
console.log('  LonerDebug.getCurrentState() - Check app state');
console.log('  LonerDebug.clearAll() - Delete everything and start fresh');
console.log('  LonerDebug.clearState() - Clear saved state only');