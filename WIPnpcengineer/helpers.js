// helpers.js

// Assign helper functions to the window.app object if it exists
if (!window.app) window.app = {};

Object.assign(window.app, {
   // --- Calculation Functions ---
   calculateAbilityBonus,
   calculateProficiencyBonus,
   calculateSpellcastingDCBonus,
   calculateSpeedString,
   calculateSensesString,
   calculateDamageModifiersString,
   calculateConditionImmunitiesString,
   calculateLanguagesString,
   calculateAllStats,
   calculateAllSkills,

   // --- Action/Modal/Editor Helpers ---
   addOrUpdateAction,
   editAction,
   clearInputs,
   openModal,
   closeModal,
   showAlert,
   showConfirm,
   showDialog, // Keep internal helper accessible if needed elsewhere
   handleAttackHelperOpen,
   openBlankAttackHelper,
   parseAttackString,
   populateAttackHelper,
   editBoilerplate,
   saveBoilerplate,
   addDamageRow,
   generateAttackString,
   createDiceSelector,
   updateDiceString,
   updateBonus,
   openClipboardModal, // MODIFIED
   processAndPasteFromClipboardModal, // NEW (replaces pasteFromClipboardModal)

   // --- Token Processing ---
   processTraitString
});


// --- FUNCTION DEFINITIONS ---

function processTraitString(text, npc) {
   if (!text || !npc) return text;

   const name = npc.name || "creature";
   const gender = npc.gender || "creature";
   const isUnique = npc.isUnique || false;
   const isProperName = npc.isProperName || false;
   const pronouns = window.app.pronounSets[gender] || window.app.pronounSets.creature; // Access via window.app

   const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

   return text.replace(/{([a-zA-Z_]+)}/g, (match, token) => {
      const lowerToken = token.toLowerCase();
      const isCapitalizedToken = token.charAt(0) === token.charAt(0).toUpperCase();

      switch (lowerToken) {
         case 'name':
            let outputName;
            if (isProperName) {
               outputName = capitalize(name.split(' ')[0] || name);
            } else if (isUnique) {
               outputName = capitalize(name);
            } else {
               outputName = `the ${name.toLowerCase()}`;
            }
            return isCapitalizedToken ? capitalize(outputName) : outputName;
         case 'he': return isCapitalizedToken ? capitalize(pronouns[0]) : pronouns[0];
         case 'him': return isCapitalizedToken ? capitalize(pronouns[1]) : pronouns[1];
         case 'his': return isCapitalizedToken ? capitalize(pronouns[2]) : pronouns[2];
         case 'himself': return isCapitalizedToken ? capitalize(pronouns[3]) : pronouns[3];
         default: return match;
      }
   });
}

function calculateAbilityBonus(score) {
   const numScore = parseInt(score, 10);
   return isNaN(numScore) ? 0 : Math.floor((numScore - 10) / 2);
}

function calculateProficiencyBonus(cr) {
   // Handle fractional CRs by converting to numeric value approx
   let crValue;
   if (cr === '1/8') crValue = 0.125;
   else if (cr === '1/4') crValue = 0.25;
   else if (cr === '1/2') crValue = 0.5;
   else crValue = parseInt(cr, 10);

   if (isNaN(crValue) || crValue < 0) crValue = 0; // Default to CR 0 if invalid

   if (crValue <= 4) return 2;
   if (crValue <= 8) return 3;
   if (crValue <= 12) return 4;
   if (crValue <= 16) return 5;
   if (crValue <= 20) return 6;
   if (crValue <= 24) return 7;
   if (crValue <= 28) return 8;
   return 9; // CR 29+
}

function calculateSpellcastingDCBonus(abilityKey, profBonus, npc) {
   if (!npc || !abilityKey) {
      console.warn("Missing data for calculateSpellcastingDCBonus:", { abilityKey, profBonus, npc });
      const tempBonus = calculateAbilityBonus(npc?.[abilityKey] || 10); // Calculate bonus even if key missing from NPC obj
      const safeProfBonus = profBonus || 2;
      return { dc: 8 + safeProfBonus + tempBonus, bonus: safeProfBonus + tempBonus };
   }
   // Ensure bonus property exists before accessing, fallback to calculating it
   const abilityBonus = npc[`${abilityKey}Bonus`] ?? calculateAbilityBonus(npc[abilityKey] || 10);
   const safeProfBonus = profBonus || 2; // Ensure profBonus is a number

   const dc = 8 + safeProfBonus + abilityBonus;
   const bonus = safeProfBonus + abilityBonus;
   return { dc, bonus }; // Return both DC and bonus
}


function calculateSpeedString(npc) {
   let parts = [];
   if (npc.speedBase > 0) parts.push(`${npc.speedBase} ft.`);
   if (npc.speedBurrow > 0) parts.push(`burrow ${npc.speedBurrow} ft.`);
   if (npc.speedClimb > 0) parts.push(`climb ${npc.speedClimb} ft.`);
   if (npc.speedFly > 0) parts.push(`fly ${npc.speedFly} ft.${npc.flyHover ? ' (hover)' : ''}`);
   if (npc.speedSwim > 0) parts.push(`swim ${npc.speedSwim} ft.`);
   return parts.join(', ') || '0 ft.';
}

function calculateSensesString(npc) {
   let parts = [];
   if (npc.senseBlindsight > 0) parts.push(`blindsight ${npc.senseBlindsight} ft.${npc.blindBeyond ? ' (blind beyond this radius)' : ''}`);
   if (npc.senseDarkvision > 0) parts.push(`darkvision ${npc.senseDarkvision} ft.`);
   if (npc.senseTremorsense > 0) parts.push(`tremorsense ${npc.senseTremorsense} ft.`);
   if (npc.senseTruesight > 0) parts.push(`truesight ${npc.senseTruesight} ft.`);
   parts.push(`passive Perception ${npc.passivePerception || 10}`); // Always include passive perception
   return parts.join(', ');
}

