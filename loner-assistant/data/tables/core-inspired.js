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