/**
 * SAMPLE RANDOM TABLES
 * Example of supplemental adventure tables
 */

const SampleRandomTables = {
  supplement: {
    id: 'sample-random',
    name: 'Sample Random Tables',
    version: '1.0',
    enabled: true
  },
  
  tables: {
    randomEncounter: {
      id: 'random-encounter',
      name: 'Random Encounter',
      category: 'random-tables',  // ← Changed to generic category
      description: 'Generate a random encounter',
      rollType: '1d6',
      entries: [
        'Hostile bandits block the path',
        'Friendly merchant offers wares',
        'Wild animal stalks the party',
        'Mysterious stranger with a quest',
        'Natural hazard (storm, avalanche, etc)',
        'Discovery of an ancient ruin'
      ]
    },
    
    npcMotivation: {
      id: 'npc-motivation',
      name: 'NPC Motivation',
      category: 'random-tables',  // ← Changed
      description: 'What drives this NPC?',
      rollType: '1d6',
      entries: [
        'Seeking revenge for a past wrong',
        'Desperate for money or resources',
        'Protecting someone they love',
        'Following orders from a superior',
        'Pursuing knowledge or truth',
        'Fleeing from danger or pursuit'
      ]
    },
    
    locationFeature: {
      id: 'location-feature',
      name: 'Location Feature',
      category: 'random-tables',  // ← Changed
      description: 'Notable feature of this place',
      rollType: '1d6',
      entries: [
        'Ancient ruins of a lost civilization',
        'Bustling market filled with traders',
        'Guarded fortress with high walls',
        'Sacred temple or shrine',
        'Dense forest with hidden paths',
        'Dangerous wasteland or badlands'
      ]
    },
    
    complication: {
      id: 'complication',
      name: 'Complication',
      category: 'random-tables',  // ← Changed
      description: 'Something goes wrong...',
      rollType: '1d6',
      entries: [
        'Equipment breaks at a critical moment',
        'Reinforcements arrive for the enemy',
        'An ally betrays the group',
        'The environment becomes hostile',
        'Time is running out faster than expected',
        'A secret is revealed at the worst time'
      ]
    },
    
    treasure: {
      id: 'treasure',
      name: 'Treasure Find',
      category: 'random-tables',  // ← Changed
      description: 'What valuable is discovered?',
      rollType: '1d6',
      entries: [
        'Ancient artifact with mysterious powers',
        'Chest of gold coins and gems',
        'Rare weapon of exceptional quality',
        'Map to a hidden location',
        'Valuable information or documents',
        'Magical item with unique properties'
      ]
    },
    
    weatherCondition: {
      id: 'weather',
      name: 'Weather Condition',
      category: 'random-tables',  // ← Changed
      description: 'Current weather',
      rollType: '1d6',
      entries: [
        'Clear skies and pleasant weather',
        'Light rain or drizzle',
        'Heavy storm with strong winds',
        'Thick fog reducing visibility',
        'Extreme heat or cold',
        'Unusual supernatural weather'
      ]
    }
  }
};