function calculateDamageModifiersString(npc) {
   const vulnerabilities = window.app.damageTypes.filter(type => npc[`vulnerability_${type}`]);
   const resistances = window.app.damageTypes.filter(type => npc[`resistance_${type}`]);
   const immunities = window.app.damageTypes.filter(type => npc[`immunity_${type}`]);

   const weaponResMap = {
      nonmagical: "bludgeoning, piercing, and slashing from nonmagical attacks",
      silvered: "bludgeoning, piercing, and slashing from nonmagical attacks that aren't silvered",
      adamantine: "bludgeoning, piercing, and slashing from nonmagical attacks that aren't adamantine",
      'cold-forged': "bludgeoning, piercing, and slashing from nonmagical attacks that aren't cold-forged iron",
      magical: "bludgeoning, piercing, and slashing from magical attacks" // Added magical
   };
   const weaponImmMap = {
      nonmagical: "bludgeoning, piercing, and slashing from nonmagical attacks",
      silvered: "bludgeoning, piercing, and slashing from nonmagical attacks that aren't silvered",
      adamantine: "bludgeoning, piercing, and slashing from nonmagical attacks that aren't adamantine",
      'cold-forged': "bludgeoning, piercing, and slashing from nonmagical attacks that aren't cold-forged iron"
   };

   if (npc.weaponResistance && npc.weaponResistance !== 'none' && weaponResMap[npc.weaponResistance]) {
      resistances.push(weaponResMap[npc.weaponResistance]);
   }
   if (npc.weaponImmunity && npc.weaponImmunity !== 'none' && weaponImmMap[npc.weaponImmunity]) {
      immunities.push(weaponImmMap[npc.weaponImmunity]);
   }

   return {
      vulnerabilities: vulnerabilities.join(', '),
      resistances: resistances.join(', '),
      immunities: immunities.join(', ')
   };
}

function calculateConditionImmunitiesString(npc) {
   return window.app.conditions.filter(condition => npc[`ci_${condition}`]).join(', ');
}

function calculateLanguagesString(npc) {
   if (!npc) return '—';

   // Get the list of selected languages, sorted
   const selected = Array.isArray(npc.selectedLanguages) ? [...npc.selectedLanguages].sort((a,b) => a.localeCompare(b)) : [];
   const selectedStr = selected.length > 0 ? selected.join(', ') : "—";

   const specialMap = {
      1: "understands all languages but speaks none",
      2: "all languages",
      3: "the languages it knew in life",
      // Dynamic options: Insert the selected languages string
      4: `understands ${selectedStr} but can't speak`,
      5: `understands ${selectedStr} but can't speak`, // (Adjust if needed for creator's languages)
      6: `understands ${selectedStr} but can't speak`
   };

   const specialText = specialMap[npc.specialLanguageOption] || null;
   const telepathy = npc.hasTelepathy ? `telepathy ${npc.telepathyRange || 60} ft.` : null;

   let mainPart = '—';
   if (specialText) {
      mainPart = specialText;
   } else if (selected.length > 0) {
      mainPart = selectedStr;
   }

   // Combine main part and telepathy
   if (telepathy) {
      // If there's a main part (even if it's just "—"), append telepathy
      if (mainPart === '—') return telepathy;
      return `${mainPart}, ${telepathy}`;
   } else {
      return mainPart;
   }
}


function calculateAllStats() {
   // Use 'this.activeNPC' when called via .call() from importer, otherwise use window.app.activeNPC
   const npc = this?.activeNPC || window.app?.activeNPC;
   if (!npc) return;

   const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
   const abilityAbbr = { strength: 'Str', dexterity: 'Dex', constitution: 'Con', intelligence: 'Int', wisdom: 'Wis', charisma: 'Cha' };

   // 1. Calculate Ability Bonuses first
   abilities.forEach(ability => {
      const score = npc[ability] || 10;
      npc[`${ability}Bonus`] = calculateAbilityBonus(score);
   });

   // 2. Get Proficiency Bonus (already calculated in updateActiveNPCFromForm)
   const profBonus = npc.proficiencyBonus || 2;

   // 3. Calculate Saving Throws
   const savesArray = [];
   abilities.forEach(ability => {
      const base = npc[`${ability}Bonus`] || 0;
      const isProficient = npc[`${ability}SavingThrowProf`] || false;
      const adjust = npc[`${ability}SavingThrowAdjust`] || 0;
      const total = base + (isProficient ? profBonus : 0) + adjust;
      // Only add save to the string if proficient or adjusted, AND total is not 0
      if ((isProficient || adjust !== 0) && total !== 0) {
         savesArray.push(`${abilityAbbr[ability]} ${total >= 0 ? '+' : ''}${total}`);
      }
   });
   npc.saves = savesArray.join(', ');


   // 4. Calculate Skills (depends on ability bonuses and prof bonus)
   calculateAllSkills.call({ activeNPC: npc }); // Ensure 'this' context is passed

   // 5. Calculate Passive Perception (depends on Wisdom bonus and Perception skill)
   const perceptionProf = npc.skill_perception_prof || false;
   const perceptionExp = npc.skill_perception_exp || false;
   const perceptionAdjust = npc.skill_perception_adjust || 0;
   const perceptionBonus = (npc.wisdomBonus || 0) +
      (perceptionProf ? profBonus : 0) +
      (perceptionExp ? profBonus : 0) + // Expertise adds prof bonus again
      perceptionAdjust;
   npc.passivePerception = 10 + perceptionBonus;

   // 6. Calculate Speed String
   npc.speed = calculateSpeedString(npc);
}


