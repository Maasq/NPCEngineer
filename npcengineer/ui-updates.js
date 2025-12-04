// ui-updates.js

// --- Define Update Functions (private scope) ---

// NOTE: Calculation logic moved to updateActiveNPCFromForm in main.js
// function _updateInnateCalculatedFields() { ... }
// function _updateTraitCalculatedFields() { ... }
// function _updateActionCalculatedFields() { ... }

// --- NEW Card Open Helper Function ---
function _openCardAndHandleSoloMode(cardId) {
   const targetCard = document.getElementById(cardId);
   if (!targetCard) return;

   const cardBody = targetCard.querySelector('.card-body');
   if (!cardBody) return;

   const isOpening = !cardBody.classList.contains('open');

   // --- Solo Card Mode Logic ---
   if (isOpening && window.app.soloCardMode) {
      // Close all other open cards first
      document.querySelectorAll('.card-body.open').forEach(openCard => {
         if (openCard !== cardBody) {
            // Close it
            openCard.style.maxHeight = openCard.scrollHeight + 'px';
            requestAnimationFrame(() => {
               openCard.classList.remove('open');
               openCard.style.maxHeight = '0';
               openCard.style.paddingTop = '0';
               openCard.style.paddingBottom = '0';
            });
         }
      });
   }
   // --- End Solo Card Mode Logic ---

   // --- Open the target card if it was closed ---
   if (isOpening) {
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

// --- NEW: Enforce Solo Mode Helper ---
function _enforceSoloMode() {
   if (!window.app.soloCardMode) return;

   const openCards = document.querySelectorAll('.card-body.open');
   if (openCards.length > 1) {
      // Keep the first one open, close the rest
      for (let i = 1; i < openCards.length; i++) {
         const card = openCards[i];
         // Close it
         card.style.maxHeight = card.scrollHeight + 'px';
         requestAnimationFrame(() => {
            card.classList.remove('open');
            card.style.maxHeight = '0';
            card.style.paddingTop = '0';
            card.style.paddingBottom = '0';
         });
      }
   }
}

// --- NEW FG Export Modal Function ---
function _openFgExportModal() {
   // This function is now defined in export-fg.js and attached to window.fgExporter
   // This call assumes export-fg.js has loaded and attached its object
   if (window.fgExporter && typeof window.fgExporter.openExportModal === 'function') {
      window.fgExporter.openExportModal();
   } else {
      console.error("FG Exporter is not initialized.");
      window.app.showAlert("Error: FG Export module is not loaded.");
   }
}

function _showNewBestiaryModal() {
   if (window.ui.newBestiaryModal) {
      window.app.openModal('new-bestiary-modal');
      if (window.ui.newBestiaryNameInput) window.ui.newBestiaryNameInput.focus();
   } else { console.error("Element #new-bestiary-modal not found!");}
}

function _hideAllModals() {
   if (window.ui.modalOverlay) window.ui.modalOverlay.classList.add('hidden'); else { console.error("Element #modal-overlay not found!");}
   document.querySelectorAll('.modal-content').forEach(modal => {
       modal.classList.add('hidden');
   });
   if (window.ui.alertOkBtn) window.ui.alertOkBtn.onclick = null;
   if (window.ui.alertCancelBtn) {
      window.ui.alertCancelBtn.onclick = null;
      window.ui.alertCancelBtn.classList.add('hidden');
   }
}

function _updateMenuState() {
   const hasActiveBestiary = !!window.app.activeBestiary;
   const menuItemsToToggle = [
      window.ui.menuExportBestiary, window.ui.menuNewNpc, window.ui.menuDuplicateNpc, window.ui.menuImportNpc,
      window.ui.menuImportText, window.ui.menuExportNpc, window.ui.menuDeleteNpc, window.ui.menuSettings,
      window.ui.menuExportFg
   ].filter(item => item);

   menuItemsToToggle.forEach(item => {
      if (hasActiveBestiary) {
         item.classList.remove('disabled');
      } else {
         item.classList.add('disabled');
      }
   });
   // Enable DB export/import regardless of active bestiary
   if(window.ui.menuExportDb) window.ui.menuExportDb.classList.remove('disabled');
   if(window.ui.menuImportDb) window.ui.menuImportDb.classList.remove('disabled');


   if (window.ui.footerImportTextBtn) {
      window.ui.footerImportTextBtn.disabled = !hasActiveBestiary;
   }
   if (window.ui.footerExportFgBtn) {
      window.ui.footerExportFgBtn.disabled = !hasActiveBestiary;
   }
   
   // UPDATED: Enabled when bestiary is active
   if (window.ui.footerExportPdfBtn) {
      // window.ui.footerExportPdfBtn.disabled = !hasActiveBestiary;  // enable this to enable the button
      window.ui.footerExportPdfBtn.disabled = true; //enable this to disable the button
   }

   if (window.ui.menuDeleteNpc && hasActiveBestiary && window.app.activeBestiary.npcs.length <= 1) {
      window.ui.menuDeleteNpc.classList.add('disabled');
   }
}

function _updateUIForActiveBestiary() {
   const hasActiveBestiary = !!window.app.activeBestiary;

if (window.ui.bestiaryStatusEl) {
      window.ui.bestiaryStatusEl.innerHTML = hasActiveBestiary
         ? `Bestiary: <span class="font-bold text-red-700">${window.app.activeBestiary.projectName} (${window.app.activeBestiary.npcs.length} NPCs)</span>`
         : "No Bestiary Loaded";
   } else { console.error("Element #bestiary-status not found!"); }

   if (window.ui.mainContentColumn) {
      window.ui.mainContentColumn.style.opacity = hasActiveBestiary ? '1' : '0.3';
      window.ui.mainContentColumn.style.pointerEvents = hasActiveBestiary ? 'auto' : 'none';
   } else { console.error("Element #main-content-column not found!"); }

   if (window.ui.npcSelector) window.ui.npcSelector.classList.toggle('hidden', !hasActiveBestiary); else { console.error("Element #npc-selector not found!"); }
   if (window.ui.deleteNpcBtn) window.ui.deleteNpcBtn.classList.toggle('hidden', !hasActiveBestiary); else { console.error("Element #deleteNpcBtn not found!"); }
   if (window.ui.npcOptionsContainer) window.ui.npcOptionsContainer.classList.toggle('hidden', !hasActiveBestiary); else { console.error("Element #npc-options-container not found!"); }

   [window.ui.newNpcBtn, window.ui.duplicateNpcBtn, window.ui.importNpcBtn, window.ui.exportNpcBtn, window.ui.deleteNpcBtn]
      .filter(btn => btn)
      .forEach(btn => btn.disabled = !hasActiveBestiary);

   this.updateMenuState(); // Use 'this'
   this.updateFormFromActiveNPC(); // Use 'this'
}

function _updateNpcSelector() {
   if (!window.app.activeBestiary || !window.ui.npcSelector) return;

   const currentScroll = window.ui.npcSelector.scrollTop;
   window.ui.npcSelector.innerHTML = '';

   window.app.activeBestiary.npcs.forEach((npc, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = npc.name || "Unnamed NPC";
      if (index === window.app.activeNPCIndex) {
         option.selected = true;
      }
      window.ui.npcSelector.appendChild(option);
   });
   window.ui.npcSelector.scrollTop = currentScroll;

   if (window.ui.deleteNpcBtn) {
      window.ui.deleteNpcBtn.disabled = window.app.activeBestiary.npcs.length <= 1;
   }
}

function _populateLanguageListbox(listboxId, languageArray, selectedLanguages) {
   const listbox = document.getElementById(listboxId);
   if (!listbox) return;

   const currentScroll = listbox.scrollTop;
   listbox.innerHTML = '';
   const safeLangArray = Array.isArray(languageArray) ? languageArray : [];
   safeLangArray.sort((a, b) => (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' }));

   safeLangArray.forEach(lang => {
      if (!lang) return;
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      option.selected = (selectedLanguages || []).includes(lang);
      listbox.appendChild(option);
   });
   listbox.scrollTop = currentScroll;
}

function _updateFormFromActiveNPC() {
   window.app.isUpdatingForm = true;
   try {
      const trixEditorElement = document.querySelector("trix-editor");

      if (!window.app.activeNPC) {
         Object.values(window.ui.inputs).forEach(input => {
            if (!input) return;
            // Don't clear global settings on NPC clear
            if (input.id.startsWith('setting-')) return;
            if (input.type === 'checkbox') input.checked = false;
            else if (input.type !== 'radio') input.value = '';
         });
         // Clear Innate (Reset to default freq if exists)
         for (let i = 0; i < 4; i++) {
            const freqInput = window.ui.inputs[`innate-freq-${i}`];
            const listInput = window.ui.inputs[`innate-list-${i}`];
            if(freqInput) freqInput.value = window.app.defaultNPC.innateSpells[i]?.freq || '';
            if(listInput) listInput.value = '';
         }
         // Clear Action (Reset to default freq if exists)
         for (let i = 0; i < 4; i++) {
            const freqInput = window.ui.inputs[`action-casting-freq-${i}`];
            const listInput = window.ui.inputs[`action-casting-list-${i}`];
            if(freqInput) freqInput.value = window.app.defaultNPC.actionCastingSpells[i]?.freq || '';
            if(listInput) listInput.value = '';
         }
         // Clear Trait fields
         if(window.ui.inputs.traitCastingLevel) window.ui.inputs.traitCastingLevel.value = window.app.defaultNPC.traitCastingLevel;
         if(window.ui.inputs.traitCastingAbility) window.ui.inputs.traitCastingAbility.value = window.app.defaultNPC.traitCastingAbility;
         if(window.ui.inputs.traitCastingDC) window.ui.inputs.traitCastingDC.value = '';
         if(window.ui.inputs.traitCastingBonus) window.ui.inputs.traitCastingBonus.value = '';
         if(window.ui.inputs.traitCastingClass) window.ui.inputs.traitCastingClass.value = window.app.defaultNPC.traitCastingClass;
         if(window.ui.inputs.traitCastingFlavor) window.ui.inputs.traitCastingFlavor.value = window.app.defaultNPC.traitCastingFlavor;
         // Clear Trait spell lists/slots
         for (let i = 0; i <= 9; i++) {
            const listInput = window.ui.inputs[`traitCastingList-${i}`];
            if (listInput) listInput.value = '';
            if (i > 0) {
               const slotsInput = window.ui.inputs[`traitCastingSlots-${i}`];
               if (slotsInput) slotsInput.value = '0'; // Default to 0 slots ('—')
            }
         }
         if(window.ui.inputs.traitCastingMarked) window.ui.inputs.traitCastingMarked.value = '';


         if (trixEditorElement && trixEditorElement.editor) trixEditorElement.editor.loadHTML("");
         if (window.ui.viewport) window.ui.viewport.innerHTML = '';
         if (window.ui.npcSelector) window.ui.npcSelector.innerHTML = '';
         if (window.ui.npcTraitList) window.ui.npcTraitList.innerHTML = '';
         if (window.ui.savedTraitList) window.ui.savedTraitList.innerHTML = '';
         this.renderActions(); // Use 'this'
         if (window.ui.experienceDisplay) window.ui.experienceDisplay.textContent = '';
         if (window.ui.proficiencyBonusDisplay) window.ui.proficiencyBonusDisplay.textContent = '';
         this.updateStatDisplays(); // Use 'this'
         this.updateTokenDisplay(); // Use 'this'
         this.updateImageDisplay(); // Use 'this'
         document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (!cb.id.startsWith('setting-')) cb.checked = false; // Don't clear global settings
         });
         document.querySelectorAll('input[name="weapon-resistance"][value="none"]').forEach(rb => rb.checked = true);
         document.querySelectorAll('input[name="weapon-immunity"][value="none"]').forEach(rb => rb.checked = true);
         if (window.ui.inputs.spellcastingToTraits) window.ui.inputs.spellcastingToTraits.checked = true;
         if (window.ui.inputs.spellcastingToActions) window.ui.inputs.spellcastingToActions.checked = false;

         if (window.ui.languageListboxes) window.ui.languageListboxes.forEach(lb => {if (lb) lb.selectedIndex = -1;});
         this.updateSpellcastingVisibility(true); // Clear visibility state
         return;
      }

      // --- Populate standard fields ---
      for (const key in window.ui.inputs) {
         const element = window.ui.inputs[key];
         if (!element) continue;
         // Skip fields handled specifically later
         if (key.startsWith('common') || key === 'attackDamageDice') continue;
         if (element.type === 'radio') continue;
         if (key.startsWith('innate-') || key.startsWith('trait-casting-') || key.startsWith('action-casting-') || key === 'hasInnateSpellcasting' || key === 'hasSpellcasting' || key === 'menuSoloCardMode') continue;
         if (key.startsWith('fg-')) continue; // Skip FG modal inputs
         if (key.startsWith('setting-')) continue; // Skip global settings inputs
         // Skip specific trait spell list inputs (handled in loop below)
         if (key.match(/^traitCastingList-\d$/) || key.match(/^traitCastingSlots-\d$/) || key === 'traitCastingMarked') continue;


         if (key === 'description') {
            element.value = window.app.activeNPC[key] || '';
            if (trixEditorElement && trixEditorElement.editor) {
               // Only update Trix if content differs significantly to avoid cursor jumps
               if (trixEditorElement.editor.getDocument().toString().trim() !== (window.app.activeNPC[key] || '').trim()) {
                  trixEditorElement.editor.loadHTML(window.app.activeNPC[key] || "");
               }
            }
            continue;
         }

         // Handle custom toggles (size, type, species, alignment)
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
               select.value = ""; // Clear dropdown selection
            } else {
               select.value = npcValue;
               customInput.value = ""; // Clear custom input
            }
         } else if (element.type === "checkbox") {
            // Ensure boolean defaults
            element.checked = window.app.activeNPC[key] ?? window.app.defaultNPC[key] ?? false;
         } else {
            // For text, number, select fields
            const valueToSet = window.app.activeNPC[key] ?? window.app.defaultNPC[key] ?? "";
            // Prevent unnecessary updates causing focus loss/cursor jumps
             if (element.type === "number") {
               const currentVal = parseInt(element.value, 10);
               const newVal = parseInt(valueToSet, 10);
                if (isNaN(currentVal) || isNaN(newVal) || currentVal !== newVal) {
                    element.value = isNaN(newVal) ? '' : newVal;
                }
            } else if (element.value !== String(valueToSet)) { // Compare as strings
                element.value = valueToSet;
            }
         }
      }

      // --- INNATE SPELLCASTING ---
      if(window.ui.inputs.hasInnateSpellcasting) window.ui.inputs.hasInnateSpellcasting.checked = window.app.activeNPC.hasInnateSpellcasting ?? false;
      if(window.ui.inputs.innateIsPsionics) window.ui.inputs.innateIsPsionics.checked = window.app.activeNPC.innateIsPsionics ?? false;

       // Calculate expected DC based on current NPC stats *before* populating fields
       const { dc: calculatedInnateDC } = window.app.calculateSpellcastingDCBonus( // ignore bonus
         window.app.activeNPC.innateAbility ?? window.app.defaultNPC.innateAbility,
         window.app.activeNPC.proficiencyBonus ?? window.app.defaultNPC.proficiencyBonus,
         window.app.activeNPC
      );

      if(window.ui.inputs.innateAbility) window.ui.inputs.innateAbility.value = window.app.activeNPC.innateAbility ?? window.app.defaultNPC.innateAbility;
      // Populate with saved value if it exists, otherwise use calculated; handle undefined/null
      if(window.ui.inputs.innateDC) window.ui.inputs.innateDC.value = window.app.activeNPC.innateDC ?? calculatedInnateDC;
      if(window.ui.inputs.innateComponents) window.ui.inputs.innateComponents.value = window.app.activeNPC.innateComponents ?? window.app.defaultNPC.innateComponents;

       // Populate spell freq/list, falling back to defaults for structure
       const innateSpells = window.app.activeNPC.innateSpells || window.app.defaultNPC.innateSpells;
       for (let i = 0; i < 4; i++) {
         const freqInput = window.ui.inputs[`innate-freq-${i}`];
         const listInput = window.ui.inputs[`innate-list-${i}`];
         const defaultSlot = window.app.defaultNPC.innateSpells[i] || { freq: "", list: "" };
          if (freqInput) freqInput.value = innateSpells[i]?.freq ?? defaultSlot.freq;
          if (listInput) listInput.value = innateSpells[i]?.list ?? defaultSlot.list;
      }

      // --- REGULAR SPELLCASTING ---
      if(window.ui.inputs.hasSpellcasting) window.ui.inputs.hasSpellcasting.checked = window.app.activeNPC.hasSpellcasting ?? false;
      const spellPlacement = window.app.activeNPC.spellcastingPlacement ?? window.app.defaultNPC.spellcastingPlacement;
      if (window.ui.inputs.spellcastingToTraits) window.ui.inputs.spellcastingToTraits.checked = spellPlacement === 'traits';
      if (window.ui.inputs.spellcastingToActions) window.ui.inputs.spellcastingToActions.checked = spellPlacement === 'actions';

      // --- TRAIT-BASED SPELLCASTING ---
      // Calculate expected DC/Bonus
       const { dc: calculatedTraitDC, bonus: calculatedTraitBonus } = window.app.calculateSpellcastingDCBonus(
         window.app.activeNPC.traitCastingAbility ?? window.app.defaultNPC.traitCastingAbility,
         window.app.activeNPC.proficiencyBonus ?? window.app.defaultNPC.proficiencyBonus, // Use main proficiency for now
         window.app.activeNPC
      );
      if(window.ui.inputs.traitCastingLevel) window.ui.inputs.traitCastingLevel.value = window.app.activeNPC.traitCastingLevel ?? window.app.defaultNPC.traitCastingLevel;
      if(window.ui.inputs.traitCastingAbility) window.ui.inputs.traitCastingAbility.value = window.app.activeNPC.traitCastingAbility ?? window.app.defaultNPC.traitCastingAbility;
      if(window.ui.inputs.traitCastingDC) window.ui.inputs.traitCastingDC.value = window.app.activeNPC.traitCastingDC ?? calculatedTraitDC;
      if(window.ui.inputs.traitCastingBonus) window.ui.inputs.traitCastingBonus.value = window.app.activeNPC.traitCastingBonus ?? calculatedTraitBonus;
      if(window.ui.inputs.traitCastingClass) window.ui.inputs.traitCastingClass.value = window.app.activeNPC.traitCastingClass ?? window.app.defaultNPC.traitCastingClass;
      if(window.ui.inputs.traitCastingFlavor) window.ui.inputs.traitCastingFlavor.value = window.app.activeNPC.traitCastingFlavor ?? window.app.defaultNPC.traitCastingFlavor;
      // Populate Trait spell lists/slots
      const traitLists = window.app.activeNPC.traitCastingList || window.app.defaultNPC.traitCastingList;
      const traitSlots = window.app.activeNPC.traitCastingSlots || window.app.defaultNPC.traitCastingSlots;
      for (let i = 0; i <= 9; i++) {
         const listInput = window.ui.inputs[`traitCastingList-${i}`];
         if (listInput) listInput.value = traitLists[i] ?? '';
         if (i > 0) { // Slots 1-9
            const slotsInput = window.ui.inputs[`traitCastingSlots-${i}`];
            if (slotsInput) slotsInput.value = traitSlots[i-1] ?? '0';
         }
      }
      if(window.ui.inputs.traitCastingMarked) window.ui.inputs.traitCastingMarked.value = window.app.activeNPC.traitCastingMarked ?? window.app.defaultNPC.traitCastingMarked;


      // --- ACTION-BASED SPELLCASTING ---
      // Calculate expected DC
       const { dc: calculatedActionDC } = window.app.calculateSpellcastingDCBonus( // ignore bonus
         window.app.activeNPC.actionCastingAbility ?? window.app.defaultNPC.actionCastingAbility,
         window.app.activeNPC.proficiencyBonus ?? window.app.defaultNPC.proficiencyBonus,
         window.app.activeNPC
      );

      if(window.ui.inputs.actionCastingAbility) window.ui.inputs.actionCastingAbility.value = window.app.activeNPC.actionCastingAbility ?? window.app.defaultNPC.actionCastingAbility;
      // Populate with saved value if it exists, otherwise use calculated
      if(window.ui.inputs.actionCastingDC) window.ui.inputs.actionCastingDC.value = window.app.activeNPC.actionCastingDC ?? calculatedActionDC;
      if(window.ui.inputs.actionCastingComponents) window.ui.inputs.actionCastingComponents.value = window.app.activeNPC.actionCastingComponents ?? window.app.defaultNPC.actionCastingComponents;

       // Populate spell freq/list
       const actionSpells = window.app.activeNPC.actionCastingSpells || window.app.defaultNPC.actionCastingSpells;
       for (let i = 0; i < 4; i++) {
         const freqInput = window.ui.inputs[`action-casting-freq-${i}`];
         const listInput = window.ui.inputs[`action-casting-list-${i}`];
         const defaultSlot = window.app.defaultNPC.actionCastingSpells[i] || { freq: "", list: "" };
          if (freqInput) freqInput.value = actionSpells[i]?.freq ?? defaultSlot.freq;
          if (listInput) listInput.value = actionSpells[i]?.list ?? defaultSlot.list;
      }

      // --- Update visibility AFTER populating fields ---
      this.updateSpellcastingVisibility(); // Use 'this'

      // --- Languages ---
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

      // --- Traits ---
      this.populateSavedTraitsDatalist();
      if (window.ui.sortTraitsAlphaCheckbox) window.ui.sortTraitsAlphaCheckbox.checked = window.app.activeNPC.sortTraitsAlpha ?? true;
      this.renderNpcTraits();
      if (window.ui.newTraitName) window.ui.newTraitName.value = ''; // Clear inputs
      if (window.ui.newTraitDescription) window.ui.newTraitDescription.value = '';

      // --- Actions ---
      this.renderActions(); // Update action lists
      if (window.ui.legendaryBoilerplate) window.ui.legendaryBoilerplate.textContent = window.app.activeNPC.legendaryBoilerplate || window.app.defaultNPC.legendaryBoilerplate;
      if (window.ui.lairBoilerplate) window.ui.lairBoilerplate.textContent = window.app.activeNPC.lairBoilerplate || window.app.defaultNPC.lairBoilerplate;

      // --- Viewport Options ---
      for (const key in window.ui.npcSettingsCheckboxes) {
         const checkbox = window.ui.npcSettingsCheckboxes[key];
         if (checkbox) checkbox.checked = window.app.activeNPC[key] ?? true; // Default to true if missing
      }

      // --- Saves ---
      const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
      abilities.forEach(ability => {
         const profCheckbox = document.getElementById(`npc-${ability}-saving-throw-prof`);
         const adjustInput = document.getElementById(`npc-${ability}-saving-throw-adjust`);
         if (profCheckbox) profCheckbox.checked = window.app.activeNPC[`${ability}SavingThrowProf`] || false;
         if (adjustInput) adjustInput.value = window.app.activeNPC[`${ability}SavingThrowAdjust`] || 0;
      });

      // --- Skills ---
      window.app.skills.forEach(skill => {
         const profCheckbox = document.getElementById(`skill-${skill.id}-prof`);
         const expCheckbox = document.getElementById(`skill-${skill.id}-exp`);
         const adjustInput = document.getElementById(`skill-${skill.id}-adjust`);
         if (profCheckbox) profCheckbox.checked = window.app.activeNPC[`skill_${skill.id}_prof`] || false;
         if (expCheckbox) expCheckbox.checked = window.app.activeNPC[`skill_${skill.id}_exp`] || false;
         if (adjustInput) adjustInput.value = window.app.activeNPC[`skill_${skill.id}_adjust`] || 0;
      });

      // --- Resistances/Vulnerabilities/Immunities ---
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

      // --- Weapon Resistances/Immunities ---
      const weaponResValue = window.app.activeNPC.weaponResistance || 'none';
      const weaponResRadio = document.querySelector(`input[name="weapon-resistance"][value="${weaponResValue}"]`);
      if (weaponResRadio) {
         weaponResRadio.checked = true;
      } else { // Fallback if saved value is invalid
         const wrNone = document.getElementById('wr-none');
         if (wrNone) wrNone.checked = true;
      }

      const weaponImmValue = window.app.activeNPC.weaponImmunity || 'none';
      const weaponImmRadio = document.querySelector(`input[name="weapon-immunity"][value="${weaponImmValue}"]`);
      if (weaponImmRadio) {
         weaponImmRadio.checked = true;
      } else { // Fallback
         const wiNone = document.getElementById('wi-none');
         if (wiNone) wiNone.checked = true;
      }

      // --- FG Group ---
      const fgGroupDropdown = window.ui.inputs.fg_group;
      if (fgGroupDropdown && window.app.activeBestiary) {
         fgGroupDropdown.innerHTML = ''; // Clear existing options
         // Add default bestiary name option
         const bestiaryOption = document.createElement('option');
         bestiaryOption.value = window.app.activeBestiary.projectName;
         bestiaryOption.textContent = window.app.activeBestiary.projectName;
         fgGroupDropdown.appendChild(bestiaryOption);
         // Add custom group options
         (window.app.activeBestiary.metadata.fg_groups || []).forEach(group => {
            const groupOption = document.createElement('option');
            groupOption.value = group;
            groupOption.textContent = group;
            fgGroupDropdown.appendChild(groupOption);
         });
         // Set the selected value
         const currentGroup = window.app.activeNPC.fg_group || window.app.activeBestiary.projectName;
         // Check if the current group exists in the options
         if ([...fgGroupDropdown.options].some(opt => opt.value === currentGroup)) {
            fgGroupDropdown.value = currentGroup;
         } else {
            // If the saved group doesn't exist (e.g., deleted), default to bestiary name
            fgGroupDropdown.value = window.app.activeBestiary.projectName;
            window.app.activeNPC.fg_group = window.app.activeBestiary.projectName; // Correct the NPC data
         }
      }

      // --- Update Displays ---
      if (window.ui.experienceDisplay) window.ui.experienceDisplay.textContent = window.app.activeNPC.experience || '';
      if (window.ui.proficiencyBonusDisplay) window.ui.proficiencyBonusDisplay.textContent = `+${window.app.activeNPC.proficiencyBonus}` || '+2';
      this.updateTokenDisplay();
      this.updateImageDisplay();
      window.app.calculateAllStats(); // Recalculate stats based on loaded data
      this.updateStatDisplays();
      window.viewport.updateViewport(); // Update the preview
      this.updateNpcSelector(); // Ensure dropdown matches

       // Update settings modal checkbox based on loaded global setting
      if (window.ui.settingDisableUnloadWarning) {
          window.ui.settingDisableUnloadWarning.checked = window.app.disableUnloadWarning;
      }
      // NEW: Update solo card mode checkbox based on loaded global setting
      if (window.ui.settingSoloCardMode) {
         window.ui.settingSoloCardMode.checked = window.app.soloCardMode;
      }
      // NEW: Update menu solo card mode checkbox based on loaded global setting
      if (window.ui.menuSoloCardMode) {
         window.ui.menuSoloCardMode.checked = window.app.soloCardMode;
      }
      if (window.ui.settingLoadRecentBestiary) {
       window.ui.settingLoadRecentBestiary.checked = window.app.loadRecentBestiary;
      }


      // --- NEW: Handle Solo Card Mode on NPC Load ---
      if (window.app.soloCardMode) {
         // Close all cards first
         document.querySelectorAll('.card-body.open').forEach(openCard => {
            // Check if it's not already the info card, which we are about to open
            const parentCardId = openCard.closest('.bg-white')?.id;
            if (parentCardId !== 'info-card') {
               openCard.style.maxHeight = openCard.scrollHeight + 'px';
               requestAnimationFrame(() => {
                  openCard.classList.remove('open');
                  openCard.style.maxHeight = '0';
                  openCard.style.paddingTop = '0';
                  openCard.style.paddingBottom = '0';
               });
            }
         });
         // Open the info card
         _openCardAndHandleSoloMode('info-card');
      }
      // --- END NEW ---


   } finally {
      window.app.isUpdatingForm = false;
   }
}

