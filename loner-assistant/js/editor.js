/**
 * LONER ASSISTANT v2.0 - Note Editor Management
 * 
 * All editor-related functions (Quill editor)
 */

let quillEditor = null;

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
  return quillEditor;
}

/**
 * Load a session into the editor
 */
async function loadSession(sessionId) {
  try {
    const session = await LonerDB.getSession(sessionId);
    console.log('Loading session into editor:', session);
    
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
      const counterEl = document.getElementById('twist-count');
      if (counterEl) {
        counterEl.textContent = currentTwistCounter;
      }
    }
    
    console.log('✅ Session loaded into editor:', session.name);
  } catch (error) {
    console.error('Error loading session:', error);
    throw error;
  }
}

/**
 * Save current session notes
 */
async function saveNotes() {
  const state = App.getState();
  
  if (!state.sessionId) {
    console.warn('No active session');
    UI.showAlert('No active session. Create a campaign first!', 'error');
    return;
  }
  
  // ADD THIS CHECK:
  if (!quillEditor) {
    console.error('Editor not initialized');
    UI.showAlert('Editor not ready. Please refresh the page.', 'error');
    return;
  }
  
  try {
    const contents = quillEditor.getContents();
    const json = JSON.stringify(contents);
    
    await LonerDB.updateSessionNotes(state.sessionId, json);
    
    const saveStatus = document.getElementById('save-status');
    if (saveStatus) {
      saveStatus.textContent = `Saved at ${UI.formatTime(new Date())}`;
      saveStatus.style.color = 'var(--success)';
    }
    
    console.log('✅ Notes saved');
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
    const state = App.getState();
    if (state.sessionId && quillEditor && quillEditor.getLength() > 1) {
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
 * Get the editor instance
 */
function getEditor() {
  return quillEditor;
}

// Export functions
window.Editor = {
  initializeEditor,
  loadSession,
  saveNotes,
  startAutoSave,
  insertIntoEditor,
  getEditor
};