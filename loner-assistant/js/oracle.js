/**
 * LONER ASSISTANT v2.0 - Oracle & Dice Rolling
 * 
 * Handles all dice rolling and oracle consultation logic
 */

// Current session state
let currentTwistCounter = 0;

function loadTwistCounter() {
  const state = App.getState();
  if (state.sessionId) {
    LonerDB.getSession(state.sessionId).then(session => {
      if (session && session.twistCounter !== undefined) {
        currentTwistCounter = session.twistCounter;
        updateTwistCounter();
      }
    });
  }
}

/**
 * Roll a die (1-6)
 */
function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll the Oracle (Chance vs Risk dice)
 */
function rollOracle() {
  // Get modifier selection
  const modifier = document.querySelector('input[name="modifier"]:checked').value;
  
  let chanceDice, riskDice;
  
  // Roll based on modifier
  if (modifier === 'advantage') {
    // Roll 2 chance dice, keep highest
    const chance1 = rollD6();
    const chance2 = rollD6();
    chanceDice = Math.max(chance1, chance2);
    riskDice = rollD6();
  } else if (modifier === 'disadvantage') {
    // Roll 2 risk dice, keep highest
    chanceDice = rollD6();
    const risk1 = rollD6();
    const risk2 = rollD6();
    riskDice = Math.max(risk1, risk2);
  } else {
    // Normal roll
    chanceDice = rollD6();
    riskDice = rollD6();
  }
  
  // Interpret result
  const result = interpretOracleRoll(chanceDice, riskDice);
  
  // Display result
  displayOracleResult(result);
  
  // Check for doubles (twist counter)
  if (chanceDice === riskDice) {
    currentTwistCounter++;
    updateTwistCounter();
    
    // Trigger twist at 3
    if (currentTwistCounter >= 3) {
      triggerTwist();
    }
  }
  
  // Save to roll history if we have a session
  // TODO: Implement when sessions are active
  
  return result;
}

/**
 * Interpret oracle roll result
 */
function interpretOracleRoll(chance, risk) {
  let answer, modifier;
  
  // Determine base answer
  if (chance > risk) {
    answer = 'Yes';
  } else {
    answer = 'No';
  }
  
  // Determine modifier
  if (chance < 4 && risk < 4) {
    modifier = 'but';
  } else if (chance > 3 && risk > 3) {
    modifier = 'and';
  } else {
    modifier = null;
  }
  
  // Check for doubles
  const isDoubles = (chance === risk);
  
  return {
    answer,
    modifier,
    chanceDice: chance,
    riskDice: risk,
    isDoubles,
    formatted: formatOracleResult(answer, modifier, isDoubles)
  };
}

/**
 * Format oracle result as text
 */
function formatOracleResult(answer, modifier, isDoubles) {
  let text = answer;
  
  if (isDoubles) {
    text += ', but'; // Doubles always give "but" before twist
  } else if (modifier) {
    text += ', ' + modifier;
  }
  
  return text + '...';
}

/**
 * Display oracle result in UI
 */
function displayOracleResult(result) {
  const resultDiv = document.getElementById('oracle-result');
  
  const className = result.answer === 'Yes' ? 'yes' : 'no';
  
  resultDiv.className = `oracle-result ${className}`;
  resultDiv.innerHTML = `
    <div class="oracle-result-main">${result.formatted}</div>
    <div class="oracle-result-detail">
      Chance: ${result.chanceDice} | Risk: ${result.riskDice}
      ${result.isDoubles ? ' | <strong>DOUBLES!</strong>' : ''}
    </div>
  `;
  
  resultDiv.classList.remove('hidden');
}

/**
 * Update twist counter display
 */
function updateTwistCounter() {
  const counterDisplay = document.getElementById('twist-count');
  if (counterDisplay) {
    counterDisplay.textContent = currentTwistCounter;
    
    if (currentTwistCounter >= 2) {
      counterDisplay.classList.add('danger');
    } else {
      counterDisplay.classList.remove('danger');
    }
  }
  
  // SAVE to database
  const state = App.getState();
  if (state.sessionId) {
    LonerDB.updateTwistCounter(state.sessionId, currentTwistCounter);
  }
}

/**
 * Reset twist counter
 */
function resetTwistCounter() {
  currentTwistCounter = 0;
  updateTwistCounter();
  
  const twistResult = document.getElementById('twist-result');
  twistResult.classList.add('hidden');
  twistResult.innerHTML = '';
}

/**
 * Trigger a twist when counter reaches 3
 */