function _updateSpellcastingVisibility(isClearing = false) {
   const npc = window.app.activeNPC;

   // --- Innate Spellcasting ---
   if (window.ui.innateSpellcastingHeader && window.ui.innateSpellcastingFields && window.ui.innateDivider) {
      const hasInnate = isClearing ? false : (npc?.hasInnateSpellcasting ?? false);
      const isPsionics = isClearing ? false : (npc?.innateIsPsionics ?? false);

      window.ui.innateSpellcastingHeader.classList.toggle('text-gray-400', !hasInnate);
      window.ui.innateSpellcastingHeader.classList.toggle('text-slate-700', hasInnate); // Use slate-700 for active header
      window.ui.innateSpellcastingHeader.textContent = (hasInnate && isPsionics) ? 'Innate Spellcasting (Psionics)' : 'Innate Spellcasting';

      window.ui.innateSpellcastingFields.classList.toggle('hidden', !hasInnate);
      requestAnimationFrame(() => { // Use requestAnimationFrame for smoother transition start
          window.ui.innateSpellcastingFields.style.opacity = hasInnate ? 1 : 0;
      });

      window.ui.innateDivider.classList.toggle('hidden', !hasInnate);

      const psionicsCheckbox = window.ui.inputs.innateIsPsionics;
      if (psionicsCheckbox) {
         psionicsCheckbox.checked = isPsionics;
      }
   }

   // --- Regular Spellcasting ---
   if (window.ui.spellcastingHeader && window.ui.spellcastingFields && window.ui.spellcastingDivider && window.ui.traitSpellcastingFields && window.ui.actionSpellcastingFields) {
      const hasSpellcasting = isClearing ? false : (npc?.hasSpellcasting ?? false);

      window.ui.spellcastingHeader.classList.toggle('text-gray-400', !hasSpellcasting);
      window.ui.spellcastingHeader.classList.toggle('text-slate-700', hasSpellcasting); // Use slate-700 for active header

      window.ui.spellcastingFields.classList.toggle('hidden', !hasSpellcasting);
      requestAnimationFrame(() => {
         window.ui.spellcastingFields.style.opacity = hasSpellcasting ? 1 : 0;
      });

      window.ui.spellcastingDivider.classList.toggle('hidden', !hasSpellcasting);

      let useInActions = false;
      if (!isClearing && npc) {
         const spellPlacement = npc.spellcastingPlacement ?? window.app.defaultNPC.spellcastingPlacement;
         useInActions = spellPlacement === 'actions';
         // Ensure radio buttons reflect the actual state
         if (window.ui.inputs.spellcastingToTraits) window.ui.inputs.spellcastingToTraits.checked = !useInActions;
         if (window.ui.inputs.spellcastingToActions) window.ui.inputs.spellcastingToActions.checked = useInActions;
      } else {
         // Default state when clearing or no NPC
          if (window.ui.inputs.spellcastingToTraits) window.ui.inputs.spellcastingToTraits.checked = true;
          if (window.ui.inputs.spellcastingToActions) window.ui.inputs.spellcastingToActions.checked = false;
      }

      // Toggle Trait Spellcasting fields visibility
      const showTraitFields = hasSpellcasting && !useInActions;
      window.ui.traitSpellcastingFields.classList.toggle('hidden', !showTraitFields);
      requestAnimationFrame(() => {
         window.ui.traitSpellcastingFields.style.opacity = showTraitFields ? 1 : 0;
      });

      // Toggle Action Spellcasting fields visibility
      const showActionFields = hasSpellcasting && useInActions;
      window.ui.actionSpellcastingFields.classList.toggle('hidden', !showActionFields);
      requestAnimationFrame(() => {
         window.ui.actionSpellcastingFields.style.opacity = showActionFields ? 1 : 0;
      });
   }
}


