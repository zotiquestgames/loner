# **Loner Assistant v2.0 - Path B Roadmap**

## **Step-by-Step Build Plan**

### **Phase 1: Foundation**
1. Set up project structure
2. Set up Dexie.js database
3. Create modern, clean UI layout (ditch old Bootstrap look)
4. Test that database works
6. Character sheet (proper, full-featured)
7. Oracle roller (with history)
8. Twist counter
9. Scene management
10. Conflict system (Harm & Luck)
11. Get Inspired / random tables

### **Phase 2: Extensions**
1. session management
2. Note editor with auto-insert

### **Phase 3: Content Management**

1. **NPC Manager**
2. **Location Manager**
3. **Narrative Threads**

#### **Event Log**
Automatic event tracking:
- Log important story moments
- Tag events (twist, conflict, revelation, etc.)
- Timeline view
- Export session recap

**Why this?** Keep a history of what happened and when.

### **Phase 4: Advanced**

#### **Roll Tables**
Implement the Adventure Maker and other tables from Loner:
- Settings, Tones, Things tables
- Opposition, Actions tables
- Custom user tables
- Quick roller with history
- Make this extensible, so we can update the tables in time, everytime I publish a new supplement

#### Make flavors for the Get Inspired function
Every Loner supplement has its custom version of the Get Inspired tables, we should offer them to the user to be selected which flavor they wants to use

**Why this?** Use all the amazing random generators from the Loner rulebook.

### **Phase 5: Polishing**

#### **Polish & UX Improvements**
- Add keyboard shortcuts
- Better mobile responsiveness
- Drag-and-drop reordering
- More visual feedback
- Tutorial/onboarding

**Why this?** Make the app feel more polished and professional.

## ** Project Structure**

```
loner-assistant-v2/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── database.js          ← All data storage
│   ├── ui.js                ← UI helpers
│   ├── oracle.js            ← Dice rolling
│   ├── campaigns.js         ← Campaign management
│   ├── sessions.js          ← Session management
│   ├── characters.js        ← Character sheets
│   ├── editor.js            ← Note editor
│   ├── tables.js            ← Roll tables
│   ├── npcs.js              ← NPCs management
│   ├── threads.js           ← Threads management
│   ├── locations.js          ← Locations management
│   └── main.js              ← Connects everything
├── data/
│   └── core-tables.js       ← Built-in Loner tables
└── lib/
    ├── dexie.min.js         ← Database library
    └── quill.min.js         ← Text editor
```