function calculateAllSkills() {
   // Use 'this.activeNPC' when called via .call() from importer, otherwise use window.app.activeNPC
   const npc = this?.activeNPC || window.app?.activeNPC;
   if (!npc) return;

   const profBonus = npc.proficiencyBonus || 2;
   const skillsArray = [];

   window.app.skills.forEach(skill => { // Access via window.app for skill definitions
      const baseAbilityBonus = npc[`${skill.attribute}Bonus`] || 0;
      const isProf = npc[`skill_${skill.id}_prof`] || false;
      const isExp = npc[`skill_${skill.id}_exp`] || false;
      const adjust = npc[`skill_${skill.id}_adjust`] || 0;

      // Calculate total skill bonus
      const total = baseAbilityBonus +
         (isProf ? profBonus : 0) +
         (isExp ? profBonus : 0) + // Expertise adds proficiency bonus again
         adjust;

      // Add skill to the string only if proficient, expert, or manually adjusted.
      // Removed the '&& total !== 0' check so +0 skills display if proficient.
      if (isProf || isExp || adjust !== 0) {
          skillsArray.push(`${skill.name} ${total >= 0 ? '+' : ''}${total}`);
      }
   });
   // Sort skills alphabetically for consistent display
   skillsArray.sort();
   npc.npcSkills = skillsArray.join(', ');
}


// --- Action Functions ---
function addOrUpdateAction(type) {
   if (!window.app.activeNPC || !window.ui.inputs.commonName || !window.ui.inputs.commonDesc) return;

   const name = window.ui.inputs.commonName.value.trim();
   const desc = window.ui.inputs.commonDesc.value.trim(); // Get value from textarea

   if (!name) {
      showAlert("Action name cannot be empty.");
      return;
   }
   if (!desc) {
      showAlert("Action description cannot be empty.");
      return;
   }

   const actionData = { name, desc };

   // Ensure the actions object and specific type array exist
   if (!window.app.activeNPC.actions) window.app.activeNPC.actions = { actions: [], 'bonus-actions': [], reactions: [], 'legendary-actions': [], 'lair-actions': [] };
   if (!Array.isArray(window.app.activeNPC.actions[type])) window.app.activeNPC.actions[type] = [];

   // Use the globally tracked currentlyEditingAction
   if (window.app.currentlyEditingAction !== null) {
      // Update existing action
      const { originalType, originalIndex } = window.app.currentlyEditingAction;
      if (originalType === type) {
         // If type hasn't changed, update in place
         if (originalIndex >= 0 && originalIndex < window.app.activeNPC.actions[type].length) {
            window.app.activeNPC.actions[type][originalIndex] = actionData;
         } else {
            console.error("Error updating action: Invalid original index.");
            showAlert("Error updating action.");
            clearInputs(); // Reset edit state
            return;
         }
      } else {
         // If type changed, remove from old list and add to new list
         if (originalIndex >= 0 && originalIndex < window.app.activeNPC.actions[originalType].length) {
            window.app.activeNPC.actions[originalType].splice(originalIndex, 1);
            window.app.activeNPC.actions[type].push(actionData);
         } else {
            console.error("Error moving action: Invalid original index.");
            showAlert("Error moving action.");
            clearInputs(); // Reset edit state
            return;
         }
      }
   } else {
      // Add new action
      window.app.activeNPC.actions[type].push(actionData);
   }

   clearInputs(); // Clear form and reset editing state
   window.ui.renderActions(); // Re-render action lists
   window.viewport.updateViewport(); // Update preview
   window.app.saveActiveBestiaryToDB(); // Save changes
}


function editAction(element) {
   if (!window.app.activeNPC || !element) return;

   const type = element.dataset.actionType;
   const originalIndex = parseInt(element.dataset.actionIndex, 10); // Get original index

   if (type && !isNaN(originalIndex) && window.app.activeNPC.actions && window.app.activeNPC.actions[type]?.[originalIndex]) {
      // Remove 'editing' class from previously edited item
      document.querySelectorAll('.action-list-item.editing').forEach(el => el.classList.remove('editing', 'border-yellow-400'));

      const actionData = window.app.activeNPC.actions[type][originalIndex];
      window.ui.inputs.commonName.value = actionData.name || '';
      window.ui.inputs.commonDesc.value = actionData.desc || ''; // Use textarea

      window.app.currentlyEditingAction = { originalType: type, originalIndex: originalIndex }; // Store original info globally

      // Add visual indicator to the item being edited
      element.classList.add('editing', 'border-yellow-400');
      if (window.ui.clearEditBtn) window.ui.clearEditBtn.classList.remove('hidden'); // Show cancel button
      window.ui.inputs.commonName.focus(); // Focus name field
   } else {
      console.error("Could not find action data for editing:", {type, originalIndex});
   }
}


function clearInputs() {
   if (window.ui.inputs.commonName) window.ui.inputs.commonName.value = '';
   if (window.ui.inputs.commonDesc) window.ui.inputs.commonDesc.value = ''; // Use textarea
   if (window.ui.clearEditBtn) window.ui.clearEditBtn.classList.add('hidden'); // Hide cancel button
   window.app.currentlyEditingAction = null; // Reset global editing state
   // Remove 'editing' class from list items
   document.querySelectorAll('.action-list-item.editing').forEach(el => el.classList.remove('editing', 'border-yellow-400'));
}

function editBoilerplate(element) {
   if (!window.ui.boilerplateModal || !window.app.activeNPC) return;
   const editor = document.getElementById('boilerplate-editor');
   if (!editor) return;

   window.app.boilerplateTarget = element; // Store which element was clicked globally
   if (element.id === 'legendary-boilerplate') {
      editor.value = window.app.activeNPC.legendaryBoilerplate || window.app.defaultNPC.legendaryBoilerplate;
   } else if (element.id === 'lair-boilerplate') {
      editor.value = window.app.activeNPC.lairBoilerplate || window.app.defaultNPC.lairBoilerplate;
   }
   openModal('boilerplate-modal');
   editor.focus();
   editor.select();
}