function _updateStatDisplays() {
   if (!window.app.activeNPC) {
      const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
      abilities.forEach(ability => {
         const bonusEl = document.getElementById(`npc-${ability}-bonus`);
         if (bonusEl) bonusEl.textContent = '';
         const totalEl = document.getElementById(`npc-${ability}-saving-throw-total`);
         if (totalEl) totalEl.textContent = '';
      });
      this.updateSkillDisplays(); // Use 'this'
      const passiveEl = document.getElementById('npc-passive-perception');
      if (passiveEl) passiveEl.textContent = '';
      return;
   }

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

   this.updateSkillDisplays(); // Use 'this'

   const passivePerceptionEl = document.getElementById('npc-passive-perception');
   if (passivePerceptionEl) passivePerceptionEl.textContent = window.app.activeNPC.passivePerception || 10;
}

function _updateSkillDisplays() {
   const profBonus = window.app.activeNPC?.proficiencyBonus || 2;

   window.app.skills.forEach(skill => {
      const totalEl = document.getElementById(`skill-${skill.id}-total`);
      if (totalEl) {
         if (!window.app.activeNPC) {
            totalEl.textContent = '';
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
}

function _updateTokenDisplay() {
   if (!window.ui.tokenBox) return;
   window.ui.tokenBox.innerHTML = ''; // Clear previous content

   // --- MODIFICATION: Build dynamic tooltip ---
   let title = "Click or Drag a Token Image Here"; // Default
   if (window.app.activeNPC && window.app.activeNPC.tokenInfo) {
      const info = window.app.activeNPC.tokenInfo;
      let format = (info.format || 'unknown').replace('image/', '').toLowerCase();
      let quality = (info.quality !== null) ? ` (${info.quality}% quality).` : '';
      title = `${info.width}x${info.height} ${format}${quality}\nClick or Drag to change token.`;
   }
   window.ui.tokenBox.title = title;
   // --- END MODIFICATION ---

   if (window.app.activeNPC && window.app.activeNPC.token) {
      const img = document.createElement('img');
      img.src = window.app.activeNPC.token;
      img.className = 'w-full h-full object-contain';
      window.ui.tokenBox.appendChild(img);
   } else {
      const placeholder = document.createElement('span');
      placeholder.textContent = 'Click or Drag a Token Image Here';
      window.ui.tokenBox.appendChild(placeholder);
   }
}

function _updateImageDisplay() {
   if (!window.ui.imageBox) return;
   window.ui.imageBox.innerHTML = ''; // Clear previous content

   // --- MODIFICATION: Build dynamic tooltip ---
   let title = "Click or Drag an NPC Image Here"; // Default
   if (window.app.activeNPC && window.app.activeNPC.imageInfo) {
      const info = window.app.activeNPC.imageInfo;
      let format = (info.format || 'unknown').replace('image/', '').toLowerCase();
      let quality = (info.quality !== null) ? ` (${info.quality}% quality).` : '';
      title = `${info.width}x${info.height} ${format}${quality}\nClick or Drag to change image.`;
   }
   window.ui.imageBox.title = title;
   // --- END MODIFICATION ---

   if (window.app.activeNPC && window.app.activeNPC.image) {
      const img = document.createElement('img');
      img.src = window.app.activeNPC.image;
      img.className = 'w-full h-full object-contain';
      window.ui.imageBox.appendChild(img);
   } else {
      const placeholder = document.createElement('span');
      placeholder.textContent = 'Click or Drag an NPC Image Here';
      window.ui.imageBox.appendChild(placeholder);
   }
}

function _populateChallengeDropdown() {
   const challengeSelect = window.ui.inputs.challenge;
   if (!challengeSelect) return;
   challengeSelect.innerHTML = '';
   window.app.challengeOrder.forEach(cr => {
      const option = document.createElement('option');
      option.value = cr;
      option.textContent = cr;
      challengeSelect.appendChild(option);
   });
   challengeSelect.value = '0';
}

// NEW: Function to populate Caster Level Dropdown
function _populateCasterLevelDropdown() {
   const levelSelect = window.ui.inputs.traitCastingLevel;
   if (!levelSelect) return;
   levelSelect.innerHTML = ''; // Clear existing
   const levels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th'];
   levels.forEach((level, index) => {
       const option = document.createElement('option');
       option.value = String(index + 1); // Store numeric value
       option.textContent = level;
       levelSelect.appendChild(option);
   });
   levelSelect.value = '1'; // Default to 1st level
}

async function _showLoadBestiaryModal() {
   if (!window.ui.loadBestiaryModal || !window.ui.bestiaryListDiv) return;

   let bestiaries = [];
   try {
      bestiaries = await window.app.db.projects.toArray();
   } catch (error) {
      console.error("Failed to load bestiaries from database:", error);
      window.app.showAlert("Error loading bestiary list. Check console.");
      return;
   }

   window.ui.bestiaryListDiv.innerHTML = '';

   if (bestiaries.length === 0) {
      window.ui.bestiaryListDiv.innerHTML = '<p class="text-gray-500 text-center">No bestiaries found.</p>';
   } else {
      bestiaries.sort((a, b) => (a.projectName || '').localeCompare(b.projectName || '', undefined, { sensitivity: 'base' }));

      // Keep 'this' context for callbacks
      const currentUIScope = this;

      bestiaries.forEach(proj => {
         const projEl = document.createElement('div');
         projEl.className = 'flex justify-between items-center py-1 px-2 border rounded-md hover:bg-gray-100';

         const nameSpan = document.createElement('span');
         nameSpan.textContent = proj.projectName || 'Unnamed Bestiary';
         nameSpan.className = 'cursor-pointer flex-grow mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap';
         nameSpan.title = proj.projectName || 'Unnamed Bestiary';
         nameSpan.onclick = () => {
            window.app.loadBestiary(proj);
            currentUIScope.hideAllModals(); // Use captured 'this'
         };

         const deleteBtn = document.createElement('button');
         deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700 flex-shrink-0"><use href="#icon-trash"></use></svg>`;
         deleteBtn.className = 'p-1';
         deleteBtn.title = `Delete ${proj.projectName || 'Unnamed Bestiary'}`;
         deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            console.log(`Delete button clicked for: ${proj.projectName}`); // LOG 1
            window.app.showConfirm(
               "Delete Bestiary?",
               `Are you sure you want to permanently delete the bestiary "${proj.projectName || 'Unnamed Bestiary'}"? This cannot be undone.`,
               async () => {
                  console.log(`Confirmed deletion for: ${proj.projectName}`); // LOG 2
                  try {
                     await window.app.db.projects.delete(proj.id);
                     console.log(`Successfully deleted ${proj.projectName} (ID: ${proj.id}) from DB.`); // LOG 3
                     if(window.app.activeBestiary && window.app.activeBestiary.id === proj.id) {
                        console.log("Deleted bestiary was active, resetting app state."); // LOG 4
                        window.app.activeBestiary = null;
                        window.app.activeNPC = null;
                        window.app.activeNPCIndex = -1;
                        window.app.changesMadeSinceExport = false; // Reset flag when deleting active
                        currentUIScope.updateUIForActiveBestiary(); // Use captured 'this'
                     }
                     console.log("Refreshing bestiary list modal."); // LOG 5
                     currentUIScope.showLoadBestiaryModal(); // Use captured 'this' to refresh the modal list
                  } catch (deleteError) {
                     console.error("Failed to delete bestiary:", deleteError); // LOG Error
                     window.app.showAlert("Error deleting bestiary. Check console.");
                  }
               }
            );
         };

         projEl.appendChild(nameSpan);
         projEl.appendChild(deleteBtn);
         window.ui.bestiaryListDiv.appendChild(projEl);
      });
   }
   window.app.openModal('load-bestiary-modal');
}

async function _showManageGroupsModal() {
   if (!window.app.activeBestiary || !window.ui.manageGroupsModal || !window.ui.groupListDiv) return;

   window.ui.groupListDiv.innerHTML = '';
   const groups = window.app.activeBestiary.metadata.fg_groups || [];

   if (groups.length === 0) {
      window.ui.groupListDiv.innerHTML = '<p class="text-gray-500 text-center">No custom groups created.</p>';
   } else {
      groups.sort((a, b) => (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' }));

      groups.forEach(groupName => {
         if (!groupName) return;
         const groupEl = document.createElement('div');
         groupEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';

         const nameSpan = document.createElement('span');
         nameSpan.textContent = groupName;
         nameSpan.className = 'mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap';
         nameSpan.title = groupName;

         const deleteBtn = document.createElement('button');
         deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700 flex-shrink-0"><use href="#icon-trash"></use></svg>`;
         deleteBtn.className = 'p-1 delete-group-btn';
         deleteBtn.title = `Delete group: ${groupName}`;
         deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteGroup(groupName); // Use 'this'
         };

         groupEl.appendChild(nameSpan);
         groupEl.appendChild(deleteBtn);
         window.ui.groupListDiv.appendChild(groupEl);
      });
   }
   window.app.openModal('manage-groups-modal');
}

function _showSettingsModal() {
   if (!window.ui.settingsModal) return; // Allow opening settings even without a bestiary

   // Handle Bestiary-specific settings
   if (window.app.activeBestiary) {
      if(window.ui.bestiarySettingsGroup) window.ui.bestiarySettingsGroup.classList.remove('hidden');
      for (const key in window.ui.bestiarySettingsCheckboxes) {
         const checkbox = window.ui.bestiarySettingsCheckboxes[key];
         if (checkbox) checkbox.checked = window.app.activeBestiary.metadata[key] ?? true;
      }
   } else {
      if(window.ui.bestiarySettingsGroup) window.ui.bestiarySettingsGroup.classList.add('hidden');
   }
   
   // --- MODIFIED: Populate ALL global settings from window.app state ---
   
   // App Settings
   if (window.ui.settingDisableUnloadWarning) {
      window.ui.settingDisableUnloadWarning.checked = window.app.disableUnloadWarning;
   }
   if (window.ui.settingSoloCardMode) {
      window.ui.settingSoloCardMode.checked = window.app.soloCardMode;
   }
   if (window.ui.menuSoloCardMode) {
      window.ui.menuSoloCardMode.checked = window.app.soloCardMode;
   }

   // Graphics Settings
   if (window.ui.inputs.settingConvertWebp) {
      window.ui.inputs.settingConvertWebp.checked = window.app.settingConvertWebp;
   }
   if (window.ui.inputs.settingWebpQuality) {
      window.ui.inputs.settingWebpQuality.value = window.app.settingWebpQuality;
   }
   if (window.ui.inputs.settingResizePortrait) {
      window.ui.inputs.settingResizePortrait.checked = window.app.settingResizePortrait;
   }
   if (window.ui.inputs.settingPortraitMaxWidth) {
      window.ui.inputs.settingPortraitMaxWidth.value = window.app.settingPortraitMaxWidth;
   }
   if (window.ui.inputs.settingPortraitMaxHeight) {
      window.ui.inputs.settingPortraitMaxHeight.value = window.app.settingPortraitMaxHeight;
   }
   if (window.ui.inputs.settingResizeToken) {
      window.ui.inputs.settingResizeToken.checked = window.app.settingResizeToken;
   }
   if (window.ui.inputs.settingTokenSize) {
      window.ui.inputs.settingTokenSize.value = window.app.settingTokenSize;
   }
   // (Future) Camera Token Settings
   if (window.ui.inputs.settingResizeCameraToken) {
      window.ui.inputs.settingResizeCameraToken.checked = window.app.settingResizeCameraToken;
   }
   if (window.ui.inputs.settingCameraTokenMaxWidth) {
      window.ui.inputs.settingCameraTokenMaxWidth.value = window.app.settingCameraTokenMaxWidth;
   }
   if (window.ui.inputs.settingCameraTokenMaxHeight) {
      window.ui.inputs.settingCameraTokenMaxHeight.value = window.app.settingCameraTokenMaxHeight;
   }
   // --- END MODIFICATION ---

   window.app.openModal('settings-modal');
}

function _deleteGroup(groupName) {
   if (!window.app.activeBestiary || !window.app.activeBestiary.metadata.fg_groups || !groupName) return;

   window.app.showConfirm(
      "Delete Group?",
      `Are you sure you want to delete the group "${groupName}"? NPCs currently in this group will be moved to the default bestiary group.`,
      () => {
         window.app.activeBestiary.metadata.fg_groups = window.app.activeBestiary.metadata.fg_groups.filter(g => g !== groupName);

         window.app.activeBestiary.npcs.forEach(npc => {
            if (npc.fg_group === groupName) {
               npc.fg_group = window.app.activeBestiary.projectName;
            }
         });

         window.app.saveActiveBestiaryToDB();
         this.showManageGroupsModal(); // Use 'this'
         this.updateFormFromActiveNPC(); // Use 'this'
      }
   );
}

function _addNewGroup() {
   if (!window.ui.newGroupNameInput || !window.app.activeBestiary) return;
   const newName = window.ui.newGroupNameInput.value.trim();
   if (!newName) {
      window.app.showAlert("Group name cannot be empty.");
      return;
   }

   if (!window.app.activeBestiary.metadata.fg_groups) {
      window.app.activeBestiary.metadata.fg_groups = [];
   }

   const isDuplicate = newName.toLowerCase() === window.app.activeBestiary.projectName.toLowerCase() ||
                  window.app.activeBestiary.metadata.fg_groups.some(g => g?.toLowerCase() === newName.toLowerCase());

   if (isDuplicate) {
      window.app.showAlert(`A group named "${newName}" already exists (either as the default or a custom group).`);
      return;
   }

   window.app.activeBestiary.metadata.fg_groups.push(newName);
   window.app.saveActiveBestiaryToDB();
   window.ui.newGroupNameInput.value = '';
   this.showManageGroupsModal(); // Use 'this'
   this.updateFormFromActiveNPC(); // Use 'this'
}

function _showManageLanguagesModal() {
   if (!window.app.activeBestiary || !window.ui.manageLanguagesModal || !window.ui.languageListDiv) return;

   window.ui.languageListDiv.innerHTML = '';
   const userLangs = window.app.activeBestiary.metadata.userDefinedLanguages || [];

   if (userLangs.length === 0) {
      window.ui.languageListDiv.innerHTML = '<p class="text-gray-500 text-center">No custom languages created.</p>';
   } else {
      userLangs.sort((a, b) => (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' }));

      userLangs.forEach(langName => {
         if (!langName) return;
         const langEl = document.createElement('div');
         langEl.className = 'flex justify-between items-center py-0.5 px-2 border rounded-md hover:bg-gray-100';

         const nameSpan = document.createElement('span');
         nameSpan.textContent = langName;
         nameSpan.className = 'mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap';
         nameSpan.title = langName;

         const deleteBtn = document.createElement('button');
         deleteBtn.innerHTML = `<svg class="h-5 w-5 text-red-500 hover:text-red-700 flex-shrink-0"><use href="#icon-trash"></use></svg>`;
         deleteBtn.className = 'p-1 delete-language-btn';
         deleteBtn.title = `Delete language: ${langName}`;
         deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteLanguage(langName); // Use 'this'
         };

         langEl.appendChild(nameSpan);
         langEl.appendChild(deleteBtn);
         window.ui.languageListDiv.appendChild(langEl);
      });
   }
   window.app.openModal('manage-languages-modal');
   if (window.ui.newLanguageNameInput) window.ui.newLanguageNameInput.focus();
}

function _addNewLanguage() {
   if (!window.app.activeBestiary || !window.ui.newLanguageNameInput) return;
   const newName = window.ui.newLanguageNameInput.value.trim();
   if (!newName) {
      window.app.showAlert("Language name cannot be empty.");
      return;
   }

   const lowerNewName = newName.toLowerCase();
   const isPredefined = window.app.allPredefinedLanguages.includes(lowerNewName);

   if (!window.app.activeBestiary.metadata.userDefinedLanguages) {
      window.app.activeBestiary.metadata.userDefinedLanguages = [];
   }
   const userLangs = window.app.activeBestiary.metadata.userDefinedLanguages;
   const isUserDefined = userLangs.some(l => l?.toLowerCase() === lowerNewName);

   if (isPredefined || isUserDefined) {
      window.app.showAlert(`A language named "${newName}" already exists (either predefined or user-defined).`);
      return;
   }

   window.app.activeBestiary.metadata.userDefinedLanguages.push(newName);
   window.app.saveActiveBestiaryToDB();
   window.ui.newLanguageNameInput.value = '';
   this.showManageLanguagesModal(); // Use 'this'
   this.updateFormFromActiveNPC(); // Use 'this'
}

function _deleteLanguage(langName) {
   if (!window.app.activeBestiary || !langName) return;

   window.app.showConfirm(
      "Delete Language?",
      `Are you sure you want to delete the custom language "${langName}"? NPCs who know this language will lose it.`,
      () => {
         if (window.app.activeBestiary.metadata.userDefinedLanguages) {
            window.app.activeBestiary.metadata.userDefinedLanguages = window.app.activeBestiary.metadata.userDefinedLanguages.filter(l => l !== langName);
         }

         window.app.activeBestiary.npcs.forEach(npc => {
            if (npc.selectedLanguages) {
               npc.selectedLanguages = npc.selectedLanguages.filter(l => l !== langName);
            }
         });

         window.app.saveActiveBestiaryToDB();
         this.showManageLanguagesModal(); // Use 'this'
         this.updateFormFromActiveNPC(); // Use 'this'
      }
   );
}

function _addOrUpdateNpcTrait() {
   if (!window.app.activeNPC || !window.ui.newTraitName || !window.ui.newTraitDescription) return;
   const name = window.ui.newTraitName.value.trim();
   const description = window.ui.newTraitDescription.value.trim();
   if (!name) {
      window.app.showAlert("Trait name cannot be empty.");
      return;
   }
   if (!description) {
      window.app.showAlert("Trait description cannot be empty.");
      return;
   }

   if (!window.app.activeNPC.traits) {
      window.app.activeNPC.traits = [];
   }

   const existingTraitIndex = window.app.activeNPC.traits.findIndex(trait => trait?.name?.toLowerCase() === name.toLowerCase());

   if (existingTraitIndex > -1) {
      window.app.activeNPC.traits[existingTraitIndex].desc = description; // Use 'desc'
   } else {
      window.app.activeNPC.traits.push({ name, desc: description }); // Use 'desc'
   }

   window.ui.newTraitName.value = '';
   window.ui.newTraitDescription.value = '';

   this.renderNpcTraits(); // Use 'this'
   window.viewport.updateViewport();
   window.app.saveActiveBestiaryToDB();
}

function _renderNpcTraits() {
   if (!window.ui.npcTraitList) return;
   window.ui.npcTraitList.innerHTML = '';
   if (!window.app.activeNPC || !Array.isArray(window.app.activeNPC.traits)) return;

   let draggedElement = null;

   const shouldSort = window.app.activeNPC.sortTraitsAlpha ?? true;
   let traitsToRender = window.app.activeNPC.traits.map((trait, index) => ({ ...trait, originalIndex: index }));

   if (shouldSort) {
      traitsToRender.sort((a, b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
   }

   traitsToRender.forEach((traitData) => {
      if (!traitData) return;

      const traitEl = document.createElement('div');
      traitEl.className = 'p-2 border rounded-md bg-gray-50 hover:bg-gray-100 flex justify-between items-start group';
      traitEl.dataset.originalIndex = traitData.originalIndex;

      const contentEl = document.createElement('div');
      contentEl.className = 'flex-grow mr-2 overflow-hidden';
      const processedDescription = window.app.processTraitString(traitData.desc || '', window.app.activeNPC); // Use 'desc'
      const previewDesc = processedDescription.length > 150 ? processedDescription.substring(0, 150) + '...' : processedDescription;
      contentEl.innerHTML = `<strong class="text-sm block overflow-hidden overflow-ellipsis whitespace-nowrap">${traitData.name || 'Unnamed Trait'}</strong><p class="text-xs text-gray-600">${previewDesc}</p>`;
      contentEl.title = `${traitData.name || 'Unnamed Trait'}\n${traitData.desc || ''}`; // Use 'desc'

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex-shrink-0 flex items-center';

      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = `&times;`;
      deleteBtn.className = 'ml-1 text-gray-400 hover:text-red-700 font-bold text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity';
      deleteBtn.title = `Delete ${traitData.name || 'Unnamed Trait'}`;

      deleteBtn.onclick = (e) => {
         e.stopPropagation();
         window.app.showConfirm(
            "Delete Trait?",
            `Are you sure you want to delete the trait "${traitData.name || 'Unnamed Trait'}" from this NPC?`,
            () => {
               const indexToDelete = parseInt(traitEl.dataset.originalIndex, 10);
               if (!isNaN(indexToDelete) && indexToDelete >= 0 && indexToDelete < window.app.activeNPC.traits.length) {
                  window.app.activeNPC.traits.splice(indexToDelete, 1);
                  this.renderNpcTraits(); // Use 'this'
                  window.viewport.updateViewport();
                  window.app.saveActiveBestiaryToDB();
               } else {
                  console.error("Error finding trait index for deletion.");
                  window.app.showAlert("Error deleting trait.");
               }
            }
         );
      };

      if (!shouldSort) {
         traitEl.draggable = true;
         traitEl.classList.add('cursor-grab');

         const dragHandle = document.createElement('span');
         dragHandle.innerHTML = '&#x2630;';
         dragHandle.className = 'cursor-grab text-gray-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity';
         dragHandle.title = "Drag to reorder";

         buttonContainer.insertBefore(dragHandle, deleteBtn);

         traitEl.addEventListener('dragstart', (e) => {
            if (!dragHandle.contains(e.target)) {
                e.preventDefault();
                return;
            }
            draggedElement = traitEl;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', traitData.originalIndex);
            setTimeout(() => traitEl.classList.add('opacity-50', 'bg-blue-100'), 0);
         });

         traitEl.addEventListener('dragend', () => {
            if (draggedElement) {
               draggedElement.classList.remove('opacity-50', 'bg-blue-100');
            }
            draggedElement = null;
            document.querySelectorAll('#npc-trait-list .drop-indicator-top, #npc-trait-list .drop-indicator-bottom').forEach(el => {
               el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
            });
         });

         traitEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedElement || draggedElement === traitEl) return;

            document.querySelectorAll('#npc-trait-list > div').forEach(el => {
               if (el !== traitEl) el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
            });

            const rect = traitEl.getBoundingClientRect();
            const isAbove = e.clientY < rect.top + rect.height / 2;

            traitEl.classList.toggle('drop-indicator-top', isAbove);
            traitEl.classList.toggle('drop-indicator-bottom', !isAbove);
            e.dataTransfer.dropEffect = "move";
         });

         traitEl.addEventListener('dragleave', (e) => {
            if (!traitEl.contains(e.relatedTarget)) {
               traitEl.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
            }
         });

         traitEl.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedElement || draggedElement === traitEl) return;

            const draggedOriginalIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const droppedOnOriginalIndex = parseInt(traitEl.dataset.originalIndex, 10);

            // Find CURRENT indices based on original indices
            const currentDraggedIndex = window.app.activeNPC.traits.findIndex(trait => trait === window.app.activeNPC.traits[draggedOriginalIndex]);
            let currentDroppedOnIndex = window.app.activeNPC.traits.findIndex(trait => trait === window.app.activeNPC.traits[droppedOnOriginalIndex]);


            if (currentDraggedIndex === -1 || currentDroppedOnIndex === -1) {
                console.error("Drag/Drop index error - couldn't find current indices from original indices.");
                traitEl.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
                return; // Prevent error
            }


            const isDroppingAbove = traitEl.classList.contains('drop-indicator-top');
            traitEl.classList.remove('drop-indicator-top', 'drop-indicator-bottom');

            const [movedItem] = window.app.activeNPC.traits.splice(currentDraggedIndex, 1);

            // Adjust insertion index based on removal
            let insertionIndex = currentDroppedOnIndex;
            if(currentDraggedIndex < currentDroppedOnIndex) {
               insertionIndex--; // Target index shifted down because item was removed before it
            }
            if (!isDroppingAbove) {
               insertionIndex++;
            }

            window.app.activeNPC.traits.splice(insertionIndex, 0, movedItem);

            this.renderNpcTraits(); // Use 'this'
            window.viewport.updateViewport();
            window.app.saveActiveBestiaryToDB();
         });
      } else {
          traitEl.draggable = false;
      }

      contentEl.addEventListener('click', () => {
         if (window.ui.newTraitName) window.ui.newTraitName.value = traitData.name || '';
         if (window.ui.newTraitDescription) window.ui.newTraitDescription.value = traitData.desc || ''; // Use 'desc'
      });


      traitEl.appendChild(contentEl);
      buttonContainer.appendChild(deleteBtn); // Append delete button to container
      traitEl.appendChild(buttonContainer); // Append container to main element
      window.ui.npcTraitList.appendChild(traitEl);
   });

   if (window.ui.npcTraitList) {
      window.ui.npcTraitList.addEventListener('dragleave', (e) => {
         if (!window.ui.npcTraitList.contains(e.relatedTarget)) {
            document.querySelectorAll('#npc-trait-list > div').forEach(el => {
               el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
            });
         }
      });
   }
}


function _renderActions() {
   const actionTypes = ['actions', 'bonus-actions', 'reactions', 'legendary-actions', 'lair-actions'];

   actionTypes.forEach(type => {
      const container = document.getElementById(`${type}-container`);
      if (!container) return;

      container.innerHTML = '';

      const items = window.app.activeNPC?.actions?.[type];
      if (!Array.isArray(items)) return;

      // Map items to include original index BEFORE sorting
      const itemsWithIndices = items.map((item, index) => ({ ...item, originalIndex: index }));

      let sortedItems = [...itemsWithIndices];
       if (type === 'actions') {
         // Special sort: Multiattack first, then alpha
         let multiattack = null;
         const otherItems = sortedItems.filter(item => {
            if (item && item.name && item.name.toLowerCase() === 'multiattack') {
               multiattack = item;
               return false;
            }
            return true;
         });
         otherItems.sort((a, b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
         sortedItems = multiattack ? [multiattack, ...otherItems] : otherItems;
      } else {
          // Standard alphabetical sort
          sortedItems.sort((a, b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
      }

      sortedItems.forEach(itemData => {
          if (!itemData) return;

         const listItem = document.createElement("li");
         listItem.className = "action-list-item p-3 rounded-lg border border-gray-300 group";
         listItem.dataset.actionType = type;
         // Store the ORIGINAL index stored in the dataset
         listItem.dataset.actionIndex = itemData.originalIndex;
         listItem.setAttribute("onclick", "window.app.editAction(this)");
         listItem.setAttribute("title", "Click to load this action back into the editor above.");

         const descPreview = (itemData.desc || '').length > 100 ? (itemData.desc || '').substring(0, 100) + '...' : (itemData.desc || '');

         listItem.innerHTML = `
            <div class="flex justify-between items-start">
               <p class="flex-grow text-sm mr-2 overflow-hidden">
                  <em class="font-bold action-name not-italic">${itemData.name || 'Unnamed Action'}</em>.
                  <span class="font-normal text-xs action-desc">${descPreview}</span>
               </p>
               <button onclick="window.ui.deleteAction(this, event)" class="flex-shrink-0 text-gray-400 hover:text-red-700 font-bold text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Action">&times;</button>
            </div>`;
         container.appendChild(listItem);
      });
   });
}


function _deleteAction(buttonElement, event) {
   event.stopPropagation(); // Prevent editAction from firing

   const listItem = buttonElement.closest('li.action-list-item');
   if (!listItem || !window.app.activeNPC) return;

   const type = listItem.dataset.actionType;
   // Get the ORIGINAL index stored in the dataset
   const indexToDelete = parseInt(listItem.dataset.actionIndex, 10);
   const actionName = listItem.querySelector('.action-name')?.textContent || 'this action';

   if (type && !isNaN(indexToDelete) && window.app.activeNPC.actions && Array.isArray(window.app.activeNPC.actions[type])) {
      // Find the item with the matching original index in the current array
      const currentItemIndex = window.app.activeNPC.actions[type].findIndex((item, idx) => {
         // Fallback for older data: check index if originalIndex is missing
         const itemIndex = item.originalIndex !== undefined ? item.originalIndex : idx;
         return itemIndex === indexToDelete;
      });


      window.app.showConfirm(
         "Delete Action?",
         `Are you sure you want to delete "${actionName}"?`,
         () => {
             // Use the *current* index found above for splicing
             if (currentItemIndex !== -1) {
                 window.app.activeNPC.actions[type].splice(currentItemIndex, 1);
                 this.renderActions(); // Re-render the list
                 window.viewport.updateViewport(); // Update preview
                 window.app.saveActiveBestiaryToDB(); // Save changes
                 window.app.clearInputs(); // Clear editor fields
             } else {
                 // Fallback check: Try deleting by the raw index if the originalIndex logic fails
                 // This handles data saved *before* the sorting fix
                 console.warn(`Could not find action by originalIndex ${indexToDelete}. Trying raw index.`);
                 if (window.app.activeNPC.actions[type][indexToDelete]) {
                     window.app.activeNPC.actions[type].splice(indexToDelete, 1);
                     this.renderActions();
                     window.viewport.updateViewport();
                     window.app.saveActiveBestiaryToDB();
                     window.app.clearInputs();
                 } else {
                     console.error("Could not find the current index for action deletion:", indexToDelete);
                     window.app.showAlert("Error deleting action: Could not find action to delete.");
                 }
             }
         }
      );
   } else {
       console.error("Could not delete action, invalid data:", { type, indexToDelete });
       window.app.showAlert("Error deleting action: Could not find action data.");
   }
}


function _populateSavedTraitsDatalist() {
   if (!window.ui.savedTraitList) return;
   window.ui.savedTraitList.innerHTML = '';
   const savedTraits = window.app.activeBestiary?.metadata?.savedTraits;
   if (!Array.isArray(savedTraits)) return;

   savedTraits.forEach(trait => {
      if (trait?.name) {
         const option = document.createElement('option');
         option.value = trait.name;
         window.ui.savedTraitList.appendChild(option);
      }
   });
}

function _showManageTraitsModal() {
   if (!window.app.activeBestiary || !window.ui.manageTraitsModal || !window.ui.managedTraitListDiv) return;

   window.ui.managedTraitListDiv.innerHTML = '';
   const savedTraits = window.app.activeBestiary.metadata.savedTraits || [];

   if (savedTraits.length === 0) {
      window.ui.managedTraitListDiv.innerHTML = '<p class="text-gray-500 text-center">No saved traits.</p>';
   } else {
      savedTraits.sort((a,b) => (a?.name || '').localeCompare(b?.name || '')).forEach(trait => {
         if (!trait?.name) return;
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
            this.deleteSavedTrait(trait.name); // Use 'this'
         };

         traitEl.appendChild(nameSpan);
         traitEl.appendChild(deleteBtn);
         window.ui.managedTraitListDiv.appendChild(traitEl);
      });
   }
   window.app.openModal('manage-traits-modal');
   if (window.ui.modalTraitName) window.ui.modalTraitName.focus();
}

function _addNewSavedTrait() {
   if (!window.ui.modalTraitName || !window.ui.modalTraitDescription || !window.app.activeBestiary) return;
   const name = window.ui.modalTraitName.value.trim();
   const description = window.ui.modalTraitDescription.value.trim();
   if (!name) {
      window.app.showAlert("Saved trait name cannot be empty.");
      return;
   }
   if (!description) {
      window.app.showAlert("Saved trait description cannot be empty.");
      return;
   }

   if (!window.app.activeBestiary.metadata.savedTraits) {
      window.app.activeBestiary.metadata.savedTraits = [];
   }
   const savedTraits = window.app.activeBestiary.metadata.savedTraits;

   if (savedTraits.some(t => t?.name?.toLowerCase() === name.toLowerCase())) {
      window.app.showAlert(`A saved trait named "${name}" already exists.`);
      return;
   }

   savedTraits.push({ name, description }); // Store with 'description' key
   window.ui.modalTraitName.value = '';
   window.ui.modalTraitDescription.value = '';

   this.showManageTraitsModal(); // Use 'this'
   this.populateSavedTraitsDatalist(); // Use 'this'
   window.app.saveActiveBestiaryToDB();
}

function _deleteSavedTrait(traitName) {
   if (!window.app.activeBestiary || !window.app.activeBestiary.metadata.savedTraits || !traitName) return;

   window.app.showConfirm(
      "Delete Saved Trait?",
      `Are you sure you want to permanently delete the saved trait "${traitName}"? This cannot be undone.`,
      () => {
         const metadata = window.app.activeBestiary.metadata;
         metadata.savedTraits = metadata.savedTraits.filter(t => t?.name !== traitName);

         this.showManageTraitsModal(); // Use 'this'
         this.populateSavedTraitsDatalist(); // Use 'this'
         window.app.saveActiveBestiaryToDB();
      }
   );
}

function _parseHpStringToModal() {
   if (!window.ui.inputs.hitPoints || !window.ui.hpDiceString) return;
   const hpString = window.ui.inputs.hitPoints.value || "";
   const match = hpString.match(/\((.*?)\)|^\s*(\d+)\s*$/);

   if (match) {
      window.ui.hpDiceString.value = (match[1] || match[2] || '').trim();
   } else {
      window.ui.hpDiceString.value = '';
   }
}

function _populateDamageTypes(elementId) {
   const select = document.getElementById(elementId);
   if (select) {
      const currentValue = select.value; // Store current value before clearing
      select.innerHTML = ''; // Clear existing options
      window.app.damageTypes.forEach(type => {
         const option = document.createElement('option');
         option.value = type.toLowerCase();
         // Capitalize first letter for display
         option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
         select.appendChild(option);
      });
      // Restore previous value if it's still valid, otherwise default
      if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
          select.value = currentValue;
      } else if (elementId === 'attack-damage-type') {
         // Default primary attack damage type if none was selected or invalid
         select.value = 'slashing';
      }
   }
}

function _updateCameraTokenDisplay() {
   if (!window.ui.cameraTokenBox) return;
   window.ui.cameraTokenBox.innerHTML = ''; // Clear previous content

   let title = "Click or Drag a Camera Token Here"; // Default
   if (window.app.activeNPC && window.app.activeNPC.cameraTokenInfo) {
      const info = window.app.activeNPC.cameraTokenInfo;
      let format = (info.format || 'unknown').replace('image/', '').toLowerCase();
      let quality = (info.quality !== null) ? ` (${info.quality}% quality).` : '';
      title = `${info.width}x${info.height} ${format}${quality}\nClick or Drag to change camera token.`;
   }
   window.ui.cameraTokenBox.title = title;

   if (window.app.activeNPC && window.app.activeNPC.cameraToken) {
      const img = document.createElement('img');
      img.src = window.app.activeNPC.cameraToken;
      img.className = 'w-full h-full object-contain';
      window.ui.cameraTokenBox.appendChild(img);
   } else {
      const placeholder = document.createElement('span');
      placeholder.textContent = 'Click or Drag a Camera Token Here';
      window.ui.cameraTokenBox.appendChild(placeholder);
   }
}

// --- Assign functions to window.ui object ---
// Make sure this runs AFTER ui-elements.js has defined window.ui
if (window.ui) {
   window.ui.showNewBestiaryModal = _showNewBestiaryModal;
   window.ui.hideAllModals = _hideAllModals;
   window.ui.updateMenuState = _updateMenuState;
   window.ui.updateUIForActiveBestiary = _updateUIForActiveBestiary;
   window.ui.updateNpcSelector = _updateNpcSelector;
   window.ui.populateLanguageListbox = _populateLanguageListbox;
   window.ui.updateFormFromActiveNPC = _updateFormFromActiveNPC;
   window.ui.updateSpellcastingVisibility = _updateSpellcastingVisibility;
   window.ui.updateStatDisplays = _updateStatDisplays;
   window.ui.updateSkillDisplays = _updateSkillDisplays;
   window.ui.updateTokenDisplay = _updateTokenDisplay;
   window.ui.updateImageDisplay = _updateImageDisplay;
   window.ui.populateChallengeDropdown = _populateChallengeDropdown;
   window.ui.populateCasterLevelDropdown = _populateCasterLevelDropdown;
   window.ui.showLoadBestiaryModal = _showLoadBestiaryModal;
   window.ui.showManageGroupsModal = _showManageGroupsModal;
   window.ui.showSettingsModal = _showSettingsModal;
   window.ui.deleteGroup = _deleteGroup;
   window.ui.addNewGroup = _addNewGroup;
   window.ui.showManageLanguagesModal = _showManageLanguagesModal;
   window.ui.addNewLanguage = _addNewLanguage;
   window.ui.deleteLanguage = _deleteLanguage;
   window.ui.addOrUpdateNpcTrait = _addOrUpdateNpcTrait;
   window.ui.renderNpcTraits = _renderNpcTraits;
   window.ui.renderActions = _renderActions;
   window.ui.deleteAction = _deleteAction;
   window.ui.populateSavedTraitsDatalist = _populateSavedTraitsDatalist;
   window.ui.showManageTraitsModal = _showManageTraitsModal;
   window.ui.addNewSavedTrait = _addNewSavedTrait;
   window.ui.deleteSavedTrait = _deleteSavedTrait;
   window.ui.parseHpStringToModal = _parseHpStringToModal;
   window.ui.openCardAndHandleSoloMode = _openCardAndHandleSoloMode;
   window.ui.enforceSoloMode = _enforceSoloMode; // NEW: Assign to window.ui
   window.ui.openFgExportModal = _openFgExportModal;
   window.ui.populateDamageTypes = _populateDamageTypes;
   window.ui.updateCameraTokenDisplay = _updateCameraTokenDisplay;
} else {
   console.error("window.ui object not found! Ensure ui-elements.js loads before ui-updates.js.");
}