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