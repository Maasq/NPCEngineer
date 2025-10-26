// ui-elements.js
window.ui = {
    // --- UI ELEMENTS (Initialized to null) ---
    mainContentColumn: null,
    viewport: null,
    bestiaryStatusEl: null,
    newBestiaryBtn: null,
    loadBestiaryBtn: null,
    exportBestiaryBtn: null,
    importBestiaryBtn: null,
    newNpcBtn: null,
    duplicateNpcBtn: null,
    importNpcBtn: null,
    exportNpcBtn: null,
    deleteNpcBtn: null,
    hamburgerBtn: null,
    mainMenu: null,
    menuNewBestiary: null,
    menuLoadBestiary: null,
    menuImportBestiary: null,
    menuExportBestiary: null,
    menuNewNpc: null,
    menuDuplicateNpc: null,
    menuImportNpc: null,
    menuImportText: null,
    menuExportNpc: null,
    menuDeleteNpc: null,
    menuSettings: null,
    menuExportFg: null,
    npcSelector: null,
    npcOptionsContainer: null,
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
    createBestiaryBtn: null,
    newBestiaryNameInput: null,
    bestiaryListDiv: null,
    manageGroupsBtn: null,
    manageGroupsModal: null,
    addGroupBtn: null,
    newGroupNameInput: null,
    groupListDiv: null,
    settingsOkBtn: null,
    manageLanguagesBtn: null,
    newLanguageNameInput: null,
    addLanguageBtn: null,
    languageListDiv: null,
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
    clearEditBtn: null,
    legendaryBoilerplate: null,
    lairBoilerplate: null,
    attackDamageDiceClearBtn: null,
    alertTitle: null,
    alertMessageText: null,
    alertOkBtn: null,
    alertCancelBtn: null,
    footerImportTextBtn: null,
    footerExportFgBtn: null,
    innateSpellcastingHeader: null,
    innateSpellcastingFields: null,
    innateDivider: null,
    spellcastingHeader: null,
    spellcastingFields: null,
    spellcastingDivider: null,
    actionSpellcastingFields: null,
    bestiarySettingsCheckboxes: {},
    npcSettingsCheckboxes: {},
    inputs: {},
    languageListboxes: [],

    // --- INITIALIZATION ---
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
        this.menuImportText = document.getElementById('menu-import-text');
        this.menuExportNpc = document.getElementById('menu-export-npc');
        this.menuDeleteNpc = document.getElementById('menu-delete-npc');
        this.menuSettings = document.getElementById('menu-settings');
        this.menuExportFg = document.getElementById('menu-export-fg');
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
        this.footerImportTextBtn = document.getElementById('footer-import-text-btn');
        this.footerExportFgBtn = document.getElementById('footer-export-fg-btn');
        this.innateSpellcastingHeader = document.getElementById('innate-spellcasting-header');
        this.innateSpellcastingFields = document.getElementById('innate-spellcasting-fields');
        this.innateDivider = document.getElementById('innate-divider');
        this.spellcastingHeader = document.getElementById('spellcasting-header');
        this.spellcastingFields = document.getElementById('spellcasting-fields');
        this.spellcastingDivider = document.getElementById('spellcasting-divider');
        this.actionSpellcastingFields = document.getElementById('action-spellcasting-fields');

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
            description: document.getElementById("npc-description"),
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
            hasInnateSpellcasting: document.getElementById('npc-has-innate-spellcasting'),
            innateIsPsionics: document.getElementById('npc-innate-is-psionics'),
            innateAbility: document.getElementById('npc-innate-ability'),
            innateDC: document.getElementById('npc-innate-dc'),
            // innateBonus: document.getElementById('npc-innate-bonus'), // REMOVED
            innateComponents: document.getElementById('npc-innate-components'),
            hasSpellcasting: document.getElementById('npc-has-spellcasting'),
            spellcastingToTraits: document.getElementById('npc-spellcasting-to-traits'),
            spellcastingToActions: document.getElementById('npc-spellcasting-to-actions'),
            actionCastingAbility: document.getElementById('npc-action-casting-ability'),
            actionCastingDC: document.getElementById('npc-action-casting-dc'),
            // actionCastingBonus: document.getElementById('npc-action-casting-bonus'), // REMOVED
            actionCastingComponents: document.getElementById('npc-action-casting-components'),
        };
        // Loop for Innate and Action casting freq/list fields
        for (let i = 0; i < 4; i++) {
            this.inputs[`innate-freq-${i}`] = document.getElementById(`npc-innate-freq-${i}`);
            this.inputs[`innate-list-${i}`] = document.getElementById(`npc-innate-list-${i}`);
            this.inputs[`action-casting-freq-${i}`] = document.getElementById(`npc-action-casting-freq-${i}`);
            this.inputs[`action-casting-list-${i}`] = document.getElementById(`npc-action-casting-list-${i}`);
        }

        this.languageListboxes = [
            document.getElementById('language-list-standard'),
            document.getElementById('language-list-exotic'),
            document.getElementById('language-list-monstrous1'),
            document.getElementById('language-list-monstrous2'),
            document.getElementById('language-list-user'),
        ];
        // --- End of element assignments ---

        // Call functions defined in ui-updates.js (they should be attached to 'this' by then)
        if (typeof this.populateChallengeDropdown === 'function') {
            this.populateChallengeDropdown();
        } else { console.error("populateChallengeDropdown not found on ui object"); }

        this.setupEventListeners(); // Call listener setup

        if (typeof this.updateUIForActiveBestiary === 'function') {
            this.updateUIForActiveBestiary();
        } else { console.error("updateUIForActiveBestiary not found on ui object"); }

        if (typeof this.populateDamageTypes === 'function') {
             this.populateDamageTypes('attack-damage-type');
        } else { console.error("populateDamageTypes not found on ui object"); }

        // --- Initial Card State Setup ---
        document.querySelectorAll('.card-body').forEach(cardBody => {
            cardBody.classList.add('open');
            cardBody.style.paddingTop = '0.5rem';
            cardBody.style.paddingBottom = '0.5rem';
             setTimeout(() => {
                cardBody.style.maxHeight = cardBody.scrollHeight + 'px';
                 cardBody.addEventListener('transitionend', function handler() {
                     if (cardBody.classList.contains('open')) {
                         cardBody.style.maxHeight = 'none';
                     }
                    cardBody.removeEventListener('transitionend', handler);
                }, { once: true });
            }, 50);
        });
    },

    // --- EVENT LISTENER SETUP ---
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
        if (this.menuExportFg) this.menuExportFg.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuExportFg.classList.contains('disabled')) window.app.exportBestiaryToFG(); this.mainMenu.classList.add('hidden'); });


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

        // --- Card Toggle Listener ---
        document.querySelectorAll('.card-header').forEach((header) => {
            header.addEventListener("click", (e) => {
                // Prevent toggle if clicking manage buttons inside header
                if (e.target.closest('#fantasy-grounds-group, #manage-groups-btn, #manage-languages-btn, #manage-traits-btn')) {
                    return;
                }
                const cardBody = header.nextElementSibling;
                if (cardBody && cardBody.classList.contains('card-body')) {
                    if (cardBody.classList.contains('open')) {
                        cardBody.style.maxHeight = cardBody.scrollHeight + 'px'; // Set current height explicitly
                        requestAnimationFrame(() => { // Allow browser to render current height
                            cardBody.classList.remove('open');
                            cardBody.style.maxHeight = '0';
                            cardBody.style.paddingTop = '0';
                            cardBody.style.paddingBottom = '0';
                        });
                    } else {
                        cardBody.classList.add('open');
                        cardBody.style.paddingTop = '0.5rem';
                        cardBody.style.paddingBottom = '0.5rem';
                        const scrollHeight = cardBody.scrollHeight; // Get full height
                        cardBody.style.maxHeight = scrollHeight + 'px'; // Set to full height for transition

                        // Use a transitionend listener to set maxHeight to 'none' after transition
                        cardBody.addEventListener('transitionend', function handler() {
                            if (cardBody.classList.contains('open')) { // Only if still open
                                cardBody.style.maxHeight = 'none'; // Allow content reflow
                            }
                            cardBody.removeEventListener('transitionend', handler); // Clean up listener
                        }, { once: true });
                    }
                }
            });
        });


        // Centralized input listener for most fields
        Object.values(this.inputs).forEach((input) => {
            if (input && input.id && input.id !== 'npc-description' && !input.id.startsWith('common-') && input.id !== 'attack-damage-dice') {
                 // Ability scores, challenge rating, innate/action ability dropdowns need extra recalc
                 if (['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'challenge'].includes(input.id.replace('npc-', '')) ||
                     input.id === 'npc-innate-ability' || input.id === 'npc-action-casting-ability') {
                     input.addEventListener("input", () => {
                         window.app.updateActiveNPCFromForm(); // Update NPC object first
                         this.updateInnateCalculatedFields(); // Recalculate Innate DC
                         this.updateActionCalculatedFields(); // Recalculate Action DC
                     });
                 } else {
                     // All other standard inputs just update the NPC object
                     input.addEventListener("input", window.app.updateActiveNPCFromForm);
                 }
            }
        });

        // Add listeners for spellcasting radio buttons
        if (this.inputs.spellcastingToTraits) {
            this.inputs.spellcastingToTraits.addEventListener('change', () => {
                if (this.inputs.spellcastingToTraits.checked) {
                    this.updateSpellcastingVisibility(); // Update UI
                    window.app.updateActiveNPCFromForm(); // Save the change
                }
            });
        }
        if (this.inputs.spellcastingToActions) {
            this.inputs.spellcastingToActions.addEventListener('change', () => {
                if (this.inputs.spellcastingToActions.checked) {
                    this.updateSpellcastingVisibility(); // Update UI
                    window.app.updateActiveNPCFromForm(); // Save the change
                }
            });
        }


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

        const trixEditor = document.querySelector("trix-editor");
        if (trixEditor) {
             trixEditor.addEventListener("trix-change", window.app.updateActiveNPCFromForm);
        }

        if (this.tokenBox) {
            this.tokenBox.addEventListener('click', () => window.app.activeNPC && this.tokenUpload && this.tokenUpload.click());
        }
        if (this.tokenUpload) {
            this.tokenUpload.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (window.app.activeNPC && file && (file.type === "image/png" || file.type === "image/webp")) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.app.activeNPC.token = e.target.result;
                        this.updateTokenDisplay(); // Use 'this'
                        window.app.saveActiveBestiaryToDB();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (this.imageBox) {
            this.imageBox.addEventListener('click', () => window.app.activeNPC && this.imageUpload && this.imageUpload.click());
        }
        if (this.imageUpload) {
            this.imageUpload.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (window.app.activeNPC && file && (file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg")) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.app.activeNPC.image = e.target.result;
                        this.updateImageDisplay(); // Use 'this'
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
                    this.parseHpStringToModal(); // Use 'this'
                    window.app.openModal('hp-modal');
                    if (this.hpDiceSelector && this.hpDiceString) {
                        window.app.createDiceSelector(this.hpDiceSelector, this.hpDiceString);
                    }
                }
            });
        }
        if (this.hpModalCloseBtn) {
            this.hpModalCloseBtn.addEventListener('click', () => {
                this.hideAllModals(); // Use 'this'
            });
        }
        if (this.hpApplyBtn) {
            this.hpApplyBtn.addEventListener('click', () => {
                if (!this.hpDiceString || !this.inputs.hitPoints) return;

                const diceString = this.hpDiceString.value.trim();
                if (!diceString) {
                    this.inputs.hitPoints.value = "";
                    window.app.updateActiveNPCFromForm();
                    this.hideAllModals(); // Use 'this'
                    return;
                }

                const match = diceString.match(/^(?:(\d+d\d+)(?:\s*([+-])\s*(\d+))?|([+-]?\d+))$/);

                if (match) {
                    let totalHp = 0;
                    let finalDiceString = "";

                    if (match[1]) {
                        const dicePart = match[1];
                        const sign = match[2];
                        const bonus = parseInt(match[3] || '0', 10);
                        const [numDice, dieType] = dicePart.split('d').map(Number);
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
                    } else if (match[4]) {
                        totalHp = parseInt(match[4], 10);
                        if (isNaN(totalHp)) {
                             window.app.showAlert("Invalid number format in Hit Dice.");
                            return;
                        }
                        finalDiceString = `${totalHp}`;
                    }

                    this.inputs.hitPoints.value = `${totalHp} (${finalDiceString})`;
                    window.app.updateActiveNPCFromForm();
                    this.hideAllModals(); // Use 'this'
                } else {
                     const simpleMatch = diceString.match(/^(\d+d\d+)\s+(\d+)$/);
                     if(simpleMatch) {
                        const dicePart = simpleMatch[1];
                        const bonus = parseInt(simpleMatch[2], 10);
                        const [numDice, dieType] = dicePart.split('d').map(Number);
                        if (isNaN(numDice) || isNaN(dieType) || dieType <= 0 || isNaN(bonus)) {
                            window.app.showAlert("Invalid dice format in Hit Dice.");
                            return;
                        }
                        const avgRoll = (dieType / 2) + 0.5;
                        let totalHp = Math.floor(numDice * avgRoll) + bonus;
                        let finalDiceString = `${numDice}d${dieType} + ${bonus}`;
                        this.inputs.hitPoints.value = `${totalHp} (${finalDiceString})`;
                        window.app.updateActiveNPCFromForm();
                        this.hideAllModals(); // Use 'this'
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

        if (this.footerImportTextBtn) {
            this.footerImportTextBtn.addEventListener('click', () => {
                if (!this.footerImportTextBtn.disabled) {
                    window.importer.openImportModal();
                }
            });
        }
        if (this.footerExportFgBtn) {
            this.footerExportFgBtn.addEventListener('click', () => {
                if (!this.footerExportFgBtn.disabled) {
                    window.app.exportBestiaryToFG();
                }
            });
        }

        // Call setup functions defined in ui-updates.js (they should be on 'this')
        if (typeof this.setupCustomToggles === 'function') this.setupCustomToggles();
        if (typeof this.setupSavingThrowListeners === 'function') this.setupSavingThrowListeners();
        if (typeof this.setupSkillListeners === 'function') this.setupSkillListeners();
        if (typeof this.setupResistanceListeners === 'function') this.setupResistanceListeners();
        if (typeof this.setupWeaponModifierListeners === 'function') this.setupWeaponModifierListeners();
        if (typeof this.setupConditionImmunityListeners === 'function') this.setupConditionImmunityListeners();
        if (typeof this.setupLanguageListeners === 'function') this.setupLanguageListeners();
        if (typeof this.setupTraitListeners === 'function') this.setupTraitListeners();
        if (typeof this.setupActionListeners === 'function') this.setupActionListeners();
    },

    // Placeholder for methods defined in ui-updates.js
    // These will be overwritten when ui-updates.js loads
    updateUIForActiveBestiary: () => console.warn("ui-updates.js not loaded yet"),
    updateNpcSelector: () => console.warn("ui-updates.js not loaded yet"),
    populateLanguageListbox: () => console.warn("ui-updates.js not loaded yet"),
    updateFormFromActiveNPC: () => console.warn("ui-updates.js not loaded yet"),
    updateSpellcastingVisibility: () => console.warn("ui-updates.js not loaded yet"),
    updateStatDisplays: () => console.warn("ui-updates.js not loaded yet"),
    updateSkillDisplays: () => console.warn("ui-updates.js not loaded yet"),
    updateTokenDisplay: () => console.warn("ui-updates.js not loaded yet"),
    updateImageDisplay: () => console.warn("ui-updates.js not loaded yet"),
    populateChallengeDropdown: () => console.warn("ui-updates.js not loaded yet"),
    setupCustomToggles: () => console.warn("ui-updates.js not loaded yet"),
    setupSavingThrowListeners: () => console.warn("ui-updates.js not loaded yet"),
    setupSkillListeners: () => console.warn("ui-updates.js not loaded yet"),
    setupResistanceListeners: () => console.warn("ui-updates.js not loaded yet"),
    setupWeaponModifierListeners: () => console.warn("ui-updates.js not loaded yet"),
    setupConditionImmunityListeners: () => console.warn("ui-updates.js not loaded yet"),
    setupLanguageListeners: () => console.warn("ui-updates.js not loaded yet"),
    setupTraitListeners: () => console.warn("ui-updates.js not loaded yet"),
    setupActionListeners: () => console.warn("ui-updates.js not loaded yet"),
    setupDragAndDrop: () => console.warn("ui-updates.js not loaded yet"),
    showNewBestiaryModal: () => console.warn("ui-updates.js not loaded yet"),
    hideAllModals: () => console.warn("ui-updates.js not loaded yet"),
    updateMenuState: () => console.warn("ui-updates.js not loaded yet"),
    showLoadBestiaryModal: () => console.warn("ui-updates.js not loaded yet"),
    showManageGroupsModal: () => console.warn("ui-updates.js not loaded yet"),
    showSettingsModal: () => console.warn("ui-updates.js not loaded yet"),
    deleteGroup: () => console.warn("ui-updates.js not loaded yet"),
    addNewGroup: () => console.warn("ui-updates.js not loaded yet"),
    showManageLanguagesModal: () => console.warn("ui-updates.js not loaded yet"),
    addNewLanguage: () => console.warn("ui-updates.js not loaded yet"),
    deleteLanguage: () => console.warn("ui-updates.js not loaded yet"),
    addOrUpdateNpcTrait: () => console.warn("ui-updates.js not loaded yet"),
    renderNpcTraits: () => console.warn("ui-updates.js not loaded yet"),
    renderActions: () => console.warn("ui-updates.js not loaded yet"),
    deleteAction: () => console.warn("ui-updates.js not loaded yet"),
    populateSavedTraitsDatalist: () => console.warn("ui-updates.js not loaded yet"),
    showManageTraitsModal: () => console.warn("ui-updates.js not loaded yet"),
    addNewSavedTrait: () => console.warn("ui-updates.js not loaded yet"),
    deleteSavedTrait: () => console.warn("ui-updates.js not loaded yet"),
    parseHpStringToModal: () => console.warn("ui-updates.js not loaded yet"),
    populateDamageTypes: () => console.warn("ui-updates.js not loaded yet"),
    updateInnateCalculatedFields: () => console.warn("ui-updates.js not loaded yet"),
    updateActionCalculatedFields: () => console.warn("ui-updates.js not loaded yet")
};