function saveBoilerplate() {
   if (!window.app.boilerplateTarget || !window.app.activeNPC) return;
   const editor = document.getElementById('boilerplate-editor');
   if (!editor) return;

   const newText = editor.value;

   if (window.app.boilerplateTarget.id === 'legendary-boilerplate') {
      window.app.activeNPC.legendaryBoilerplate = newText;
   } else if (window.app.boilerplateTarget.id === 'lair-boilerplate') {
      window.app.activeNPC.lairBoilerplate = newText;
   }

   window.app.boilerplateTarget.textContent = newText; // Update display immediately
   window.app.boilerplateTarget = null; // Clear global target
   closeModal('boilerplate-modal');
   window.viewport.updateViewport(); // Update main preview
   window.app.saveActiveBestiaryToDB(); // Save changes
}


// --- Attack Helper Logic ---
function handleAttackHelperOpen() {
   if (!window.app.activeNPC) return;

   const currentDesc = window.ui.inputs.commonDesc.value || '';
   const parsedData = parseAttackString(currentDesc); // Attempt to parse current description

   if (parsedData) {
      populateAttackHelper(parsedData); // Populate helper with parsed data
   } else {
      openBlankAttackHelper(); // Open with defaults if parsing fails
   }
   openModal('attack-helper-modal');
}


function openBlankAttackHelper() {
   // Reset fields to default or derive from NPC stats
   const attackTypeSelect = document.getElementById('attack-type');
   const bonusInput = document.getElementById('attack-bonus');
   const reachInput = document.getElementById('attack-reach');
   const targetSelect = document.getElementById('attack-target');
   const damageDiceInput = document.getElementById('attack-damage-dice');
   const damageTypeSelect = document.getElementById('attack-damage-type');

   if (attackTypeSelect) attackTypeSelect.value = 'Melee Weapon Attack';
   if (reachInput) reachInput.value = '5';
   if (targetSelect) targetSelect.value = 'one target';
   if (damageDiceInput) damageDiceInput.value = ''; // Start blank
   if (damageTypeSelect) damageTypeSelect.value = 'slashing'; // Default damage type

   // Calculate default bonus based on Str/Dex
   let defaultBonus = 0;
   if (window.app.activeNPC) {
      const strBonus = window.app.activeNPC.strengthBonus || 0;
      const dexBonus = window.app.activeNPC.dexterityBonus || 0;
      const profBonus = window.app.activeNPC.proficiencyBonus || 2;
      // Default to Strength for Melee, Dex otherwise (can be changed by user)
      defaultBonus = (strBonus > dexBonus ? strBonus : dexBonus) + profBonus;
   }
   if (bonusInput) bonusInput.value = defaultBonus;

   // Clear any extra damage rows
   const container = document.getElementById('all-damage-rows-container');
   if (container) {
      // Make sure the primary row exists before clearing extras
      if (!document.getElementById('damage-row-primary')) {
          addDamageRow('', 'slashing', true); // Add primary if missing
      }
      const extraRows = container.querySelectorAll('.damage-row-extra');
      extraRows.forEach(row => row.remove());
      // Clear primary row inputs specifically
      const primaryDiceInput = document.getElementById('attack-damage-dice-primary');
      const primaryTypeSelect = document.getElementById('attack-damage-type-primary');
      if (primaryDiceInput) primaryDiceInput.value = '';
      if (primaryTypeSelect) primaryTypeSelect.value = 'slashing';
   }

   // Reset dice selectors for the primary row
   const primaryDiceInput = document.getElementById('attack-damage-dice-primary'); // Use specific ID
   if (primaryDiceInput) {
      const primaryDiceSelector = document.getElementById('dice-selector-primary'); // Use specific ID
      if (primaryDiceSelector) createDiceSelector(primaryDiceSelector, primaryDiceInput);
   }
}


