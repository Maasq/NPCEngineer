// export-fg.js

// 1. Create the main exporter object
window.fgExporter = {
   // --- Properties ---
   // (No properties needed at this stage)

   // --- Initialization ---
   init() {
      // This function will be called by main.js
      // We'll add event listeners here
      this.setupEventListeners();
   },

   /**
    * Opens the FG Export modal and pre-fills it with stored or default data.
    */
   openExportModal() {
      const { activeBestiary } = window.app;
      const {
         fgBestiaryTitle,
         fgBestiaryAuthor,
         fgBestiaryFilename,
         fgBestiaryDisplayname,
         fgCoverImage,
         fgModLock,
         fgGMonly
      } = activeBestiary.metadata || {};

      const {
         inputs,
         fgExportModal,
         fgCoverImageEl,
         fgCoverClearBtn,
      } = window.ui;

      if (!fgExportModal) {
         console.error("FG Export Modal element not found!");
         return;
      }

      // 1. Pre-fill text inputs
      const defaultTitle = activeBestiary.projectName || "New Bestiary";
      inputs.fgBestiaryTitle.value = fgBestiaryTitle || defaultTitle;
      inputs.fgBestiaryAuthor.value = fgBestiaryAuthor || "";
      inputs.fgBestiaryFilename.value = fgBestiaryFilename || defaultTitle;
      inputs.fgBestiaryDisplayname.value = fgBestiaryDisplayname || "";

      // 2. Pre-fill checkbox and radios
      inputs.fgModLock.checked = fgModLock ?? false; // Default to false (unchecked)
      
      const isGMOnly = fgGMonly ?? true; // Default to true (GM View Only)
      inputs.fgGmView.checked = isGMOnly;
      inputs.fgPlayerView.checked = !isGMOnly;

      // 3. Pre-fill cover image
      if (fgCoverImageEl) {
         fgCoverImageEl.innerHTML = ''; // Clear previous
         if (fgCoverImage) {
            const img = document.createElement('img');
            img.src = fgCoverImage;
            img.className = 'w-full h-full object-contain';
            fgCoverImageEl.appendChild(img);
         } else {
            const placeholder = document.createElement('span');
            placeholder.textContent = 'Click or Drag a Cover Image Here';
            fgCoverImageEl.appendChild(placeholder);
         }
      }
      
      // 4. Show/Hide clear button
      if (fgCoverClearBtn) {
         fgCoverClearBtn.classList.toggle('hidden', !fgCoverImage);
      }

      // 5. Open the modal
      window.app.openModal('fg-export-modal');
   },

   // --- NEW ---
   /**
    * Saves settings, generates the main XML, and displays it in the test modal.
    */
   async saveSettingsAndExport() {
      const { activeBestiary } = window.app;
      const { inputs } = window.ui;

      if (!activeBestiary) {
         window.app.showAlert("Error: No active bestiary to export.");
         return;
      }

      // 1. Validate inputs
      const title = inputs.fgBestiaryTitle.value.trim();
      const filename = inputs.fgBestiaryFilename.value.trim();
      const pattern = /^[a-zA-Z0-9 ]*$/;
      
      if (!title || !pattern.test(title)) {
         window.app.showAlert("Invalid Bestiary Title. Please use only letters, numbers, and spaces.");
         inputs.fgBestiaryTitle.focus();
         return;
      }
      if (!filename || !pattern.test(filename)) {
         window.app.showAlert("Invalid Bestiary Filename. Please use only letters, numbers, and spaces.");
         inputs.fgBestiaryFilename.focus();
         return;
      }

      // 2. Save settings to metadata
      const settings = {
         title: title,
         author: inputs.fgBestiaryAuthor.value.trim(),
         filename: filename,
         displayName: inputs.fgBestiaryDisplayname.value.trim(),
         isLocked: inputs.fgModLock.checked,
         isGmOnly: inputs.fgGmView.checked,
         coverImage: activeBestiary.metadata.fgCoverImage, // Already saved by image handler
         moduleName: this._cleanId(title) // Generate the <library> tag name
      };

      activeBestiary.metadata.fgBestiaryTitle = settings.title;
      activeBestiary.metadata.fgBestiaryAuthor = settings.author;
      activeBestiary.metadata.fgBestiaryFilename = settings.filename;
      activeBestiary.metadata.fgBestiaryDisplayname = settings.displayName;
      activeBestiary.metadata.fgModLock = settings.isLocked;
      activeBestiary.metadata.fgGMonly = settings.isGmOnly;

      // 3. Save the entire bestiary (with new metadata) back to Dexie
      await window.app.saveActiveBestiaryToDB();

      // 4. Close the modal
      window.ui.hideAllModals();

      // 5. Generate the XML (DEBUG MODE)
      try {
         let rawHtml = "";
         if (window.app.activeNPC) {
            rawHtml = "\n";
            rawHtml += "\n\n";
            
            // Get the description
            let content = window.app.activeNPC.description || "";
            
            // Apply the separate cleaner function
            content = this._cleanDebugHtml(content);
            
            rawHtml += content || "(No description entered)";
         } else {
            rawHtml = "";
         }
         
         // 6. Display Raw HTML in the test modal
         this.showExportOutputForTesting(rawHtml);
         
      } catch (error) {
         console.error("Error during XML generation:", error);
         window.app.showAlert(`An error occurred during XML generation: ${error.message}`);
      }
   },

   /**
    * Temporary debug cleaner.
    * Removes block comments and translates Trix HTML tags using replaceAll.
    * @param {string} html The input HTML string.
    * @returns {string} The cleaned string.
    */
   _cleanDebugHtml(html) {
      if (!html) return "";
      
      // Step 1: Remove comment (two-step replacement)
      let cleaned = html.replaceAll("--block--", "TooDamnHard");
      cleaned = cleaned.replaceAll("<!TooDamnHard>", "");

      // Step 2: Translate Trix HTML tags to FG-compatible XML tags
      cleaned = cleaned.replaceAll("<em>", "<i>");
      cleaned = cleaned.replaceAll("</em>", "</i>");
      cleaned = cleaned.replaceAll("<strong>", "<b>");
      cleaned = cleaned.replaceAll("</strong>", "</b>");
      cleaned = cleaned.replaceAll("<h1>", "<h>");
      cleaned = cleaned.replaceAll("</h1>", "</h>");
      cleaned = cleaned.replaceAll("<blockquote>", "<frame>");
      cleaned = cleaned.replaceAll("</blockquote>", "</frame>");
      cleaned = cleaned.replaceAll("<ul>", "<list>");
      cleaned = cleaned.replaceAll("</ul>", "</list>");
      cleaned = cleaned.replaceAll("<ol>", "<list>");
      cleaned = cleaned.replaceAll("</ol>", "</list>");
      
      // Step 3: Paragraphs and Breaks
      cleaned = cleaned.replaceAll("<div>", "<p>");
      cleaned = cleaned.replaceAll("</div>", "</p>");
      // Added newline after &#13; as requested
      cleaned = cleaned.replaceAll("<br>", "&#13;\n");
      
      // Step 4: Readability Newlines
      cleaned = cleaned.replaceAll("</frame>", "</frame>\n");
      cleaned = cleaned.replaceAll("</p>", "</p>\n");
      cleaned = cleaned.replaceAll("</h>", "</h>\n");
      cleaned = cleaned.replaceAll("<list>", "<list>\n");
      cleaned = cleaned.replaceAll("</li>", "</li>\n");
      cleaned = cleaned.replaceAll("</list>", "</list>\n");

      return cleaned;
   },

   /**
    * Handles the selection or dropping of a new cover image.
    * @param {File} file The image file (PNG).
    */
   async handleCoverImage(file) {
      if (!file || file.type !== 'image/png') {
         window.app.showAlert("Invalid file type. Please select a PNG image.");
         return;
      }

      try {
         const resizedDataUrl = await window.graphicsUtils.processImage(file, { 
            maxWidth: 100, 
            maxHeight: 100, 
            outputFormat: 'image/png' 
         });
         
         if (window.app.activeBestiary) {
            window.app.activeBestiary.metadata.fgCoverImage = resizedDataUrl.dataUrl;
         }
         
         const { fgCoverImageEl, fgCoverClearBtn } = window.ui;
         if (fgCoverImageEl) {
            fgCoverImageEl.innerHTML = '';
            const img = document.createElement('img');
            img.src = resizedDataUrl.dataUrl;
            img.className = 'w-full h-full object-contain';
            fgCoverImageEl.appendChild(img);
         }
         if (fgCoverClearBtn) {
            fgCoverClearBtn.classList.remove('hidden');
         }

      } catch (error) {
         console.error("Error resizing image:", error);
         window.app.showAlert("An error occurred while processing the image.");
      }
   },

   /**
    * Clears the cover image from the modal and metadata.
    */
   clearCoverImage() {
      if (window.app.activeBestiary) {
         window.app.activeBestiary.metadata.fgCoverImage = null;
      }
      
      const { fgCoverImageEl, fgCoverClearBtn } = window.ui;
      if (fgCoverImageEl) {
         fgCoverImageEl.innerHTML = '<span>Click or Drag a Cover Image Here</span>';
      }
      if (fgCoverClearBtn) {
         fgCoverClearBtn.classList.add('hidden');
      }
      
      if (window.ui.inputs.fgCoverUpload) {
         window.ui.inputs.fgCoverUpload.value = null;
      }
   },

   /**
    * [TEMPORARY TEST FUNCTION]
    * Repurposes the Import Modal to display a string.
    * @param {string} outputText The text to display.
    */
   showExportOutputForTesting(outputText) {
      const {
         importModal,
         importPaneRaw,
         importPaneFiltered,
         importTextArea,
         importFilterSelect,
         importCancelBtn,
         importConfirmBtn,
         importToggleViewBtn,
         importClearBtn
      } = window.ui;

      if (!importModal || !importPaneFiltered || !importTextArea) {
         console.error("Cannot show test output: Import modal elements not found.");
         window.app.showAlert(outputText); // Fallback to alert
         return;
      }

      // 1. Open the modal
      window.app.openModal('import-modal');

      // 2. Change the title
      const modalTitle = document.getElementById('import-modal')?.querySelector('h3');
      if (modalTitle) {
         modalTitle.textContent = `DEBUG: Raw Trix Output`;
      }

      // 3. Hide all the import-specific UI
      if (importPaneRaw) importPaneRaw.classList.add('hidden');
      if (importFilterSelect) importFilterSelect.parentElement.parentElement.classList.add('hidden');
      if (importConfirmBtn) importConfirmBtn.classList.add('hidden');
      if (importToggleViewBtn) importToggleViewBtn.classList.add('hidden');
      if (importClearBtn) importClearBtn.classList.add('hidden');
      
      // 4. Repurpose the 'Filtered' pane
      if (importPaneFiltered) {
         importPaneFiltered.classList.remove('hidden');
         if (importPaneFiltered.parentElement) {
            importPaneFiltered.parentElement.classList.remove('w-1/2');
            importPaneFiltered.parentElement.classList.add('w-full');
         }
         const filteredLabel = importPaneFiltered.querySelector('label');
         if (filteredLabel) filteredLabel.textContent = "Raw HTML Content";
      }
      
      // 5. Hide the preview viewport
      const viewportPane = document.getElementById('import-viewport')?.parentElement;
      if (viewportPane) viewportPane.classList.add('hidden');

      // 6. Set the text and update the 'Cancel' button
      importTextArea.value = outputText;
      importTextArea.scrollTop = 0; // Scroll to top
      if (importCancelBtn) importCancelBtn.textContent = "Close";
      
      // 7. Re-bind cancel button to close modal and reset modal title/buttons
      importCancelBtn.onclick = () => {
         window.app.closeModal('import-modal');
         // Reset modal to its original import state
         if (modalTitle) modalTitle.textContent = "Import NPC from Text";
         if (importPaneFiltered.parentElement) {
            importPaneFiltered.parentElement.classList.add('w-1/2');
            importPaneFiltered.parentElement.classList.remove('w-full');
         }
         if (viewportPane) viewportPane.classList.remove('hidden');
         if (importFilterSelect) importFilterSelect.parentElement.parentElement.classList.remove('hidden');
         if (importConfirmBtn) importConfirmBtn.classList.remove('hidden');
         if (importToggleViewBtn) importToggleViewBtn.classList.remove('hidden');
         if (importClearBtn) importClearBtn.classList.remove('hidden');
         if (importCancelBtn) importCancelBtn.textContent = "Cancel";
         // Re-bind original listener (from importer.js)
         if (importCancelBtn) importCancelBtn.onclick = () => window.importer.closeImportModal();
      };
   },
   
   /**
    * Sets up all event listeners for the FG Export Modal.
    */
   setupEventListeners() {
      const {
         fgExportCancelBtn,
         fgExportSaveBtn,
         fgCoverImageEl,
         fgCoverClearBtn,
         inputs
      } = window.ui;

      if (fgExportCancelBtn) {
         fgExportCancelBtn.addEventListener('click', () => {
            window.app.closeModal('fg-export-modal');
         });
      }
      if (fgExportSaveBtn) {
         fgExportSaveBtn.addEventListener('click', () => {
            this.saveSettingsAndExport();
         });
      }

      if (fgCoverImageEl && inputs.fgCoverUpload) {
         fgCoverImageEl.addEventListener('click', () => {
            inputs.fgCoverUpload.click();
         });
         inputs.fgCoverUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
               this.handleCoverImage(file);
            }
         });
      }
      
      if (fgCoverImageEl) {
         ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
            fgCoverImageEl.addEventListener(eventName, e => {
               e.preventDefault();
               e.stopPropagation();
            });
         });
         ["dragenter", "dragover"].forEach(eventName => {
            fgCoverImageEl.addEventListener(eventName, () => {
               fgCoverImageEl.classList.add("drag-over");
            });
         });
         ["dragleave", "drop"].forEach(eventName => {
            fgCoverImageEl.addEventListener(eventName, () => {
               fgCoverImageEl.classList.remove("drag-over");
            });
         });
         fgCoverImageEl.addEventListener("drop", e => {
            const file = e.dataTransfer?.files?.[0];
            if (file) {
               this.handleCoverImage(file);
            }
         });
      }
      
      if (fgCoverClearBtn) {
         fgCoverClearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearCoverImage();
         });
      }

      const restrictInput = (e) => {
         if ([46, 8, 9, 27, 13, 37, 39].includes(e.keyCode) ||
             (e.ctrlKey === true || e.metaKey === true) && [65, 67, 86, 88].includes(e.keyCode)) {
             return;
         }
         if (!/^[a-zA-Z0-9 ]$/.test(e.key)) {
            e.preventDefault();
         }
      };

      if (inputs.fgBestiaryTitle) {
         inputs.fgBestiaryTitle.addEventListener('keydown', restrictInput);
      }
      if (inputs.fgBestiaryFilename) {
         inputs.fgBestiaryFilename.addEventListener('keydown', restrictInput);
      }
   },
   
   // --- NEW XML GENERATION FUNCTIONS ---
   
   /**
    * Main function to generate the db.xml/client.xml file content.
    * @param {object} bestiary The full bestiary object.
    * @param {object} settings The settings from the export modal.
    * @returns {string} The complete XML file as a string.
    */
   _generateDbXml(bestiary, settings) {
      const versionInfo = `(Version ${window.app.version || '0.18.09'})`; // Get version from main.js or default
      
      let xml = `<?xml version="1.0" encoding="utf-8"?>\n`; // Single newline is correct.
      xml += `<root version="4.8" dataversion="20241002" release="8.1|CoreRPG:7">\n`;
      
      // *** Comments moved to inside the <root> tag as requested ***
      xml += this._indent(1) + `\n`;
      
      const xlock = settings.isLocked ? ` static="true"` : "";

      // Add Library section (for module entry)
      xml += this._generateLibrarySection(settings);
      
      // Add Reference section (NPC data)
      xml += this._generateReferenceSection(bestiary.npcs, settings, xlock);
      
      // Add Lists section (NPC sorting lists)
      xml += this._generateListsSection(bestiary.npcs, settings);

      xml += `</root>\n`;
      return xml;
   },

   /**
    * Generates the <library>...</library> section.
    * @param {object} settings The export settings.
    * @returns {string} The <library> XML string.
    */
   _generateLibrarySection(settings) {
      let xml = this._indent(1) + `<library>\n`;
      xml += this._indent(2) + `<${settings.moduleName} static="true">\n`;
      xml += this._buildTag('categoryname', 's', settings.displayName || settings.title, 3);
      xml += this._buildTag('name', 's', settings.moduleName, 3);
      xml += this._indent(3) + `<entries>\n`;
      xml += this._indent(4) + `<npc>\n`;
      xml += this._indent(5) + `<librarylink type="windowreference">\n`;
      xml += this._buildTag('class', 's', 'reference_list', 6);
      xml += this._buildTag('recordname', 's', '..', 6);
      xml += this._indent(5) + `</librarylink>\n`;
      xml += this._buildTag('name', 's', 'NPCs', 5);
      xml += this._buildTag('recordtype', 's', 'npc', 5);
      xml += this._indent(4) + `</npc>\n`;
      xml += this._indent(3) + `</entries>\n`;
      xml += this._indent(2) + `</${settings.moduleName}>\n`;
      xml += this._indent(1) + `</library>\n`;
      return xml;
   },

   /**
    * Generates the <reference>...</reference> section.
    * @param {Array} npcs The list of NPC objects.
    * @param {object} settings The export settings.
    * @param {string} xlock The static="true" string or empty.
    * @returns {string} The <reference> XML string.
    */
   _generateReferenceSection(npcs, settings, xlock) {
      // *** BUG FIX: Added xlock to the reference tag ***
      let xml = this._indent(1) + `<reference${xlock}>\n`;
      xml += this._indent(2) + `<npcdata>\n`;

      // Get all unique groups
      const groups = [...new Set(npcs.map(npc => npc.fg_group || settings.title))];
      groups.sort((a, b) => a.localeCompare(b));
      
      let npcCounter = 1;

      for (const groupName of groups) {
         xml += this._indent(3) + `<category name="${this._cleanString(groupName)}" baseicon="0" decalicon="0">\n`;

         const npcsInGroup = npcs.filter(npc => (npc.fg_group || settings.title) === groupName);
         // Sort NPCs alphabetically within their group
         npcsInGroup.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

         for (const npc of npcsInGroup) {
            const npcId = `id-${npcCounter.toString().padStart(5, '0')}`;
            npcCounter++;
            
            xml += this._indent(4) + `<${npcId}>\n`;
            
            // --- Core Stats ---
            xml += this._buildTag('name', 's', npc.name, 5);
            if (npc.nonId) xml += this._buildTag('nonid_name', 's', npc.nonId, 5);
            xml += this._buildTag('type', 's', `${npc.type}${npc.species ? ` (${npc.species})` : ''}`, 5);
            xml += this._buildTag('alignment', 's', npc.alignment, 5);
            xml += this._buildTag('size', 's', npc.size, 5);

            // Parse AC
            const acMatch = (npc.armorClass || "10").match(/^(\d+)(?:\s*\((.*?)\))?$/);
            xml += this._buildTag('ac', 'n', acMatch ? (acMatch[1] || '10') : '10', 5);
            if (acMatch && acMatch[2]) xml += this._buildTag('actext', 's', `(${acMatch[2]})`, 5);
            
            // Parse HP
            const hpMatch = (npc.hitPoints || "10 (1d10)").match(/^(\d+)(?:\s*(\(.*?\)))?$/);
            xml += this._buildTag('hp', 'n', hpMatch ? (hpMatch[1] || '10') : '10', 5);
            if (hpMatch && hpMatch[2]) xml += this._buildTag('hd', 's', hpMatch[2], 5);
            
            xml += this._buildTag('speed', 's', npc.speed, 5);
            
            // --- Abilities ---
            xml += this._indent(5) + `<abilities>\n`;
            const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            for (const ability of abilities) {
               xml += this._indent(6) + `<${ability}>\n`;
               xml += this._buildTag('score', 'n', npc[ability] || 10, 7);
               xml += this._buildTag('bonus', 'n', npc[`${ability}Bonus`] || 0, 7);
               // Add savemodifier if it's not 0 (Note: AHK script didn't seem to use this, but client.xml has it)
               const saveAdjust = npc[`${ability}SavingThrowAdjust`] || 0;
               xml += this._buildTag('savemodifier', 'n', saveAdjust, 7);
               xml += this._indent(6) + `</${ability}>\n`;
            }
            xml += this._indent(5) + `</abilities>\n`;

            // --- Calculated Strings ---
            if (npc.saves) xml += this._buildTag('savingthrows', 's', npc.saves, 5);
            if (npc.npcSkills) xml += this._buildTag('skills', 's', npc.npcSkills, 5);
            
            const { vulnerabilities, resistances, immunities } = window.app.calculateDamageModifiersString(npc);
            if (vulnerabilities) xml += this._buildTag('damagevulnerabilities', 's', vulnerabilities, 5);
            if (resistances) xml += this._buildTag('damageresistances', 's', resistances, 5);
            if (immunities) xml += this._buildTag('damageimmunities', 's', immunities, 5);
            if (npc.damageThreshold > 0) xml += this._buildTag('damagethreshold', 'n', npc.damageThreshold, 5);
            
            const condImm = window.app.calculateConditionImmunitiesString(npc);
            if (condImm) xml += this._buildTag('conditionimmunities', 's', condImm, 5);
            
            const senses = window.app.calculateSensesString(npc);
            if (senses) xml += this._buildTag('senses', 's', senses, 5);
            
            const languages = window.app.calculateLanguagesString(npc);
            if (languages) xml += this._buildTag('languages', 's', languages, 5);
            
            xml += this._buildTag('cr', 's', npc.challenge, 5);
            xml += this._buildTag('xp', 'n', (npc.experience || "0").replace(/,/g, ''), 5); // Remove commas from XP

            // --- Traits, Actions, and Spells ---
            const traitList = [];
            const actionList = [];
            
            // Add Innate Spellcasting (if exists)
            if (npc.hasInnateSpellcasting) {
               traitList.push(this._generateInnateSpellcastingTrait(npc));
            }
            // Add Class Spellcasting (if exists)
            if (npc.hasSpellcasting) {
               const spellcastingTrait = this._generateClassSpellcastingTrait(npc);
               if (npc.spellcastingPlacement === 'actions') {
                  actionList.push(spellcastingTrait);
               } else {
                  traitList.push(spellcastingTrait);
               }
            }
            // Add regular traits
            (npc.traits || []).forEach(trait => traitList.push(trait));
            
            // Build XML for action lists
            xml += this._generateActionListXML('traits', traitList, 5, npc);
            xml += this._generateActionListXML('actions', [...actionList, ...(npc.actions?.actions || [])], 5, npc, true); // Add spellcasting to actions list
            xml += this._generateActionListXML('bonusactions', npc.actions?.['bonus-actions'], 5, npc);
            xml += this._generateActionListXML('reactions', npc.actions?.reactions, 5, npc);
            xml += this._generateActionListXML('legendaryactions', npc.actions?.['legendary-actions'], 5, npc, false, npc.legendaryBoilerplate);
            xml += this._generateActionListXML('lairactions', npc.actions?.['lair-actions'], 5, npc, false, npc.lairBoilerplate);

            // --- Images ---
            if (npc.image) xml += this._buildTag('picture', 'token', this._getImagePath(npc, 'image', settings.moduleName), 5);
            if (npc.token) xml += this._buildTag('token', 'token', this._getImagePath(npc, 'token', settings.moduleName), 5);
            if (npc.cameraToken) xml += this._buildTag('token3Dflat', 'token', this._getImagePath(npc, 'cameraToken', settings.moduleName), 5);

            // --- Description ---
            if (npc.description) {
               xml += this._formatTrixDescription(npc.description, 5);
            }

            xml += this._indent(4) + `</${npcId}>\n`;
         }
         xml += this._indent(3) + `</category>\n`;
      }

      xml += this._indent(2) + `</npcdata>\n`;
      xml += this._indent(1) + `</reference>\n`;
      return xml;
   },

   /**
    * Generates the <lists>...</lists> section.
    * @param {Array} npcs The list of NPC objects.
    * @param {object} settings The export settings.
    * @returns {string} The <lists> XML string.
    */
   _generateListsSection(npcs, settings) {
      let xml = this._indent(1) + `<lists>\n`;
      xml += this._indent(2) + `<monsters>\n`;

      // --- Main Sort List (like AHK Llist) ---
      xml += this._indent(3) + `<sortlist>\n`;
      xml += this._buildTag('name', 's', 'NPCs', 4);
      xml += this._indent(4) + `<index>\n`;
      
      xml += this._indent(5) + `<id01>\n`;
      xml += this._indent(6) + `<listlink type="windowreference">\n`;
      xml += this._buildTag('class', 's', 'reference_colindex', 7);
      xml += this._buildTag('recordname', 's', 'lists.monsters.byletter', 7);
      xml += this._indent(6) + `</listlink>\n`;
      xml += this._buildTag('name', 's', 'NPCs - Alphabetical Index', 6);
      xml += this._indent(5) + `</id01>\n`;
      
      xml += this._indent(5) + `<id02>\n`;
      xml += this._indent(6) + `<listlink type="windowreference">\n`;
      xml += this._buildTag('class', 's', 'reference_colindex', 7);
      xml += this._buildTag('recordname', 's', 'lists.monsters.bycr', 7);
      xml += this._indent(6) + `</listlink>\n`;
      xml += this._buildTag('name', 's', 'NPCs - Challenge Rating Index', 6);
      xml += this._indent(5) + `</id02>\n`;
      
      xml += this._indent(5) + `<id03>\n`;
      xml += this._indent(6) + `<listlink type="windowreference">\n`;
      xml += this._buildTag('class', 's', 'reference_colindex', 7);
      xml += this._buildTag('recordname', 's', 'lists.monsters.bytype', 7);
      xml += this._indent(6) + `</listlink>\n`;
      xml += this._buildTag('name', 's', 'NPCs - Class Index', 6);
      xml += this._indent(5) + `</id03>\n`;
      
      xml += this._indent(4) + `</index>\n`;
      xml += this._indent(3) + `</sortlist>\n`;

      // --- By Letter ---
      xml += this._indent(3) + `<byletter>\n`;
      xml += this._buildTag('description', 's', 'NPCs by Name', 4);
      xml += this._indent(4) + `<groups>\n`;
      for (let i = 65; i <= 90; i++) { // A-Z
         const letter = String.fromCharCode(i);
         const npcsInGroup = npcs.filter(npc => (npc.name || "").toUpperCase().startsWith(letter));
         if (npcsInGroup.length > 0) {
            npcsInGroup.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            xml += this._indent(5) + `<typeletter${letter}>\n`;
            xml += this._buildTag('description', 's', letter, 6);
            xml += this._indent(6) + `<index>\n`;
            let npcCounter = 1;
            for (const npc of npcsInGroup) {
               const npcId = `id-${npcCounter.toString().padStart(5, '0')}`;
               npcCounter++;
               xml += this._indent(7) + `<${npcId}>\n`;
               xml += this._buildTag('name', 's', npc.name, 8);
               xml += this._indent(8) + `<link type="windowreference">\n`;
               xml += this._buildTag('class', 's', 'npc', 9);
               // TODO: This recordname is tricky. It needs the ID from the <reference> section.
               // For now, I'll stub it, but this needs to be mapped.
               // For simplicity, I will re-find the ID based on name.
               const refId = this._findNpcRefId(npcs, npc.name, settings.title);
               xml += this._buildTag('recordname', 's', `reference.npcdata.${refId}`, 9);
               xml += this._indent(8) + `</link>\n`;
               xml += this._indent(7) + `</${npcId}>\n`;
            }
            xml += this._indent(6) + `</index>\n`;
            xml += this._indent(5) + `</typeletter${letter}>\n`;
         }
      }
      xml += this._indent(4) + `</groups>\n`;
      xml += this._indent(3) + `</byletter>\n`;

      // --- By CR ---
      xml += this._indent(3) + `<bycr>\n`;
      xml += this._buildTag('description', 's', 'NPCs by CR', 4);
      xml += this._indent(4) + `<groups>\n`;
      const crOrder = window.app.challengeOrder;
      let crGroupId = 1;
      for (const cr of crOrder) {
         const npcsInGroup = npcs.filter(npc => (npc.challenge || "0") === cr);
         if (npcsInGroup.length > 0) {
            npcsInGroup.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            const crId = `id-${crGroupId.toString().padStart(5, '0')}`;
            crGroupId++;
            xml += this._indent(5) + `<${crId}>\n`;
            xml += this._buildTag('description', 's', `CR ${cr}`, 6);
            xml += this._indent(6) + `<index>\n`;
            let npcCounter = 1;
            for (const npc of npcsInGroup) {
               const npcId = `id-${npcCounter.toString().padStart(5, '0')}`;
               npcCounter++;
               const refId = this._findNpcRefId(npcs, npc.name, settings.title);
               xml += this._indent(7) + `<${npcId}>\n`;
               xml += this._buildTag('name', 's', npc.name, 8);
               xml += this._indent(8) + `<link type="windowreference">\n`;
               xml += this._buildTag('class', 's', 'npc', 9);
               xml += this._buildTag('recordname', 's', `reference.npcdata.${refId}`, 9);
               xml += this._indent(8) + `</link>\n`;
               xml += this._indent(7) + `</${npcId}>\n`;
            }
            xml += this._indent(6) + `</index>\n`;
            xml += this._indent(5) + `</${crId}>\n`;
         }
      }
      xml += this._indent(4) + `</groups>\n`;
      xml += this._indent(3) + `</bycr>\n`;

      // --- By Type ---
      xml += this._indent(3) + `<bytype>\n`;
      xml += this._buildTag('description', 's', 'NPCs by Class', 4); // "Class" seems to mean "Type"
      xml += this._indent(4) + `<groups>\n`;
      const types = [...new Set(npcs.map(npc => (npc.type || "unknown").toLowerCase()))];
      types.sort();
      let typeGroupId = 1;
      for (const type of types) {
         const npcsInGroup = npcs.filter(npc => (npc.type || "unknown").toLowerCase() === type);
         if (npcsInGroup.length > 0) {
            npcsInGroup.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            const typeId = `id-${typeGroupId.toString().padStart(5, '0')}`;
            typeGroupId++;
            const typeDisplayName = type.charAt(0).toUpperCase() + type.slice(1);
            xml += this._indent(5) + `<${typeId}>\n`;
            xml += this._buildTag('description', 's', typeDisplayName, 6);
            xml += this._indent(6) + `<index>\n`;
            let npcCounter = 1;
            for (const npc of npcsInGroup) {
               const npcId = `id-${npcCounter.toString().padStart(5, '0')}`;
               npcCounter++;
               const refId = this._findNpcRefId(npcs, npc.name, settings.title);
               xml += this._indent(7) + `<${npcId}>\n`;
               xml += this._buildTag('name', 's', npc.name, 8);
               xml += this._indent(8) + `<link type="windowreference">\n`;
               xml += this._buildTag('class', 's', 'npc', 9);
               xml += this._buildTag('recordname', 's', `reference.npcdata.${refId}`, 9);
               xml += this._indent(8) + `</link>\n`;
               xml += this._indent(7) + `</${npcId}>\n`;
            }
            xml += this._indent(6) + `</index>\n`;
            xml += this._indent(5) + `</${typeId}>\n`;
         }
      }
      xml += this._indent(4) + `</groups>\n`;
      xml += this._indent(3) + `</bytype>\n`;
      
      xml += this._indent(2) + `</monsters>\n`;
      xml += this._indent(1) + `</lists>\n`;
      return xml;
   },
   
   /**
    * Helper to find the "id-XXXXX" of an NPC in the reference list.
    * This is a simplified lookup that assumes names are unique.
    * A more robust method would map this during the reference build.
    */
   _findNpcRefId(allNpcs, npcName, defaultGroup) {
      // Re-create the full sorted list just as _generateReferenceSection does
      const groups = [...new Set(allNpcs.map(npc => npc.fg_group || defaultGroup))];
      groups.sort((a, b) => a.localeCompare(b));
      
      let npcCounter = 1;
      for (const groupName of groups) {
         const npcsInGroup = allNpcs.filter(npc => (npc.fg_group || defaultGroup) === groupName);
         npcsInGroup.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
         for (const npc of npcsInGroup) {
            if (npc.name === npcName) {
               return `id-${npcCounter.toString().padStart(5, '0')}`;
            }
            npcCounter++;
         }
      }
      return "id-00000"; // Fallback
   },
   
   /**
    * Generates an XML block for a list of actions (traits, actions, etc.).
    * @param {string} listName e.g., "traits", "actions", "reactions"
    * @param {Array} items The array of {name, desc} objects.
    * @param {number} indentLevel The indentation level.
    * @param {object} npc The NPC object for processing strings.
    * @param {boolean} [sortMultiattackFirst=false] Special sorting for "actions" list.
    * @param {string} [boilerplate=""] Optional boilerplate text to prepend.
    * @returns {string} The XML block as a string.
    */
   _generateActionListXML(listName, items, indentLevel, npc, sortMultiattackFirst = false, boilerplate = "") {
      // *** FIX: Check for empty or non-existent items array ***
      if ((!items || items.length === 0) && !boilerplate) {
         // FG requires an empty tag if the block is expected (like <traits> or <actions>)
         // But for optional blocks (bonusactions, reactions), we can return empty string.
         if (listName === 'traits' || listName === 'actions') {
            return this._indent(indentLevel) + `<${listName} />\n`;
         }
         return "";
      }
      
      let sortedItems = [...(items || [])]; // Ensure items is an array
      if (sortMultiattackFirst) {
         let multiattack = null;
         const otherItems = sortedItems.filter(item => {
            if (item && item.name && item.name.toLowerCase() === 'multiattack') {
               multiattack = item;
               return false;
            }
            return true;
         });
         otherItems.sort((a,b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
         sortedItems = multiattack ? [multiattack, ...otherItems] : otherItems;
      } else if (listName === 'traits' && (npc.sortTraitsAlpha ?? true)) {
         sortedItems.sort((a,b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
      }
      
      let xml = this._indent(indentLevel) + `<${listName}>\n`;
      let idCounter = 1;
      
      if (boilerplate) {
         const boilerplateId = `id-${idCounter.toString().padStart(5, '0')}`;
         idCounter++;
         xml += this._indent(indentLevel + 1) + `<${boilerplateId}>\n`;
         // Note: Boilerplate often doesn't have a "name", just a "desc"
         xml += this._buildTag('name', 's', 'Options', indentLevel + 2); // Default name
         xml += this._buildTag('desc', 's', window.app.processTraitString(boilerplate, npc), indentLevel + 2); // *** FIXED ***
         xml += this._indent(indentLevel + 1) + `</${boilerplateId}>\n`;
      }
      
      for (const item of sortedItems) {
         if (!item) continue;
         const itemId = `id-${idCounter.toString().padStart(5, '0')}`;
         idCounter++;
         xml += this._indent(indentLevel + 1) + `<${itemId}>\n`;
         xml += this._buildTag('name', 's', item.name || "Unnamed", indentLevel + 2);
         xml += this._buildTag('desc', 's', window.app.processTraitString(item.desc || "", npc), indentLevel + 2); // *** FIXED ***
         xml += this._indent(indentLevel + 1) + `</${itemId}>\n`;
      }
      
      xml += this._indent(indentLevel) + `</${listName}>\n`;
      return xml;
   },

   /**
    * Generates the XML for the Innate Spellcasting trait.
    * @param {object} npc The NPC object.
    * @returns {object} An {name, desc} object.
    */
   _generateInnateSpellcastingTrait(npc) {
      const title = npc.innateIsPsionics ? 'Innate Spellcasting (Psionics)' : 'Innate Spellcasting';
      const abilityName = (npc.innateAbility || 'charisma').charAt(0).toUpperCase() + (npc.innateAbility || 'charisma').slice(1);
      
      const { dc: recalcDC, bonus: recalcBonus } = window.app.calculateSpellcastingDCBonus(npc.innateAbility, npc.proficiencyBonus, npc);
      const dc = npc.innateDC ?? recalcDC;
      const bonus = (recalcBonus ?? 0) >= 0 ? `+${recalcBonus ?? 0}` : (recalcBonus ?? 0);
      
      let desc = `The ${npc.name || 'creature'}'s innate spellcasting ability is ${abilityName} (spell save DC ${dc}, ${bonus} to hit with spell attacks). `;
      desc += `It can innately cast the following spells${npc.innateComponents ? `, ${npc.innateComponents}` : ''}:\n`;
      
      const spellList = (npc.innateSpells || [])
         .filter(spell => spell?.freq && spell?.list)
         .map(spell => `${spell.freq}: ${this._formatSpellList(spell.list)}`)
         .join('\n');
      
      desc += (spellList || 'None');
      
      return { name: title, desc: desc };
   },

   /**
    * Generates the XML for the class-based Spellcasting trait or action.
    * @param {object} npc The NPC object.
    * @returns {object} An {name, desc} object.
    */
   _generateClassSpellcastingTrait(npc) {
      const title = 'Spellcasting';
      let desc = '';
      
      if (npc.spellcastingPlacement === 'traits') {
         const levels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th'];
         const levelText = levels[(parseInt(npc.traitCastingLevel, 10) || 1) - 1] || '1st';
         const abilityName = (npc.traitCastingAbility || 'intelligence').charAt(0).toUpperCase() + (npc.traitCastingAbility || 'intelligence').slice(1);
         const { dc: recalcDC, bonus: recalcBonus } = window.app.calculateSpellcastingDCBonus(npc.traitCastingAbility, npc.proficiencyBonus, npc);
         
         const dc = npc.traitCastingDC ?? recalcDC;
         const bonus = npc.traitCastingBonus ?? recalcBonus;
         const bonusString = bonus >= 0 ? `+${bonus}` : bonus;
         const className = npc.traitCastingClass ? ` ${npc.traitCastingClass}` : '';
         
         desc = npc.traitCastingFlavor || `The ${npc.name || 'creature'} is a ${levelText}-level spellcaster. Its spellcasting ability is ${abilityName} (spell save DC ${dc}, ${bonusString} to hit with spell attacks).`;
         desc += ` The ${npc.name || 'creature'} has the following${className} spells prepared:\n`;
         
         let spellList = '';
         if (npc.traitCastingList[0]) {
            spellList += `Cantrips (at will): ${this._formatSpellList(npc.traitCastingList[0])}\n`;
         }
         for (let i = 1; i <= 9; i++) {
            const spells = npc.traitCastingList[i];
            const slots = parseInt(npc.traitCastingSlots[i-1], 10) || 0;
            if (spells && slots > 0) {
               const levelSuffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
               const slotText = `${slots} slot${slots > 1 ? 's' : ''}`;
               spellList += `${i}${levelSuffix} level (${slotText}): ${this._formatSpellList(spells)}\n`;
            }
         }
         desc += (spellList || 'None\n');
         if (npc.traitCastingMarked) desc += npc.traitCastingMarked;
         
      } else { // 'actions'
         const abilityName = (npc.actionCastingAbility || 'intelligence').toLowerCase();
         const { dc: recalcDC } = window.app.calculateSpellcastingDCBonus(npc.actionCastingAbility, npc.proficiencyBonus, npc);
         const dc = npc.actionCastingDC ?? recalcDC;
         const components = npc.actionCastingComponents ? ` ${npc.actionCastingComponents}` : '';
         
         desc = `The ${npc.name || 'creature'} casts one of the following spells, using ${abilityName} as the spellcasting ability (spell save DC ${dc})${components}:\n`;
         
         const spellList = (npc.actionCastingSpells || [])
            .filter(spell => spell?.freq && spell?.list)
            .map(spell => `${spell.freq}: ${this._formatSpellList(spell.list)}`)
            .join('\n');
         
         desc += (spellList || 'None');
      }
      
      return { name: title, desc: desc };
   },
   
   /**
    * Italicizes spell names in a comma-separated list.
    * @param {string} listString The raw string, e.g., "mage hand, shield*".
    * @returns {string} The formatted string, e.g., "<i>mage hand</i>, <i>shield</i>*".
    */
   _formatSpellList(listString) {
      if (!listString) return "";
      const spellRegex = /([\w\s'()-]+)(\*?)/g;
      let match;
      let result = [];
      while ((match = spellRegex.exec(listString)) !== null) {
          const spellName = match[1].trim();
          const asterisk = match[2];
          if (spellName) {
              result.push(`<i>${spellName.toLowerCase()}</i>${asterisk}`);
          }
      }
      return result.join(', ');
   },
   
   /**
    * Converts Trix HTML to FG-formatted XML text.
    * @param {string} html The Trix HTML string.
    * @param {number} indentLevel The base indentation.
    * @returns {string} The <text>...</text> block.
    */
   _formatTrixDescription(html, indentLevel) {
      if (!html) return "";
      
      // Create a temporary element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      let content = "";
      
      // Iterate over child nodes to preserve structure
      tempDiv.childNodes.forEach(node => {
         if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            // Handle stray text nodes (wrap in <p>)
            content += this._indent(indentLevel + 1) + `<p>${this._cleanString(node.textContent)}</p>\n`;
         } else if (node.nodeType === Node.ELEMENT_NODE) {
            let tag = 'p'; // Default to paragraph
            if (node.tagName === 'H1') tag = 'h';
            
            // Re-build inner HTML, keeping <b> and <i>
            let innerHtml = node.innerHTML || "";
            innerHtml = innerHtml.replace(/<strong>/g, '<b>').replace(/<\/strong>/g, '</b>');
            innerHtml = innerHtml.replace(/<em>/g, '<i>').replace(/<\/em>/g, '</i>');
            innerHtml = innerHtml.replace(/<br>/g, ''); // Remove <br>
            
            // *** NEW: Handle <frame> tags ***
            if (node.tagName === 'BLOCKQUOTE') {
               tag = 'frame';
               // Trix wraps blockquote content in divs, so we strip them
               // but keep the inner <b>/<i> tags.
               innerHtml = innerHtml.replace(/<div>/g, '').replace(/<\/div>/g, ' ').trim();
            }
            // *** END NEW ***

            content += this._indent(indentLevel + 1) + `<${tag}>${innerHtml}</${tag}>\n`;
         }
      });

      return this._indent(indentLevel) + `<text type="formattedtext">\n${content}` + this._indent(indentLevel) + `</text>\n`;
   },

   /**
    * Builds a single, complete XML tag.
    * @param {string} tagName The XML tag name (e.g., "name").
    * @param {string} type The FG type ("s" for string, "n" for number, "t" for token).
    * @param {string|number} value The value to place inside the tag.
    * @param {number} indentLevel The indentation level.
    * @returns {string} The formatted XML string, e.g., "\t<name type="string">Goblin</name>\n".
    */
   _buildTag(tagName, type, value, indentLevel) {
      let typeAttr = '';
      switch (type) {
         case 's': typeAttr = ' type="string"'; break;
         case 'n': typeAttr = ' type="number"'; break;
         case 't': typeAttr = ' type="token"'; break;
         case 'f': typeAttr = ' type="formattedtext"'; break;
         case 'd': typeAttr = ' type="dice"'; break;
      }
      
      const cleanedValue = this._cleanString(String(value));
      return `${this._indent(indentLevel)}<${tagName}${typeAttr}>${cleanedValue}</${tagName}>\n`;
   },
   
   /**
    * Gets the relative image path for the export.
    * @param {object} npc The NPC object.
    * @param {string} key "image", "token", or "cameraToken".
    * @param {string} moduleName The cleaned module name.
    * @returns {string} The relative path, e.g., "images/npc_1.webp".
    */
   _getImagePath(npc, key, moduleName) {
      const info = npc[`${key}Info`];
      const format = info?.format ? info.format.split('/')[1] : 'png'; // Default to png
      const npcId = this._cleanId(npc.name || 'unknown');
      
      if (key === 'token') {
         return `tokens/${moduleName}/${npcId}_token.${format}`;
      } else if (key === 'cameraToken') {
         return `images/${npcId}_cam.${format}`; // cameraToken goes in /images
      } else { // 'image'
         return `images/${npcId}.${format}`;
      }
   },

   /**
    * Generates indentation string.
    * @param {number} level The indentation level.
    * @returns {string} A string of tabs.
    */
   _indent(level) {
      return '   '.repeat(level);
   },
   
   /**
    * Escapes special XML characters in a string.
    * @param {string} str The input string.
    * @returns {string} The escaped string.
    */
   _cleanString(str) {
      if (str === null || str === undefined) return "";
      return String(str)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&apos;');
   },
   
   /**
    * Cleans a string to be used as an XML ID tag (like AHK's XC).
    * @param {string} str The input string.
    * @returns {string} The cleaned string.
    */
   _cleanId(str) {
      if (!str) return "id";
      return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
   }
};

// Add an event listener to call init *after* ui-elements.js has run
document.addEventListener('DOMContentLoaded', () => {
   if (window.fgExporter) {
      window.fgExporter.init();
   }
});