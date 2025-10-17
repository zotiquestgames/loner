```css
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-section p {
  margin: 0;
  font-size: 1rem;
}

.result-section ul {
  margin: 0;
  padding-left: var(--space-md);
}

.roll-history-item {
  padding: var(--space-sm);
  border-bottom: 1px solid var(--border);
}

.roll-history-item:last-child {
  border-bottom: none;
}

.roll-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
  font-size: 0.85rem;
}

/* Flavor selector */
#inspired-flavor-select {
  width: 100%;
  padding: var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 0.9rem;
  cursor: pointer;
}

#inspired-flavor-select:focus {
  outline: none;
  border-color: var(--primary);
}
```

---

## 🔄 Update Existing Files

### Update `index.html`

Add script tags **after** existing JS files:

```html
<!-- Phase 4: Tables System -->
<script src="data/tables/core-loner.js"></script>
<script src="data/tables/core-inspired.js"></script>
<script src="data/table-registry.js"></script>
<script src="js/tables.js"></script>
<script src="js/table-manager.js"></script>
```

Update the Tools view section:

```html
<!-- TOOLS VIEW (Roll Tables, etc.) -->
<div id="view-tools" class="view">
    <div class="view-header">
        <h2>Tools & Tables</h2>
    </div>
    <div id="tools-grid" class="tools-grid">
        <!-- Content will be dynamically rendered by TableManager -->
    </div>
</div>
```

### Update Sidebar "Get Inspired" Button

Replace the existing `getInspired()` function call:

```html
<!-- Get Inspired -->
<div class="panel">
    <h3>Get Inspired</h3>
    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
        <button class="btn btn-secondary" onclick="TableManager.rollGetInspired()" style="flex: 1;">
            ✨ Random Prompt
        </button>
        <button class="btn btn-sm btn-outline" onclick="TableManager.showFlavorPicker()" title="Change flavor">
            ⚙️
        </button>
    </div>
    <div id="inspiration-result"></div>
</div>
```

### Update `database.js`

Add these helper functions at the end:

```javascript
/**
 * ==============================================
 * CUSTOM TABLES FUNCTIONS
 * ==============================================
 */

async function getCustomTables() {
  return await db.customTables.toArray();
}

async function createCustomTable(name, category, entries) {
  const id = await db.customTables.add({
    name: name,
    category: category,
    entries: entries,
    createdAt: new Date()
  });
  return id;
}

async function deleteCustomTable(id) {
  await db.customTables.delete(id);
}

/**
 * ==============================================
 * USER PREFERENCES FUNCTIONS
 * ==============================================
 */

async function getUserPreference(key) {
  const pref = await db.userPreferences.get(key);
  return pref ? pref.value : null;
}

async function setUserPreference(key, value) {
  await db.userPreferences.put({ key: key, value: value });
}

/**
 * ==============================================
 * TABLE ROLLS FUNCTIONS
 * ==============================================
 */

async function getTableRollHistory(sessionId, limit = 50) {
  return await db.tableRolls
    .where('sessionId')
    .equals(sessionId)
    .reverse()
    .limit(limit)
    .toArray();
}

// Export new functions
const LonerDB = {
  // ... existing exports ...
  
  // Custom tables
  getCustomTables,
  createCustomTable,
  deleteCustomTable,
  
  // User preferences
  getUserPreference,
  setUserPreference,
  
  // Table rolls
  getTableRollHistory
};
```

### Update `oracle.js`

Remove or comment out the old `getInspired()` function (lines ~180-225), as it's now handled by `TableManager.rollGetInspired()`.

---

## 📋 Complete Data Files

### `data/tables/core-loner.js`