function parseAttackString(str) {
   if (!str) return null;

   const mainPattern = /^(Melee|Ranged)\s(Weapon|Spell)\sAttack:\s*([+-]\d+)\s*to hit,\s*reach\s*(\d+)\s*ft\.? or range\s*(\d+\/\d+|\d+)\s*ft\.?,\s*(one target|one creature|self|one willing creature|all creatures in range)\.\s*Hit:\s*(.*)$/i;
   const reachOnlyPattern = /^(Melee|Ranged)\s(Weapon|Spell)\sAttack:\s*([+-]\d+)\s*to hit,\s*reach\s*(\d+)\s*ft\.?,\s*(one target|one creature|self|one willing creature|all creatures in range)\.\s*Hit:\s*(.*)$/i;
   const rangeOnlyPattern = /^(Melee|Ranged)\s(Weapon|Spell)\sAttack:\s*([+-]\d+)\s*to hit,\s*range\s*(\d+\/\d+|\d+)\s*ft\.?,\s*(one target|one creature|self|one willing creature|all creatures in range)\.\s*Hit:\s*(.*)$/i;

   let match = str.match(mainPattern);
   let reach = null;
   let range = null;
   let damageString = '';

   if (match) {
      reach = match[4];
      range = match[5];
      damageString = match[7];
   } else {
      match = str.match(reachOnlyPattern);
      if (match) {
         reach = match[4];
         damageString = match[6];
      } else {
         match = str.match(rangeOnlyPattern);
         if (match) {
            range = match[4];
            damageString = match[6];
         } else {
            return null; // Doesn't match any primary pattern
         }
      }
   }

   const data = {
      attackType: `${match[1]} ${match[2]} Attack`,
      bonus: parseInt(match[3], 10),
      reach: reach || (range ? '' : '5'), // Default reach 5 if no range
      range: range || '',
      target: match[match.length - 2], // Target is second to last group in all patterns
      damages: []
   };

   // Parse damage string
   // Example: "10 (2d6 + 3) bludgeoning damage plus 7 (2d6) poison damage. If the target..."
   // Or: "7 (2d6) poison damage."
   const damageParts = damageString.split(/ plus | and (?=\d+\s*\()/); // Split by " plus " or " and " followed by dice avg
   const dicePattern = /(\d+)\s*\((.*?)\)\s*(\w+)\s*damage/;
   const flatDamagePattern = /(\d+)\s*(\w+)\s*damage/; // For cases like "5 poison damage"

   damageParts.forEach((part, index) => {
      part = part.trim();
      let diceMatch = part.match(dicePattern);
      let dice = '';
      let type = '';

      if (diceMatch) {
         dice = diceMatch[2].trim();
         type = diceMatch[3].toLowerCase();
      } else {
         let flatMatch = part.match(flatDamagePattern);
         if (flatMatch) {
            dice = flatMatch[1].trim(); // Store flat damage in the 'dice' field for simplicity
            type = flatMatch[2].toLowerCase();
         } else {
            // Could be descriptive text after the last damage type
            // Or maybe it's just a complex single damage type. Try to grab the last word?
            const words = part.split(' ');
            let potentialType = words.length > 1 ? words[words.length - 2] : null; // Check second to last word too
            let lastWord = words[words.length - 1];
            let foundType = null;

            if (lastWord.toLowerCase() === 'damage' && potentialType && window.app.damageTypes.includes(potentialType.toLowerCase())) {
                foundType = potentialType.toLowerCase();
                part = part.replace(/ damage.*$/i, '').trim(); // Remove ' damage' and anything after
            } else if (window.app.damageTypes.includes(lastWord.toLowerCase())) {
                foundType = lastWord.toLowerCase();
                part = part.replace(new RegExp(`\\s*${lastWord}.*$`, 'i'), '').trim(); // Remove type and anything after
            }

            if (foundType) {
               type = foundType;
               // Attempt to find dice somewhere in the remaining part
               const simpleDiceMatch = part.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?|\d+)/); // Match dice OR flat number
               if (simpleDiceMatch) {
                   dice = simpleDiceMatch[1];
               } else {
                   // If no dice/number found, maybe the average was omitted?
                   dice = ''; // Store empty dice if only type found
               }
            } else if (index === 0) {
               // If it's the first part and doesn't match, assume it's complex description?
               console.warn("Could not parse primary damage part:", part);
               return; // Skip this part
            } else {
               // Likely descriptive text following the last damage type
               return;
            }
         }
      }

      // Validate type
      if (!window.app.damageTypes.includes(type)) { // Access via window.app
         console.warn(`Unknown damage type "${type}" found during parsing.`);
         return;
      }

      data.damages.push({ dice: dice || '', type: type });
   });

   // Ensure at least one damage entry exists, even if empty
   if (data.damages.length === 0) {
      data.damages.push({ dice: '', type: 'slashing' });
   }

   return data;
}


function populateAttackHelper(data) {
   if (!data) return;

   const attackTypeSelect = document.getElementById('attack-type');
   const bonusInput = document.getElementById('attack-bonus');
   const reachInput = document.getElementById('attack-reach');
   const targetSelect = document.getElementById('attack-target');
   const container = document.getElementById('all-damage-rows-container');

   if (attackTypeSelect) attackTypeSelect.value = data.attackType || 'Melee Weapon Attack';
   if (bonusInput) bonusInput.value = data.bonus || 0;

   // Handle reach/range logic - prioritize reach for melee, range for ranged
   if (reachInput) {
      if (data.attackType.startsWith('Melee') && data.reach) {
         reachInput.value = data.reach;
      } else if (!data.attackType.startsWith('Melee') && data.range) {
         reachInput.value = data.range; // Put range in the 'reach' input for simplicity
      } else if (data.reach) { // Fallback if type doesn't match range/reach
         reachInput.value = data.reach;
      } else if (data.range) {
         reachInput.value = data.range;
      } else {
         reachInput.value = data.attackType.startsWith('Melee') ? '5' : '30'; // Default based on type
      }
   }

   if (targetSelect) targetSelect.value = data.target || 'one target';

   // Clear existing rows
   if (container) {
      container.innerHTML = ''; // Clear completely
   }

   // Add rows for each damage component
   if (data.damages && data.damages.length > 0) {
      data.damages.forEach((dmg, index) => {
         addDamageRow(dmg.dice, dmg.type, index === 0); // isPrimary = true only for the first one
      });
   } else {
      // Add a default primary row if parsing found no damages
      addDamageRow('', 'slashing', true);
   }
}


// --- Dice Selector Logic ---
function createDiceSelector(container, targetInput) {
   if (!container || !targetInput) return;
   container.innerHTML = ''; // Clear previous

   const dice = [4, 6, 8, 10, 12, 20]; // Common dice types
   const bonusIcon = `<svg class="bonus-icon h-5 w-5 mx-1" viewBox="0 0 1000 1000"><use href="#icon-die-bonus"></use></svg>`;

   dice.forEach(sides => {
      const icon = `<svg class="die-icon h-6 w-6 -ml-2" viewBox="0 0 1000 1000"><use href="#icon-die-d${sides}"></use></svg>`;
      const button = document.createElement('button');
      button.innerHTML = icon;
      button.title = `Add d${sides}`;
      button.type = 'button'; // Prevent form submission
      button.onclick = (e) => updateDiceString(targetInput, sides, e.shiftKey ? -1 : 1);
      container.appendChild(button);
   });

   // Add bonus button
   const bonusButton = document.createElement('button');
   bonusButton.innerHTML = bonusIcon;
   bonusButton.title = 'Add +1 bonus (Shift+Click for -1)';
   bonusButton.type = 'button';
   bonusButton.onclick = (e) => updateBonus(targetInput, e.shiftKey ? -1 : 1);
   container.appendChild(bonusButton);
}


