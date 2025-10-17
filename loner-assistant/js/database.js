/**
 * LONER ASSISTANT v2.0 - Database Setup
 * 
 * This file handles ALL data storage using Dexie.js (IndexedDB wrapper)
 * Think of it like localStorage, but WAY more powerful
 * 
 * Before using: Include Dexie in your HTML:
 * <script src="https://unpkg.com/dexie@3.2.4/dist/dexie.min.js"></script>
 */

// Create the database
const db = new Dexie('LonerAssistant');

// Define the structure (like creating tables in a database)
// IMPORTANT: If you change the schema, increment the version number!
db.version(2).stores({
  // Campaigns: each adventure/story
  campaigns: '++id, name, createdAt, lastPlayed, archived',
  
  // Sessions: individual play sessions within campaigns
  sessions: '++id, campaignId, name, date, notes',
  
  // Characters: player characters
  characters: '++id, name, campaignId, concept, luck, isActive',
  
  // NPCs: non-player characters
  npcs: '++id, campaignId, name, tags',
  
  // Locations: places in the story
  locations: '++id, campaignId, name, visited',
  
  // Events: important story events
  events: '++id, campaignId, sessionId, timestamp, type, description',
  
  // Narrative Threads: ongoing storylines
  threads: '++id, campaignId, title, status',
  
  // Roll Tables: custom and supplement tables
  rollTables: '++id, supplementId, name, category',
  
  // Supplements: table collections
  supplements: '++id, name, enabled',
  
  // Roll History: all oracle/dice rolls
  rollHistory: '++id, sessionId, timestamp, result'
});

// Keep old version for migration
db.version(1).stores({
  campaigns: '++id, name, createdAt, lastPlayed',
  sessions: '++id, campaignId, name, date, notes',
  characters: '++id, name, campaignId, concept, luck',
  npcs: '++id, campaignId, name, tags',
  locations: '++id, campaignId, name, visited',
  events: '++id, campaignId, sessionId, timestamp, type, description',
  threads: '++id, campaignId, title, status',
  rollTables: '++id, supplementId, name, category',
  supplements: '++id, name, enabled',
  rollHistory: '++id, sessionId, timestamp, result'
});

/**
 * ==============================================
 * CAMPAIGN FUNCTIONS
 * ==============================================
 */

// Create a new campaign
async function createCampaign(name, description = '') {
  const id = await db.campaigns.add({
    name: name,
    description: description,
    createdAt: new Date(),
    lastPlayed: new Date(),
    archived: false
  });
  return id;
}

// Get all campaigns (not archived)
async function getAllCampaigns() {
  // Get all campaigns first
  const allCampaigns = await db.campaigns.toArray();
  
  // Filter out archived ones (handles missing field gracefully)
  const activeCampaigns = allCampaigns.filter(c => c.archived !== true);
  
  // Sort by lastPlayed (most recent first)
  activeCampaigns.sort((a, b) => {
    const dateA = a.lastPlayed ? new Date(a.lastPlayed) : new Date(0);
    const dateB = b.lastPlayed ? new Date(b.lastPlayed) : new Date(0);
    return dateB - dateA;
  });
  
  return activeCampaigns;
}

// Get a single campaign by ID
async function getCampaign(id) {
  return await db.campaigns.get(id);
}

// Update campaign's last played date
async function updateCampaignLastPlayed(campaignId) {
  await db.campaigns.update(campaignId, {
    lastPlayed: new Date()
  });
}

// Delete a campaign (and all its data)
async function deleteCampaign(campaignId) {
  // Delete all related data
  await db.sessions.where('campaignId').equals(campaignId).delete();
  await db.characters.where('campaignId').equals(campaignId).delete();
  await db.npcs.where('campaignId').equals(campaignId).delete();
  await db.locations.where('campaignId').equals(campaignId).delete();
  await db.events.where('campaignId').equals(campaignId).delete();
  await db.threads.where('campaignId').equals(campaignId).delete();
  
  // Delete the campaign itself
  await db.campaigns.delete(campaignId);
}

/**
 * ==============================================
 * SESSION FUNCTIONS
 * ==============================================
 */

// Create a new session
async function createSession(campaignId, name) {
  const id = await db.sessions.add({
    campaignId: campaignId,
    name: name,
    date: new Date(),
    notes: '', // Will be rich text JSON from Quill
    sceneType: null,
    twistCounter: 0
  });
  
  // Update campaign's last played
  await updateCampaignLastPlayed(campaignId);
  
  return id;
}