```javascript
/**
 * LONER CORE TABLES
 * Adventure Maker tables from Loner 2nd Edition
 */

const CoreLonerTables = {
  supplement: {
    id: 'core-loner',
    name: 'Loner Core Rules',
    version: '2.0',
    enabled: true
  },
  
  tables: {
    settings: {
      id: 'settings',
      name: 'Settings',
      category: 'adventure-maker',
      description: 'Generate a world setting',
      rollType: '2d6',
      entries: [
        ['Post-Apocalyptic Wasteland', 'High Fantasy Kingdom', 'Medieval War and Intrigue', 'Cyberpunk Megacorporation', 'Futuristic Space Colony', 'Supernatural Noir City'],
        ['Alternate History', 'Pirate-Filled Seas', 'Wild West Frontier', 'Dark Fantasy Realm', 'Futuristic Dystopian City', 'Ancient Greek Mythology'],
        ['Space Opera Adventure', 'Samurai-Era Japan', 'Zombie Survival', 'Superhero Metropolis', 'Cold War Espionage', 'Modern Crime Syndicate'],
        ['Magic School for Young Mages', 'Horror-Filled Asylum', 'Epic Fantasy Quest', 'Cybernetic Organisms and Androids', 'Lovecraftian Cosmic Horrors', 'Sword and Sorcery Adventure'],
        ['Urban Fantasy Underworld', 'Abandoned Space Station', 'Colonial America', 'Mythical Creatures and Legends', 'Martial Arts Action', 'Horror-Stricken Carnival'],
        ['Underwater Adventure and Exploration', 'Jungle-Covered Planet', 'Steampunk Victorian Era', 'Time Travel Paradoxes', 'Intergalactic Starfighter Battles', 'Survival in a Savage Land']
      ]
    },
    
    tones: {
      id: 'tones',
      name: 'Tones',
      category: 'adventure-maker',
      description: 'Set the mood and atmosphere',
      rollType: '2d6',
      entries: [
        ['Dark and brooding', 'Melancholic and poetic', 'Lighthearted and humorous', 'Quirky and absurd', 'Gritty and realistic', 'Violent and brutal'],
        ['Epic and grandiose', 'Majestic and inspiring', 'Suspenseful and thrilling', 'Fast-paced and chaotic', 'Mysterious and enigmatic', 'Philosophical and introspective'],
        ['Action-packed and adventurous', 'Heroic and daring', 'Romantic and whimsical', 'Tragic and melancholic', 'Horror-filled and terrifying', 'Oppressive and claustrophobic'],
        ['Technologically advanced and sleek', 'Optimistic and utopian', 'Grungy and dirty', 'Bleak and hopeless', 'Gothic and ominous', 'Cosmic and unknowable'],
        ['Surreal and dreamlike', 'Psychedelic and hallucinatory', 'Futuristic and dystopian', 'Cynical and satirical', 'Nostalgic and timeless', 'Folkloric and mythical'],
        ['Eerie and paranormal', 'Unsettling and uncanny', 'Martial and disciplined', 'Cold and detached', 'Gracious and elegant', 'Ceremonial and ritualistic']
      ]
    },
    
    things: {
      id: 'things',
      name: 'Things',
      category: 'adventure-maker',
      description: 'Key elements that define the world',
      rollType: '2d6',
      entries: [
        ['Magic', 'Monsters', 'Ancient relics', 'Medieval castle', 'Futuristic technology', 'Spaceship'],
        ['Ancient ruins', 'Forbidden knowledge', 'Secret society', 'Dangerous quest', 'Band of adventurers', 'Unseen forces'],
        ['Hidden treasure', 'Dark magic', 'Mystical creatures', 'Supernatural powers', 'Epic battle', 'Intriguing plot'],
        ['Suspicious characters', 'War-torn land', 'Dangerous wilderness', 'Political intrigue', 'World domination', 'Suspenseful journey'],
        ['Dark secrets', 'Forbidden love', 'Intense conflict', 'Death-defying stunts', 'Powerful artifacts', 'Epic journeys'],
        ['Unpredictable twists', 'Dynamic characters', 'Different factions', 'Vast empires', 'Epic heroes', 'Legendary creatures']
      ]
    },
    
    opposition: {
      id: 'opposition',
      name: 'Opposition',
      category: 'adventure-maker',
      description: 'The main antagonist or challenge',
      rollType: '2d6',
      entries: [
        ['Powerful sorcerer', 'Corrupt politician', 'Ruthless warlord', 'Ancient evil', 'Rogue AI', 'Criminal syndicate'],
        ['Rival faction', 'Natural disaster', 'Alien invasion', 'Supernatural entity', 'Corporate empire', 'Religious cult'],
        ['Time paradox', 'Plague or disease', 'Rebel uprising', 'Dimensional threat', 'Mad scientist', 'Vengeful spirit'],
        ['Internal conflict', 'Resource scarcity', 'Betrayal from within', 'Cosmic horror', 'Military dictatorship', 'Ancient curse'],
        ['Rival hero', 'Mysterious organization', 'Environmental collapse', 'Technological singularity', 'Divine judgment', 'Criminal mastermind'],
        ['Self-doubt', 'Social oppression', 'Moral dilemma', 'Unstoppable force', 'Hidden conspiracy', 'Personal demons']
      ]
    },
    
    actions: {
      id: 'actions',
      name: 'Actions',
      category: 'adventure-maker',
      description: 'What needs to be done',
      rollType: '2d6',
      entries: [
        ['Destroy', 'Protect', 'Discover', 'Steal', 'Rescue', 'Escape'],
        ['Infiltrate', 'Negotiate', 'Betray', 'Unite', 'Conquer', 'Survive'],
        ['Investigate', 'Build', 'Repair', 'Sabotage', 'Transform', 'Purify'],
        ['Awaken', 'Seal', 'Summon', 'Banish', 'Control', 'Free'],
        ['Explore', 'Claim', 'Defend', 'Overthrow', 'Restore', 'Prevent'],
        ['Uncover', 'Hide', 'Retrieve', 'Deliver', 'Prove', 'Challenge']
      ]
    }
  }
};
```

