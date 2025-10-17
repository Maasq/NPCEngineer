window.ui = {
    // --- UI ELEMENTS ---
	mainContentColumn: document.getElementById('main-content-column'),
	viewport: document.getElementById("viewport"),
	bestiaryStatusEl: document.getElementById("bestiary-status"),
	
	// Bestiary Buttons
	newBestiaryBtn: document.getElementById("newBestiaryBtn"),
	loadBestiaryBtn: document.getElementById("loadBestiaryBtn"),
	exportBestiaryBtn: document.getElementById("exportBestiaryBtn"),
	importBestiaryBtn: document.getElementById("importBestiaryBtn"),

	// NPC Buttons
	newNpcBtn: document.getElementById("newNpcBtn"),
	duplicateNpcBtn: document.getElementById("duplicateNpcBtn"),
	importNpcBtn: document.getElementById("importNpcBtn"),
	exportNpcBtn: document.getElementById("exportNpcBtn"),
	deleteNpcBtn: document.getElementById("deleteNpcBtn"),
	
	// Menu Items
	hamburgerBtn: document.getElementById('hamburger-btn'),
	mainMenu: document.getElementById('main-menu'),
	menuNewBestiary: document.getElementById('menu-new-bestiary'),
	menuLoadBestiary: document.getElementById('menu-load-bestiary'),
	menuImportBestiary: document.getElementById('menu-import-bestiary'),
	menuExportBestiary: document.getElementById('menu-export-bestiary'),
	menuNewNpc: document.getElementById('menu-new-npc'),
	menuDuplicateNpc: document.getElementById('menu-duplicate-npc'),
	menuImportNpc: document.getElementById('menu-import-npc'),
	menuExportNpc: document.getElementById('menu-export-npc'),
	menuDeleteNpc: document.getElementById('menu-delete-npc'),
	menuSettings: document.getElementById('menu-settings'),


	// NPC Selector
	npcSelector: document.getElementById("npc-selector"),
	npcOptionsContainer: document.getElementById('npc-options-container'),

	// Modals & Overlays
	modalOverlay: document.getElementById("modal-overlay"),
	newBestiaryModal: document.getElementById("new-bestiary-modal"),
	loadBestiaryModal: document.getElementById("load-bestiary-modal"),
	hpModal: document.getElementById("hp-modal"),
	settingsModal: document.getElementById('settings-modal'),
	manageLanguagesModal: document.getElementById('manage-languages-modal'),
	manageTraitsModal: document.getElementById('manage-traits-modal'),

	// Modal-specific elements
	createBestiaryBtn: document.getElementById("create-bestiary-btn"),
	newBestiaryNameInput: document.getElementById("new-bestiary-name"),
	bestiaryListDiv: document.getElementById("bestiary-list"),
	manageGroupsBtn: document.getElementById('manage-groups-btn'),
	manageGroupsModal: document.getElementById('manage-groups-modal'),
	addGroupBtn: document.getElementById('add-group-btn'),
	newGroupNameInput: document.getElementById('new-group-name'),
	groupListDiv: document.getElementById('group-list'),
	settingsOkBtn: document.getElementById('settings-ok-btn'),
	
	// Language Modal Elements
	manageLanguagesBtn: document.getElementById('manage-languages-btn'),
	newLanguageNameInput: document.getElementById('new-language-name'),
	addLanguageBtn: document.getElementById('add-language-btn'),
	languageListDiv: document.getElementById('language-list-div'),

	// Trait Elements
	manageTraitsBtn: document.getElementById('manage-traits-btn'),
	npcTraitList: document.getElementById('npc-trait-list'),
	newTraitName: document.getElementById('new-trait-name'),
	savedTraitList: document.getElementById('saved-trait-list'),
	newTraitDescription: document.getElementById('new-trait-description'),
	addTraitBtn: document.getElementById('add-trait-btn'),
	modalTraitName: document.getElementById('modal-trait-name'),
	modalTraitDescription: document.getElementById('modal-trait-description'),
	modalTokenButtons: document.getElementById('modal-token-buttons'),
	addManagedTraitBtn: document.getElementById('add-managed-trait-btn'),
	managedTraitListDiv: document.getElementById('managed-trait-list-div'),
	sortTraitsAlphaCheckbox: document.getElementById('sort-traits-alpha'),
	
	tokenBox: document.getElementById("npc-token"),
	tokenUpload: document.getElementById("token-upload"),
	imageBox: document.getElementById("npc-image"),
	imageUpload: document.getElementById("image-upload"),

	hpModalCloseBtn: document.getElementById("hp-modal-close"),
	hpApplyBtn: document.getElementById("hp-apply-btn"),
	numDiceInput: document.getElementById("hp-num-dice"),
	dieTypeSelect: document.getElementById("hp-die-type"),
	bonusInput: document.getElementById("hp-bonus"),
	experienceDisplay: document.getElementById("npc-experience-display"),
	proficiencyBonusDisplay: document.getElementById("npc-proficiency-bonus-display"),

	// Settings Checkboxes
	bestiarySettingsCheckboxes: {
		addDescription: document.getElementById('bestiary-add-description'),
		addTitle: document.getElementById('bestiary-add-title'),
		addImageLink: document.getElementById('bestiary-add-image-link'),
		useDropCap: document.getElementById('bestiary-use-drop-cap'),
	},
	npcSettingsCheckboxes: {
		addDescription: document.getElementById('npc-add-description'),
		addTitle: document.getElementById('npc-add-title'),
		addImageLink: document.getElementById('npc-add-image-link'),
		useDropCap: document.getElementById('npc-use-drop-cap'),
	},

	// --- FORM INPUTS ---
	inputs: {
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
	},
	
	// --- Language Listbox references ---
	languageListboxes: [
		document.getElementById('language-list-standard'),
		document.getElementById('language-list-exotic'),
		document.getElementById('language-list-monstrous1'),
		document.getElementById('language-list-monstrous2'),
		document.getElementById('language-list-user'),
	],
    init: function() {
        this.populateChallengeDropdown();
        this.setupEventListeners();
        this.updateUIForActiveBestiary();
        document.querySelectorAll('.card-body').forEach(cardBody => {
            cardBody.classList.add('open');
            cardBody.style.paddingTop = '0.5rem';
            cardBody.style.paddingBottom = '0.5rem';
        });
    },

    setupEventListeners: function() {
        this.newBestiaryBtn.addEventListener('click', this.showNewBestiaryModal.bind(this));
        this.loadBestiaryBtn.addEventListener('click', this.showLoadBestiaryModal.bind(this));
        this.importBestiaryBtn.addEventListener('click', window.app.importBestiary);
        this.exportBestiaryBtn.addEventListener('click', window.app.exportBestiary);
        this.newNpcBtn.addEventListener("click", window.app.createNewNpc);
        this.duplicateNpcBtn.addEventListener("click", window.app.duplicateCurrentNpc);
        this.importNpcBtn.addEventListener("click", window.app.importNpc);
        this.exportNpcBtn.addEventListener("click", window.app.exportNpc);
        this.deleteNpcBtn.addEventListener('click', window.app.deleteCurrentNpc);

        this.menuNewBestiary.addEventListener('click', (e) => { e.preventDefault(); this.showNewBestiaryModal(); this.mainMenu.classList.add('hidden'); });
        this.menuLoadBestiary.addEventListener('click', (e) => { e.preventDefault(); this.showLoadBestiaryModal(); this.mainMenu.classList.add('hidden'); });
        this.menuImportBestiary.addEventListener('click', (e) => { e.preventDefault(); window.app.importBestiary(); this.mainMenu.classList.add('hidden'); });
        this.menuExportBestiary.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuExportBestiary.classList.contains('disabled')) window.app.exportBestiary(); this.mainMenu.classList.add('hidden'); });
        this.menuNewNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuNewNpc.classList.contains('disabled')) window.app.createNewNpc(); this.mainMenu.classList.add('hidden'); });
        this.menuDuplicateNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuDuplicateNpc.classList.contains('disabled')) window.app.duplicateCurrentNpc(); this.mainMenu.classList.add('hidden'); });
        this.menuImportNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuImportNpc.classList.contains('disabled')) window.app.importNpc(); this.mainMenu.classList.add('hidden'); });
        this.menuExportNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuExportNpc.classList.contains('disabled')) window.app.exportNpc(); this.mainMenu.classList.add('hidden'); });
        this.menuDeleteNpc.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuDeleteNpc.classList.contains('disabled')) window.app.deleteCurrentNpc(); this.mainMenu.classList.add('hidden'); });
        this.menuSettings.addEventListener('click', (e) => { e.preventDefault(); if(!this.menuSettings.classList.contains('disabled')) this.showSettingsModal(); this.mainMenu.classList.add('hidden'); });

        this.hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.mainMenu.classList.toggle('hidden');
        });

        window.addEventListener('click', (e) => {
            if (!this.mainMenu.classList.contains('hidden') && !this.hamburgerBtn.contains(e.target)) {
                this.mainMenu.classList.add('hidden');
            }
        });

        this.createBestiaryBtn.addEventListener('click', window.app.createNewBestiary);
        this.newBestiaryNameInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.createBestiaryBtn.click();
        });
        this.manageGroupsBtn.addEventListener('click', this.showManageGroupsModal.bind(this));
        this.addGroupBtn.addEventListener('click', this.addNewGroup.bind(this));
        this.newGroupNameInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.addNewGroup();
            }
        });
        this.settingsOkBtn.addEventListener('click', this.hideAllModals.bind(this));

        this.npcSelector.addEventListener('change', (e) => {
            const newIndex = parseInt(e.target.value, 10);
            if (newIndex !== window.app.activeNPCIndex) {
                window.app.switchActiveNPC(newIndex);
            }
        });

        document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', this.hideAllModals.bind(this)));
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.hideAllModals();
        });

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
            if(input.id !== 'npc-description') {
                input.addEventListener("input", window.app.updateActiveNPCFromForm);
            }
        });
        
        this.inputs.name.addEventListener('blur', () => {
            if (window.app.activeBestiary) {
                window.app.sortAndSwitchToNpc(window.app.activeNPC);
            }
        });

        for (const key in this.bestiarySettingsCheckboxes) {
            this.bestiarySettingsCheckboxes[key].addEventListener('input', () => {
                if (window.app.activeBestiary) {
                    window.app.activeBestiary.metadata[key] = this.bestiarySettingsCheckboxes[key].checked;
                    window.app.saveActiveBestiaryToDB();
                }
            });
        }
        for (const key in this.npcSettingsCheckboxes) {
            this.npcSettingsCheckboxes[key].addEventListener('input', () => {
                if (window.app.activeNPC) {
                    window.app.activeNPC[key] = this.npcSettingsCheckboxes[key].checked;
                    window.viewport.updateViewport();
                    window.app.saveActiveBestiaryToDB();
                }
            });
        }

        this.inputs.challenge.addEventListener('change', () => {
            const selectedCr = this.inputs.challenge.value;
            this.experienceDisplay.textContent = window.app.crToXpMap[selectedCr] || '';
            const profBonus = window.app.calculateProficiencyBonus(selectedCr);
            this.proficiencyBonusDisplay.textContent = `+${profBonus}`;
            window.app.updateActiveNPCFromForm();
        });

        document.querySelector("trix-editor").addEventListener("trix-change", window.app.updateActiveNPCFromForm);

        this.tokenBox.addEventListener('click', () => window.app.activeNPC && this.tokenUpload.click());
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

        this.imageBox.addEventListener('click', () => window.app.activeNPC && this.imageUpload.click());
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

        this.setupDragAndDrop(this.tokenBox, ["image/png","image/webp"], "token", this.updateTokenDisplay.bind(this));
        this.setupDragAndDrop(this.imageBox, ["image/png","image/webp","image/jpeg"], "image", this.updateImageDisplay.bind(this));
        
        this.inputs.hitPoints.addEventListener('dblclick', () => {
            if (window.app.activeNPC) {
                this.parseHpStringToModal();
                this.modalOverlay.classList.remove('hidden');
                this.hpModal.classList.remove('hidden');
            }
        });
        this.hpModalCloseBtn.addEventListener('click', () => {
            this.hideAllModals();
        });
        this.hpApplyBtn.addEventListener('click', () => {
            const numDice = parseInt(this.numDiceInput.value, 10) || 0;
            const dieType = parseInt(this.dieTypeSelect.value, 10) || 0;
            const bonus = parseInt(this.bonusInput.value, 10) || 0;
            if (numDice > 0 && dieType > 0) {
                const avgRoll = (dieType / 2) + 0.5;
                const totalHp = Math.floor(numDice * avgRoll) + bonus;
                let bonusString = "";
                if (bonus > 0) { bonusString = ` + ${bonus}`; }
                else if (bonus < 0) { bonusString = ` - ${Math.abs(bonus)}`; }
                const hpString = `${totalHp} (${numDice}d${dieType}${bonusString})`;
                this.inputs.hitPoints.value = hpString;
                window.app.updateActiveNPCFromForm();
                this.hideAllModals();
            }
        });

        this.setupCustomToggles();
        this.setupSavingThrowListeners();
        this.setupSkillListeners();
        this.setupResistanceListeners();
        this.setupWeaponModifierListeners();
        this.setupConditionImmunityListeners();
        this.setupLanguageListeners();
        this.setupTraitListeners();
    },
    showNewBestiaryModal: function() {
        this.modalOverlay.classList.remove('hidden');
        this.newBestiaryModal.classList.remove('hidden');
        this.newBestiaryNameInput.focus();
    },
    hideAllModals: function() {
        this.modalOverlay.classList.add('hidden');
		this.newBestiaryModal.classList.add('hidden');
		this.loadBestiaryModal.classList.add('hidden');
		this.hpModal.classList.add('hidden');
		this.manageGroupsModal.classList.add('hidden');
		this.settingsModal.classList.add('hidden');
		this.manageLanguagesModal.classList.add('hidden');
		this.manageTraitsModal.classList.add('hidden');
    },
    updateMenuState: function() {
		const hasActiveBestiary = !!window.app.activeBestiary;
		const menuItemsToToggle = [
			this.menuExportBestiary, this.menuNewNpc, this.menuDuplicateNpc, this.menuImportNpc,
			this.menuExportNpc, this.menuDeleteNpc, this.menuSettings
		];

		menuItemsToToggle.forEach(item => {
			if (hasActiveBestiary) {
				item.classList.remove('disabled');
			} else {
				item.classList.add('disabled');
			}
		});
		
		if (hasActiveBestiary && window.app.activeBestiary.npcs.length <= 1) {
			this.menuDeleteNpc.classList.add('disabled');
		}
	},

	updateUIForActiveBestiary: function() {
		if (window.app.activeBestiary) {
			this.bestiaryStatusEl.innerHTML = `Bestiary: <span class="font-bold text-red-700">${window.app.activeBestiary.projectName} (${window.app.activeBestiary.npcs.length} NPCs)</span>`;
			this.mainContentColumn.style.opacity = '1';
			this.mainContentColumn.style.pointerEvents = 'auto';
			this.npcSelector.classList.remove('hidden');
			this.deleteNpcBtn.classList.remove('hidden');
			this.npcOptionsContainer.classList.remove('hidden');
			[this.newNpcBtn, this.duplicateNpcBtn, this.importNpcBtn, this.exportNpcBtn, this.deleteNpcBtn].forEach(btn => btn.disabled = false);
		} else {
			this.bestiaryStatusEl.textContent = "No Bestiary Loaded";
			this.mainContentColumn.style.opacity = '0.3';
			this.mainContentColumn.style.pointerEvents = 'none';
			this.npcSelector.classList.add('hidden');
			this.deleteNpcBtn.classList.add('hidden');
			this.npcOptionsContainer.classList.add('hidden');
			[this.newNpcBtn, this.duplicateNpcBtn, this.importNpcBtn, this.exportNpcBtn, this.deleteNpcBtn].forEach(btn => btn.disabled = true);
		}
		this.updateMenuState();
		this.updateFormFromActiveNPC();
	},
	
	updateNpcSelector: function() {
		if (!window.app.activeBestiary) return;
		
		this.npcSelector.innerHTML = '';
		
		window.app.activeBestiary.npcs.forEach((npc, index) => {
			const option = document.createElement('option');
			option.value = index;
			option.textContent = npc.name;
			if (index === window.app.activeNPCIndex) {
				option.selected = true;
			}
			this.npcSelector.appendChild(option);
		});

		this.deleteNpcBtn.disabled = window.app.activeBestiary.npcs.length <= 1;
	},
    populateLanguageListbox: function(listboxId, languageArray, selectedLanguages) {
		const listbox = document.getElementById(listboxId);
		if (!listbox) return;
		listbox.innerHTML = '';
		languageArray.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

		languageArray.forEach(lang => {
			const option = document.createElement('option');
			option.value = lang;
			option.textContent = lang;
			option.selected = (selectedLanguages || []).includes(lang);
			listbox.appendChild(option);
		});
	},
    updateFormFromActiveNPC: function() {
		window.app.isUpdatingForm = true;
		try {
			if (!window.app.activeNPC) {
				Object.values(this.inputs).forEach(input => {
					if (input.type === 'checkbox') input.checked = false;
					else input.value = '';
				});
				document.querySelector("trix-editor").editor.loadHTML("");
				this.viewport.innerHTML = '';
				this.updateNpcSelector();
				this.npcTraitList.innerHTML = ''; // Clear traits
				this.savedTraitList.innerHTML = ''; // Clear datalist
				return;
			}

			for (const key in this.inputs) {
				if (key === 'description') {
					const trixEditorElement = document.querySelector("trix-editor");
					this.inputs.description.value = window.app.activeNPC[key] || '';
					if (trixEditorElement && trixEditorElement.editor) {
						trixEditorElement.editor.loadHTML(window.app.activeNPC[key] || "");
					}
					continue;
				}
				const element = this.inputs[key];
				const customToggle = document.getElementById(`toggle-custom-${key}`);
				if (customToggle) {
					const select = element;
					const customInput = document.getElementById(`npc-${key}-custom`);
					const npcValue = window.app.activeNPC[key] || "";
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
					element.checked = window.app.activeNPC[key] || false;
				} else {
					element.value = window.app.activeNPC[key] || "";
				}
			}
			// --- Language section update (Phase 1) ---
			const selectedLangs = window.app.activeNPC.selectedLanguages || [];
			this.populateLanguageListbox('language-list-standard', window.app.standardLanguages, selectedLangs);
			this.populateLanguageListbox('language-list-exotic', window.app.exoticLanguages, selectedLangs);
			this.populateLanguageListbox('language-list-monstrous1', window.app.monstrousLanguages1, selectedLangs);
			this.populateLanguageListbox('language-list-monstrous2', window.app.monstrousLanguages2, selectedLangs);
			this.populateLanguageListbox('language-list-user', window.app.activeBestiary.metadata.userDefinedLanguages || [], selectedLangs);
			
			const telepathyCheckbox = document.getElementById('npc-has-telepathy');
			if (telepathyCheckbox) telepathyCheckbox.checked = window.app.activeNPC.hasTelepathy || false;
			const telepathyRangeInput = document.getElementById('npc-telepathy-range');
			if (telepathyRangeInput) telepathyRangeInput.value = window.app.activeNPC.telepathyRange || 0;
			const specialOptionSelect = document.getElementById('npc-special-language-option');
			if (specialOptionSelect) specialOptionSelect.value = window.app.activeNPC.specialLanguageOption || 0;
			// --- End language section ---

			this.populateSavedTraitsDatalist();
			this.sortTraitsAlphaCheckbox.checked = window.app.activeNPC.sortTraitsAlpha ?? true;
			this.renderNpcTraits();
			this.newTraitName.value = '';
			this.newTraitDescription.value = '';

			for (const key in this.npcSettingsCheckboxes) {
				this.npcSettingsCheckboxes[key].checked = window.app.activeNPC[key];
			}

			const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
			abilities.forEach(ability => {
				document.getElementById(`npc-${ability}-saving-throw-prof`).checked = window.app.activeNPC[`${ability}SavingThrowProf`] || false;
				document.getElementById(`npc-${ability}-saving-throw-adjust`).value = window.app.activeNPC[`${ability}SavingThrowAdjust`] || 0;
			});
			
			window.app.skills.forEach(skill => {
                document.getElementById(`skill-${skill.id}-prof`).checked = window.app.activeNPC[`skill_${skill.id}_prof`] || false;
                document.getElementById(`skill-${skill.id}-exp`).checked = window.app.activeNPC[`skill_${skill.id}_exp`] || false;
                document.getElementById(`skill-${skill.id}-adjust`).value = window.app.activeNPC[`skill_${skill.id}_adjust`] || 0;
            });
			
			window.app.damageTypes.forEach(type => {
				document.getElementById(`vuln-${type}`).checked = window.app.activeNPC[`vulnerability_${type}`] || false;
				document.getElementById(`res-${type}`).checked = window.app.activeNPC[`resistance_${type}`] || false;
				document.getElementById(`imm-${type}`).checked = window.app.activeNPC[`immunity_${type}`] || false;
			});
			
			window.app.conditions.forEach(condition => {
				document.getElementById(`ci-${condition}`).checked = window.app.activeNPC[`ci_${condition}`] || false;
			});

			const weaponResValue = window.app.activeNPC.weaponResistance || 'none';
			const weaponResRadio = document.querySelector(`input[name="weapon-resistance"][value="${weaponResValue}"]`);
			if (weaponResRadio) {
				weaponResRadio.checked = true;
			} else { 
				document.getElementById('wr-none').checked = true;
			}
			
			const weaponImmValue = window.app.activeNPC.weaponImmunity || 'none';
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
			bestiaryOption.value = window.app.activeBestiary.projectName;
			bestiaryOption.textContent = window.app.activeBestiary.projectName;
			fgGroupDropdown.appendChild(bestiaryOption);
			(window.app.activeBestiary.metadata.fg_groups || []).forEach(group => {
				const groupOption = document.createElement('option');
				groupOption.value = group;
				groupOption.textContent = group;
				fgGroupDropdown.appendChild(groupOption);
			});
			fgGroupDropdown.value = window.app.activeNPC.fg_group || window.app.activeBestiary.projectName;

			this.experienceDisplay.textContent = window.app.activeNPC.experience || '';
			this.proficiencyBonusDisplay.textContent = `+${window.app.activeNPC.proficiencyBonus}` || '+2';
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
		if (!window.app.activeNPC) return;
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		const profBonus = window.app.activeNPC.proficiencyBonus || 2;

		abilities.forEach(ability => {
			// Update bonus display
			const bonus = window.app.activeNPC[`${ability}Bonus`] || 0;
			const bonusEl = document.getElementById(`npc-${ability}-bonus`);
			if (bonusEl) {
				bonusEl.textContent = bonus >= 0 ? `+${bonus}` : bonus;
			}

			// Update saving throw total display
			const base = bonus;
			const isProficient = window.app.activeNPC[`${ability}SavingThrowProf`] || false;
			const adjust = window.app.activeNPC[`${ability}SavingThrowAdjust`] || 0;
			const total = base + (isProficient ? profBonus : 0) + adjust;
			const totalEl = document.getElementById(`npc-${ability}-saving-throw-total`);
			totalEl.textContent = total >= 0 ? `+${total}` : total;
		});
		
		this.updateSkillDisplays();
		
		document.getElementById('npc-passive-perception').textContent = window.app.activeNPC.passivePerception || 10;
	},
	
	updateSkillDisplays: function() {
        if (!window.app.activeNPC) return;
        const profBonus = window.app.activeNPC.proficiencyBonus || 2;

        window.app.skills.forEach(skill => {
            const totalEl = document.getElementById(`skill-${skill.id}-total`);
            if (totalEl) {
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
		window.app.challengeOrder.forEach(cr => {
			const option = document.createElement('option');
			option.value = cr;
			option.textContent = cr;
			challengeSelect.appendChild(option);
		});
	},

	setupCustomToggles: function() {
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
					window.app.updateActiveNPCFromForm();
				});
				customInput.addEventListener('input', window.app.updateActiveNPCFromForm);
			}
		});
	},
	
	setupSavingThrowListeners: function() {
		const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
		abilities.forEach(ability => {
			document.getElementById(`npc-${ability}-saving-throw-prof`).addEventListener('input', window.app.updateActiveNPCFromForm);
			document.getElementById(`npc-${ability}-saving-throw-adjust`).addEventListener('input', window.app.updateActiveNPCFromForm);
		});
	},
	
	setupSkillListeners: function() {
        document.querySelectorAll('.skill-row').forEach(row => {
            const profCheckbox = row.querySelector('.skill-prof');
            const expCheckbox = row.querySelector('.skill-exp');
            const adjustInput = row.querySelector('.skill-adjust');

            profCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);
            adjustInput.addEventListener('input', window.app.updateActiveNPCFromForm);

            expCheckbox.addEventListener('input', () => {
                if (expCheckbox.checked) {
                    profCheckbox.checked = true;
                }
                window.app.updateActiveNPCFromForm();
            });
        });
    },
	
	setupResistanceListeners: function() {
		window.app.damageTypes.forEach(type => {
			const vulnCheckbox = document.getElementById(`vuln-${type}`);
			const resCheckbox = document.getElementById(`res-${type}`);
			const immCheckbox = document.getElementById(`imm-${type}`);

			vulnCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);

			resCheckbox.addEventListener('input', () => {
				if (resCheckbox.checked) {
					immCheckbox.checked = false;
				}
				window.app.updateActiveNPCFromForm(); // Update data model after any change
			});

			immCheckbox.addEventListener('input', () => {
				if (immCheckbox.checked) {
					resCheckbox.checked = false;
				}
				window.app.updateActiveNPCFromForm(); // Update data model after any change
			});
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
			document.getElementById(`ci-${condition}`).addEventListener('input', window.app.updateActiveNPCFromForm);
		});
	},
    setupLanguageListeners: function() {
		// 1. Add listeners to all five listboxes
		this.languageListboxes.forEach(listbox => {
			// Using 'change' is appropriate for <select multiple>
			listbox.addEventListener('change', window.app.updateActiveNPCFromForm); 
		});
		// 2. Add listeners to telepathy inputs
		document.getElementById('npc-has-telepathy').addEventListener('input', window.app.updateActiveNPCFromForm);
		document.getElementById('npc-telepathy-range').addEventListener('input', window.app.updateActiveNPCFromForm);
		document.getElementById('npc-special-language-option').addEventListener('input', window.app.updateActiveNPCFromForm);
		
		// 3. Setup modal button listener
		this.manageLanguagesBtn.addEventListener('click', this.showManageLanguagesModal.bind(this));
		this.addLanguageBtn.addEventListener('click', this.addNewLanguage.bind(this));
		this.newLanguageNameInput.addEventListener('keyup', (e) => {
			if (e.key === 'Enter') {
				this.addNewLanguage();
			}
		});
	},
	setupTraitListeners: function() {
        this.addTraitBtn.addEventListener('click', this.addOrUpdateNpcTrait.bind(this));
        this.manageTraitsBtn.addEventListener('click', this.showManageTraitsModal.bind(this));
        this.addManagedTraitBtn.addEventListener('click', this.addNewSavedTrait.bind(this));

		this.sortTraitsAlphaCheckbox.addEventListener('input', () => {
			if (window.app.activeNPC) {
				window.app.activeNPC.sortTraitsAlpha = this.sortTraitsAlphaCheckbox.checked;
				this.renderNpcTraits(); // Re-render the UI list
				window.viewport.updateViewport(); // Re-render the viewport
				window.app.saveActiveBestiaryToDB(); // Save the new state
			}
		});
		// Listener to auto-fill description when a saved trait is selected from the datalist
        this.newTraitName.addEventListener('input', (e) => {
            const traitName = e.target.value;
            const savedTraits = window.app.activeBestiary?.metadata?.savedTraits || [];
            const matchedTrait = savedTraits.find(t => t.name === traitName);
            if (matchedTrait) {
                this.newTraitDescription.value = matchedTrait.description;
            }
        });

        this.modalTokenButtons.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-token]');
            if (!button) return;
			e.preventDefault();

            const baseToken = button.dataset.token;
            let finalToken;

            if (e.shiftKey) {
                // Capitalize the token: {he} -> {He}
                finalToken = `{${baseToken.charAt(1).toUpperCase()}${baseToken.slice(2)}`;
            } else {
                finalToken = baseToken;
            }

            const textarea = this.modalTraitDescription;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;

            textarea.value = text.substring(0, start) + finalToken + text.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + finalToken.length;
            textarea.focus();
        });
    },
    setupDragAndDrop: function(box, validTypes, npcKey, updateFn) {
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
			const file = e.dataTransfer.files && e.dataTransfer.files[0];
			if (file && validTypes.includes(file.type)) {
				const reader = new FileReader();
				reader.onload = ev => {
					window.app.activeNPC[npcKey] = ev.target.result;
					updateFn();
					window.app.saveActiveBestiaryToDB();
				};
				reader.readAsDataURL(file);
			} else {
				console.warn("Invalid file type dropped.");
			}
		});
	},
    showLoadBestiaryModal: async function() {
		const bestiaries = await window.app.db.projects.toArray();
		this.bestiaryListDiv.innerHTML = ''; // Clear previous list
		if (bestiaries.length === 0) {
			this.bestiaryListDiv.innerHTML = '<p class="text-gray-500">No bestiaries found.</p>';
		} else {
			bestiaries.forEach(proj => {
				const projEl = document.createElement('div');
				projEl.className = 'flex justify-between items-center py-1 px-2 border rounded-md hover:bg-gray-100';

				const nameSpan = document.createElement('span');
				nameSpan.textContent = proj.projectName;
				nameSpan.className = 'cursor-pointer flex-grow';
				nameSpan.onclick = () => {
					window.app.loadBestiary(proj);
					this.hideAllModals();
				};

				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700"><use href="#icon-trash"></use></svg>`;
				deleteBtn.className = 'p-1';
				deleteBtn.title = `Delete ${proj.projectName}`;
				deleteBtn.onclick = async (e) => {
					e.stopPropagation();
					await window.app.db.projects.delete(proj.id);
					if(window.app.activeBestiary && window.app.activeBestiary.id === proj.id) {
						window.app.activeBestiary = null;
						window.app.activeNPC = null;
						window.app.activeNPCIndex = -1;
						this.updateUIForActiveBestiary();
					}
					this.showLoadBestiaryModal(); // Refresh list
				};
				
				projEl.appendChild(nameSpan);
				projEl.appendChild(deleteBtn);
				this.bestiaryListDiv.appendChild(projEl);
			});
		}
		this.modalOverlay.classList.remove('hidden');
		this.loadBestiaryModal.classList.remove('hidden');
	},
	
	showManageGroupsModal: async function() {
		if (!window.app.activeBestiary) return;
		this.groupListDiv.innerHTML = '';

		const groups = window.app.activeBestiary.metadata.fg_groups || [];
		if (groups.length === 0) {
			this.groupListDiv.innerHTML = '<p class="text-gray-500 text-center">No custom groups created.</p>';
		} else {
			groups.forEach(groupName => {
				const groupEl = document.createElement('div');
				groupEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = groupName;
				
				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700"><use href="#icon-trash"></use></svg>`;
				deleteBtn.className = 'p-1 delete-group-btn';
				deleteBtn.title = `Delete group: ${groupName}`;
				deleteBtn.onclick = (e) => {
					e.stopPropagation();
					this.deleteGroup(groupName);
				};

				groupEl.appendChild(nameSpan);
				groupEl.appendChild(deleteBtn);
				this.groupListDiv.appendChild(groupEl);
			});
		}
		this.modalOverlay.classList.remove('hidden');
		this.manageGroupsModal.classList.remove('hidden');
	},

	showSettingsModal: function() {
		if (!window.app.activeBestiary) return;

		for (const key in this.bestiarySettingsCheckboxes) {
			this.bestiarySettingsCheckboxes[key].checked = window.app.activeBestiary.metadata[key];
		}

		this.modalOverlay.classList.remove('hidden');
		this.settingsModal.classList.remove('hidden');
	},

	deleteGroup: function(groupName) {
		if (!window.app.activeBestiary || !window.app.activeBestiary.metadata.fg_groups) return;
		
		window.app.activeBestiary.metadata.fg_groups = window.app.activeBestiary.metadata.fg_groups.filter(g => g !== groupName);
		
		// Check if any NPC was using this group and reset it
		window.app.activeBestiary.npcs.forEach(npc => {
			if (npc.fg_group === groupName) {
				npc.fg_group = window.app.activeBestiary.projectName;
			}
		});

		window.app.saveActiveBestiaryToDB();
		this.showManageGroupsModal(); // Refresh modal list
		this.updateFormFromActiveNPC(); // Refresh main dropdown
	},

	addNewGroup: function() {
		const newName = this.newGroupNameInput.value.trim();
		if (!newName) return;

		if (!window.app.activeBestiary.metadata.fg_groups) {
			window.app.activeBestiary.metadata.fg_groups = [];
		}
		
		const isDuplicate = newName.toLowerCase() === window.app.activeBestiary.projectName.toLowerCase() || window.app.activeBestiary.metadata.fg_groups.some(g => g.toLowerCase() === newName.toLowerCase());

		if (isDuplicate) {
			alert(`A group named "${newName}" already exists.`);
			return;
		}

		window.app.activeBestiary.metadata.fg_groups.push(newName);
		window.app.saveActiveBestiaryToDB();
		this.newGroupNameInput.value = '';
		this.showManageGroupsModal(); // Refresh list
		this.updateFormFromActiveNPC(); // Refresh main dropdown
	},
	
	// --- Language Modal Logic ---
	showManageLanguagesModal: function() {
		if (!window.app.activeBestiary) return;
		
		this.languageListDiv.innerHTML = '';
		const userLangs = window.app.activeBestiary.metadata.userDefinedLanguages || [];

		if (userLangs.length === 0) {
			this.languageListDiv.innerHTML = '<p class="text-gray-500 text-center">No custom languages created.</p>';
		} else {
			// Sort the list alphabetically for user convenience
			userLangs.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

			userLangs.forEach(langName => {
				const langEl = document.createElement('div');
				langEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = langName;
				
				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700"><use href="#icon-trash"></use></svg>`;
				deleteBtn.className = 'p-1 delete-language-btn';
				deleteBtn.title = `Delete language: ${langName}`;
				deleteBtn.onclick = (e) => {
					e.stopPropagation();
					this.deleteLanguage(langName);
				};

				langEl.appendChild(nameSpan);
				langEl.appendChild(deleteBtn);
				this.languageListDiv.appendChild(langEl);
			});
		}
		this.modalOverlay.classList.remove('hidden');
		this.manageLanguagesModal.classList.remove('hidden');
		this.newLanguageNameInput.focus();
	},
	
	addNewLanguage: function() {
		if (!window.app.activeBestiary) return;
		const newName = this.newLanguageNameInput.value.trim();
		if (!newName) return;
		
		const lowerNewName = newName.toLowerCase();

		const isPredefined = window.app.allPredefinedLanguages.includes(lowerNewName);
		
		const userLangs = window.app.activeBestiary.metadata.userDefinedLanguages || [];
		const isUserDefined = userLangs.map(l => l.toLowerCase()).includes(lowerNewName);

		if (isPredefined || isUserDefined) {
			alert(`A language named "${newName}" already exists (either predefined or user-defined).`);
			return;
		}

		window.app.activeBestiary.metadata.userDefinedLanguages.push(newName);
		window.app.saveActiveBestiaryToDB();
		this.newLanguageNameInput.value = '';
		this.showManageLanguagesModal(); // Refresh modal list
		this.updateFormFromActiveNPC(); // Refresh the main language listboxes
	},
	
	deleteLanguage: function(langName) {
		if (!window.app.activeBestiary) return;
		
		// 1. Remove from bestiary metadata
		window.app.activeBestiary.metadata.userDefinedLanguages = (window.app.activeBestiary.metadata.userDefinedLanguages || []).filter(l => l !== langName);
		
		// 2. Remove from any NPC that was using it
		window.app.activeBestiary.npcs.forEach(npc => {
			if (npc.selectedLanguages) {
				npc.selectedLanguages = npc.selectedLanguages.filter(l => l !== langName);
			}
		});

		// 3. Save, refresh modal, and refresh form
		window.app.saveActiveBestiaryToDB();
		this.showManageLanguagesModal(); 
		this.updateFormFromActiveNPC(); 
	},

	// --- Trait Logic ---
	addOrUpdateNpcTrait: function() {
		if (!window.app.activeNPC) return;
		const name = this.newTraitName.value.trim();
		const description = this.newTraitDescription.value.trim();
		if (!name || !description) return;

		const existingTraitIndex = window.app.activeNPC.traits.findIndex(trait => trait.name.toLowerCase() === name.toLowerCase());

		if (existingTraitIndex > -1) {
			// Update existing trait
			window.app.activeNPC.traits[existingTraitIndex].description = description;
		} else {
			// Add new trait
			window.app.activeNPC.traits.push({ name, description });
		}
		
		this.newTraitName.value = '';
		this.newTraitDescription.value = '';
		
		this.renderNpcTraits();
		window.viewport.updateViewport();
		window.app.saveActiveBestiaryToDB();
	},