function updateDiceString(targetInput, sides, change) {
   if (!targetInput) return;
   let currentValue = targetInput.value.trim();
   const dieRegex = new RegExp(`(\\d+)d${sides}`);
   let match = currentValue.match(dieRegex);
   let newCount = change;

   if (match) {
      newCount = parseInt(match[1], 10) + change;
      if (newCount <= 0) {
         // Remove the XdY part entirely
         currentValue = currentValue.replace(new RegExp(`\\s*\\+?\\s*${match[0]}`), '').replace(new RegExp(`${match[0]}\\s*\\+?\\s*`), '').trim();
         // If removing dice leaves only a sign, remove it too
         if (currentValue.match(/^\s*[+-]\s*$/)) currentValue = '';
         // If removing dice leaves "+ BONUS" -> "BONUS" or "- BONUS", keep sign
         currentValue = currentValue.replace(/^\s*\+\s*(\d+)$/, '$1').replace(/^\s*\+\s*(\d+d\d+)/, '$1');

      } else {
         currentValue = currentValue.replace(dieRegex, `${newCount}d${sides}`);
      }
   } else if (change > 0) {
      // Add the new die type
      if (currentValue && !currentValue.match(/[+-]\s*$/)) {
         // Add a plus if there's existing content that doesn't end in +/-
         currentValue += ` + ${change}d${sides}`;
      } else if (currentValue) {
         // Append directly if ending in +/-
         currentValue += ` ${change}d${sides}`;
      } else {
         // First die type
         currentValue = `${change}d${sides}`;
      }
   }
   // Clean up potential leading/trailing/double spaces or operators
   currentValue = currentValue.replace(/\s{2,}/g, ' ').replace(/^\s*\+\s*/, '').trim();
   // If string becomes just "+", clear it.
   if (currentValue === '+') currentValue = '';


   targetInput.value = currentValue;
}


function updateBonus(targetInput, change) {
   if (!targetInput) return;
   let currentValue = targetInput.value.trim();
   const bonusRegex = /([+-])\s*(\d+)$/; // Matches sign and number at the end
   let match = currentValue.match(bonusRegex);
   let newBonus = change;

   if (match) {
      const sign = match[1];
      const currentBonus = parseInt(match[2], 10);
      if (sign === '+') {
         newBonus = currentBonus + change;
      } else { // sign === '-'
         newBonus = currentBonus - change; // Subtracting a negative increases, subtracting positive decreases
      }

      if (newBonus === 0) {
         // Remove the bonus part entirely
         currentValue = currentValue.replace(bonusRegex, '').trim();
      } else if (newBonus > 0) {
         // Update with positive bonus
         currentValue = currentValue.replace(bonusRegex, `+ ${newBonus}`);
      } else { // newBonus < 0
         // Update with negative bonus (use absolute value)
         currentValue = currentValue.replace(bonusRegex, `- ${Math.abs(newBonus)}`);
      }
   } else if (change !== 0) {
      // No existing bonus, add one
      const sign = change > 0 ? '+' : '-';
      const bonusValue = Math.abs(change);
      if (currentValue) { // Append if there's other dice stuff
         currentValue += ` ${sign} ${bonusValue}`;
      } else { // Just the bonus
         currentValue = `${change > 0 ? '' : '-'}${bonusValue}`; // No plus sign if it's the only thing
      }
   }

   // Clean up potential leading/trailing/double spaces or operators
   currentValue = currentValue.replace(/\s{2,}/g, ' ').replace(/^\s*\+\s*/, '').trim();
   // If string becomes just "+", clear it.
   if (currentValue === '+') currentValue = '';

   targetInput.value = currentValue;
}


// --- Attack Helper Specific Logic ---
function addDamageRow(dice = '', type = 'slashing', isPrimary = false) {
   const container = document.getElementById('all-damage-rows-container');
   if (!container) return;

   const rowId = isPrimary ? 'primary' : `extra-${Date.now()}`; // Unique ID for extra rows

   const rowDiv = document.createElement('div');
   rowDiv.className = `p-3 border rounded-lg ${isPrimary ? 'bg-gray-50' : 'bg-blue-50 damage-row-extra mt-2'}`;
   rowDiv.id = `damage-row-${rowId}`;

   const damageDiceInputId = `attack-damage-dice-${rowId}`;
   const diceSelectorId = `dice-selector-${rowId}`;
   const damageTypeSelectId = `attack-damage-type-${rowId}`;
   const clearBtnId = `clear-btn-${rowId}`;

   let deleteButtonHtml = '';
   if (!isPrimary) {
      deleteButtonHtml = `
         <button type="button" onclick="document.getElementById('damage-row-${rowId}').remove()" class="text-red-500 hover:text-red-700 font-bold text-xl leading-none" title="Remove this damage type">&times;</button>
      `;
   }

   rowDiv.innerHTML = `
      <div class="flex flex-wrap items-center gap-4 text-sm">
         <div class="flex-grow">
            <label for="${damageDiceInputId}" class="label-text mb-1">${isPrimary ? 'Primary Damage' : 'Additional Damage'}</label>
            <input id="${damageDiceInputId}" type="text" value="${dice}" class="w-full rounded-md border-gray-300 info-input" placeholder="e.g., 1d6 + 1">
            <button id="${clearBtnId}" class="clear-btn">clear</button>
         </div>
         <div id="${diceSelectorId}" class="dice-selector-container flex items-center self-end">
            </div>
         <div class="self-end">
            <label for="${damageTypeSelectId}" class="label-text mb-1 invisible">Type</label>
            <select id="${damageTypeSelectId}" class="rounded-md border-gray-300 info-select"></select>
         </div>
         <div class="w-6 h-6 self-end">
            ${deleteButtonHtml}
         </div>
      </div>`;

   container.appendChild(rowDiv);

   // Populate and setup controls for the new row
   const damageDiceInput = document.getElementById(damageDiceInputId);
   const diceSelector = document.getElementById(diceSelectorId);
   const damageTypeSelect = document.getElementById(damageTypeSelectId);
   const clearBtn = document.getElementById(clearBtnId);

   if (damageDiceInput && diceSelector) {
      createDiceSelector(diceSelector, damageDiceInput);
   }
   if (damageTypeSelect) {
      window.ui.populateDamageTypes(damageTypeSelectId); // Use global UI function
      damageTypeSelect.value = type.toLowerCase() || (isPrimary ? 'slashing' : 'acid'); // Default type
   }
   if (clearBtn && damageDiceInput) {
      clearBtn.addEventListener('click', () => { damageDiceInput.value = ''; });
   }
}


