/**
 * LONER ASSISTANT v2.0 - Table Manager UI
 * 
 * Interface for browsing and rolling tables
 */

const TableManager = {
  /**
   * Show the table browser
   */
  show() {
    App.switchView('tools');
    this.render();
  },
  
  /**
   * Render the main table browser
   */
  render() {
    const container = document.getElementById('tools-grid');
    if (!container) return;
    
    container.innerHTML = `
      <div class="table-manager">
        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="btn btn-large btn-primary" onclick="TableManager.rollAdventureMaker()">
            🎭 Roll Adventure Maker
          </button>
          <button class="btn btn-large btn-secondary" onclick="TableManager.rollGetInspired()">
            ✨ Get Inspired
          </button>
        </div>
        
        <!-- Get Inspired Flavor Selector -->
        <div class="panel">
          <h3>Get Inspired Flavor</h3>
          <select id="inspired-flavor-select" onchange="TableManager.changeInspiredFlavor(this.value)">
            ${this.renderFlavorOptions()}
          </select>
        </div>
        
        <!-- Table Categories -->
        <div class="table-categories">
          ${this.renderCategories()}
        </div>
        
        <!-- Roll History -->
        <div class="panel">
          <h3>Recent Rolls</h3>
          <div id="table-roll-history"></div>
        </div>
      </div>
    `;
    
    this.loadRollHistory();
  },
  
  /**
   * Render flavor options
   */
  renderFlavorOptions() {
    const flavors = TableSystem.getInspiredFlavors();
    const active = TableSystem.getActiveInspiredFlavor();
    
    return flavors.map(flavor => `
      <option value="${flavor.id}" ${flavor.id === active ? 'selected' : ''}>
        ${flavor.name}
      </option>
    `).join('');
  },
  
  /**
   * Render table categories
   */
  renderCategories() {
    const categories = {
      'adventure-maker': 'Adventure Maker',
      'get-inspired': 'Get Inspired Tables',
      'custom': 'Custom Tables'
    };
    
    let html = '';
    for (const [key, label] of Object.entries(categories)) {
      html += `
        <div class="table-category">
          <h3>${label}</h3>
          <div class="table-list">
            ${this.renderTablesInCategory(key)}
          </div>
        </div>
      `;
    }
    
    return html;
  },
  
  /**
   * Render tables in a category
   */
  renderTablesInCategory(category) {
    const tables = [];
    
    for (const [suppId, supplement] of Object.entries(TableSystem.registry)) {
      for (const [tableId, table] of Object.entries(supplement.tables)) {
        if (table.category === category) {
          tables.push({
            supplementId: suppId,
            tableId: tableId,
            name: table.name,
            description: table.description || ''
          });
        }
      }
    }
    
    if (tables.length === 0) {
      return '<p class="text-muted">No tables available</p>';
    }
    
    return tables.map(table => `
      <div class="table-card">
        <div class="table-card-header">
          <h4>${table.name}</h4>
          <button class="btn btn-sm btn-secondary" 
                  onclick="TableManager.rollTable('${table.supplementId}', '${table.tableId}')">
            🎲 Roll
          </button>
        </div>
        ${table.description ? `<p class="text-muted">${table.description}</p>` : ''}
      </div>
    `).join('');
  },
  
  /**
   * Roll Adventure Maker
   */
  async rollAdventureMaker() {
    const results = await TableSystem.rollAdventureMaker();
    
    // Show modal with results
    UI.showModal('Adventure Maker Results', `
      <div class="adventure-maker-results">
        <div class="result-section">
          <h4>Setting</h4>
          <p><strong>${results.setting.result}</strong></p>
          <p class="text-muted">Rolled: ${results.setting.rolls.join(', ')}</p>
        </div>
        
        <div class="result-section">
          <h4>Tone</h4>
          <p><strong>${results.tone.result}</strong></p>
        </div>
        
        <div class="result-section">
          <h4>Key Elements</h4>
          <ul>
            <li>${results.thing1.result}</li>
            <li>${results.thing2.result}</li>
          </ul>
        </div>
        
        <div class="result-section">
          <h4>Opposition</h4>
          <p><strong>${results.opposition.result}</strong></p>
        </div>
        
        <div class="result-section">
          <h4>Actions</h4>
          <p>${results.action1.result} → ${results.action2.result}</p>
        </div>
        
        <div class="result-section">
          <h4>Focus</h4>
          <p><strong>${results.thing3.result}</strong></p>
        </div>
      </div>
    `);
    
    this.loadRollHistory();
  },
  
  /**
   * Roll Get Inspired
   */
  async rollGetInspired() {
    const result = await TableSystem.rollGetInspired();
    
    // Update sidebar display
    const resultDiv = document.getElementById('inspiration-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="font-weight: 600; font-size: 1.1rem; margin-top: 0.5rem;">
          ${result.verb} + ${result.adjective} + ${result.noun}
        </div>
        <div style="font-size: 0.85rem; margin-top: 0.25rem; color: var(--text-muted);">
          "${result.formatted}"
        </div>
      `;
    }
    
    UI.showAlert('Inspiration generated!', 'success');
    this.loadRollHistory();
  },
  
  /**
   * Roll a specific table
   */
  async rollTable(supplementId, tableId) {
    const result = await TableSystem.roll(supplementId, tableId);
    
    // Log to database
    await TableSystem.logTableRoll(result.table, supplementId, result.result);
    
    // Insert to notes
    if (typeof Editor !== 'undefined') {
      Editor.insertBlock(
        '📋',
        result.table,
        result.result,
        '#6366f1'
      );
    }
    
    // Log event
    if (typeof EventManager !== 'undefined') {
      await EventManager.logEvent('table-roll', `${result.table}: ${result.result}`, {
        supplement: result.supplement,
        rolls: result.rolls
      });
    }
    
    UI.showAlert(`Rolled: ${result.result}`, 'success');
    this.loadRollHistory();
  },
  
  /**
   * Change Get Inspired flavor
   */
  async changeInspiredFlavor(supplementId) {
    await TableSystem.setInspiredFlavor(supplementId);
  },
  
  /**
   * Show flavor picker in a modal
   */
  showFlavorPicker() {
    const flavors = TableSystem.getInspiredFlavors();
    const active = TableSystem.getActiveInspiredFlavor();
    
    const optionsHTML = flavors.map(flavor => `
      <div class="flavor-option ${flavor.id === active ? 'active' : ''}" 
           onclick="TableManager.selectFlavor('${flavor.id}')">
        <div class="flavor-name">${flavor.name}</div>
        <div class="flavor-version">v${flavor.version}</div>
      </div>
    `).join('');
    
    UI.showModal('Choose Get Inspired Flavor', `
      <div class="flavor-picker">
        ${optionsHTML}
      </div>
      <style>
        .flavor-picker {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .flavor-option {
          padding: 1rem;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s;
        }
        .flavor-option:hover {
          border-color: var(--primary);
          background: var(--bg-tertiary);
        }
        .flavor-option.active {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }
        .flavor-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .flavor-version {
          font-size: 0.85rem;
          opacity: 0.7;
        }
      </style>
    `);
  },
  
  /**
   * Select a flavor
   */
  async selectFlavor(flavorId) {
    await TableSystem.setInspiredFlavor(flavorId);
    UI.closeModal();
    
    // Refresh any displays if needed
    if (App.getState().sessionId) {
      this.loadRollHistory();
    }
  },
  
  /**
   * Load roll history
   */
  async loadRollHistory() {
    const history = await TableSystem.getSessionRollHistory();
    const container = document.getElementById('table-roll-history');
    
    if (!container) return;
    
    if (history.length === 0) {
      container.innerHTML = '<p class="text-muted">No rolls yet this session</p>';
      return;
    }
    
    container.innerHTML = history.slice(0, 10).map(roll => `
      <div class="roll-history-item">
        <div class="roll-history-header">
          <strong>${roll.tableName}</strong>
          <span class="text-muted">${this.formatTime(roll.timestamp)}</span>
        </div>
        <div>${roll.result}</div>
      </div>
    `).join('');
  },
  
  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

// Make it available globally
window.TableManager = TableManager;