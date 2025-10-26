// import.js (Revised - No Fetch)
window.importer = {
    importNPC: null,
    htmlLoaded: false, // Still useful to track if init has run

    // --- Core Functions ---

    /**
     * Initializes the importer by setting up event listeners.
     * Assumes the import modal HTML is already embedded in the main page.
     */
    init() {
        // No fetch needed anymore
        this.htmlLoaded = true; // Mark as ready
        this.setupEventListeners(); // Setup listeners for the embedded HTML
        // No error handling needed here as the HTML is part of the main page
    },

    /**
     * Opens the importer modal, resets the staging object, and renders a blank viewport.
     */
    openImportModal() {
        if (!this.htmlLoaded) {
            console.error("Importer failed to initialize."); // Changed error message
            return;
        }
        // Create a fresh, deep copy of the default NPC
        this.importNPC = JSON.parse(JSON.stringify(window.app.defaultNPC));

        // Set default name for the blank preview
        this.importNPC.name = "Import Preview";

        // Reset UI
        const textArea = document.getElementById('import-text-area');
        if (textArea) textArea.value = ''; // Added check
        this.updateImportViewport();

        window.app.openModal('import-modal'); //
    },

    closeImportModal() {
        window.app.closeModal('import-modal'); //
        this.importNPC = null; // Discard the staging object
    },

    /**
     * The "brains" of the operation.
     * This function will be responsible for parsing the text in the
     * #import-text-area and updating the `this.importNPC` object.
     */
    parseText() {
        // *** This is where your main parsing logic will go ***
        // For now, let's just make it update the name as a test.
        if (!this.importNPC) return; // Added safety check

        const textArea = document.getElementById('import-text-area');
        const text = textArea ? textArea.value : ''; // Added check
        const firstLine = text.split('\n')[0].trim();

        if (firstLine) {
            this.importNPC.name = firstLine;
        } else {
            this.importNPC.name = "Import Preview";
        }

        // After parsing, always update the preview
        this.updateImportViewport();
    },

    /**
     * Copies the staged importNPC into the main bestiary.
     */
    confirmImport() {
        if (!this.importNPC || !window.app.activeBestiary) return;

        // Use the existing app function to find a unique name
        const uniqueName = window.app.findUniqueNpcName(this.importNPC.name || "New Import");
        this.importNPC.name = uniqueName;

        // Add the new NPC object to the bestiary's array
        window.app.activeBestiary.npcs.push(this.importNPC);

        // Sort the list and switch to the new NPC
        window.app.sortAndSwitchToNpc(this.importNPC);

        // Save to database and close
        window.app.saveActiveBestiaryToDB();
        this.closeImportModal();
    },

    // --- Event Listeners ---

    setupEventListeners() {
        // Safely get elements using IDs, as they are now part of the main DOM
        const cancelBtn = document.getElementById('import-cancel-btn');
        const confirmBtn = document.getElementById('import-confirm-btn');
        const clearBtn = document.getElementById('import-clear-btn');
        const appendBtn = document.getElementById('import-append-btn');
        const textArea = document.getElementById('import-text-area');

        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeImportModal());
        if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmImport());
        if (clearBtn) clearBtn.addEventListener('click', () => {
            if (textArea) textArea.value = ''; // Added check
            this.parseText(); // Re-run parse to update viewport
        });

        if (appendBtn) appendBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (textArea) { // Added check
                    textArea.value += text + '\n';
                    this.parseText(); // Re-run parse
                }
            } catch (err) {
                console.error('Failed to read clipboard contents: ', err);
                window.app.showAlert("Could not read from clipboard. Check browser permissions."); //
            }
        });

        if (textArea) { // Added check
            // Add text-stripping on paste
            textArea.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                // Use insertText if available (more modern)
                if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                    document.execCommand('insertText', false, text);
                } else {
                    // Fallback for older browsers (less reliable with cursor position)
                     const start = textArea.selectionStart;
                     const end = textArea.selectionEnd;
                     textArea.value = textArea.value.substring(0, start) + text + textArea.value.substring(end);
                     // Attempt to move cursor
                     textArea.selectionStart = textArea.selectionEnd = start + text.length;
                }
                 this.parseText(); // Parse after paste
            });

            // Re-parse the text any time the user stops typing (or inputs text).
            textArea.addEventListener('input', () => this.parseText());
        }
    },

    // --- Viewport Logic ---

    /**
     * This is a *copy* of window.viewport.updateViewport
     * modified to read from `this.importNPC` and write to `#import-viewport`.
     * It reuses all the calculation functions from main.js (window.app).
     */
    updateImportViewport() {
        const activeNPC = this.importNPC; // Use our staging object
        const importViewportElement = document.getElementById('import-viewport'); // Get target element

        if (!activeNPC || !importViewportElement) { // Added check for target element
            if (importViewportElement) importViewportElement.innerHTML = ''; // Clear if NPC missing but element exists
            return;
        }

        // --- This entire section is copied from viewport.js ---
        // --- It relies on window.app functions ---

        const {
            name, size, type, species, alignment, armorClass, hitPoints, description, saves, npcSkills,
            strength, dexterity, constitution, intelligence, wisdom, charisma,
            strengthBonus, dexterityBonus, constitutionBonus, intelligenceBonus, wisdomBonus, charismaBonus,
            useDropCap, addDescription, speed, challenge, experience, traits, sortTraitsAlpha,
            actions, legendaryBoilerplate, lairBoilerplate
        } = activeNPC;

        const { vulnerabilities, resistances, immunities } = window.app.calculateDamageModifiersString(activeNPC); //
        const conditionImmunities = window.app.calculateConditionImmunitiesString(activeNPC); //
        const senses = window.app.calculateSensesString(activeNPC); //
        const languages = window.app.calculateLanguagesString(activeNPC); //

        const NPCName = name || "";
        const NPCac = armorClass || "";
        const NPChp = hitPoints || "";
        // Use a plain text version for the import preview's description area for now
        // If the import process eventually populates the Trix-compatible description,
        // this can be changed back. For now, avoid injecting raw HTML potentially
        // pasted by the user directly into the preview without sanitization.
        const NPCDescriptionHTML = window.app.processTraitString(description, activeNPC) || ""; // Keep processing for tokens
        // To display plain text safely:
        // const tempDiv = document.createElement('div');
        // tempDiv.innerHTML = description || ""; // Let browser parse potential HTML
        // const NPCDescriptionText = tempDiv.textContent || tempDiv.innerText || ""; // Extract text content
        // const NPCDescriptionHTML = window.app.processTraitString(NPCDescriptionText, activeNPC); // Process tokens on plain text


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
        // Note: The description part might need adjustment if you only parse plain text above
        const descriptionHtml = addDescription ? `<div class="npcdescrip ${dropCapClass}"> ${NPCDescriptionHTML} </div>` : '';

        let traitsHtml = '';
        if (traits && traits.length > 0) {
            let traitsToRender = [...traits];
            if (sortTraitsAlpha ?? true) {
                traitsToRender.sort((a, b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
            }
            traitsHtml = traitsToRender.map(trait => {
                if (!trait) return ''; // Skip null traits
                const processedDescription = window.app.processTraitString(trait.description || '', activeNPC); //, added fallback
                return `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${trait.name || 'Unnamed Trait'}.</b></i> ${processedDescription}</div>`
            }).join('');
        }

        const createActionSection = (actionList, title, boilerplate = '') => {
            // Ensure actionList is an array before proceeding
            if (!Array.isArray(actionList) || actionList.length === 0) return '';

            let sortedList = [...actionList];
            if(title === 'Actions') {
                let multiattack = null;
                const otherItems = sortedList.filter(item => {
                    if (item && item.name && item.name.toLowerCase() === 'multiattack') { // Added checks
                        multiattack = item;
                        return false;
                    }
                    return true;
                });
                otherItems.sort((a,b) => (a?.name || '').localeCompare(b?.name || '')); // Added checks
                sortedList = multiattack ? [multiattack, ...otherItems] : otherItems;
            } else {
                sortedList.sort((a,b) => (a?.name || '').localeCompare(b?.name || '')); // Added checks
            }

            const actionItemsHtml = sortedList.map(action => {
                if (!action) return ''; // Skip null actions
                const processedDesc = window.app.processTraitString(action.desc || '', activeNPC); //, added fallback
                return `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${action.name || 'Unnamed Action'}.</b></i> ${processedDesc}</div>`;
            }).join('');

            const boilerplateHtml = boilerplate ? `<div class="npctop" style="padding-bottom: 0.5em; color: black;">${window.app.processTraitString(boilerplate, activeNPC)}</div>` : ''; //

            return `
                <div class="action-header">${title}</div>
                <div class="npcdiv2">
                    <svg viewBox="0 0 200 1" preserveAspectRatio="none" width="100%" height="1">
                        <polyline points="0,0 200,0 200,1 0,1" fill="#7A200D" class="whoosh"></polyline>
                    </svg>
                </div>
                ${boilerplateHtml}
                ${actionItemsHtml}
            `;
        };

        // Ensure actions object and its properties exist
        const safeActions = actions || {};
        const actionsHtml = createActionSection(safeActions.actions, 'Actions');
        const bonusActionsHtml = createActionSection(safeActions['bonus-actions'], 'Bonus Actions');
        const reactionsHtml = createActionSection(safeActions.reactions, 'Reactions');
        const legendaryActionsHtml = createActionSection(safeActions['legendary-actions'], 'Legendary Actions', legendaryBoilerplate);
        const lairActionsHtml = createActionSection(safeActions['lair-actions'], 'Lair Actions', lairBoilerplate);


        const generatedHtml = `
            <div class="container">
                <div class="cap"></div>
                <div class="npcname"><b>${NPCName}</b></div>
                <div class="npctype"><i>${NPCTypeString}</i></div>
                <div class="npcdiv">
                    <svg width="100%" height="5"><use href="#divider-swoosh"></use></svg>
                </div>
                <div class="npctop"><b>Armor Class</b> ${NPCac}</div>
                <div class="npctop"><b>Hit Points</b> ${NPChp}</div>
                <div class="npctop"><b>Speed</b> ${NPCspeed}</div>
                <div class="npcdiv">
                    <svg width="100%" height="5"><use href="#divider-swoosh"></use></svg>
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
                    <svg width="100%" height="5"><use href="#divider-swoosh"></use></svg>
                </div>
                ${saves ? `<div class="npctop"><b>Saving Throws</b> ${saves}</div>` : ''}
                ${npcSkills ? `<div class="npctop"><b>Skills</b> ${npcSkills}</div>` : ''}
                ${vulnerabilities ? `<div class="npctop"><b>Damage Vulnerabilities</b> ${vulnerabilities}</div>` : ''}
                ${resistances ? `<div class="npctop"><b>Damage Resistances</b> ${resistances}</div>` : ''}
                ${immunities ? `<div class="npctop"><b>Damage Immunities</b> ${immunities}</div>` : ''}
                ${conditionImmunities ? `<div class="npctop"><b>Condition Immunities</b> ${conditionImmunities}</div>` : ''}
                ${senses ? `<div class="npctop"><b>Senses</b> ${senses}</div>` : ''}
                ${languages ? `<div class="npctop"><b>Languages</b> ${languages}</div>` : ''}
                ${challenge ? `<div class="npctop"><b>Challenge</b> ${challenge} (${experience} XP)</div>` : ''}
                ${traitsHtml ? `<div class="npcdiv"><svg width="100%" height="5"><use href="#divider-swoosh"></use></svg></div>` : ''}
                ${traitsHtml}
                ${actionsHtml}
                ${bonusActionsHtml}
                ${reactionsHtml}
                ${legendaryActionsHtml}
                ${lairActionsHtml}
                <div class="npcbottom">&nbsp;</div>
                <div class="cap"></div>
            </div>
            ${descriptionHtml}
        `;

        // --- End of copied section from viewport.js ---

        // This is the one line that is different: Write to the import viewport
        importViewportElement.innerHTML = generatedHtml;
    }
};