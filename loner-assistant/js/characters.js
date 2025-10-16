/**
 * LONER ASSISTANT v2.0 - Character Management
 * 
 * All character-related functions
 */

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
}

/**
 * Show new character form
 */
function showNewCharacterForm() {
  const formHTML = `
    <form id="new-character-form">
      <div class="form-group">
        <label>Name *</label>
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
        <textarea id="char-goal" placeholder="What do they want and why?" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>Nemesis</label>
        <input type="text" id="char-nemesis" placeholder="The Syndicate">
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Character</button>
      </div>
    </form>
  `;
  
  UI.showModal('New Character', formHTML);
  
  // Attach event listener to form after it's in the DOM
  setTimeout(() => {
    const form = document.getElementById('new-character-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewCharacter();
      });
    }
  }, 100);
}

/**
 * Create a new character
 */
async function createNewCharacter() {
  const nameInput = document.getElementById('char-name');
  
  if (!nameInput || !nameInput.value.trim()) {
    UI.showAlert('Please enter a character name', 'error');
    return;
  }
  
  try {
    const state = App.getState();

    if (!state.campaignId) {
      UI.showAlert('Please create or select a campaign first!', 'error');
      UI.closeModal();
      showView('campaigns');
      return;
    }
    
    const name = nameInput.value.trim();
    const concept = document.getElementById('char-concept').value.trim();
    const skills = document.getElementById('char-skills').value
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
    const frailty = document.getElementById('char-frailty').value.trim();
    const gear = document.getElementById('char-gear').value
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
    const goal = document.getElementById('char-goal').value.trim();
    const nemesis = document.getElementById('char-nemesis').value.trim();
    
    const charId = await LonerDB.createCharacter({
      name,
      concept,
      skills,
      frailty,
      gear,
      goalMotive: goal,
      nemesis,
      campaignId: state.campaignId
    });
    
    console.log('Character created with ID:', charId);
    
    UI.closeModal();
    UI.showAlert('Character created!', 'success');
    
    // Reload characters list
    await loadCharactersList();
    showView('characters');
    
  } catch (error) {
    console.error('Error creating character:', error);
    UI.showAlert('Error creating character: ' + error.message, 'error');
  }
}

/**
 * Load and display characters list
 */
async function loadCharactersList() {
  const characters = await LonerDB.getCharacters();
  
  const container = document.getElementById('characters-list');
  if (!container) return;
  
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
    const state = App.getState();
    if (characterId === state.characterId) {
      await selectCharacter(characterId);
    }
    
  } catch (error) {
    console.error('Error saving character:', error);
    UI.showAlert('Error saving character: ' + error.message, 'error');
  }
}

/**
 * Select an active character
 */
async function selectCharacter(characterId) {
  App.setCurrentCharacter(characterId);
  
  const character = await LonerDB.getCharacter(characterId);
  displayActiveCharacter(character);
  
  UI.showAlert('Character selected!', 'success');
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
    const state = App.getState();
    if (characterId === state.characterId) {
      App.clearCurrentCharacter();
      document.getElementById('active-character-info').innerHTML = '<p class="text-muted">No character selected</p>';
    }
  }
}

// Export functions
window.CharacterManager = {
  displayActiveCharacter,
  showNewCharacterForm,
  createNewCharacter,
  loadCharactersList,
  viewCharacterSheet,
  editCharacter,
  saveCharacterEdit,
  selectCharacter,
  setAsActiveCharacter,
  deleteCharacterConfirm
};