function triggerTwist() {
  // Roll 2d6 for twist
  const die1 = rollD6();
  const die2 = rollD6();
  
  const twistTable = {
    subjects: [
      'A third party',
      'The hero',
      'An encounter',
      'A physical event',
      'An emotional event',
      'An object'
    ],
    actions: [
      'Appears',
      'Alters the location',
      'Helps the hero',
      'Hinders the hero',
      'Changes the goal',
      'Ends the scene'
    ]
  };
  
  const subject = twistTable.subjects[die1 - 1];
  const action = twistTable.actions[die2 - 1];
  
  // Display twist
  const twistResult = document.getElementById('twist-result');
  twistResult.innerHTML = `
    <strong>🌀 TWIST!</strong><br>
    ${subject} + ${action}
    <div style="font-size: 0.85rem; margin-top: 0.5rem; opacity: 0.8;">
      Rolled: ${die1}, ${die2}
    </div>
  `;
  twistResult.classList.remove('hidden');
  
  // Reset counter
  currentTwistCounter = 0;
  updateTwistCounter();
  
  // Show alert
  UI.showAlert('Twist triggered! Check the twist panel.', 'success');
  
  // TODO: Log event and save to session
}

/**
 * Roll for scene type
 */
function rollScene() {
  const roll = rollD6();
  
  let sceneType, description;
  
  if (roll <= 3) {
    sceneType = 'Dramatic';
    description = 'Stakes increase, tension rises';
  } else if (roll <= 5) {
    sceneType = 'Quiet';
    description = 'Time for recovery, planning, or reflection';
  } else {
    sceneType = 'Meanwhile';
    description = 'Cut to another perspective or subplot';
  }
  
  const resultDiv = document.getElementById('scene-result');
  resultDiv.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 0.25rem;">
      ${sceneType} Scene
    </div>
    <div style="font-size: 0.85rem; color: var(--text-muted);">
      ${description}
    </div>
    <div style="font-size: 0.75rem; margin-top: 0.25rem; opacity: 0.6;">
      Rolled: ${roll}
    </div>
  `;
  
  // TODO: Save to session
}

/**
 * Get inspired - random prompt
 */
function getInspired() {
  // Action verbs table
  const verbs = [
    ['Cast', 'Battle', 'Free', 'Explore', 'Upgrade', 'Pilot'],
    ['Decipher', 'Seek', 'Infiltrate', 'Complete', 'Join', 'Uncover'],
    ['Find', 'Master', 'Tame', 'Harness', 'Win', 'Unravel'],
    ['Interrogate', 'Navigate', 'Survive', 'Influence', 'Overthrow', 'Endure'],
    ['Guess', 'Pursue', 'Resolve', 'Perform', 'Acquire', 'Embark'],
    ['Anticipate', 'Develop', 'Ally', 'Expand', 'Become', 'Slay']
  ];
  
  // Adjectives table
  const adjectives = [
    'Dangerous', 'Mysterious', 'Ancient', 'Forbidden', 'Hidden', 'Corrupt',
    'Sacred', 'Deadly', 'Forgotten', 'Cursed', 'Powerful', 'Secret',
    'Lost', 'Dark', 'Bright', 'Strange', 'Wild', 'Broken',
    'Noble', 'Vile', 'Pure', 'Twisted', 'Grand', 'Humble'
  ];
  
  // Nouns table
  const nouns = [
    'Artifact', 'Enemy', 'Ally', 'Location', 'Secret', 'Power',
    'Weapon', 'Knowledge', 'Truth', 'Treasure', 'Portal', 'Threat',
    'Mystery', 'Prophecy', 'Beast', 'Temple', 'City', 'Ruins',
    'Leader', 'Organization', 'Ritual', 'Document', 'Key', 'Path'
  ];
  
  // Roll for each
  const roll = rollD6() - 1;
  const verbList = verbs[roll];
  const verb = verbList[Math.floor(Math.random() * verbList.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  const resultDiv = document.getElementById('inspiration-result');
  resultDiv.innerHTML = `
    <div style="font-weight: 600; font-size: 1.1rem; margin-top: 0.5rem;">
      ${verb} + ${adjective} + ${noun}
    </div>
    <div style="font-size: 0.85rem; margin-top: 0.25rem; color: var(--text-muted);">
      "${verb} the ${adjective} ${noun}"
    </div>
  `;
  
  UI.showAlert('Inspiration generated!', 'success');
}

/**
 * Conflict system - roll for harm & luck
 */
let inConflict = false;
let characterLuck = 6;
let opponentLuck = 6;
let opponentName = 'Opponent';

function startConflict() {
  // Get values from form
  opponentName = document.getElementById('opponent-name').value || 'Opponent';
  opponentLuck = parseInt(document.getElementById('opponent-luck-input').value) || 6;
  
  // Get character luck from active character
  // TODO: Get from database when we have active character
  characterLuck = 6;
  
  inConflict = true;
  
  // Show active conflict UI, hide setup
  document.getElementById('conflict-setup').classList.add('hidden');
  document.getElementById('conflict-active').classList.remove('hidden');
  
  // Update labels
  document.getElementById('opponent-label').textContent = opponentName;
  
  updateLuckDisplay();
  
  UI.showAlert('Conflict started!', 'success');
}

function rollConflict() {
  if (!inConflict) {
    UI.showAlert('Start a conflict first!', 'error');
    return;
  }
  
  // Get modifier from conflict-specific selector
  const modifier = document.querySelector('input[name="conflict-modifier"]:checked').value;
  
  let chanceDice, riskDice;
  
  if (modifier === 'advantage') {
    const chance1 = rollD6();
    const chance2 = rollD6();
    chanceDice = Math.max(chance1, chance2);
    riskDice = rollD6();
  } else if (modifier === 'disadvantage') {
    chanceDice = rollD6();
    const risk1 = rollD6();
    const risk2 = rollD6();
    riskDice = Math.max(risk1, risk2);
  } else {
    chanceDice = rollD6();
    riskDice = rollD6();
  }
  
  // Interpret for damage
  const result = interpretOracleRoll(chanceDice, riskDice);
  let damage = 0;
  let targetIsCharacter = false;
  let description = '';
  
  if (result.answer === 'Yes') {
    // Character succeeds - damage opponent
    if (result.modifier === 'and') {
      damage = 3;
      description = 'Critical success!';
    } else if (result.modifier === 'but') {
      damage = 1;
      description = 'Success with complication';
    } else {
      damage = 2;
      description = 'Success';
    }
    opponentLuck -= damage;
  } else {
    // Character fails - take damage
    targetIsCharacter = true;
    if (result.modifier === 'and') {
      damage = 3;
      description = 'Critical failure!';
    } else if (result.modifier === 'but') {
      damage = 1;
      description = 'Failure with silver lining';
    } else {
      damage = 2;
      description = 'Failure';
    }
    characterLuck -= damage;
  }
  
  // Update display
  updateLuckDisplay();
  
  // Show result
  const resultDiv = document.getElementById('conflict-result');
  resultDiv.className = 'conflict-result ' + (targetIsCharacter ? 'damage-taken' : 'damage-dealt');
  resultDiv.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 0.25rem;">
      ${description}
    </div>
    <div style="font-size: 0.9rem;">
      ${targetIsCharacter ? 'You' : opponentName} ${targetIsCharacter ? 'take' : 'takes'} ${damage} damage
    </div>
    <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.25rem;">
      ${result.formatted} (Chance: ${chanceDice}, Risk: ${riskDice})
    </div>
  `;
  resultDiv.classList.remove('hidden');
  
  // Check for defeat
  if (characterLuck <= 0) {
    UI.showAlert('You have been defeated!', 'error');
    setTimeout(() => endConflict(), 2000);
  } else if (opponentLuck <= 0) {
    UI.showAlert(`${opponentName} defeated!`, 'success');
    setTimeout(() => endConflict(), 2000);
  }
}