function generateAttackString() {
   const attackType = document.getElementById('attack-type')?.value || 'Melee Weapon Attack';
   const bonusVal = document.getElementById('attack-bonus')?.value;
   const reachRangeVal = document.getElementById('attack-reach')?.value.trim() || (attackType.startsWith('Melee') ? '5' : '30'); // Default based on type
   const target = document.getElementById('attack-target')?.value || 'one target';

   const bonus = bonusVal ? (parseInt(bonusVal, 10) >= 0 ? `+${bonusVal}` : bonusVal) : '+0';

   let reachRangePart;
   if (reachRangeVal.includes('/')) {
      reachRangePart = `range ${reachRangeVal} ft.`;
   } else if (attackType.startsWith('Ranged')) {
      reachRangePart = `range ${reachRangeVal} ft.`;
   } else {
      reachRangePart = `reach ${reachRangeVal} ft.`;
   }

   let hitString = 'Hit: ';
   const damageRows = document.getElementById('all-damage-rows-container')?.querySelectorAll('.p-3') || []; // Select all rows
   const damages = [];

   damageRows.forEach(row => {
      const diceInput = row.querySelector('input[type="text"]');
      const typeSelect = row.querySelector('select');
      if (diceInput && typeSelect) {
         const dice = diceInput.value.trim();
         const type = typeSelect.value;
         if (dice && type) { // Only add if both dice and type are present
            damages.push({ dice, type });
         }
      }
   });

   if (damages.length === 0) {
      hitString += 'No damage defined.'; // Placeholder if no damage rows valid
   } else {
      hitString += damages.map(({ dice, type }) => {
         // Try to calculate average damage
         let averageDamage = '';
         const diceMatch = dice.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/);
         const flatMatch = dice.match(/^([+-]?\d+)$/);

         if (diceMatch) {
            const numDice = parseInt(diceMatch[1], 10);
            const dieType = parseInt(diceMatch[2], 10);
            const sign = diceMatch[3];
            const bonus = parseInt(diceMatch[4] || '0', 10);
            if (!isNaN(numDice) && !isNaN(dieType) && dieType > 0) {
               const avgRoll = Math.floor(numDice * ((dieType / 2) + 0.5));
               let totalAvg = avgRoll;
               if (sign === '+') totalAvg += bonus;
               else if (sign === '-') totalAvg -= bonus;
               averageDamage = `${Math.max(1, totalAvg)} `; // Ensure average is at least 1
            }
         } else if (flatMatch) {
            // If it's just a flat number, use that as the "average"
            averageDamage = `${Math.max(1, parseInt(flatMatch[1], 10))} `;
            dice = ''; // Don't show brackets for flat damage
         }


         return `${averageDamage}${dice ? `(${dice}) ` : ''}${type} damage`;
      }).join(' plus ');
      hitString += '.';
   }


   const fullAttackString = `${attackType}: ${bonus} to hit, ${reachRangePart}, ${target}. ${hitString}`;

   // Insert into the main description field
   if (window.ui.inputs.commonDesc) {
      window.ui.inputs.commonDesc.value = fullAttackString;
   }

   closeModal('attack-helper-modal');
}


// --- Modal & Alert Helpers ---
function openModal(modalId) {
   if (!window.ui.modalOverlay) return;
   const modal = document.getElementById(modalId);
   if (modal) {
      window.ui.modalOverlay.classList.remove('hidden');
      modal.classList.remove('hidden');
      // Improve focus handling - focus first focusable element inside modal
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) {
         setTimeout(() => focusable.focus(), 50); // Delay focus slightly for transition
      }
   }
}


function closeModal(modalId) {
   const modal = document.getElementById(modalId);
   if (modal) modal.classList.add('hidden');

   // Check if any other modals are open before hiding overlay
   const anyOpen = document.querySelectorAll('.modal-content:not(.hidden)').length > 0;
   if (!anyOpen && window.ui.modalOverlay) {
      window.ui.modalOverlay.classList.add('hidden');
   }

   // Clear confirm callback if it was the alert modal being closed
   if (modalId === 'alert-modal') {
      window.app.confirmCallback = null; // Access via window.app
   }
}


function showAlert(message) {
   showDialog("Alert", message, false);
}


function showConfirm(title, message, onConfirm) {
   window.app.confirmCallback = onConfirm; // Store the callback globally
   showDialog(title, message, true); // Show with cancel button
}


