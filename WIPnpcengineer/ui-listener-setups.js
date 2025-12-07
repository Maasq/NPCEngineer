// ui-listener-setups.js

// --- Define Listener Setup Functions (private scope) ---

function _setupCustomToggles() {
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
               customInput.value = select.value;
               customInput.focus();
            } else {
               customInput.value = '';
            }
            window.app.updateActiveNPCFromForm();
         });
         customInput.addEventListener('input', window.app.updateActiveNPCFromForm);
      }
   });
}

function _setupSavingThrowListeners() {
   const abilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
   abilities.forEach(ability => {
      const profCheckbox = document.getElementById(`npc-${ability}-saving-throw-prof`);
      const adjustInput = document.getElementById(`npc-${ability}-saving-throw-adjust`);
      if (profCheckbox) profCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);
      if (adjustInput) adjustInput.addEventListener('input', window.app.updateActiveNPCFromForm);
   });
}

function _setupSkillListeners() {
   document.querySelectorAll('.skill-row').forEach(row => {
      const profCheckbox = row.querySelector('.skill-prof');
      const expCheckbox = row.querySelector('.skill-exp');
      const adjustInput = row.querySelector('.skill-adjust');

      if (profCheckbox) profCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);
      if (adjustInput) adjustInput.addEventListener('input', window.app.updateActiveNPCFromForm);

      if (expCheckbox) {
         expCheckbox.addEventListener('input', () => {
            if (expCheckbox.checked && profCheckbox && !profCheckbox.checked) {
               profCheckbox.checked = true;
            }
            window.app.updateActiveNPCFromForm();
         });
      }
   });
}

function _setupResistanceListeners() {
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
}

function _setupWeaponModifierListeners() {
   document.querySelectorAll('input[name="weapon-resistance"]').forEach(radio => {
      radio.addEventListener('input', window.app.updateActiveNPCFromForm);
   });
   document.querySelectorAll('input[name="weapon-immunity"]').forEach(radio => {
      radio.addEventListener('input', window.app.updateActiveNPCFromForm);
   });
}

function _setupConditionImmunityListeners() {
   window.app.conditions.forEach(condition => {
      const checkbox = document.getElementById(`ci-${condition}`);
      if (checkbox) checkbox.addEventListener('input', window.app.updateActiveNPCFromForm);
   });
}

function _setupLanguageListeners() {
   window.ui.languageListboxes.forEach(listbox => {
      if (listbox) listbox.addEventListener('change', window.app.updateActiveNPCFromForm);
   });
   const telepathyCheckbox = document.getElementById('npc-has-telepathy');
   const telepathyRangeInput = document.getElementById('npc-telepathy-range');
   const specialOptionSelect = document.getElementById('npc-special-language-option');

   if (telepathyCheckbox) telepathyCheckbox.addEventListener('input', window.app.updateActiveNPCFromForm);
   if (telepathyRangeInput) telepathyRangeInput.addEventListener('input', window.app.updateActiveNPCFromForm);
   if (specialOptionSelect) specialOptionSelect.addEventListener('input', window.app.updateActiveNPCFromForm);

   if (window.ui.manageLanguagesBtn) window.ui.manageLanguagesBtn.addEventListener('click', window.ui.showManageLanguagesModal.bind(window.ui));
   if (window.ui.addLanguageBtn) window.ui.addLanguageBtn.addEventListener('click', window.ui.addNewLanguage.bind(window.ui));
   if (window.ui.newLanguageNameInput) {
      window.ui.newLanguageNameInput.addEventListener('keyup', (e) => {
         if (e.key === 'Enter') {
            window.ui.addNewLanguage();
         }
      });
   }
}