renderNpcTraits: function() {
		this.npcTraitList.innerHTML = '';
		if (!window.app.activeNPC || !window.app.activeNPC.traits) return;

		let draggedIndex = -1;
		const shouldSort = window.app.activeNPC.sortTraitsAlpha ?? true;
		let traitsToRender = [...window.app.activeNPC.traits];

		if (shouldSort) {
			traitsToRender.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
		}

		traitsToRender.forEach((trait) => {
			const originalIndex = window.app.activeNPC.traits.indexOf(trait);

			const traitEl = document.createElement('div');
			traitEl.className = 'p-2 border rounded-md bg-gray-50 hover:bg-gray-100 flex justify-between items-start';
			traitEl.dataset.index = originalIndex;

			const contentEl = document.createElement('div');
			const processedDescription = window.app.processTraitString(trait.description, window.app.activeNPC);
			contentEl.innerHTML = `<strong class="text-sm">${trait.name}</strong><p class="text-xs text-gray-600">${processedDescription}</p>`;
			
			const deleteBtn = document.createElement('button');
			deleteBtn.innerHTML = `&times;`;
			deleteBtn.className = 'ml-2 text-red-500 hover:text-red-700 font-bold text-lg leading-none';
			deleteBtn.title = `Delete ${trait.name}`;
			
			deleteBtn.onclick = (e) => {
				e.stopPropagation();
				window.app.activeNPC.traits.splice(originalIndex, 1);
				this.renderNpcTraits();
				window.viewport.updateViewport();
				window.app.saveActiveBestiaryToDB();
			};

			traitEl.onclick = () => {
				this.newTraitName.value = trait.name;
				this.newTraitDescription.value = trait.description;
			};
			
			if (shouldSort) {
				traitEl.draggable = false;
			} else {
				traitEl.draggable = true;
				traitEl.classList.add('cursor-pointer');

				traitEl.addEventListener('dragstart', (e) => {
					draggedIndex = originalIndex;
					e.dataTransfer.effectAllowed = 'move';
					setTimeout(() => traitEl.classList.add('opacity-50'), 0);
				});

				traitEl.addEventListener('dragend', () => {
					traitEl.classList.remove('opacity-50');
					document.querySelectorAll('#npc-trait-list .drop-indicator-top, #npc-trait-list .drop-indicator-bottom').forEach(el => {
						el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
					});
				});

				traitEl.addEventListener('dragover', (e) => {
					e.preventDefault();
					document.querySelectorAll('#npc-trait-list > div').forEach(el => {
						if (el !== traitEl) el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
					});
					const rect = traitEl.getBoundingClientRect();
					if (e.clientY < rect.top + rect.height / 2) {
						traitEl.classList.add('drop-indicator-top');
						traitEl.classList.remove('drop-indicator-bottom');
					} else {
						traitEl.classList.add('drop-indicator-bottom');
						traitEl.classList.remove('drop-indicator-top');
					}
				});

				traitEl.addEventListener('drop', (e) => {
					e.preventDefault();
					const droppedOnOriginalIndex = parseInt(e.currentTarget.dataset.index, 10);
					if (draggedIndex === droppedOnOriginalIndex) return;

					const dropAbove = e.currentTarget.classList.contains('drop-indicator-top');
					document.querySelectorAll('#npc-trait-list > div').forEach(el => {
						el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
					});
					
					const [draggedItem] = window.app.activeNPC.traits.splice(draggedIndex, 1);
					let newTargetIndex = droppedOnOriginalIndex;
					if (draggedIndex < droppedOnOriginalIndex) newTargetIndex--;
					
					const insertionPoint = dropAbove ? newTargetIndex : newTargetIndex + 1;
					window.app.activeNPC.traits.splice(insertionPoint, 0, draggedItem);
					
					this.renderNpcTraits();
					window.viewport.updateViewport();
					window.app.saveActiveBestiaryToDB();
				});
			}

			traitEl.appendChild(contentEl);
			traitEl.appendChild(deleteBtn);
			this.npcTraitList.appendChild(traitEl);
		});

        this.npcTraitList.addEventListener('dragleave', (e) => {
            if (!this.npcTraitList.contains(e.relatedTarget)) {
                document.querySelectorAll('#npc-trait-list > div').forEach(el => {
                    el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
                });
            }
        });
	},
	
	populateSavedTraitsDatalist: function() {
		this.savedTraitList.innerHTML = '';
		if (!window.app.activeBestiary || !window.app.activeBestiary.metadata.savedTraits) return;

		window.app.activeBestiary.metadata.savedTraits.forEach(trait => {
			const option = document.createElement('option');
			option.value = trait.name;
			this.savedTraitList.appendChild(option);
		});
	},

	showManageTraitsModal: function() {
		if (!window.app.activeBestiary) return;

		this.managedTraitListDiv.innerHTML = '';
		const savedTraits = window.app.activeBestiary.metadata.savedTraits || [];

		if (savedTraits.length === 0) {
			this.managedTraitListDiv.innerHTML = '<p class="text-gray-500 text-center">No saved traits.</p>';
		} else {
			savedTraits.sort((a,b) => a.name.localeCompare(b.name)).forEach(trait => {
				const traitEl = document.createElement('div');
				traitEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = trait.name;
				
				const deleteBtn = document.createElement('button');
				deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700"><use href="#icon-trash"></use></svg>`;
				deleteBtn.className = 'p-1';
				deleteBtn.title = `Delete trait: ${trait.name}`;
				deleteBtn.onclick = (e) => {
					e.stopPropagation();
					this.deleteSavedTrait(trait.name);
				};

				traitEl.appendChild(nameSpan);
				traitEl.appendChild(deleteBtn);
				this.managedTraitListDiv.appendChild(traitEl);
			});
		}
		this.modalOverlay.classList.remove('hidden');
		this.manageTraitsModal.classList.remove('hidden');
		this.modalTraitName.focus();
	},

	addNewSavedTrait: function() {
		const name = this.modalTraitName.value.trim();
		const description = this.modalTraitDescription.value.trim();
		if (!name || !description) return;

		const savedTraits = window.app.activeBestiary.metadata.savedTraits;
		if (savedTraits.some(t => t.name.toLowerCase() === name.toLowerCase())) {
			alert(`A saved trait named "${name}" already exists.`);
			return;
		}

		savedTraits.push({ name, description });
		this.modalTraitName.value = '';
		this.modalTraitDescription.value = '';

		this.showManageTraitsModal(); // Refresh modal
		this.populateSavedTraitsDatalist(); // Refresh datalist on main form
		window.app.saveActiveBestiaryToDB();
	},

	deleteSavedTrait: function(traitName) {
		const metadata = window.app.activeBestiary.metadata;
		metadata.savedTraits = metadata.savedTraits.filter(t => t.name !== traitName);
		
		this.showManageTraitsModal(); // Refresh modal
		this.populateSavedTraitsDatalist(); // Refresh datalist on main form
		window.app.saveActiveBestiaryToDB();
	},


	parseHpStringToModal: function() {
		const hpString = this.inputs.hitPoints.value || "";
		const match = hpString.match(/\((\d+)d(\d+)\s*([+-])?\s*(\d+)?\)/);

		if (match) {
			// Example match for "16 (3d6 + 6)": ["(3d6 + 6)", "3", "6", "+", "6"]
			const numDice = parseInt(match[1], 10);
			const dieType = parseInt(match[2], 10);
			const sign = match[3];
			const bonus = parseInt(match[4], 10) || 0;

			this.numDiceInput.value = numDice;
			this.dieTypeSelect.value = dieType;
			this.bonusInput.value = (sign === '-') ? -bonus : bonus;
		} else {
			// Reset to defaults if no match
			this.numDiceInput.value = 1;
			this.dieTypeSelect.value = 8; // d8 default
			this.bonusInput.value = 0;
		}
	},
};