// --- Updated showDialog Function ---
async function showDialog(title, message, showCancel = false) { // Make the function async
   if (!window.ui.alertModal || !window.ui.alertTitle || !window.ui.alertMessageText || !window.ui.alertOkBtn || !window.ui.alertCancelBtn) {
      console.error("Alert modal elements not found!");
      alert(message); // Fallback to browser alert
      if (typeof window.app.confirmCallback === 'function') {
         try {
            // Await if the callback is async (important for DB operations)
            await window.app.confirmCallback();
         } catch (err) {
            console.error("Error executing confirm callback from fallback alert:", err);
         } finally {
            window.app.confirmCallback = null; // Clear callback
         }
      }
      return;
   }

   window.ui.alertTitle.textContent = title;
   window.ui.alertMessageText.textContent = message;

   // Store the callback temporarily to prevent race conditions if showDialog is called again quickly
   const currentCallback = window.app.confirmCallback;
   window.app.confirmCallback = null; // Clear global immediately

   // --- Refined OK Button Handler ---
   window.ui.alertOkBtn.onclick = async () => {
      // Disable buttons immediately to prevent double-clicks
      window.ui.alertOkBtn.disabled = true;
      if (window.ui.alertCancelBtn) window.ui.alertCancelBtn.disabled = true;

      let shouldCloseModal = true;
      if (typeof currentCallback === 'function') {
         try {
            // Await the callback if it's async (like DB operations)
            await currentCallback();
         } catch (err) {
            shouldCloseModal = false; // Keep modal open to show error
            console.error("Error executing confirm callback:", err);
            // Optionally, update modal text to show error, or show a separate alert
            window.ui.alertTitle.textContent = "Error";
            window.ui.alertMessageText.textContent = `An error occurred: ${err.message || err}. Please check the console.`;
            // Re-enable only OK button if needed, or keep both disabled
            window.ui.alertOkBtn.disabled = false;
            // Or change OK button text/action to just "Close"
            window.ui.alertOkBtn.textContent = "Close";
            window.ui.alertOkBtn.onclick = () => closeModal('alert-modal');
            if (window.ui.alertCancelBtn) window.ui.alertCancelBtn.classList.add('hidden'); // Hide cancel on error
            return; // Stop further execution for this click
         }
      }

      if (shouldCloseModal) {
          // Reset button state and close modal *after* callback completes successfully
          window.ui.alertOkBtn.disabled = false;
          if (window.ui.alertCancelBtn) window.ui.alertCancelBtn.disabled = false;
          window.ui.alertOkBtn.textContent = "OK"; // Reset text if changed
          closeModal('alert-modal');
      }
   };

   if (showCancel) {
      window.ui.alertCancelBtn.classList.remove('hidden');
      window.ui.alertCancelBtn.onclick = () => {
         // Callback is already cleared, just close the modal
         closeModal('alert-modal');
      };
   } else {
      window.ui.alertCancelBtn.classList.add('hidden');
      window.ui.alertCancelBtn.onclick = null;
   }

   openModal('alert-modal');
   setTimeout(() => window.ui.alertOkBtn.focus(), 50); // Focus OK button
}
// --- End Updated showDialog Function ---

// --- NEW/MODIFIED CLIPBOARD MODAL FUNCTIONS ---
async function openClipboardModal() {
   if (!window.ui.clipboardTextArea) {
      console.error("Clipboard modal text area not found!");
      return;
   }
   
   // Clear text area and set new placeholder
   window.ui.clipboardTextArea.value = '';
   window.ui.clipboardTextArea.placeholder = "Paste text here (Ctrl+V) to clean and process it...";
   
   // Set the checkbox state based on bestiary metadata
   if (window.ui.bestiaryPickOutTitles && window.app.activeBestiary) {
      window.ui.bestiaryPickOutTitles.checked = window.app.activeBestiary.metadata.pickOutTitles ?? true;
   } else if (window.ui.bestiaryPickOutTitles) {
      window.ui.bestiaryPickOutTitles.checked = true; // Default to on if no bestiary
   }
   
   window.app.openModal('clipboard-modal'); // openModal is in helpers.js
   window.ui.clipboardTextArea.focus();
}

function processAndPasteFromClipboardModal() {
   if (!window.ui.clipboardTextArea) {
      console.error("Clipboard modal text area not found!");
      return;
   }
   
   let textToPaste = window.ui.clipboardTextArea.value;
   
   // 1. Clean Non-Breaking Spaces
   textToPaste = textToPaste.replace(/\u00A0/g, ' ');
   
   // 2. Normalize Line Endings (The "paragraph endings" fix)
   textToPaste = textToPaste.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
   
   const shouldProcessTitles = window.ui.bestiaryPickOutTitles?.checked ?? false;
   
   const trixEditorElement = document.querySelector("trix-editor[input='npc-description']");
   const trixEditor = trixEditorElement?.editor;

   if (!trixEditor) {
      console.error("Trix editor element not found!");
      window.app.showAlert("Error: Could not find the description editor.");
      return; // Don't close modal if pasting failed
   }

   // Split into lines (paragraphs)
   const paragraphs = textToPaste.split('\n');
   let finalHtml = '';

   paragraphs.forEach(paragraph => {
      // Sanitize paragraph to prevent unwanted HTML injection
      const sanitizedParagraph = paragraph.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      if (sanitizedParagraph.trim() === '') {
         finalHtml += '<div><br></div>'; // Handle empty lines as breaks
         return;
      }

      if (shouldProcessTitles) {
         // Find the first sentence (ends with ., !, or ?)
         const sentenceEndMatch = sanitizedParagraph.match(/^([^.!?]+[.!?])/);
         
         if (sentenceEndMatch) {
            const firstSentence = sentenceEndMatch[1];
            const remainingText = sanitizedParagraph.substring(firstSentence.length);
            
            // Count words in the first sentence
            const words = firstSentence.trim().split(/\s+/);
            
            if (words.length <= 4 && words[0] !== '') {
               // Bold the sentence
               finalHtml += `<div><strong>${firstSentence}</strong>${remainingText}</div>`;
            } else {
               // Don't bold
               finalHtml += `<div>${sanitizedParagraph}</div>`;
            }
         } else {
            // No sentence-ending punctuation found, check word count of the whole paragraph
            const words = sanitizedParagraph.trim().split(/\s+/);
            if (words.length <= 4 && words[0] !== '') {
               // Bold the whole paragraph
               finalHtml += `<div><strong>${sanitizedParagraph}</strong></div>`;
            } else {
               // Don't bold
               finalHtml += `<div>${sanitizedParagraph}</div>`;
            }
         }
      } else {
         // Just wrap in div
         finalHtml += `<div>${sanitizedParagraph}</div>`;
      }
   });
   
   trixEditor.insertHTML(finalHtml); // Insert processed HTML
   trixEditor.element.focus(); // Focus the Trix editor after pasting
   window.app.closeModal('clipboard-modal'); // closeModal is in helpers.js
}
// --- END NEW/MODIFIED CLIPBOARD MODAL FUNCTIONS ---