### `data/tables/core-inspired.js`

```javascript
/**
 * CORE GET INSPIRED TABLES
 * Open-ended prompts for inspiration from Loner 2nd Edition
 */

const CoreInspiredTables = {
  supplement: {
    id: 'core-inspired',
    name: 'Core Get Inspired',
    version: '2.0',
    enabled: true,
    flavorOf: 'get-inspired'
  },
  
  tables: {
    verbs: {
      id: 'verbs',
      name: 'Action Verbs',
      category: 'get-inspired',
      description: 'Dynamic action words',
      rollType: 'subtable',
      entries: [
        ['Cast', 'Battle', 'Free', 'Explore', 'Upgrade', 'Pilot'],
        ['Decipher', 'Seek', 'Infiltrate', 'Complete', 'Join', 'Uncover'],
        ['Find', 'Master', 'Tame', 'Harness', 'Win', 'Unravel'],
        ['Interrogate', 'Navigate', 'Survive', 'Influence', 'Overthrow', 'Endure'],
        ['Guess', 'Pursue', 'Resolve', 'Perform', 'Acquire', 'Embark'],
        ['Anticipate', 'Develop', 'Ally', 'Expand', 'Become', 'Slay']
      ]
    },
    
    adjectives: {
      id: 'adjectives',
      name: 'Adjectives',
      category: 'get-inspired',
      description: 'Descriptive qualities',
      rollType: 'random',
      entries: [
        'Dangerous', 'Mysterious', 'Ancient', 'Forbidden', 'Hidden', 'Corrupt',
        'Sacred', 'Deadly', 'Forgotten', 'Cursed', 'Powerful', 'Secret',
        'Lost', 'Dark', 'Bright', 'Strange', 'Wild', 'Broken',
        'Noble', 'Vile', 'Pure', 'Twisted', 'Grand', 'Humble',
        'Ethereal', 'Sophisticated', 'Rightful', 'Knowledgeable', 'Astonishing', 'Ordinary',
        'Descriptive', 'Insidious', 'Poor', 'Proud', 'Reflective', 'Amusing'
      ]
    },
    
    nouns: {
      id: 'nouns',
      name: 'Nouns',
      category: 'get-inspired',
      description: 'Story elements and objects',
      rollType: 'random',
      entries: [
        'Artifact', 'Enemy', 'Ally', 'Location', 'Secret', 'Power',
        'Weapon', 'Knowledge', 'Truth', 'Treasure', 'Portal', 'Threat',
        'Mystery', 'Prophecy', 'Beast', 'Temple', 'City', 'Ruins',
        'Leader', 'Organization', 'Ritual', 'Document', 'Key', 'Path',
        'Cause', 'Stage', 'Change', 'Verse', 'Thrill', 'Spot',
        'Front', 'Event', 'Home', 'Bag', 'Measure', 'Birth'
      ]
    }
  }
};
```

