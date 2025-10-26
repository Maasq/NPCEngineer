// main.js
document.addEventListener("DOMContentLoaded", () => {

	// --- DATABASE SETUP ---
	const db = new Dexie('npcEngineerDB');
	db.version(1).stores({
		projects: '++id, projectName' // NOTE: This is kept as 'projects' for backward compatibility.
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
	let currentlyEditingAction = null;
	let boilerplateTarget = null;
	let confirmCallback = null; // Store callback for confirmation dialog

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
		// innateBonus: 2, // REMOVED
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
		// --- ACTION-BASED SPELLCASTING PROPERTIES (NEW) ---
		actionCastingAbility: 'intelligence', // Default different from innate
		actionCastingDC: 10, // Placeholder
		// actionCastingBonus: 2, // REMOVED
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
	window.app = {
		db,
		damageTypes,
		standardLanguages,
		exoticLanguages,
		monstrousLanguages1,
		monstrousLanguages2,
		allPredefinedLanguages,
		conditions,
		skills,
		activeBestiary,
		activeNPC,
		activeNPCIndex,
		isUpdatingForm,
		defaultNPC,
		crToXpMap,
		challengeOrder,
		pronounSets,
		processTraitString,
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
		calculateAbilityBonus,
		calculateProficiencyBonus,
		calculateSpeedString,
		calculateSensesString,
		calculateDamageModifiersString,
		calculateConditionImmunitiesString,
		calculateLanguagesString,
		calculateAllStats,
		calculateAllSkills,
		calculateSpellcastingDCBonus, // Generic function
		// Action functions
		addOrUpdateAction,
		editAction,
		clearInputs,
		openModal,
		closeModal,
		showAlert,
		showConfirm,
		handleAttackHelperOpen,
		parseAttackString,
		populateAttackHelper,
		editBoilerplate,
		saveBoilerplate,
		addDamageRow,
		generateAttackString,
		createDiceSelector,
		updateDiceString,
		updateBonus
	};


	// --- FUNCTIONS ---

	function processTraitString(text, npc) {
		if (!text || !npc) return text;

		const name = npc.name || "creature";
		const gender = npc.gender || "creature";
		const isUnique = npc.isUnique || false;
		const isProperName = npc.isProperName || false;
		const pronouns = pronounSets[gender] || pronounSets.creature;

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

	function findUniqueNpcName(baseName) {
		if (!app.activeBestiary) return baseName;
		let newName = baseName;
		let counter = 1;
		while (app.activeBestiary.npcs.some(npc => npc.name.toLowerCase() === newName.toLowerCase())) {
			counter++;
			newName = `${baseName} ${counter}`;
		}
		return newName;
	}

	// --- Bestiary Management ---

	async function createNewBestiary() {
		const bestiaryName = window.ui.newBestiaryNameInput.value.trim();
		if (!bestiaryName) {
			showAlert("Bestiary name cannot be empty.");
			return;
		}
		const existingBestiary = await app.db.projects.where('projectName').equalsIgnoreCase(bestiaryName).first();
		if (existingBestiary) {
			showAlert(`A bestiary named "${bestiaryName}" already exists. Please choose a unique name.`);
			return;
		}

		const newBestiary = {
			projectName: bestiaryName,
			metadata: {
				createdAt: new Date(),
				addDescription: true, addTitle: true, addImageLink: true, useDropCap: true,
				fg_groups: [], userDefinedLanguages: [], savedTraits: []
			},
			npcs: [{ ...app.defaultNPC, name: "New NPC", fg_group: bestiaryName }]
		};

		try {
			const newId = await app.db.projects.add(newBestiary);
			newBestiary.id = newId;
			loadBestiary(newBestiary);
			window.ui.hideAllModals();
			window.ui.newBestiaryNameInput.value = "";
		} catch (error) {
			console.error("Failed to create bestiary:", error);
			showAlert("Error: Could not create bestiary. Check console for details.");
		}
	}

	function healBestiary(bestiary) {
		// --- Metadata Healing ---
		if (typeof bestiary.metadata !== 'object' || bestiary.metadata === null) bestiary.metadata = {};
		if (!Array.isArray(bestiary.metadata.userDefinedLanguages)) bestiary.metadata.userDefinedLanguages = [];
		if (!Array.isArray(bestiary.metadata.savedTraits)) bestiary.metadata.savedTraits = [];
		if (!Array.isArray(bestiary.metadata.fg_groups)) bestiary.metadata.fg_groups = []; // Ensure fg_groups exists

		const metadataPropsToConvert = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap'];
		metadataPropsToConvert.forEach(prop => {
			if (typeof bestiary.metadata[prop] === 'number') bestiary.metadata[prop] = bestiary.metadata[prop] === 1; // Convert 1/0 to true/false
			else if (bestiary.metadata[prop] === undefined) bestiary.metadata[prop] = true; // Default to true if missing
		});

		// --- NPC Healing ---
		if (!Array.isArray(bestiary.npcs)) bestiary.npcs = [];

		let unnamedCounter = 1;
		bestiary.npcs = bestiary.npcs.map((npc, index) => { // Added index for unique name check
			if (typeof npc !== 'object' || npc === null) {
				console.warn("Found corrupt NPC data, replacing with default.");
				return { ...app.defaultNPC, name: findUniqueNpcName("Recovered Corrupt NPC") };
			}

			// Start with defaults, then overlay npc data
			const healedNpc = { ...app.defaultNPC, ...npc };

			// Heal NPC-specific viewport settings (boolean conversion & defaults)
			const npcPropsToConvert = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap'];
			npcPropsToConvert.forEach(prop => {
				if (typeof healedNpc[prop] === 'number') healedNpc[prop] = healedNpc[prop] === 1;
				// If missing on NPC, inherit from bestiary metadata default
				else if (healedNpc[prop] === undefined) healedNpc[prop] = bestiary.metadata[prop];
			});

			// Ensure arrays and required properties exist with defaults
			if (!Array.isArray(healedNpc.selectedLanguages)) healedNpc.selectedLanguages = [];
			if (healedNpc.specialLanguageOption === undefined) healedNpc.specialLanguageOption = app.defaultNPC.specialLanguageOption;
			if (healedNpc.hasTelepathy === undefined) healedNpc.hasTelepathy = app.defaultNPC.hasTelepathy;
			if (healedNpc.telepathyRange === undefined) healedNpc.telepathyRange = app.defaultNPC.telepathyRange;

			if (!Array.isArray(healedNpc.traits)) healedNpc.traits = [];
			if (healedNpc.sortTraitsAlpha === undefined) healedNpc.sortTraitsAlpha = app.defaultNPC.sortTraitsAlpha;

			// Heal Actions structure
			if (typeof healedNpc.actions !== 'object' || healedNpc.actions === null) {
				healedNpc.actions = JSON.parse(JSON.stringify(app.defaultNPC.actions)); // Deep copy default structure
			} else {
				// Ensure all action type arrays exist
				for (const key in app.defaultNPC.actions) {
					if (!Array.isArray(healedNpc.actions[key])) healedNpc.actions[key] = [];
				}
			}
			if (healedNpc.legendaryBoilerplate === undefined) healedNpc.legendaryBoilerplate = app.defaultNPC.legendaryBoilerplate;
			if (healedNpc.lairBoilerplate === undefined) healedNpc.lairBoilerplate = app.defaultNPC.lairBoilerplate;

			// --- INNATE SPELLCASTING HEALING ---
			if (healedNpc.hasInnateSpellcasting === undefined) healedNpc.hasInnateSpellcasting = app.defaultNPC.hasInnateSpellcasting;
			if (healedNpc.innateIsPsionics === undefined) healedNpc.innateIsPsionics = app.defaultNPC.innateIsPsionics;
			if (healedNpc.innateAbility === undefined) healedNpc.innateAbility = app.defaultNPC.innateAbility;
			if (healedNpc.innateDC === undefined) healedNpc.innateDC = undefined; // Let it be calculated on load if missing
			// if (healedNpc.innateBonus === undefined) healedNpc.innateBonus = undefined; // REMOVED
			if (healedNpc.innateComponents === undefined) healedNpc.innateComponents = app.defaultNPC.innateComponents;
			// Heal spell array structure (ensure 4 slots, copy defaults if needed)
			const defaultInnateSpellsLength = app.defaultNPC.innateSpells.length;
			if (!Array.isArray(healedNpc.innateSpells)) {
				healedNpc.innateSpells = JSON.parse(JSON.stringify(app.defaultNPC.innateSpells));
			} else {
				// Add missing slots
				while(healedNpc.innateSpells.length < defaultInnateSpellsLength) healedNpc.innateSpells.push({ freq: "", list: ""});
				// Remove extra slots
				if (healedNpc.innateSpells.length > defaultInnateSpellsLength) healedNpc.innateSpells = healedNpc.innateSpells.slice(0, defaultInnateSpellsLength);
				// Ensure each slot has freq/list, using defaults if missing
				healedNpc.innateSpells = healedNpc.innateSpells.map((spellSlot, slotIndex) => { // Changed variable name
					const defaultSlot = app.defaultNPC.innateSpells[slotIndex] || { freq: "", list: "" };
					return {
						freq: spellSlot?.freq ?? defaultSlot.freq,
						list: spellSlot?.list ?? defaultSlot.list
					};
				});
			}

			// --- REGULAR SPELLCASTING HEALING ---
			if (healedNpc.hasSpellcasting === undefined) healedNpc.hasSpellcasting = app.defaultNPC.hasSpellcasting;
			if (healedNpc.spellcastingPlacement === undefined) healedNpc.spellcastingPlacement = app.defaultNPC.spellcastingPlacement;

			// --- ACTION-BASED SPELLCASTING HEALING (NEW) ---
			if (healedNpc.actionCastingAbility === undefined) healedNpc.actionCastingAbility = app.defaultNPC.actionCastingAbility;
			if (healedNpc.actionCastingDC === undefined) healedNpc.actionCastingDC = undefined; // Let it calculate
			// if (healedNpc.actionCastingBonus === undefined) healedNpc.actionCastingBonus = undefined; // REMOVED
			if (healedNpc.actionCastingComponents === undefined) healedNpc.actionCastingComponents = app.defaultNPC.actionCastingComponents;
			// Heal the actionCastingSpells array structure
			const defaultActionSpellsLength = app.defaultNPC.actionCastingSpells.length;
			if (!Array.isArray(healedNpc.actionCastingSpells)) {
				healedNpc.actionCastingSpells = JSON.parse(JSON.stringify(app.defaultNPC.actionCastingSpells));
			} else {
				while(healedNpc.actionCastingSpells.length < defaultActionSpellsLength) healedNpc.actionCastingSpells.push({ freq: "", list: ""});
				if (healedNpc.actionCastingSpells.length > defaultActionSpellsLength) healedNpc.actionCastingSpells = healedNpc.actionCastingSpells.slice(0, defaultActionSpellsLength);
				healedNpc.actionCastingSpells = healedNpc.actionCastingSpells.map((spellSlot, slotIndex) => { // Changed variable name
					const defaultSlot = app.defaultNPC.actionCastingSpells[slotIndex] || { freq: "", list: "" };
					return {
						freq: spellSlot?.freq ?? defaultSlot.freq,
						list: spellSlot?.list ?? defaultSlot.list
					};
				});
			}

			// Heal FG Group (default to bestiary name if missing or invalid)
			const allValidGroups = [bestiary.projectName, ...(bestiary.metadata.fg_groups || [])];
			if (!healedNpc.fg_group || !allValidGroups.includes(healedNpc.fg_group)) {
				healedNpc.fg_group = bestiary.projectName;
			}

			// Assign unique name if needed
			if (!healedNpc.name || healedNpc.name.trim() === "") {
				let uniqueName = `Unnamed NPC`;
				if (unnamedCounter > 1) uniqueName += ` ${unnamedCounter}`;
				// Check against the *original* list before this map potentially renames others
				while (bestiary.npcs.some((n, i) => i !== index && n.name === uniqueName)) { // Use original index 'index'
					unnamedCounter++;
					uniqueName = `Unnamed NPC ${unnamedCounter}`;
				}
				healedNpc.name = uniqueName;
			}
			return healedNpc;
		});

		// Ensure at least one NPC exists
		if (bestiary.npcs.length === 0) {
			console.warn("Bestiary had no valid NPCs, adding a default one.");
			bestiary.npcs.push({ ...app.defaultNPC, name: "New NPC", fg_group: bestiary.projectName });
		}

		return bestiary;
	}


	function loadBestiary(bestiary) {
		try {
			// Deep clone before healing to avoid modifying the original object reference
			const clonedBestiary = JSON.parse(JSON.stringify(bestiary));
			const healedBestiary = healBestiary(clonedBestiary);
			app.activeBestiary = healedBestiary;
			sortAndSwitchToNpc(null); // Sort and select the first NPC
			window.ui.updateUIForActiveBestiary(); // Update the entire UI based on the loaded bestiary
		} catch (error) {
			console.error("Critical error loading bestiary:", error);
			showAlert("There was a critical error trying to load this bestiary. It may be corrupt. Check the console for details.");
			// Reset state if loading fails
			app.activeBestiary = null;
			app.activeNPC = null;
			app.activeNPCIndex = -1;
			window.ui.updateUIForActiveBestiary(); // Update UI to reflect no bestiary loaded
		}
	}

	function switchActiveNPC(index) {
		if (app.activeBestiary && index >= 0 && index < app.activeBestiary.npcs.length) {
			app.activeNPCIndex = index;
			app.activeNPC = app.activeBestiary.npcs[index];
			window.ui.updateFormFromActiveNPC(); // Load selected NPC data into the form
		} else if (app.activeBestiary && app.activeBestiary.npcs.length > 0) {
			// Fallback to the first NPC if index is invalid but NPCs exist
			app.activeNPCIndex = 0;
			app.activeNPC = app.activeBestiary.npcs[0];
			window.ui.updateFormFromActiveNPC();
		} else {
			// No NPC available
			app.activeNPC = null;
			app.activeNPCIndex = -1;
			window.ui.updateFormFromActiveNPC(); // Clear the form
		}
	}


	async function saveActiveBestiaryToDB() {
		if (app.activeBestiary && app.activeBestiary.id) {
			try {
				// Create a deep copy to avoid potential mutation issues during async save
				const bestiaryToSave = JSON.parse(JSON.stringify(app.activeBestiary));
				await app.db.projects.put(bestiaryToSave);
				// console.log("Bestiary saved:", bestiaryToSave.projectName); // Optional: for debugging
			} catch (error) {
				console.error("Failed to save bestiary to DB:", error);
				// Optionally inform the user
				// showAlert("Error saving bestiary. Changes might not persist.");
			}
		} else {
			console.warn("Attempted to save but no active bestiary or bestiary ID is missing.");
		}
	}

	function sortAndSwitchToNpc(targetNpc) {
		if (!app.activeBestiary) return;

		// Sort the NPCs alphabetically by name (case-insensitive)
		app.activeBestiary.npcs.sort((a, b) => {
			return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: 'base' });
		});

		// Find the new index of the target NPC after sorting, or default to 0
		const newIndex = targetNpc
			? app.activeBestiary.npcs.findIndex(npc => npc === targetNpc) // Find by object reference
			: 0; // Default to first NPC if no target

		// Switch to the determined index (handles case where targetNpc wasn't found -> selects 0)
		switchActiveNPC(newIndex >= 0 ? newIndex : 0);
		// No need to update the selector here, switchActiveNPC calls updateForm which calls updateNpcSelector
	}


	async function exportBestiary() {
		if (!app.activeBestiary) {
			showAlert("No active bestiary to export.");
			return;
		}

		// Ensure data is up-to-date before exporting
		if (app.activeNPC) {
			updateActiveNPCFromForm(); // Grab latest form data if an NPC is selected
		}

		// Use a deep copy for safety
		const bestiaryToExport = JSON.parse(JSON.stringify(app.activeBestiary));
		const bestiaryJson = JSON.stringify(bestiaryToExport, null, 2); // Pretty print JSON

		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: `Bestiary-${app.activeBestiary.projectName}.json`,
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const writable = await handle.createWritable();
			await writable.write(bestiaryJson);
			await writable.close();
			// Optional: Confirmation message
			// showAlert(`Bestiary "${app.activeBestiary.projectName}" exported successfully.`);
		} catch (err) {
			// Ignore AbortError, log others
			if (err.name !== "AbortError") {
				console.error("Error exporting bestiary:", err);
				showAlert("Failed to export bestiary. See console for details.");
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
			try {
				importedBestiary = JSON.parse(content);
			} catch (parseError) {
				console.error("Error parsing JSON file:", parseError);
				showAlert("Failed to import: The selected file is not valid JSON.");
				return;
			}

			// Basic validation
			if (!importedBestiary || typeof importedBestiary.projectName !== 'string') {
				showAlert("Failed to import: Invalid bestiary format.");
				return;
			}

			// Remove ID if present to ensure it's treated as a new entry
			delete importedBestiary.id;

			// Check for existing bestiary with the same name (case-insensitive)
			const existing = await app.db.projects.where('projectName').equalsIgnoreCase(importedBestiary.projectName).first();
			if (existing) {
				showAlert(`A bestiary named "${importedBestiary.projectName}" already exists. Please rename the existing one or the file being imported.`);
				return;
			}

			// Heal the imported data to ensure compatibility
			const healedBestiary = healBestiary(importedBestiary);

			// Add to database
			const newId = await app.db.projects.add(healedBestiary);
			healedBestiary.id = newId; // Assign the new ID

			// Load the newly imported bestiary
			loadBestiary(healedBestiary);
			showAlert(`Bestiary "${healedBestiary.projectName}" imported successfully!`);
		} catch (err) {
			// Ignore user cancellation (AbortError)
			if (err.name !== "AbortError") {
				console.error("Error importing bestiary:", err);
				showAlert("Failed to import bestiary. See console for details.");
			}
		}
	}


	// --- NPC Management ---
	function createNewNpc() {
		if (!app.activeBestiary) {
			showAlert("Please load or create a bestiary first.");
			return;
		}

		// Create a deep copy of the default NPC template
		const newNpc = JSON.parse(JSON.stringify(app.defaultNPC));

		// Find a unique name, defaulting to "New NPC"
		newNpc.name = findUniqueNpcName("New NPC");

		// Inherit default viewport settings from the bestiary metadata
		newNpc.useDropCap = app.activeBestiary.metadata.useDropCap;
		newNpc.addDescription = app.activeBestiary.metadata.addDescription;
		newNpc.addTitle = app.activeBestiary.metadata.addTitle;
		newNpc.addImageLink = app.activeBestiary.metadata.addImageLink;

		// Default FG group to the bestiary name
		newNpc.fg_group = app.activeBestiary.projectName;

		// Calculate initial DC based on default stats (will be recalculated on form update)
		// Bonus is no longer stored on the NPC object itself
		const { dc: innateDC } = calculateSpellcastingDCBonus(newNpc.innateAbility, newNpc.proficiencyBonus, newNpc);
		newNpc.innateDC = innateDC;
		const { dc: actionDC } = calculateSpellcastingDCBonus(newNpc.actionCastingAbility, newNpc.proficiencyBonus, newNpc);
		newNpc.actionCastingDC = actionDC;

		// Add the new NPC to the list
		app.activeBestiary.npcs.push(newNpc);

		// Sort the list and switch focus to the new NPC
		sortAndSwitchToNpc(newNpc);

		// Save the updated bestiary
		saveActiveBestiaryToDB();

		// Focus the name input for immediate editing
		window.ui.inputs.name.focus();
	}


	function duplicateCurrentNpc() {
		if (!app.activeBestiary || !app.activeNPC) {
			showAlert("Please select an NPC to duplicate.");
			return;
		}

		// Ensure current NPC data is captured from the form
		updateActiveNPCFromForm();

		// Create a deep copy of the currently active NPC
		const newNpc = JSON.parse(JSON.stringify(app.activeNPC));

		// Find a unique name based on the original name
		newNpc.name = findUniqueNpcName(`${app.activeNPC.name} (Copy)`);

		// Add the duplicated NPC to the list
		app.activeBestiary.npcs.push(newNpc);

		// Sort the list and switch focus to the duplicated NPC
		sortAndSwitchToNpc(newNpc);

		// Save the updated bestiary
		saveActiveBestiaryToDB();

		// Focus the name input for potential renaming
		window.ui.inputs.name.focus();
	}


	function deleteCurrentNpc() {
		if (!app.activeBestiary) {
			showAlert("No active bestiary.");
			return;
		}
		if (!app.activeNPC) {
			showAlert("No NPC selected to delete.");
			return;
		}
		if (app.activeBestiary.npcs.length <= 1) {
			showAlert("Cannot delete the last NPC in the bestiary.");
			return;
		}

		const npcToDelete = app.activeNPC;
		const npcNameToDelete = npcToDelete.name || "Unnamed NPC";

		// Show confirmation dialog
		showConfirm(
			"Delete NPC?",
			`Are you sure you want to permanently delete "${npcNameToDelete}"? This cannot be undone.`,
			() => {
				// Find the index *again* in case something changed
				const indexToDelete = app.activeBestiary.npcs.findIndex(npc => npc === npcToDelete);

				if (indexToDelete !== -1) {
					// Remove the NPC from the array
					app.activeBestiary.npcs.splice(indexToDelete, 1);

					// Sort the remaining NPCs and switch to the first one (or none if empty, though prevented above)
					sortAndSwitchToNpc(null);

					// Save the changes to the database
					saveActiveBestiaryToDB();
				} else {
					console.error("Could not find the NPC to delete after confirmation.");
					showAlert("Error: Could not delete the NPC.");
				}
			}
		);
	}


	async function importNpc() {
		if (!app.activeBestiary) {
			showAlert("Please load or create a bestiary first to import an NPC into.");
			return;
		}

		try {
			const [handle] = await window.showOpenFilePicker({
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const file = await handle.getFile();
			const content = await file.text();
			let loadedNPC;
			try {
				loadedNPC = JSON.parse(content);
			} catch (parseError) {
				console.error("Error parsing NPC JSON file:", parseError);
				showAlert("Failed to import: The selected file is not valid JSON.");
				return;
			}

			// Basic validation (optional, but good practice)
			if (typeof loadedNPC !== 'object' || loadedNPC === null) {
				showAlert("Failed to import: Invalid NPC data format.");
				return;
			}

			// Create a new NPC object starting with defaults, then overlay loaded data
			const newNpc = { ...app.defaultNPC, ...loadedNPC };

			// Ensure the name is unique within the current bestiary
			newNpc.name = findUniqueNpcName(newNpc.name || "Imported NPC");

			// Optionally, force FG group to current bestiary? Or keep imported one?
			// For now, let's keep the imported one if it exists, otherwise default.
			if (!newNpc.fg_group) {
				newNpc.fg_group = app.activeBestiary.projectName;
			}
			// Ensure boolean viewport settings inherit from bestiary if missing
			const propsToInherit = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap'];
			propsToInherit.forEach(prop => {
				if (newNpc[prop] === undefined) newNpc[prop] = app.activeBestiary.metadata[prop];
			});


			// Add the imported NPC to the list
			app.activeBestiary.npcs.push(newNpc);

			// Sort the list and switch focus to the imported NPC
			sortAndSwitchToNpc(newNpc);

			// Save the updated bestiary
			saveActiveBestiaryToDB();

			showAlert(`NPC "${newNpc.name}" imported successfully.`);

		} catch (err) {
			// Ignore user cancellation (AbortError)
			if (err.name !== "AbortError") {
				console.error("Error importing NPC:", err);
				showAlert("Failed to import NPC. See console for details.");
			}
		}
	}


	async function exportNpc() {
		if (!app.activeNPC) {
			showAlert("No NPC selected to export.");
			return;
		}

		// Ensure current form data is saved to the activeNPC object
		updateActiveNPCFromForm();

		// Create a deep copy for safety
		const npcToExport = JSON.parse(JSON.stringify(app.activeNPC));
		const npcJson = JSON.stringify(npcToExport, null, 2); // Pretty print

		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: `${app.activeNPC.name || "unnamed-npc"}.json`,
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const writable = await handle.createWritable();
			await writable.write(npcJson);
			await writable.close();
			// Optional confirmation
			// showAlert(`NPC "${app.activeNPC.name}" exported successfully.`);
		} catch (err) {
			if (err.name !== "AbortError") {
				console.error("Error exporting NPC:", err);
				showAlert("Failed to export NPC. See console for details.");
			}
		}
	}


	async function exportBestiaryToFG() {
		if (!app.activeBestiary) {
			showAlert("No active bestiary to export.");
			return;
		}
		// Placeholder message
		showAlert("Fantasy Grounds export is not yet implemented.");
		console.log("Placeholder: Exporting Bestiary to FG format...");
		// Future implementation for FG XML export will go here.
		// This will involve iterating through app.activeBestiary.npcs,
		// mapping the data to the FG XML structure, and then saving the XML file.
	}


	function updateActiveNPCFromForm() {
		if (app.isUpdatingForm || !app.activeNPC) return; // Prevent recursive updates or updates when no NPC is active

		// Store old proficiency bonus and ability scores *before* any changes
		const oldProfBonus = app.activeNPC.proficiencyBonus;
		const oldAbilities = {
			strength: app.activeNPC.strength, dexterity: app.activeNPC.dexterity, constitution: app.activeNPC.constitution,
			intelligence: app.activeNPC.intelligence, wisdom: app.activeNPC.wisdom, charisma: app.activeNPC.charisma
		};
		const oldInnateAbility = app.activeNPC.innateAbility;
		const oldActionAbility = app.activeNPC.actionCastingAbility;


		// --- Name Validation ---
		const newName = window.ui.inputs.name.value.trim();
		if (newName && newName.toLowerCase() !== (app.activeNPC.name || "").toLowerCase()) {
			const isDuplicate = app.activeBestiary.npcs.some((npc, index) =>
				index !== app.activeNPCIndex && npc.name.toLowerCase() === newName.toLowerCase()
			);
			if (isDuplicate) {
				showAlert(`An NPC named "${newName}" already exists in this bestiary.`);
				window.ui.inputs.name.value = app.activeNPC.name; // Revert input value
				return; // Stop update
			}
			app.activeNPC.name = newName; // Update name only if valid and changed
		} else if (!newName && app.activeNPC.name) {
			// Handle clearing the name - maybe prevent or assign default?
			// For now, allow empty but it might cause issues. Let's keep the old name if cleared.
			window.ui.inputs.name.value = app.activeNPC.name;
		} else if (!app.activeNPC.name && newName) {
			app.activeNPC.name = newName; // Set name if it was initially empty
		}


		// --- Update Standard Properties from window.ui.inputs ---
		for (const key in window.ui.inputs) {
			// Skip name (handled above), action/attack/radio inputs, and specific spellcasting inputs handled later
			if (key === 'name' || key.startsWith('common') || key === 'attackDamageDice' || window.ui.inputs[key]?.type === 'radio') continue;
			if (key.startsWith('innate-') || key.startsWith('action-casting-')) continue; // Skip detailed spell fields for now
			if (key === 'hasInnateSpellcasting' || key === 'hasSpellcasting') continue; // Skip main checkboxes for now

			if (key === 'description') {
				app.activeNPC[key] = window.ui.inputs.description.value; // Get value from hidden input linked to Trix
				continue;
			}

			const element = window.ui.inputs[key];
			if (!element) continue; // Skip if element doesn't exist

			// Handle custom toggles (size, type, species, alignment)
			const customToggle = document.getElementById(`toggle-custom-${key}`);
			if (customToggle) {
				if (customToggle.checked) {
					const customInput = document.getElementById(`npc-${key}-custom`);
					app.activeNPC[key] = customInput ? customInput.value : '';
				} else {
					app.activeNPC[key] = element.value; // Read from the select dropdown
				}
			} else if (element.type === "checkbox") {
				app.activeNPC[key] = element.checked;
			} else if (element.type === "number") {
				const parsedValue = parseInt(element.value, 10);
				// Use defaultNPC value if parsing fails, or 0 if no default exists
				const defaultValue = app.defaultNPC[key] !== undefined ? app.defaultNPC[key] : 0;
				app.activeNPC[key] = isNaN(parsedValue) ? defaultValue : parsedValue;
			} else {
				// For text, select, etc.
				app.activeNPC[key] = element.value;
			}
		}

		// --- Update Proficiency Bonus based on NEW Challenge Rating ---
		const newProfBonus = calculateProficiencyBonus(app.activeNPC.challenge);
		const profBonusChanged = newProfBonus !== oldProfBonus;
		app.activeNPC.proficiencyBonus = newProfBonus;
		if(window.ui.proficiencyBonusDisplay) window.ui.proficiencyBonusDisplay.textContent = `+${newProfBonus}`;
		app.activeNPC.experience = crToXpMap[app.activeNPC.challenge] || ''; // Update XP based on CR
		if(window.ui.experienceDisplay) window.ui.experienceDisplay.textContent = app.activeNPC.experience;

		// --- Recalculate Ability Bonuses *after* reading scores ---
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		let abilitiesChanged = false;
		abilities.forEach(ability => {
			const newBonus = calculateAbilityBonus(app.activeNPC[ability]);
			if (newBonus !== app.activeNPC[`${ability}Bonus`]) {
				app.activeNPC[`${ability}Bonus`] = newBonus;
				abilitiesChanged = true;
			}
		});

		// --- Innate Spellcasting fields ---
		if(window.ui.inputs.hasInnateSpellcasting) app.activeNPC.hasInnateSpellcasting = window.ui.inputs.hasInnateSpellcasting.checked;
		if(window.ui.inputs.innateIsPsionics) app.activeNPC.innateIsPsionics = window.ui.inputs.innateIsPsionics.checked;
		if(window.ui.inputs.innateAbility) app.activeNPC.innateAbility = window.ui.inputs.innateAbility.value;
		const innateAbilityChanged = app.activeNPC.innateAbility !== oldInnateAbility;

		// Update DC: Use calculated if prof/ability changed AND user hasn't manually overridden
		// Calculate DC based on OLD stats to check against current input
		const { dc: currentInnateDC } = calculateSpellcastingDCBonus(oldInnateAbility, oldProfBonus, { ...app.activeNPC, ...oldAbilities });
		// Calculate DC based on NEW stats
		const { dc: newInnateCalculatedDC } = calculateSpellcastingDCBonus(app.activeNPC.innateAbility, newProfBonus, app.activeNPC);

		const innateDCInput = window.ui.inputs.innateDC;
		const manualInnateDC = innateDCInput ? parseInt(innateDCInput.value, 10) : NaN;

		if (profBonusChanged || abilitiesChanged || innateAbilityChanged) {
			// If the user's input matched the *old* calculation, update it automatically
			if (!isNaN(manualInnateDC) && manualInnateDC === currentInnateDC) {
				app.activeNPC.innateDC = newInnateCalculatedDC;
				if (innateDCInput) innateDCInput.value = newInnateCalculatedDC; // Update input field
			} else {
				app.activeNPC.innateDC = isNaN(manualInnateDC) ? newInnateCalculatedDC : manualInnateDC; // Keep manual override or use new calc if invalid
			}
		} else {
			// If stats didn't change, just save whatever is in the input field (or calc if invalid)
			app.activeNPC.innateDC = isNaN(manualInnateDC) ? newInnateCalculatedDC : manualInnateDC;
		}
		// Bonus calculation and saving removed

		if(window.ui.inputs.innateComponents) app.activeNPC.innateComponents = window.ui.inputs.innateComponents.value;
		// Update spell lists
		for (let i = 0; i < 4; i++) {
			const freqInput = window.ui.inputs[`innate-freq-${i}`];
			const listInput = window.ui.inputs[`innate-list-${i}`];
			if (freqInput && listInput && app.activeNPC.innateSpells && app.activeNPC.innateSpells[i]) {
				app.activeNPC.innateSpells[i].freq = freqInput.value.trim();
				app.activeNPC.innateSpells[i].list = listInput.value.trim();
			}
		}

		// --- Spellcasting fields ---
		if(window.ui.inputs.hasSpellcasting) app.activeNPC.hasSpellcasting = window.ui.inputs.hasSpellcasting.checked;
		const spellPlacementRadio = document.querySelector('input[name="spellcasting-placement"]:checked');
		app.activeNPC.spellcastingPlacement = spellPlacementRadio ? spellPlacementRadio.value : app.defaultNPC.spellcastingPlacement;

		// --- Action-based Spellcasting fields ---
		if(window.ui.inputs.actionCastingAbility) app.activeNPC.actionCastingAbility = window.ui.inputs.actionCastingAbility.value;
		const actionAbilityChanged = app.activeNPC.actionCastingAbility !== oldActionAbility;

		// Update DC similarly to Innate
		const { dc: currentActionDC } = calculateSpellcastingDCBonus(oldActionAbility, oldProfBonus, { ...app.activeNPC, ...oldAbilities });
		const { dc: newActionCalculatedDC } = calculateSpellcastingDCBonus(app.activeNPC.actionCastingAbility, newProfBonus, app.activeNPC);

		const actionDCInput = window.ui.inputs.actionCastingDC;
		const manualActionDC = actionDCInput ? parseInt(actionDCInput.value, 10) : NaN;

		if (profBonusChanged || abilitiesChanged || actionAbilityChanged) {
			if (!isNaN(manualActionDC) && manualActionDC === currentActionDC) {
				app.activeNPC.actionCastingDC = newActionCalculatedDC;
				if(actionDCInput) actionDCInput.value = newActionCalculatedDC;
			} else {
				app.activeNPC.actionCastingDC = isNaN(manualActionDC) ? newActionCalculatedDC : manualActionDC;
			}
		} else {
			app.activeNPC.actionCastingDC = isNaN(manualActionDC) ? newActionCalculatedDC : manualActionDC;
		}
		// Bonus calculation and saving removed

		if (window.ui.inputs.actionCastingComponents) app.activeNPC.actionCastingComponents = window.ui.inputs.actionCastingComponents.value;
		// Update spell lists
		for (let i = 0; i < 4; i++) {
			const freqInput = window.ui.inputs[`action-casting-freq-${i}`];
			const listInput = window.ui.inputs[`action-casting-list-${i}`];
			if (freqInput && listInput && app.activeNPC.actionCastingSpells && app.activeNPC.actionCastingSpells[i]) {
				app.activeNPC.actionCastingSpells[i].freq = freqInput.value.trim();
				app.activeNPC.actionCastingSpells[i].list = listInput.value.trim();
			}
		}

		// --- Languages ---
		const selectedLanguages = new Set();
		window.ui.languageListboxes.forEach(listbox => {
			if (listbox) {
				Array.from(listbox.selectedOptions).forEach(option => selectedLanguages.add(option.value));
			}
		});
		app.activeNPC.selectedLanguages = Array.from(selectedLanguages);
		const telepathyCheckbox = document.getElementById('npc-has-telepathy');
		if (telepathyCheckbox) app.activeNPC.hasTelepathy = telepathyCheckbox.checked;
		const telepathyRangeInput = document.getElementById('npc-telepathy-range');
		if (telepathyRangeInput) app.activeNPC.telepathyRange = parseInt(telepathyRangeInput.value, 10) || 0;
		const specialOptionSelect = document.getElementById('npc-special-language-option');
		if (specialOptionSelect) app.activeNPC.specialLanguageOption = parseInt(specialOptionSelect.value, 10) || 0;
		// Check if special option forces a change in selected languages
		let languagesModifiedBySpecialOption = false;
		if (app.activeNPC.specialLanguageOption === 1 && app.activeNPC.selectedLanguages.length > 0) {
			app.activeNPC.selectedLanguages = []; languagesModifiedBySpecialOption = true;
		}
		// Note: Option 2 (all languages) handling might be complex and is often just noted textually.
		// We won't automatically select all languages here.

		// --- Viewport Options ---
		for (const key in window.ui.npcSettingsCheckboxes) {
			const checkbox = window.ui.npcSettingsCheckboxes[key];
			if(checkbox) app.activeNPC[key] = checkbox.checked;
		}

		// --- Saves & Skills ---
		abilities.forEach(ability => {
			const profCheck = document.getElementById(`npc-${ability}-saving-throw-prof`);
			const adjustInput = document.getElementById(`npc-${ability}-saving-throw-adjust`);
			if (profCheck) app.activeNPC[`${ability}SavingThrowProf`] = profCheck.checked;
			if (adjustInput) app.activeNPC[`${ability}SavingThrowAdjust`] = parseInt(adjustInput.value, 10) || 0;
		});
		skills.forEach(skill => {
			const profCheck = document.getElementById(`skill-${skill.id}-prof`);
			const expCheck = document.getElementById(`skill-${skill.id}-exp`);
			const adjustInput = document.getElementById(`skill-${skill.id}-adjust`);
			if (profCheck) app.activeNPC[`skill_${skill.id}_prof`] = profCheck.checked;
			// Ensure expertise implies proficiency
			if (expCheck) {
				app.activeNPC[`skill_${skill.id}_exp`] = expCheck.checked;
				if (expCheck.checked && profCheck && !profCheck.checked) {
					profCheck.checked = true; // Also check proficiency box visually
					app.activeNPC[`skill_${skill.id}_prof`] = true; // Update data model too
				}
			}
			if (adjustInput) app.activeNPC[`skill_${skill.id}_adjust`] = parseInt(adjustInput.value, 10) || 0;
		});

		// --- Resistances/Immunities ---
		damageTypes.forEach(type => {
			const vulnCheck = document.getElementById(`vuln-${type}`);
			const resCheck = document.getElementById(`res-${type}`);
			const immCheck = document.getElementById(`imm-${type}`);
			if(vulnCheck) app.activeNPC[`vulnerability_${type}`] = vulnCheck.checked;
			if(resCheck) app.activeNPC[`resistance_${type}`] = resCheck.checked;
			if(immCheck) app.activeNPC[`immunity_${type}`] = immCheck.checked;
			// Ensure resistance and immunity aren't both checked for the same type
			if (app.activeNPC[`resistance_${type}`] && app.activeNPC[`immunity_${type}`]) {
				app.activeNPC[`resistance_${type}`] = false; // Prioritize immunity, uncheck resistance
				if(resCheck) resCheck.checked = false; // Update UI
			}
		});
		conditions.forEach(condition => {
			const ciCheck = document.getElementById(`ci-${condition}`);
			if(ciCheck) app.activeNPC[`ci_${condition}`] = ciCheck.checked;
		});
		const selectedWeaponRes = document.querySelector('input[name="weapon-resistance"]:checked');
		if (selectedWeaponRes) app.activeNPC.weaponResistance = selectedWeaponRes.value;
		const selectedWeaponImm = document.querySelector('input[name="weapon-immunity"]:checked');
		if (selectedWeaponImm) app.activeNPC.weaponImmunity = selectedWeaponImm.value;

		// --- Recalculate derived stats (Saves, Skills, Passive Perception) ---
		calculateAllStats(); // This now calculates ability bonuses, saves, skills, passive perception

		// --- Final UI Updates ---
		window.ui.updateStatDisplays(); // Update bonus/total displays for saves
		window.ui.updateSkillDisplays(); // Update skill totals
		window.viewport.updateViewport(); // Refresh the main preview

		// Update name in selector dropdown if it changed
		if(window.ui.npcSelector && window.ui.npcSelector.selectedIndex >= 0) {
			const currentOption = window.ui.npcSelector.options[window.ui.npcSelector.selectedIndex];
			if(currentOption && currentOption.textContent !== app.activeNPC.name) {
				currentOption.textContent = app.activeNPC.name;
			}
		}

		// If special language option forced a change, re-run updateForm to show it visually
		if (languagesModifiedBySpecialOption) {
			// Need to temporarily disable the update flag to allow recursive call
			const wasUpdating = app.isUpdatingForm;
			app.isUpdatingForm = false;
			window.ui.updateFormFromActiveNPC();
			app.isUpdatingForm = wasUpdating;
		}

		// Update spellcasting section visibility based on checkboxes and radio buttons
		window.ui.updateSpellcastingVisibility();

		// --- Save ---
		saveActiveBestiaryToDB();
	}


	// --- Calculation Functions ---
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
		return { dc, bonus }; // Still return bonus, even if not stored on NPC
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
		const vulnerabilities = damageTypes.filter(type => npc[`vulnerability_${type}`]);
		const resistances = damageTypes.filter(type => npc[`resistance_${type}`]);
		const immunities = damageTypes.filter(type => npc[`immunity_${type}`]);

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
		return conditions.filter(condition => npc[`ci_${condition}`]).join(', ');
	}

	function calculateLanguagesString(npc) {
		if (!npc) return '—';

		const specialMap = {
			1: "understands all languages but speaks none",
			2: "all languages",
			3: "the languages it knew in life",
			4: "understands the languages selected but can't speak",
			5: "understands its creator's languages but can't speak",
			6: "understands the languages it knew in life but can't speak"
		};

		const specialText = specialMap[npc.specialLanguageOption] || null;
		const selected = Array.isArray(npc.selectedLanguages) ? [...npc.selectedLanguages].sort((a,b) => a.localeCompare(b)) : [];
		const telepathy = npc.hasTelepathy ? `telepathy ${npc.telepathyRange || 60} ft.` : null; // Default range if unspecified

		let mainPart = '—'; // Default if nothing else applies
		if (specialText) {
			mainPart = specialText;
		} else if (selected.length > 0) {
			mainPart = selected.join(', ');
		}

		// Combine main part and telepathy
		if (telepathy) {
			if (mainPart === '—' || npc.specialLanguageOption === 1 || npc.specialLanguageOption === 4 || npc.specialLanguageOption === 5 || npc.specialLanguageOption === 6) {
				// If no spoken languages or can't speak, just list telepathy
				return telepathy;
			} else {
				// Otherwise, append telepathy
				return `${mainPart}, ${telepathy}`;
			}
		} else {
			return mainPart;
		}
	}


	function calculateAllStats() {
		if (!app.activeNPC) return;

		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		const abilityAbbr = { strength: 'Str', dexterity: 'Dex', constitution: 'Con', intelligence: 'Int', wisdom: 'Wis', charisma: 'Cha' };

		// 1. Calculate Ability Bonuses first
		abilities.forEach(ability => {
			const score = app.activeNPC[ability] || 10;
			app.activeNPC[`${ability}Bonus`] = calculateAbilityBonus(score);
		});

		// 2. Get Proficiency Bonus (already calculated in updateActiveNPCFromForm)
		const profBonus = app.activeNPC.proficiencyBonus || 2;

		// 3. Calculate Saving Throws
		const savesArray = [];
		abilities.forEach(ability => {
			const base = app.activeNPC[`${ability}Bonus`] || 0;
			const isProficient = app.activeNPC[`${ability}SavingThrowProf`] || false;
			const adjust = app.activeNPC[`${ability}SavingThrowAdjust`] || 0;
			const total = base + (isProficient ? profBonus : 0) + adjust;
			// Only add save to the string if proficient or adjusted
			if (isProficient || adjust !== 0) {
				savesArray.push(`${abilityAbbr[ability]} ${total >= 0 ? '+' : ''}${total}`);
			}
		});
		app.activeNPC.saves = savesArray.join(', ');

		// 4. Calculate Skills (depends on ability bonuses and prof bonus)
		calculateAllSkills();

		// 5. Calculate Passive Perception (depends on Wisdom bonus and Perception skill)
		const perceptionProf = app.activeNPC.skill_perception_prof || false;
		const perceptionExp = app.activeNPC.skill_perception_exp || false;
		const perceptionAdjust = app.activeNPC.skill_perception_adjust || 0;
		const perceptionBonus = (app.activeNPC.wisdomBonus || 0) +
			(perceptionProf ? profBonus : 0) +
			(perceptionExp ? profBonus : 0) + // Expertise adds prof bonus again
			perceptionAdjust;
		app.activeNPC.passivePerception = 10 + perceptionBonus;

		// 6. Calculate Speed String
		app.activeNPC.speed = calculateSpeedString(app.activeNPC);
	}


	function calculateAllSkills() {
		if (!app.activeNPC) return;
		const profBonus = app.activeNPC.proficiencyBonus || 2;
		const skillsArray = [];

		skills.forEach(skill => {
			const baseAbilityBonus = app.activeNPC[`${skill.attribute}Bonus`] || 0;
			const isProf = app.activeNPC[`skill_${skill.id}_prof`] || false;
			const isExp = app.activeNPC[`skill_${skill.id}_exp`] || false;
			const adjust = app.activeNPC[`skill_${skill.id}_adjust`] || 0;

			// Calculate total skill bonus
			const total = baseAbilityBonus +
				(isProf ? profBonus : 0) +
				(isExp ? profBonus : 0) + // Expertise adds proficiency bonus again
				adjust;

			// Add skill to the string only if proficient, expert, or adjusted
			if (isProf || isExp || adjust !== 0) {
				skillsArray.push(`${skill.name} ${total >= 0 ? '+' : ''}${total}`);
			}
		});
		// Sort skills alphabetically for consistent display
		skillsArray.sort();
		app.activeNPC.npcSkills = skillsArray.join(', ');
	}


	// --- Action Functions ---
	function addOrUpdateAction(type) {
		if (!app.activeNPC || !window.ui.inputs.commonName || !window.ui.inputs.commonDesc) return;

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
		if (!app.activeNPC.actions) app.activeNPC.actions = { actions: [], 'bonus-actions': [], reactions: [], 'legendary-actions': [], 'lair-actions': [] };
		if (!Array.isArray(app.activeNPC.actions[type])) app.activeNPC.actions[type] = [];

		if (currentlyEditingAction !== null) {
			// Update existing action
			const { originalType, originalIndex } = currentlyEditingAction;
			if (originalType === type) {
				// If type hasn't changed, update in place
				if (originalIndex >= 0 && originalIndex < app.activeNPC.actions[type].length) {
					app.activeNPC.actions[type][originalIndex] = actionData;
				} else {
					console.error("Error updating action: Invalid original index.");
					showAlert("Error updating action.");
					clearInputs(); // Reset edit state
					return;
				}
			} else {
				// If type changed, remove from old list and add to new list
				if (originalIndex >= 0 && originalIndex < app.activeNPC.actions[originalType].length) {
					app.activeNPC.actions[originalType].splice(originalIndex, 1);
					app.activeNPC.actions[type].push(actionData);
				} else {
					console.error("Error moving action: Invalid original index.");
					showAlert("Error moving action.");
					clearInputs(); // Reset edit state
					return;
				}
			}
		} else {
			// Add new action
			app.activeNPC.actions[type].push(actionData);
		}

		clearInputs(); // Clear form and reset editing state
		window.ui.renderActions(); // Re-render action lists
		window.viewport.updateViewport(); // Update preview
		saveActiveBestiaryToDB(); // Save changes
	}


	function editAction(element) {
		if (!window.app.activeNPC || !element) return;

		const type = element.dataset.actionType;
		const originalIndex = parseInt(element.dataset.actionIndex, 10); // Get original index

		if (type && !isNaN(originalIndex) && app.activeNPC.actions && app.activeNPC.actions[type]?.[originalIndex]) {
			// Remove 'editing' class from previously edited item
			document.querySelectorAll('.action-list-item.editing').forEach(el => el.classList.remove('editing', 'border-yellow-400'));

			const actionData = app.activeNPC.actions[type][originalIndex];
			window.ui.inputs.commonName.value = actionData.name || '';
			window.ui.inputs.commonDesc.value = actionData.desc || ''; // Use textarea

			currentlyEditingAction = { originalType: type, originalIndex: originalIndex }; // Store original info

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
		currentlyEditingAction = null; // Reset editing state
		// Remove 'editing' class from list items
		document.querySelectorAll('.action-list-item.editing').forEach(el => el.classList.remove('editing', 'border-yellow-400'));
	}

	function editBoilerplate(element) {
		if (!window.ui.boilerplateModal || !window.app.activeNPC) return;
		const editor = document.getElementById('boilerplate-editor');
		if (!editor) return;

		boilerplateTarget = element; // Store which element was clicked
		if (element.id === 'legendary-boilerplate') {
			editor.value = window.app.activeNPC.legendaryBoilerplate || app.defaultNPC.legendaryBoilerplate;
		} else if (element.id === 'lair-boilerplate') {
			editor.value = window.app.activeNPC.lairBoilerplate || app.defaultNPC.lairBoilerplate;
		}
		openModal('boilerplate-modal');
		editor.focus();
		editor.select();
	}


	function saveBoilerplate() {
		if (!boilerplateTarget || !window.app.activeNPC) return;
		const editor = document.getElementById('boilerplate-editor');
		if (!editor) return;

		const newText = editor.value;

		if (boilerplateTarget.id === 'legendary-boilerplate') {
			window.app.activeNPC.legendaryBoilerplate = newText;
		} else if (boilerplateTarget.id === 'lair-boilerplate') {
			window.app.activeNPC.lairBoilerplate = newText;
		}

		boilerplateTarget.textContent = newText; // Update display immediately
		boilerplateTarget = null; // Clear target
		closeModal('boilerplate-modal');
		window.viewport.updateViewport(); // Update main preview
		saveActiveBestiaryToDB(); // Save changes
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
			const extraRows = container.querySelectorAll('.damage-row-extra');
			extraRows.forEach(row => row.remove());
		}

		// Reset dice selectors for the primary row
		if (damageDiceInput) {
			const primaryDiceSelector = document.getElementById('primary-dice-selector');
			if (primaryDiceSelector) createDiceSelector(primaryDiceSelector, damageDiceInput);
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
					const lastWord = words[words.length - 1];
					// Very basic check, might need refinement
					if (damageTypes.includes(lastWord.toLowerCase())) {
						type = lastWord.toLowerCase();
						// Attempt to find dice somewhere earlier in the part
						const simpleDiceMatch = part.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/);
						if (simpleDiceMatch) {
							dice = simpleDiceMatch[1];
						} else {
							dice = part.replace(new RegExp(`\\s*${lastWord}\\s*damage.*$`), '').trim(); // Try removing type and text
						}

					} else if (index === 0) {
						// If it's the first part and doesn't match, assume it's complex description?
						// For now, let's skip adding it as damage.
						console.warn("Could not parse primary damage part:", part);
						return; // Skip this part
					} else {
						// Likely descriptive text following the last damage type
						// We've already captured the damage, so we can ignore this.
						return;
					}
				}
			}

			// Validate type
			if (!damageTypes.includes(type)) {
				console.warn(`Unknown damage type "${type}" found during parsing.`);
				// Fallback or skip? Let's skip for now.
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

		// Clear existing rows (except potential template row if used)
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
			confirmCallback = null;
		}
	}


	function showAlert(message) {
		showDialog("Alert", message, false);
	}


	function showConfirm(title, message, onConfirm) {
		confirmCallback = onConfirm; // Store the callback
		showDialog(title, message, true); // Show with cancel button
	}


	function showDialog(title, message, showCancel = false) {
		if (!window.ui.alertModal || !window.ui.alertTitle || !window.ui.alertMessageText || !window.ui.alertOkBtn || !window.ui.alertCancelBtn) {
			console.error("Alert modal elements not found!");
			alert(message); // Fallback to browser alert
			return;
		}

		window.ui.alertTitle.textContent = title;
		window.ui.alertMessageText.textContent = message;

		window.ui.alertOkBtn.onclick = () => {
			closeModal('alert-modal');
			if (confirmCallback && !showCancel) { // Only call callback if it was a confirm dialog (no cancel shown) or OK was clicked on confirm
				confirmCallback();
				confirmCallback = null; // Clear callback
			} else if (confirmCallback && showCancel) {
				confirmCallback(); // Call callback on OK for confirm dialogs
				confirmCallback = null;
			}
		};

		if (showCancel) {
			window.ui.alertCancelBtn.classList.remove('hidden');
			window.ui.alertCancelBtn.onclick = () => {
				closeModal('alert-modal');
				confirmCallback = null; // Clear callback on cancel
			};
		} else {
			window.ui.alertCancelBtn.classList.add('hidden');
			window.ui.alertCancelBtn.onclick = null;
		}

		openModal('alert-modal');
		setTimeout(() => window.ui.alertOkBtn.focus(), 50); // Focus OK button
	}


	// --- INITIALIZATION ---
	window.ui.init(); // Initialize UI elements and basic listeners
	window.importer.init(); // Initialize the importer module
	// Initial load or default state setup
	// Check for last opened bestiary? Or just load empty state?
	// For now, start empty:
	window.ui.updateUIForActiveBestiary();

});