function _setupTraitListeners() {
   if (window.ui.addTraitBtn) window.ui.addTraitBtn.addEventListener('click', window.ui.addOrUpdateNpcTrait.bind(window.ui));
   if (window.ui.manageTraitsBtn) window.ui.manageTraitsBtn.addEventListener('click', window.ui.showManageTraitsModal.bind(window.ui));
   if (window.ui.addManagedTraitBtn) window.ui.addManagedTraitBtn.addEventListener('click', window.ui.addNewSavedTrait.bind(window.ui));

   if (window.ui.sortTraitsAlphaCheckbox) {
      window.ui.sortTraitsAlphaCheckbox.addEventListener('input', () => {
         if (window.app.activeNPC) {
            window.app.activeNPC.sortTraitsAlpha = window.ui.sortTraitsAlphaCheckbox.checked;
            window.ui.renderNpcTraits();
            window.viewport.updateViewport();
            window.app.saveActiveBestiaryToDB();
         }
      });
   }
   if (window.ui.newTraitName) {
      window.ui.newTraitName.addEventListener('input', (e) => {
         const traitName = e.target.value;
         const savedTraits = window.app.activeBestiary?.metadata?.savedTraits || [];
         const matchedTrait = savedTraits.find(t => t?.name === traitName);
         if (matchedTrait && window.ui.newTraitDescription) {
            window.ui.newTraitDescription.value = matchedTrait.desc || '';
         }
      });
   }

   if (window.ui.modalTokenButtons) {
      window.ui.modalTokenButtons.addEventListener('click', (e) => {
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

         const textarea = window.ui.modalTraitDescription;
         if (!textarea) return;
         const start = textarea.selectionStart;
         const end = textarea.selectionEnd;
         const text = textarea.value;

         textarea.value = text.substring(0, start) + finalToken + text.substring(end);
         textarea.selectionStart = textarea.selectionEnd = start + finalToken.length;
         textarea.focus();
      });
   }
}

function _setupActionListeners() {
   if (window.ui.clearEditBtn) window.ui.clearEditBtn.addEventListener('click', window.app.clearInputs);
   if (window.ui.legendaryBoilerplate) window.ui.legendaryBoilerplate.addEventListener('dblclick', () => window.app.editBoilerplate(window.ui.legendaryBoilerplate));
   if (window.ui.lairBoilerplate) window.ui.lairBoilerplate.addEventListener('dblclick', () => window.app.editBoilerplate(window.ui.lairBoilerplate));
   if (window.ui.inputs.commonDesc) window.ui.inputs.commonDesc.addEventListener('dblclick', () => window.app.handleAttackHelperOpen());

   document.querySelectorAll('button[data-action-type]').forEach(button => {
      button.addEventListener('click', () => {
         window.app.addOrUpdateAction(button.dataset.actionType);
      });
   });

   const attackHelperModal = document.getElementById('attack-helper-modal');
   if (attackHelperModal) {
      const primaryBtn = attackHelperModal.querySelector('button.btn-primary');
      const cancelBtn = attackHelperModal.querySelector('button.btn-secondary:not(.btn-xs)');
      const addDamageBtn = attackHelperModal.querySelector('button.btn-secondary.btn-xs');
      if (primaryBtn) primaryBtn.addEventListener('click', window.app.generateAttackString);
      if (cancelBtn) cancelBtn.addEventListener('click', () => window.app.closeModal('attack-helper-modal'));
      if (addDamageBtn) addDamageBtn.addEventListener('click', window.app.addDamageRow);
      if (window.ui.attackDamageDiceClearBtn) {
         window.ui.attackDamageDiceClearBtn.addEventListener('click', () => {
             if (window.ui.inputs.attackDamageDice) window.ui.inputs.attackDamageDice.value = '';
         });
      }
   }

   const boilerplateModal = document.getElementById('boilerplate-modal');
   if(boilerplateModal) {
       const primaryBtn = boilerplateModal.querySelector('button.btn-primary');
       const cancelBtn = boilerplateModal.querySelector('button.btn-secondary');
       if (primaryBtn) primaryBtn.addEventListener('click', window.app.saveBoilerplate);
       if (cancelBtn) cancelBtn.addEventListener('click', () => window.app.closeModal('boilerplate-modal'));
   }

   const primaryDiceSelector = document.getElementById('primary-dice-selector');
   const attackDamageDiceInput = document.getElementById('attack-damage-dice');
   if (primaryDiceSelector && attackDamageDiceInput) {
      window.app.createDiceSelector(primaryDiceSelector, attackDamageDiceInput);
   }
}

