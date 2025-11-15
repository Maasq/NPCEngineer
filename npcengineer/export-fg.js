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

   /**
    * Saves the settings from the modal to bestiary metadata and triggers the export.
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
      
      // Regex to enforce alphanumeric + spaces
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
      activeBestiary.metadata.fgBestiaryTitle = title;
      activeBestiary.metadata.fgBestiaryAuthor = inputs.fgBestiaryAuthor.value.trim();
      activeBestiary.metadata.fgBestiaryFilename = filename;
      activeBestiary.metadata.fgBestiaryDisplayname = inputs.fgBestiaryDisplayname.value.trim();
      activeBestiary.metadata.fgModLock = inputs.fgModLock.checked;
      activeBestiary.metadata.fgGMonly = inputs.fgGmView.checked;
      // The image (fgCoverImage) is saved separately by the image handler functions

      // 3. Save the entire bestiary (with new metadata) back to Dexie
      await window.app.saveActiveBestiaryToDB();

      // 4. Close the modal
      window.ui.hideAllModals();

      // 5. *** TEMPORARY TEST: Generate and show export output ***
      console.log("Settings saved. Generating test output for modal...");

      //
      // TODO: Add your real XML generation logic here.
      //
      const testOutput = "This is a placeholder for the real XML export output.\n\n" +
                         "Bestiary: " + activeBestiary.metadata.fgBestiaryTitle + "\n" +
                         "Author: ".padEnd(12) + activeBestiary.metadata.fgBestiaryAuthor + "\n" +
                         "Filename: ".padEnd(12) + activeBestiary.metadata.fgBestiaryFilename + "\n" +
                         "Locked: ".padEnd(12) + activeBestiary.metadata.fgModLock + "\n" +
                         "GM Only: ".padEnd(12) + activeBestiary.metadata.fgGMonly + "\n" +
                         "NPCs: ".padEnd(12) + activeBestiary.npcs.length;
      
      // Call the new display function
      this.showExportOutputForTesting(testOutput);
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
         // --- MODIFIED: Call the new global graphics utility ---
         const resizedDataUrl = await window.graphicsUtils.processImage(file, { 
            maxWidth: 100, 
            maxHeight: 100, 
            outputFormat: 'image/png' 
         });
         // --- END MODIFICATION ---
         
         // Save to active bestiary
         if (window.app.activeBestiary) {
            window.app.activeBestiary.metadata.fgCoverImage = resizedDataUrl.dataUrl; // Make sure to save the dataUrl
            // No need to save to DB here, saveSettingsAndExport will do it
         }
         
         // Update modal display
         const { fgCoverImageEl, fgCoverClearBtn } = window.ui;
         if (fgCoverImageEl) {
            fgCoverImageEl.innerHTML = '';
            const img = document.createElement('img');
            img.src = resizedDataUrl.dataUrl; // Use the dataUrl
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
      // 1. Clear from metadata
      if (window.app.activeBestiary) {
         window.app.activeBestiary.metadata.fgCoverImage = null;
      }
      
      // 2. Update modal display
      const { fgCoverImageEl, fgCoverClearBtn } = window.ui;
      if (fgCoverImageEl) {
         fgCoverImageEl.innerHTML = '<span>Click or Drag a Cover Image Here</span>';
      }
      if (fgCoverClearBtn) {
         fgCoverClearBtn.classList.add('hidden');
      }
      
      // 3. Clear the file input
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
      if (modalTitle) modalTitle.textContent = "Export Test Output";

      // 3. Hide all the import-specific UI
      if (importPaneRaw) importPaneRaw.classList.add('hidden');
      if (importFilterSelect) importFilterSelect.parentElement.parentElement.classList.add('hidden');
      if (importConfirmBtn) importConfirmBtn.classList.add('hidden');
      if (importToggleViewBtn) importToggleViewBtn.classList.add('hidden');
      if (importClearBtn) importClearBtn.classList.add('hidden');
      
      // 4. Repurpose the 'Filtered' pane
      if (importPaneFiltered) {
         // Make it visible and full-width
         importPaneFiltered.classList.remove('hidden');
         if (importPaneFiltered.parentElement) {
            importPaneFiltered.parentElement.classList.remove('w-1/2');
            importPaneFiltered.parentElement.classList.add('w-full');
         }
         // Change its label
         const filteredLabel = importPaneFiltered.querySelector('label');
         if (filteredLabel) filteredLabel.textContent = "Export Output (Read-Only)";
      }
      
      // 5. Hide the preview viewport
      const viewportPane = document.getElementById('import-viewport')?.parentElement;
      if (viewportPane) viewportPane.classList.add('hidden');

      // 6. Set the text and update the 'Cancel' button
      importTextArea.value = outputText;
      importTextArea.scrollTop = 0; // Scroll to top
      if (importCancelBtn) importCancelBtn.textContent = "Close";
   },

   /**
    * --- REMOVED resizeImage function ---
    */
   
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

      // Modal Buttons
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

      // Image Upload: Click
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
      
      // Image Upload: Drag & Drop
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
      
      // Image Clear Button
      if (fgCoverClearBtn) {
         fgCoverClearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearCoverImage();
         });
      }

      // Input Validation Listeners (to remove invalid characters as they're typed)
      const restrictInput = (e) => {
         // Allow backspace, delete, tab, escape, enter, and arrow keys
         if ([46, 8, 9, 27, 13, 37, 39].includes(e.keyCode) ||
             // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
             (e.ctrlKey === true || e.metaKey === true) && [65, 67, 86, 88].includes(e.keyCode)) {
             return; // Let it happen
         }
         // Ensure it's an alphanumeric character or a space
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
   }
};

// Add an event listener to call init *after* ui-elements.js has run
// This is safer than assuming load order
document.addEventListener('DOMContentLoaded', () => {
   if (window.fgExporter) {
      window.fgExporter.init();
   }
});