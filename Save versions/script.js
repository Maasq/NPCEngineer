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
		npcSkills: ""
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

	// --- UI ELEMENTS ---
	const mainContentColumn = document.getElementById('main-content-column');
	const viewport = document.getElementById("viewport");
	const bestiaryStatusEl = document.getElementById("bestiary-status");
	
	// Bestiary Buttons
	const newBestiaryBtn = document.getElementById("newBestiaryBtn");
	const loadBestiaryBtn = document.getElementById("loadBestiaryBtn");
	const exportBestiaryBtn = document.getElementById("exportBestiaryBtn");
	const importBestiaryBtn = document.getElementById("importBestiaryBtn");

	// NPC Buttons
	const newNpcBtn = document.getElementById("newNpcBtn");
	const duplicateNpcBtn = document.getElementById("duplicateNpcBtn");
	const importNpcBtn = document.getElementById("importNpcBtn");
	const exportNpcBtn = document.getElementById("exportNpcBtn");
	const deleteNpcBtn = document.getElementById("deleteNpcBtn");
	
	// Menu Items
	const hamburgerBtn = document.getElementById('hamburger-btn');
	const mainMenu = document.getElementById('main-menu');
	const menuNewBestiary = document.getElementById('menu-new-bestiary');
	const menuLoadBestiary = document.getElementById('menu-load-bestiary');
	const menuImportBestiary = document.getElementById('menu-import-bestiary');
	const menuExportBestiary = document.getElementById('menu-export-bestiary');
	const menuNewNpc = document.getElementById('menu-new-npc');
	const menuDuplicateNpc = document.getElementById('menu-duplicate-npc');
	const menuImportNpc = document.getElementById('menu-import-npc');
	const menuExportNpc = document.getElementById('menu-export-npc');
	const menuDeleteNpc = document.getElementById('menu-delete-npc');
	const menuSettings = document.getElementById('menu-settings');


	// NPC Selector
	const npcSelector = document.getElementById("npc-selector");
	const npcOptionsContainer = document.getElementById('npc-options-container');

	// Modals & Overlays
	const modalOverlay = document.getElementById("modal-overlay");
	const newBestiaryModal = document.getElementById("new-bestiary-modal");
	const loadBestiaryModal = document.getElementById("load-bestiary-modal");
	const hpModal = document.getElementById("hp-modal");
	const settingsModal = document.getElementById('settings-modal');
	
	// Modal-specific elements
	const createBestiaryBtn = document.getElementById("create-bestiary-btn");
	const newBestiaryNameInput = document.getElementById("new-bestiary-name");
	const bestiaryListDiv = document.getElementById("bestiary-list");
	const manageGroupsBtn = document.getElementById('manage-groups-btn');
	const manageGroupsModal = document.getElementById('manage-groups-modal');
	const addGroupBtn = document.getElementById('add-group-btn');
	const newGroupNameInput = document.getElementById('new-group-name');
	const groupListDiv = document.getElementById('group-list');
	const settingsOkBtn = document.getElementById('settings-ok-btn');

	const tokenBox = document.getElementById("npc-token");
	const tokenUpload = document.getElementById("token-upload");
	const imageBox = document.getElementById("npc-image");
	const imageUpload = document.getElementById("image-upload");

	const hpModalCloseBtn = document.getElementById("hp-modal-close");
	const hpApplyBtn = document.getElementById("hp-apply-btn");
	const numDiceInput = document.getElementById("hp-num-dice");
	const dieTypeSelect = document.getElementById("hp-die-type");
	const bonusInput = document.getElementById("hp-bonus");
	const experienceDisplay = document.getElementById("npc-experience-display");
	const proficiencyBonusDisplay = document.getElementById("npc-proficiency-bonus-display");

	// Settings Checkboxes
	const bestiarySettingsCheckboxes = {
		addDescription: document.getElementById('bestiary-add-description'),
		addTitle: document.getElementById('bestiary-add-title'),
		addImageLink: document.getElementById('bestiary-add-image-link'),
		useDropCap: document.getElementById('bestiary-use-drop-cap'),
	};
	const npcSettingsCheckboxes = {
		addDescription: document.getElementById('npc-add-description'),
		addTitle: document.getElementById('npc-add-title'),
		addImageLink: document.getElementById('npc-add-image-link'),
		useDropCap: document.getElementById('npc-use-drop-cap'),
	};

	// --- FORM INPUTS ---
	const inputs = {
		name: document.getElementById("npc-name"),
		size: document.getElementById("npc-size"),
		type: document.getElementById("npc-type"),
		species: document.getElementById("npc-species"),
		alignment: document.getElementById("npc-alignment"),
		armorClass: document.getElementById("npc-ac"),
		hitPoints: document.getElementById("npc-hp"),
		challenge: document.getElementById("npc-challenge"),
		strength: document.getElementById("npc-strength"),
		dexterity: document.getElementById("npc-dexterity"),
		constitution: document.getElementById("npc-constitution"),
		intelligence: document.getElementById("npc-intelligence"),
		wisdom: document.getElementById("npc-wisdom"),
		charisma: document.getElementById("npc-charisma"),
		gender: document.getElementById("npc-gender"),
		isUnique: document.getElementById("npc-unique"),
		isProperName: document.getElementById("npc-proper"),
		description: document.getElementById("npc-description"), // hidden input for Trix
		speedBase: document.getElementById('npc-speed-base'),
		speedFly: document.getElementById('npc-speed-fly'),
		flyHover: document.getElementById('npc-fly-hover'),
		speedClimb: document.getElementById('npc-speed-climb'),
		speedSwim: document.getElementById('npc-speed-swim'),
		speedBurrow: document.getElementById('npc-speed-burrow'),
		senseBlindsight: document.getElementById('npc-sense-blindsight'),
		blindBeyond: document.getElementById('npc-blind-beyond'),
		senseDarkvision: document.getElementById('npc-sense-darkvision'),
		senseTremorsense: document.getElementById('npc-sense-tremorsense'),
		senseTruesight: document.getElementById('npc-sense-truesight'),
		fg_group: document.getElementById('fantasy-grounds-group')
	};

	// --- FUNCTIONS ---
	
	function findUniqueNpcName(baseName) {
		if (!activeBestiary) return baseName;
		let newName = baseName;
		let counter = 1;
		while (activeBestiary.npcs.some(npc => npc.name.toLowerCase() === newName.toLowerCase())) {
			counter++;
			newName = `${baseName} ${counter}`;
		}
		return newName;
	}

	// --- Bestiary Management ---
	function showNewBestiaryModal() {
		modalOverlay.classList.remove('hidden');
		newBestiaryModal.classList.remove('hidden');
		newBestiaryNameInput.focus();
	}

	async function createNewBestiary() {
		const bestiaryName = newBestiaryNameInput.value.trim();
		if (!bestiaryName) {
			alert("Bestiary name cannot be empty.");
			return;
		}
		const existingBestiary = await db.projects.where('projectName').equalsIgnoreCase(bestiaryName).first();
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
				fg_groups: []
			},
			npcs: [{ ...defaultNPC, name: "New NPC", fg_group: bestiaryName }]
		};

		try {
			const newId = await db.projects.add(newBestiary);
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
				return { ...defaultNPC, name: findUniqueNpcName("Recovered Corrupt NPC") };
			}
			
			const healedNpc = { ...defaultNPC, ...npc };

			propsToConvert.forEach(prop => {
				if (typeof healedNpc[prop] === 'number') {
					healedNpc[prop] = healedNpc[prop] === 1;
				} else if (healedNpc[prop] === undefined) {
					healedNpc[prop] = bestiary.metadata[prop];
				}
			});
			
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
			bestiary.npcs.push({ ...defaultNPC, name: "New NPC", fg_group: bestiary.projectName });
		}

		return bestiary;
	}

	function loadBestiary(bestiary) {
		try {
			const healedBestiary = healBestiary(JSON.parse(JSON.stringify(bestiary)));
			
			activeBestiary = healedBestiary;
			sortAndSwitchToNpc(null);
			updateUIForActiveBestiary();
		} catch (error) {
			console.error("Critical error loading bestiary:", error);
			alert("There was a critical error trying to load this bestiary. It may be corrupt. Check the console for details.");
			activeBestiary = null;
			activeNPC = null;
			activeNPCIndex = -1;
			updateUIForActiveBestiary();
		}
	}
	
	function switchActiveNPC(index) {
		if (activeBestiary && index >= 0 && index < activeBestiary.npcs.length) {
			activeNPCIndex = index;
			activeNPC = activeBestiary.npcs[index];
			updateFormFromActiveNPC();
		} else if (activeBestiary && activeBestiary.npcs.length > 0) {
			activeNPCIndex = 0;
			activeNPC = activeBestiary.npcs[0];
			updateFormFromActiveNPC();
		}
	}

	async function saveActiveBestiaryToDB() {
		if (activeBestiary && activeBestiary.id) {
			try {
				await db.projects.put(activeBestiary);
			} catch (error) {
				console.error("Failed to save bestiary to DB:", error);
			}
		}
	}
	
	function sortAndSwitchToNpc(targetNpc) {
		if (!activeBestiary) return;

		activeBestiary.npcs.sort((a, b) => {
			return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: 'base' });
		});

		const newIndex = targetNpc ? activeBestiary.npcs.findIndex(npc => npc === targetNpc) : 0;
		switchActiveNPC(newIndex >= 0 ? newIndex : 0);
	}


	async function exportBestiary() {
		if (!activeBestiary) return;
		
		const bestiaryJson = JSON.stringify(activeBestiary, null, 2);
		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: `Bestiary-${activeBestiary.projectName}.json`,
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

			const existing = await db.projects.where('projectName').equalsIgnoreCase(importedBestiary.projectName).first();
			if (existing) {
				alert(`A bestiary named "${importedBestiary.projectName}" already exists.`);
				return;
			}

			importedBestiary = healBestiary(importedBestiary);

			const newId = await db.projects.add(importedBestiary);
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
		if (!activeBestiary) return;
		const newNpc = { 
			...defaultNPC,
			name: findUniqueNpcName("New NPC"),
			useDropCap: activeBestiary.metadata.useDropCap,
			addDescription: activeBestiary.metadata.addDescription,
			addTitle: activeBestiary.metadata.addTitle,
			addImageLink: activeBestiary.metadata.addImageLink,
			fg_group: activeBestiary.projectName // Set default group
		};
		activeBestiary.npcs.push(newNpc);
		sortAndSwitchToNpc(newNpc);
		saveActiveBestiaryToDB();
		inputs.name.focus();
	}

	function duplicateCurrentNpc() {
		if (!activeBestiary || !activeNPC) return;

		const newNpc = JSON.parse(JSON.stringify(activeNPC));
		newNpc.name = findUniqueNpcName(`${activeNPC.name} (Copy)`);

		activeBestiary.npcs.push(newNpc);
		sortAndSwitchToNpc(newNpc);
		saveActiveBestiaryToDB();
		inputs.name.focus();
	}
	
	function deleteCurrentNpc() {
		if (!activeBestiary || activeBestiary.npcs.length <= 1) return;

		const npcToDelete = activeNPC;
		activeBestiary.npcs = activeBestiary.npcs.filter(npc => npc !== npcToDelete);
		
		sortAndSwitchToNpc(null);
		saveActiveBestiaryToDB();
	}

	async function importNpc() {
		if (!activeBestiary) return;
		
		try {
			const [handle] = await window.showOpenFilePicker({
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const file = await handle.getFile();
			const content = await file.text();
			const loadedNPC = JSON.parse(content);
			
			const newNpc = { ...defaultNPC, ...loadedNPC };
			
			activeBestiary.npcs.push(newNpc);
			sortAndSwitchToNpc(newNpc);
			saveActiveBestiaryToDB();
			
		} catch (err) {
			if (err.name !== "AbortError") console.error("Error importing NPC:", err);
		}
	}

	async function exportNpc() {
		if (!activeNPC) return;

		const npcJson = JSON.stringify(activeNPC, null, 2);
		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: `${activeNPC.name || "unnamed-npc"}.json`,
				types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
			});
			const writable = await handle.createWritable();
			await writable.write(npcJson);
			await writable.close();
		} catch (err) {
			if (err.name !== "AbortError") console.error("Error exporting NPC:", err);
		}
	}
	
	// --- UI & State Update Functions ---
	function updateMenuState() {
		const hasActiveBestiary = !!activeBestiary;
		const menuItemsToToggle = [
			menuExportBestiary, menuNewNpc, menuDuplicateNpc, menuImportNpc,
			menuExportNpc, menuDeleteNpc, menuSettings
		];

		menuItemsToToggle.forEach(item => {
			if (hasActiveBestiary) {
				item.classList.remove('disabled');
			} else {
				item.classList.add('disabled');
			}
		});
		
		if (hasActiveBestiary && activeBestiary.npcs.length <= 1) {
			menuDeleteNpc.classList.add('disabled');
		}
	}

	function updateUIForActiveBestiary() {
		if (activeBestiary) {
			bestiaryStatusEl.innerHTML = `Bestiary: <span class="font-bold text-red-700">${activeBestiary.projectName} (${activeBestiary.npcs.length} NPCs)</span>`;
			mainContentColumn.style.opacity = '1';
			mainContentColumn.style.pointerEvents = 'auto';
			npcSelector.classList.remove('hidden');
			deleteNpcBtn.classList.remove('hidden');
			npcOptionsContainer.classList.remove('hidden');
			[newNpcBtn, duplicateNpcBtn, importNpcBtn, exportNpcBtn, deleteNpcBtn].forEach(btn => btn.disabled = false);
		} else {
			bestiaryStatusEl.textContent = "No Bestiary Loaded";
			mainContentColumn.style.opacity = '0.3';
			mainContentColumn.style.pointerEvents = 'none';
			npcSelector.classList.add('hidden');
			deleteNpcBtn.classList.add('hidden');
			npcOptionsContainer.classList.add('hidden');
			[newNpcBtn, duplicateNpcBtn, importNpcBtn, exportNpcBtn, deleteNpcBtn].forEach(btn => btn.disabled = true);
		}
		updateMenuState();
		updateFormFromActiveNPC();
	}
	
	function updateNpcSelector() {
		if (!activeBestiary) return;
		
		npcSelector.innerHTML = '';
		
		activeBestiary.npcs.forEach((npc, index) => {
			const option = document.createElement('option');
			option.value = index;
			option.textContent = npc.name;
			if (index === activeNPCIndex) {
				option.selected = true;
			}
			npcSelector.appendChild(option);
		});

		deleteNpcBtn.disabled = activeBestiary.npcs.length <= 1;
	}

	
	function updateFormFromActiveNPC() {
		isUpdatingForm = true;
		try {
			if (!activeNPC) {
				Object.values(inputs).forEach(input => {
					if (input.type === 'checkbox') input.checked = false;
					else input.value = '';
				});
				document.querySelector("trix-editor").editor.loadHTML("");
				viewport.innerHTML = '';
				updateNpcSelector();
				return;
			}

			for (const key in inputs) {
				if (key === 'description') {
					const trixEditorElement = document.querySelector("trix-editor");
					inputs.description.value = activeNPC[key] || '';
					if (trixEditorElement && trixEditorElement.editor) {
						trixEditorElement.editor.loadHTML(activeNPC[key] || "");
					}
					continue;
				}
				const element = inputs[key];
				const customToggle = document.getElementById(`toggle-custom-${key}`);
				if (customToggle) {
					const select = element;
					const customInput = document.getElementById(`npc-${key}-custom`);
					const npcValue = activeNPC[key] || "";
					const isStandardOption = [...select.options].some(opt => opt.value === npcValue && !opt.disabled);
					if (isStandardOption || npcValue === "") {
						select.value = npcValue;
						customToggle.checked = false;
						select.classList.remove('hidden');
						customInput.classList.add('hidden');
					} else {
						customInput.value = npcValue;
						customToggle.checked = true;
						select.classList.add('hidden');
						customInput.classList.remove('hidden');
						select.value = "";
					}
				} else if (element.type === "checkbox") {
					element.checked = activeNPC[key] || false;
				} else {
					element.value = activeNPC[key] || "";
				}
			}

			for (const key in npcSettingsCheckboxes) {
				npcSettingsCheckboxes[key].checked = activeNPC[key];
			}

			const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
			abilities.forEach(ability => {
				document.getElementById(`npc-${ability}-saving-throw-prof`).checked = activeNPC[`${ability}SavingThrowProf`] || false;
				document.getElementById(`npc-${ability}-saving-throw-adjust`).value = activeNPC[`${ability}SavingThrowAdjust`] || 0;
			});
			
			skills.forEach(skill => {
                document.getElementById(`skill-${skill.id}-prof`).checked = activeNPC[`skill_${skill.id}_prof`] || false;
                document.getElementById(`skill-${skill.id}-exp`).checked = activeNPC[`skill_${skill.id}_exp`] || false;
                document.getElementById(`skill-${skill.id}-adjust`).value = activeNPC[`skill_${skill.id}_adjust`] || 0;
            });
			
			damageTypes.forEach(type => {
				document.getElementById(`vuln-${type}`).checked = activeNPC[`vulnerability_${type}`] || false;
				document.getElementById(`res-${type}`).checked = activeNPC[`resistance_${type}`] || false;
				document.getElementById(`imm-${type}`).checked = activeNPC[`immunity_${type}`] || false;
			});
			
			conditions.forEach(condition => {
				document.getElementById(`ci-${condition}`).checked = activeNPC[`ci_${condition}`] || false;
			});

			const weaponResValue = activeNPC.weaponResistance || 'none';
			const weaponResRadio = document.querySelector(`input[name="weapon-resistance"][value="${weaponResValue}"]`);
			if (weaponResRadio) {
				weaponResRadio.checked = true;
			} else { 
				document.getElementById('wr-none').checked = true;
			}
			
			const weaponImmValue = activeNPC.weaponImmunity || 'none';
			const weaponImmRadio = document.querySelector(`input[name="weapon-immunity"][value="${weaponImmValue}"]`);
			if (weaponImmRadio) {
				weaponImmRadio.checked = true;
			} else {
				document.getElementById('wi-none').checked = true;
			}


			// Populate FG groups dropdown
			const fgGroupDropdown = document.getElementById('fantasy-grounds-group');
			fgGroupDropdown.innerHTML = '';
			const bestiaryOption = document.createElement('option');
			bestiaryOption.value = activeBestiary.projectName;
			bestiaryOption.textContent = activeBestiary.projectName;
			fgGroupDropdown.appendChild(bestiaryOption);
			(activeBestiary.metadata.fg_groups || []).forEach(group => {
				const groupOption = document.createElement('option');
				groupOption.value = group;
				groupOption.textContent = group;
				fgGroupDropdown.appendChild(groupOption);
			});
			fgGroupDropdown.value = activeNPC.fg_group || activeBestiary.projectName;

			experienceDisplay.textContent = activeNPC.experience || '';
			proficiencyBonusDisplay.textContent = `+${activeNPC.proficiencyBonus}` || '+2';
			updateTokenDisplay();
			updateImageDisplay();
			calculateAllStats();
			updateStatDisplays();
			updateViewport();
			updateNpcSelector();
		} finally {
			isUpdatingForm = false;
		}
	}

	function updateActiveNPCFromForm() {
		if (isUpdatingForm || !activeNPC) return;

		const newName = inputs.name.value.trim();
		if (newName && newName.toLowerCase() !== (activeNPC.name || "").toLowerCase()) {
			const isDuplicate = activeBestiary.npcs.some((npc, index) => 
				index !== activeNPCIndex && npc.name.toLowerCase() === newName.toLowerCase()
			);

			if (isDuplicate) {
				alert(`An NPC named "${newName}" already exists in this bestiary.`);
				inputs.name.value = activeNPC.name; // Revert to the old name
				return; // Stop the update
			}
		}

		for (const key in inputs) {
			if (key === 'description') {
				activeNPC[key] = inputs.description.value;
				continue;
			}
			const element = inputs[key];
			const customToggle = document.getElementById(`toggle-custom-${key}`);
			if (customToggle) {
				if (customToggle.checked) {
					const customInput = document.getElementById(`npc-${key}-custom`);
					activeNPC[key] = customInput.value;
				} else {
					activeNPC[key] = element.value;
				}
			} else if (element.type === "checkbox") {
				activeNPC[key] = element.checked;
			} else {
				activeNPC[key] = element.value;
			}
		}

		for (const key in npcSettingsCheckboxes) {
			activeNPC[key] = npcSettingsCheckboxes[key].checked;
		}
		
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		abilities.forEach(ability => {
			activeNPC[`${ability}SavingThrowProf`] = document.getElementById(`npc-${ability}-saving-throw-prof`).checked;
			activeNPC[`${ability}SavingThrowAdjust`] = parseInt(document.getElementById(`npc-${ability}-saving-throw-adjust`).value, 10) || 0;
		});
		
		skills.forEach(skill => {
            activeNPC[`skill_${skill.id}_prof`] = document.getElementById(`skill-${skill.id}-prof`).checked;
            activeNPC[`skill_${skill.id}_exp`] = document.getElementById(`skill-${skill.id}-exp`).checked;
            activeNPC[`skill_${skill.id}_adjust`] = parseInt(document.getElementById(`skill-${skill.id}-adjust`).value, 10) || 0;
        });
		
		damageTypes.forEach(type => {
			activeNPC[`vulnerability_${type}`] = document.getElementById(`vuln-${type}`).checked;
			activeNPC[`resistance_${type}`] = document.getElementById(`res-${type}`).checked;
			activeNPC[`immunity_${type}`] = document.getElementById(`imm-${type}`).checked;
		});

		conditions.forEach(condition => {
			activeNPC[`ci_${condition}`] = document.getElementById(`ci-${condition}`).checked;
		});

		const selectedWeaponRes = document.querySelector('input[name="weapon-resistance"]:checked');
		if (selectedWeaponRes) {
			activeNPC.weaponResistance = selectedWeaponRes.value;
		}

		const selectedWeaponImm = document.querySelector('input[name="weapon-immunity"]:checked');
		if (selectedWeaponImm) {
			activeNPC.weaponImmunity = selectedWeaponImm.value;
		}

		activeNPC.experience = experienceDisplay.textContent;
		activeNPC.proficiencyBonus = parseInt(proficiencyBonusDisplay.textContent.replace('+', ''), 10);
		
		calculateAllStats();
		updateStatDisplays();
		updateViewport();
		
		// Just update the name in the dropdown, don't re-sort on every keystroke
		const currentOption = npcSelector.options[npcSelector.selectedIndex];
		if(currentOption) {
			currentOption.textContent = activeNPC.name;
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

	function calculateAllStats() {
		if (!activeNPC) return;
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		const abilityAbbr = { strength: 'Str', dexterity: 'Dex', constitution: 'Con', intelligence: 'Int', wisdom: 'Wis', charisma: 'Cha' };
		
		// 1. Calculate ability bonuses
		abilities.forEach(ability => {
			const score = activeNPC[ability] || 10;
			activeNPC[`${ability}Bonus`] = calculateAbilityBonus(score);
		});

		// 2. Calculate saving throws
		const profBonus = activeNPC.proficiencyBonus || 2;
		const savesArray = [];
		abilities.forEach(ability => {
			const base = activeNPC[`${ability}Bonus`] || 0;
			const isProficient = activeNPC[`${ability}SavingThrowProf`] || false;
			const adjust = activeNPC[`${ability}SavingThrowAdjust`] || 0;
			const total = base + (isProficient ? profBonus : 0) + adjust;
			
			if (isProficient || adjust !== 0) {
				savesArray.push(`${abilityAbbr[ability]} ${total >= 0 ? '+' : ''}${total}`);
			}
		});
		activeNPC.saves = savesArray.join(', ');
		
		// 3. Calculate Skills
		calculateAllSkills();

		// 4. Calculate Passive Perception
		const perceptionProf = activeNPC.skill_perception_prof || false;
		const perceptionExp = activeNPC.skill_perception_exp || false;
		const perceptionAdjust = activeNPC.skill_perception_adjust || 0;
		const perceptionBonus = (activeNPC.wisdomBonus || 0) +
								(perceptionProf ? profBonus : 0) +
								(perceptionExp ? profBonus : 0) +
								perceptionAdjust;
		activeNPC.passivePerception = 10 + perceptionBonus;
		
		// 5. Calculate Speed String
		activeNPC.speed = calculateSpeedString(activeNPC);
	}
	
	function calculateAllSkills() {
        if (!activeNPC) return;
        const profBonus = activeNPC.proficiencyBonus || 2;
        const skillsArray = [];

        skills.forEach(skill => {
            const baseAbilityBonus = activeNPC[`${skill.attribute}Bonus`] || 0;
            const isProf = activeNPC[`skill_${skill.id}_prof`] || false;
            const isExp = activeNPC[`skill_${skill.id}_exp`] || false;
            const adjust = activeNPC[`skill_${skill.id}_adjust`] || 0;

            const total = baseAbilityBonus + (isProf ? profBonus : 0) + (isExp ? profBonus : 0) + adjust;

            if (isProf || isExp || adjust !== 0) {
                skillsArray.push(`${skill.name} ${total >= 0 ? '+' : ''}${total}`);
            }
        });
        activeNPC.npcSkills = skillsArray.join(', ');
    }

	function updateStatDisplays() {
		if (!activeNPC) return;
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		const profBonus = activeNPC.proficiencyBonus || 2;

		abilities.forEach(ability => {
			// Update bonus display
			const bonus = activeNPC[`${ability}Bonus`] || 0;
			const bonusEl = document.getElementById(`npc-${ability}-bonus`);
			if (bonusEl) {
				bonusEl.textContent = bonus >= 0 ? `+${bonus}` : bonus;
			}

			// Update saving throw total display
			const base = bonus;
			const isProficient = activeNPC[`${ability}SavingThrowProf`] || false;
			const adjust = activeNPC[`${ability}SavingThrowAdjust`] || 0;
			const total = base + (isProficient ? profBonus : 0) + adjust;
			const totalEl = document.getElementById(`npc-${ability}-saving-throw-total`);
			totalEl.textContent = total >= 0 ? `+${total}` : total;
		});
		
		updateSkillDisplays();
		
		document.getElementById('npc-passive-perception').textContent = activeNPC.passivePerception || 10;
	}
	
	function updateSkillDisplays() {
        if (!activeNPC) return;
        const profBonus = activeNPC.proficiencyBonus || 2;

        skills.forEach(skill => {
            const totalEl = document.getElementById(`skill-${skill.id}-total`);
            if (totalEl) {
                const baseAbilityBonus = activeNPC[`${skill.attribute}Bonus`] || 0;
                const isProf = activeNPC[`skill_${skill.id}_prof`] || false;
                const isExp = activeNPC[`skill_${skill.id}_exp`] || false;
                const adjust = activeNPC[`skill_${skill.id}_adjust`] || 0;

                const total = baseAbilityBonus + (isProf ? profBonus : 0) + (isExp ? profBonus : 0) + adjust;
                totalEl.textContent = total >= 0 ? `+${total}` : total;
            }
        });
    }

	function updateViewport() {
		if (!activeNPC) {
			viewport.innerHTML = '';
			return;
		}
		const {
			name, size, type, species, alignment, armorClass, hitPoints, description, saves, npcSkills,
			strength, dexterity, constitution, intelligence, wisdom, charisma,
			strengthBonus, dexterityBonus, constitutionBonus, intelligenceBonus, wisdomBonus, charismaBonus,
			useDropCap, addDescription, speed, challenge, experience
		} = activeNPC;
		
		const { vulnerabilities, resistances, immunities } = calculateDamageModifiersString(activeNPC);
		const conditionImmunities = calculateConditionImmunitiesString(activeNPC);
		const senses = calculateSensesString(activeNPC);

		const NPCName = name || "";
		const NPCac = armorClass || "";
		const NPChp = hitPoints || "";
		const NPCDescriptionHTML = description || "";

		let NPCTypeString = `${size || ""} ${type || ""}`.trim();
		if (species) { NPCTypeString += ` (${species})`; }
		if (alignment) { NPCTypeString += `, ${alignment}`; }

		const NPCspeed = speed || "";
		const NPCstr = strength || "10";
		const NPCstrbo = strengthBonus !== undefined ? (strengthBonus >= 0 ? `+${strengthBonus}` : strengthBonus) : "+0";
		const NPCdex = dexterity || "10";
		const NPCdexbo = dexterityBonus !== undefined ? (dexterityBonus >= 0 ? `+${dexterityBonus}` : dexterityBonus) : "+0";
		const NPCcon = constitution || "10";
		const NPCconbo = constitutionBonus !== undefined ? (constitutionBonus >= 0 ? `+${constitutionBonus}` : constitutionBonus) : "+0";
		const NPCint = intelligence || "10";
		const NPCintbo = intelligenceBonus !== undefined ? (intelligenceBonus >= 0 ? `+${intelligenceBonus}` : intelligenceBonus) : "+0";
		const NPCwis = wisdom || "10";
		const NPCwisbo = wisdomBonus !== undefined ? (wisdomBonus >= 0 ? `+${wisdomBonus}` : wisdomBonus) : "+0";
		const NPCcha = charisma || "10";
		const NPCchabo = charismaBonus !== undefined ? (charismaBonus >= 0 ? `+${charismaBonus}` : charismaBonus) : "+0";

		const dropCapClass = useDropCap ? 'drop-cap' : '';
		const descriptionHtml = addDescription ? `<div class="npcdescrip ${dropCapClass}"> ${NPCDescriptionHTML} </div>` : '';

		const generatedHtml = `
			<div class="container">
				<div class="cap"></div>
				<div class="npcname"><b>${NPCName}</b></div>
				<div class="npctype"><i>${NPCTypeString}</i></div>
				<div class="npcdiv">
					<svg viewBox="0 0 200 5" preserveAspectRatio="none" width="100%" height="5">
						<polyline points="0,0 200,2.5 0,5" fill="#922610" class="whoosh"></polyline>
					</svg>
				</div>
				<div class="npctop"><b>Armor Class</b> ${NPCac}</div>
				<div class="npctop"><b>Hit Points</b> ${NPChp}</div>
				<div class="npctop"><b>Speed</b> ${NPCspeed}</div>
				<div class="npcdiv">
					<svg viewBox="0 0 200 5" preserveAspectRatio="none" width="100%" height="5">
						<polyline points="0,0 200,2.5 0,5" fill="#922610" class="whoosh"></polyline>
					</svg>
				</div>
				<div class="npctop">
					<table class="attr" width="100%">
						<tbody>
							<tr valign="middle">
								<td><b>STR</b></td> <td><b>DEX</b></td> <td><b>CON</b></td>
								<td><b>INT</b></td> <td><b>WIS</b></td> <td><b>CHA</b></td>
							</tr>
							<tr valign="middle">
								<td>${NPCstr} (${NPCstrbo})</td> <td>${NPCdex} (${NPCdexbo})</td> <td>${NPCcon} (${NPCconbo})</td>
								<td>${NPCint} (${NPCintbo})</td> <td>${NPCwis} (${NPCwisbo})</td> <td>${NPCcha} (${NPCchabo})</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="npcdiv">
					<svg viewBox="0 0 200 5" preserveAspectRatio="none" width="100%" height="5">
						<polyline points="0,0 200,2.5 0,5" fill="#922610" class="whoosh"></polyline>
					</svg>
				</div>
				${saves ? `<div class="npctop"><b>Saving Throws</b> ${saves}</div>` : ''}
				${npcSkills ? `<div class="npctop"><b>Skills</b> ${npcSkills}</div>` : ''}
				${vulnerabilities ? `<div class="npctop"><b>Damage Vulnerabilities</b> ${vulnerabilities}</div>` : ''}
				${resistances ? `<div class="npctop"><b>Damage Resistances</b> ${resistances}</div>` : ''}
				${immunities ? `<div class="npctop"><b>Damage Immunities</b> ${immunities}</div>` : ''}
				${conditionImmunities ? `<div class="npctop"><b>Condition Immunities</b> ${conditionImmunities}</div>` : ''}
				${senses ? `<div class="npctop"><b>Senses</b> ${senses}</div>` : ''}
				<!-- Languages will be inserted here -->
				${challenge ? `<div class="npctop"><b>Challenge</b> ${challenge} (${experience} XP)</div>` : ''}
				<div class="npcdiv">
					<svg viewBox="0 0 200 5" preserveAspectRatio="none" width="100%" height="5">
						<polyline points="0,0 200,2.5 0,5" fill="#922610" class="whoosh"></polyline>
					</svg>
				</div>
				<div class="npcbottom">&nbsp;</div>
				<div class="cap"></div>
			</div>
			${descriptionHtml}
		`;
		viewport.innerHTML = generatedHtml;
	}

	function updateTokenDisplay() {
		tokenBox.innerHTML = '';
		if (activeNPC && activeNPC.token) {
			const img = document.createElement('img');
			img.src = activeNPC.token;
			img.className = 'w-full h-full object-contain';
			tokenBox.appendChild(img);
		} else {
			const placeholder = document.createElement('span');
			placeholder.textContent = 'Click or Drag a Token Image Here';
			tokenBox.appendChild(placeholder);
		}
	}

	function updateImageDisplay() {
		imageBox.innerHTML = '';
		if (activeNPC && activeNPC.image) {
			const img = document.createElement('img');
			img.src = activeNPC.image;
			img.className = 'w-full h-full object-contain';
			imageBox.appendChild(img);
		} else {
			const placeholder = document.createElement('span');
			placeholder.textContent = 'Click or Drag an NPC Image Here';
			imageBox.appendChild(placeholder);
		}
	}
	
	function populateChallengeDropdown() {
		const challengeSelect = inputs.challenge;
		challengeOrder.forEach(cr => {
			const option = document.createElement('option');
			option.value = cr;
			option.textContent = cr;
			challengeSelect.appendChild(option);
		});
	}

	function setupCustomToggles() {
		const fields = ['size','type','species','alignment'];
		fields.forEach(field => {
			const toggle = document.getElementById(`toggle-custom-${field}`);
			const select = document.getElementById(`npc-${field}`);
			const customInput = document.getElementById(`npc-${field}-custom`);
			if (toggle && select && customInput) {
				toggle.addEventListener('change', () => {
					if (toggle.checked) {
						select.classList.add('hidden');
						customInput.classList.remove('hidden');
						customInput.value = select.value;
						customInput.focus();
					} else {
						select.classList.remove('hidden');
						customInput.classList.add('hidden');
					}
					updateActiveNPCFromForm();
				});
				customInput.addEventListener('input', updateActiveNPCFromForm);
			}
		});
	}
	
	function setupSavingThrowListeners() {
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		abilities.forEach(ability => {
			document.getElementById(`npc-${ability}-saving-throw-prof`).addEventListener('input', updateActiveNPCFromForm);
			document.getElementById(`npc-${ability}-saving-throw-adjust`).addEventListener('input', updateActiveNPCFromForm);
		});
	}
	
	function setupSkillListeners() {
        document.querySelectorAll('.skill-row').forEach(row => {
            const profCheckbox = row.querySelector('.skill-prof');
            const expCheckbox = row.querySelector('.skill-exp');
            const adjustInput = row.querySelector('.skill-adjust');

            profCheckbox.addEventListener('input', updateActiveNPCFromForm);
            adjustInput.addEventListener('input', updateActiveNPCFromForm);

            expCheckbox.addEventListener('input', () => {
                if (expCheckbox.checked) {
                    profCheckbox.checked = true;
                }
                updateActiveNPCFromForm();
            });
        });
    }
	
	function setupResistanceListeners() {
		damageTypes.forEach(type => {
			const vulnCheckbox = document.getElementById(`vuln-${type}`);
			const resCheckbox = document.getElementById(`res-${type}`);
			const immCheckbox = document.getElementById(`imm-${type}`);

			vulnCheckbox.addEventListener('input', updateActiveNPCFromForm);

			resCheckbox.addEventListener('input', () => {
				if (resCheckbox.checked) {
					immCheckbox.checked = false;
				}
				updateActiveNPCFromForm(); // Update data model after any change
			});

			immCheckbox.addEventListener('input', () => {
				if (immCheckbox.checked) {
					resCheckbox.checked = false;
				}
				updateActiveNPCFromForm(); // Update data model after any change
			});
		});
	}

	function setupWeaponModifierListeners() {
		document.querySelectorAll('input[name="weapon-resistance"]').forEach(radio => {
			radio.addEventListener('input', updateActiveNPCFromForm);
		});
		document.querySelectorAll('input[name="weapon-immunity"]').forEach(radio => {
			radio.addEventListener('input', updateActiveNPCFromForm);
		});
	}

	function setupConditionImmunityListeners() {
		conditions.forEach(condition => {
			document.getElementById(`ci-${condition}`).addEventListener('input', updateActiveNPCFromForm);
		});
	}


	function setupDragAndDrop(box, validTypes, npcKey, updateFn) {
		["dragenter","dragover","dragleave","drop"].forEach(eventName => {
			box.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); });
		});
		["dragenter","dragover"].forEach(eventName => {
			box.addEventListener(eventName, () => box.classList.add("drag-over"));
		});
		["dragleave","drop"].forEach(eventName => {
			box.addEventListener(eventName, () => box.classList.remove("drag-over"));
		});
		box.addEventListener("drop", e => {
			if (!activeNPC) return;
			const file = e.dataTransfer.files && e.dataTransfer.files[0];
			if (file && validTypes.includes(file.type)) {
				const reader = new FileReader();
				reader.onload = ev => {
					activeNPC[npcKey] = ev.target.result;
					updateFn();
					saveActiveBestiaryToDB();
				};
				reader.readAsDataURL(file);
			} else {
				console.warn("Invalid file type dropped.");
			}
		});
	}
	
	// --- Modal Handling ---
	function hideAllModals() {
		modalOverlay.classList.add('hidden');
		newBestiaryModal.classList.add('hidden');
		loadBestiaryModal.classList.add('hidden');
		hpModal.classList.add('hidden');
		manageGroupsModal.classList.add('hidden');
		settingsModal.classList.add('hidden');
	}

	async function showLoadBestiaryModal() {
		const bestiaries = await db.projects.toArray();
		bestiaryListDiv.innerHTML = ''; // Clear previous list
		if (bestiaries.length === 0) {
			bestiaryListDiv.innerHTML = '<p class="text-gray-500">No bestiaries found.</p>';
		} else {
			bestiaries.forEach(proj => {
				const projEl = document.createElement('div');
				projEl.className = 'flex justify-between items-center py-1 px-2 border rounded-md hover:bg-gray-100';

				const nameSpan = document.createElement('span');
				nameSpan.textContent = proj.projectName;
				nameSpan.className = 'cursor-pointer flex-grow';
				nameSpan.onclick = () => {
					loadBestiary(proj);
					hideAllModals();
				};

				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
				deleteBtn.className = 'p-1';
				deleteBtn.title = `Delete ${proj.projectName}`;
				deleteBtn.onclick = async (e) => {
					e.stopPropagation();
					await db.projects.delete(proj.id);
					if(activeBestiary && activeBestiary.id === proj.id) {
						activeBestiary = null;
						activeNPC = null;
						activeNPCIndex = -1;
						updateUIForActiveBestiary();
					}
					showLoadBestiaryModal(); // Refresh list
				};
				
				projEl.appendChild(nameSpan);
				projEl.appendChild(deleteBtn);
				bestiaryListDiv.appendChild(projEl);
			});
		}
		modalOverlay.classList.remove('hidden');
		loadBestiaryModal.classList.remove('hidden');
	}
	
	async function showManageGroupsModal() {
		if (!activeBestiary) return;
		groupListDiv.innerHTML = '';

		const groups = activeBestiary.metadata.fg_groups || [];
		if (groups.length === 0) {
			groupListDiv.innerHTML = '<p class="text-gray-500 text-center">No custom groups created.</p>';
		} else {
			groups.forEach(groupName => {
				const groupEl = document.createElement('div');
				groupEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = groupName;
				
				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
				deleteBtn.className = 'p-1';
				deleteBtn.title = `Delete group: ${groupName}`;
				deleteBtn.onclick = (e) => {
					e.stopPropagation();
					deleteGroup(groupName);
				};

				groupEl.appendChild(nameSpan);
				groupEl.appendChild(deleteBtn);
				groupListDiv.appendChild(groupEl);
			});
		}
		modalOverlay.classList.remove('hidden');
		manageGroupsModal.classList.remove('hidden');
	}

	function showSettingsModal() {
		if (!activeBestiary) return;

		for (const key in bestiarySettingsCheckboxes) {
			bestiarySettingsCheckboxes[key].checked = activeBestiary.metadata[key];
		}

		modalOverlay.classList.remove('hidden');
		settingsModal.classList.remove('hidden');
	}

	function deleteGroup(groupName) {
		if (!activeBestiary || !activeBestiary.metadata.fg_groups) return;
		
		activeBestiary.metadata.fg_groups = activeBestiary.metadata.fg_groups.filter(g => g !== groupName);
		
		// Check if any NPC was using this group and reset it
		activeBestiary.npcs.forEach(npc => {
			if (npc.fg_group === groupName) {
				npc.fg_group = activeBestiary.projectName;
			}
		});

		saveActiveBestiaryToDB();
		showManageGroupsModal(); // Refresh modal list
		updateFormFromActiveNPC(); // Refresh main dropdown
	}

	function addNewGroup() {
		const newName = newGroupNameInput.value.trim();
		if (!newName) return;

		if (!activeBestiary.metadata.fg_groups) {
			activeBestiary.metadata.fg_groups = [];
		}
		
		const isDuplicate = newName.toLowerCase() === activeBestiary.projectName.toLowerCase() || activeBestiary.metadata.fg_groups.some(g => g.toLowerCase() === newName.toLowerCase());

		if (isDuplicate) {
			alert(`A group named "${newName}" already exists.`);
			return;
		}

		activeBestiary.metadata.fg_groups.push(newName);
		saveActiveBestiaryToDB();
		newGroupNameInput.value = '';
		showManageGroupsModal(); // Refresh list
		updateFormFromActiveNPC(); // Refresh main dropdown
	}

	function parseHpStringToModal() {
		const hpString = inputs.hitPoints.value || "";
		const match = hpString.match(/\((\d+)d(\d+)\s*([+-])?\s*(\d+)?\)/);

		if (match) {
			// Example match for "16 (3d6 + 6)": ["(3d6 + 6)", "3", "6", "+", "6"]
			const numDice = parseInt(match[1], 10);
			const dieType = parseInt(match[2], 10);
			const sign = match[3];
			const bonus = parseInt(match[4], 10) || 0;

			numDiceInput.value = numDice;
			dieTypeSelect.value = dieType;
			bonusInput.value = (sign === '-') ? -bonus : bonus;
		} else {
			// Reset to defaults if no match
			numDiceInput.value = 1;
			dieTypeSelect.value = 8; // d8 default
			bonusInput.value = 0;
		}
	}


	// --- EVENT LISTENERS ---
	
	// Icon Buttons
	newBestiaryBtn.addEventListener('click', showNewBestiaryModal);
	loadBestiaryBtn.addEventListener('click', showLoadBestiaryModal);
	importBestiaryBtn.addEventListener('click', importBestiary);
	exportBestiaryBtn.addEventListener('click', exportBestiary);
	newNpcBtn.addEventListener("click", createNewNpc);
	duplicateNpcBtn.addEventListener("click", duplicateCurrentNpc);
	importNpcBtn.addEventListener("click", importNpc);
	exportNpcBtn.addEventListener("click", exportNpc);
	deleteNpcBtn.addEventListener('click', deleteCurrentNpc);
	
	// Menu Items
	menuNewBestiary.addEventListener('click', (e) => { e.preventDefault(); showNewBestiaryModal(); mainMenu.classList.add('hidden'); });
	menuLoadBestiary.addEventListener('click', (e) => { e.preventDefault(); showLoadBestiaryModal(); mainMenu.classList.add('hidden'); });
	menuImportBestiary.addEventListener('click', (e) => { e.preventDefault(); importBestiary(); mainMenu.classList.add('hidden'); });
	menuExportBestiary.addEventListener('click', (e) => { e.preventDefault(); if(!menuExportBestiary.classList.contains('disabled')) exportBestiary(); mainMenu.classList.add('hidden'); });
	menuNewNpc.addEventListener('click', (e) => { e.preventDefault(); if(!menuNewNpc.classList.contains('disabled')) createNewNpc(); mainMenu.classList.add('hidden'); });
	menuDuplicateNpc.addEventListener('click', (e) => { e.preventDefault(); if(!menuDuplicateNpc.classList.contains('disabled')) duplicateCurrentNpc(); mainMenu.classList.add('hidden'); });
	menuImportNpc.addEventListener('click', (e) => { e.preventDefault(); if(!menuImportNpc.classList.contains('disabled')) importNpc(); mainMenu.classList.add('hidden'); });
	menuExportNpc.addEventListener('click', (e) => { e.preventDefault(); if(!menuExportNpc.classList.contains('disabled')) exportNpc(); mainMenu.classList.add('hidden'); });
	menuDeleteNpc.addEventListener('click', (e) => { e.preventDefault(); if(!menuDeleteNpc.classList.contains('disabled')) deleteCurrentNpc(); mainMenu.classList.add('hidden'); });
	menuSettings.addEventListener('click', (e) => { e.preventDefault(); if(!menuSettings.classList.contains('disabled')) showSettingsModal(); mainMenu.classList.add('hidden'); });
	
	// Hamburger Menu Logic
	hamburgerBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		mainMenu.classList.toggle('hidden');
	});

	window.addEventListener('click', (e) => {
		if (!mainMenu.classList.contains('hidden') && !hamburgerBtn.contains(e.target)) {
			mainMenu.classList.add('hidden');
		}
	});
	
	// Modal Buttons
	createBestiaryBtn.addEventListener('click', createNewBestiary);
	newBestiaryNameInput.addEventListener('keyup', (e) => {
		if (e.key === 'Enter') createBestiaryBtn.click();
	});
	manageGroupsBtn.addEventListener('click', showManageGroupsModal);
	addGroupBtn.addEventListener('click', addNewGroup);
	newGroupNameInput.addEventListener('keyup', (e) => {
		if (e.key === 'Enter') {
			addNewGroup();
		}
	});
	settingsOkBtn.addEventListener('click', hideAllModals);

	
	// NPC Selector
	npcSelector.addEventListener('change', (e) => {
		const newIndex = parseInt(e.target.value, 10);
		if (newIndex !== activeNPCIndex) {
			switchActiveNPC(newIndex);
		}
	});
	
	document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', hideAllModals));
	modalOverlay.addEventListener('click', (e) => {
		if (e.target === modalOverlay) hideAllModals();
	});

	document.querySelectorAll('.card-header').forEach((header) => {
		header.addEventListener("click", (e) => {
			if (e.target.closest('#fantasy-grounds-group') || e.target.closest('#manage-groups-btn')) {
				return;
			}
			const cardBody = header.nextElementSibling;
			if (cardBody) {
				if (cardBody.classList.contains('open')) {
					cardBody.classList.remove('open');
					cardBody.style.paddingTop = '0';
					cardBody.style.paddingBottom = '0';
				} else {
					cardBody.classList.add('open');
					cardBody.style.paddingTop = '0.5rem';
					cardBody.style.paddingBottom = '0.5rem';
				}
			}
		});
	});

	Object.values(inputs).forEach((input) => {
		if(input.id !== 'npc-description') {
			input.addEventListener("input", updateActiveNPCFromForm);
		}
	});
	
	// Re-sort the list when the name input loses focus
	inputs.name.addEventListener('blur', () => {
		if (activeBestiary) {
			sortAndSwitchToNpc(activeNPC);
		}
	});


	// Settings Checkbox Listeners
	for (const key in bestiarySettingsCheckboxes) {
		bestiarySettingsCheckboxes[key].addEventListener('input', () => {
			if (activeBestiary) {
				activeBestiary.metadata[key] = bestiarySettingsCheckboxes[key].checked;
				saveActiveBestiaryToDB();
			}
		});
	}
	for (const key in npcSettingsCheckboxes) {
		npcSettingsCheckboxes[key].addEventListener('input', () => {
			if (activeNPC) {
				activeNPC[key] = npcSettingsCheckboxes[key].checked;
				updateViewport();
				saveActiveBestiaryToDB();
			}
		});
	}


	inputs.challenge.addEventListener('change', () => {
		const selectedCr = inputs.challenge.value;
		experienceDisplay.textContent = crToXpMap[selectedCr] || '';
		const profBonus = calculateProficiencyBonus(selectedCr);
		proficiencyBonusDisplay.textContent = `+${profBonus}`;
		updateActiveNPCFromForm();
	});

	document.querySelector("trix-editor").addEventListener("trix-change", updateActiveNPCFromForm);

	tokenBox.addEventListener('click', () => activeNPC && tokenUpload.click());
	tokenUpload.addEventListener('change', (event) => {
		const file = event.target.files[0];
		if (activeNPC && file && (file.type === "image/png" || file.type === "image/webp")) {
			const reader = new FileReader();
			reader.onload = function(e) {
				activeNPC.token = e.target.result;
				updateTokenDisplay();
				saveActiveBestiaryToDB();
			};
			reader.readAsDataURL(file);
		}
	});

	imageBox.addEventListener('click', () => activeNPC && imageUpload.click());
	imageUpload.addEventListener('change', (event) => {
		const file = event.target.files[0];
		if (activeNPC && file && (file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg")) {
			const reader = new FileReader();
			reader.onload = function(e) {
				activeNPC.image = e.target.result;
				updateImageDisplay();
				saveActiveBestiaryToDB();
			};
			reader.readAsDataURL(file);
		}
	});

	setupDragAndDrop(tokenBox, ["image/png","image/webp"], "token", updateTokenDisplay);
	setupDragAndDrop(imageBox, ["image/png","image/webp","image/jpeg"], "image", updateImageDisplay);

	inputs.hitPoints.addEventListener('dblclick', () => {
		if (activeNPC) {
			parseHpStringToModal();
			modalOverlay.classList.remove('hidden');
			hpModal.classList.remove('hidden');
		}
	});
	hpModalCloseBtn.addEventListener('click', () => {
		hideAllModals();
	});
	hpApplyBtn.addEventListener('click', () => {
		const numDice = parseInt(numDiceInput.value, 10) || 0;
		const dieType = parseInt(dieTypeSelect.value, 10) || 0;
		const bonus = parseInt(bonusInput.value, 10) || 0;
		if (numDice > 0 && dieType > 0) {
			const avgRoll = (dieType / 2) + 0.5;
			const totalHp = Math.floor(numDice * avgRoll) + bonus;
			let bonusString = "";
			if (bonus > 0) { bonusString = ` + ${bonus}`; }
			else if (bonus < 0) { bonusString = ` - ${Math.abs(bonus)}`; }
			const hpString = `${totalHp} (${numDice}d${dieType}${bonusString})`;
			inputs.hitPoints.value = hpString;
			updateActiveNPCFromForm();
			hideAllModals();
		}
	});
	
	// --- INITIALIZATION ---
	populateChallengeDropdown();
	setupCustomToggles();
	setupSavingThrowListeners();
	setupSkillListeners();
	setupResistanceListeners();
	setupWeaponModifierListeners();
	setupConditionImmunityListeners();
	updateUIForActiveBestiary(); // Initial setup for no bestiary loaded

	document.querySelectorAll('.card-body').forEach(cardBody => {
		cardBody.classList.add('open');
		cardBody.style.paddingTop = '0.5rem';
		cardBody.style.paddingBottom = '0.5rem';
	});
});