function _setupDragAndDrop(box, validTypes, npcKey, updateFn) {
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
      const file = e.dataTransfer?.files?.[0];
      if (file && validTypes.includes(file.type)) {
         const reader = new FileReader();
         reader.onload = async (ev) => {
            try {
               const options = {
                  outputFormat: window.app.settingConvertWebp ? 'image/webp' : file.type,
                  quality: window.app.settingWebpQuality || 80,
               };
               
               if (npcKey === 'token' && window.app.settingResizeToken) {
                  const size = window.app.settingTokenSize || 300;
                  options.maxWidth = size;
                  options.maxHeight = size;
               } else if (npcKey === 'image' && window.app.settingResizePortrait) {
                  options.maxWidth = window.app.settingPortraitMaxWidth || 1000;
                  options.maxHeight = window.app.settingPortraitMaxHeight || 1000;
               }
               
               const processResult = await window.graphicsUtils.processImage(ev.target.result, options);
               window.app.activeNPC[npcKey] = processResult.dataUrl;
               window.app.activeNPC[`${npcKey}Info`] = {
                  width: processResult.width,
                  height: processResult.height,
                  format: processResult.format,
                  quality: processResult.quality
               };

            } catch (error) {
               console.error(`Error processing ${npcKey} image:`, error);
               window.app.showAlert(`Error processing ${npcKey} image. Saving original.`);
               window.app.activeNPC[npcKey] = ev.target.result;
               window.app.activeNPC[`${npcKey}Info`] = null;
            }
            
            updateFn();
            window.app.saveActiveBestiaryToDB();
         };
         reader.readAsDataURL(file);
      } else if (file) {
         console.warn("Invalid file type dropped:", file.type);
         window.app.showAlert(`Invalid file type. Please drop one of: ${validTypes.join(', ')}`);
      }
   });
}

function _setupClipboardModalListeners() {
   if (window.ui.manageClipboardBtn) {
      window.ui.manageClipboardBtn.addEventListener('click', () => {
         if (window.app.openClipboardModal) {
            window.app.openClipboardModal();
         }
      });
   }

   if (window.ui.clipboardCancelBtn) {
      window.ui.clipboardCancelBtn.addEventListener('click', () => {
         if (window.app.closeModal) {
            window.app.closeModal('clipboard-modal');
         }
      });
   }

   if (window.ui.clipboardProcessBtn) {
      window.ui.clipboardProcessBtn.addEventListener('click', () => {
         if (window.app.processAndPasteFromClipboardModal) {
            window.app.processAndPasteFromClipboardModal();
         }
      });
   }

   if (window.ui.clipboardClearBtn) {
      window.ui.clipboardClearBtn.addEventListener('click', () => {
         if (window.ui.clipboardTextArea) {
            window.ui.clipboardTextArea.value = '';
            window.ui.clipboardTextArea.focus();
         }
      });
   }

   if (window.ui.bestiaryPickOutTitles) {
      window.ui.bestiaryPickOutTitles.addEventListener('change', () => {
         if (window.app.activeBestiary) {
            window.app.activeBestiary.metadata.pickOutTitles = window.ui.bestiaryPickOutTitles.checked;
            window.app.saveActiveBestiaryToDB();
         }
      });
   }

   if (window.ui.clipboardTextArea) {
      window.ui.clipboardTextArea.addEventListener('keydown', (e) => {
         if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
            e.preventDefault();
            const textArea = window.ui.clipboardTextArea;
            const start = textArea.selectionStart;
            const end = textArea.selectionEnd;
            if (start !== end && window.importCleaner?.joinSelectedLines) {
               const selectedText = textArea.value.substring(start, end);
               const joinedText = window.importCleaner.joinSelectedLines(selectedText);
               textArea.value = textArea.value.substring(0, start) + joinedText + textArea.value.substring(end);
               textArea.selectionStart = start;
               textArea.selectionEnd = start + joinedText.length;
            }
         }
         else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            const textArea = window.ui.clipboardTextArea;
            const start = textArea.selectionStart;
            const end = textArea.selectionEnd;
            if (start !== end && window.importCleaner?.cycleSelectedTextCase) {
               const selectedText = textArea.value.substring(start, end);
               const cycledText = window.importCleaner.cycleSelectedTextCase(selectedText);
               textArea.value = textArea.value.substring(0, start) + cycledText + textArea.value.substring(end);
               textArea.selectionStart = start;
               textArea.selectionEnd = start + cycledText.length;
            }
         }
      });
   }
}