// Get all sessions for a campaign
async function getSessionsForCampaign(campaignId) {
  try {
    return await this.db.sessions
      .where('campaignId')
      .equals(campaignId)
      .reverse()
      .toArray();
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

// Get a single session
async function getSession(id) {
  return await db.sessions.get(id);
}

// Update session notes (from Quill editor)
async function updateSessionNotes(sessionId, notesContent) {
  await db.sessions.update(sessionId, {
    notes: notesContent
  });
}

// Update twist counter
async function updateTwistCounter(sessionId, counter) {
  await db.sessions.update(sessionId, {
    twistCounter: counter
  });
}

/**
 * ==============================================
 * CHARACTER FUNCTIONS
 * ==============================================
 */

// Create a new character
async function createCharacter(data) {
  const id = await db.characters.add({
    name: data.name || 'New Character',
    campaignId: data.campaignId || null, // null = reusable character
    concept: data.concept || '',
    skills: data.skills || [], // Array of skill strings
    frailty: data.frailty || '',
    gear: data.gear || [], // Array of gear strings
    goalMotive: data.goalMotive || '',
    nemesis: data.nemesis || '',
    luck: data.luck || 6, // Starting luck
    maxLuck: 6,
    isActive: data.isActive || false, // Flag for currently playing character
    createdAt: new Date()
  });
  return id;
}

// Get all characters (optionally filter by campaign)
async function getCharacters(campaignId = null) {
  try {
    if (campaignId === null || campaignId === undefined) {
      // Get ALL characters across all campaigns
      return await this.db.characters.toArray();
    }
    return await this.db.characters
      .where('campaignId')
      .equals(campaignId)
      .toArray();
  } catch (error) {
    console.error('Error fetching characters:', error);
    return [];
  }
}

// Get a single character
async function getCharacter(id) {
  return await db.characters.get(id);
}

// Update character
async function updateCharacter(id, data) {
  await db.characters.update(id, data);
}

// Update character luck
async function updateCharacterLuck(id, newLuck) {
  await db.characters.update(id, { luck: newLuck });
}

// Delete character
async function deleteCharacter(id) {
  await db.characters.delete(id);
}

// Set a character as active (and unset all others)
async function setActiveCharacter(id) {
  // First, set all characters to inactive
  const allChars = await db.characters.toArray();
  for (const char of allChars) {
    await db.characters.update(char.id, { isActive: false });
  }
  
  // Then set the selected one as active
  await db.characters.update(id, { isActive: true });
}

/**
 * ==============================================
 * NPC FUNCTIONS
 * ==============================================
 */

async function createNPC(campaignId, name, description = '', tags = []) {
  const id = await db.npcs.add({
    campaignId: campaignId,
    name: name,
    description: description,
    tags: tags, // e.g., ['ally', 'merchant', 'suspicious']
    relationship: 'neutral', // 'ally', 'enemy', 'neutral'
    createdAt: new Date()
  });
  return id;
}

async function getNPCsForCampaign(campaignId) {
  try {
    return await this.db.npcs
      .where('campaignId')
      .equals(campaignId)
      .toArray();
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    return [];
  }
}

async function updateNPC(id, data) {
  await db.npcs.update(id, data);
}

async function deleteNPC(id) {
  await db.npcs.delete(id);
}

/**
 * ==============================================
 * LOCATION FUNCTIONS
 * ==============================================
 */

async function createLocation(campaignId, name, description = '') {
  const id = await db.locations.add({
    campaignId: campaignId,
    name: name,
    description: description,
    visited: false,
    createdAt: new Date()
  });
  return id;
}

async function getLocationsForCampaign(campaignId) {
  try {
    return await this.db.locations
      .where('campaignId')
      .equals(campaignId)
      .toArray();
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

async function markLocationVisited(id) {
  await db.locations.update(id, { visited: true });
}

async function updateLocation(id, data) {
  await db.locations.update(id, data);
}

async function deleteLocation(id) {
  await db.locations.delete(id);
}

/**
 * ==============================================
 * EVENT LOG FUNCTIONS
 * ==============================================
 */

async function logEvent(campaignId, sessionId, type, description) {
  const id = await db.events.add({
    campaignId: campaignId,
    sessionId: sessionId,
    timestamp: new Date(),
    type: type, // 'twist', 'conflict', 'revelation', etc.
    description: description
  });
  return id;
}

async function getEventsForSession(sessionId) {
  return await db.events
    .where('sessionId').equals(sessionId)
    .sortBy('timestamp');
}

async function getEventsForCampaign(campaignId) {
  return await db.events
    .where('campaignId').equals(campaignId)
    .reverse()
    .sortBy('timestamp');
}

/**
 * ==============================================
 * NARRATIVE THREAD FUNCTIONS
 * ==============================================
 */

async function createThread(campaignId, title, description = '') {
  const id = await db.threads.add({
    campaignId: campaignId,
    title: title,
    description: description,
    status: 'active', // 'active', 'resolved', 'abandoned'
    createdAt: new Date()
  });
  return id;
}

async function getThreadsForCampaign(campaignId, status = null) {
  try {
    if (status) {
      const threads = await this.db.threads
        .where('campaignId')
        .equals(campaignId)
        .toArray();
      return threads.filter(t => t.status === status);
    }
    return await this.db.threads
      .where('campaignId')
      .equals(campaignId)
      .toArray();
  } catch (error) {
    console.error('Error fetching threads:', error);
    return [];
  }
}

async function updateThreadStatus(id, status) {
  await db.threads.update(id, { status: status });
}

async function updateThread(id, data) {
  await db.threads.update(id, data);
}

async function deleteThread(id) {
  await db.threads.delete(id);
}

/**
 * ==============================================
 * UTILITY FUNCTIONS
 * ==============================================
 */

// Export all campaign data as JSON
async function exportCampaignData(campaignId) {
  const campaign = await getCampaign(campaignId);
  const sessions = await getSessionsForCampaign(campaignId);
  const characters = await db.characters.where('campaignId').equals(campaignId).toArray();
  const npcs = await getNPCsForCampaign(campaignId);
  const locations = await getLocationsForCampaign(campaignId);
  const events = await getEventsForCampaign(campaignId);
  const threads = await getThreadsForCampaign(campaignId);
  
  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    campaign: campaign,
    sessions: sessions,
    characters: characters,
    npcs: npcs,
    locations: locations,
    events: events,
    threads: threads
  };
}

/**
 * ==============================================
 * EVENT LOG FUNCTIONS
 * ==============================================
 */

async function logEvent(campaignId, sessionId, type, description, metadata = {}) {
  const id = await db.events.add({
    campaignId: campaignId,
    sessionId: sessionId,
    timestamp: new Date(),
    type: type, // 'oracle', 'twist', 'conflict', 'revelation', etc.
    description: description,
    metadata: metadata // Store extra data (roll results, NPCs involved, etc.)
  });
  return id;
}

async function getEventsForSession(sessionId) {
  return await db.events
    .where('sessionId').equals(sessionId)
    .sortBy('timestamp');
}

async function getEventsForCampaign(campaignId) {
  return await db.events
    .where('campaignId').equals(campaignId)
    .reverse()
    .sortBy('timestamp');
}

// Import campaign data from JSON
async function importCampaignData(jsonData) {
  // Create campaign
  const campaignId = await createCampaign(
    jsonData.campaign.name,
    jsonData.campaign.description
  );
  
  // Import everything else, updating IDs
  for (const session of jsonData.sessions) {
    await db.sessions.add({ ...session, campaignId: campaignId });
  }
  
  for (const character of jsonData.characters) {
    await db.characters.add({ ...character, campaignId: campaignId });
  }
  
  for (const npc of jsonData.npcs) {
    await db.npcs.add({ ...npc, campaignId: campaignId });
  }
  
  for (const location of jsonData.locations) {
    await db.locations.add({ ...location, campaignId: campaignId });
  }
  
  for (const event of jsonData.events) {
    await db.events.add({ ...event, campaignId: campaignId });
  }
  
  for (const thread of jsonData.threads) {
    await db.threads.add({ ...thread, campaignId: campaignId });
  }
  
  return campaignId;
}

// Initialize with sample data (for first-time users)
async function initializeSampleData() {
  try {
    const count = await db.campaigns.count();
    if (count > 0) {
      console.log('Existing data found, skipping sample data');
      return; // Already has data
    }
    
    console.log('No existing data, creating sample campaign...');
    
    // Create a sample campaign
    const campaignId = await createCampaign(
      'Sample Campaign',
      'A mysterious adventure in a cyberpunk city'
    );
    
    // Create a sample character
    await createCharacter({
      campaignId: campaignId,
      name: 'Zahra Kane',
      concept: 'Street-smart hacker',
      skills: ['Hacking', 'Stealth'],
      frailty: 'Haunted by past',
      gear: ['Cyberdeck', 'Lockpicks'],
      goalMotive: 'Clear her name',
      nemesis: 'The Syndicate'
    });
    
    // Create a sample session
    await createSession(campaignId, 'The Heist Begins');
    
    console.log('✅ Sample data initialized!');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    // Don't throw - let the app continue even if sample data fails
  }
}

// Check database on load
db.on('ready', async function() {
  console.log('📊 Database ready!');
  try {
    await initializeSampleData();
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
});

// Make everything available globally (so other .js files can use them)
window.LonerDB = {
  // Database instance
  db: db,
  
  // Campaign functions
  createCampaign,
  getAllCampaigns,
  getCampaign,
  deleteCampaign,
  updateCampaignLastPlayed,
  
  // Session functions
  createSession,
  getSessionsForCampaign,
  getSession,
  updateSessionNotes,
  updateTwistCounter,
  
  // Character functions
  createCharacter,
  getCharacters,
  getCharacter,
  updateCharacter,
  updateCharacterLuck,
  deleteCharacter,
  setActiveCharacter,
  
  // NPC functions
  createNPC,
  getNPCsForCampaign,
  updateNPC,
  deleteNPC,
  
  // Location functions
  createLocation,
  getLocationsForCampaign,
  markLocationVisited,
  updateLocation,
  deleteLocation,
  
  // Event functions
  logEvent,
  getEventsForSession,
  getEventsForCampaign,
  
  // Thread functions
  createThread,
  getThreadsForCampaign,
  updateThreadStatus,
  updateThread,
  deleteThread,
  
  // Utility functions
  exportCampaignData,
  importCampaignData
};