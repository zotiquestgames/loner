/**
 * LONER ASSISTANT v2.0 - UI Helper Functions
 * 
 * Simple functions for showing/hiding views, modals, etc.
 * No fancy frameworks - just plain JavaScript!
 */

/**
 * Show a specific view and hide others
 */
function showView(viewName) {
  // Hide all views
  const views = document.querySelectorAll('.view');
  views.forEach(view => view.classList.remove('active'));
  
  // Show the requested view
  const targetView = document.getElementById('view-' + viewName);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // Update navigation buttons
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.view === viewName) {
      btn.classList.add('active');
    }
  });
  
  // Load data for specific views
  if (viewName === 'characters' && typeof loadCharactersList === 'function') {
    loadCharactersList();
  }
    if (viewName === 'campaigns' && typeof loadCampaignsList === 'function') {
    loadCampaignsList();
  }
  if (viewName === 'characters' && typeof loadCharactersList === 'function') {
    loadCharactersList();
  }
  if (viewName === 'npcs' && typeof loadNPCsList === 'function') {
    loadNPCsList();
  }
  if (viewName === 'locations' && typeof loadLocationsList === 'function') {
    loadLocationsList();
  }
  if (viewName === 'threads' && typeof loadThreadsList === 'function') {
    loadThreadsList();
  }

  if (viewName === 'events' && typeof loadEventTimeline === 'function') {
  loadEventTimeline();
  }

}

/**
 * Show a modal dialog
 */
function showModal(title, content) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  
  modal.classList.remove('hidden');
}

/**
 * Close the modal
 */
function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
}

/**
 * Show a simple alert message
 */
function showAlert(message, type = 'info') {
  try {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    let bgColor;
    switch(type) {
      case 'success':
        bgColor = '#10b981';
        break;
      case 'error':
        bgColor = '#ef4444';
        break;
      case 'warning':
        bgColor = '#f59e0b';
        break;
      default:
        bgColor = '#4f46e5';
    }
    
    alert.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${bgColor};
      color: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
      alert.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  } catch (error) {
    console.error('Error showing alert:', error);
    // Fallback to console if DOM isn't ready
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

/**
 * Confirm dialog
 */
function confirmDialog(message) {
  return confirm(message);
}

/**
 * Format a date nicely
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Show relative time for recent dates
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // Otherwise show actual date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Format time from Date object
 */
function formatTime(date) {  // ADD 'function' keyword here
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Set up navigation button handlers
 */
function initializeNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) {
        showView(view);
      }
    });
  });
}

/**
 * Toggle element visibility
 */
function toggleElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.toggle('hidden');
  }
}

/**
 * Update element content
 */
function updateElement(elementId, content) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = content;
  }
}

/**
 * Render a list of items as cards
 */
function renderCardList(containerId, items, renderFunction) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (items.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No items yet</p>';
    return;
  }
  
  container.innerHTML = items.map(item => renderFunction(item)).join('');
}

/**
 * Create a card HTML
 */
function createCard(title, description, footer, onClick) {
  return `
    <div class="card" onclick="${onClick}">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(description)}</p>
      ${footer ? `<div class="card-footer">${footer}</div>` : ''}
    </div>
  `;
}

// Make functions available globally
window.UI = {
  showView,
  showModal,
  closeModal,
  showAlert,
  confirmDialog,
  formatDate,
  formatTime,
  escapeHtml,
  initializeNavigation,
  toggleElement,
  updateElement,
  renderCardList,
  createCard
};