---

## 🚀 Testing & Usage Guide

### Step 1: Basic Testing

1. **Open the app** and navigate to a session
2. **Click "Get Inspired"** in the sidebar → should generate a prompt using the current flavor
3. **Go to Tools view** → should see the table browser
4. **Click "Roll Adventure Maker"** → should generate a complete setting
5. **Check Notes editor** → rolls should auto-insert
6. **Check Events log** → rolls should be logged

### Step 2: Flavor Switching

1. Go to **Tools → Get Inspired Flavor selector**
2. Change the flavor (initially only Core will be available)
3. Roll Get Inspired again → should use the new flavor
4. Preference should persist across sessions

### Step 3: Roll History

1. Roll several tables
2. Check **Recent Rolls** panel in Tools view
3. Should show last 10 rolls with timestamps

---

## 🔮 Phase 4.5: Adding New Supplements

### Creating a New Supplement

When you publish a new Loner supplement (e.g., "Space Opera"), here's how to add it:

#### 1. Create the data file: `data/tables/supplements/space-opera.js`

```javascript
const SpaceOperaTables = {
  supplement: {
    id: 'space-opera',
    name: 'Space Opera Supplement',
    version: '1.0',
    enabled: true,
    flavorOf: 'get-inspired' // If it has Get Inspired tables
  },
  
  tables: {
    verbs: {
      id: 'verbs',
      name: 'Space Opera Verbs',
      category: 'get-inspired',
      rollType: 'subtable',
      entries: [
        ['Jump', 'Warp', 'Scan', 'Dock', 'Launch', 'Evade'],
        ['Transmit', 'Decrypt', 'Hack', 'Override', 'Stabilize', 'Repair'],
        // ... more rows
      ]
    },
    
    adjectives: {
      id: 'adjectives',
      name: 'Space Opera Adjectives',
      category: 'get-inspired',
      rollType: 'random',
      entries: [
        'Stellar', 'Quantum', 'Hyperdrive', 'Alien', 'Cosmic', 'Nebular',
        // ... more adjectives
      ]
    },
    
    nouns: {
      id: 'nouns',
      name: 'Space Opera Nouns',
      category: 'get-inspired',
      rollType: 'random',
      entries: [
        'Starship', 'Colony', 'Anomaly', 'Species', 'Federation', 'Sector',
        // ... more nouns
      ]
    },
    
    // You can add supplement-specific tables too
    spaceHazards: {
      id: 'space-hazards',
      name: 'Space Hazards',
      category: 'space-opera',
      rollType: '2d6',
      entries: [
        ['Asteroid field', 'Solar flare', 'Ion storm', 'Debris cloud', 'Gravity well', 'Radiation burst'],
        // ... more rows
      ]
    }
  }
};
```

#### 2. Register in `table-registry.js`

