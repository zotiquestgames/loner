/**
 * LONER ASSISTANT v2.0 - Roll Tables System
 * 
 * Universal table roller supporting multiple formats:
 * - 1d6, 2d6 (standard Loner tables)
 * - 1d66 (tens digit from first die, ones from second)
 * - Random selection (for flat lists)
 */

const TableSystem = {
  // Store loaded tables
  registry: {},
  activeSupplements: [],
  
  /**
   * Initialize the table system
   */
/**
 * Initialize the table system
 */
    async init() {
    console.log('🎲 Initializing Table System...');
    
    // Register core supplements if they exist
    if (typeof CoreLonerTables !== 'undefined') {
        this.registerSupplement(CoreLonerTables);
    } else {
        console.warn('⚠️ CoreLonerTables not loaded');
    }
    
    if (typeof CoreInspiredTables !== 'undefined') {
        this.registerSupplement(CoreInspiredTables);
    } else {
        console.warn('⚠️ CoreInspiredTables not loaded');
    }
    
    // Load user preferences
    const activeFlavorStored = localStorage.getItem('loner-inspired-flavor');
    if (activeFlavorStored && this.registry[activeFlavorStored]) {
        // Flavor exists, use it
    } else {
        // Default to core-inspired
        localStorage.setItem('loner-inspired-flavor', 'core-inspired');
    }
    
    console.log('✅ Table System initialized');
    console.log('📋 Registered supplements:', Object.keys(this.registry));
    },
  
  /**
   * Load the table registry
   */
  async loadRegistry() {
    // In production, this would load from table-registry.js
    // For now, we'll manually register known tables
    this.registerSupplement(CoreLonerTables);
    this.registerSupplement(CoreInspiredTables);
    
    // Load custom tables from database
    const customTables = await LonerDB.getCustomTables();
    customTables.forEach(table => this.registerCustomTable(table));
  },
  
  /**
   * Register a supplement's tables
   */
  registerSupplement(supplement) {
    const id = supplement.supplement.id;
    this.registry[id] = supplement;
    console.log(`Registered supplement: ${supplement.supplement.name}`);
  },
  
  /**
   * Register a custom user table
   */
  registerCustomTable(table) {
    if (!this.registry['custom']) {
      this.registry['custom'] = {
        supplement: { id: 'custom', name: 'Custom Tables' },
        tables: {}
      };
    }
    this.registry['custom'].tables[table.id] = table;
  },
  
  /**
   * Roll on a specific table
   */
  roll(supplementId, tableId) {
    const supplement = this.registry[supplementId];
    if (!supplement) {
      throw new Error(`Supplement not found: ${supplementId}`);
    }
    
    const table = supplement.tables[tableId];
    if (!table) {
      throw new Error(`Table not found: ${tableId}`);
    }
    
    // Roll based on table type
    let result;
    switch (table.rollType) {
      case '1d6':
        result = this.roll1d6(table);
        break;
      case '2d6':
        result = this.roll2d6(table);
        break;
      case '1d66':
        result = this.roll1d66(table);
        break;
      case 'random':
        result = this.rollRandom(table);
        break;
      case 'subtable':
        result = this.rollSubtable(table);
        break;
      default:
        throw new Error(`Unknown roll type: ${table.rollType}`);
    }
    
    return {
      table: table.name,
      supplement: supplement.supplement.name,
      supplementId: supplementId,
      tableId: tableId,
      result: result.value,
      rolls: result.rolls,
      timestamp: new Date()
    };
  },
  
  /**
   * Roll 1d6 on a table
   */
  roll1d6(table) {
    const die = rollD6();
    const value = table.entries[die - 1];
    return { value, rolls: [die] };
  },
  
  /**
   * Roll 2d6 on a table (row, column)
   */
  roll2d6(table) {
    const die1 = rollD6();
    const die2 = rollD6();
    const value = table.entries[die1 - 1][die2 - 1];
    return { value, rolls: [die1, die2] };
  },
  
  /**
   * Roll 1d66 (first die = tens, second = ones)
   */
  roll1d66(table) {
    const die1 = rollD6();
    const die2 = rollD6();
    const index = ((die1 - 1) * 6) + (die2 - 1);
    const value = table.entries[index];
    return { value, rolls: [die1, die2] };
  },
  
  /**
   * Random selection from flat list
   */
  rollRandom(table) {
    const index = Math.floor(Math.random() * table.entries.length);
    const value = table.entries[index];
    return { value, rolls: ['random'] };
  },
  
  /**
   * Roll on subtable (e.g., Get Inspired verbs)
   */
  rollSubtable(table) {
    const die1 = rollD6();
    const subList = table.entries[die1 - 1];
    const die2 = Math.floor(Math.random() * subList.length);
    const value = subList[die2];
    return { value, rolls: [die1, die2 + 1] };
  },
  
  /**
   * Roll the complete Adventure Maker sequence
   */
  async rollAdventureMaker() {
    const results = {
      setting: this.roll('core-loner', 'settings'),
      tone: this.roll('core-loner', 'tones'),
      thing1: this.roll('core-loner', 'things'),
      thing2: this.roll('core-loner', 'things'),
      opposition: this.roll('core-loner', 'opposition'),
      action1: this.roll('core-loner', 'actions'),
      action2: this.roll('core-loner', 'actions'),
      thing3: this.roll('core-loner', 'things')
    };
    
    // Format as a nice summary
    const summary = this.formatAdventureMaker(results);
    
    // Log to database
    await this.logTableRoll('adventure-maker', 'core-loner', summary);
    
    // Insert to notes
    if (typeof Editor !== 'undefined') {
      Editor.insertBlock(
        '🎭',
        'Adventure Maker',
        summary,
        '#8b5cf6'
      );
    }
    
    // Log event
    if (typeof EventManager !== 'undefined') {
      await EventManager.logEvent('table-roll', 'Adventure Maker generated', { results });
    }
    
    return results;
  },
  
  /**
   * Format Adventure Maker results
   */
  formatAdventureMaker(results) {
    return `
**Setting:** ${results.setting.result}
**Tone:** ${results.tone.result}
**Elements:** ${results.thing1.result}, ${results.thing2.result}

**Opposition:** ${results.opposition.result}
**Actions:** ${results.action1.result} → ${results.action2.result}
**Key Element:** ${results.thing3.result}
    `.trim();
  },
  
  /**
   * Roll Get Inspired with current flavor
   */
  async rollGetInspired(supplementId = null) {
    // Use active supplement or default to core
    const activeSupplement = supplementId || this.getActiveInspiredFlavor();
    
    const verb = this.roll(activeSupplement, 'verbs');
    const adjective = this.roll(activeSupplement, 'adjectives');
    const noun = this.roll(activeSupplement, 'nouns');
    
    const result = {
      verb: verb.result,
      adjective: adjective.result,
      noun: noun.result,
      formatted: `${verb.result} the ${adjective.result} ${noun.result}`,
      supplement: activeSupplement
    };
    
    // Log to database
    await this.logTableRoll('get-inspired', activeSupplement, result.formatted);
    
    // Insert to notes
    if (typeof Editor !== 'undefined') {
      Editor.insertBlock(
        '✨',
        'Inspiration',
        result.formatted,
        '#10b981'
      );
    }
    
    // Log event
    if (typeof EventManager !== 'undefined') {
      await EventManager.logEvent('inspiration', result.formatted, { supplement: activeSupplement });
    }
    
    return result;
  },
  
  /**
   * Get active Get Inspired flavor
   */
  getActiveInspiredFlavor() {
    // Check user preferences
    const stored = localStorage.getItem('loner-inspired-flavor');
    return stored || 'core-inspired';
  },
  
  /**
   * Set active Get Inspired flavor
   */
  async setInspiredFlavor(supplementId) {
    localStorage.setItem('loner-inspired-flavor', supplementId);
    await LonerDB.setUserPreference('inspiredFlavor', supplementId);
    UI.showAlert(`Get Inspired flavor changed to: ${this.registry[supplementId].supplement.name}`, 'success');
  },
  
  /**
   * Get all available Get Inspired flavors
   */
  getInspiredFlavors() {
    const flavors = [];
    for (const [id, supplement] of Object.entries(this.registry)) {
      if (supplement.supplement.flavorOf === 'get-inspired') {
        flavors.push({
          id: id,
          name: supplement.supplement.name,
          version: supplement.supplement.version
        });
      }
    }
    return flavors;
  },
  
  /**
   * Log table roll to database
   */
  async logTableRoll(tableName, supplementId, result) {
    const state = App.getState();
    if (!state.sessionId) return;
    
    await db.tableRolls.add({
      sessionId: state.sessionId,
      timestamp: new Date(),
      tableName: tableName,
      supplementId: supplementId,
      result: result
    });
  },
  
  /**
   * Get table roll history for current session
   */
  async getSessionRollHistory() {
    const state = App.getState();
    if (!state.sessionId) return [];
    
    return await db.tableRolls
      .where('sessionId')
      .equals(state.sessionId)
      .reverse()
      .toArray();
  },
  
  /**
   * Save user preferences
   */
  async loadPreferences() {
    const prefs = await db.userPreferences.get('tableSystem');
    return prefs ? prefs.value : {};
  },
  
  async savePreferences(prefs) {
    await db.userPreferences.put({
      key: 'tableSystem',
      value: prefs
    });
  }
};

// Initialize on app load
if (typeof App !== 'undefined') {
  App.addInitHook(async () => {
    await TableSystem.init();
  });
}