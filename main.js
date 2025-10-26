// main.js
document.addEventListener("DOMContentLoaded", () => {

   // --- DATABASE SETUP ---
   const db = new Dexie('npcEngineerDB');
   // Bump version number from 1 to 2 because we added the 'settings' table
   db.version(2).stores({
      projects: '++id, projectName', // Kept as 'projects' for backward compatibility.
      settings: 'key' // Simple key-value store for global settings
   }).upgrade(tx => {
      // Version 2 upgrade logic (optional, but good practice if structure changed)
      // In this case, just adding a table doesn't require complex upgrade logic
      // unless you needed to migrate data from version 1.
      console.log("Upgrading database schema to version 2.");
   });
   // Fallback for version 1 if needed (though upgrade should handle it)
   db.version(1).stores({
       projects: '++id, projectName'
   });


   // --- DATA & STATE ---
   const damageTypes = [
      'acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison',
      'psychic', 'radiant', 'thunder', 'bludgeoning', 'piercing', 'slashing'
   ];
   const standardLanguages = [ "Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Thieves' cant" ];
   const exoticLanguages = [ "Abyssal", "Celestial", "Draconic", "Deep speech", "Infernal", "Primordial", "Sylvan", "Druidic", "Undercommon" ];
   const monstrousLanguages1 = [ "Aarakocra", "Aquan", "Auran", "Bullywug", "Gith", "Gnoll", "Grell", "Grung", "Hook horror", "Ice toad", "Ignan", "Ixitxachitl" ];
   const monstrousLanguages2 = [ "Modron", "Otyugh", "Sahuagin", "Slaad", "Sphinx", "Terran", "Thri-kreen", "Tlincalli", "Troglodyte", "Umber hulk", "Vegepygmy", "Yeti" ];
   // Combine all predefined languages for validation checks
   const allPredefinedLanguages = [
      ...standardLanguages, ...exoticLanguages,
      ...monstrousLanguages1, ...monstrousLanguages2
   ].map(lang => lang.toLowerCase());

   const conditions = [
      'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'grappled',
      'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
      'prone', 'restrained', 'stunned', 'unconscious'
   ];
   const skills = [
      { id: 'acrobatics', name: 'Acrobatics', attribute: 'dexterity' },
      { id: 'animal_handling', name: 'Animal Handling', attribute: 'wisdom' },
      { id: 'arcana', name: 'Arcana', attribute: 'intelligence' },
      { id: 'athletics', name: 'Athletics', attribute: 'strength' },
      { id: 'deception', name: 'Deception', attribute: 'charisma' },
      { id: 'history', name: 'History', attribute: 'intelligence' },
      { id: 'insight', name: 'Insight', attribute: 'wisdom' },
      { id: 'intimidation', name: 'Intimidation', attribute: 'charisma' },
      { id: 'investigation', name: 'Investigation', attribute: 'intelligence' },
      { id: 'medicine', name: 'Medicine', attribute: 'wisdom' },
      { id: 'nature', name: 'Nature', attribute: 'intelligence' },
      { id: 'perception', name: 'Perception', attribute: 'wisdom' },
      { id: 'performance', name: 'Performance', attribute: 'charisma' },
      { id: 'persuasion', name: 'Persuasion', attribute: 'charisma' },
      { id: 'religion', name: 'Religion', attribute: 'intelligence' },
      { id: 'sleight_of_hand', name: 'Sleight of Hand', attribute: 'dexterity' },
      { id: 'stealth', name: 'Stealth', attribute: 'dexterity' },
      { id: 'survival', name: 'Survival', attribute: 'wisdom' }
   ];

   let activeBestiary = null;
   let activeNPC = null;
   let activeNPCIndex = -1;
   let isUpdatingForm = false;
   let currentlyEditingAction = null; // Still needed for state tracking
   let boilerplateTarget = null; // Still needed for state tracking
   let confirmCallback = null; // Still needed for state tracking
   let changesMadeSinceExport = false; // Track changes for unload warning
   let disableUnloadWarning = false; // User preference for unload warning

   const baseDefaultNPC = {
      name: "", size: "", type: "", species: "", alignment: "",
      armorClass: "", hitPoints: "", challenge: "0", experience: "10", proficiencyBonus: 2,
      strength: 10, strengthBonus: 0, dexterity: 10, dexterityBonus: 0, constitution: 10, constitutionBonus: 0,
      intelligence: 10, intelligenceBonus: 0, wisdom: 10, wisdomBonus: 0, charisma: 10, charismaBonus: 0,
      strengthSavingThrowProf: false, strengthSavingThrowAdjust: 0,
      dexteritySavingThrowProf: false, dexteritySavingThrowAdjust: 0,
      constitutionSavingThrowProf: false, constitutionSavingThrowAdjust: 0,
      intelligenceSavingThrowProf: false, intelligenceSavingThrowAdjust: 0,
      wisdomSavingThrowProf: false, wisdomSavingThrowAdjust: 0,
      charismaSavingThrowProf: false, charismaSavingThrowAdjust: 0,
      gender: "creature", isUnique: false, isProperName: false, description: "", token: "", image: "",
      saves: "",
      speed: "",
      addDescription: true, addTitle: true, addImageLink: true, useDropCap: true,
      speedBase: 30, speedFly: 0, flyHover: false, speedClimb: 0, speedSwim: 0, speedBurrow: 0,
      senseBlindsight: 0, blindBeyond: false, senseDarkvision: 0, senseTremorsense: 0, senseTruesight: 0,
      passivePerception: 10, fg_group: "",
      weaponResistance: 'none',
      weaponImmunity: 'none',
      npcSkills: "",
      traits: [],
      sortTraitsAlpha: true,
      actions: {
         actions: [],
         'bonus-actions': [],
         reactions: [],
         'legendary-actions': [],
         'lair-actions': []
      },
      legendaryBoilerplate: "The [Creature Name] can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The [Creature Name] regains spent legendary actions at the start of its turn.",
      lairBoilerplate: "On initiative count 20 (losing initiative ties), the [Creature Name] takes a lair action to cause one of the following effects; the [Creature Name] can't use the same effect two rounds in a row:",
      selectedLanguages: [],
      specialLanguageOption: 0,
      hasTelepathy: false,
      telepathyRange: 0,

      // --- INNATE SPELLCASTING PROPERTIES ---
      hasInnateSpellcasting: false,
      innateIsPsionics: false,
      innateAbility: 'charisma', // Default ability
      innateDC: 10, // Placeholder, calculated later
      innateComponents: 'requiring no material components', // Default value
      innateSpells: [ // Array to hold frequency/list pairs (Reduced to 4 rows)
         { freq: "At will", list: "" },
         { freq: "3/day each", list: "" },
         { freq: "1/day each", list: "" },
         { freq: "", list: "" }
      ],
      // --- REGULAR SPELLCASTING PROPERTIES ---
      hasSpellcasting: false,
      spellcastingPlacement: 'traits', // 'traits' or 'actions'
      // --- TRAIT-BASED SPELLCASTING PROPERTIES ---
      traitCastingLevel: '1', // Default to 1st level
      traitCastingAbility: 'intelligence', // Default ability
      traitCastingDC: 10, // Placeholder
      traitCastingBonus: 2, // Placeholder
      traitCastingClass: '', // Default to None
      traitCastingFlavor: '', // Default empty
      traitCastingSlots: ['0','0','0','0','0','0','0','0','0'], // Slots for levels 1-9
      traitCastingList: ['','','','','','','','','',''], // Lists for levels 0-9
      traitCastingMarked: '', // Marked spells description
      // --- ACTION-BASED SPELLCASTING PROPERTIES ---
      actionCastingAbility: 'intelligence', // Default different from innate
      actionCastingDC: 10, // Placeholder
      actionCastingComponents: '', // Default to empty
      actionCastingSpells: [ // Same structure as innate
         { freq: "At will", list: "" },
         { freq: "3/day each", list: "" },
         { freq: "1/day each", list: "" },
         { freq: "", list: "" }
      ],
   };

   // Dynamically create the full defaultNPC object with resistance and skill properties
   const defaultNPC = { ...baseDefaultNPC };
   damageTypes.forEach(type => {
      defaultNPC[`vulnerability_${type}`] = false;
      defaultNPC[`resistance_${type}`] = false;
      defaultNPC[`immunity_${type}`] = false;
   });
   conditions.forEach(condition => {
      defaultNPC[`ci_${condition}`] = false;
   });
   skills.forEach(skill => {
      defaultNPC[`skill_${skill.id}_prof`] = false;
      defaultNPC[`skill_${skill.id}_exp`] = false;
      defaultNPC[`skill_${skill.id}_adjust`] = 0;
   });


   const crToXpMap = {
      '0': '10', '1/8': '25', '1/4': '50', '1/2': '100', '1': '200', '2': '450', '3': '700',
      '4': '1,100', '5': '1,800', '6': '2,300', '7': '2,900', '8': '3,900', '9': '5,000', '10': '5,900',
      '11': '7,200', '12': '8,400', '13': '10,000', '14': '11,500', '15': '13,000', '16': '15,000',
      '17': '18,000', '18': '20,000', '19': '22,000', '20': '25,000', '21': '33,000', '22': '41,000',
      '23': '50,000', '24': '62,000', '25': '75,000', '26': '90,000', '27': '105,000', '28': '120,000',
      '29': '135,000', '30': '155,000'
   };

   const challengeOrder = ['0','1/8','1/4','1/2','1','2','3','4','5','6','7','8','9','10',
                                '11','12','13','14','15','16','17','18','19','20','21','22','23',
                                '24','25','26','27','28','29','30'];

   const pronounSets = {
      male: ['he', 'him', 'his', 'himself'],
      female: ['she', 'her', 'her', 'herself'],
      neutral: ['they', 'them', 'their', 'themselves'],
      creature: ['it', 'it', 'its', 'itself']
   };

   // Make variables and functions available to other scripts
   // window.app is initialized/extended in helpers.js first
   Object.assign(window.app, {
      // Core Data & State (already initialized in helpers.js)
      db,
      damageTypes,
      standardLanguages,
      exoticLanguages,
      monstrousLanguages1,
      monstrousLanguages2,
      allPredefinedLanguages,
      conditions,
      skills,
      activeBestiary, // Keep state here
      activeNPC,      // Keep state here
      activeNPCIndex, // Keep state here
      isUpdatingForm, // Keep state here
      defaultNPC,
      crToXpMap,
      challengeOrder,
      pronounSets,
      changesMadeSinceExport,
      disableUnloadWarning,
      currentlyEditingAction, // Keep state reference
      boilerplateTarget,      // Keep state reference
      confirmCallback,        // Keep state reference

      // Core Functions
      setDisableUnloadWarning,
      markFirstUseComplete,
      exportFullDatabase,
      importFullDatabase,
      confirmImportFullDatabase,
      findUniqueNpcName,
      createNewBestiary,
      loadBestiary,
      exportBestiary,
      importBestiary,
      createNewNpc,
      duplicateCurrentNpc,
      deleteCurrentNpc,
      importNpc,
      exportNpc,
      exportBestiaryToFG,
      updateActiveNPCFromForm,
      healBestiary,
      sortAndSwitchToNpc,
      switchActiveNPC,
      saveActiveBestiaryToDB,

      // Keep references to helpers defined elsewhere
      calculateAbilityBonus: window.app.calculateAbilityBonus,
      calculateProficiencyBonus: window.app.calculateProficiencyBonus,
      calculateSpeedString: window.app.calculateSpeedString,
      calculateSensesString: window.app.calculateSensesString,
      calculateDamageModifiersString: window.app.calculateDamageModifiersString,
      calculateConditionImmunitiesString: window.app.calculateConditionImmunitiesString,
      calculateLanguagesString: window.app.calculateLanguagesString,
      calculateAllStats: window.app.calculateAllStats,
      calculateAllSkills: window.app.calculateAllSkills,
      calculateSpellcastingDCBonus: window.app.calculateSpellcastingDCBonus,
      addOrUpdateAction: window.app.addOrUpdateAction,
      editAction: window.app.editAction,
      clearInputs: window.app.clearInputs,
      openModal: window.app.openModal,
      closeModal: window.app.closeModal,
      showAlert: window.app.showAlert,
      showConfirm: window.app.showConfirm,
      handleAttackHelperOpen: window.app.handleAttackHelperOpen,
      parseAttackString: window.app.parseAttackString,
      populateAttackHelper: window.app.populateAttackHelper,
      editBoilerplate: window.app.editBoilerplate,
      saveBoilerplate: window.app.saveBoilerplate,
      addDamageRow: window.app.addDamageRow,
      generateAttackString: window.app.generateAttackString,
      createDiceSelector: window.app.createDiceSelector,
      updateDiceString: window.app.updateDiceString,
      updateBonus: window.app.updateBonus,
      processTraitString: window.app.processTraitString
   });


   // --- CORE FUNCTIONS (kept in main.js) ---

   function findUniqueNpcName(baseName) {
      if (!window.app.activeBestiary) return baseName;
      let newName = baseName;
      let counter = 1;
      while (window.app.activeBestiary.npcs.some(npc => npc.name.toLowerCase() === newName.toLowerCase())) {
         counter++;
         newName = `${baseName} ${counter}`;
      }
      return newName;
   }

   // --- Bestiary Management ---

   async function createNewBestiary() {
      const bestiaryName = window.ui.newBestiaryNameInput.value.trim();
      if (!bestiaryName) {
         window.app.showAlert("Bestiary name cannot be empty."); // Use helper
         return;
      }
      const existingBestiary = await db.projects.where('projectName').equalsIgnoreCase(bestiaryName).first();
      if (existingBestiary) {
         window.app.showAlert(`A bestiary named "${bestiaryName}" already exists. Please choose a unique name.`); // Use helper
         return;
      }

      const newBestiary = {
         projectName: bestiaryName,
         metadata: {
            createdAt: new Date(),
            addDescription: true, addTitle: true, addImageLink: true, useDropCap: true,
            fg_groups: [], userDefinedLanguages: [], savedTraits: []
         },
         npcs: [{ ...defaultNPC, name: "New NPC", fg_group: bestiaryName }]
      };

      try {
         const newId = await db.projects.add(newBestiary);
         newBestiary.id = newId;
         loadBestiary(newBestiary);
         changesMadeSinceExport = false;
         window.ui.hideAllModals();
         window.ui.newBestiaryNameInput.value = "";
      } catch (error) {
         console.error("Failed to create bestiary:", error);
         window.app.showAlert("Error: Could not create bestiary. Check console for details."); // Use helper
      }
   }

   function healBestiary(bestiary) {
      // --- Metadata Healing ---
      if (typeof bestiary.metadata !== 'object' || bestiary.metadata === null) bestiary.metadata = {};
      if (!Array.isArray(bestiary.metadata.userDefinedLanguages)) bestiary.metadata.userDefinedLanguages = [];
      if (!Array.isArray(bestiary.metadata.savedTraits)) bestiary.metadata.savedTraits = [];
      if (!Array.isArray(bestiary.metadata.fg_groups)) bestiary.metadata.fg_groups = [];

      const metadataPropsToConvert = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap'];
      metadataPropsToConvert.forEach(prop => {
         if (typeof bestiary.metadata[prop] === 'number') bestiary.metadata[prop] = bestiary.metadata[prop] === 1;
         else if (bestiary.metadata[prop] === undefined) bestiary.metadata[prop] = true;
      });

      // --- NPC Healing ---
      if (!Array.isArray(bestiary.npcs)) bestiary.npcs = [];

      let unnamedCounter = 1;
      bestiary.npcs = bestiary.npcs.map((npc, index) => {
         if (typeof npc !== 'object' || npc === null) {
            console.warn("Found corrupt NPC data, replacing with default.");
            return { ...defaultNPC, name: findUniqueNpcName("Recovered Corrupt NPC") };
         }
         const healedNpc = { ...defaultNPC, ...npc };
         const npcPropsToConvert = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap'];
         npcPropsToConvert.forEach(prop => {
            if (typeof healedNpc[prop] === 'number') healedNpc[prop] = healedNpc[prop] === 1;
            else if (healedNpc[prop] === undefined) healedNpc[prop] = bestiary.metadata[prop];
         });
         if (!Array.isArray(healedNpc.selectedLanguages)) healedNpc.selectedLanguages = [];
         if (healedNpc.specialLanguageOption === undefined) healedNpc.specialLanguageOption = defaultNPC.specialLanguageOption;
         if (healedNpc.hasTelepathy === undefined) healedNpc.hasTelepathy = defaultNPC.hasTelepathy;
         if (healedNpc.telepathyRange === undefined) healedNpc.telepathyRange = defaultNPC.telepathyRange;
         if (!Array.isArray(healedNpc.traits)) healedNpc.traits = [];
         if (healedNpc.sortTraitsAlpha === undefined) healedNpc.sortTraitsAlpha = defaultNPC.sortTraitsAlpha;
         if (typeof healedNpc.actions !== 'object' || healedNpc.actions === null) {
            healedNpc.actions = JSON.parse(JSON.stringify(defaultNPC.actions));
         } else {
            for (const key in defaultNPC.actions) {
               if (!Array.isArray(healedNpc.actions[key])) healedNpc.actions[key] = [];
            }
         }
         if (healedNpc.legendaryBoilerplate === undefined) healedNpc.legendaryBoilerplate = defaultNPC.legendaryBoilerplate;
         if (healedNpc.lairBoilerplate === undefined) healedNpc.lairBoilerplate = defaultNPC.lairBoilerplate;

         // Innate Spellcasting
         if (healedNpc.hasInnateSpellcasting === undefined) healedNpc.hasInnateSpellcasting = defaultNPC.hasInnateSpellcasting;
         if (healedNpc.innateIsPsionics === undefined) healedNpc.innateIsPsionics = defaultNPC.innateIsPsionics;
         if (healedNpc.innateAbility === undefined) healedNpc.innateAbility = defaultNPC.innateAbility;
         if (healedNpc.innateDC === undefined) healedNpc.innateDC = undefined;
         if (healedNpc.innateComponents === undefined) healedNpc.innateComponents = defaultNPC.innateComponents;
         const defaultInnateSpellsLength = defaultNPC.innateSpells.length;
         if (!Array.isArray(healedNpc.innateSpells)) {
            healedNpc.innateSpells = JSON.parse(JSON.stringify(defaultNPC.innateSpells));
         } else {
            while(healedNpc.innateSpells.length < defaultInnateSpellsLength) healedNpc.innateSpells.push({ freq: "", list: ""});
            if (healedNpc.innateSpells.length > defaultInnateSpellsLength) healedNpc.innateSpells = healedNpc.innateSpells.slice(0, defaultInnateSpellsLength);
            healedNpc.innateSpells = healedNpc.innateSpells.map((spellSlot, slotIndex) => {
               const defaultSlot = defaultNPC.innateSpells[slotIndex] || { freq: "", list: "" };
               return { freq: spellSlot?.freq ?? defaultSlot.freq, list: spellSlot?.list ?? defaultSlot.list };
            });
         }

         // Regular Spellcasting
         if (healedNpc.hasSpellcasting === undefined) healedNpc.hasSpellcasting = defaultNPC.hasSpellcasting;
         if (healedNpc.spellcastingPlacement === undefined) healedNpc.spellcastingPlacement = defaultNPC.spellcastingPlacement;

         // Trait Spellcasting
         if (healedNpc.traitCastingLevel === undefined) healedNpc.traitCastingLevel = defaultNPC.traitCastingLevel;
         if (healedNpc.traitCastingAbility === undefined) healedNpc.traitCastingAbility = defaultNPC.traitCastingAbility;
         if (healedNpc.traitCastingDC === undefined) healedNpc.traitCastingDC = undefined;
         if (healedNpc.traitCastingBonus === undefined) healedNpc.traitCastingBonus = undefined;
         if (healedNpc.traitCastingClass === undefined) healedNpc.traitCastingClass = defaultNPC.traitCastingClass;
         if (healedNpc.traitCastingFlavor === undefined) healedNpc.traitCastingFlavor = defaultNPC.traitCastingFlavor;
         if (!Array.isArray(healedNpc.traitCastingSlots) || healedNpc.traitCastingSlots.length !== 9) healedNpc.traitCastingSlots = [...defaultNPC.traitCastingSlots];
         if (!Array.isArray(healedNpc.traitCastingList) || healedNpc.traitCastingList.length !== 10) healedNpc.traitCastingList = [...defaultNPC.traitCastingList];
         if (healedNpc.traitCastingMarked === undefined) healedNpc.traitCastingMarked = defaultNPC.traitCastingMarked;

         // Action Spellcasting
         if (healedNpc.actionCastingAbility === undefined) healedNpc.actionCastingAbility = defaultNPC.actionCastingAbility;
         if (healedNpc.actionCastingDC === undefined) healedNpc.actionCastingDC = undefined;
         if (healedNpc.actionCastingComponents === undefined) healedNpc.actionCastingComponents = defaultNPC.actionCastingComponents;
         const defaultActionSpellsLength = defaultNPC.actionCastingSpells.length;
         if (!Array.isArray(healedNpc.actionCastingSpells)) {
            healedNpc.actionCastingSpells = JSON.parse(JSON.stringify(defaultNPC.actionCastingSpells));
         } else {
            while(healedNpc.actionCastingSpells.length < defaultActionSpellsLength) healedNpc.actionCastingSpells.push({ freq: "", list: ""});
            if (healedNpc.actionCastingSpells.length > defaultActionSpellsLength) healedNpc.actionCastingSpells = healedNpc.actionCastingSpells.slice(0, defaultActionSpellsLength);
            healedNpc.actionCastingSpells = healedNpc.actionCastingSpells.map((spellSlot, slotIndex) => {
               const defaultSlot = defaultNPC.actionCastingSpells[slotIndex] || { freq: "", list: "" };
               return { freq: spellSlot?.freq ?? defaultSlot.freq, list: spellSlot?.list ?? defaultSlot.list };
            });
         }

         // FG Group
         const allValidGroups = [bestiary.projectName, ...(bestiary.metadata.fg_groups || [])];
         if (!healedNpc.fg_group || !allValidGroups.includes(healedNpc.fg_group)) healedNpc.fg_group = bestiary.projectName;

         // Name
         if (!healedNpc.name || healedNpc.name.trim() === "") {
            let uniqueName = `Unnamed NPC ${unnamedCounter++}`;
            while (bestiary.npcs.some((n, i) => i !== index && n.name === uniqueName)) uniqueName = `Unnamed NPC ${unnamedCounter++}`;
            healedNpc.name = uniqueName;
         }
         return healedNpc;
      });

      if (bestiary.npcs.length === 0) {
         console.warn("Bestiary had no valid NPCs, adding a default one.");
         bestiary.npcs.push({ ...defaultNPC, name: "New NPC", fg_group: bestiary.projectName });
      }
      return bestiary;
   }


   function loadBestiary(bestiary) {
      try {
         const clonedBestiary = JSON.parse(JSON.stringify(bestiary));
         const healedBestiary = healBestiary(clonedBestiary);
         window.app.activeBestiary = healedBestiary; // Use window.app reference
         changesMadeSinceExport = false;
         sortAndSwitchToNpc(null);
         window.ui.updateUIForActiveBestiary();
      } catch (error) {
         console.error("Critical error loading bestiary:", error);
         window.app.showAlert("There was a critical error trying to load this bestiary. It may be corrupt. Check the console for details."); // Use helper
         window.app.activeBestiary = null; // Use window.app reference
         window.app.activeNPC = null; // Use window.app reference
         window.app.activeNPCIndex = -1; // Use window.app reference
         changesMadeSinceExport = false;
         window.ui.updateUIForActiveBestiary();
      }
   }

   function switchActiveNPC(index) {
       // Access state via window.app
      if (window.app.activeBestiary && index >= 0 && index < window.app.activeBestiary.npcs.length) {
         window.app.activeNPCIndex = index;
         window.app.activeNPC = window.app.activeBestiary.npcs[index];
         window.ui.updateFormFromActiveNPC();
      } else if (window.app.activeBestiary && window.app.activeBestiary.npcs.length > 0) {
         window.app.activeNPCIndex = 0;
         window.app.activeNPC = window.app.activeBestiary.npcs[0];
         window.ui.updateFormFromActiveNPC();
      } else {
         window.app.activeNPC = null;
         window.app.activeNPCIndex = -1;
         window.ui.updateFormFromActiveNPC();
      }
   }


   async function saveActiveBestiaryToDB() {
       // Access state/db via window.app
      if (window.app.activeBestiary && window.app.activeBestiary.id) {
         try {
            const bestiaryToSave = JSON.parse(JSON.stringify(window.app.activeBestiary));
            await db.projects.put(bestiaryToSave);
            changesMadeSinceExport = true;
         } catch (error) {
            console.error("Failed to save bestiary to DB:", error);
         }
      } else {
         console.warn("Attempted to save but no active bestiary or bestiary ID is missing.");
      }
   }

   function sortAndSwitchToNpc(targetNpc) {
      if (!window.app.activeBestiary) return; // Use window.app reference

      window.app.activeBestiary.npcs.sort((a, b) => {
         return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: 'base' });
      });

      const newIndex = targetNpc
         ? window.app.activeBestiary.npcs.findIndex(npc => npc === targetNpc)
         : 0;

      switchActiveNPC(newIndex >= 0 ? newIndex : 0);
   }


   async function exportBestiary() {
      if (!window.app.activeBestiary) { // Use window.app reference
         window.app.showAlert("No active bestiary to export."); // Use helper
         return;
      }
      if (window.app.activeNPC) updateActiveNPCFromForm(); // Use window.app reference

      const bestiaryToExport = JSON.parse(JSON.stringify(window.app.activeBestiary)); // Use window.app reference
      const bestiaryJson = JSON.stringify(bestiaryToExport, null, 2);

      try {
         const handle = await window.showSaveFilePicker({
            suggestedName: `Bestiary-${window.app.activeBestiary.projectName}.json`, // Use window.app reference
            types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
         });
         const writable = await handle.createWritable();
         await writable.write(bestiaryJson);
         await writable.close();
         changesMadeSinceExport = false;
      } catch (err) {
         if (err.name !== "AbortError") {
            console.error("Error exporting bestiary:", err);
            window.app.showAlert("Failed to export bestiary. See console for details."); // Use helper
         }
      }
   }

   async function importBestiary() {
      try {
         const [handle] = await window.showOpenFilePicker({
            types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
         });
         const file = await handle.getFile();
         const content = await file.text();
         let importedBestiary;
         try { importedBestiary = JSON.parse(content); }
         catch (parseError) {
            console.error("Error parsing JSON file:", parseError);
            window.app.showAlert("Failed to import: The selected file is not valid JSON."); // Use helper
            return;
         }
         if (!importedBestiary || typeof importedBestiary.projectName !== 'string') {
            window.app.showAlert("Failed to import: Invalid bestiary format."); // Use helper
            return;
         }
         delete importedBestiary.id;
         const existing = await db.projects.where('projectName').equalsIgnoreCase(importedBestiary.projectName).first();
         if (existing) {
            window.app.showAlert(`A bestiary named "${importedBestiary.projectName}" already exists...`); // Use helper
            return;
         }
         const healedBestiary = healBestiary(importedBestiary);
         const newId = await db.projects.add(healedBestiary);
         healedBestiary.id = newId;
         loadBestiary(healedBestiary);
         window.app.showAlert(`Bestiary "${healedBestiary.projectName}" imported successfully!`); // Use helper
      } catch (err) {
         if (err.name !== "AbortError") {
            console.error("Error importing bestiary:", err);
            window.app.showAlert("Failed to import bestiary. See console for details."); // Use helper
         }
      }
   }

   // --- NEW: Full Database Export/Import ---
   async function exportFullDatabase() {
       try {
           const allProjects = await db.projects.toArray();
           const allSettings = await db.settings.toArray();

           const exportData = {
               version: 2, // Simple versioning for the export format
               exportedAt: new Date().toISOString(),
               projects: allProjects,
               settings: allSettings
           };

           const exportJson = JSON.stringify(exportData, null, 2);

           const handle = await window.showSaveFilePicker({
               suggestedName: `NPC-Engineer-DB-Backup-${new Date().toISOString().split('T')[0]}.json`,
               types: [{ description: "JSON Database Backup", accept: { "application/json": [".json"] } }]
           });
           const writable = await handle.createWritable();
           await writable.write(exportJson);
           await writable.close();
           window.app.showAlert("Full database exported successfully."); // Use helper
           changesMadeSinceExport = false; // Exporting everything counts as a backup

       } catch (err) {
           if (err.name !== "AbortError") {
               console.error("Error exporting full database:", err);
               window.app.showAlert("Failed to export full database. See console for details."); // Use helper
           }
       }
   }

   function confirmImportFullDatabase() {
      window.app.openModal('import-db-confirm-modal'); // Use helper
   }

   async function importFullDatabase() {
      try {
         const [handle] = await window.showOpenFilePicker({
            types: [{ description: "JSON Database Backup", accept: { "application/json": [".json"] } }]
         });
         const file = await handle.getFile();
         const content = await file.text();
         let importData;
         try { importData = JSON.parse(content); }
         catch (parseError) {
            console.error("Error parsing database JSON file:", parseError);
            window.app.showAlert("Import Failed: The selected file is not a valid JSON database backup."); // Use helper
            return;
         }
         if (!importData || importData.version !== 2 || !Array.isArray(importData.projects) || !Array.isArray(importData.settings)) {
            window.app.showAlert("Import Failed: Invalid or incompatible database backup file format."); // Use helper
            return;
         }

         await db.transaction('rw', db.projects, db.settings, async () => {
             await db.projects.clear();
             await db.settings.clear();
             console.log("Cleared existing database tables.");
             const projectsToImport = importData.projects.map(p => { delete p.id; return p; });
             await db.projects.bulkPut(projectsToImport);
             await db.settings.bulkPut(importData.settings);
             console.log(`Imported ${projectsToImport.length} projects and ${importData.settings.length} settings.`);
         });

         window.app.activeBestiary = null; // Use window.app reference
         window.app.activeNPC = null; // Use window.app reference
         window.app.activeNPCIndex = -1; // Use window.app reference
         changesMadeSinceExport = false;
         await loadSettings(); // Reload settings
         window.ui.updateUIForActiveBestiary();
         window.app.showAlert("Full database imported successfully! Please select a bestiary to load."); // Use helper

      } catch (err) {
         if (err.name !== "AbortError") {
            console.error("Error importing full database:", err);
            window.app.showAlert("Failed to import full database. See console for details."); // Use helper
         }
      }
   }


   // --- NPC Management ---
   function createNewNpc() {
      if (!window.app.activeBestiary) { // Use window.app reference
         window.app.showAlert("Please load or create a bestiary first."); // Use helper
         return;
      }
      const newNpc = JSON.parse(JSON.stringify(defaultNPC));
      newNpc.name = findUniqueNpcName("New NPC");
      newNpc.useDropCap = window.app.activeBestiary.metadata.useDropCap; // Use window.app reference
      newNpc.addDescription = window.app.activeBestiary.metadata.addDescription; // Use window.app reference
      newNpc.addTitle = window.app.activeBestiary.metadata.addTitle; // Use window.app reference
      newNpc.addImageLink = window.app.activeBestiary.metadata.addImageLink; // Use window.app reference
      newNpc.fg_group = window.app.activeBestiary.projectName; // Use window.app reference

      // Use helpers for calculation
      const { dc: innateDC } = window.app.calculateSpellcastingDCBonus(newNpc.innateAbility, newNpc.proficiencyBonus, newNpc);
      newNpc.innateDC = innateDC;
      const { dc: traitDC, bonus: traitBonus } = window.app.calculateSpellcastingDCBonus(newNpc.traitCastingAbility, newNpc.proficiencyBonus, newNpc);
      newNpc.traitCastingDC = traitDC;
      newNpc.traitCastingBonus = traitBonus;
      const { dc: actionDC } = window.app.calculateSpellcastingDCBonus(newNpc.actionCastingAbility, newNpc.proficiencyBonus, newNpc);
      newNpc.actionCastingDC = actionDC;

      window.app.activeBestiary.npcs.push(newNpc); // Use window.app reference
      sortAndSwitchToNpc(newNpc);
      saveActiveBestiaryToDB();
      window.ui.inputs.name.focus();
   }


   function duplicateCurrentNpc() {
      if (!window.app.activeBestiary || !window.app.activeNPC) { // Use window.app references
         window.app.showAlert("Please select an NPC to duplicate."); // Use helper
         return;
      }
      updateActiveNPCFromForm();
      const newNpc = JSON.parse(JSON.stringify(window.app.activeNPC)); // Use window.app reference
      newNpc.name = findUniqueNpcName(`${window.app.activeNPC.name} (Copy)`); // Use window.app reference
      window.app.activeBestiary.npcs.push(newNpc); // Use window.app reference
      sortAndSwitchToNpc(newNpc);
      saveActiveBestiaryToDB();
      window.ui.inputs.name.focus();
   }


   function deleteCurrentNpc() {
      if (!window.app.activeBestiary) { // Use window.app reference
         window.app.showAlert("No active bestiary."); // Use helper
         return;
      }
      if (!window.app.activeNPC) { // Use window.app reference
         window.app.showAlert("No NPC selected to delete."); // Use helper
         return;
      }
      if (window.app.activeBestiary.npcs.length <= 1) { // Use window.app reference
         window.app.showAlert("Cannot delete the last NPC in the bestiary."); // Use helper
         return;
      }

      const npcToDelete = window.app.activeNPC; // Use window.app reference
      const npcNameToDelete = npcToDelete.name || "Unnamed NPC";

      window.app.showConfirm( // Use helper
         "Delete NPC?",
         `Are you sure you want to permanently delete "${npcNameToDelete}"? This cannot be undone.`,
         () => {
            const indexToDelete = window.app.activeBestiary.npcs.findIndex(npc => npc === npcToDelete); // Use window.app reference
            if (indexToDelete !== -1) {
               window.app.activeBestiary.npcs.splice(indexToDelete, 1); // Use window.app reference
               sortAndSwitchToNpc(null);
               saveActiveBestiaryToDB();
            } else {
               console.error("Could not find the NPC to delete after confirmation.");
               window.app.showAlert("Error: Could not delete the NPC."); // Use helper
            }
         }
      );
   }


   async function importNpc() {
      if (!window.app.activeBestiary) { // Use window.app reference
         window.app.showAlert("Please load or create a bestiary first to import an NPC into."); // Use helper
         return;
      }
      try {
         const [handle] = await window.showOpenFilePicker({ types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }] });
         const file = await handle.getFile();
         const content = await file.text();
         let loadedNPC;
         try { loadedNPC = JSON.parse(content); }
         catch (parseError) {
            console.error("Error parsing NPC JSON file:", parseError);
            window.app.showAlert("Failed to import: The selected file is not valid JSON."); // Use helper
            return;
         }
         if (typeof loadedNPC !== 'object' || loadedNPC === null) {
            window.app.showAlert("Failed to import: Invalid NPC data format."); // Use helper
            return;
         }
         const newNpc = { ...defaultNPC, ...loadedNPC };
         newNpc.name = findUniqueNpcName(newNpc.name || "Imported NPC");
         if (!newNpc.fg_group) newNpc.fg_group = window.app.activeBestiary.projectName; // Use window.app reference
         const propsToInherit = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap'];
         propsToInherit.forEach(prop => {
            if (newNpc[prop] === undefined) newNpc[prop] = window.app.activeBestiary.metadata[prop]; // Use window.app reference
         });
         window.app.activeBestiary.npcs.push(newNpc); // Use window.app reference
         sortAndSwitchToNpc(newNpc);
         saveActiveBestiaryToDB();
         window.app.showAlert(`NPC "${newNpc.name}" imported successfully.`); // Use helper
      } catch (err) {
         if (err.name !== "AbortError") {
            console.error("Error importing NPC:", err);
            window.app.showAlert("Failed to import NPC. See console for details."); // Use helper
         }
      }
   }


   async function exportNpc() {
      if (!window.app.activeNPC) { // Use window.app reference
         window.app.showAlert("No NPC selected to export."); // Use helper
         return;
      }
      updateActiveNPCFromForm();
      const npcToExport = JSON.parse(JSON.stringify(window.app.activeNPC)); // Use window.app reference
      const npcJson = JSON.stringify(npcToExport, null, 2);
      try {
         const handle = await window.showSaveFilePicker({
            suggestedName: `${window.app.activeNPC.name || "unnamed-npc"}.json`, // Use window.app reference
            types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
         });
         const writable = await handle.createWritable();
         await writable.write(npcJson);
         await writable.close();
      } catch (err) {
         if (err.name !== "AbortError") {
            console.error("Error exporting NPC:", err);
            window.app.showAlert("Failed to export NPC. See console for details."); // Use helper
         }
      }
   }


   async function exportBestiaryToFG() {
      if (!window.app.activeBestiary) { // Use window.app reference
         window.app.showAlert("No active bestiary to export."); // Use helper
         return;
      }
      window.app.showAlert("Fantasy Grounds export is not yet implemented."); // Use helper
      console.log("Placeholder: Exporting Bestiary to FG format...");
   }


   function updateActiveNPCFromForm() {
      if (window.app.isUpdatingForm || !window.app.activeNPC) return; // Use window.app references

      const oldProfBonus = window.app.activeNPC.proficiencyBonus;
      const oldAbilities = { /*...*/ };
      // ... (rest of the variable caching)

      // --- Name Validation ---
      const newName = window.ui.inputs.name.value.trim();
      if (newName && newName.toLowerCase() !== (window.app.activeNPC.name || "").toLowerCase()) { // Use window.app reference
         const isDuplicate = window.app.activeBestiary.npcs.some((npc, index) => // Use window.app reference
            index !== window.app.activeNPCIndex && npc.name.toLowerCase() === newName.toLowerCase() // Use window.app reference
         );
         if (isDuplicate) {
            window.app.showAlert(`An NPC named "${newName}" already exists...`); // Use helper
            window.ui.inputs.name.value = window.app.activeNPC.name; // Use window.app reference
            return;
         }
         window.app.activeNPC.name = newName; // Use window.app reference
      } // ... (rest of name handling)

      // --- Update Standard Properties ---
      for (const key in window.ui.inputs) {
          // ... (loop logic remains mostly the same, just ensure defaults reference defaultNPC)
          // Example change for number parsing:
          if (element.type === "number") {
             const parsedValue = parseInt(element.value, 10);
             const defaultValue = defaultNPC[key] !== undefined ? defaultNPC[key] : 0; // Use local defaultNPC
             window.app.activeNPC[key] = isNaN(parsedValue) ? defaultValue : parsedValue; // Assign to window.app.activeNPC
          } // ... (similar adjustments needed throughout the loop)
          // ...
      }

      // --- Update Proficiency Bonus ---
      const newProfBonus = window.app.calculateProficiencyBonus(window.app.activeNPC.challenge); // Use helper
      // ... (rest of prof bonus logic)

      // --- Recalculate Ability Bonuses ---
      abilities.forEach(ability => {
         const newBonus = window.app.calculateAbilityBonus(window.app.activeNPC[ability]); // Use helper
         // ... (rest of ability bonus logic)
      });

      // --- Innate Spellcasting fields ---
      // Update Innate DC
      const { dc: newInnateCalculatedDC } = window.app.calculateSpellcastingDCBonus(window.app.activeNPC.innateAbility, newProfBonus, window.app.activeNPC); // Use helper
      // ... (rest of innate spellcasting logic)

      // --- Spellcasting fields ---
      // ... (rest of general spellcasting logic)

      // --- Trait-based Spellcasting fields ---
      const { dc: newTraitCalculatedDC, bonus: newTraitCalculatedBonus } = window.app.calculateSpellcastingDCBonus(window.app.activeNPC.traitCastingAbility, newProfBonus, window.app.activeNPC); // Use helper
      // ... (rest of trait spellcasting logic)

      // --- Action-based Spellcasting fields ---
      const { dc: newActionCalculatedDC } = window.app.calculateSpellcastingDCBonus(window.app.activeNPC.actionCastingAbility, newProfBonus, window.app.activeNPC); // Use helper
      // ... (rest of action spellcasting logic)

      // --- Languages ---
      // ... (language logic remains mostly the same)

      // --- Viewport Options ---
      // ... (viewport logic remains mostly the same)

      // --- Saves & Skills ---
      // ... (saves/skills logic remains mostly the same)

      // --- Resistances/Immunities ---
      // ... (resistance/immunity logic remains mostly the same)

      // --- Recalculate derived stats ---
      window.app.calculateAllStats(); // Use helper

      // --- Final UI Updates ---
      window.ui.updateStatDisplays();
      window.ui.updateSkillDisplays();
      window.viewport.updateViewport();

      // Update name in selector dropdown if it changed
      if(window.ui.npcSelector && window.ui.npcSelector.selectedIndex >= 0) {
         const currentOption = window.ui.npcSelector.options[window.ui.npcSelector.selectedIndex];
         if(currentOption && currentOption.textContent !== window.app.activeNPC.name) { // Use window.app reference
            currentOption.textContent = window.app.activeNPC.name; // Use window.app reference
         }
      }

      // If special language option forced a change...
      if (languagesModifiedBySpecialOption) {
          const wasUpdating = window.app.isUpdatingForm; // Use window.app reference
          window.app.isUpdatingForm = false; // Use window.app reference
          window.ui.updateFormFromActiveNPC();
          window.app.isUpdatingForm = wasUpdating; // Use window.app reference
      }

      window.ui.updateSpellcastingVisibility();

      // --- Save ---
      saveActiveBestiaryToDB(); // This now sets changesMadeSinceExport = true
   }

   // --- Settings Persistence ---
   async function loadSettings() {
      try {
         await db.open();
         console.log("Database opened successfully.");
         const firstUse = await db.settings.get('firstUseCompleted');
         if (!firstUse || !firstUse.value) window.app.openModal('first-use-modal'); // Use helper
         const unloadWarning = await db.settings.get('disableUnloadWarning');
         disableUnloadWarning = (unloadWarning && unloadWarning.value === true);
         window.app.disableUnloadWarning = disableUnloadWarning; // Use window.app reference
         if(window.ui.settingDisableUnloadWarning) window.ui.settingDisableUnloadWarning.checked = disableUnloadWarning;
      } catch (error) {
         console.error("Error loading settings or opening DB:", error);
         if (error.name === 'OpenFailedError') window.app.showAlert("Database could not be opened..."); // Use helper
         else if (error.name === 'VersionError') window.app.showAlert("Database version conflict..."); // Use helper
         else window.app.showAlert("Error loading application settings..."); // Use helper
         disableUnloadWarning = false;
         window.app.disableUnloadWarning = false; // Use window.app reference
         if (error.name !== 'OpenFailedError' && error.name !== 'VersionError') window.app.openModal('first-use-modal'); // Use helper
      }
   }

   async function markFirstUseComplete() {
      try { await db.settings.put({ key: 'firstUseCompleted', value: true }); }
      catch (error) { console.error("Error saving first use setting:", error); }
   }

   async function setDisableUnloadWarning(isDisabled) {
      try {
         await db.settings.put({ key: 'disableUnloadWarning', value: isDisabled });
         disableUnloadWarning = isDisabled;
         window.app.disableUnloadWarning = isDisabled; // Use window.app reference
      } catch (error) {
         console.error("Error saving unload warning setting:", error);
      }
   }

   // --- Before Unload Warning ---
   window.addEventListener('beforeunload', (event) => {
      if (changesMadeSinceExport && !disableUnloadWarning) {
         const message = "You have unsaved changes since your last export...";
         event.preventDefault();
         event.returnValue = message;
         return message;
      }
   });


   // --- INITIALIZATION ---
   window.ui.init();
   window.importer.init();
   loadSettings();
   window.ui.updateUIForActiveBestiary();

});