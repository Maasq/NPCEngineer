// ui.js (Complete, updated)
window.ui = {
    // --- UI ELEMENTS ---
	mainContentColumn: null, // Initialized in init
	viewport: null, // Initialized in init
	bestiaryStatusEl: null, // Initialized in init
	
	// Bestiary Buttons
	newBestiaryBtn: null, // ...
	loadBestiaryBtn: null,
	exportBestiaryBtn: null,
	importBestiaryBtn: null,

	// NPC Buttons
	newNpcBtn: null,
	duplicateNpcBtn: null,
	importNpcBtn: null,
	exportNpcBtn: null,
	deleteNpcBtn: null,
	
	// Menu Items
	hamburgerBtn: null,
	mainMenu: null,
	menuNewBestiary: null,
	menuLoadBestiary: null,
	menuImportBestiary: null,
	menuExportBestiary: null,
	menuNewNpc: null,
	menuDuplicateNpc: null,
	menuImportNpc: null,
	menuImportText: null, // Definition moved to init
	menuExportNpc: null,
	menuDeleteNpc: null,
	menuSettings: null,

	// NPC Selector
	npcSelector: null,
	npcOptionsContainer: null,

	// Modals & Overlays
	modalOverlay: null,
	newBestiaryModal: null,
	loadBestiaryModal: null,
	hpModal: null,
	settingsModal: null,
	manageLanguagesModal: null,
	manageTraitsModal: null,
    boilerplateModal: null,
    attackHelperModal: null,
    alertModal: null,

	// Modal-specific elements
	createBestiaryBtn: null,
	newBestiaryNameInput: null,
	bestiaryListDiv: null,
	manageGroupsBtn: null,
	manageGroupsModal: null,
	addGroupBtn: null,
	newGroupNameInput: null,
	groupListDiv: null,
	settingsOkBtn: null,
	
	// Language Modal Elements
	manageLanguagesBtn: null,
	newLanguageNameInput: null,
	addLanguageBtn: null,
	languageListDiv: null,

	// Trait Elements
	manageTraitsBtn: null,
	npcTraitList: null,
	newTraitName: null,
	savedTraitList: null,
	newTraitDescription: null,
	addTraitBtn: null,
	modalTraitName: null,
	modalTraitDescription: null,
	modalTokenButtons: null,
	addManagedTraitBtn: null,
	managedTraitListDiv: null,
	sortTraitsAlphaCheckbox: null,
	
	tokenBox: null,
	tokenUpload: null,
	imageBox: null,
	imageUpload: null,

	hpModalCloseBtn: null,
	hpApplyBtn: null,
    hpDiceString: null,
    hpDiceSelector: null,
    hpClearBtn: null,

	experienceDisplay: null,
	proficiencyBonusDisplay: null,

    // Action Elements
    clearEditBtn: null,
    legendaryBoilerplate: null,
    lairBoilerplate: null,
    attackDamageDiceClearBtn: null,

    // Alert/Confirm Modal Elements
    alertTitle: null,
    alertMessageText: null,
    alertOkBtn: null,
    alertCancelBtn: null,

    // Footer Buttons (Add these)
    footerImportTextBtn: null,
    footerExportFgBtn: null,

	// Settings Checkboxes (initialized in init)
	bestiarySettingsCheckboxes: {},
	npcSettingsCheckboxes: {},

	// --- FORM INPUTS --- (initialized in init)
	inputs: {},
	
	languageListboxes: [], // Will populate IDs in init

    init: function() {
        // --- Assign elements now that DOM is ready ---
        this.mainContentColumn = document.getElementById('main-content-column');
        this.viewport = document.getElementById("viewport");
        this.bestiaryStatusEl = document.getElementById("bestiary-status");
        
        this.newBestiaryBtn = document.getElementById("newBestiaryBtn");
        this.loadBestiaryBtn = document.getElementById("loadBestiaryBtn");
        this.exportBestiaryBtn = document.getElementById("exportBestiaryBtn");
        this.importBestiaryBtn = document.getElementById("importBestiaryBtn");

        this.newNpcBtn = document.getElementById("newNpcBtn");
        this.duplicateNpcBtn = document.getElementById("duplicateNpcBtn");
        this.importNpcBtn = document.getElementById("importNpcBtn");
        this.exportNpcBtn = document.getElementById("exportNpcBtn");
        this.deleteNpcBtn = document.getElementById("deleteNpcBtn");
        
        this.hamburgerBtn = document.getElementById('hamburger-btn');
        this.mainMenu = document.getElementById('main-menu');
        this.menuNewBestiary = document.getElementById('menu-new-bestiary');
        this.menuLoadBestiary = document.getElementById('menu-load-bestiary');
        this.menuImportBestiary = document.getElementById('menu-import-bestiary');
        this.menuExportBestiary = document.getElementById('menu-export-bestiary');
        this.menuNewNpc = document.getElementById('menu-new-npc');
        this.menuDuplicateNpc = document.getElementById('menu-duplicate-npc');
        this.menuImportNpc = document.getElementById('menu-import-npc');
        this.menuImportText = document.getElementById('menu-import-text'); // Assigned here
        this.menuExportNpc = document.getElementById('menu-export-npc');
        this.menuDeleteNpc = document.getElementById('menu-delete-npc');
        this.menuSettings = document.getElementById('menu-settings');

        this.npcSelector = document.getElementById("npc-selector");
        this.npcOptionsContainer = document.getElementById('npc-options-container');

        this.modalOverlay = document.getElementById("modal-overlay");
        this.newBestiaryModal = document.getElementById("new-bestiary-modal");
        this.loadBestiaryModal = document.getElementById("load-bestiary-modal");
        this.hpModal = document.getElementById("hp-modal");
        this.settingsModal = document.getElementById('settings-modal');
        this.manageLanguagesModal = document.getElementById('manage-languages-modal');
        this.manageTraitsModal = document.getElementById('manage-traits-modal');
        this.boilerplateModal = document.getElementById('boilerplate-modal');
        this.attackHelperModal = document.getElementById('attack-helper-modal');
        this.alertModal = document.getElementById('alert-modal');

        this.createBestiaryBtn = document.getElementById("create-bestiary-btn");
        this.newBestiaryNameInput = document.getElementById("new-bestiary-name");
        this.bestiaryListDiv = document.getElementById("bestiary-list");
        this.manageGroupsBtn = document.getElementById('manage-groups-btn');
        this.manageGroupsModal = document.getElementById('manage-groups-modal');
        this.addGroupBtn = document.getElementById('add-group-btn');
        this.newGroupNameInput = document.getElementById('new-group-name');
        this.groupListDiv = document.getElementById('group-list');
        this.settingsOkBtn = document.getElementById('settings-ok-btn');
        
        this.manageLanguagesBtn = document.getElementById('manage-languages-btn');
        this.newLanguageNameInput = document.getElementById('new-language-name');
        this.addLanguageBtn = document.getElementById('add-language-btn');
        this.languageListDiv = document.getElementById('language-list-div');

        this.manageTraitsBtn = document.getElementById('manage-traits-btn');
        this.npcTraitList = document.getElementById('npc-trait-list');
        this.newTraitName = document.getElementById('new-trait-name');
        this.savedTraitList = document.getElementById('saved-trait-list');
        this.newTraitDescription = document.getElementById('new-trait-description');
        this.addTraitBtn = document.getElementById('add-trait-btn');
        this.modalTraitName = document.getElementById('modal-trait-name');
        this.modalTraitDescription = document.getElementById('modal-trait-description');
        this.modalTokenButtons = document.getElementById('modal-token-buttons');
        this.addManagedTraitBtn = document.getElementById('add-managed-trait-btn');
        this.managedTraitListDiv = document.getElementById('managed-trait-list-div');
        this.sortTraitsAlphaCheckbox = document.getElementById('sort-traits-alpha');
        
        this.tokenBox = document.getElementById("npc-token");
        this.tokenUpload = document.getElementById("token-upload");
        this.imageBox = document.getElementById("npc-image");
        this.imageUpload = document.getElementById("image-upload");

        this.hpModalCloseBtn = document.getElementById("hp-modal-close");
        this.hpApplyBtn = document.getElementById("hp-apply-btn");
        this.hpDiceString = document.getElementById('hp-dice-string');
        this.hpDiceSelector = document.getElementById('hp-dice-selector');
        this.hpClearBtn = document.getElementById('hp-clear-btn');

        this.experienceDisplay = document.getElementById("npc-experience-display");
        this.proficiencyBonusDisplay = document.getElementById("npc-proficiency-bonus-display");

        this.clearEditBtn = document.getElementById('clear-edit-btn');
        this.legendaryBoilerplate = document.getElementById('legendary-boilerplate');
        this.lairBoilerplate = document.getElementById('lair-boilerplate');
        this.attackDamageDiceClearBtn = document.getElementById('attack-damage-dice-clear-btn');

        this.alertTitle = document.getElementById('alert-title');
        this.alertMessageText = document.getElementById('alert-message-text');
        this.alertOkBtn = document.getElementById('alert-ok-btn');
        this.alertCancelBtn = document.getElementById('alert-cancel-btn');

        // Assign Footer Buttons
        this.footerImportTextBtn = document.getElementById('footer-import-text-btn');
        this.footerExportFgBtn = document.getElementById('footer-export-fg-btn');

        this.bestiarySettingsCheckboxes = {
            addDescription: document.getElementById('bestiary-add-description'),
            addTitle: document.getElementById('bestiary-add-title'),
            addImageLink: document.getElementById('bestiary-add-image-link'),
            useDropCap: document.getElementById('bestiary-use-drop-cap'),
        };
        this.npcSettingsCheckboxes = {
            addDescription: document.getElementById('npc-add-description'),
            addTitle: document.getElementById('npc-add-title'),
            addImageLink: document.getElementById('npc-add-image-link'),
            useDropCap: document.getElementById('npc-use-drop-cap'),
        };

        this.inputs = {
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
            fg_group: document.getElementById('fantasy-grounds-group'),
            commonName: document.getElementById('common-name'),
            commonDesc: document.getElementById('common-desc'),
            attackDamageDice: document.getElementById('attack-damage-dice'),
        };
        
        this.languageListboxes = [
            document.getElementById('language-list-standard'),
            document.getElementById('language-list-exotic'),
            document.getElementById('language-list-monstrous1'),
            document.getElementById('language-list-monstrous2'),
            document.getElementById('language-list-user'),
        ];
        // --- End of element assignments ---


        this.populateChallengeDropdown();
        this.setupEventListeners(); // Now safe to call
        this.updateUIForActiveBestiary();
        this.populateDamageTypes('attack-damage-type');
        document.querySelectorAll('.card-body').forEach(cardBody => {
            cardBody.classList.add('open');
            cardBody.style.paddingTop = '0.5rem';
            cardBody.style.paddingBottom = '0.5rem';
        });
    },

    setupEventListeners: function() {
        // --- Add basic null checks for safety ---
        if (this.newBestiaryBtn) this.newBestiaryBtn.addEventListener('click', this.showNewBestiaryModal.bind(this));
        if (this.loadBestiaryBtn) this.loadBestiaryBtn.addEventListener('click', this.showLoadBestiaryModal.bind(this));
        if (this.importBestiaryBtn) this.importBestiaryBtn.addEventListener('click', window.app.importBestiary);
        if (this.exportBestiaryBtn) this.exportBestiaryBtn.addEventListener('click', window.app.exportBestiary);
        if (this.newNpcBtn) this.newNpcBtn.addEventListener("click", window.app.createNewNpc);
        if (this.duplicateNpcBtn) this.duplicateNpcBtn.addEventListener("click", window.app.duplicateCurrentNpc);
        if (this.importNpcBtn) this.importNpcBtn.addEventListener("click", window.app.importNpc);
        if (this.exportNpcBtn) this.exportNpcBtn.addEventListener("click", window.app.exportNpc);
        if (this.deleteNpcBtn) this.deleteNpcBtn.addEventListener('click', window.app.deleteCurrentNpc);

        if (this.menuNewBestiary) this.menuNewBestiary.addEventListener('click', (e) => { e.preventDefault(); this.showNewBestiaryModal(); this.mainMenu.classList.add('hidden'); });
        if (this.menuLoadBestiary) this.menuLoadBestiary.addEventListener('click', (e) => { e.preventDefault(); this.showLoadBestiaryModal(); this.mainMenu.classList.add('hidden'); });
        if (this.menuImportBestiary) this.menuImportBestiary.addEventListener('click', (e) => { e.preventDefault(); window.app.importBestiary(); this.mainMenu.classList.add('hidden'); });
        if (this.menuExportBestiary) this.menuExportBestiary.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuExportBestiary.classList.contains('disabled')) window.app.exportBestiary(); this.mainMenu.classList.add('hidden'); });
        if (this.menuNewNpc) this.menuNewNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuNewNpc.classList.contains('disabled')) window.app.createNewNpc(); this.mainMenu.classList.add('hidden'); });
        if (this.menuDuplicateNpc) this.menuDuplicateNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuDuplicateNpc.classList.contains('disabled')) window.app.duplicateCurrentNpc(); this.mainMenu.classList.add('hidden'); });
        if (this.menuImportNpc) this.menuImportNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuImportNpc.classList.contains('disabled')) window.app.importNpc(); this.mainMenu.classList.add('hidden'); });
        if (this.menuImportText) this.menuImportText.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuImportText.classList.contains('disabled')) window.importer.openImportModal(); this.mainMenu.classList.add('hidden'); });
        if (this.menuExportNpc) this.menuExportNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuExportNpc.classList.contains('disabled')) window.app.exportNpc(); this.mainMenu.classList.add('hidden'); });
        if (this.menuDeleteNpc) this.menuDeleteNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuDeleteNpc.classList.contains('disabled')) window.app.deleteCurrentNpc(); this.mainMenu.classList.add('hidden'); });
        if (this.menuSettings) this.menuSettings.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuSettings.classList.contains('disabled')) this.showSettingsModal(); this.mainMenu.classList.add('hidden'); });

        if (this.hamburgerBtn) {
            this.hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.mainMenu) this.mainMenu.classList.toggle('hidden');
            });
        }

        window.addEventListener('click', (e) => {
            if (this.mainMenu && !this.mainMenu.classList.contains('hidden') && this.hamburgerBtn && !this.hamburgerBtn.contains(e.target)) {
                this.mainMenu.classList.add('hidden');
            }
        });

        if (this.createBestiaryBtn) this.createBestiaryBtn.addEventListener('click', window.app.createNewBestiary);
        if (this.newBestiaryNameInput) {
            this.newBestiaryNameInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter' && this.createBestiaryBtn) this.createBestiaryBtn.click();
            });
        }
        if (this.manageGroupsBtn) this.manageGroupsBtn.addEventListener('click', this.showManageGroupsModal.bind(this));
        if (this.addGroupBtn) this.addGroupBtn.addEventListener('click', this.addNewGroup.bind(this));
        if (this.newGroupNameInput) {
            this.newGroupNameInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.addNewGroup();
                }
            });
        }
        if (this.settingsOkBtn) this.settingsOkBtn.addEventListener('click', this.hideAllModals.bind(this));

        if (this.npcSelector) {
            this.npcSelector.addEventListener('change', (e) => {
                const newIndex = parseInt(e.target.value, 10);
                if (newIndex !== window.app.activeNPCIndex) {
                    window.app.switchActiveNPC(newIndex);
                }
            });
        }

        document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', this.hideAllModals.bind(this)));
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay && !e.target.closest('.modal-content')) {
                    this.hideAllModals();
                }
            });
        }

        document.querySelectorAll('.card-header').forEach((header) => {
            header.addEventListener("click", (e) => {
                if (e.target.closest('#fantasy-grounds-group') || e.target.closest('#manage-groups-btn') || e.target.closest('#manage-languages-btn') || e.target.closest('#manage-traits-btn')) {
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

        Object.values(this.inputs).forEach((input) => {
            if(input && input.id !== 'npc-description' && !input.id.startsWith('common-') && input.id !== 'attack-damage-dice') {
                input.addEventListener("input", window.app.updateActiveNPCFromForm);
            }
        });
        
        if (this.inputs.name) {
            this.inputs.name.addEventListener('blur', () => {
                if (window.app.activeBestiary) {
                    window.app.sortAndSwitchToNpc(window.app.activeNPC);
                }
            });
        }

        for (const key in this.bestiarySettingsCheckboxes) {
            const checkbox = this.bestiarySettingsCheckboxes[key];
            if (checkbox) {
                checkbox.addEventListener('input', () => {
                    if (window.app.activeBestiary) {
                        window.app.activeBestiary.metadata[key] = checkbox.checked;
                        window.app.saveActiveBestiaryToDB();
                    }
                });
            }
        }
        for (const key in this.npcSettingsCheckboxes) {
            const checkbox = this.npcSettingsCheckboxes[key];
             if (checkbox) {
                checkbox.addEventListener('input', () => {
                    if (window.app.activeNPC) {
                        window.app.activeNPC[key] = checkbox.checked;
                        window.viewport.updateViewport();
                        window.app.saveActiveBestiaryToDB();
                    }
                });
            }
        }

        if (this.inputs.challenge) {
            this.inputs.challenge.addEventListener('change', () => {
                const selectedCr = this.inputs.challenge.value;
                if (this.experienceDisplay) this.experienceDisplay.textContent = window.app.crToXpMap[selectedCr] || ''; // Added check
                const profBonus = window.app.calculateProficiencyBonus(selectedCr);
                 if (this.proficiencyBonusDisplay) this.proficiencyBonusDisplay.textContent = `+${profBonus}`; // Added check
                window.app.updateActiveNPCFromForm();
            });
        }

        const trixEditor = document.querySelector("trix-editor");
        if (trixEditor) {
             trixEditor.addEventListener("trix-change", window.app.updateActiveNPCFromForm);
        }

        if (this.tokenBox) {
            this.tokenBox.addEventListener('click', () => window.app.activeNPC && this.tokenUpload && this.tokenUpload.click()); // Added check
        }
        if (this.tokenUpload) {
            this.tokenUpload.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (window.app.activeNPC && file && (file.type === "image/png" || file.type === "image/webp")) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.app.activeNPC.token = e.target.result;
                        this.updateTokenDisplay();
                        window.app.saveActiveBestiaryToDB();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (this.imageBox) {
            this.imageBox.addEventListener('click', () => window.app.activeNPC && this.imageUpload && this.imageUpload.click()); // Added check
        }
        if (this.imageUpload) {
            this.imageUpload.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (window.app.activeNPC && file && (file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg")) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.app.activeNPC.image = e.target.result;
                        this.updateImageDisplay();
                        window.app.saveActiveBestiaryToDB();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (this.tokenBox) this.setupDragAndDrop(this.tokenBox, ["image/png","image/webp"], "token", this.updateTokenDisplay.bind(this));
        if (this.imageBox) this.setupDragAndDrop(this.imageBox, ["image/png","image/webp","image/jpeg"], "image", this.updateImageDisplay.bind(this));
        
        if (this.inputs.hitPoints) {
            this.inputs.hitPoints.addEventListener('dblclick', () => {
                if (window.app.activeNPC) {
                    this.parseHpStringToModal();
                    window.app.openModal('hp-modal');
                    // Ensure elements exist before creating selector
                    if (this.hpDiceSelector && this.hpDiceString) {
                        window.app.createDiceSelector(this.hpDiceSelector, this.hpDiceString);
                    }
                }
            });
        }
        if (this.hpModalCloseBtn) {
            this.hpModalCloseBtn.addEventListener('click', () => {
                this.hideAllModals();
            });
        }
        if (this.hpApplyBtn) {
            this.hpApplyBtn.addEventListener('click', () => {
                if (!this.hpDiceString || !this.inputs.hitPoints) return; // Need these elements
                
                const diceString = this.hpDiceString.value.trim();
                if (!diceString) {
                    this.inputs.hitPoints.value = "";
                    window.app.updateActiveNPCFromForm();
                    this.hideAllModals();
                    return;
                }
                
                const match = diceString.match(/^(?:(\d+d\d+)(?:\s*([+-])\s*(\d+))?|([+-]?\d+))$/);

                if (match) {
                    let totalHp = 0;
                    let finalDiceString = "";

                    if (match[1]) { // Dice part exists (e.g., "3d8", "3d8 + 5", "3d8 - 2")
                        const dicePart = match[1];
                        const sign = match[2];
                        const bonus = parseInt(match[3] || '0', 10);
                        const [numDice, dieType] = dicePart.split('d').map(Number);
                        // Ensure dieType is valid to prevent NaN issues
                        if (isNaN(numDice) || isNaN(dieType) || dieType <= 0) {
                            window.app.showAlert("Invalid dice format in Hit Dice.");
                            return;
                        }
                        const avgRoll = (dieType / 2) + 0.5;
                        totalHp = Math.floor(numDice * avgRoll);
                        finalDiceString = `${numDice}d${dieType}`;
                        
                        if (sign === '+') {
                            totalHp += bonus;
                            if (bonus !== 0) finalDiceString += ` + ${bonus}`;
                        } else if (sign === '-') {
                            totalHp -= bonus;
                            if (bonus !== 0) finalDiceString += ` - ${bonus}`;
                        }
                    } else if (match[4]) { // Only a number exists (e.g., "15", "-2")
                        totalHp = parseInt(match[4], 10);
                        // Validate if it's just a number
                        if (isNaN(totalHp)) {
                             window.app.showAlert("Invalid number format in Hit Dice.");
                            return;
                        }
                        finalDiceString = `${totalHp}`;
                    }

                    this.inputs.hitPoints.value = `${totalHp} (${finalDiceString})`;
                    window.app.updateActiveNPCFromForm();
                    this.hideAllModals();
                } else {
                     // Handle cases like "3d8 6" (no sign) - treat space as +
                     const simpleMatch = diceString.match(/^(\d+d\d+)\s+(\d+)$/);
                     if(simpleMatch) {
                        const dicePart = simpleMatch[1];
                        const bonus = parseInt(simpleMatch[2], 10);
                        const [numDice, dieType] = dicePart.split('d').map(Number);
                         // Ensure dieType is valid
                        if (isNaN(numDice) || isNaN(dieType) || dieType <= 0 || isNaN(bonus)) {
                            window.app.showAlert("Invalid dice format in Hit Dice.");
                            return;
                        }
                        const avgRoll = (dieType / 2) + 0.5;
                        let totalHp = Math.floor(numDice * avgRoll) + bonus;
                        let finalDiceString = `${numDice}d${dieType} + ${bonus}`;
                        this.inputs.hitPoints.value = `${totalHp} (${finalDiceString})`;
                        window.app.updateActiveNPCFromForm();
                        this.hideAllModals();
                     } else {
                        window.app.showAlert("Invalid Hit Dice format. Please use 'XdY + Z', 'XdY - Z', 'XdY', or just a number.");
                     }
                }
            });
        }
        if (this.hpClearBtn) {
            this.hpClearBtn.addEventListener('click', () => {
                if (this.hpDiceString) this.hpDiceString.value = '';
            });
        }

        // Add listener for the new footer import button
        if (this.footerImportTextBtn) {
            this.footerImportTextBtn.addEventListener('click', () => {
                if (!this.footerImportTextBtn.disabled) {
                    window.importer.openImportModal(); // Call importer function
                }
            });
        }
        // Listener for footerExportFgBtn will be added later

        // --- Setup functions called last ---
        this.setupCustomToggles();
        this.setupSavingThrowListeners();
        this.setupSkillListeners();
        this.setupResistanceListeners();
        this.setupWeaponModifierListeners();
        this.setupConditionImmunityListeners();
        this.setupLanguageListeners();
        this.setupTraitListeners();
        this.setupActionListeners();
    },

    // ... (rest of the file remains the same, including the safety checks added in the previous step) ...

    showNewBestiaryModal: function() {
		if (this.newBestiaryModal) {
			window.app.openModal('new-bestiary-modal');
			if (this.newBestiaryNameInput) this.newBestiaryNameInput.focus();
		} else { console.error("Element #new-bestiary-modal not found!")}
	},
    hideAllModals: function() {
		if (this.modalOverlay) this.modalOverlay.classList.add('hidden'); else { console.error("Element #modal-overlay not found!")}
        document.querySelectorAll('.modal-content').forEach(modal => {
             modal.classList.add('hidden');
        });
		if (this.alertOkBtn) this.alertOkBtn.onclick = null;
        if (this.alertCancelBtn) {
			this.alertCancelBtn.onclick = null;
			this.alertCancelBtn.classList.add('hidden');
		}
    },
    updateMenuState: function() {
		const hasActiveBestiary = !!window.app.activeBestiary;
		const menuItemsToToggle = [
			this.menuExportBestiary, this.menuNewNpc, this.menuDuplicateNpc, this.menuImportNpc,
			this.menuImportText, this.menuExportNpc, this.menuDeleteNpc, this.menuSettings
		].filter(item => item); // Filter out nulls if init failed

		menuItemsToToggle.forEach(item => {
			if (hasActiveBestiary) {
				item.classList.remove('disabled');
			} else {
				item.classList.add('disabled');
			}
		});

		// Also disable/enable footer buttons
        if (this.footerImportTextBtn) {
            this.footerImportTextBtn.disabled = !hasActiveBestiary;
        } else { /*console.error("Element #footer-import-text-btn not found!")*/ } // Silenced console error for now
         if (this.footerExportFgBtn) {
            this.footerExportFgBtn.disabled = !hasActiveBestiary;
        } else { /*console.error("Element #footer-export-fg-btn not found!")*/ } // Silenced console error for now
		
		if (this.menuDeleteNpc && hasActiveBestiary && window.app.activeBestiary.npcs.length <= 1) {
			this.menuDeleteNpc.classList.add('disabled');
		}
	},

	updateUIForActiveBestiary: function() {
		const hasActiveBestiary = !!window.app.activeBestiary;
		
		if (this.bestiaryStatusEl) {
			this.bestiaryStatusEl.innerHTML = hasActiveBestiary 
				? `Bestiary: <span class="font-bold text-red-700">${window.app.activeBestiary.projectName} (${window.app.activeBestiary.npcs.length} NPCs)</span>`
				: "No Bestiary Loaded";
		} else { console.error("Element #bestiary-status not found!")}
		
		if (this.mainContentColumn) {
			this.mainContentColumn.style.opacity = hasActiveBestiary ? '1' : '0.3';
			this.mainContentColumn.style.pointerEvents = hasActiveBestiary ? 'auto' : 'none';
		} else { console.error("Element #main-content-column not found!")}
		
		if (this.npcSelector) this.npcSelector.classList.toggle('hidden', !hasActiveBestiary); else { console.error("Element #npc-selector not found!")}
		if (this.deleteNpcBtn) this.deleteNpcBtn.classList.toggle('hidden', !hasActiveBestiary); else { console.error("Element #deleteNpcBtn not found!")}
		if (this.npcOptionsContainer) this.npcOptionsContainer.classList.toggle('hidden', !hasActiveBestiary); else { console.error("Element #npc-options-container not found!")}
		
		[this.newNpcBtn, this.duplicateNpcBtn, this.importNpcBtn, this.exportNpcBtn, this.deleteNpcBtn]
			.filter(btn => btn) // Filter out nulls
			.forEach(btn => btn.disabled = !hasActiveBestiary);
			
		this.updateMenuState(); // Update menu and footer buttons
		this.updateFormFromActiveNPC(); // Update form content
	},
	
	updateNpcSelector: function() {
		if (!window.app.activeBestiary || !this.npcSelector) return;
		
		const currentScroll = this.npcSelector.scrollTop; // Preserve scroll position
		this.npcSelector.innerHTML = '';
		
		window.app.activeBestiary.npcs.forEach((npc, index) => {
			const option = document.createElement('option');
			option.value = index;
			option.textContent = npc.name || "Unnamed NPC"; // Fallback for name
			if (index === window.app.activeNPCIndex) {
				option.selected = true;
			}
			this.npcSelector.appendChild(option);
		});
		this.npcSelector.scrollTop = currentScroll; // Restore scroll position

		if (this.deleteNpcBtn) {
			this.deleteNpcBtn.disabled = window.app.activeBestiary.npcs.length <= 1;
		}
	},
    populateLanguageListbox: function(listboxId, languageArray, selectedLanguages) {
		const listbox = document.getElementById(listboxId);
		if (!listbox) return;
		
		const currentScroll = listbox.scrollTop; // Preserve scroll
		listbox.innerHTML = '';
		const safeLangArray = Array.isArray(languageArray) ? languageArray : []; // Ensure it's an array
		safeLangArray.sort((a, b) => (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' }));

		safeLangArray.forEach(lang => {
			if (!lang) return; // Skip null/empty languages
			const option = document.createElement('option');
			option.value = lang;
			option.textContent = lang;
			option.selected = (selectedLanguages || []).includes(lang);
			listbox.appendChild(option);
		});
		listbox.scrollTop = currentScroll; // Restore scroll
	},
    updateFormFromActiveNPC: function() {
		window.app.isUpdatingForm = true;
		try {
			const trixEditorElement = document.querySelector("trix-editor");

			if (!window.app.activeNPC) {
				// Clear form if no active NPC
				Object.values(this.inputs).forEach(input => {
					if (!input) return;
					if (input.type === 'checkbox') input.checked = false;
					else input.value = '';
				});
				if (trixEditorElement && trixEditorElement.editor) trixEditorElement.editor.loadHTML("");
				if (this.viewport) this.viewport.innerHTML = '';
				if (this.npcSelector) this.npcSelector.innerHTML = ''; // Clear selector too
				if (this.npcTraitList) this.npcTraitList.innerHTML = '';
				if (this.savedTraitList) this.savedTraitList.innerHTML = '';
                this.renderActions(); // Clear action lists
				// Clear displays
				if (this.experienceDisplay) this.experienceDisplay.textContent = '';
				if (this.proficiencyBonusDisplay) this.proficiencyBonusDisplay.textContent = '';
				this.updateStatDisplays(); // Clear stat bonuses etc.
				this.updateTokenDisplay(); // Clear token
				this.updateImageDisplay(); // Clear image
				// Clear checkboxes etc.
				document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
				document.querySelectorAll('input[type="radio"][value="none"]').forEach(rb => rb.checked = true);
				if (this.languageListboxes) this.languageListboxes.forEach(lb => {if (lb) lb.selectedIndex = -1;}); // Deselect languages
				return;
			}

			// --- Populate Form from activeNPC ---
			for (const key in this.inputs) {
				const element = this.inputs[key];
				if (!element) continue;
                
				if (key.startsWith('common') || key === 'attackDamageDice') continue; 

				if (key === 'description') {
					element.value = window.app.activeNPC[key] || '';
					if (trixEditorElement && trixEditorElement.editor) {
						// Prevent feedback loop by checking if content is already the same
						if (trixEditorElement.editor.getDocument().toString().trim() !== (window.app.activeNPC[key] || '').trim()) {
							trixEditorElement.editor.loadHTML(window.app.activeNPC[key] || "");
						}
					}
					continue;
				}
				
				const customToggle = document.getElementById(`toggle-custom-${key}`);
				if (customToggle) {
					const select = element;
					const customInput = document.getElementById(`npc-${key}-custom`);
					if (!customInput) continue;
					
					const npcValue = window.app.activeNPC[key] || "";
					const isStandardOption = [...select.options].some(opt => opt.value === npcValue && !opt.disabled);
					
					customToggle.checked = !isStandardOption && npcValue !== "";
					select.classList.toggle('hidden', customToggle.checked);
					customInput.classList.toggle('hidden', !customToggle.checked);

					if (customToggle.checked) {
						customInput.value = npcValue;
						select.value = ""; // Clear select value if custom is used
					} else {
						select.value = npcValue;
						customInput.value = ""; // Clear custom input if standard is used
					}
				} else if (element.type === "checkbox") {
					element.checked = window.app.activeNPC[key] || false;
				} else {
					// Only update if value is different to avoid cursor jumps
                    if (element.value !== (window.app.activeNPC[key] || "")) {
                         element.value = window.app.activeNPC[key] || "";
                    }
				}
			}

			// Language population
			const selectedLangs = window.app.activeNPC.selectedLanguages || [];
			this.populateLanguageListbox('language-list-standard', window.app.standardLanguages, selectedLangs);
			this.populateLanguageListbox('language-list-exotic', window.app.exoticLanguages, selectedLangs);
			this.populateLanguageListbox('language-list-monstrous1', window.app.monstrousLanguages1, selectedLangs);
			this.populateLanguageListbox('language-list-monstrous2', window.app.monstrousLanguages2, selectedLangs);
			this.populateLanguageListbox('language-list-user', window.app.activeBestiary?.metadata?.userDefinedLanguages || [], selectedLangs);
			
			const telepathyCheckbox = document.getElementById('npc-has-telepathy');
			if (telepathyCheckbox) telepathyCheckbox.checked = window.app.activeNPC.hasTelepathy || false;
			const telepathyRangeInput = document.getElementById('npc-telepathy-range');
			if (telepathyRangeInput) telepathyRangeInput.value = window.app.activeNPC.telepathyRange || 0;
			const specialOptionSelect = document.getElementById('npc-special-language-option');
			if (specialOptionSelect) specialOptionSelect.value = window.app.activeNPC.specialLanguageOption || 0;

			this.populateSavedTraitsDatalist();
			if (this.sortTraitsAlphaCheckbox) this.sortTraitsAlphaCheckbox.checked = window.app.activeNPC.sortTraitsAlpha ?? true;
			this.renderNpcTraits();
			if (this.newTraitName) this.newTraitName.value = '';
			if (this.newTraitDescription) this.newTraitDescription.value = '';

            this.renderActions();
            // Don't clear inputs here, keep them populated if editing
            // window.app.clearInputs(); 
            if (this.legendaryBoilerplate) this.legendaryBoilerplate.textContent = window.app.activeNPC.legendaryBoilerplate || window.app.defaultNPC.legendaryBoilerplate;
            if (this.lairBoilerplate) this.lairBoilerplate.textContent = window.app.activeNPC.lairBoilerplate || window.app.defaultNPC.lairBoilerplate;

			for (const key in this.npcSettingsCheckboxes) {
				const checkbox = this.npcSettingsCheckboxes[key];
				// Use nullish coalescing to handle undefined properties, default to true matching defaultNPC
				if (checkbox) checkbox.checked = window.app.activeNPC[key] ?? true;
			}

			const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
			abilities.forEach(ability => {
				const profCheckbox = document.getElementById(`npc-${ability}-saving-throw-prof`);
				const adjustInput = document.getElementById(`npc-${ability}-saving-throw-adjust`);
				if (profCheckbox) profCheckbox.checked = window.app.activeNPC[`${ability}SavingThrowProf`] || false;
				if (adjustInput) adjustInput.value = window.app.activeNPC[`${ability}SavingThrowAdjust`] || 0;
			});
			
			window.app.skills.forEach(skill => {
				const profCheckbox = document.getElementById(`skill-${skill.id}-prof`);
				const expCheckbox = document.getElementById(`skill-${skill.id}-exp`);
				const adjustInput = document.getElementById(`skill-${skill.id}-adjust`);
				if (profCheckbox) profCheckbox.checked = window.app.activeNPC[`skill_${skill.id}_prof`] || false;
				if (expCheckbox) expCheckbox.checked = window.app.activeNPC[`skill_${skill.id}_exp`] || false;
				if (adjustInput) adjustInput.value = window.app.activeNPC[`skill_${skill.id}_adjust`] || 0;
            });
			
			window.app.damageTypes.forEach(type => {
				const vulnCheckbox = document.getElementById(`vuln-${type}`);
				const resCheckbox = document.getElementById(`res-${type}`);
				const immCheckbox = document.getElementById(`imm-${type}`);
				if (vulnCheckbox) vulnCheckbox.checked = window.app.activeNPC[`vulnerability_${type}`] || false;
				if (resCheckbox) resCheckbox.checked = window.app.activeNPC[`resistance_${type}`] || false;
				if (immCheckbox) immCheckbox.checked = window.app.activeNPC[`immunity_${type}`] || false;
			});
			
			window.app.conditions.forEach(condition => {
				const ciCheckbox = document.getElementById(`ci-${condition}`);
				if (ciCheckbox) ciCheckbox.checked = window.app.activeNPC[`ci_${condition}`] || false;
			});

			const weaponResValue = window.app.activeNPC.weaponResistance || 'none';
			const weaponResRadio = document.querySelector(`input[name="weapon-resistance"][value="${weaponResValue}"]`);
			if (weaponResRadio) {
				weaponResRadio.checked = true;
			} else { 
				const wrNone = document.getElementById('wr-none');
				if (wrNone) wrNone.checked = true;
			}
			
			const weaponImmValue = window.app.activeNPC.weaponImmunity || 'none';
			const weaponImmRadio = document.querySelector(`input[name="weapon-immunity"][value="${weaponImmValue}"]`);
			if (weaponImmRadio) {
				weaponImmRadio.checked = true;
			} else {
				const wiNone = document.getElementById('wi-none');
				if (wiNone) wiNone.checked = true;
			}

			const fgGroupDropdown = this.inputs.fg_group;
			if (fgGroupDropdown && window.app.activeBestiary) {
				fgGroupDropdown.innerHTML = '';
				const bestiaryOption = document.createElement('option');
				bestiaryOption.value = window.app.activeBestiary.projectName;
				bestiaryOption.textContent = window.app.activeBestiary.projectName;
				fgGroupDropdown.appendChild(bestiaryOption);
				(window.app.activeBestiary.metadata.fg_groups || []).forEach(group => {
					const groupOption = document.createElement('option');
					groupOption.value = group;
					groupOption.textContent = group;
					fgGroupDropdown.appendChild(groupOption);
				});
				// Ensure the saved value exists in the dropdown, otherwise default
				const currentGroup = window.app.activeNPC.fg_group || window.app.activeBestiary.projectName;
				if ([...fgGroupDropdown.options].some(opt => opt.value === currentGroup)) {
					fgGroupDropdown.value = currentGroup;
				} else {
					fgGroupDropdown.value = window.app.activeBestiary.projectName; // Default to bestiary name if saved group no longer exists
					window.app.activeNPC.fg_group = window.app.activeBestiary.projectName; // Correct the data
				}
			}

			if (this.experienceDisplay) this.experienceDisplay.textContent = window.app.activeNPC.experience || '';
			if (this.proficiencyBonusDisplay) this.proficiencyBonusDisplay.textContent = `+${window.app.activeNPC.proficiencyBonus}` || '+2';
			
			this.updateTokenDisplay();
			this.updateImageDisplay();
			window.app.calculateAllStats(); 
			this.updateStatDisplays(); 
			window.viewport.updateViewport(); 
			this.updateNpcSelector();
		} finally {
			window.app.isUpdatingForm = false;
		}
	},
    updateStatDisplays: function() {
		if (!window.app.activeNPC) {
			// Clear displays if no NPC
			const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
			abilities.forEach(ability => {
				const bonusEl = document.getElementById(`npc-${ability}-bonus`);
				if (bonusEl) bonusEl.textContent = '';
				const totalEl = document.getElementById(`npc-${ability}-saving-throw-total`);
				if (totalEl) totalEl.textContent = '';
			});
			this.updateSkillDisplays(); // Will also clear skill totals
			const passiveEl = document.getElementById('npc-passive-perception');
			if (passiveEl) passiveEl.textContent = '';
			return;
		};
		
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		const profBonus = window.app.activeNPC.proficiencyBonus || 2;

		abilities.forEach(ability => {
			const bonus = window.app.activeNPC[`${ability}Bonus`] || 0;
			const bonusEl = document.getElementById(`npc-${ability}-bonus`);
			if (bonusEl) {
				bonusEl.textContent = bonus >= 0 ? `+${bonus}` : bonus;
			}

			const base = bonus;
			const isProficient = window.app.activeNPC[`${ability}SavingThrowProf`] || false;
			const adjust = window.app.activeNPC[`${ability}SavingThrowAdjust`] || 0;
			const total = base + (isProficient ? profBonus : 0) + adjust;
			const totalEl = document.getElementById(`npc-${ability}-saving-throw-total`);
			if (totalEl) totalEl.textContent = total >= 0 ? `+${total}` : total;
		});
		
		this.updateSkillDisplays();
		
		const passivePerceptionEl = document.getElementById('npc-passive-perception');
		if (passivePerceptionEl) passivePerceptionEl.textContent = window.app.activeNPC.passivePerception || 10;
	},
	
	updateSkillDisplays: function() {
		const profBonus = window.app.activeNPC?.proficiencyBonus || 2; // Use optional chaining

        window.app.skills.forEach(skill => {
            const totalEl = document.getElementById(`skill-${skill.id}-total`);
            if (totalEl) {
				if (!window.app.activeNPC) {
					totalEl.textContent = ''; // Clear if no active NPC
					return;
				}
                const baseAbilityBonus = window.app.activeNPC[`${skill.attribute}Bonus`] || 0;
                const isProf = window.app.activeNPC[`skill_${skill.id}_prof`] || false;
                const isExp = window.app.activeNPC[`skill_${skill.id}_exp`] || false;
                const adjust = window.app.activeNPC[`skill_${skill.id}_adjust`] || 0;

                const total = baseAbilityBonus + (isProf ? profBonus : 0) + (isExp ? profBonus : 0) + adjust;
                totalEl.textContent = total >= 0 ? `+${total}` : total;
            }
        });
    },
    updateTokenDisplay: function() {
		if (!this.tokenBox) return;
		this.tokenBox.innerHTML = '';
		if (window.app.activeNPC && window.app.activeNPC.token) {
			const img = document.createElement('img');
			img.src = window.app.activeNPC.token;
			img.className = 'w-full h-full object-contain';
			this.tokenBox.appendChild(img);
		} else {
			const placeholder = document.createElement('span');
			placeholder.textContent = 'Click or Drag a Token Image Here';
			this.tokenBox.appendChild(placeholder);
		}
	},

	updateImageDisplay: function() {
		if (!this.imageBox) return;
		this.imageBox.innerHTML = '';
		if (window.app.activeNPC && window.app.activeNPC.image) {
			const img = document.createElement('img');
			img.src = window.app.activeNPC.image;
			img.className = 'w-full h-full object-contain';
			this.imageBox.appendChild(img);
		} else {
			const placeholder = document.createElement('span');
			placeholder.textContent = 'Click or Drag an NPC Image Here';
			this.imageBox.appendChild(placeholder);
		}
	},
	
	populateChallengeDropdown: function() {
		const challengeSelect = this.inputs.challenge;
		if (!challengeSelect) return;
		// Clear existing options before repopulating
		challengeSelect.innerHTML = ''; 
		window.app.challengeOrder.forEach(cr => {
			const option = document.createElement('option');
			option.value = cr;
			option.textContent = cr;
			challengeSelect.appendChild(option);
		});
		// Set a default if needed, e.g., '0'
        challengeSelect.value = '0';
	},

	setupCustomToggles: function() {
		const fields = ['size','type','species','alignment'];
		fields.forEach(field => {
			const toggle = document.getElementById(`toggle-custom-${field}`);
			const select = document.getElementById(`npc-${field}`);
			const customInput = document.getElementById(`npc-${field}-custom`);
			if (toggle && select && customInput) {
				toggle.addEventListener('change', () => {
					const isCustom = toggle.checked;
					select.classList.toggle('hidden', isCustom);
					customInput.classList.toggle('hidden', !isCustom);
					if (isCustom) {
						customInput.value = select.value; // Copy value on switch
						customInput.focus();
					} else {
						customInput.value = ''; // Clear custom on switch back
					}
					window.app.updateActiveNPCFromForm(); // Trigger update
				});
				customInput.addEventListener('input', window.app.updateActiveNPCFromForm);
			}
		});
	},
	
	setupSavingThrowListeners: function() {
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		abilities.forEach(ability => {
			const profCheckbox = document.getElementById(`npc-${ability}-saving-throw-prof`);
			const adjustInput = document.getElementById(`npc-${ability}-saving-throw-adjust`);
			if (profCheckbox) profCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);
			if (adjustInput) adjustInput.addEventListener('input', window.app.updateActiveNPCFromForm);
		});
	},
	
	setupSkillListeners: function() {
        document.querySelectorAll('.skill-row').forEach(row => {
            const profCheckbox = row.querySelector('.skill-prof');
            const expCheckbox = row.querySelector('.skill-exp');
            const adjustInput = row.querySelector('.skill-adjust');

			if (profCheckbox) profCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);
            if (adjustInput) adjustInput.addEventListener('input', window.app.updateActiveNPCFromForm);

            if (expCheckbox) {
				expCheckbox.addEventListener('input', () => {
					// Ensure prof is checked if exp is checked
					if (expCheckbox.checked && profCheckbox && !profCheckbox.checked) {
						profCheckbox.checked = true;
					}
					window.app.updateActiveNPCFromForm();
				});
			}
        });
    },
	
	setupResistanceListeners: function() {
		window.app.damageTypes.forEach(type => {
			const vulnCheckbox = document.getElementById(`vuln-${type}`);
			const resCheckbox = document.getElementById(`res-${type}`);
			const immCheckbox = document.getElementById(`imm-${type}`);

			if (vulnCheckbox) vulnCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);

			if (resCheckbox) {
				resCheckbox.addEventListener('input', () => {
					if (resCheckbox.checked && immCheckbox) {
						immCheckbox.checked = false;
					}
					window.app.updateActiveNPCFromForm();
				});
			}

			if (immCheckbox) {
				immCheckbox.addEventListener('input', () => {
					if (immCheckbox.checked && resCheckbox) {
						resCheckbox.checked = false;
					}
					window.app.updateActiveNPCFromForm();
				});
			}
		});
	},

	setupWeaponModifierListeners: function() {
		document.querySelectorAll('input[name="weapon-resistance"]').forEach(radio => {
			radio.addEventListener('input', window.app.updateActiveNPCFromForm);
		});
		document.querySelectorAll('input[name="weapon-immunity"]').forEach(radio => {
			radio.addEventListener('input', window.app.updateActiveNPCFromForm);
		});
	},

	setupConditionImmunityListeners: function() {
		window.app.conditions.forEach(condition => {
			const checkbox = document.getElementById(`ci-${condition}`);
			if (checkbox) checkbox.addEventListener('input', window.app.updateActiveNPCFromForm);
		});
	},
    setupLanguageListeners: function() {
		this.languageListboxes.forEach(listbox => {
			if (listbox) listbox.addEventListener('change', window.app.updateActiveNPCFromForm);
		});
		const telepathyCheckbox = document.getElementById('npc-has-telepathy');
		const telepathyRangeInput = document.getElementById('npc-telepathy-range');
		const specialOptionSelect = document.getElementById('npc-special-language-option');
		
		if (telepathyCheckbox) telepathyCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);
		if (telepathyRangeInput) telepathyRangeInput.addEventListener('input', window.app.updateActiveNPCFromForm);
		if (specialOptionSelect) specialOptionSelect.addEventListener('input', window.app.updateActiveNPCFromForm);
		
		if (this.manageLanguagesBtn) this.manageLanguagesBtn.addEventListener('click', this.showManageLanguagesModal.bind(this));
		if (this.addLanguageBtn) this.addLanguageBtn.addEventListener('click', this.addNewLanguage.bind(this));
		if (this.newLanguageNameInput) {
			this.newLanguageNameInput.addEventListener('keyup', (e) => {
				if (e.key === 'Enter') {
					this.addNewLanguage();
				}
			});
		}
	},
	setupTraitListeners: function() {
        if (this.addTraitBtn) this.addTraitBtn.addEventListener('click', this.addOrUpdateNpcTrait.bind(this));
        if (this.manageTraitsBtn) this.manageTraitsBtn.addEventListener('click', this.showManageTraitsModal.bind(this));
        if (this.addManagedTraitBtn) this.addManagedTraitBtn.addEventListener('click', this.addNewSavedTrait.bind(this));

		if (this.sortTraitsAlphaCheckbox) {
			this.sortTraitsAlphaCheckbox.addEventListener('input', () => {
				if (window.app.activeNPC) {
					window.app.activeNPC.sortTraitsAlpha = this.sortTraitsAlphaCheckbox.checked;
					this.renderNpcTraits();
					window.viewport.updateViewport();
					window.app.saveActiveBestiaryToDB();
				}
			});
		}
        if (this.newTraitName) {
			this.newTraitName.addEventListener('input', (e) => {
				const traitName = e.target.value;
				// Ensure activeBestiary and metadata exist before accessing savedTraits
				const savedTraits = window.app.activeBestiary?.metadata?.savedTraits || [];
				const matchedTrait = savedTraits.find(t => t?.name === traitName); // Optional chaining for safety
				if (matchedTrait && this.newTraitDescription) {
					this.newTraitDescription.value = matchedTrait.description || ''; // Use fallback
				}
			});
		}

        if (this.modalTokenButtons) {
			this.modalTokenButtons.addEventListener('click', (e) => {
				const button = e.target.closest('button[data-token]');
				if (!button) return;
				e.preventDefault();

				const baseToken = button.dataset.token;
				let finalToken;

				if (e.shiftKey) {
					finalToken = `{${baseToken.charAt(1).toUpperCase()}${baseToken.slice(2)}`;
				} else {
					finalToken = baseToken;
				}

				const textarea = this.modalTraitDescription;
				if (!textarea) return; 
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const text = textarea.value;

				textarea.value = text.substring(0, start) + finalToken + text.substring(end);
				textarea.selectionStart = textarea.selectionEnd = start + finalToken.length;
				textarea.focus();
			});
		}
    },
    setupActionListeners: function() {
        if (this.clearEditBtn) this.clearEditBtn.addEventListener('click', window.app.clearInputs);
        if (this.legendaryBoilerplate) this.legendaryBoilerplate.addEventListener('dblclick', () => window.app.editBoilerplate(this.legendaryBoilerplate));
        if (this.lairBoilerplate) this.lairBoilerplate.addEventListener('dblclick', () => window.app.editBoilerplate(this.lairBoilerplate));
        if (this.inputs.commonDesc) this.inputs.commonDesc.addEventListener('dblclick', () => window.app.handleAttackHelperOpen());
        
        document.querySelectorAll('button[data-action-type]').forEach(button => {
            button.addEventListener('click', () => {
                window.app.addOrUpdateAction(button.dataset.actionType);
            });
        });

        const attackHelperModal = document.getElementById('attack-helper-modal'); 
        if (attackHelperModal) {
            const primaryBtn = attackHelperModal.querySelector('button.btn-primary');
            const cancelBtn = attackHelperModal.querySelector('button.hover\\:bg-gray-100[title*="Close"]');
            const addDamageBtn = attackHelperModal.querySelector('button[title*="Add another damage component"]');
			if (primaryBtn) primaryBtn.addEventListener('click', window.app.generateAttackString);
            if (cancelBtn) cancelBtn.addEventListener('click', () => window.app.closeModal('attack-helper-modal'));
            if (addDamageBtn) addDamageBtn.addEventListener('click', window.app.addDamageRow);
            if (this.attackDamageDiceClearBtn) {
				this.attackDamageDiceClearBtn.addEventListener('click', () => {
					 if (this.inputs.attackDamageDice) this.inputs.attackDamageDice.value = '';
				});
			}
        }

        const boilerplateModal = document.getElementById('boilerplate-modal');
        if(boilerplateModal) {
             const primaryBtn = boilerplateModal.querySelector('button.btn-primary');
             const cancelBtn = boilerplateModal.querySelector('button.hover\\:bg-gray-100');
             if (primaryBtn) primaryBtn.addEventListener('click', window.app.saveBoilerplate);
             if (cancelBtn) cancelBtn.addEventListener('click', () => window.app.closeModal('boilerplate-modal'));
        }

        const primaryDiceSelector = document.getElementById('primary-dice-selector');
        const attackDamageDiceInput = document.getElementById('attack-damage-dice');
        if (primaryDiceSelector && attackDamageDiceInput) {
			window.app.createDiceSelector(primaryDiceSelector, attackDamageDiceInput);
		}
    },
    setupDragAndDrop: function(box, validTypes, npcKey, updateFn) {
		if (!box) return; 
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
			if (!window.app.activeNPC) return;
			const file = e.dataTransfer?.files?.[0]; // Use optional chaining
			if (file && validTypes.includes(file.type)) {
				const reader = new FileReader();
				reader.onload = ev => {
					window.app.activeNPC[npcKey] = ev.target.result;
					updateFn();
					window.app.saveActiveBestiaryToDB();
				};
				reader.readAsDataURL(file);
			} else if (file) { // Only warn if a file was dropped but type was invalid
				console.warn("Invalid file type dropped:", file.type);
				window.app.showAlert(`Invalid file type. Please drop one of: ${validTypes.join(', ')}`);
			}
		});
	},
    showLoadBestiaryModal: async function() {
		if (!this.loadBestiaryModal || !this.bestiaryListDiv) return; 
		
		let bestiaries = [];
		try {
			bestiaries = await window.app.db.projects.toArray();
		} catch (error) {
			console.error("Failed to load bestiaries from database:", error);
			window.app.showAlert("Error loading bestiary list. Check console.");
			return; // Stop execution if DB fails
		}

		this.bestiaryListDiv.innerHTML = ''; // Clear previous list

		if (bestiaries.length === 0) {
			this.bestiaryListDiv.innerHTML = '<p class="text-gray-500 text-center">No bestiaries found.</p>';
		} else {
			// Sort bestiaries alphabetically by name, case-insensitive
			bestiaries.sort((a, b) => (a.projectName || '').localeCompare(b.projectName || '', undefined, { sensitivity: 'base' }));

			bestiaries.forEach(proj => {
				const projEl = document.createElement('div');
				projEl.className = 'flex justify-between items-center py-1 px-2 border rounded-md hover:bg-gray-100';

				const nameSpan = document.createElement('span');
				nameSpan.textContent = proj.projectName || 'Unnamed Bestiary'; // Fallback name
				nameSpan.className = 'cursor-pointer flex-grow mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap'; // Prevent overflow
				nameSpan.title = proj.projectName || 'Unnamed Bestiary'; // Add title for full name on hover
				nameSpan.onclick = () => {
					window.app.loadBestiary(proj);
					this.hideAllModals();
				};

				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700 flex-shrink-0"><use href="#icon-trash"></use></svg>`; // Added flex-shrink-0
				deleteBtn.className = 'p-1';
				deleteBtn.title = `Delete ${proj.projectName || 'Unnamed Bestiary'}`;
				deleteBtn.onclick = async (e) => {
					e.stopPropagation();
					// Confirmation before deleting
					window.app.showConfirm(
						"Delete Bestiary?",
						`Are you sure you want to permanently delete the bestiary "${proj.projectName || 'Unnamed Bestiary'}"? This cannot be undone.`,
						async () => { // onConfirm action
							try {
								await window.app.db.projects.delete(proj.id);
								// If the deleted bestiary was the active one, clear the app state
								if(window.app.activeBestiary && window.app.activeBestiary.id === proj.id) {
									window.app.activeBestiary = null;
									window.app.activeNPC = null;
									window.app.activeNPCIndex = -1;
									this.updateUIForActiveBestiary(); // Update UI to reflect no active bestiary
								}
								this.showLoadBestiaryModal(); // Re-render the modal list
							} catch (deleteError) {
								console.error("Failed to delete bestiary:", deleteError);
								window.app.showAlert("Error deleting bestiary. Check console.");
							}
						}
					);
				};
				
				projEl.appendChild(nameSpan);
				projEl.appendChild(deleteBtn);
				this.bestiaryListDiv.appendChild(projEl);
			});
		}
		window.app.openModal('load-bestiary-modal');
	},
	
	showManageGroupsModal: async function() {
		if (!window.app.activeBestiary || !this.manageGroupsModal || !this.groupListDiv) return;
		
		this.groupListDiv.innerHTML = '';
		const groups = window.app.activeBestiary.metadata.fg_groups || [];
		
		if (groups.length === 0) {
			this.groupListDiv.innerHTML = '<p class="text-gray-500 text-center">No custom groups created.</p>';
		} else {
			// Sort groups alphabetically
			groups.sort((a, b) => (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' }));

			groups.forEach(groupName => {
				if (!groupName) return; // Skip empty names
				const groupEl = document.createElement('div');
				groupEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = groupName;
				nameSpan.className = 'mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap'; // Prevent overflow
                nameSpan.title = groupName; // Show full name on hover

				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700 flex-shrink-0"><use href="#icon-trash"></use></svg>`; // Added flex-shrink-0
				deleteBtn.className = 'p-1 delete-group-btn';
				deleteBtn.title = `Delete group: ${groupName}`;
				deleteBtn.onclick = (e) => {
					e.stopPropagation();
					this.deleteGroup(groupName); // Call delete function
				};

				groupEl.appendChild(nameSpan);
				groupEl.appendChild(deleteBtn);
				this.groupListDiv.appendChild(groupEl);
			});
		}
		window.app.openModal('manage-groups-modal');
	},

	showSettingsModal: function() {
		if (!window.app.activeBestiary || !this.settingsModal) return;

		for (const key in this.bestiarySettingsCheckboxes) {
			const checkbox = this.bestiarySettingsCheckboxes[key];
			// Use ?? true to default to checked if metadata property is missing
			if (checkbox) checkbox.checked = window.app.activeBestiary.metadata[key] ?? true; 
		}

		window.app.openModal('settings-modal');
	},

	deleteGroup: function(groupName) {
		if (!window.app.activeBestiary || !window.app.activeBestiary.metadata.fg_groups || !groupName) return;
		
		// Confirmation before deleting
        window.app.showConfirm(
            "Delete Group?",
            `Are you sure you want to delete the group "${groupName}"? NPCs currently in this group will be moved to the default bestiary group.`,
            () => { // onConfirm action
                window.app.activeBestiary.metadata.fg_groups = window.app.activeBestiary.metadata.fg_groups.filter(g => g !== groupName);
                
                window.app.activeBestiary.npcs.forEach(npc => {
                    if (npc.fg_group === groupName) {
                        npc.fg_group = window.app.activeBestiary.projectName; // Reassign to default
                    }
                });

                window.app.saveActiveBestiaryToDB();
                this.showManageGroupsModal(); // Re-render group list
                this.updateFormFromActiveNPC(); // Update main form dropdown if necessary
            }
        );
	},

	addNewGroup: function() {
		if (!this.newGroupNameInput || !window.app.activeBestiary) return; 
		const newName = this.newGroupNameInput.value.trim();
		if (!newName) {
			window.app.showAlert("Group name cannot be empty.");
			return;
		}

		if (!window.app.activeBestiary.metadata.fg_groups) {
			window.app.activeBestiary.metadata.fg_groups = [];
		}
		
		const isDuplicate = newName.toLowerCase() === window.app.activeBestiary.projectName.toLowerCase() || 
							window.app.activeBestiary.metadata.fg_groups.some(g => g?.toLowerCase() === newName.toLowerCase()); // Added optional chaining

		if (isDuplicate) {
			window.app.showAlert(`A group named "${newName}" already exists (either as the default or a custom group).`);
			return;
		}

		window.app.activeBestiary.metadata.fg_groups.push(newName);
		window.app.saveActiveBestiaryToDB();
		this.newGroupNameInput.value = '';
		this.showManageGroupsModal(); 
		this.updateFormFromActiveNPC(); 
	},
	
	showManageLanguagesModal: function() {
		if (!window.app.activeBestiary || !this.manageLanguagesModal || !this.languageListDiv) return; 
		
		this.languageListDiv.innerHTML = '';
		const userLangs = window.app.activeBestiary.metadata.userDefinedLanguages || [];

		if (userLangs.length === 0) {
			this.languageListDiv.innerHTML = '<p class="text-gray-500 text-center">No custom languages created.</p>';
		} else {
			userLangs.sort((a, b) => (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' }));

			userLangs.forEach(langName => {
				if (!langName) return; // Skip empty names
				const langEl = document.createElement('div');
				langEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = langName;
				nameSpan.className = 'mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap'; // Prevent overflow
                nameSpan.title = langName; // Show full name on hover

				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700 flex-shrink-0"><use href="#icon-trash"></use></svg>`; // Added flex-shrink-0
				deleteBtn.className = 'p-1 delete-language-btn';
				deleteBtn.title = `Delete language: ${langName}`;
				deleteBtn.onclick = (e) => {
					e.stopPropagation();
					this.deleteLanguage(langName); // Call delete function
				};

				langEl.appendChild(nameSpan);
				langEl.appendChild(deleteBtn);
				this.languageListDiv.appendChild(langEl);
			});
		}
		window.app.openModal('manage-languages-modal');
		if (this.newLanguageNameInput) this.newLanguageNameInput.focus();
	},
	
	addNewLanguage: function() {
		if (!window.app.activeBestiary || !this.newLanguageNameInput) return;
		const newName = this.newLanguageNameInput.value.trim();
		if (!newName) {
			window.app.showAlert("Language name cannot be empty.");
			return;
		}
		
		const lowerNewName = newName.toLowerCase();
		const isPredefined = window.app.allPredefinedLanguages.includes(lowerNewName);
		
		// Ensure userDefinedLanguages exists
		if (!window.app.activeBestiary.metadata.userDefinedLanguages) {
			window.app.activeBestiary.metadata.userDefinedLanguages = [];
		}
		const userLangs = window.app.activeBestiary.metadata.userDefinedLanguages;
		const isUserDefined = userLangs.some(l => l?.toLowerCase() === lowerNewName); // Added optional chaining

		if (isPredefined || isUserDefined) {
			window.app.showAlert(`A language named "${newName}" already exists (either predefined or user-defined).`);
			return;
		}

		window.app.activeBestiary.metadata.userDefinedLanguages.push(newName);
		window.app.saveActiveBestiaryToDB();
		this.newLanguageNameInput.value = '';
		this.showManageLanguagesModal(); 
		this.updateFormFromActiveNPC(); 
	},
	
	deleteLanguage: function(langName) {
		if (!window.app.activeBestiary || !langName) return; 
		
        // Confirmation before deleting
        window.app.showConfirm(
            "Delete Language?",
            `Are you sure you want to delete the custom language "${langName}"? NPCs who know this language will lose it.`,
            () => { // onConfirm action
                // Ensure userDefinedLanguages exists before filtering
                if (window.app.activeBestiary.metadata.userDefinedLanguages) {
                    window.app.activeBestiary.metadata.userDefinedLanguages = window.app.activeBestiary.metadata.userDefinedLanguages.filter(l => l !== langName);
                }
                
                window.app.activeBestiary.npcs.forEach(npc => {
                    if (npc.selectedLanguages) {
                        npc.selectedLanguages = npc.selectedLanguages.filter(l => l !== langName);
                    }
                });

                window.app.saveActiveBestiaryToDB();
                this.showManageLanguagesModal(); 
                this.updateFormFromActiveNPC(); 
            }
        );
	},

	addOrUpdateNpcTrait: function() {
		if (!window.app.activeNPC || !this.newTraitName || !this.newTraitDescription) return;
		const name = this.newTraitName.value.trim();
		const description = this.newTraitDescription.value.trim();
		if (!name) { 
			window.app.showAlert("Trait name cannot be empty.");
			return; 
		}
		if (!description) { 
			window.app.showAlert("Trait description cannot be empty.");
			return; 
		}

		// Ensure traits array exists
        if (!window.app.activeNPC.traits) {
            window.app.activeNPC.traits = [];
        }

		const existingTraitIndex = window.app.activeNPC.traits.findIndex(trait => trait?.name?.toLowerCase() === name.toLowerCase()); // Added optional chaining

		if (existingTraitIndex > -1) {
			// Update existing trait
			window.app.activeNPC.traits[existingTraitIndex].description = description;
		} else {
			// Add new trait
			window.app.activeNPC.traits.push({ name, description });
		}
		
		// Clear inputs after adding/updating
		this.newTraitName.value = '';
		this.newTraitDescription.value = '';
		
		this.renderNpcTraits(); // Re-render the list (which will sort if needed)
		window.viewport.updateViewport();
		window.app.saveActiveBestiaryToDB();
	},

	renderNpcTraits: function() {
		if (!this.npcTraitList) return; 
		this.npcTraitList.innerHTML = ''; // Clear current list
		if (!window.app.activeNPC || !Array.isArray(window.app.activeNPC.traits)) return; // Ensure traits is an array

		let draggedElement = null; // Track the element being dragged

		const shouldSort = window.app.activeNPC.sortTraitsAlpha ?? true;
		// Create a copy with original indices for stable sorting/deletion if not sorting alphabetically
        let traitsToRender = window.app.activeNPC.traits.map((trait, index) => ({ ...trait, originalIndex: index }));

		if (shouldSort) {
			traitsToRender.sort((a, b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
		}

		traitsToRender.forEach((traitData) => {
			if (!traitData) return; // Skip if null/undefined

			const traitEl = document.createElement('div');
			traitEl.className = 'p-2 border rounded-md bg-gray-50 hover:bg-gray-100 flex justify-between items-start group'; // Added group for hover effect on button
			traitEl.dataset.originalIndex = traitData.originalIndex; // Always store original index

			const contentEl = document.createElement('div');
            contentEl.className = 'flex-grow mr-2 overflow-hidden'; // Prevent button overlap
			const processedDescription = window.app.processTraitString(traitData.description || '', window.app.activeNPC);
			// Truncate description preview if it's too long
			const previewDesc = processedDescription.length > 150 ? processedDescription.substring(0, 150) + '...' : processedDescription;
			contentEl.innerHTML = `<strong class="text-sm block overflow-hidden overflow-ellipsis whitespace-nowrap">${traitData.name || 'Unnamed Trait'}</strong><p class="text-xs text-gray-600">${previewDesc}</p>`;
            contentEl.title = `${traitData.name || 'Unnamed Trait'}\n${traitData.description || ''}`; // Show full text on hover
			
			const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex-shrink-0 flex items-center'; // Container for buttons

            const deleteBtn = document.createElement('button');
			deleteBtn.innerHTML = `&times;`;
			// Make delete less prominent until hover
            deleteBtn.className = 'ml-1 text-gray-400 hover:text-red-700 font-bold text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity'; 
			deleteBtn.title = `Delete ${traitData.name || 'Unnamed Trait'}`;
			
			deleteBtn.onclick = (e) => {
				e.stopPropagation(); // Prevent trait from being loaded into editor
                window.app.showConfirm( // Add confirmation
                    "Delete Trait?",
                    `Are you sure you want to delete the trait "${traitData.name || 'Unnamed Trait'}" from this NPC?`,
                    () => { // onConfirm
                        const indexToDelete = parseInt(traitEl.dataset.originalIndex, 10);
                        if (!isNaN(indexToDelete) && indexToDelete >= 0 && indexToDelete < window.app.activeNPC.traits.length) {
                            window.app.activeNPC.traits.splice(indexToDelete, 1);
                            this.renderNpcTraits(); // Re-render the list
                            window.viewport.updateViewport();
                            window.app.saveActiveBestiaryToDB();
                        } else {
                            console.error("Error finding trait index for deletion.");
                            window.app.showAlert("Error deleting trait.");
                        }
                    }
                );
			};

            // Only make draggable and add drag handle if not sorting
            if (!shouldSort) {
                traitEl.draggable = true;
                traitEl.classList.add('cursor-grab'); // Indicate draggability

                const dragHandle = document.createElement('span');
                dragHandle.innerHTML = '&#x2630;'; // Hamburger icon as handle
                dragHandle.className = 'cursor-grab text-gray-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity';
                dragHandle.title = "Drag to reorder";
                
                buttonContainer.insertBefore(dragHandle, deleteBtn); // Add handle before delete button

				traitEl.addEventListener('dragstart', (e) => {
					// Only allow dragging by the handle
                    if (!dragHandle.contains(e.target)) {
                         e.preventDefault();
                         return;
                    }
                    draggedElement = traitEl; // Store the element being dragged
					e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', traitData.originalIndex); // Set data for drop target
					setTimeout(() => traitEl.classList.add('opacity-50', 'bg-blue-100'), 0); // Visual feedback
				});

				traitEl.addEventListener('dragend', () => {
					if (draggedElement) {
						draggedElement.classList.remove('opacity-50', 'bg-blue-100');
					}
                    draggedElement = null;
					// Clear all indicators on drag end
                    document.querySelectorAll('#npc-trait-list .drop-indicator-top, #npc-trait-list .drop-indicator-bottom').forEach(el => {
						el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
					});
				});

				traitEl.addEventListener('dragover', (e) => {
					e.preventDefault(); // Necessary to allow dropping
                    if (!draggedElement || draggedElement === traitEl) return; // Don't indicate on self

                    // Clear previous indicators
                    document.querySelectorAll('#npc-trait-list > div').forEach(el => {
						if (el !== traitEl) el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
					});

					// Determine if dropping above or below
                    const rect = traitEl.getBoundingClientRect();
					const isAbove = e.clientY < rect.top + rect.height / 2;
					
                    traitEl.classList.toggle('drop-indicator-top', isAbove);
                    traitEl.classList.toggle('drop-indicator-bottom', !isAbove);
                    e.dataTransfer.dropEffect = "move";
				});

                traitEl.addEventListener('dragleave', (e) => {
                    // Only remove indicator if leaving the element entirely, not just moving within it
                    if (!traitEl.contains(e.relatedTarget)) {
                        traitEl.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
                    }
                });

				traitEl.addEventListener('drop', (e) => {
					e.preventDefault();
                    if (!draggedElement || draggedElement === traitEl) return; // Can't drop on self

                    const draggedOriginalIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
					const droppedOnOriginalIndex = parseInt(traitEl.dataset.originalIndex, 10);
                    
                    // Find the actual current indices in the array based on originalIndex
                    const currentDraggedIndex = window.app.activeNPC.traits.findIndex(t => t === window.app.activeNPC.traits[draggedOriginalIndex]);
                    let currentDroppedOnIndex = window.app.activeNPC.traits.findIndex(t => t === window.app.activeNPC.traits[droppedOnOriginalIndex]);

                    if (currentDraggedIndex === -1 || currentDroppedOnIndex === -1) {
                         console.error("Drag/Drop index error");
                         traitEl.classList.remove('drop-indicator-top', 'drop-indicator-bottom'); // Clean up indicator
                         return;
                    }

					const isDroppingAbove = traitEl.classList.contains('drop-indicator-top');
                    traitEl.classList.remove('drop-indicator-top', 'drop-indicator-bottom'); // Clean up indicator

					// Perform the move
					const [movedItem] = window.app.activeNPC.traits.splice(currentDraggedIndex, 1);
                    
                    // Adjust insertion index based on original position and drop position
                     // Need to find the new index of the item we dropped onto *after* splicing the dragged item
                    let insertionIndex = window.app.activeNPC.traits.findIndex(t => t === window.app.activeNPC.traits.find(item => item.name === traitData.name && item.description === traitData.description)); // Find by content might be more robust?
                    if (insertionIndex === -1) insertionIndex = currentDroppedOnIndex > currentDraggedIndex ? currentDroppedOnIndex -1 : currentDroppedOnIndex; // Fallback index logic


					window.app.activeNPC.traits.splice(isDroppingAbove ? insertionIndex : insertionIndex + 1, 0, movedItem);
					
					// Re-render the entire list to reflect the new order and update indices
					this.renderNpcTraits(); 
					window.viewport.updateViewport();
					window.app.saveActiveBestiaryToDB();
				});
			} else {
                 traitEl.draggable = false; // Explicitly set non-draggable if sorting
            }

			// Click loads trait into editor
			contentEl.addEventListener('click', () => { // Attach to contentEl to avoid button clicks triggering it
				if (this.newTraitName) this.newTraitName.value = traitData.name || '';
				if (this.newTraitDescription) this.newTraitDescription.value = traitData.description || '';
			});
			

			traitEl.appendChild(contentEl);
            traitEl.appendChild(buttonContainer); // Add button container
			this.npcTraitList.appendChild(traitEl);
		});

        // Add a listener to the container to clear indicators if the mouse leaves the list area
        if (this.npcTraitList) {
            this.npcTraitList.addEventListener('dragleave', (e) => {
                if (!this.npcTraitList.contains(e.relatedTarget)) {
                    document.querySelectorAll('#npc-trait-list > div').forEach(el => {
                        el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
                    });
                }
            });
        }
	},

    renderActions: function() {
        const actionTypes = ['actions', 'bonus-actions', 'reactions', 'legendary-actions', 'lair-actions'];
        
        actionTypes.forEach(type => {
            const container = document.getElementById(`${type}-container`);
            if (!container) return; // Skip if container doesn't exist

            container.innerHTML = ''; // Clear current items

            // Ensure NPC and actions[type] exist and is an array
            const items = window.app.activeNPC?.actions?.[type];
            if (!Array.isArray(items)) return; // Exit if no items for this type

            // Create a copy with original indices for stable rendering/editing
            const itemsWithIndices = items.map((item, index) => ({ ...item, originalIndex: index }));
           
            // Sort alphabetically for display, keeping Multiattack first for 'actions'
            let sortedItems = [...itemsWithIndices];
             if (type === 'actions') {
                let multiattack = null;
                const otherItems = sortedItems.filter(item => {
                    if (item && item.name && item.name.toLowerCase() === 'multiattack') {
                        multiattack = item;
                        return false;
                    }
                    return true;
                });
                otherItems.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
                sortedItems = multiattack ? [multiattack, ...otherItems] : otherItems;
            } else {
                 sortedItems.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
            }


            sortedItems.forEach(itemData => {
                 if (!itemData) return; // Skip if item is somehow null/undefined

                const listItem = document.createElement("li");
                listItem.className = "action-list-item p-3 rounded-lg border border-gray-300 group"; // Added group
                listItem.dataset.actionType = type;
                // Store the ORIGINAL index from the data array for editing/deletion
                listItem.dataset.actionIndex = itemData.originalIndex; 
                listItem.setAttribute("onclick", "window.app.editAction(this)");
                listItem.setAttribute("title", "Click to load this action back into the editor above.");
                
                // Truncate description preview
                const descPreview = (itemData.desc || '').length > 100 ? (itemData.desc || '').substring(0, 100) + '...' : (itemData.desc || '');

                listItem.innerHTML = `
                    <div class="flex justify-between items-start">
                        <p class="flex-grow text-sm mr-2 overflow-hidden"> 
                            <em class="font-bold action-name not-italic">${itemData.name || 'Unnamed Action'}</em>. 
                            <span class="font-normal text-xs action-desc">${descPreview}</span>
                        </p>
                        <button onclick="ui.deleteAction(this, event)" class="flex-shrink-0 text-gray-400 hover:text-red-700 font-bold text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Action">&times;</button>
                    </div>`;
                container.appendChild(listItem);
            });
        });
    },

    // New function to handle action deletion
    deleteAction: function(buttonElement, event) {
        event.stopPropagation(); // Prevent the click from bubbling up to the li (which triggers edit)
        
        const listItem = buttonElement.closest('li.action-list-item');
        if (!listItem || !window.app.activeNPC) return;

        const type = listItem.dataset.actionType;
        const indexToDelete = parseInt(listItem.dataset.actionIndex, 10);
        const actionName = listItem.querySelector('.action-name')?.textContent || 'this action';

        if (type && !isNaN(indexToDelete) && window.app.activeNPC.actions && Array.isArray(window.app.activeNPC.actions[type])) {
            window.app.showConfirm(
                "Delete Action?",
                `Are you sure you want to delete "${actionName}"?`,
                () => { // onConfirm
                    if (indexToDelete >= 0 && indexToDelete < window.app.activeNPC.actions[type].length) {
                         window.app.activeNPC.actions[type].splice(indexToDelete, 1);
                         this.renderActions(); // Re-render the lists
                         window.viewport.updateViewport(); // Update the preview
                         window.app.saveActiveBestiaryToDB(); // Save changes
                         window.app.clearInputs(); // Clear editor if the deleted action was being edited
                    } else {
                        console.error("Invalid index for action deletion:", indexToDelete);
                        window.app.showAlert("Error deleting action: Invalid index.");
                    }
                }
            );
        } else {
             console.error("Could not delete action, invalid data:", { type, indexToDelete });
             window.app.showAlert("Error deleting action: Could not find action data.");
        }
    },
	
	populateSavedTraitsDatalist: function() {
		if (!this.savedTraitList) return;
		this.savedTraitList.innerHTML = '';
		// Ensure activeBestiary and metadata exist
		const savedTraits = window.app.activeBestiary?.metadata?.savedTraits;
		if (!Array.isArray(savedTraits)) return;

		savedTraits.forEach(trait => {
			if (trait?.name) { // Check if trait and name exist
				const option = document.createElement('option');
				option.value = trait.name;
				this.savedTraitList.appendChild(option);
			}
		});
	},

	showManageTraitsModal: function() {
		if (!window.app.activeBestiary || !this.manageTraitsModal || !this.managedTraitListDiv) return;

		this.managedTraitListDiv.innerHTML = '';
		const savedTraits = window.app.activeBestiary.metadata.savedTraits || [];

		if (savedTraits.length === 0) {
			this.managedTraitListDiv.innerHTML = '<p class="text-gray-500 text-center">No saved traits.</p>';
		} else {
			savedTraits.sort((a,b) => (a?.name || '').localeCompare(b?.name || '')).forEach(trait => {
				if (!trait?.name) return; // Skip traits without names
				const traitEl = document.createElement('div');
				traitEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = trait.name;
				nameSpan.className = 'mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap';
                nameSpan.title = trait.name;
				
				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700 flex-shrink-0"><use href="#icon-trash"></use></svg>`;
				deleteBtn.className = 'p-1';
				deleteBtn.title = `Delete trait: ${trait.name}`;
				deleteBtn.onclick = (e) => {
					e.stopPropagation();
					this.deleteSavedTrait(trait.name); // Call delete function
				};

				traitEl.appendChild(nameSpan);
				traitEl.appendChild(deleteBtn);
				this.managedTraitListDiv.appendChild(traitEl);
			});
		}
		window.app.openModal('manage-traits-modal');
		if (this.modalTraitName) this.modalTraitName.focus();
	},

	addNewSavedTrait: function() {
		if (!this.modalTraitName || !this.modalTraitDescription || !window.app.activeBestiary) return;
		const name = this.modalTraitName.value.trim();
		const description = this.modalTraitDescription.value.trim();
		if (!name) { 
			window.app.showAlert("Saved trait name cannot be empty.");
			return; 
		}
		if (!description) { 
			window.app.showAlert("Saved trait description cannot be empty.");
			return; 
		}

        // Ensure savedTraits exists
        if (!window.app.activeBestiary.metadata.savedTraits) {
            window.app.activeBestiary.metadata.savedTraits = [];
        }
		const savedTraits = window.app.activeBestiary.metadata.savedTraits;

		if (savedTraits.some(t => t?.name?.toLowerCase() === name.toLowerCase())) {
			window.app.showAlert(`A saved trait named "${name}" already exists.`);
			return;
		}

		savedTraits.push({ name, description });
		this.modalTraitName.value = '';
		this.modalTraitDescription.value = '';

		this.showManageTraitsModal(); 
		this.populateSavedTraitsDatalist(); 
		window.app.saveActiveBestiaryToDB();
	},

	deleteSavedTrait: function(traitName) {
		if (!window.app.activeBestiary || !window.app.activeBestiary.metadata.savedTraits || !traitName) return; 
		
        window.app.showConfirm( // Add confirmation
            "Delete Saved Trait?",
            `Are you sure you want to permanently delete the saved trait "${traitName}"? This cannot be undone.`,
            () => { // onConfirm
                const metadata = window.app.activeBestiary.metadata;
                metadata.savedTraits = metadata.savedTraits.filter(t => t?.name !== traitName);
                
                this.showManageTraitsModal(); 
                this.populateSavedTraitsDatalist(); 
                window.app.saveActiveBestiaryToDB();
            }
        );
	},

	parseHpStringToModal: function() {
		if (!this.inputs.hitPoints || !this.hpDiceString) return; 
		const hpString = this.inputs.hitPoints.value || "";
		// Regex to find content within parentheses OR just a number if no parentheses
		const match = hpString.match(/\((.*?)\)|^\s*(\d+)\s*$/); 

		if (match) {
            // Use group 1 if parentheses found, otherwise use group 2 (the number itself)
			this.hpDiceString.value = (match[1] || match[2] || '').trim(); 
		} else {
			this.hpDiceString.value = ''; // Clear if format is unexpected
		}
	},
    populateDamageTypes: function(elementId) {
        const select = document.getElementById(elementId);
        if (select) {
            // Store current value if exists
            const currentValue = select.value;
            select.innerHTML = '';
            window.app.damageTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.toLowerCase();
                option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                select.appendChild(option);
            });
            // Try to restore previous value or default
            if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
                 select.value = currentValue;
            } else if (elementId === 'attack-damage-type') {
                select.value = 'slashing';
            }
        }
    },
};