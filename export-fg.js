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

      // 5. *** PLACEHOLDER for actual export logic ***
      // We will build this out later.
      console.log("Settings saved. Triggering FG Export with data:", activeBestiary);
      window.app.showAlert("Settings saved! Actual XML export is not yet implemented.");
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
         const resizedDataUrl = await this.resizeImage(file, 100, 100);
         
         // Save to active bestiary
         if (window.app.activeBestiary) {
            window.app.activeBestiary.metadata.fgCoverImage = resizedDataUrl;
            // No need to save to DB here, saveSettingsAndExport will do it
         }
         
         // Update modal display
         const { fgCoverImageEl, fgCoverClearBtn } = window.ui;
         if (fgCoverImageEl) {
            fgCoverImageEl.innerHTML = '';
            const img = document.createElement('img');
            img.src = resizedDataUrl;
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
    * Resizes an image file to fit within a max width/height.
    * @param {File} file The image file.
    * @param {number} maxWidth Max width.
    * @param {number} maxHeight Max height.
    * @returns {Promise<string>} A promise that resolves with the resized image as a PNG data URL.
    */
   resizeImage(file, maxWidth, maxHeight) {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
               const canvas = document.createElement('canvas');
               const ctx = canvas.getContext('2d');

               let width = img.width;
               let height = img.height;

               // Calculate new dimensions while maintaining aspect ratio
               if (width > height) {
                  if (width > maxWidth) {
                     height = Math.round(height * (maxWidth / width));
                     width = maxWidth;
                  }
               } else {
                  if (height > maxHeight) {
                     width = Math.round(width * (maxHeight / height));
                     height = maxHeight;
                  }
               }

               canvas.width = width;
               canvas.height = height;
               
               // Draw the image onto the canvas
               ctx.drawImage(img, 0, 0, width, height);
               
               // Get the resized image as a PNG data URL
               resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = (error) => {
               reject(error);
            };
            img.src = event.target.result;
         };
         reader.onerror = (error) => {
            reject(error);
         };
         reader.readAsDataURL(file);
      });
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