```javascript
const TableRegistry = {
  supplements: [
    // ... existing supplements ...
    
    {
      id: 'space-opera',
      name: 'Space Opera Supplement',
      file: 'data/tables/supplements/space-opera.js',
      version: '1.0',
      enabled: true,
      flavorOf: 'get-inspired'
    }
  ]
};
```

#### 3. Add script tag to `index.html`

```html
<script src="data/tables/supplements/space-opera.js"></script>
```

#### 4. Register in `tables.js` init

```javascript
async loadRegistry() {
  this.registerSupplement(CoreLonerTables);
  this.registerSupplement(CoreInspiredTables);
  this.registerSupplement(SpaceOperaTables); // Add this line
  
  // Load custom tables...
}
```

**That's it!** The new supplement will:
- ✅ Appear in the flavor selector
- ✅ Show up in the table browser
- ✅ Be available for rolling
- ✅ Work with all existing features (logging, notes insertion, etc.)

---

## 🎯 Future Enhancements (Phase 5+)

### Custom Table Builder

Add UI for users to create their own tables:

```javascript
// In table-manager.js
showCustomTableBuilder() {
  UI.showModal('Create Custom Table', `
    <form id="custom-table-form">
      <input type="text" name="name" placeholder="Table Name" required>
      <select name="rollType">
        <option value="1d6">1d6</option>
        <option value="2d6">2d6</option>
        <option value="random">Random</option>
      </select>
      <textarea name="entries" placeholder="Enter options (one per line)" rows="10"></textarea>
      <button type="submit" class="btn btn-primary">Create Table</button>
    </form>
  `);
}
```

### Table Import/Export

Allow users to share custom tables:

```javascript
async exportTable(tableId) {
  const table = await LonerDB.getCustomTable(tableId);
  const json = JSON.stringify(table, null, 2);
  
  // Download as file
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${table.name}.json`;
  a.click();
}

async importTable(file) {
  const text = await file.text();
  const table = JSON.parse(text);
  await LonerDB.createCustomTable(table.name, table.category, table.entries);
  UI.showAlert('Table imported successfully!', 'success');
}
```

### Weighted Random Tables

For more advanced tables:

```javascript
// In table definition
specialEncounter: {
  id: 'special-encounter',
  rollType: 'weighted',
  entries: [
    { value: 'Common enemy', weight: 50 },
    { value: 'Rare ally', weight: 30 },
    { value: 'Legendary artifact', weight: 10 },
    { value: 'Divine intervention', weight: 5 }
  ]
}
```

---

## 📊 Summary

### What Phase 4 Delivers

✅ **Complete Adventure Maker** with all 5 tables  
✅ **Extensible Get Inspired** with flavor system  
✅ **Universal table roller** supporting multiple formats  
✅ **Auto-logging** to Notes and Events  
✅ **Roll history** tracking  
✅ **Easy supplement addition** (just add JSON files)  
✅ **Future-proof architecture** for custom tables  

### File Changes Required

**New files:**
- `js/tables.js` (core table logic)
- `js/table-manager.js` (UI)
- `data/tables/core-loner.js` (Adventure Maker)
- `data/tables/core-inspired.js` (Get Inspired)
- `data/table-registry.js` (central registry)

**Modified files:**
- `index.html` (add scripts, update Tools view)
- `database.js` (add schema v3, new functions)
- `oracle.js` (remove old `getInspired()`)
- `style.css` (add table manager styles)

### Next Steps

1. **Implement core files** (`tables.js`, `table-manager.js`)
2. **Create data files** with complete tables
3. **Test thoroughly** with different roll types
4. **Add your first supplement** to test extensibility
5. **Gather user feedback** on UX

Would you like me to:
1. Create complete, ready-to-use versions of any of these files?
2. Design the custom table builder UI (Phase 5)?
3. Add keyboard shortcuts for quick table rolling?
4. Create a supplement template/guide for future releases?