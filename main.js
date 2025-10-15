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
		// --- New Language Properties ---
		selectedLanguages: [],
		specialLanguageOption: 0,
		hasTelepathy: false,
		telepathyRange: 0,
		// --- End New Language Properties ---
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
		male: ['he', 'his', 'him', 'his'],
		female: ['she', 'her', 'her', 'hers'],
		neutral: ['they', 'their', 'them', 'theirs'],
		creature: ['it', 'its', 'it', 'theirs']
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
    };


	// --- FUNCTIONS ---
	
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
		const bestiaryName = newBestiaryNameInput.value.trim();
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
				userDefinedLanguages: [] // New property initialized
			},
			npcs: [{ ...app.defaultNPC, name: "New NPC", fg_group: bestiaryName }]
		};

		try {
			const newId = await app.db.projects.add(newBestiary);
			newBestiary.id = newId;
			loadBestiary(newBestiary);
			hideAllModals();
			newBestiaryNameInput.value = "";
		} catch (error) {
			console.error("Failed to create bestiary:", error);
			alert("Error: Could not create bestiary. Check console for details.");
		}
	}

	function healBestiary(bestiary) {
		// Ensure metadata object and its properties exist
		if (typeof bestiary.metadata !== 'object' || bestiary.metadata === null) {
			bestiary.metadata = {};
		}
		if (!Array.isArray(bestiary.metadata.userDefinedLanguages)) {
			bestiary.metadata.userDefinedLanguages = []; // Initialize new property
		}
		
		const propsToConvert = ['addDescription', 'addTitle', 'addImageLink', 'useDropCap'];
		propsToConvert.forEach(prop => {
			if (typeof bestiary.metadata[prop] === 'number') {
				bestiary.metadata[prop] = bestiary.metadata[prop] === 1;
			} else if (bestiary.metadata[prop] === undefined) {
				bestiary.metadata[prop] = true; // Default to true if missing
			}
		});

		// Ensure npcs is an array
		if (!Array.isArray(bestiary.npcs)) {
			bestiary.npcs = [];
		}

		// Data Healing: Ensure all properties exist on each NPC.
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
			
			// --- Language property healing (Phase 1) ---
			if (!Array.isArray(healedNpc.selectedLanguages)) healedNpc.selectedLanguages = [];
			if (healedNpc.specialLanguageOption === undefined) healedNpc.specialLanguageOption = 0;
			if (healedNpc.hasTelepathy === undefined) healedNpc.hasTelepathy = false;
			if (healedNpc.telepathyRange === undefined) healedNpc.telepathyRange = 0;
			// --- End language healing ---

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
				// Create a stripped down copy before saving (remove circular references, large data if needed)
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
		const newNpc = { 
			...app.defaultNPC,
			name: findUniqueNpcName("New NPC"),
			useDropCap: app.activeBestiary.metadata.useDropCap,
			addDescription: app.activeBestiary.metadata.addDescription,
			addTitle: app.activeBestiary.metadata.addTitle,
			addImageLink: app.activeBestiary.metadata.addImageLink,
			fg_group: app.activeBestiary.projectName // Set default group
		};
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

		// --- Language section read (Phase 1) ---
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
		// --- End language section ---

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
		
		// Just update the name in the dropdown, don't re-sort on every keystroke
		const currentOption = window.ui.npcSelector.options[window.ui.npcSelector.selectedIndex];
		if(currentOption) {
			currentOption.textContent = app.activeNPC.name;
		}

		saveActiveBestiaryToDB(); // Auto-save on any change
	}

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

	// Helper function for Phase 1
	function calculateLanguagesString(npc) {
		if (!npc) return "";
	
		let languages = [...(npc.selectedLanguages || [])];
		if (languages.length === 0 && !npc.hasTelepathy) {
			return "";
		}
	
		languages.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
		let languageString = languages.join(', ');
	
		// Telepathy is handled only if specialLanguageOption is 0 (Standard)
		if (npc.hasTelepathy) {
			switch (npc.specialLanguageOption) {
				case 0: 
					const telepathyText = `telepathy ${npc.telepathyRange || 0} ft.`;
					if (languageString.length > 0) {
						languageString += `, ${telepathyText}`;
					} else {
						languageString = telepathyText;
					}
					break;
				case 1:
					// Placeholder 1: do nothing
					break;
				case 2:
					// Placeholder 2: do nothing
					break;
				case 3:
					// Placeholder 3: do nothing
					break;
				case 4:
					// Placeholder 4: do nothing
					break;
				case 5:
					// Placeholder 5: do nothing
					break;
				case 6:
					// Placeholder 6: do nothing
					break;
			}
		}
	
		return languageString;
	}

	function calculateAllStats() {
		if (!app.activeNPC) return;
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		const abilityAbbr = { strength: 'Str', dexterity: 'Dex', constitution: 'Con', intelligence: 'Int', wisdom: 'Wis', charisma: 'Cha' };
		
		// 1. Calculate ability bonuses
		abilities.forEach(ability => {
			const score = app.activeNPC[ability] || 10;
			app.activeNPC[`${ability}Bonus`] = calculateAbilityBonus(score);
		});

		// 2. Calculate saving throws
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
		
		// 3. Calculate Skills
		calculateAllSkills();

		// 4. Calculate Passive Perception
		const perceptionProf = app.activeNPC.skill_perception_prof || false;
		const perceptionExp = app.activeNPC.skill_perception_exp || false;
		const perceptionAdjust = app.activeNPC.skill_perception_adjust || 0;
		const perceptionBonus = (app.activeNPC.wisdomBonus || 0) +
								(perceptionProf ? profBonus : 0) +
								(perceptionExp ? profBonus : 0) +
								perceptionAdjust;
		app.activeNPC.passivePerception = 10 + perceptionBonus;
		
		// 5. Calculate Speed String
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


	
	// --- INITIALIZATION ---
	window.ui.init();


});
