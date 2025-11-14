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
   let soloCardMode = false; // NEW global setting
   // NEW: Global Graphics Settings
   let settingConvertWebp = false;
   let settingWebpQuality = 80;
   let settingResizePortrait = false;
   let settingPortraitMaxWidth = 1000;
   let settingPortraitMaxHeight = 1000;
   let settingResizeToken = false;
   let settingTokenSize = 300;
   let settingResizeCameraToken = false; // For future use
   let settingCameraTokenMaxWidth = 1000; // For future use
   let settingCameraTokenMaxHeight = 1000; // For future use

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
      tokenInfo: null,
      imageInfo: null,
      cameraToken: "",
      cameraTokenInfo: null,
      nonId: "",
      damageThreshold: 0,
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
      soloCardMode, // NEW
      // NEW: Graphics Settings state
      settingConvertWebp,
      settingWebpQuality,
      settingResizePortrait,
      settingPortraitMaxWidth,
      settingPortraitMaxHeight,
      settingResizeToken,
      settingTokenSize,
      settingResizeCameraToken,
      settingCameraTokenMaxWidth,
      settingCameraTokenMaxHeight,
      currentlyEditingAction, // Keep state reference
      boilerplateTarget,      // Keep state reference
      confirmCallback,        // Keep state reference

      // Core Functions
      setDisableUnloadWarning,
      setSoloCardMode, // NEW
      // NEW: Graphics Settings setters
      setConvertWebp,
      setWebpQuality,
      setResizePortrait,
      setPortraitMaxWidth,
      setPortraitMaxHeight,
      setResizeToken,
      setTokenSize,
      setResizeCameraToken,
      setCameraTokenMaxWidth,
      setCameraTokenMaxHeight,
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
      calculateSpellcastingDCBonus: window.app.calculateSpellcastingDCBonus,
      calculateSpeedString: window.app.calculateSpeedString,
      calculateSensesString: window.app.calculateSensesString,
      calculateDamageModifiersString: window.app.calculateDamageModifiersString,
      calculateConditionImmunitiesString: window.app.calculateConditionImmunitiesString,
      calculateLanguagesString: window.app.calculateLanguagesString,
      calculateAllStats: window.app.calculateAllStats,
      calculateAllSkills: window.app.calculateAllSkills,
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
            pickOutTitles: true,
            soloCardMode: false, // Default to false
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

      const metadataPropsToConvert = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap', 'pickOutTitles'];
      metadataPropsToConvert.forEach(prop => {
         if (typeof bestiary.metadata[prop] === 'number') bestiary.metadata[prop] = bestiary.metadata[prop] === 1;
         else if (bestiary.metadata[prop] === undefined) bestiary.metadata[prop] = true; // Default to true
      });
      // Heal soloCardMode separately (default false)
      if (typeof bestiary.metadata.soloCardMode === 'number') bestiary.metadata.soloCardMode = bestiary.metadata.soloCardMode === 1;
      else if (bestiary.metadata.soloCardMode === undefined) bestiary.metadata.soloCardMode = false; // Default to false
      
      // NEW: Heal FG export fields
      if (bestiary.metadata.fgBestiaryTitle === undefined) bestiary.metadata.fgBestiaryTitle = null;
      if (bestiary.metadata.fgBestiaryAuthor === undefined) bestiary.metadata.fgBestiaryAuthor = null;
      if (bestiary.metadata.fgBestiaryFilename === undefined) bestiary.metadata.fgBestiaryFilename = null;
      if (bestiary.metadata.fgBestiaryDisplayname === undefined) bestiary.metadata.fgBestiaryDisplayname = null;
      if (bestiary.metadata.fgCoverImage === undefined) bestiary.metadata.fgCoverImage = null;
      if (bestiary.metadata.fgModLock === undefined) bestiary.metadata.fgModLock = false; // Default to false
      if (bestiary.metadata.fgGMonly === undefined) bestiary.metadata.fgGMonly = true; // Default to true


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
         // *** ADDED: Trait key migration ***
         healedNpc.traits.forEach(trait => {
            if (trait && trait.hasOwnProperty('description') && !trait.hasOwnProperty('desc')) {
               trait.desc = trait.description;
               delete trait.description;
            }
         });
         // *** End of Trait key migration ***
         if (healedNpc.sortTraitsAlpha === undefined) healedNpc.sortTraitsAlpha = defaultNPC.sortTraitsAlpha;
         if (typeof healedNpc.actions !== 'object' || healedNpc.actions === null) {
            healedNpc.actions = JSON.parse(JSON.stringify(defaultNPC.actions));
         } else {
            for (const key in defaultNPC.actions) {
               if (!Array.isArray(healedNpc.actions[key])) healedNpc.actions[key] = [];
            }
            // *** ADDED: Action key migration (ensure consistency) ***
            Object.values(healedNpc.actions).forEach(actionList => {
               if(Array.isArray(actionList)) {
                  actionList.forEach(action => {
                     if (action && action.hasOwnProperty('description') && !action.hasOwnProperty('desc')) {
                        action.desc = action.description;
                        delete action.description;
                     }
                  });
               }
            });
            // *** End of Action key migration ***
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

         if (healedNpc.tokenInfo === undefined) healedNpc.tokenInfo = null;
         if (healedNpc.imageInfo === undefined) healedNpc.imageInfo = null;
         if (healedNpc.cameraToken === undefined) healedNpc.cameraToken = "";
         if (healedNpc.cameraTokenInfo === undefined) healedNpc.cameraTokenInfo = null;
         if (healedNpc.nonId === undefined) healedNpc.nonId = "";
         if (healedNpc.damageThreshold === undefined) healedNpc.damageThreshold = 0;
         
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
      if (!window.app.activeBestiary) {
         window.app.showAlert("No active bestiary to export.");
         return;
      }
      // NEW: Open the modal instead of showing an alert
      if (window.ui.openFgExportModal) {
         window.ui.openFgExportModal();
      } else {
         console.error("openFgExportModal function not found on UI object.");
         window.app.showAlert("Error opening export settings. Function not found.");
      }
   }


   function updateActiveNPCFromForm() {
      if (window.app.isUpdatingForm || !window.app.activeNPC) return; // Use window.app references

      // --- Cache potentially changing values for comparison/calculation ---
      const oldProfBonus = window.app.activeNPC.proficiencyBonus;
      const oldAbilities = {
         strength: window.app.activeNPC.strength,
         dexterity: window.app.activeNPC.dexterity,
         constitution: window.app.activeNPC.constitution,
         intelligence: window.app.activeNPC.intelligence,
         wisdom: window.app.activeNPC.wisdom,
         charisma: window.app.activeNPC.charisma,
         innateAbility: window.app.activeNPC.innateAbility,
         traitCastingAbility: window.app.activeNPC.traitCastingAbility,
         actionCastingAbility: window.app.activeNPC.actionCastingAbility
      };
      const oldTraitCasterLevel = window.app.activeNPC.traitCastingLevel;


      // --- Name Validation ---
      const newName = window.ui.inputs.name.value.trim();
      if (!newName) {
          // If name is cleared, keep the old name temporarily to avoid errors
          // but visually show the input is empty until blur/save
          window.ui.inputs.name.value = ''; // Keep input visually empty
      } else if (newName.toLowerCase() !== (window.app.activeNPC.name || "").toLowerCase()) {
          const isDuplicate = window.app.activeBestiary.npcs.some((npc, index) =>
              index !== window.app.activeNPCIndex && npc.name.toLowerCase() === newName.toLowerCase()
          );
          if (isDuplicate) {
              window.app.showAlert(`An NPC named "${newName}" already exists. Please choose a unique name.`);
              window.ui.inputs.name.value = window.app.activeNPC.name; // Revert input value
              return; // Stop update if duplicate name attempt
          }
          window.app.activeNPC.name = newName;
      } else if (window.app.activeNPC.name !== newName) {
         // Handle case where only capitalization changed
         window.app.activeNPC.name = newName;
      }


      // --- Update Standard Properties ---
      for (const key in window.ui.inputs) {
         const element = window.ui.inputs[key];
         if (!element || key === 'name') continue; // Skip name, handled above
         if (key === 'description') {
            // Trix editor content update handled separately if needed
            const trixEditor = document.querySelector("trix-editor");
            if (trixEditor && trixEditor.editor) {
               window.app.activeNPC[key] = trixEditor.editor.getDocument().toString().trim() === "" ? "" : trixEditor.innerHTML;
            }
            continue;
         }
         if (key.startsWith('common') || key === 'attackDamageDice') continue; // Skip action editor fields
         if (key.startsWith('fg-')) continue; // NEW: Skip FG modal inputs
         if (key.startsWith('setting-')) continue; // NEW: Skip global settings inputs
         if (element.type === 'radio') { // Handle radio groups
            if(element.checked) {
               // Special handling for spellcasting placement
               if (element.name === 'spellcasting-placement') {
                  window.app.activeNPC.spellcastingPlacement = element.value;
               }
               // Add other radio groups here if needed
            }
            continue; // Move to next input after processing radio
         }

         const defaultValue = defaultNPC[key]; // Use local defaultNPC

         if (key.startsWith('innate-') || key.startsWith('trait-casting-') || key.startsWith('action-casting-') || key === 'hasInnateSpellcasting' || key === 'hasSpellcasting' || key === 'menuSoloCardMode') {
            // Spellcasting fields handled specifically later
         } else if (key.match(/^traitCastingList-\d$/) || key.match(/^traitCastingSlots-\d$/) || key === 'traitCastingMarked') {
             // Trait spell lists/slots handled later
         } else if (element.type === "checkbox") {
            window.app.activeNPC[key] = element.checked;
         } else if (element.tagName === 'SELECT' && element.multiple) {
            // Skip language listboxes, handled separately
         } else if (element.tagName === 'SELECT') {
            const customToggle = document.getElementById(`toggle-custom-${key}`);
            if (customToggle?.checked) {
               const customInput = document.getElementById(`npc-${key}-custom`);
               window.app.activeNPC[key] = customInput ? customInput.value.trim() : (defaultValue !== undefined ? defaultValue : "");
            } else {
               window.app.activeNPC[key] = element.value !== "" ? element.value : (defaultValue !== undefined ? defaultValue : "");
            }
         } else if (element.type === "number") {
            const parsedValue = parseInt(element.value, 10);
            window.app.activeNPC[key] = isNaN(parsedValue) ? (defaultValue !== undefined ? defaultValue : 0) : parsedValue;
         } else { // Text inputs
            window.app.activeNPC[key] = element.value.trim() !== "" ? element.value : (defaultValue !== undefined ? defaultValue : "");
         }
      }


      // --- Update Proficiency Bonus & Experience ---
      const newProfBonus = window.app.calculateProficiencyBonus(window.app.activeNPC.challenge);
      const newExperience = window.app.crToXpMap[window.app.activeNPC.challenge] || '0'; // <-- FIX: Calculate XP
      let profBonusChanged = false;
      if (newProfBonus !== oldProfBonus) {
         window.app.activeNPC.proficiencyBonus = newProfBonus;
         profBonusChanged = true;
      }
      window.app.activeNPC.experience = newExperience; // <-- FIX: Save XP


      // --- Recalculate Ability Bonuses ---
      let abilityScoresChanged = false;
      const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
      abilities.forEach(ability => {
         if(window.app.activeNPC[ability] !== oldAbilities[ability]) {
            abilityScoresChanged = true;
         }
         const newBonus = window.app.calculateAbilityBonus(window.app.activeNPC[ability]);
         if (newBonus !== window.app.activeNPC[`${ability}Bonus`]) {
            window.app.activeNPC[`${ability}Bonus`] = newBonus;
            // No need to set abilityScoresChanged here, direct score change covers it
         }
      });

      // --- Innate Spellcasting fields ---
      window.app.activeNPC.hasInnateSpellcasting = window.ui.inputs.hasInnateSpellcasting?.checked ?? false;
      window.app.activeNPC.innateIsPsionics = window.ui.inputs.innateIsPsionics?.checked ?? false;
      window.app.activeNPC.innateAbility = window.ui.inputs.innateAbility?.value ?? defaultNPC.innateAbility;
      window.app.activeNPC.innateComponents = window.ui.inputs.innateComponents?.value ?? defaultNPC.innateComponents;
      const innateAbilityChanged = window.app.activeNPC.innateAbility !== oldAbilities.innateAbility;
      const innateDCInputVal = parseInt(window.ui.inputs.innateDC?.value, 10);
      const { dc: newInnateCalculatedDC } = window.app.calculateSpellcastingDCBonus(window.app.activeNPC.innateAbility, newProfBonus, window.app.activeNPC);
      // Save input value if it's NOT the calculated default, otherwise clear it to allow auto-calc
      window.app.activeNPC.innateDC = (!isNaN(innateDCInputVal) && innateDCInputVal !== newInnateCalculatedDC) ? innateDCInputVal : undefined;
      // Populate spell list array
      window.app.activeNPC.innateSpells = [];
      for (let i = 0; i < 4; i++) {
         const freq = window.ui.inputs[`innate-freq-${i}`]?.value ?? '';
         const list = window.ui.inputs[`innate-list-${i}`]?.value ?? '';
         window.app.activeNPC.innateSpells.push({ freq, list });
      }

      // --- Spellcasting fields ---
      window.app.activeNPC.hasSpellcasting = window.ui.inputs.hasSpellcasting?.checked ?? false;
      // spellcastingPlacement already updated via radio button listener

      // --- Trait-based Spellcasting fields ---
      window.app.activeNPC.traitCastingLevel = window.ui.inputs.traitCastingLevel?.value ?? defaultNPC.traitCastingLevel;
      window.app.activeNPC.traitCastingAbility = window.ui.inputs.traitCastingAbility?.value ?? defaultNPC.traitCastingAbility;
      window.app.activeNPC.traitCastingClass = window.ui.inputs.traitCastingClass?.value ?? defaultNPC.traitCastingClass;
      window.app.activeNPC.traitCastingFlavor = window.ui.inputs.traitCastingFlavor?.value ?? defaultNPC.traitCastingFlavor;
      window.app.activeNPC.traitCastingMarked = window.ui.inputs.traitCastingMarked?.value ?? defaultNPC.traitCastingMarked;
      const traitAbilityChanged = window.app.activeNPC.traitCastingAbility !== oldAbilities.traitCastingAbility;
      const traitLevelChanged = window.app.activeNPC.traitCastingLevel !== oldTraitCasterLevel;
      const traitDCInputVal = parseInt(window.ui.inputs.traitCastingDC?.value, 10);
      const traitBonusInputVal = parseInt(window.ui.inputs.traitCastingBonus?.value, 10);
      const { dc: newTraitCalculatedDC, bonus: newTraitCalculatedBonus } = window.app.calculateSpellcastingDCBonus(window.app.activeNPC.traitCastingAbility, newProfBonus, window.app.activeNPC);
      // Save input values if they differ from calculated, otherwise clear
      window.app.activeNPC.traitCastingDC = (!isNaN(traitDCInputVal) && traitDCInputVal !== newTraitCalculatedDC) ? traitDCInputVal : undefined;
      window.app.activeNPC.traitCastingBonus = (!isNaN(traitBonusInputVal) && traitBonusInputVal !== newTraitCalculatedBonus) ? traitBonusInputVal : undefined;
      // Populate spell list/slot arrays
      window.app.activeNPC.traitCastingList = [];
      window.app.activeNPC.traitCastingSlots = [];
      for (let i = 0; i <= 9; i++) {
         const list = window.ui.inputs[`traitCastingList-${i}`]?.value ?? '';
         window.app.activeNPC.traitCastingList.push(list);
         if (i > 0) { // Slots 1-9
            const slots = window.ui.inputs[`traitCastingSlots-${i}`]?.value ?? '0';
            window.app.activeNPC.traitCastingSlots.push(slots);
         }
      }

      // --- Action-based Spellcasting fields ---
      window.app.activeNPC.actionCastingAbility = window.ui.inputs.actionCastingAbility?.value ?? defaultNPC.actionCastingAbility;
      window.app.activeNPC.actionCastingComponents = window.ui.inputs.actionCastingComponents?.value ?? defaultNPC.actionCastingComponents;
      const actionAbilityChanged = window.app.activeNPC.actionCastingAbility !== oldAbilities.actionCastingAbility;
      const actionDCInputVal = parseInt(window.ui.inputs.actionCastingDC?.value, 10);
      const { dc: newActionCalculatedDC } = window.app.calculateSpellcastingDCBonus(window.app.activeNPC.actionCastingAbility, newProfBonus, window.app.activeNPC);
      // Save input value if different from calculated
      window.app.activeNPC.actionCastingDC = (!isNaN(actionDCInputVal) && actionDCInputVal !== newActionCalculatedDC) ? actionDCInputVal : undefined;
      // Populate spell list array
      window.app.activeNPC.actionCastingSpells = [];
      for (let i = 0; i < 4; i++) {
         const freq = window.ui.inputs[`action-casting-freq-${i}`]?.value ?? '';
         const list = window.ui.inputs[`action-casting-list-${i}`]?.value ?? '';
         window.app.activeNPC.actionCastingSpells.push({ freq, list });
      }


      // --- Languages ---
      let languagesModifiedBySpecialOption = false;
      const specialOption = parseInt(document.getElementById('npc-special-language-option')?.value || '0', 10);
      window.app.activeNPC.specialLanguageOption = specialOption;

      if (specialOption === 1 || specialOption === 2 || specialOption === 3 || specialOption === 5 || specialOption === 6) {
          // If a special option overrides selection, clear the selected languages array
          if (window.app.activeNPC.selectedLanguages?.length > 0) {
              window.app.activeNPC.selectedLanguages = [];
              languagesModifiedBySpecialOption = true; // Flag that we changed languages due to the dropdown
          }
      } else {
          // Otherwise, read selected languages from listboxes
          const selectedLanguages = new Set();
          window.ui.languageListboxes.forEach(listbox => {
              if (listbox) {
                  Array.from(listbox.selectedOptions).forEach(option => {
                      selectedLanguages.add(option.value);
                  });
              }
          });
          // Update only if the set of languages actually changed
          const currentSelected = new Set(window.app.activeNPC.selectedLanguages || []);
          if (selectedLanguages.size !== currentSelected.size || [...selectedLanguages].some(lang => !currentSelected.has(lang))) {
              window.app.activeNPC.selectedLanguages = Array.from(selectedLanguages);
          }
      }
      window.app.activeNPC.hasTelepathy = document.getElementById('npc-has-telepathy')?.checked || false;
      window.app.activeNPC.telepathyRange = parseInt(document.getElementById('npc-telepathy-range')?.value || '0', 10);


      // --- Viewport Options ---
      for (const key in window.ui.npcSettingsCheckboxes) {
         window.app.activeNPC[key] = window.ui.npcSettingsCheckboxes[key]?.checked ?? true;
      }


      // --- Saves & Skills (Proficiency/Expertise/Adjustment) ---
      abilities.forEach(ability => {
         window.app.activeNPC[`${ability}SavingThrowProf`] = document.getElementById(`npc-${ability}-saving-throw-prof`)?.checked || false;
         const adjustVal = parseInt(document.getElementById(`npc-${ability}-saving-throw-adjust`)?.value || '0', 10);
         window.app.activeNPC[`${ability}SavingThrowAdjust`] = isNaN(adjustVal) ? 0 : adjustVal;
      });
      window.app.skills.forEach(skill => {
         window.app.activeNPC[`skill_${skill.id}_prof`] = document.getElementById(`skill-${skill.id}-prof`)?.checked || false;
         window.app.activeNPC[`skill_${skill.id}_exp`] = document.getElementById(`skill-${skill.id}-exp`)?.checked || false;
         const adjustVal = parseInt(document.getElementById(`skill-${skill.id}-adjust`)?.value || '0', 10);
         window.app.activeNPC[`skill_${skill.id}_adjust`] = isNaN(adjustVal) ? 0 : adjustVal;
      });

      // --- Resistances/Immunities ---
      window.app.damageTypes.forEach(type => {
         window.app.activeNPC[`vulnerability_${type}`] = document.getElementById(`vuln-${type}`)?.checked || false;
         window.app.activeNPC[`resistance_${type}`] = document.getElementById(`res-${type}`)?.checked || false;
         window.app.activeNPC[`immunity_${type}`] = document.getElementById(`imm-${type}`)?.checked || false;
      });
      window.app.conditions.forEach(condition => {
         window.app.activeNPC[`ci_${condition}`] = document.getElementById(`ci-${condition}`)?.checked || false;
      });
      const weaponResRadio = document.querySelector('input[name="weapon-resistance"]:checked');
      window.app.activeNPC.weaponResistance = weaponResRadio ? weaponResRadio.value : 'none';
      const weaponImmRadio = document.querySelector('input[name="weapon-immunity"]:checked');
      window.app.activeNPC.weaponImmunity = weaponImmRadio ? weaponImmRadio.value : 'none';


      // --- Recalculate derived stats ---
      window.app.calculateAllStats(); // Recalculates bonuses, saves str, skills str, passive P, speed str


      // --- Recalculate spellcasting DC/Bonus if needed ---
      const needsInnateRecalc = profBonusChanged || innateAbilityChanged;
      const needsTraitRecalc = profBonusChanged || traitAbilityChanged || traitLevelChanged;
      const needsActionRecalc = profBonusChanged || actionAbilityChanged;

      // Update stored calculated values *only if* the user hasn't overridden them
      if (needsInnateRecalc && window.app.activeNPC.innateDC === undefined) {
         window.ui.inputs.innateDC.value = newInnateCalculatedDC; // Update display directly
      }
      if (needsTraitRecalc) {
         if (window.app.activeNPC.traitCastingDC === undefined) {
            window.ui.inputs.traitCastingDC.value = newTraitCalculatedDC;
         }
         if (window.app.activeNPC.traitCastingBonus === undefined) {
            window.ui.inputs.traitCastingBonus.value = newTraitCalculatedBonus;
         }
      }
      if (needsActionRecalc && window.app.activeNPC.actionCastingDC === undefined) {
         window.ui.inputs.actionCastingDC.value = newActionCalculatedDC;
      }


      // --- Final UI Updates ---
      window.ui.updateStatDisplays(); // Update bonuses, save totals
      window.ui.updateSkillDisplays(); // Update skill totals

      // --- FIX: Update XP and Prof Bonus displays on info card ---
      if (window.ui.experienceDisplay) window.ui.experienceDisplay.textContent = window.app.activeNPC.experience || '';
      if (window.ui.proficiencyBonusDisplay) window.ui.proficiencyBonusDisplay.textContent = `+${window.app.activeNPC.proficiencyBonus}` || '+2';
      // --- END FIX ---

      window.viewport.updateViewport(); // Update stat block preview

      // Update name in selector dropdown if it changed
      if(window.ui.npcSelector && window.ui.npcSelector.selectedIndex >= 0) {
         const currentOption = window.ui.npcSelector.options[window.ui.npcSelector.selectedIndex];
         if(currentOption && currentOption.textContent !== window.app.activeNPC.name) {
            currentOption.textContent = window.app.activeNPC.name;
         }
      }

      // If special language option forced a change, refresh the form's language section
      if (languagesModifiedBySpecialOption) {
          const wasUpdating = window.app.isUpdatingForm;
          window.app.isUpdatingForm = true; // Prevent loop
          window.ui.populateLanguageListbox('language-list-standard', window.app.standardLanguages, []);
          window.ui.populateLanguageListbox('language-list-exotic', window.app.exoticLanguages, []);
          window.ui.populateLanguageListbox('language-list-monstrous1', window.app.monstrousLanguages1, []);
          window.ui.populateLanguageListbox('language-list-monstrous2', window.app.monstrousLanguages2, []);
          window.ui.populateLanguageListbox('language-list-user', window.app.activeBestiary?.metadata?.userDefinedLanguages || [], []);
          window.app.isUpdatingForm = wasUpdating;
      }

      window.ui.updateSpellcastingVisibility(); // Update visibility based on checkbox states

      // --- Save ---
      saveActiveBestiaryToDB(); // This now sets changesMadeSinceExport = true
   }


   // --- Settings Persistence ---
   
   // --- NEW: Helper to load and save a setting ---
   /**
    * Fetches a setting from DB, applies default, and saves default if not present.
    * @param {string} key - The setting key.
    * @param {*} defaultValue - The default value if not found.
    * @param {string} [globalVarName] - The name of the global variable in window.app to update.
    * @param {HTMLElement} [uiElement] - The UI element to update.
    */
   async function loadAndSetSetting(key, defaultValue, globalVarName, uiElement) {
      let setting = await db.settings.get(key);
      let value;

      if (setting === undefined) {
         value = defaultValue;
         // Save the default back to Dexie if it wasn't found
         await db.settings.put({ key, value });
      } else {
         value = setting.value;
      }

      // Update the global state
      if (globalVarName) {
         window.app[globalVarName] = value;
         
         // Dynamically update the local-scope variable if it exists
         // This relies on local variable names matching globalVarName
         try {
            if (eval(`typeof ${globalVarName}`) !== 'undefined') {
               eval(`${globalVarName} = value;`);
            }
         } catch (e) {
             console.warn(`Could not set local-scope variable ${globalVarName}:`, e);
         }
      }
      
      // Update the UI
      if (uiElement) {
         if (uiElement.type === 'checkbox') {
            uiElement.checked = value;
         } else {
            uiElement.value = value;
         }
      }
   }
   
   async function loadSettings() {
      try {
         await db.open();
         console.log("Database opened successfully.");

         // --- Load settings using the new helper ---
         const firstUseSetting = await db.settings.get('firstUseCompleted');
         if (!firstUseSetting || !firstUseSetting.value) {
            window.app.openModal('first-use-modal');
            // Don't save default for firstUse, let user action do it
         }

         await loadAndSetSetting('disableUnloadWarning', false, 'disableUnloadWarning', window.ui.settingDisableUnloadWarning);
         await loadAndSetSetting('soloCardMode', false, 'soloCardMode', window.ui.settingSoloCardMode);
         if (window.ui.menuSoloCardMode) window.ui.menuSoloCardMode.checked = window.app.soloCardMode; // Sync menu

         // --- Graphics Settings ---
         await loadAndSetSetting('settingConvertWebp', false, 'settingConvertWebp', window.ui.inputs.settingConvertWebp);
         await loadAndSetSetting('settingWebpQuality', 80, 'settingWebpQuality', window.ui.inputs.settingWebpQuality);
         await loadAndSetSetting('settingResizePortrait', false, 'settingResizePortrait', window.ui.inputs.settingResizePortrait);
         await loadAndSetSetting('settingPortraitMaxWidth', 1000, 'settingPortraitMaxWidth', window.ui.inputs.settingPortraitMaxWidth);
         await loadAndSetSetting('settingPortraitMaxHeight', 1000, 'settingPortraitMaxHeight', window.ui.inputs.settingPortraitMaxHeight);
         await loadAndSetSetting('settingResizeToken', false, 'settingResizeToken', window.ui.inputs.settingResizeToken);
         await loadAndSetSetting('settingTokenSize', 300, 'settingTokenSize', window.ui.inputs.settingTokenSize);
         await loadAndSetSetting('settingResizeCameraToken', false, 'settingResizeCameraToken', window.ui.inputs.settingResizeCameraToken);
         await loadAndSetSetting('settingCameraTokenMaxWidth', 1000, 'settingCameraTokenMaxWidth', window.ui.inputs.settingCameraTokenMaxWidth);
         await loadAndSetSetting('settingCameraTokenMaxHeight', 1000, 'settingCameraTokenMaxHeight', window.ui.inputs.settingCameraTokenMaxHeight);
         // --- End Graphics Settings ---

      } catch (error) {
         console.error("Error loading settings or opening DB:", error);
         if (error.name === 'OpenFailedError') window.app.showAlert("Database could not be opened..."); // Use helper
         else if (error.name === 'VersionError') window.app.showAlert("Database version conflict..."); // Use helper
         else window.app.showAlert("Error loading application settings..."); // Use helper
         
         // Manually set all defaults on error
         disableUnloadWarning = false; window.app.disableUnloadWarning = false;
         soloCardMode = false; window.app.soloCardMode = false;
         settingConvertWebp = false; window.app.settingConvertWebp = false;
         settingWebpQuality = 80; window.app.settingWebpQuality = 80;
         settingResizePortrait = false; window.app.settingResizePortrait = false;
         settingPortraitMaxWidth = 1000; window.app.settingPortraitMaxWidth = 1000;
         settingPortraitMaxHeight = 1000; window.app.settingPortraitMaxHeight = 1000;
         settingResizeToken = false; window.app.settingResizeToken = false;
         settingTokenSize = 300; window.app.settingTokenSize = 300;
         settingResizeCameraToken = false; window.app.settingResizeCameraToken = false;
         settingCameraTokenMaxWidth = 1000; window.app.settingCameraTokenMaxWidth = 1000;
         settingCameraTokenMaxHeight = 1000; window.app.settingCameraTokenMaxHeight = 1000;

         if (error.name !== 'OpenFailedError' && error.name !== 'VersionError') window.app.openModal('first-use-modal'); // Use helper
      }
   }

   async function markFirstUseComplete() {
      try { await db.settings.put({ key: 'firstUseCompleted', value: true }); }
      catch (error) { console.error("Error saving first use setting:", error); }
   }

   // --- NEW: Generic Setting Saver ---
   async function saveSetting(key, value) {
      try {
         await db.settings.put({ key, value });
         // Update the global state variable
         if (window.app.hasOwnProperty(key)) {
            window.app[key] = value;
         } else {
            console.warn(`Global state key ${key} not found in window.app.`);
         }
      } catch (error) {
         console.error(`Error saving setting ${key}:`, error);
      }
   }

   async function setDisableUnloadWarning(isDisabled) {
      disableUnloadWarning = isDisabled; // Update local scope
      await saveSetting('disableUnloadWarning', isDisabled);
   }
   
   async function setSoloCardMode(isEnabled) {
      soloCardMode = isEnabled; // Update local scope
      await saveSetting('soloCardMode', isEnabled);
      // Sync both checkboxes
      if (window.ui.settingSoloCardMode) window.ui.settingSoloCardMode.checked = isEnabled;
      if (window.ui.menuSoloCardMode) window.ui.menuSoloCardMode.checked = isEnabled;
   }

   // --- NEW: Graphics Settings Savers ---
   async function setConvertWebp(isEnabled) {
      settingConvertWebp = isEnabled; // Update local scope
      await saveSetting('settingConvertWebp', isEnabled);
   }
   async function setResizePortrait(isEnabled) {
      settingResizePortrait = isEnabled; // Update local scope
      await saveSetting('settingResizePortrait', isEnabled);
   }
   async function setResizeToken(isEnabled) {
      settingResizeToken = isEnabled; // Update local scope
      await saveSetting('settingResizeToken', isEnabled);
   }
   async function setResizeCameraToken(isEnabled) {
      settingResizeCameraToken = isEnabled; // Update local scope
      await saveSetting('settingResizeCameraToken', isEnabled);
   }
   
   // Number value setters
   async function setWebpQuality(value) {
      const numValue = parseInt(value, 10) || 80;
      settingWebpQuality = numValue; // Update local scope
      await saveSetting('settingWebpQuality', numValue);
   }
   async function setPortraitMaxWidth(value) {
      const numValue = parseInt(value, 10) || 1000;
      settingPortraitMaxWidth = numValue; // Update local scope
      await saveSetting('settingPortraitMaxWidth', numValue);
   }
   async function setPortraitMaxHeight(value) {
      const numValue = parseInt(value, 10) || 1000;
      settingPortraitMaxHeight = numValue; // Update local scope
      await saveSetting('settingPortraitMaxHeight', numValue);
   }
   async function setTokenSize(value) {
      const numValue = parseInt(value, 10) || 300;
      settingTokenSize = numValue; // Update local scope
      await saveSetting('settingTokenSize', numValue);
   }
   async function setCameraTokenMaxWidth(value) {
      const numValue = parseInt(value, 10) || 1000;
      settingCameraTokenMaxWidth = numValue; // Update local scope
      await saveSetting('settingCameraTokenMaxWidth', numValue);
   }
   async function setCameraTokenMaxHeight(value) {
      const numValue = parseInt(value, 10) || 1000;
      settingCameraTokenMaxHeight = numValue; // Update local scope
      await saveSetting('settingCameraTokenMaxHeight', numValue);
   }
   // --- END Graphics Settings Savers ---


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
   // window.fgExporter.init(); // This is now called from export-fg.js itself
   loadSettings();
   window.ui.updateUIForActiveBestiary();

});