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
        // Action functions
        addOrUpdateAction,
        editAction,
        clearInputs,
        openModal,
        closeModal,
        showAlert,
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
						// Use first word of the name, always capitalized
						outputName = capitalize(name.split(' ')[0] || name);
					} else if (isUnique) {
						// Use full name, always capitalized
						outputName = capitalize(name);
					} else {
						// Use "the {name}"
						outputName = `the ${name.toLowerCase()}`;
					}

					// Handle token capitalization like {Name}
					if (isCapitalizedToken) {
						return capitalize(outputName);
					}
					return outputName;

				case 'he':
					return isCapitalizedToken ? capitalize(pronouns[0]) : pronouns[0];
				case 'him':
					return isCapitalizedToken ? capitalize(pronouns[1]) : pronouns[1];
				case 'his':
					return isCapitalizedToken ? capitalize(pronouns[2]) : pronouns[2];
				case 'himself':
					return isCapitalizedToken ? capitalize(pronouns[3]) : pronouns[3];

				default:
					return match; // Return the original token if not found
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
    		alert("Bestiary name cannot be empty.");
    		return;
    	}
    	const existingBestiary = await app.db.projects.where('projectName').equalsIgnoreCase(bestiaryName).first();
    	if (existingBestiary) {
    		alert(`A bestiary named "${bestiaryName}" already exists. Please choose a unique name.`);
    		return;
    	}
    	
    	const newBestiary = {
    		projectName: bestiaryName, // This remains projectName for DB compatibility
    		metadata: { 
    			createdAt: new Date(),
    			addDescription: true,
    			addTitle: true,
    			addImageLink: true,
    			useDropCap: true,
    			fg_groups: [],
    			userDefinedLanguages: [],
    			savedTraits: []
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
    		alert("Error: Could not create bestiary. Check console for details.");
    	}
    }
	
	function healBestiary(bestiary) {
		if (typeof bestiary.metadata !== 'object' || bestiary.metadata === null) {
			bestiary.metadata = {};
		}
		if (!Array.isArray(bestiary.metadata.userDefinedLanguages)) {
			bestiary.metadata.userDefinedLanguages = [];
		}
		if (!Array.isArray(bestiary.metadata.savedTraits)) {
			bestiary.metadata.savedTraits = [];
		}
		
		const propsToConvert = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap'];
		propsToConvert.forEach(prop => {
			if (typeof bestiary.metadata[prop] === 'number') {
				bestiary.metadata[prop] = bestiary.metadata[prop] === 1;
			} else if (bestiary.metadata[prop] === undefined) {
				bestiary.metadata[prop] = true;
			}
		});

		if (!Array.isArray(bestiary.npcs)) {
			bestiary.npcs = [];
		}

		let unnamedCounter = 1;
		bestiary.npcs = bestiary.npcs.map(npc => {
			if (typeof npc !== 'object' || npc === null) {
				return { ...app.defaultNPC, name: findUniqueNpcName("Recovered Corrupt NPC") };
			}
			
			const healedNpc = { ...app.defaultNPC, ...npc };

			propsToConvert.forEach(prop => {
				if (typeof healedNpc[prop] === 'number') {
					healedNpc[prop] = healedNpc[prop] === 1;
				} else if (healedNpc[prop] === undefined) {
					healedNpc[prop] = bestiary.metadata[prop];
				}
			});
			
			if (!Array.isArray(healedNpc.selectedLanguages)) healedNpc.selectedLanguages = [];
			if (healedNpc.specialLanguageOption === undefined) healedNpc.specialLanguageOption = 0;
			if (healedNpc.hasTelepathy === undefined) healedNpc.hasTelepathy = false;
			if (healedNpc.telepathyRange === undefined) healedNpc.telepathyRange = 0;
			
			if (!Array.isArray(healedNpc.traits)) healedNpc.traits = [];
			if (healedNpc.sortTraitsAlpha === undefined) healedNpc.sortTraitsAlpha = true;

			// Heal actions
			if (typeof healedNpc.actions !== 'object' || healedNpc.actions === null) {
                healedNpc.actions = JSON.parse(JSON.stringify(app.defaultNPC.actions));
            } else {
                for (const key in app.defaultNPC.actions) {
                    if (!Array.isArray(healedNpc.actions[key])) {
                        healedNpc.actions[key] = [];
                    }
                }
            }
			if (healedNpc.legendaryBoilerplate === undefined) healedNpc.legendaryBoilerplate = app.defaultNPC.legendaryBoilerplate;
			if (healedNpc.lairBoilerplate === undefined) healedNpc.lairBoilerplate = app.defaultNPC.lairBoilerplate;


			if (!healedNpc.name || healedNpc.name.trim() === "") {
				let uniqueName = `Unnamed NPC`;
				if (unnamedCounter > 1) uniqueName += ` ${unnamedCounter}`;
				while (bestiary.npcs.some(n => n.name === uniqueName)) {
					unnamedCounter++;
					uniqueName = `Unnamed NPC ${unnamedCounter}`;
				}
				healedNpc.name = uniqueName;
			}
			return healedNpc;
		});
		
		if (bestiary.npcs.length === 0) {
			bestiary.npcs.push({ ...app.defaultNPC, name: "New NPC", fg_group: bestiary.projectName });
		}

		return bestiary;
	}

	function loadBestiary(bestiary) {
		try {
			const healedBestiary = healBestiary(JSON.parse(JSON.stringify(bestiary)));
			
			app.activeBestiary = healedBestiary;
			sortAndSwitchToNpc(null);
			window.ui.updateUIForActiveBestiary();
		} catch (error) {
			console.error("Critical error loading bestiary:", error);
			alert("There was a critical error trying to load this bestiary. It may be corrupt. Check the console for details.");
			app.activeBestiary = null;
			app.activeNPC = null;
			app.activeNPCIndex = -1;
			window.ui.updateUIForActiveBestiary();
		}
	}
	
	function switchActiveNPC(index) {
		if (app.activeBestiary && index >= 0 && index < app.activeBestiary.npcs.length) {
			app.activeNPCIndex = index;
			app.activeNPC = app.activeBestiary.npcs[index];
			window.ui.updateFormFromActiveNPC();
		} else if (app.activeBestiary && app.activeBestiary.npcs.length > 0) {
			app.activeNPCIndex = 0;
			app.activeNPC = app.activeBestiary.npcs[0];
			window.ui.updateFormFromActiveNPC();
		}
	}

	async function saveActiveBestiaryToDB() {
		if (app.activeBestiary && app.activeBestiary.id) {
			try {
				const bestiaryToSave = JSON.parse(JSON.stringify(app.activeBestiary));
				await app.db.projects.put(bestiaryToSave);
			} catch (error) {
				console.error("Failed to save bestiary to DB:", error);
			}
		}
	}
	
	function sortAndSwitchToNpc(targetNpc) {
		if (!app.activeBestiary) return;

		app.activeBestiary.npcs.sort((a, b) => {
			return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: 'base' });
		});

		const newIndex = targetNpc ? app.activeBestiary.npcs.findIndex(npc => npc === targetNpc) : 0;
		switchActiveNPC(newIndex >= 0 ? newIndex : 0);
	}


	async function exportBestiary() {
		if (!app.activeBestiary) return;
		
		const bestiaryJson = JSON.stringify(app.activeBestiary, null, 2);
		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: `Bestiary-${app.activeBestiary.projectName}.json`,
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const writable = await handle.createWritable();
			await writable.write(bestiaryJson);
			await writable.close();
		} catch (err) {
			if (err.name !== "AbortError") console.error("Error exporting bestiary:", err);
		}
	}

	async function importBestiary() {
		try {
			const [handle] = await window.showOpenFilePicker({
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const file = await handle.getFile();
			const content = await file.text();
			let importedBestiary = JSON.parse(content);
			
			delete importedBestiary.id; 

			const existing = await app.db.projects.where('projectName').equalsIgnoreCase(importedBestiary.projectName).first();
			if (existing) {
				alert(`A bestiary named "${importedBestiary.projectName}" already exists.`);
				return;
			}

			importedBestiary = healBestiary(importedBestiary);

			const newId = await app.db.projects.add(importedBestiary);
			importedBestiary.id = newId;
			
			loadBestiary(importedBestiary);
			alert(`Bestiary "${importedBestiary.projectName}" imported successfully!`);
		} catch (err) {
			if (err.name !== "AbortError") {
				console.error("Error importing bestiary:", err);
				alert("Failed to import bestiary.");
			}
		}
	}
	
	// --- NPC Management ---
	function createNewNpc() {
		if (!app.activeBestiary) return;
		const newNpc = JSON.parse(JSON.stringify(app.defaultNPC));
		
		newNpc.name = findUniqueNpcName("New NPC");
		newNpc.useDropCap = app.activeBestiary.metadata.useDropCap;
		newNpc.addDescription = app.activeBestiary.metadata.addDescription;
		newNpc.addTitle = app.activeBestiary.metadata.addTitle;
		newNpc.addImageLink = app.activeBestiary.metadata.addImageLink;
		newNpc.fg_group = app.activeBestiary.projectName;
		
		app.activeBestiary.npcs.push(newNpc);
		sortAndSwitchToNpc(newNpc);
		saveActiveBestiaryToDB();
		window.ui.inputs.name.focus();
	}

	function duplicateCurrentNpc() {
		if (!app.activeBestiary || !app.activeNPC) return;

		const newNpc = JSON.parse(JSON.stringify(app.activeNPC));
		newNpc.name = findUniqueNpcName(`${app.activeNPC.name} (Copy)`);

		app.activeBestiary.npcs.push(newNpc);
		sortAndSwitchToNpc(newNpc);
		saveActiveBestiaryToDB();
		window.ui.inputs.name.focus();
	}
	
	function deleteCurrentNpc() {
		if (!app.activeBestiary || app.activeBestiary.npcs.length <= 1) return;

		const npcToDelete = app.activeNPC;
		app.activeBestiary.npcs = app.activeBestiary.npcs.filter(npc => npc !== npcToDelete);
		
		sortAndSwitchToNpc(null);
		saveActiveBestiaryToDB();
	}

	async function importNpc() {
		if (!app.activeBestiary) return;
		
		try {
			const [handle] = await window.showOpenFilePicker({
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const file = await handle.getFile();
			const content = await file.text();
			const loadedNPC = JSON.parse(content);
			
			const newNpc = { ...app.defaultNPC, ...loadedNPC };
			
			app.activeBestiary.npcs.push(newNpc);
			sortAndSwitchToNpc(newNpc);
			saveActiveBestiaryToDB();
			
		} catch (err) {
			if (err.name !== "AbortError") console.error("Error importing NPC:", err);
		}
	}

	async function exportNpc() {
		if (!app.activeNPC) return;

		const npcJson = JSON.stringify(app.activeNPC, null, 2);
		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: `${app.activeNPC.name || "unnamed-npc"}.json`,
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const writable = await handle.createWritable();
			await writable.write(npcJson);
			await writable.close();
		} catch (err) {
			if (err.name !== "AbortError") console.error("Error exporting NPC:", err);
		}
	}

	function updateActiveNPCFromForm() {
		if (app.isUpdatingForm || !app.activeNPC) return;

		const newName = window.ui.inputs.name.value.trim();
		if (newName && newName.toLowerCase() !== (app.activeNPC.name || "").toLowerCase()) {
			const isDuplicate = app.activeBestiary.npcs.some((npc, index) => 
				index !== app.activeNPCIndex && npc.name.toLowerCase() === newName.toLowerCase()
			);

			if (isDuplicate) {
				alert(`An NPC named "${newName}" already exists in this bestiary.`);
				window.ui.inputs.name.value = app.activeNPC.name; // Revert to the old name
				return; // Stop the update
			}
		}

		for (const key in window.ui.inputs) {
			if (key === 'description') {
				app.activeNPC[key] = window.ui.inputs.description.value;
				continue;
			}
			const element = window.ui.inputs[key];
			const customToggle = document.getElementById(`toggle-custom-${key}`);
			if (customToggle) {
				if (customToggle.checked) {
					const customInput = document.getElementById(`npc-${key}-custom`);
					app.activeNPC[key] = customInput.value;
				} else {
					app.activeNPC[key] = element.value;
				}
			} else if (element.type === "checkbox") {
				app.activeNPC[key] = element.checked;
			} else {
				app.activeNPC[key] = element.value;
			}
		}

		const selectedLanguages = new Set();
		window.ui.languageListboxes.forEach(listbox => {
			if (listbox) {
				Array.from(listbox.selectedOptions).forEach(option => {
					selectedLanguages.add(option.value);
				});
			}
		});
		app.activeNPC.selectedLanguages = Array.from(selectedLanguages);

		const telepathyCheckbox = document.getElementById('npc-has-telepathy');
		if (telepathyCheckbox) app.activeNPC.hasTelepathy = telepathyCheckbox.checked;
		const telepathyRangeInput = document.getElementById('npc-telepathy-range');
		if (telepathyRangeInput) app.activeNPC.telepathyRange = parseInt(telepathyRangeInput.value, 10) || 0;
		const specialOptionSelect = document.getElementById('npc-special-language-option');
		if (specialOptionSelect) app.activeNPC.specialLanguageOption = parseInt(specialOptionSelect.value, 10) || 0;
		let languagesModified = false;
		if (app.activeNPC.specialLanguageOption === 1) { // Speaks no languages
			if (app.activeNPC.selectedLanguages.length > 0) {
				app.activeNPC.selectedLanguages = [];
				languagesModified = true;
			}
		} else if (app.activeNPC.specialLanguageOption === 2) { // Speaks all languages
			const allLangs = [
				...app.standardLanguages,
				...app.exoticLanguages,
				...app.monstrousLanguages1,
				...app.monstrousLanguages2,
				...(app.activeBestiary.metadata.userDefinedLanguages || [])
			];
			if (app.activeNPC.selectedLanguages.length !== allLangs.length) {
				 app.activeNPC.selectedLanguages = allLangs;
				 languagesModified = true;
			}
		}

		for (const key in window.ui.npcSettingsCheckboxes) {
			app.activeNPC[key] = window.ui.npcSettingsCheckboxes[key].checked;
		}
		
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		abilities.forEach(ability => {
			app.activeNPC[`${ability}SavingThrowProf`] = document.getElementById(`npc-${ability}-saving-throw-prof`).checked;
			app.activeNPC[`${ability}SavingThrowAdjust`] = parseInt(document.getElementById(`npc-${ability}-saving-throw-adjust`).value, 10) || 0;
		});
		
		skills.forEach(skill => {
            app.activeNPC[`skill_${skill.id}_prof`] = document.getElementById(`skill-${skill.id}-prof`).checked;
            app.activeNPC[`skill_${skill.id}_exp`] = document.getElementById(`skill-${skill.id}-exp`).checked;
            app.activeNPC[`skill_${skill.id}_adjust`] = parseInt(document.getElementById(`skill-${skill.id}-adjust`).value, 10) || 0;
        });
		
		damageTypes.forEach(type => {
			app.activeNPC[`vulnerability_${type}`] = document.getElementById(`vuln-${type}`).checked;
			app.activeNPC[`resistance_${type}`] = document.getElementById(`res-${type}`).checked;
			app.activeNPC[`immunity_${type}`] = document.getElementById(`imm-${type}`).checked;
		});

		conditions.forEach(condition => {
			app.activeNPC[`ci_${condition}`] = document.getElementById(`ci-${condition}`).checked;
		});

		const selectedWeaponRes = document.querySelector('input[name="weapon-resistance"]:checked');
		if (selectedWeaponRes) {
			app.activeNPC.weaponResistance = selectedWeaponRes.value;
		}

		const selectedWeaponImm = document.querySelector('input[name="weapon-immunity"]:checked');
		if (selectedWeaponImm) {
			app.activeNPC.weaponImmunity = selectedWeaponImm.value;
		}

		app.activeNPC.experience = window.ui.experienceDisplay.textContent;
		app.activeNPC.proficiencyBonus = parseInt(window.ui.proficiencyBonusDisplay.textContent.replace('+', ''), 10);
		
		calculateAllStats();
		window.ui.updateStatDisplays();
		window.viewport.updateViewport();
		
		const currentOption = window.ui.npcSelector.options[window.ui.npcSelector.selectedIndex];
		if(currentOption) {
			currentOption.textContent = app.activeNPC.name;
		}
		if (languagesModified) {
			window.ui.updateFormFromActiveNPC();
		}

		saveActiveBestiaryToDB();
	}
	
	// --- Calculation Functions ---
	function calculateAbilityBonus(score) {
		return Math.floor((parseInt(score, 10) - 10) / 2);
	}

	function calculateProficiencyBonus(cr) {
		const crValue = Number(String(cr).replace(/[^0-9.]/g, ''));
		if (crValue <= 4) return 2;
		if (crValue <= 8) return 3;
		if (crValue <= 12) return 4;
		if (crValue <= 16) return 5;
		if (crValue <= 20) return 6;
		if (crValue <= 24) return 7;
		if (crValue <= 28) return 8;
		return 9; // for CR 29-30
	}
	
	function calculateSpeedString(npc) {
		if (!npc) return "";

		let speedParts = [];
		let baseSpeedString = `${npc.speedBase || 0} ft.`;
		
		if (parseInt(npc.speedBase, 10) > 0 || (parseInt(npc.speedBase, 10) === 0 && !npc.speedBurrow && !npc.speedClimb && !npc.speedFly && !npc.speedSwim)) {
			speedParts.push(baseSpeedString);
		}

		if (npc.speedBurrow > 0) {
			speedParts.push(`burrow ${npc.speedBurrow} ft.`);
		}
		if (npc.speedClimb > 0) {
			speedParts.push(`climb ${npc.speedClimb} ft.`);
		}
		if (npc.speedFly > 0) {
			let flyString = `fly ${npc.speedFly} ft.`;
			if (npc.flyHover) {
				flyString += " (hover)";
			}
			speedParts.push(flyString);
		}
		if (npc.speedSwim > 0) {
			speedParts.push(`swim ${npc.speedSwim} ft.`);
		}
		
		if (speedParts.length > 1 && speedParts[0] === '0 ft.') {
			speedParts.shift();
		}

		return speedParts.join(', ');
	}

	function calculateSensesString(npc) {
		if (!npc) return "";
		const sensesParts = [];

		if (npc.senseBlindsight > 0) {
			let blindString = `blindsight ${npc.senseBlindsight} ft.`;
			if (npc.blindBeyond) {
				blindString += " (blind beyond this radius)";
			}
			sensesParts.push(blindString);
		}
		if (npc.senseDarkvision > 0) {
			sensesParts.push(`darkvision ${npc.senseDarkvision} ft.`);
		}
		if (npc.senseTremorsense > 0) {
			sensesParts.push(`tremorsense ${npc.senseTremorsense} ft.`);
		}
		if (npc.senseTruesight > 0) {
			sensesParts.push(`truesight ${npc.senseTruesight} ft.`);
		}
		
		sensesParts.push(`passive Perception ${npc.passivePerception || 10}`);

		return sensesParts.join(', ');
	}

	function calculateDamageModifiersString(npc) {
		if (!npc) return { vulnerabilities: "", resistances: "", immunities: "" };

		const vulnerabilities = [];
		const resistances = [];
		const immunities = [];

		damageTypes.forEach(type => {
			if (npc[`vulnerability_${type}`]) {
				vulnerabilities.push(type);
			}
			if (npc[`resistance_${type}`]) {
				resistances.push(type);
			}
			if (npc[`immunity_${type}`]) {
				immunities.push(type);
			}
		});
		
		let resistanceString = resistances.join(', ');
		let immunityString = immunities.join(', ');
		
		const weaponResTextMap = {
			'nonmagical': "bludgeoning, piercing, and slashing from nonmagical attacks",
			'silvered': "bludgeoning, piercing, and slashing from nonmagical attacks that aren't silvered",
			'adamantine': "bludgeoning, piercing, and slashing from nonmagical attacks that aren't adamantine",
			'cold-forged': "bludgeoning, piercing, and slashing from nonmagical attacks that aren't cold-forged iron",
			'magical': "bludgeoning, piercing, and slashing from magical attacks",
		};
		const weaponResText = weaponResTextMap[npc.weaponResistance];
		if (weaponResText) {
			if (resistanceString) {
				resistanceString += '; ' + weaponResText;
			} else {
				resistanceString = weaponResText;
			}
		}
		
		const weaponImmTextMap = {
			'nonmagical': "bludgeoning, piercing, and slashing from nonmagical attacks",
			'silvered': "bludgeoning, piercing, and slashing from nonmagical attacks that aren't silvered",
			'adamantine': "bludgeoning, piercing, and slashing from nonmagical attacks that aren't adamantine",
			'cold-forged': "bludgeoning, piercing, and slashing from nonmagical attacks that aren't cold-forged iron",
		};
		const weaponImmText = weaponImmTextMap[npc.weaponImmunity];
		if (weaponImmText) {
			if (immunityString) {
				immunityString += '; ' + weaponImmText;
			} else {
				immunityString = weaponImmText;
			}
		}


		return {
			vulnerabilities: vulnerabilities.join(', '),
			resistances: resistanceString,
			immunities: immunityString
		};
	}
	
	function calculateConditionImmunitiesString(npc) {
		if (!npc) return "";
		const immuneConditions = [];
		conditions.forEach(condition => {
			if (npc[`ci_${condition}`]) {
				immuneConditions.push(condition);
			}
		});
		return immuneConditions.join(', ');
	}

	function calculateLanguagesString(npc) {
		if (!npc) return "";

		switch (npc.specialLanguageOption) {
			case 1: return "—";
			case 2: return "All";
			case 3: return "the languages it knew in life";
			case 4:
				const knownLanguages = [...(npc.selectedLanguages || [])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join(', ');
				return `Understands ${knownLanguages || 'no languages'} but can't speak`;
			case 5: return "Understands the languages of its creator but can't speak";
			case 6: return "Understands the languages it knew in life but can't speak";
			case 0: default: break;
		}
	
		let languages = [...(npc.selectedLanguages || [])];
		if (languages.length === 0 && !npc.hasTelepathy) {
			return "";
		}
	
		languages.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
		let languageString = languages.join(', ');
	
		if (npc.hasTelepathy) {
			const telepathyText = `telepathy ${npc.telepathyRange || 0} ft.`;
			if (languageString.length > 0) {
				languageString += `, ${telepathyText}`;
			} else {
				languageString = telepathyText;
			}
		}
	
		return languageString;
	}

	function calculateAllStats() {
		if (!app.activeNPC) return;
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		const abilityAbbr = { strength: 'Str', dexterity: 'Dex', constitution: 'Con', intelligence: 'Int', wisdom: 'Wis', charisma: 'Cha' };
		
		abilities.forEach(ability => {
			const score = app.activeNPC[ability] || 10;
			app.activeNPC[`${ability}Bonus`] = calculateAbilityBonus(score);
		});

		const profBonus = app.activeNPC.proficiencyBonus || 2;
		const savesArray = [];
		abilities.forEach(ability => {
			const base = app.activeNPC[`${ability}Bonus`] || 0;
			const isProficient = app.activeNPC[`${ability}SavingThrowProf`] || false;
			const adjust = app.activeNPC[`${ability}SavingThrowAdjust`] || 0;
			const total = base + (isProficient ? profBonus : 0) + adjust;
			
			if (isProficient || adjust !== 0) {
				savesArray.push(`${abilityAbbr[ability]} ${total >= 0 ? '+' : ''}${total}`);
			}
		});
		app.activeNPC.saves = savesArray.join(', ');
		
		calculateAllSkills();

		const perceptionProf = app.activeNPC.skill_perception_prof || false;
		const perceptionExp = app.activeNPC.skill_perception_exp || false;
		const perceptionAdjust = app.activeNPC.skill_perception_adjust || 0;
		const perceptionBonus = (app.activeNPC.wisdomBonus || 0) +
								(perceptionProf ? profBonus : 0) +
								(perceptionExp ? profBonus : 0) +
								perceptionAdjust;
		app.activeNPC.passivePerception = 10 + perceptionBonus;
		
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

            const total = baseAbilityBonus + (isProf ? profBonus : 0) + (isExp ? profBonus : 0) + adjust;

            if (isProf || isExp || adjust !== 0) {
                skillsArray.push(`${skill.name} ${total >= 0 ? '+' : ''}${total}`);
            }
        });
        app.activeNPC.npcSkills = skillsArray.join(', ');
    }

	// --- NEW ACTION FUNCTIONS ---
	function addOrUpdateAction(type) {
		if (!app.activeNPC) return;
		const name = window.ui.inputs.commonName.value.trim();
		const desc = window.ui.inputs.commonDesc.value.trim();
		if (!name || !desc) {
			showAlert("Please provide both a name and a description.");
			return;
		}

		if (currentlyEditingAction) {
			const oldType = currentlyEditingAction.dataset.actionType;
			const oldIndex = parseInt(currentlyEditingAction.dataset.actionIndex, 10);
			
			// If type is different, remove from old list
			if(oldType !== type) {
				app.activeNPC.actions[oldType].splice(oldIndex, 1);
			}
			
			// Add/update in the new list
			const newAction = { name, desc };
			if(oldType === type) {
				app.activeNPC.actions[type][oldIndex] = newAction;
			} else {
				app.activeNPC.actions[type].push(newAction);
			}
		} else {
			app.activeNPC.actions[type].push({ name, desc });
		}
		
		window.ui.renderActions();
		clearInputs();
		saveActiveBestiaryToDB();
		window.viewport.updateViewport();
	}

	function editAction(element) {
		if (currentlyEditingAction) {
			currentlyEditingAction.classList.remove("editing");
		}
		currentlyEditingAction = element;
		currentlyEditingAction.classList.add("editing");

		const name = element.querySelector(".action-name").textContent;
		const desc = element.querySelector(".action-desc").textContent;

		window.ui.inputs.commonName.value = name;
		window.ui.inputs.commonDesc.value = desc;
		window.ui.clearEditBtn.classList.remove("hidden");
		window.ui.inputs.commonName.focus();
	}

	function clearInputs() {
		window.ui.inputs.commonName.value = "";
		window.ui.inputs.commonDesc.value = "";
		if (currentlyEditingAction) {
			currentlyEditingAction.classList.remove("editing");
			currentlyEditingAction = null;
		}
		window.ui.clearEditBtn.classList.add("hidden");
	}

	function editBoilerplate(element) {
        boilerplateTarget = element;
        document.getElementById("boilerplate-editor").value = element.textContent;
        openModal('boilerplate-modal');
    }

    function saveBoilerplate() {
        if (boilerplateTarget && app.activeNPC) {
            const newText = document.getElementById("boilerplate-editor").value;
            boilerplateTarget.textContent = newText;
            if (boilerplateTarget.id === 'legendary-boilerplate') {
                app.activeNPC.legendaryBoilerplate = newText;
            } else if (boilerplateTarget.id === 'lair-boilerplate') {
                app.activeNPC.lairBoilerplate = newText;
            }
            saveActiveBestiaryToDB();
            window.viewport.updateViewport();
        }
        closeModal('boilerplate-modal');
    }

	// --- DICE SELECTOR LOGIC (REUSABLE) ---
	function createDiceSelector(container, targetInput) {
		if (!container || !targetInput) return;
		container.innerHTML = ''; // Clear previous icons
		const dice = [4, 6, 8, 10, 12, 20, 100];

		dice.forEach((sides) => {
			const dieWrapper = document.createElement('div');
			dieWrapper.className = 'die-icon';
			dieWrapper.title = `Left click to add 1d${sides}.\nRight click to remove 1d${sides}.`;
			dieWrapper.innerHTML = `<svg viewBox="0 0 1000 1000" width="32" height="32"><use href="#icon-die-d${sides}" fill="currentColor"></use></svg>`;
			
			dieWrapper.addEventListener('click', () => updateDiceString(targetInput, sides, 1));
			dieWrapper.addEventListener('contextmenu', (e) => { e.preventDefault(); updateDiceString(targetInput, sides, -1); });
			container.appendChild(dieWrapper);
		});

		const bonusWrapper = document.createElement('div');
		bonusWrapper.className = 'bonus-icon die-icon';
		bonusWrapper.title = `Left click to add 1 to the bonus.\nRight click to subtract 1 from the bonus.`;
		bonusWrapper.innerHTML = `<svg viewBox="0 0 1000 1000" width="32" height="32"><use href="#icon-die-bonus" fill="currentColor"></use></svg>`;
		bonusWrapper.addEventListener('click', () => updateBonus(targetInput, 1));
		bonusWrapper.addEventListener('contextmenu', (e) => { e.preventDefault(); updateBonus(targetInput, -1); });
		container.appendChild(bonusWrapper);
	}

	function updateDiceString(targetInput, sides, change) {
		let currentValue = targetInput.value.trim(); const dieTerm = `d${sides}`; let terms = currentValue.split('+').map(t => t.trim()).filter(t => t); let found = false;
		terms = terms.map(term => { if (term.endsWith(dieTerm)) { found = true; const count = parseInt(term.slice(0, -dieTerm.length), 10) || 1; const newCount = count + change; return newCount > 0 ? `${newCount}${dieTerm}` : null; } return term; }).filter(t => t);
		if (!found && change > 0) { terms.push(`1${dieTerm}`); }
		targetInput.value = terms.join(' + ');
	}

	function updateBonus(targetInput, change) {
		if (!targetInput) return;
		let expression = targetInput.value.trim();
		
		let dicePart = expression;
		let bonus = 0;

		const bonusRegex = /([+\-]\s*\d+)$/;
		const match = expression.match(bonusRegex);

		if (match) {
			const sign = match[1].includes('+') ? 1 : -1;
			const value = parseInt(match[1].replace(/[+\-]/g, '').trim(), 10);
			bonus = sign * value;
			dicePart = expression.substring(0, match.index).trim();
		} else if (!isNaN(parseInt(expression)) && expression.indexOf('d') === -1) {
			bonus = parseInt(expression, 10) || 0;
			dicePart = '';
		}

		const newBonus = bonus + change;

		let newExpression = dicePart;
		if (newBonus !== 0) {
			if (dicePart) {
				newExpression += newBonus > 0 ? ` + ${newBonus}` : ` - ${Math.abs(newBonus)}`;
			} else {
				newExpression = `${newBonus}`;
			}
		}

		targetInput.value = newExpression;
	}

	// --- ATTACK HELPER SPECIFIC LOGIC ---
	function addDamageRow() {
		const container = document.getElementById('all-damage-rows-container');
		const newRow = document.createElement('div');
		const newIdSuffix = container.children.length;
		newRow.className = 'additional-damage-row p-3 border rounded-lg bg-gray-50';
		newRow.innerHTML = `
			<div class="flex flex-wrap items-center gap-4 text-sm">
				<div class="flex-grow"><input id="add-damage-dice-${newIdSuffix}" type="text" placeholder="Damage" class="w-full rounded-md border-gray-300 info-input damage-expression" title="Enter the damage dice and bonus manually, or use the clickable icons."></div>
				<div id="add-dice-selector-${newIdSuffix}" class="dice-selector-container flex items-center"></div>
				<div><select id="add-damage-type-${newIdSuffix}" class="rounded-md border-gray-300 info-select damage-type" title="Select the type of damage this attack deals."></select></div>
				<button onclick="this.parentElement.parentElement.remove()" class="px-2 py-0.5 border rounded-full text-xs font-bold self-start">X</button>
			</div>
		`;
		container.appendChild(newRow);
		window.ui.populateDamageTypes(`add-damage-type-${newIdSuffix}`);
		createDiceSelector(document.getElementById(`add-dice-selector-${newIdSuffix}`), document.getElementById(`add-damage-dice-${newIdSuffix}`));
	}

	function generateAttackString() {
		const type = document.getElementById('attack-type').value; const bonusRaw = document.getElementById('attack-bonus').value; const reachRaw = document.getElementById('attack-reach').value; const target = document.getElementById('attack-target').value;
		if (!bonusRaw || !reachRaw) { showAlert('Please provide at least a bonus and reach/range.'); return; }
		const bonus = parseInt(bonusRaw) >= 0 ? `+${bonusRaw}` : bonusRaw; const reach = `${reachRaw} ft.`; let fullString = `${type}: ${bonus} to hit, reach ${reach}, ${target}. Hit: `; let damageParts = [];
		
		const pExpression = document.getElementById('attack-damage-dice').value.trim();
		const pType = document.getElementById('attack-damage-type').value;
		if (pExpression) { damageParts.push(`(${pExpression}) ${pType} damage`); }
		
		document.querySelectorAll('.additional-damage-row').forEach(row => {
			const aExpression = row.querySelector('.damage-expression').value.trim();
			const aType = row.querySelector('.damage-type').value;
			 if (aExpression) { damageParts.push(`plus (${aExpression}) ${aType} damage`); }
		});
		
		if(damageParts.length === 0) { showAlert('Please add at least one damage component.'); return; }
		fullString += damageParts.join(' ') + '.';
		window.ui.inputs.commonDesc.value = fullString;
		closeModal('attack-helper-modal');
	}

	// --- MODAL & ALERT HELPERS ---
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
			window.ui.modalOverlay.classList.remove('hidden');
            modal.classList.remove('hidden');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
			const allModals = document.querySelectorAll('.modal-content');
			const isAnyModalOpen = Array.from(allModals).some(m => !m.classList.contains('hidden'));
			if (!isAnyModalOpen) {
				window.ui.modalOverlay.classList.add('hidden');
			}
        }
    }

    function showAlert(message) {
        document.getElementById("alert-message").textContent = message;
        openModal('alert-modal');
    }

	// --- INITIALIZATION ---
	window.ui.init();
});