function _setupSettingsListeners() {
   if (window.ui.inputs.settingConvertWebp) {
      window.ui.inputs.settingConvertWebp.addEventListener('change', (e) => window.app.setConvertWebp(e.target.checked));
   }
   if (window.ui.inputs.settingResizePortrait) {
      window.ui.inputs.settingResizePortrait.addEventListener('change', (e) => window.app.setResizePortrait(e.target.checked));
   }
   if (window.ui.inputs.settingResizeToken) {
      window.ui.inputs.settingResizeToken.addEventListener('change', (e) => window.app.setResizeToken(e.target.checked));
   }
   if (window.ui.inputs.settingResizeCameraToken) {
      window.ui.inputs.settingResizeCameraToken.addEventListener('change', (e) => window.app.setResizeCameraToken(e.target.checked));
   }
   
   if (window.ui.inputs.settingWebpQuality) {
      window.ui.inputs.settingWebpQuality.addEventListener('input', (e) => window.app.setWebpQuality(e.target.value));
   }
   if (window.ui.inputs.settingPortraitMaxWidth) {
      window.ui.inputs.settingPortraitMaxWidth.addEventListener('input', (e) => window.app.setPortraitMaxWidth(e.target.value));
   }
   if (window.ui.inputs.settingPortraitMaxHeight) {
      window.ui.inputs.settingPortraitMaxHeight.addEventListener('input', (e) => window.app.setPortraitMaxHeight(e.target.value));
   }
   if (window.ui.inputs.settingTokenSize) {
      window.ui.inputs.settingTokenSize.addEventListener('input', (e) => window.app.setTokenSize(e.target.value));
   }
   if (window.ui.inputs.settingCameraTokenMaxWidth) {
      window.ui.inputs.settingCameraTokenMaxWidth.addEventListener('input', (e) => window.app.setCameraTokenMaxWidth(e.target.value));
   }
   if (window.ui.inputs.settingCameraTokenMaxHeight) {
      window.ui.inputs.settingCameraTokenMaxHeight.addEventListener('input', (e) => window.app.setCameraTokenMaxHeight(e.target.value));
   }
   if (window.ui.settingLoadRecentBestiary) {
       window.ui.settingLoadRecentBestiary.addEventListener('change', (e) => window.app.setLoadRecentBestiary(e.target.checked));
   }
   if (window.ui.menuThemeToggle) {
      window.ui.menuThemeToggle.addEventListener('click', (e) => {
         e.preventDefault();
         if (window.app.toggleTheme) {
            window.app.toggleTheme();
         }
         // Close the menu after selection
         if (window.ui.mainMenu) window.ui.mainMenu.classList.add('hidden');
      });
   }
}


// --- Assign functions to window.ui object ---
// Make sure this runs AFTER ui-elements.js has defined window.ui
if (window.ui) {
   window.ui.setupCustomToggles = _setupCustomToggles;
   window.ui.setupSavingThrowListeners = _setupSavingThrowListeners;
   window.ui.setupSkillListeners = _setupSkillListeners;
   window.ui.setupResistanceListeners = _setupResistanceListeners;
   window.ui.setupWeaponModifierListeners = _setupWeaponModifierListeners;
   window.ui.setupConditionImmunityListeners = _setupConditionImmunityListeners;
   window.ui.setupLanguageListeners = _setupLanguageListeners;
   window.ui.setupTraitListeners = _setupTraitListeners;
   window.ui.setupActionListeners = _setupActionListeners;
   window.ui.setupClipboardModalListeners = _setupClipboardModalListeners;
   window.ui.setupDragAndDrop = _setupDragAndDrop;
   window.ui.setupSettingsListeners = _setupSettingsListeners;
   // Removed _setupFgExportModalListeners as it is now handled by export-fg.js
} else {
   console.error("window.ui object not found! Ensure ui-elements.js loads before ui-listener-setups.js.");
}