function updateLuckDisplay() {
  const charLuckDiv = document.getElementById('char-luck');
  const oppLuckDiv = document.getElementById('opponent-luck');
  
  charLuckDiv.textContent = Math.max(0, characterLuck);
  oppLuckDiv.textContent = Math.max(0, opponentLuck);
  
  // Add low class if luck is low
  if (characterLuck <= 2) {
    charLuckDiv.classList.add('low');
  } else {
    charLuckDiv.classList.remove('low');
  }
  
  if (opponentLuck <= 2) {
    oppLuckDiv.classList.add('low');
  } else {
    oppLuckDiv.classList.remove('low');
  }
}

function endConflict() {
  inConflict = false;
  
  // Show setup, hide active
  document.getElementById('conflict-setup').classList.remove('hidden');
  document.getElementById('conflict-active').classList.add('hidden');
  
  // Clear result
  document.getElementById('conflict-result').classList.add('hidden');
  
  // Reset values
  characterLuck = 6;
  opponentLuck = 6;
  document.getElementById('opponent-name').value = 'Opponent';
  document.getElementById('opponent-luck-input').value = 6;
  
  UI.showAlert('Conflict ended', 'info');
  
  // TODO: Update character luck in database
}

// Make functions available globally
window.OracleSystem = {
  rollOracle,
  rollScene,
  getInspired,
  resetTwistCounter,
  startConflict,
  rollConflict,
  endConflict
};