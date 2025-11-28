// import.js
window.importer = {
   importNPC: null,
   htmlLoaded: false,
   processTextDebounceTimer: null, // Timer for debouncing

   // --- Helper Function ---
   /**
    * Converts a string to Title Case.
    * @param {string} str - The string to convert.
    * @returns {string} The Title Cased string.
    */
   toTitleCase(str) {
      if (!str) return "";
      // Basic Title Case, doesn't handle articles/prepositions specially.
      return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
   },


   // --- Core Functions ---

   /**
    * Initializes the importer by setting up event listeners.
    */
   init() {
      this.htmlLoaded = true;
      // Get elements from window.ui, which should be populated by ui-elements.js
      this.setupEventListeners();
   },

   /**
    * Opens the importer modal, resets the staging object, and renders a blank viewport.
    */
   openImportModal() {
      if (!this.htmlLoaded) {
         console.error("Importer failed to initialize.");
         return;
      }
      this.importNPC = JSON.parse(JSON.stringify(window.app.defaultNPC));
      this.importNPC.name = "Import Preview";

      // Set initial state (State 1: Raw Text visible)
      if (window.ui.importPaneRaw) window.ui.importPaneRaw.classList.remove('hidden');
      if (window.ui.importPaneFiltered) window.ui.importPaneFiltered.classList.add('hidden');
      if (window.ui.importToggleViewBtn) window.ui.importToggleViewBtn.textContent = 'View Filtered Text';

      // Clear both text areas
      if (window.ui.importSourceArea) window.ui.importSourceArea.value = '';
      if (window.ui.importTextArea) window.ui.importTextArea.value = '';
      
      // Reset filter dropdown to 'No Filter' when modal opens
      if (window.ui.importFilterSelect) window.ui.importFilterSelect.value = 'noFilter';
      
      // Reset filter status text
      if (window.ui.importFilterStatus) window.ui.importFilterStatus.innerHTML = '&nbsp;';
      
      this.updateImportViewport();

      window.app.openModal('import-modal');
      // Focus the new source textarea after modal opens
      setTimeout(() => window.ui.importSourceArea?.focus(), 50);
   },

   closeImportModal() {
      window.app.closeModal('import-modal');
      this.importNPC = null;
   },

   /**
    * Reads text from the source window, applies the selected filter and cleaner,
    * puts the result in the cleaned window, and then triggers a parse.
    * This is the new central processing function.
    */
   processSourceText() {
      if (!this.htmlLoaded) return;

      const sourceText = window.ui.importSourceArea ? window.ui.importSourceArea.value : '';
      const selectedFilter = window.ui.importFilterSelect ? window.ui.importFilterSelect.value : 'noFilter';
      
      let textToProcess = sourceText;
      
      // 1. Apply the selected filter
      let filteredText;
      let filterName = "No filter";
      switch (selectedFilter) {
         case 'pdfFilter1':
            filteredText = window.filters.applyPdfFilter1(textToProcess);
            filterName = "PDF Filter 1";
            break;
         case 'pdfFilter2':
            filteredText = window.filters.applyPdfFilter2(textToProcess);
            filterName = "PDF Filter 2";
            break;
         case 'pdfFilter3':
            filteredText = window.filters.applyPdfFilter3(textToProcess);
            filterName = "PDF Filter 3";
            break;
         case 'pdfFilter4':
            filteredText = window.filters.applyPdfFilter4(textToProcess);
            filterName = "PDF Filter 4";
            break;
         case 'pdfFilter5':
            filteredText = window.filters.applyPdfFilter5(textToProcess);
            filterName = "PDF Filter 5";
            break;
         case 'noFilter':
         default:
            filteredText = window.filters.applyNoFilter(textToProcess);
            break;
      }
      
      // Update filter status text
      if (window.ui.importFilterStatus) {
         if (selectedFilter !== 'noFilter') {
            window.ui.importFilterStatus.textContent = `${filterName} applied.`;
         } else {
            window.ui.importFilterStatus.innerHTML = '&nbsp;';
         }
      }
      
      // 2. Run filtered text through the main cleaner
      let cleanedText = "";
      if (window.importCleaner && typeof window.importCleaner.cleanImportText === 'function') {
         cleanedText = window.importCleaner.cleanImportText(filteredText);
      } else {
         cleanedText = filteredText; // Fallback
      }
      
      // 3. Insert into the (now read-only) cleaned textarea
      if (window.ui.importTextArea) {
         window.ui.importTextArea.value = cleanedText;
         // Adjust scroll to top
         window.ui.importTextArea.scrollTop = 0;
      }
      
      // 4. Call parseText() (which reads from the cleaned textarea)
      this.parseText();
   },

   /**
    * Parses the text in #import-text-area (the CLEANED window) and updates this.importNPC.
    */
   parseText() {
      if (!this.htmlLoaded) return;
      
      this.importNPC = JSON.parse(JSON.stringify(window.app.defaultNPC));

      // This function correctly reads from the cleaned text area
      const cleanedText = window.ui.importTextArea ? window.ui.importTextArea.value : '';
      if (!cleanedText) {
         this.importNPC.name = "Import Preview";
         this.updateImportViewport();
         return;
      }
      
      const lines = cleanedText.split('\n'); // Split cleaned text
      if (lines.length === 0 || lines.every(line => !line.trim())) {
          this.importNPC.name = "Import Preview";
          this.updateImportViewport();
          return;
      }

      let currentLineIndex = 0;
      let currentSection = 'header'; // header, stats, traits, actions, legendary
      let currentItem = null; // Holds the current trait/action object being processed for multi-line descriptions

      // Helper function to safely get next line, trimming it
      const getLine = (index) => (index < lines.length ? lines[index].trim() : null);
      // Helper to peek next line (no trim)
      const peekLine = (index) => (index + 1 < lines.length ? lines[index + 1] : null); // Return raw line


      // --- Line 1: Name ---
      this.importNPC.name = this.toTitleCase(getLine(currentLineIndex++) || "Unnamed Import");
      
      // --- Line 2: Size Type (Species), Alignment ---
      let line = getLine(currentLineIndex);
      if (line) {
         const sizeTypeAlignRegex = /^(\w+)\s+(.+?)(?:,\s*(.*?))?$/i;
         const match = line.match(sizeTypeAlignRegex);
         if (match) {
            this.importNPC.size = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            let typeSpecies = match[2].trim();
            this.importNPC.alignment = (match[3] || '').toLowerCase().replace(/^typically\s+/,'');

            // Check for species in parentheses
            const speciesMatch = typeSpecies.match(/^(.*?)\s*\((.+)\)$/);
            if (speciesMatch) {
               this.importNPC.type = speciesMatch[1].trim().toLowerCase();
               this.importNPC.species = speciesMatch[2].trim();
            } else {
               this.importNPC.type = typeSpecies.toLowerCase();
               this.importNPC.species = "";
            }
            currentLineIndex++;
         } else {
             console.warn("Could not parse Size/Type/Alignment line:", line);
         }
      }

      // --- Process Remaining Lines ---
      while (currentLineIndex < lines.length) {
         line = getLine(currentLineIndex);
         if (!line) { currentLineIndex++; continue; } // Skip effectively blank lines after trimming

         const headerKeywordRegex = /^(Armor Class|Hit Points|Speed|STR DEX CON INT WIS CHA|Saving Throws|Skills|Damage Vulnerabilities|Damage Resistances|Damage Immunities|Condition Immunities|Senses|Languages|Challenge|Proficiency Bonus)/i;
         
         const lowerLine = line.toLowerCase();
         if (lowerLine === 'actions') {
            currentSection = 'actions';
            currentItem = null;
            currentLineIndex++;
            continue;
         } else if (lowerLine === 'bonus actions') {
            currentSection = 'bonusActions';
            currentItem = null;
            currentLineIndex++;
            continue;
         } else if (lowerLine === 'reactions') {
            currentSection = 'reactions';
            currentItem = null;
            currentLineIndex++;
            continue;
         } else if (lowerLine === 'lair actions') {
            currentSection = 'lairActions';
            currentItem = null;
            currentLineIndex++;
            // Check for boilerplate
            let nextLine = peekLine(currentLineIndex-1);
            if (nextLine && nextLine.trim() && nextLine.trim().toLowerCase().startsWith("on initiative")) {
                this.importNPC.lairBoilerplate = nextLine.trim();
                currentLineIndex++; // Consume the boilerplate line
            }
            continue;
         } else if (lowerLine === 'legendary actions') {
            currentSection = 'legendary';
            currentItem = null;
            currentLineIndex++;
            let nextLine = peekLine(currentLineIndex-1); // Peek next line (raw)
            // FIXED: Explicitly check for boilerplate text
            if (nextLine && nextLine.trim() && nextLine.trim().toLowerCase().startsWith("the ")) {
                this.importNPC.legendaryBoilerplate = nextLine.trim();
                currentLineIndex++; // Consume the boilerplate line
            }
            continue;
         }
         // Add more section checks (Bonus Actions, Reactions, Lair Actions) here if needed

         if (currentSection === 'header') {
            let match;
            if ((match = line.match(/^Armor Class\s+(.*)/i))) {
               this.importNPC.armorClass = match[1].trim();
            } else if ((match = line.match(/^Hit Points\s+(\d+)\s*\((.*?)\)/i))) {
               this.importNPC.hitPoints = `${match[1]} (${match[2]})`;
            } else if (line.match(/^Speed\s+/i)) { // Check more generally
               this.parseSpeed(line);
            } else if (line.match(/^STR\s+DEX\s+CON\s+INT\s+WIS\s+CHA/i)) { // More robust check
               currentSection = 'stats';
            } else if ((match = line.match(/^Saving Throws\s+(.*)/i))) {
               this.parseSaves(match[1]);
            } else if ((match = line.match(/^Skills\s+(.*)/i))) {
               this.parseSkills(match[1]);
            } else if ((match = line.match(/^Damage Vulnerabilities\s+(.*)/i))) {
               let vulnString = match[1].trim();
               while (true) {
                  let nextLine = peekLine(currentLineIndex);
                  if (nextLine && !headerKeywordRegex.test(nextLine.trim())) {
                     vulnString += " " + nextLine.trim();
                     currentLineIndex++;
                  } else { break; }
               }
               this.parseDamageModifiers(vulnString, 'vulnerability');

            } else if ((match = line.match(/^Damage Resistances\s+(.*)/i))) {
               let resString = match[1].trim();
               while (true) {
                  let nextLine = peekLine(currentLineIndex);
                  if (nextLine && !headerKeywordRegex.test(nextLine.trim())) {
                     resString += " " + nextLine.trim();
                     currentLineIndex++;
                  } else { break; }
               }
               this.parseDamageModifiers(resString, 'resistance');

            } else if ((match = line.match(/^Damage Immunities\s+(.*)/i))) {
               let immString = match[1].trim();
               while (true) {
                  let nextLine = peekLine(currentLineIndex);
                  if (nextLine && !headerKeywordRegex.test(nextLine.trim())) {
                     immString += " " + nextLine.trim();
                     currentLineIndex++;
                  } else { break; }
               }
               this.parseDamageModifiers(immString, 'immunity');

            } else if ((match = line.match(/^Condition Immunities\s+(.*)/i))) {
               let ciString = match[1].trim();
               while (true) {
                  let nextLine = peekLine(currentLineIndex);
                  if (nextLine && !headerKeywordRegex.test(nextLine.trim())) {
                     ciString += " " + nextLine.trim();
                     currentLineIndex++;
                  } else { break; }
               }
               this.parseConditionImmunities(ciString);

            } else if (line.match(/^Senses\s+/i)) { 
               let linesConsumed = this.parseSenses(line, peekLine(currentLineIndex)?.trim()); 
               currentLineIndex += linesConsumed; 
               currentLineIndex++; 
               continue; 

            } else if ((match = line.match(/^Languages\s+(.*)/i))) {
               let langString = match[1].trim();
               while (true) {
                  let nextLine = peekLine(currentLineIndex);
                  if (nextLine && !headerKeywordRegex.test(nextLine.trim())) {
                     langString += " " + nextLine.trim();
                     currentLineIndex++;
                  } else { break; }
               }
               this.parseLanguages(langString);
            } else if ((match = line.match(/^Challenge\s+([\d\/]+)\s*\((\d{1,3}(?:,?\d{3})*)\s*XP\)(?:\s*Proficiency Bonus\s*([+-]\d+))?/i))) {
               this.importNPC.challenge = match[1];
               this.importNPC.experience = match[2]; // Keep comma
               if (match[3]) {
                  this.importNPC.proficiencyBonus = parseInt(match[3].replace('+',''), 10);
               } else {
                  this.importNPC.proficiencyBonus = window.app.calculateProficiencyBonus(match[1]);
               }
               currentSection = 'traits';
            } else {
               currentSection = 'traits';
               currentItem = null; // Ensure currentItem is reset before reprocessing
               continue; // Re-process this line in the 'traits' section
            }
         }
         else if (currentSection === 'stats') {
             const statRegex = /(\d+)\s*(?:\([+-]?\d+\))?\s+(\d+)\s*(?:\([+-]?\d+\))?\s+(\d+)\s*(?:\([+-]?\d+\))?\s+(\d+)\s*(?:\([+-]?\d+\))?\s+(\d+)\s*(?:\([+-]?\d+\))?\s+(\d+)\s*(?:\([+-]?\d+\))?/;
             const match = line.match(statRegex);
             if (match) {
                 this.importNPC.strength = parseInt(match[1], 10);
                 this.importNPC.dexterity = parseInt(match[2], 10);
                 this.importNPC.constitution = parseInt(match[3], 10);
                 this.importNPC.intelligence = parseInt(match[4], 10);
                 this.importNPC.wisdom = parseInt(match[5], 10);
                 this.importNPC.charisma = parseInt(match[6], 10);
                 currentSection = 'header'; // Go back to parsing header items below stats
             } else {
                console.warn("Could not parse stat line:", line);
                currentSection = 'header'; // Assume stats done even if parse failed
                continue; // Re-process line in header context
             }
         }
         else if (currentSection === 'traits') {
            // *** FIXED: Regex now requires trait to start with an uppercase letter ***
            const traitMatch = line.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/);

            if (traitMatch) {
               // Always start a new trait when pattern matches
               currentItem = { name: traitMatch[1].trim(), desc: traitMatch[2].trim() };
               this.importNPC.traits.push(currentItem);
            } else if (currentItem) {
               // Doesn't match pattern, append if currentItem exists
               currentItem.desc += " " + line;
            } else if (line) {
               // Orphan line
               console.warn("Assuming line is a trait name (missing period?):", line);
               currentItem = { name: line.trim(), desc: "" };
               this.importNPC.traits.push(currentItem);
            } else {
               // Blank line, reset
               console.warn("Skipping potentially empty trait line:", line);
               currentItem = null;
            }

            // --- NEW LINE-JOINING LOGIC (Based on User's Idea) ---
            if (currentItem && !currentItem.name.toLowerCase().startsWith('innate spellcasting') && currentItem.name.toLowerCase() !== 'spellcasting') {
               let nextLineRaw = peekLine(currentLineIndex);
               while (nextLineRaw !== null) {
                  const currentDesc = currentItem.desc.trim();
                  const nextLine = nextLineRaw.trim();
                  
                  // Stop if current line ends in punctuation
                  if (/[.:]$/.test(currentDesc)) {
                     break; 
                  }

                  // 1. Hyphenation Check
                  const hyphenMatch = currentDesc.match(/(\w+)-$/);
                  const nextLineLowerMatch = nextLine.match(/^([a-z])/);
                  if (hyphenMatch && nextLineLowerMatch) {
                     currentItem.desc = currentDesc.substring(0, currentDesc.length - 1) + nextLine; // Remove hyphen and join
                     currentLineIndex++; // Consume the next line
                     nextLineRaw = peekLine(currentLineIndex); // Peek next
                     continue; // Continue loop
                  }

                  // 2. Continuation Check (lowercase, space, or number)
                  const continuationMatch = nextLineRaw.match(/^( ?[a-z0-9])/); // Check raw line
                  if (continuationMatch) {
                     currentItem.desc += " " + nextLine; // Append trimmed line
                     currentLineIndex++; // Consume the next line
                     nextLineRaw = peekLine(currentLineIndex); // Peek next
                     continue; // Continue loop
                  }

                  // 3. No match, break
                  break;
               }
            }
            // --- END NEW LINE-JOINING LOGIC ---
         }
         else if (currentSection === 'actions') {
            const spellcastingHeaderMatch = line.match(/^Spellcasting\.\s*(.*)/i);
            const standardAttackMatch = line.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):\s*(.*)/i);
            // *** FIXED: Regex now requires action to start with an uppercase letter ***
            const actionMatch = line.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/);

            if (spellcastingHeaderMatch) {
                currentItem = null;
                this.importNPC.hasSpellcasting = true;
                this.importNPC.spellcastingPlacement = 'actions';
                
                // 1. Consume multi-line boilerplate (look ahead until we see a Frequency or new Action)
                let boilerplate = spellcastingHeaderMatch[1].trim();
                while (true) {
                    let nextLine = peekLine(currentLineIndex);
                    if (!nextLine) break;
                    
                    // Check if next line is a spell frequency (e.g. "At will:", "3/day:")
                    const isFrequency = /^(At will|(?:\d+\s*\/\s*day(?:\s+each)?)):/i.test(nextLine.trim());
                    if (isFrequency) break;
                    
                    // Check if next line looks like a new Action start (safety break)
                    const isNewAction = /^(Melee|Ranged|Legendary|Actions|Bonus|Reactions)/i.test(nextLine.trim());
                    if (isNewAction) break;

                    // Otherwise, it's part of the description
                    boilerplate += " " + nextLine.trim();
                    currentLineIndex++;
                }

                // 2. Parse Ability/DC from the full boilerplate
                const castingInfoMatch = boilerplate.match(/using (\w+) .* \(spell save DC (\d+)\)/i);
                if (castingInfoMatch) {
                    this.importNPC.actionCastingAbility = castingInfoMatch[1].toLowerCase();
                    this.importNPC.actionCastingDC = parseInt(castingInfoMatch[2], 10);
                }

                // 3. Parse Spells
                let spellListIndex = 0;
                this.importNPC.actionCastingSpells = JSON.parse(JSON.stringify(window.app.defaultNPC.actionCastingSpells));
                
                while (spellListIndex < this.importNPC.actionCastingSpells.length) {
                    currentLineIndex++;
                    let spellLine = getLine(currentLineIndex);
                    const spellListMatch = spellLine ? spellLine.match(/^(.*?):\s*(.*)/) : null;
                    
                    if (spellListMatch && (spellListMatch[1].toLowerCase() === 'at will' || spellListMatch[1].match(/^\d+\s*\/\s*day(?:\s+each)?/i))) {
                           this.importNPC.actionCastingSpells[spellListIndex].freq = spellListMatch[1].trim();
                           // Remove italics tags if present in source
                           const spellNames = spellListMatch[2].split(',')
                               .map(spell => spell.replace(/<\/?i>/g, '').replace(/\*/g, '').trim().toLowerCase())
                               .filter(spell => spell);
                           this.importNPC.actionCastingSpells[spellListIndex].list = spellNames.join(', ');
                        spellListIndex++;
                    } else {
                        currentLineIndex--; // Backtrack if not a match
                        break;
                    }
                }
                currentLineIndex++; 
                continue; 
            }
            else if (standardAttackMatch) {
               // Standard attacks always start a new item
               currentItem = { name: standardAttackMatch[1].trim(), desc: line.trim() }; // Use full line
               this.importNPC.actions.actions.push(currentItem);
            }
            else if (actionMatch) {
               // Regular Name. Desc pattern starts a new item
               currentItem = { name: actionMatch[1].trim(), desc: actionMatch[2].trim() };
               this.importNPC.actions.actions.push(currentItem);
            }
            else if (currentItem) {
               // Append if the line doesn't look like a new action or if we already have an item
               currentItem.desc += " " + line;
            } else {
               // Orphan line
               console.warn("Could not parse action line (orphan line?):", line);
               currentItem = null;
            }

            // --- NEW LINE-JOINING LOGIC (Actions) ---
            if (currentItem) {
               let nextLineRaw = peekLine(currentLineIndex);
               while (nextLineRaw !== null) {
                  const currentDesc = currentItem.desc.trim();
                  const nextLine = nextLineRaw.trim();
                  
                  // Check start of *next* line for patterns that signal a *new* action
                  const nextLineIsNewAction = nextLine.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):/i) ||
                                            nextLine.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/); // *** FIXED: Use stricter regex ***

                  // Stop if current line ends in punctuation AND next line looks like a new action
                  if (/[.:]$/.test(currentDesc) && nextLineIsNewAction) {
                     break;
                  }

                  // 1. Hyphenation Check
                  const hyphenMatch = currentDesc.match(/(\w+)-$/);
                  const nextLineLowerMatch = nextLine.match(/^([a-z])/);
                  if (hyphenMatch && nextLineLowerMatch) {
                     currentItem.desc = currentDesc.substring(0, currentDesc.length - 1) + nextLine; // Remove hyphen and join
                     currentLineIndex++;
                     nextLineRaw = peekLine(currentLineIndex);
                     continue;
                  }

                  // 2. Continuation Check (lowercase, space, or number)
                  //    AND next line does NOT look like a new action
                  const continuationMatch = nextLineRaw.match(/^( ?[a-z0-9])/); // Check raw line
                  if (continuationMatch && !nextLineIsNewAction) { 
                     currentItem.desc += " " + nextLine; // Append trimmed line
                     currentLineIndex++;
                     nextLineRaw = peekLine(currentLineIndex);
                     continue;
                  }
                  
                  // 3. If it's a continuation *but* also matches a new action (e.g., "Hit."),
                  //    let's append it anyway, as it's part of the current action description.
                  if (continuationMatch && nextLineIsNewAction) {
                     currentItem.desc += " " + nextLine; // Append trimmed line
                     currentLineIndex++;
                     nextLineRaw = peekLine(currentLineIndex);
                     continue;
                  }

                  // 4. No match, break
                  break;
               }
            }
            // --- END NEW LINE-JOINING LOGIC (Actions) ---
         }
         // --- START NEW BLOCKS ---
         else if (currentSection === 'bonusActions') {
            const standardAttackMatch = line.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):\s*(.*)/i);
            const actionMatch = line.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/); // *** FIXED ***

            if (standardAttackMatch) {
               currentItem = { name: standardAttackMatch[1].trim(), desc: line.trim() };
               this.importNPC.actions['bonus-actions'].push(currentItem);
            }
            else if (actionMatch) {
               currentItem = { name: actionMatch[1].trim(), desc: actionMatch[2].trim() };
               this.importNPC.actions['bonus-actions'].push(currentItem);
            }
            else if (currentItem) {
               currentItem.desc += " " + line;
            } else {
               console.warn("Could not parse bonus action line (orphan line?):", line);
               currentItem = null;
            }
            // Line joining
            if (currentItem) {
               let nextLineRaw = peekLine(currentLineIndex);
               while (nextLineRaw !== null) {
                  const currentDesc = currentItem.desc.trim();
                  const nextLine = nextLineRaw.trim();
                  const nextLineIsNewAction = nextLine.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):/i) || nextLine.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/); // *** FIXED ***
                  if (/[.:]$/.test(currentDesc) && nextLineIsNewAction) break;
                  const hyphenMatch = currentDesc.match(/(\w+)-$/);
                  const nextLineLowerMatch = nextLine.match(/^([a-z])/);
                  if (hyphenMatch && nextLineLowerMatch) {
                     currentItem.desc = currentDesc.substring(0, currentDesc.length - 1) + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  const continuationMatch = nextLineRaw.match(/^( ?[a-z0-9])/);
                  if (continuationMatch && !nextLineIsNewAction) { 
                     currentItem.desc += " " + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  if (continuationMatch && nextLineIsNewAction) {
                     currentItem.desc += " " + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  break;
               }
            }
         }
         else if (currentSection === 'reactions') {
            const standardAttackMatch = line.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):\s*(.*)/i);
            const actionMatch = line.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/); // *** FIXED ***

            if (standardAttackMatch) {
               currentItem = { name: standardAttackMatch[1].trim(), desc: line.trim() };
               this.importNPC.actions.reactions.push(currentItem);
            }
            else if (actionMatch) {
               currentItem = { name: actionMatch[1].trim(), desc: actionMatch[2].trim() };
               this.importNPC.actions.reactions.push(currentItem);
            }
            else if (currentItem) {
               currentItem.desc += " " + line;
            } else {
               console.warn("Could not parse reaction line (orphan line?):", line);
               currentItem = null;
            }
            // Line joining
            if (currentItem) {
               let nextLineRaw = peekLine(currentLineIndex);
               while (nextLineRaw !== null) {
                  const currentDesc = currentItem.desc.trim();
                  const nextLine = nextLineRaw.trim();
                  const nextLineIsNewAction = nextLine.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):/i) || nextLine.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/); // *** FIXED ***
                  if (/[.:]$/.test(currentDesc) && nextLineIsNewAction) break;
                  const hyphenMatch = currentDesc.match(/(\w+)-$/);
                  const nextLineLowerMatch = nextLine.match(/^([a-z])/);
                  if (hyphenMatch && nextLineLowerMatch) {
                     currentItem.desc = currentDesc.substring(0, currentDesc.length - 1) + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  const continuationMatch = nextLineRaw.match(/^( ?[a-z0-9])/);
                  if (continuationMatch && !nextLineIsNewAction) { 
                     currentItem.desc += " " + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  if (continuationMatch && nextLineIsNewAction) {
                     currentItem.desc += " " + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  break;
               }
            }
         }
         else if (currentSection === 'lairActions') {
            const standardAttackMatch = line.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):\s*(.*)/i);
            const actionMatch = line.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/); // *** FIXED ***

            if (standardAttackMatch) {
               currentItem = { name: standardAttackMatch[1].trim(), desc: line.trim() };
               this.importNPC.actions['lair-actions'].push(currentItem);
            }
            else if (actionMatch) {
               currentItem = { name: actionMatch[1].trim(), desc: actionMatch[2].trim() };
               this.importNPC.actions['lair-actions'].push(currentItem);
            }
            else if (currentItem) {
               currentItem.desc += " " + line;
            } else {
               console.warn("Could not parse lair action line (orphan line?):", line);
               currentItem = null;
            }
            // Line joining
            if (currentItem) {
               let nextLineRaw = peekLine(currentLineIndex);
               while (nextLineRaw !== null) {
                  const currentDesc = currentItem.desc.trim();
                  const nextLine = nextLineRaw.trim();
                  const nextLineIsNewAction = nextLine.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):/i) || nextLine.match(/^([A-Z][\w\s().,'’–—\/]+?)\.\s*(.*)/); // *** FIXED ***
                  if (/[.:]$/.test(currentDesc) && nextLineIsNewAction) break;
                  const hyphenMatch = currentDesc.match(/(\w+)-$/);
                  const nextLineLowerMatch = nextLine.match(/^([a-z])/);
                  if (hyphenMatch && nextLineLowerMatch) {
                     currentItem.desc = currentDesc.substring(0, currentDesc.length - 1) + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  const continuationMatch = nextLineRaw.match(/^( ?[a-z0-9])/);
                  if (continuationMatch && !nextLineIsNewAction) { 
                     currentItem.desc += " " + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  if (continuationMatch && nextLineIsNewAction) {
                     currentItem.desc += " " + nextLine;
                     currentLineIndex++; nextLineRaw = peekLine(currentLineIndex); continue;
                  }
                  break;
               }
            }
         }
         // --- END NEW BLOCKS ---
         else if (currentSection === 'legendary') {
             // FIXED: Removed period . from the character class to stop it from consuming the delimiter
             const legendaryMatch = line.match(/^([\w\s(),'’–—\/-]+?)(?:\s*\((Costs\s+\d+\s+Actions?)\))?\.\s*(.*)/);

             if (legendaryMatch) {
                 // If the line matches the pattern, it starts a new legendary action.
                 let name = legendaryMatch[1].trim();
                 let descText = legendaryMatch[3].trim();
                 if (legendaryMatch[2]) {
                     name += ` (${legendaryMatch[2]})`;
                 }
                 currentItem = { name: name, desc: descText };
                 this.importNPC.actions['legendary-actions'].push(currentItem);
             } else if (currentItem) {
                 // Line does NOT match pattern, but we have an active item -> append.
                 currentItem.desc += " " + line;
             } else {
                 // Line does NOT match patterns, and no active item -> boilerplate or orphan.
                 if (!this.importNPC.legendaryBoilerplate && line.length > 50) { // Simple boilerplate check
                     console.log(`Assuming line is legendary boilerplate: ${line}`);
                     this.importNPC.legendaryBoilerplate = line;
                 } else {
                     console.warn("Could not parse legendary action line (orphan line?):", line);
                 }
                 currentItem = null; // Ensure currentItem remains null
             }

            // --- NEW LINE-JOINING LOGIC (Legendary) ---
            if (currentItem) {
               let nextLineRaw = peekLine(currentLineIndex);
               while (nextLineRaw !== null) {
                  const currentDesc = currentItem.desc.trim();
                  const nextLine = nextLineRaw.trim();

                  // FIXED: Removed period . from the character class here as well
                  const nextLineIsNewAction = nextLine.match(/^([\w\s(),'’–—\/-]+?)(?:\s*\((Costs\s+\d+\s+Actions?)\))?\.\s*(.*)/);

                  if (/[.:]$/.test(currentDesc) && nextLineIsNewAction) {
                     break;
                  }

                  // 1. Hyphenation Check
                  const hyphenMatch = currentDesc.match(/(\w+)-$/);
                  const nextLineLowerMatch = nextLine.match(/^([a-z])/);
                  if (hyphenMatch && nextLineLowerMatch) {
                     currentItem.desc = currentDesc.substring(0, currentDesc.length - 1) + nextLine;
                     currentLineIndex++;
                     nextLineRaw = peekLine(currentLineIndex);
                     continue;
                  }

                  // 2. Continuation Check (lowercase, space, or number)
                  const continuationMatch = nextLineRaw.match(/^( ?[a-z0-9])/); // Check raw line
                  if (continuationMatch && !nextLineIsNewAction) { // Only join if it doesn't look like a new action
                     currentItem.desc += " " + nextLine; // Append trimmed line
                     currentLineIndex++;
                     nextLineRaw = peekLine(currentLineIndex);
                     continue;
                  }

                  // 3. If it's a continuation *but* also matches a new action
                  if (continuationMatch && nextLineIsNewAction) {
                     currentItem.desc += " " + nextLine; // Append trimmed line
                     currentLineIndex++;
                     nextLineRaw = peekLine(currentLineIndex);
                     continue;
                  }

                  break;
               }
            }
            // --- END NEW LINE-JOINING LOGIC (Legendary) ---
         }


         currentLineIndex++; // Move to the next line for the next iteration
      } // End while loop

      // --- Post-Processing ---
      this.parseInnateSpellcastingTrait();
      this.parseTraitSpellcastingTrait();

      ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
           this.importNPC[`${ability}Bonus`] = window.app.calculateAbilityBonus(this.importNPC[ability]);
       });
      this.inferSavesAndSkills(); // This now fixes adjustments
      window.app.calculateAllStats.call({ activeNPC: this.importNPC }); // This now uses fixed adjustments

      this.updateImportViewport();
   },

   // --- Parse Innate Spellcasting from Trait Description ---
   parseInnateSpellcastingTrait() {
      // Find trait case-insensitively, allowing variations like "(Psionics)"
      const traitIndex = this.importNPC.traits.findIndex(trait => trait?.name?.toLowerCase().startsWith('innate spellcasting'));
      if (traitIndex === -1) return; // Trait not found

      const trait = this.importNPC.traits[traitIndex];
      const desc = trait.desc || '';

      this.importNPC.hasInnateSpellcasting = true;
      this.importNPC.innateIsPsionics = trait.name.toLowerCase().includes('(psionics)');

      // Extract Ability and DC
      const abilityDcRegex = /ability is (\w+)(?:.*?\(spell save DC (\d+))?/i;
      const abilityDcMatch = desc.match(abilityDcRegex);
      if (abilityDcMatch) {
         this.importNPC.innateAbility = abilityDcMatch[1].toLowerCase();
         // Store DC only if explicitly found, otherwise let it be auto-calculated
         if (abilityDcMatch[2]) {
            this.importNPC.innateDC = parseInt(abilityDcMatch[2], 10);
         } else {
            this.importNPC.innateDC = undefined; // Ensure auto-calc happens
         }
      } else {
          this.importNPC.innateDC = undefined; // Ensure auto-calc if regex fails
      }

      // Extract Components
      const componentsRegex = /spells(?:,\s*(requiring .*?))?\s*:/i;
      const componentsMatch = desc.match(componentsRegex);
      if (componentsMatch && componentsMatch[1]) {
         this.importNPC.innateComponents = componentsMatch[1].trim();
      } else {
         this.importNPC.innateComponents = window.app.defaultNPC.innateComponents;
      }
      
      // --- Extract Spells Block ---
      const spellsStartIndex = desc.indexOf(':');
      if (spellsStartIndex === -1) {
         console.warn("Could not find start of innate spell list (missing colon ':').");
         this.importNPC.traits.splice(traitIndex, 1); // Remove trait even if spells fail
         return;
      }
      
      // *** START FIX: Smarter spell block end detection ***
      const sectionKeywords = [' ACTIONS', ' REACTIONS', ' LEGENDARY ACTIONS', ' LAIR ACTIONS', ' BONUS ACTIONS'];
      let spellsEndIndex = desc.length;
      
      for (const keyword of sectionKeywords) {
         const keywordIndex = desc.indexOf(keyword, spellsStartIndex);
         if (keywordIndex !== -1 && keywordIndex < spellsEndIndex) {
            spellsEndIndex = keywordIndex;
         }
      }
      // *** END FIX ***

      const spellsBlock = desc.substring(spellsStartIndex + 1, spellsEndIndex).trim();

      // --- Parse Spells Block ---
      // *** START FIX: Regex lookahead now accepts \s* (any whitespace) and stops at end of string ($) ***
      // This regex is now more specific to only match valid frequencies and not "polymorph 1/day"
      const spellGroupRegex = /(At will|(?:\d+\s*\/\s*day(?:\s+each)?)):\s*([\s\S]*?)(?=(\s*(?:At will|(?:\d+\s*\/\s*day(?:\s+each)?)):)|$)/gi;
      // *** END FIX ***
      let match;
      let spellListIndex = 0;
      this.importNPC.innateSpells = JSON.parse(JSON.stringify(window.app.defaultNPC.innateSpells)); // Deep copy defaults

      while ((match = spellGroupRegex.exec(spellsBlock)) !== null && spellListIndex < this.importNPC.innateSpells.length) {
          const freq = match[1].trim();
          const spellsRaw = match[2].trim();

          // Validation is now implicitly handled by the regex
          this.importNPC.innateSpells[spellListIndex].freq = freq;
          const spellNames = spellsRaw.split(',')
              .map(spell => spell.replace(/<\/?i>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/\*/g, '').trim().toLowerCase())
              .filter(spell => spell);
          this.importNPC.innateSpells[spellListIndex].list = spellNames.join(', ');
          spellListIndex++;
      }
      for (let i = spellListIndex; i < this.importNPC.innateSpells.length; i++) {
         this.importNPC.innateSpells[i].freq = window.app.defaultNPC.innateSpells[i]?.freq || "";
         this.importNPC.innateSpells[i].list = ""; // Ensure list is empty
      }


      this.importNPC.traits.splice(traitIndex, 1); // Remove the processed trait
   },

   // --- Parse Trait Spellcasting from Trait Description ---
   parseTraitSpellcastingTrait() {
      // Find trait exactly named "Spellcasting" (case-insensitive)
      const traitIndex = this.importNPC.traits.findIndex(trait => trait?.name?.toLowerCase() === 'spellcasting');
      if (traitIndex === -1) return; // Trait not found

      const trait = this.importNPC.traits[traitIndex];
      const desc = trait.desc || '';

      this.importNPC.hasSpellcasting = true;
      this.importNPC.spellcastingPlacement = 'traits';

      const flavorRegex = /^(The .*?\.)\s+/i;
      const flavorMatch = desc.match(flavorRegex);
      if (flavorMatch) {
         this.importNPC.traitCastingFlavor = flavorMatch[1].trim();
      } else {
         this.importNPC.traitCastingFlavor = '';
      }

      const levelRegex = /(\d+)(?:st|nd|rd|th)-level spellcaster/i;
      const levelMatch = desc.match(levelRegex);
      if (levelMatch) {
         this.importNPC.traitCastingLevel = levelMatch[1];
      } else {
         console.warn("Could not parse caster level from description, defaulting to 1.");
         this.importNPC.traitCastingLevel = '1';
      }

      const abilityDcBonusRegex = /ability is (\w+)(?:.*?\(spell save DC (\d+))?(?:,\s*([+-]\d+) to hit)?/i;
      const abilityDcBonusMatch = desc.match(abilityDcBonusRegex);
      if (abilityDcBonusMatch) {
         this.importNPC.traitCastingAbility = abilityDcBonusMatch[1].toLowerCase();
         this.importNPC.traitCastingDC = abilityDcBonusMatch[2] ? parseInt(abilityDcBonusMatch[2], 10) : undefined;
         this.importNPC.traitCastingBonus = abilityDcBonusMatch[3] ? parseInt(abilityDcBonusMatch[3].replace('+',''), 10) : undefined;
      } else {
          this.importNPC.traitCastingDC = undefined;
          this.importNPC.traitCastingBonus = undefined;
      }

      const classRegex = /following (\w+) spells prepared/i;
      const classMatch = desc.match(classRegex);
      if (classMatch) {
         this.importNPC.traitCastingClass = classMatch[1].charAt(0).toUpperCase() + classMatch[1].slice(1).toLowerCase();
      } else {
         this.importNPC.traitCastingClass = '';
      }

      const spellsStartIndex = desc.indexOf(':');
      if (spellsStartIndex === -1) {
         console.warn("Could not find start of trait spell list (missing colon ':').");
         this.importNPC.traits.splice(traitIndex, 1);
         return;
      }
      
      // *** START FIX: Smarter spell block end detection ***
      // Use regex to find the start of the *next* section, even if flattened
      const sectionKeywords = [' ACTIONS', ' REACTIONS', ' LEGENDARY ACTIONS', ' LAIR ACTIONS', ' BONUS ACTIONS'];
      let spellsEndIndex = desc.length;
      let markedSpellIndex = -1;
      
      // Find the earliest occurrence of a new section keyword *after* the colon
      for (const keyword of sectionKeywords) {
         // Look for the keyword preceded by a space (since text is flattened)
         const keywordIndex = desc.indexOf(keyword, spellsStartIndex);
         if (keywordIndex !== -1 && keywordIndex < spellsEndIndex) {
            spellsEndIndex = keywordIndex;
         }
      }

      // Also check for marked spell descriptions (which can come *after* the list)
      // Look for " *" (space followed by asterisk)
      const lastMarkedSpellIndex = desc.lastIndexOf(' *');
      if (lastMarkedSpellIndex !== -1 && lastMarkedSpellIndex > spellsStartIndex) {
         // Check if this marked spell line is *before* the detected section keyword
         if (lastMarkedSpellIndex < spellsEndIndex) {
             spellsEndIndex = lastMarkedSpellIndex;
         }
         markedSpellIndex = lastMarkedSpellIndex; // Store this regardless
      }
      // *** END FIX ***
      
      const spellsBlock = desc.substring(spellsStartIndex + 1, spellsEndIndex).trim();

      this.importNPC.traitCastingList = Array(10).fill('');
      this.importNPC.traitCastingSlots = Array(9).fill('0');

      // *** START FIX: Regex lookahead now accepts \s* (any whitespace) and stops at end of string ($) ***
      const cantripRegex = /Cantrips\s*\(at will\):\s*([\s\S]*?)(?=(\s*\n?\d+(?:st|nd|rd|th)\s+level)|$)/i;
      const cantripMatch = spellsBlock.match(cantripRegex);
      if (cantripMatch) {
          const spellsRaw = cantripMatch[1].trim();
          const spellNames = spellsRaw.split(',')
              .map(spell => spell.replace(/<\/?i>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').replace('*', '').trim().toLowerCase())
              .filter(spell => spell);
          this.importNPC.traitCastingList[0] = spellNames.join(', ');
      } else {
         console.warn("Could not find Cantrips line in spellcasting block.");
      }

      const levelRegexGlobal = /(\d+)(?:st|nd|rd|th)\s+level\s*\((\d+)\s+slots?\):\s*([\s\S]*?)(?=(\s*\n?\d+(?:st|nd|rd|th)\s+level)|$)/gi;
      // *** END FIX ***
      let levelMatchGlobal;

      while ((levelMatchGlobal = levelRegexGlobal.exec(spellsBlock)) !== null) {
          const level = parseInt(levelMatchGlobal[1], 10);
          const slots = levelMatchGlobal[2];
          const spellsRaw = levelMatchGlobal[3].trim();
          if (level >= 1 && level <= 9) {
              this.importNPC.traitCastingSlots[level - 1] = slots;
              const spellNames = spellsRaw.split(',')
                  .map(spell => spell.replace(/<\/?i>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase())
                  .map(spell => spell.endsWith('*') ? spell : spell.replace('*',''))
                  .filter(spell => spell);
              this.importNPC.traitCastingList[level] = spellNames.join(', ');
          }
      }

      this.importNPC.traitCastingMarked = '';
      if (markedSpellIndex !== -1) { // Check if we ever found a marked spell line
          this.importNPC.traitCastingMarked = desc.substring(markedSpellIndex).trim();
          // Clean up marked text so it doesn't include ACTIONS
          const sectionKeywords = ['ACTIONS', 'REACTIONS', 'LEGENDARY ACTIONS', 'LAIR ACTIONS', 'BONUS ACTIONS'];
          for (const keyword of sectionKeywords) {
             const keywordIndex = this.importNPC.traitCastingMarked.indexOf(keyword);
             if (keywordIndex !== -1) {
                this.importNPC.traitCastingMarked = this.importNPC.traitCastingMarked.substring(0, keywordIndex).trim();
             }
          }
      }
      
      this.importNPC.traits.splice(traitIndex, 1); // Remove the processed trait
   },

   // --- Parsing Helper Functions ---

   parseSpeed(line) {
      // Reset speed values
      this.importNPC.speedBase = 0;
      this.importNPC.speedFly = 0;
      this.importNPC.flyHover = false;
      this.importNPC.speedClimb = 0;
      this.importNPC.speedSwim = 0;
      this.importNPC.speedBurrow = 0;

      const parts = line.replace(/^Speed\s*/i, '').split(','); // Remove "Speed " case-insensitively
      parts.forEach(part => {
         part = part.trim();
         const match = part.match(/(\d+)/);
         const speedVal = match ? parseInt(match[1], 10) : 0;

         if (part.includes('fly')) {
            this.importNPC.speedFly = speedVal;
            if (part.includes('(hover)')) this.importNPC.flyHover = true;
         } else if (part.includes('swim')) {
            this.importNPC.speedSwim = speedVal;
         } else if (part.includes('climb')) {
            this.importNPC.speedClimb = speedVal;
         } else if (part.includes('burrow')) {
            this.importNPC.speedBurrow = speedVal;
         } else if (speedVal > 0 && this.importNPC.speedBase === 0) {
            this.importNPC.speedBase = speedVal;
         }
      });
      // Assign calculated speed string for viewport
      this.importNPC.speed = window.app.calculateSpeedString(this.importNPC); // Assign formatted speed string

      if (this.importNPC.speedBase === 0 && this.importNPC.speedFly === 0 && this.importNPC.speedClimb === 0 && this.importNPC.speedSwim === 0 && this.importNPC.speedBurrow === 0) {
         this.importNPC.speedBase = 30; // Default base speed if none parsed
         this.importNPC.speed = window.app.calculateSpeedString(this.importNPC); // Recalculate string
      }
   },

   parseSaves(savesString) {
      const saves = savesString.split(',');
      saves.forEach(save => {
         const match = save.trim().match(/(\w+)\s+([+-]\d+)/);
         if (match) {
            const abilityShort = match[1].toLowerCase().substring(0, 3);
            const bonus = parseInt(match[2], 10);
            const abilityFull = Object.keys(window.app.defaultNPC).find(k => k.startsWith(abilityShort) && ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(k));
            if (abilityFull) {
               // Store the raw parsed bonus in the Adjust field temporarily
               this.importNPC[`${abilityFull}SavingThrowAdjust`] = bonus;
               this.importNPC[`${abilityFull}SavingThrowProf`] = false; // Will be determined by inferSavesAndSkills
            }
         }
      });
   },

   parseSkills(skillsString) {
      const skillsList = skillsString.split(',');
      skillsList.forEach(skill => {
         const match = skill.trim().match(/([\w\s]+)\s+([+-]\d+)/);
         if (match) {
            const skillName = match[1].trim();
            const bonus = parseInt(match[2], 10);
            const skillData = window.app.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
            if (skillData) {
               // Store the raw parsed bonus in the Adjust field temporarily
               this.importNPC[`skill_${skillData.id}_adjust`] = bonus;
               this.importNPC[`skill_${skillData.id}_prof`] = false; // Will be determined by inferSavesAndSkills
               this.importNPC[`skill_${skillData.id}_exp`] = false; // Will be determined by inferSavesAndSkills
            } else {
               console.warn("Unrecognized skill name found:", skillName);
            }
         }
      });
   },

   parseDamageModifiers(modsString, type) {
       const npc = this.importNPC;
       window.app.damageTypes.forEach(dt => npc[`${type}_${dt}`] = false);
       if (type === 'resistance') npc.weaponResistance = 'none';
       if (type === 'immunity') npc.weaponImmunity = 'none';

       const parts = modsString.split(';').map(s => s.trim()).filter(s => s);

       parts.forEach(part => {
           if (part.includes('from nonmagical attacks')) {
               let weaponModType = 'nonmagical';
               if (part.includes("that aren't silvered")) weaponModType = 'silvered';
               else if (part.includes("that aren't adamantine")) weaponModType = 'adamantine';
               else if (part.includes("that aren't cold-forged iron")) weaponModType = 'cold-forged';

               if (type === 'resistance') npc.weaponResistance = weaponModType;
               else if (type === 'immunity') npc.weaponImmunity = weaponModType;

               const typesBeforeWeapon = part.split(';')[0].replace(/bludgeoning|piercing|slashing/gi, '').split(',').map(t => t.trim().toLowerCase()).filter(t => t);
               typesBeforeWeapon.forEach(t => {
                   if (window.app.damageTypes.includes(t)) {
                       npc[`${type}_${t}`] = true;
                   }
               });

           } else {
               part.split(',').forEach(t => {
                   const cleanType = t.trim().toLowerCase();
                   if (window.app.damageTypes.includes(cleanType)) {
                       npc[`${type}_${cleanType}`] = true;
                   } else if (cleanType) {
                       console.warn(`Unknown damage type "${cleanType}" encountered during ${type} parsing.`);
                   }
               });
           }
       });
   },

   parseConditionImmunities(conditionsString) {
       window.app.conditions.forEach(cond => this.importNPC[`ci_${cond}`] = false);
       conditionsString.split(',').forEach(cond => {
         const cleanCond = cond.trim().toLowerCase();
         if (window.app.conditions.includes(cleanCond)) {
            this.importNPC[`ci_${cleanCond}`] = true;
         } else if (cleanCond) {
             console.warn(`Unknown condition immunity "${cleanCond}" encountered during parsing.`);
         }
      });
   },


   parseSenses(sensesLine, nextLine) {
       this.importNPC.senseBlindsight = 0;
       this.importNPC.blindBeyond = false;
       this.importNPC.senseDarkvision = 0;
       this.importNPC.senseTremorsense = 0;
       this.importNPC.senseTruesight = 0;
       this.importNPC.passivePerception = 10; // Default

      let consumedNextLine = false;
      let fullSensesString = sensesLine.replace(/^Senses\s*/i, '').trim();

      const passiveOnNextRegex = /^(?:passive\s+)?Perception\s+(\d+)/i;
      const nextLineMatch = nextLine ? nextLine.match(passiveOnNextRegex) : null;

      if (nextLineMatch) {
         this.importNPC.passivePerception = parseInt(nextLineMatch[1], 10);
         consumedNextLine = true;
      } else {
         const passiveMatch = fullSensesString.match(/(?:,\s*|\s+|^)passive Perception\s+(\d+)/i);
         if (passiveMatch) {
            this.importNPC.passivePerception = parseInt(passiveMatch[1], 10);
            fullSensesString = fullSensesString.replace(/,?\s*passive Perception\s+\d+/i, '').trim();
         } else {
         }
      }

      fullSensesString.split(',').forEach(sense => {
         sense = sense.trim();
         const match = sense.match(/(blindsight|darkvision|tremorsense|truesight)\s+(\d+)/i);
         if (match) {
            const type = match[1].toLowerCase();
            const range = parseInt(match[2], 10);
            if (type === 'blindsight') {
                this.importNPC.senseBlindsight = range;
                if (sense.includes('(blind beyond this radius)')) {
                    this.importNPC.blindBeyond = true;
                }
            } else if (type === 'darkvision') {
                this.importNPC.senseDarkvision = range;
            } else if (type === 'tremorsense') {
                this.importNPC.senseTremorsense = range;
            } else if (type === 'truesight') {
                this.importNPC.senseTruesight = range;
            }
         } else if (sense && !sense.toLowerCase().startsWith('passive perception')) {
             console.warn(`Unrecognized sense format: "${sense}"`);
         }
      });

      return consumedNextLine ? 1 : 0;
   },


   parseLanguages(languagesString) {
      this.importNPC.selectedLanguages = [];
      this.importNPC.hasTelepathy = false;
      this.importNPC.telepathyRange = 0;
      this.importNPC.specialLanguageOption = 0;

      const langLower = languagesString.toLowerCase();
      if (langLower === '—' || langLower === '-') {
          this.importNPC.specialLanguageOption = 1;
          return;
       }
       if (langLower === 'the languages it knew in life') {
           this.importNPC.specialLanguageOption = 3;
           return;
       }
       if (langLower === 'all languages') {
           this.importNPC.specialLanguageOption = 2;
           const telepathyMatch = languagesString.match(/telepathy\s+(\d+)/i);
           if (telepathyMatch) {
               this.importNPC.hasTelepathy = true;
               this.importNPC.telepathyRange = parseInt(telepathyMatch[1], 10);
           }
           return;
       }

       let cantSpeak = false;
       if (langLower.includes("understands") && langLower.includes("but can't speak")) {
          cantSpeak = true;
          if (langLower.includes("languages known in life") || langLower.includes("languages it knew in life")) {
             this.importNPC.specialLanguageOption = 6;
          } else if (langLower.includes("creator's languages")) {
             this.importNPC.specialLanguageOption = 5;
          } else {
             this.importNPC.specialLanguageOption = 4;
          }
           languagesString = languagesString.replace(/understands.*?(but can't speak)/i, '');
       }


       const parts = languagesString.split(',');
       parts.forEach(part => {
           part = part.trim();
           const telepathyMatch = part.match(/^telepathy\s+(\d+)/i);
           if (telepathyMatch) {
               this.importNPC.hasTelepathy = true;
               this.importNPC.telepathyRange = parseInt(telepathyMatch[1], 10);
           } else if (part && part !== '—' && part !== '-') {
               this.importNPC.selectedLanguages.push(part);
           }
       });

       this.importNPC.selectedLanguages.sort((a,b) => a.localeCompare(b));
   },

   // --- Inference Logic ---
   inferSavesAndSkills() {
        const npc = this.importNPC;
        const profBonus = npc.proficiencyBonus;

        const skipInfer = !profBonus || profBonus < 2;
        if (skipInfer) {
            console.warn("Skipping save/skill proficiency inference due to low/undefined Proficiency Bonus.");
            ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
                npc[`${ability}SavingThrowAdjust`] = 0; // Clear any previously parsed raw value
                npc[`${ability}SavingThrowProf`] = false;
            });
            window.app.skills.forEach(skill => {
                npc[`skill_${skill.id}_adjust`] = 0; // Clear any previously parsed raw value
                npc[`skill_${skill.id}_prof`] = false;
                npc[`skill_${skill.id}_exp`] = false;
            });
            npc.npcSkills = ""; // Clear the skills string
            return;
        }

        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
            const abilityBonus = npc[`${ability}Bonus`] ?? 0;
            const keyAdjust = `${ability}SavingThrowAdjust`;
            const keyProf = `${ability}SavingThrowProf`;
            // Use the temporarily stored raw bonus, OR default to 0 if none was parsed
            const parsedBonus = npc[keyAdjust] ?? null; // Use null to distinguish "not parsed"

            // Reset flags and adjustment before calculation
            npc[keyProf] = false;
            let finalAdjustment = 0; // Use a temp var

            if (parsedBonus === null) { // Skip if no save was listed
               npc[keyAdjust] = 0; // Ensure it's 0
               return; 
            }

            const expectedBase = abilityBonus;
            const expectedProf = abilityBonus + profBonus;

            
            if (parsedBonus === expectedProf) {
                 npc[keyProf] = true; // Matches proficiency bonus exactly
                 finalAdjustment = 0;
            } else if (parsedBonus === expectedBase) {
                 npc[keyProf] = false; // Matches base ability bonus exactly
                 finalAdjustment = 0;
            } else {
                 // Doesn't match exactly, calculate difference and store as adjustment
                 const diffFromProf = parsedBonus - expectedProf;
                 const diffFromBase = parsedBonus - expectedBase;

                 if (Math.abs(diffFromProf) <= Math.abs(diffFromBase)) {
                     // Closer to proficiency bonus than base, assume proficiency + adjustment
                     npc[keyProf] = true;
                     finalAdjustment = diffFromProf; // Store the difference as adjustment
                 } else {
                     // Closer to base ability bonus, assume no proficiency + adjustment
                     npc[keyProf] = false;
                     finalAdjustment = diffFromBase; // Store the difference as adjustment
                 }
            }
            npc[keyAdjust] = finalAdjustment; // Assign final calculated adjustment
        });

        window.app.skills.forEach(skill => {
            const abilityBonus = npc[`${skill.attribute}Bonus`] ?? 0;
            const keyAdjust = `skill_${skill.id}_adjust`;
            const keyProf = `skill_${skill.id}_prof`;
            const keyExp = `skill_${skill.id}_exp`;
            const parsedBonus = npc[keyAdjust] ?? null; // Use null to distinguish "not parsed"

            // Reset flags and adjustment before calculation
            npc[keyProf] = false;
            npc[keyExp] = false;
            let finalAdjustment = 0; // Use a temp var

            if (parsedBonus === null) { // Skip if skill wasn't listed
               npc[keyAdjust] = 0; // Ensure it's 0
               return; 
            }

            const expectedBase = abilityBonus;
            const expectedProf = abilityBonus + profBonus;
            const expectedExp = abilityBonus + (profBonus * 2);

            
             if (parsedBonus === expectedExp) { // Matches expertise exactly
                 npc[keyProf] = true;
                 npc[keyExp] = true;
                 finalAdjustment = 0;
             } else if (parsedBonus === expectedProf) { // Matches proficiency exactly
                 npc[keyProf] = true;
                 npc[keyExp] = false;
                 finalAdjustment = 0;
             } else if (parsedBonus === expectedBase) { // Matches base exactly
                 npc[keyProf] = false;
                 npc[keyExp] = false;
                 finalAdjustment = 0;
            } else {
                // Doesn't match exactly, find the closest and apply adjustment
                const diffFromBase = parsedBonus - expectedBase;
                const diffFromProf = parsedBonus - expectedProf;
                const diffFromExp = parsedBonus - expectedExp;

                const diffs = [
                    { diff: Math.abs(diffFromExp), prof: true, exp: true, adj: diffFromExp },
                    { diff: Math.abs(diffFromProf), prof: true, exp: false, adj: diffFromProf },
                    { diff: Math.abs(diffFromBase), prof: false, exp: false, adj: diffFromBase }
                ];
                diffs.sort((a, b) => a.diff - b.diff); // Sort by smallest difference

                npc[keyProf] = diffs[0].prof;
                npc[keyExp] = diffs[0].exp;
                finalAdjustment = diffs[0].adj; // Store the difference as adjustment
            }
            npc[keyAdjust] = finalAdjustment; // Assign final calculated adjustment
        });
        
        // Removed redundant call to calculateAllSkills - it's handled by calculateAllStats
   },


   // --- Confirmation ---
   confirmImport() {
      if (!this.importNPC || !window.app.activeBestiary) return;

      const uniqueName = window.app.findUniqueNpcName(this.importNPC.name || "New Import");
      this.importNPC.name = uniqueName;

       const validGroups = [window.app.activeBestiary.projectName, ...(window.app.activeBestiary.metadata?.fg_groups || [])];
       if (!this.importNPC.fg_group || !validGroups.includes(this.importNPC.fg_group)) {
           this.importNPC.fg_group = window.app.activeBestiary.projectName;
       }


      window.app.activeBestiary.npcs.push(this.importNPC);
      window.app.sortAndSwitchToNpc(this.importNPC);
      window.app.saveActiveBestiaryToDB();
      this.closeImportModal();
   },

// --- Event Listeners ---
   setupEventListeners() {
      // Get all elements from window.ui
      const {
         importCancelBtn,
         importConfirmBtn,
         importClearBtn,
         importSourceArea, // The new "Raw Text" window
         importTextArea, // The "Filtered Text" window
         importFilterSelect,
         importToggleViewBtn, // The new toggle button
         importPaneRaw,
         importPaneFiltered
      } = window.ui;

      if (importCancelBtn) importCancelBtn.addEventListener('click', () => this.closeImportModal());
      if (importConfirmBtn) importConfirmBtn.addEventListener('click', () => this.confirmImport());
      
      if (importClearBtn) importClearBtn.addEventListener('click', () => {
         if (importSourceArea) importSourceArea.value = '';
         if (importFilterSelect) importFilterSelect.value = 'noFilter'; // Reset filter
         this.processSourceText(); // Re-process the (now empty) source
      });

      // Add listener for the filter dropdown
      if (importFilterSelect) {
         importFilterSelect.addEventListener('change', () => {
            this.processSourceText();
            // Switch to filtered view when filter is changed
            if (importPaneRaw) importPaneRaw.classList.add('hidden');
            if (importPaneFiltered) importPaneFiltered.classList.remove('hidden');
            if (importToggleViewBtn) importToggleViewBtn.textContent = 'View Raw Text';
         });
      }

      // Add listener for the new toggle button
      if (importToggleViewBtn) {
         importToggleViewBtn.addEventListener('click', () => {
            const isRawVisible = !importPaneRaw.classList.contains('hidden');
            if (isRawVisible) {
               // Switch to Filtered view
               importPaneRaw.classList.add('hidden');
               importPaneFiltered.classList.remove('hidden');
               importToggleViewBtn.textContent = 'View Raw Text';
            } else {
               // Switch to Raw view
               importPaneRaw.classList.remove('hidden');
               importPaneFiltered.classList.add('hidden');
               importToggleViewBtn.textContent = 'View Filtered Text';
            }
         });
      }

      // Listen to the new SOURCE text area for input
      if (importSourceArea) {
         importSourceArea.addEventListener('paste', (e) => {
            // Let the paste happen naturally
            // Then trigger the processing shortly after
            setTimeout(() => {
               this.processSourceText();
            }, 50); // Small delay to ensure text is in the textarea
         });

         importSourceArea.addEventListener('input', () => {
             clearTimeout(this.processTextDebounceTimer);
             this.processTextDebounceTimer = setTimeout(() => {
                 this.processSourceText();
             }, 300); // 300ms debounce
         });

         // Move hotkeys to the source text area
         importSourceArea.addEventListener('keydown', (e) => {
            const textArea = importSourceArea; // Target this textarea
            if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
               e.preventDefault();
               const start = textArea.selectionStart;
               const end = textArea.selectionEnd;
               if (start !== end && window.importCleaner?.joinSelectedLines) {
                  const selectedText = textArea.value.substring(start, end);
                  const joinedText = window.importCleaner.joinSelectedLines(selectedText);
                  textArea.value = textArea.value.substring(0, start) + joinedText + textArea.value.substring(end);
                  textArea.selectionStart = start;
                  textArea.selectionEnd = start + joinedText.length;
                  
                  this.processSourceText(); // Re-process after manual edit
               }
            }
            else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
               e.preventDefault();
               const start = textArea.selectionStart;
               const end = textArea.selectionEnd;
               if (start !== end && window.importCleaner?.cycleSelectedTextCase) {
                  const selectedText = textArea.value.substring(start, end);
                  const cycledText = window.importCleaner.cycleSelectedTextCase(selectedText);
                  textArea.value = textArea.value.substring(0, start) + cycledText + textArea.value.substring(end);
                  textArea.selectionStart = start;
                  textArea.selectionEnd = start + cycledText.length;

                  this.processSourceText(); // Re-process after manual edit
               }
            }
         });
      }
   },

   // --- Viewport Logic ---
   updateImportViewport() {
      // ... (Viewport logic remains the same)
      const activeNPC = this.importNPC;
      const importViewportElement = document.getElementById('import-viewport');

      if (!activeNPC || !importViewportElement) {
         if (importViewportElement) importViewportElement.innerHTML = '';
         return;
      }

      const {
         name, size, type, species, alignment, armorClass, hitPoints, description, saves, npcSkills,
         strength, dexterity, constitution, intelligence, wisdom, charisma,
         strengthBonus, dexterityBonus, constitutionBonus, intelligenceBonus, wisdomBonus, charismaBonus,
         useDropCap, addDescription, speed, challenge, experience, proficiencyBonus, traits, sortTraitsAlpha,
         actions, legendaryBoilerplate, lairBoilerplate,
         hasInnateSpellcasting, innateIsPsionics, innateAbility, innateDC, innateComponents, innateSpells,
         hasSpellcasting, spellcastingPlacement,
         traitCastingLevel, traitCastingAbility, traitCastingDC, traitCastingBonus, traitCastingClass, traitCastingFlavor,
         traitCastingSlots, traitCastingList, traitCastingMarked,
         actionCastingAbility, actionCastingDC, actionCastingComponents, actionCastingSpells
      } = activeNPC;

      const { vulnerabilities, resistances, immunities } = window.app.calculateDamageModifiersString(activeNPC);
      const conditionImmunities = window.app.calculateConditionImmunitiesString(activeNPC);
      const senses = window.app.calculateSensesString(activeNPC);
      const languages = window.app.calculateLanguagesString(activeNPC);

      const NPCName = name || "[Import Preview]";
      const NPCac = armorClass || "";
      const NPChp = hitPoints || "";
      const NPCDescriptionHTML = window.app.processTraitString(description, activeNPC) || "";
      const NPCprofBonus = proficiencyBonus !== undefined ? `+${proficiencyBonus}` : '+?';

      let NPCTypeString = `${size || ""} ${type || ""}`.trim();
      if (species) { NPCTypeString += ` (${species})`; }
      if (alignment) { NPCTypeString += `, ${alignment}`; }

      const NPCspeed = speed || ""; // Use the formatted speed string
      const NPCstr = strength || "10";
      const NPCstrbo = strengthBonus !== undefined ? (strengthBonus >= 0 ? `+${strengthBonus}` : strengthBonus) : "+?";
      const NPCdex = dexterity || "10";
      const NPCdexbo = dexterityBonus !== undefined ? (dexterityBonus >= 0 ? `+${dexterityBonus}` : dexterityBonus) : "+?";
      const NPCcon = constitution || "10";
      const NPCconbo = constitutionBonus !== undefined ? (constitutionBonus >= 0 ? `+${constitutionBonus}` : constitutionBonus) : "+?";
      const NPCint = intelligence || "10";
      const NPCintbo = intelligenceBonus !== undefined ? (intelligenceBonus >= 0 ? `+${intelligenceBonus}` : intelligenceBonus) : "+?";
      const NPCwis = wisdom || "10";
      const NPCwisbo = wisdomBonus !== undefined ? (wisdomBonus >= 0 ? `+${wisdomBonus}` : wisdomBonus) : "+?";
      const NPCcha = charisma || "10";
      const NPCchabo = charismaBonus !== undefined ? (charismaBonus >= 0 ? `+${charismaBonus}` : charismaBonus) : "+?";

      const previewUseDropCap = true;
      const previewAddDescription = true;

      const dropCapClass = previewUseDropCap ? 'drop-cap' : '';
      const descriptionHtml = previewAddDescription && NPCDescriptionHTML ? `<div class="npcdescrip ${dropCapClass}"> ${NPCDescriptionHTML} </div>` : '';

      function formatSpellList(listString) {
          if (!listString) return "";
          // *** START FIX: Added () to the character class to include parentheses ***
          const spellRegex = /([\w\s'()-]+)(\*?)/g;
          // *** END FIX ***
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
      }

      let combinedTraitsList = [];

      if (hasInnateSpellcasting) {
          const innateTitle = innateIsPsionics ? 'Innate Spellcasting (Psionics)' : 'Innate Spellcasting';
          const abilityName = (innateAbility || 'charisma').charAt(0).toUpperCase() + (innateAbility || 'charisma').slice(1);
          const {dc: recalcInnateDC, bonus: recalcInnateBonus} = window.app.calculateSpellcastingDCBonus(innateAbility, proficiencyBonus, activeNPC);
          const dcValue = innateDC ?? recalcInnateDC;
          const bonusString = (recalcInnateBonus ?? 0) >= 0 ? `+${recalcInnateBonus ?? 0}` : (recalcInnateBonus ?? 0);
          let boilerplate = `The ${NPCName}'s innate spellcasting ability is ${abilityName} (spell save DC ${dcValue}, ${bonusString} to hit with spell attacks). `;
          const componentsText = innateComponents || '';
          boilerplate += `It can innately cast the following spells${componentsText ? `, ${componentsText}` : ''}:`;
          const spellListHtml = (Array.isArray(innateSpells) ? innateSpells : [])
              .filter(spell => spell?.freq && spell?.list)
              .map(spell => `<div style="color: black; padding-bottom: 0.25em;">${spell.freq}: ${formatSpellList(spell.list)}</div>`)
              .join('');
          const innateTraitHtml = `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${innateTitle}.</b></i> ${boilerplate}${spellListHtml || '<div style="color: black; padding-bottom: 0.25em;">None</div>'}</div>`;
          combinedTraitsList.push({ name: innateTitle, html: innateTraitHtml });
      }

      if (hasSpellcasting && spellcastingPlacement === 'traits') {
          const traitSpellcastingTitle = 'Spellcasting';
          const levels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th'];
          const levelText = levels[(parseInt(traitCastingLevel, 10) || 1) - 1] || '1st';
          const abilityName = (traitCastingAbility || 'intelligence').charAt(0).toUpperCase() + (traitCastingAbility || 'intelligence').slice(1);
          const {dc: recalcTraitDC, bonus: recalcTraitBonus} = window.app.calculateSpellcastingDCBonus(traitCastingAbility, proficiencyBonus, activeNPC);
          const dcValue = traitCastingDC ?? recalcTraitDC;
          const bonusValue = traitCastingBonus ?? recalcTraitBonus;
          const bonusString = bonusValue >= 0 ? `+${bonusValue}` : bonusValue;
          const className = traitCastingClass ? ` ${traitCastingClass}` : '';
          let boilerplate = traitCastingFlavor || `The ${NPCName} is a ${levelText}-level spellcaster. Its spellcasting ability is ${abilityName} (spell save DC ${dcValue}, ${bonusString} to hit with spell attacks).`;
          boilerplate += ` The ${NPCName} has the following${className} spells prepared:`;
          let spellListHtml = '';
          const safeTraitList = Array.isArray(traitCastingList) ? traitCastingList : [];
          const safeTraitSlots = Array.isArray(traitCastingSlots) ? traitCastingSlots : [];
          if (safeTraitList[0]) spellListHtml += `<div style="color: black; padding-bottom: 0.25em;">Cantrips (at will): ${formatSpellList(safeTraitList[0])}</div>`;
          for (let i = 1; i <= 9; i++) {
              const spells = safeTraitList[i];
              const slots = parseInt(safeTraitSlots[i-1], 10) || 0;
              if (spells && slots > 0) {
                  const levelSuffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
                  const slotText = `${slots} slot${slots > 1 ? 's' : ''}`;
                  spellListHtml += `<div style="color: black; padding-bottom: 0.25em;">${i}${levelSuffix} level (${slotText}): ${formatSpellList(spells)}</div>`;
              }
          }
          const markedSpellsHtml = traitCastingMarked ? `<div style="color: black; padding-bottom: 0.25em; padding-top: 0.25em;">${traitCastingMarked}</div>` : '';
          const traitSpellcastingHtml = `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${traitSpellcastingTitle}.</b></i> ${boilerplate}${spellListHtml || '<div style="color: black; padding-bottom: 0.25em;">None</div>'}${markedSpellsHtml}</div>`;
          combinedTraitsList.push({ name: traitSpellcastingTitle, html: traitSpellcastingHtml });
      }

      if (traits && traits.length > 0) {
          traits.forEach(trait => {
              if (!trait) return;
              const processedDescription = window.app.processTraitString(trait.desc || '', activeNPC);
              const traitHtml = `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${trait.name || 'Unnamed Trait'}.</b></i> ${processedDescription}</div>`;
              combinedTraitsList.push({ name: trait.name || 'Unnamed Trait', html: traitHtml });
          });
      }

      const sortPreviewTraits = true;
      if (sortPreviewTraits) {
          combinedTraitsList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      }
      const allTraitsHtml = combinedTraitsList.map(item => {
          return item.html;
       }).join('');
      

      let actionSpellcastingBlockItem = null;
      if (hasSpellcasting && spellcastingPlacement === 'actions') {
          const actionTitle = 'Spellcasting';
          const abilityName = (actionCastingAbility || 'intelligence').toLowerCase();
          const {dc: recalcActionDC} = window.app.calculateSpellcastingDCBonus(actionCastingAbility, proficiencyBonus, activeNPC);
          const dcValue = actionCastingDC ?? recalcActionDC;
          const componentsText = actionCastingComponents ? ` ${actionCastingComponents}` : '';
          let boilerplate = `The ${NPCName} casts one of the following spells, using ${abilityName} as the spellcasting ability (spell save DC ${dcValue})${componentsText}:`;
          const spellListHtml = (Array.isArray(actionCastingSpells) ? actionCastingSpells : [])
              .filter(spell => spell?.freq && spell?.list)
              .map(spell => `<div style="color: black; padding-bottom: 0.25em; padding-left: 1em;">${spell.freq}: ${formatSpellList(spell.list)}</div>`)
              .join('');
          const actionSpellcastingHtml = `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${actionTitle}.</b></i> ${boilerplate}${spellListHtml || '<div style="color: black; padding-bottom: 0.25em; padding-left: 1em;">None</div>'}</div>`;
          actionSpellcastingBlockItem = { name: actionTitle, desc: '(See Spellcasting details)', html: actionSpellcastingHtml };
      }

      const createActionSection = (actionList, title, boilerplate = '') => {
          const safeActionList = Array.isArray(actionList) ? actionList : [];
          let combinedActions = [...safeActionList];
          if (title === 'Actions' && actionSpellcastingBlockItem) combinedActions.push(actionSpellcastingBlockItem);
          if (combinedActions.length === 0) return '';

          let sortedList = [];
          if(title === 'Actions') {
              let multiattack = null;
              const otherItems = combinedActions.filter(item => {
                  if (item && item.name && item.name.toLowerCase() === 'multiattack') { multiattack = item; return false; }
                  return true;
              });
              otherItems.sort((a,b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
              sortedList = multiattack ? [multiattack, ...otherItems] : otherItems;
          } else {
              sortedList = combinedActions.sort((a,b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
          }

          const actionItemsHtml = sortedList.map(action => {
              if (!action) return '';
              if (action === actionSpellcastingBlockItem) return action.html;
              const processedDesc = window.app.processTraitString(action.desc || '', activeNPC);
              return `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${action.name || 'Unnamed Action'}.</b></i> ${processedDesc}</div>`;
          }).join('');

          const boilerplateHtml = boilerplate ? `<div class="npctop" style="padding-bottom: 0.5em; color: black;">${window.app.processTraitString(boilerplate, activeNPC)}</div>` : '';
          return `<div class="action-header">${title}</div><div class="npcdiv2"><svg viewBox="0 0 200 1" preserveAspectRatio="none" width="100%" height="1"><polyline points="0,0 200,0 200,1 0,1" fill="#7A200D" class="whoosh"></polyline></svg></div>${boilerplateHtml}${actionItemsHtml}`;
      };

      const safeActions = actions || {};
      const actionsHtml = createActionSection(safeActions.actions, 'Actions');
      const bonusActionsHtml = createActionSection(safeActions['bonus-actions'], 'Bonus Actions');
      const reactionsHtml = createActionSection(safeActions.reactions, 'Reactions');
      const legendaryActionsHtml = createActionSection(safeActions['legendary-actions'], 'Legendary Actions', legendaryBoilerplate);
      const lairActionsHtml = createActionSection(safeActions['lair-actions'], 'Lair Actions', lairBoilerplate);

       let challengeLineHtml = '';
       if (challenge !== undefined && experience !== undefined) {
           challengeLineHtml = `
               <div class="npctop" style="display: flex; justify-content: space-between; align-items: baseline;">
                   <span><b>Challenge</b> ${challenge} (${experience} XP)</span>
                   <span><b>Proficiency Bonus</b> ${NPCprofBonus}</span>
               </div>
           `;
       } else {
       }

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
            ${challengeLineHtml}
            ${allTraitsHtml ? `<div class="npcdiv"><svg width="100%" height="5"><use href="#divider-swoosh"></use></svg></div>` : ''}
            ${allTraitsHtml}
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

      importViewportElement.innerHTML = generatedHtml;
   }
};