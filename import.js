// import.js
window.importer = {
   importNPC: null,
   htmlLoaded: false,

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

      const textArea = document.getElementById('import-text-area');
      if (textArea) textArea.value = '';
      this.updateImportViewport();

      window.app.openModal('import-modal');
      // Focus textarea after modal opens
      setTimeout(() => textArea?.focus(), 50);
   },

   closeImportModal() {
      window.app.closeModal('import-modal');
      this.importNPC = null;
   },

   /**
    * Parses the text in #import-text-area and updates this.importNPC.
    */
   parseText() {
      if (!this.htmlLoaded) return;

      this.importNPC = JSON.parse(JSON.stringify(window.app.defaultNPC));

      const textArea = document.getElementById('import-text-area');
      const text = textArea ? textArea.value.trim() : '';
      if (!text) {
         this.importNPC.name = "Import Preview";
         this.updateImportViewport();
         return;
      }

      // Use the cleaner function FIRST
      const cleanedText = window.importCleaner.cleanImportText(text);

      const lines = cleanedText.split('\n').filter(line => line); // Split cleaned text, remove empty lines
      if (lines.length === 0) {
          this.importNPC.name = "Import Preview";
          this.updateImportViewport();
          return;
      }

      let currentLineIndex = 0;
      let currentSection = 'header'; // header, stats, traits, actions, legendary
      let currentItem = null; // Holds the current trait/action object being processed for multi-line descriptions

      // Helper function to safely get next line
      const getLine = (index) => (index < lines.length ? lines[index] : null);

      // --- Line 1: Name ---
      this.importNPC.name = this.toTitleCase(lines[currentLineIndex++] || "Unnamed Import");

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
         if (!line) { currentLineIndex++; continue; } // Should be rare now with cleaner

         const lowerLine = line.toLowerCase();
         if (lowerLine === 'actions') {
            currentSection = 'actions';
            currentItem = null;
            currentLineIndex++;
            continue;
         } else if (lowerLine === 'legendary actions') {
            currentSection = 'legendary';
            currentItem = null;
            currentLineIndex++;
            let nextLine = getLine(currentLineIndex);
            if (nextLine && !nextLine.match(/^([\w\s-]+)(?:\s*\((Costs\s+\d+\s+Actions?)\))?\.\s/)) {
                this.importNPC.legendaryBoilerplate = nextLine;
                currentLineIndex++;
            }
            continue;
         }
         // Add more section checks (Bonus Actions, Reactions, Lair Actions) here if needed

         if (currentSection === 'header') {
            let match;
            if ((match = line.match(/^Armor Class\s+(\d+)(?:\s*\((.*?)\))?/i))) {
               this.importNPC.armorClass = match[2] ? `${match[1]} (${match[2]})` : match[1];
            } else if ((match = line.match(/^Hit Points\s+(\d+)\s*\((.*?)\)/i))) {
               this.importNPC.hitPoints = `${match[1]} (${match[2]})`;
            } else if (line.startsWith('Speed')) {
               this.parseSpeed(line);
            } else if (line.startsWith('STR DEX CON INT WIS CHA')) {
               currentSection = 'stats';
            } else if ((match = line.match(/^Saving Throws\s+(.*)/i))) {
               this.parseSaves(match[1]);
            } else if ((match = line.match(/^Skills\s+(.*)/i))) {
               this.parseSkills(match[1]);
            } else if ((match = line.match(/^Damage Vulnerabilities\s+(.*)/i))) {
               this.parseDamageModifiers(match[1], 'vulnerability');
            } else if ((match = line.match(/^Damage Resistances\s+(.*)/i))) {
               this.parseDamageModifiers(match[1], 'resistance');
            } else if ((match = line.match(/^Damage Immunities\s+(.*)/i))) {
               this.parseDamageModifiers(match[1], 'immunity');
            } else if ((match = line.match(/^Condition Immunities\s+(.*)/i))) {
               this.parseConditionImmunities(match[1]);
            } else if ((match = line.match(/^Senses\s+(.*)/i))) {
               this.parseSenses(match[1]);
            } else if ((match = line.match(/^Languages\s+(.*)/i))) {
               this.parseLanguages(match[1]);
            } else if ((match = line.match(/^Challenge\s+([\d\/]+)\s*\((\d{1,3}(?:,\d{3})*)\s*XP\)(?:\s*Proficiency Bonus\s*([+-]\d+))?/i))) {
               this.importNPC.challenge = match[1];
               this.importNPC.experience = match[2];
               if (match[3]) {
                  this.importNPC.proficiencyBonus = parseInt(match[3].replace('+',''), 10);
               } else {
                  this.importNPC.proficiencyBonus = window.app.calculateProficiencyBonus(match[1]);
               }
               currentSection = 'traits';
            } else {
               // If it doesn't match any known header item, assume it's the start of traits
               currentSection = 'traits';
               currentItem = null; // Ensure currentItem is reset before reprocessing
               continue; // Re-process this line in the 'traits' section
            }
         }
         else if (currentSection === 'stats') {
             // Regex adjusted slightly for robustness (optional parens content)
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
            // Regex to match trait name ending with a period, followed by description.
            // Allows more characters in name, handles parens. Uses non-greedy match for name.
            const traitMatch = line.match(/^([\w\s().,'’-]+?)\.\s*(.*)/);

            if (traitMatch) {
               // New trait found
               currentItem = { name: traitMatch[1].trim(), desc: traitMatch[2].trim() };
               this.importNPC.traits.push(currentItem);
            } else if (currentItem) {
               // Continuation of the previous trait's description
               currentItem.desc += " " + line; // Append the current line
            } else if (line) {
               // Line doesn't match trait format and no current item exists
               // Might be an orphan line or a trait name missing a period?
               console.warn("Assuming line is a trait name (missing period?):", line);
               currentItem = { name: line.trim(), desc: "" }; // Start with empty desc
               this.importNPC.traits.push(currentItem);
            } else {
                // Ignore empty lines (though cleaner should remove them)
                console.warn("Skipping potentially empty or unparseable trait line:", line);
            }
         }
         else if (currentSection === 'actions') {
            const spellcastingHeaderMatch = line.match(/^Spellcasting\.\s*(.*)/i);
            const standardAttackMatch = line.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):\s*(.*)/i);
            // Action Regex: Matches name ending with period, then description. Allows more chars in name.
            const actionMatch = line.match(/^([\w\s().,'’-]+?)\.\s*(.*)/);

            if (spellcastingHeaderMatch) {
                // Handle Spellcasting section within Actions
                this.importNPC.hasSpellcasting = true;
                this.importNPC.spellcastingPlacement = 'actions';
                let boilerplate = spellcastingHeaderMatch[1];
                const castingInfoMatch = boilerplate.match(/using (\w+) .* \(spell save DC (\d+)\)/i);
                if (castingInfoMatch) {
                    this.importNPC.actionCastingAbility = castingInfoMatch[1].toLowerCase();
                    this.importNPC.actionCastingDC = parseInt(castingInfoMatch[2], 10);
                }

                // Parse spell lists on subsequent lines
                let spellListIndex = 0;
                // Reset action spell list before parsing
                this.importNPC.actionCastingSpells = JSON.parse(JSON.stringify(window.app.defaultNPC.actionCastingSpells));
                while (spellListIndex < this.importNPC.actionCastingSpells.length) {
                    currentLineIndex++;
                    let spellLine = getLine(currentLineIndex);
                    const spellListMatch = spellLine ? spellLine.match(/^(.*?):\s*(.*)/) : null;
                    // Improved check for frequency format
                    if (spellListMatch && (spellListMatch[1].toLowerCase() === 'at will' || spellListMatch[1].match(/^\d+\s*\/\s*day(?:\s+each)?/i))) {
                           this.importNPC.actionCastingSpells[spellListIndex].freq = spellListMatch[1].trim();
                           const spellNames = spellListMatch[2].split(',')
                               .map(spell => spell.replace(/<\/?i>/g, '').replace(/\*/g, '').trim().toLowerCase()) // Remove italics, asterisk, trim, lowercase
                               .filter(spell => spell);
                           this.importNPC.actionCastingSpells[spellListIndex].list = spellNames.join(', ');

                        spellListIndex++;
                    } else {
                        currentLineIndex--; // Backtrack if it's not a spell list line
                        break; // Stop parsing spell lists
                    }
                }
                currentItem = null; // Reset item parsing after spellcasting block
                currentLineIndex++; // Move past the last processed spell line or the non-spell line
                continue; // Process next line (or end if spell list was last)
            }
            else if (standardAttackMatch) {
               // Found a standard attack format (Melee Weapon Attack:, etc.)
               // Store the *full line* as description for potential parsing later
               currentItem = { name: standardAttackMatch[1].trim(), desc: line.trim() };
               this.importNPC.actions.actions.push(currentItem);
            }
            else if (actionMatch) {
               // Found a regular action (Name. Description.)
               currentItem = { name: actionMatch[1].trim(), desc: actionMatch[2].trim() };
               this.importNPC.actions.actions.push(currentItem);
            } else if (currentItem) {
               // Continuation of the previous action's description
               currentItem.desc += " " + line; // Append the current line
            } else {
               // Orphan line in actions section
               console.warn("Could not parse action line (orphan line?):", line);
               // Option: Treat as an action name with empty desc?
               // currentItem = { name: line.trim(), desc: "" };
               // this.importNPC.actions.actions.push(currentItem);
            }
         }
         else if (currentSection === 'legendary') {
            // Regex to match legendary action name, optional cost, period, description.
            const legendaryMatch = line.match(/^([\w\s().,'’-]+?)(?:\s*\((Costs\s+\d+\s+Actions?)\))?\.\s*(.*)/);
            if (legendaryMatch) {
               let name = legendaryMatch[1].trim();
               let descText = legendaryMatch[3].trim();
               // Append cost to name if present
               if (legendaryMatch[2]) {
                   name += ` (${legendaryMatch[2]})`;
               }
               currentItem = { name: name, desc: descText };
               this.importNPC.actions['legendary-actions'].push(currentItem);
            } else if (currentItem) {
               // Continuation of the previous legendary action's description
               currentItem.desc += " " + line;
            } else {
                // If no current item, check if this line might be the boilerplate text
                if (!this.importNPC.legendaryBoilerplate && line.length > 50) { // Simple check
                    this.importNPC.legendaryBoilerplate = line;
                } else {
                   // Otherwise, it's likely an unparseable line
                   console.warn("Could not parse legendary action line (orphan line?):", line);
                }
            }
         }

         currentLineIndex++; // Move to the next line for the next iteration
      } // End while loop

      // --- Post-Processing ---
      this.parseInnateSpellcastingTrait(); // Parse innate spellcasting from captured traits
      this.parseTraitSpellcastingTrait(); // Parse trait spellcasting from captured traits

      ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
           // Ensure bonus calculation happens if stats were parsed
           this.importNPC[`${ability}Bonus`] = window.app.calculateAbilityBonus(this.importNPC[ability]);
       });
      this.inferSavesAndSkills(); // Infer proficiencies/adjustments based on bonuses
      window.app.calculateAllStats.call({ activeNPC: this.importNPC }); // Use .call to set 'this' context if needed

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
      const spellsBlock = desc.substring(spellsStartIndex + 1).trim();

      // --- Parse Spells Block ---
      // Regex to find frequency groups and capture everything until the next group or end
      const spellGroupRegex = /([\w\s/]+):\s*([\s\S]*?)(?=\n?[\w\s/]+:|\Z)/gi;
      let match;
      let spellListIndex = 0;
      // Reset innate spell list before parsing
      this.importNPC.innateSpells = JSON.parse(JSON.stringify(window.app.defaultNPC.innateSpells)); // Deep copy defaults

      while ((match = spellGroupRegex.exec(spellsBlock)) !== null && spellListIndex < this.importNPC.innateSpells.length) {
          const freq = match[1].trim();
          const spellsRaw = match[2].trim();

          // Check if the frequency looks valid
          if (freq.toLowerCase() === 'at will' || freq.match(/^\d+\s*\/\s*day(?:\s+each)?/i)) {
              this.importNPC.innateSpells[spellListIndex].freq = freq;
              const spellNames = spellsRaw.split(',')
                  .map(spell => spell.replace(/<\/?i>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/\*/g, '').trim().toLowerCase()) // Remove italics, newlines, extra spaces, asterisk, trim, lowercase
                  .filter(spell => spell);
              this.importNPC.innateSpells[spellListIndex].list = spellNames.join(', ');
              spellListIndex++;
          } else {
             console.warn(`Skipping potentially invalid frequency line in innate spellcasting: "${freq}: ${spellsRaw}"`)
          }
      }
      // Fill remaining default frequency names if nothing was parsed for them
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

      // Flavor text: Capture the first sentence if it seems descriptive
      const flavorRegex = /^(The .*?\.)\s+/i;
      const flavorMatch = desc.match(flavorRegex);
      if (flavorMatch) {
         this.importNPC.traitCastingFlavor = flavorMatch[1].trim();
      } else {
         this.importNPC.traitCastingFlavor = ''; // Reset if no match
      }

      // Caster Level
      const levelRegex = /(\d+)(?:st|nd|rd|th)-level spellcaster/i;
      const levelMatch = desc.match(levelRegex);
      if (levelMatch) {
         this.importNPC.traitCastingLevel = levelMatch[1];
      } else {
         console.warn("Could not parse caster level from description, defaulting to 1.");
         this.importNPC.traitCastingLevel = '1';
      }

      // Ability, DC, and Attack Bonus
      const abilityDcBonusRegex = /ability is (\w+)(?:.*?\(spell save DC (\d+))?(?:,\s*([+-]\d+) to hit)?/i;
      const abilityDcBonusMatch = desc.match(abilityDcBonusRegex);
      if (abilityDcBonusMatch) {
         this.importNPC.traitCastingAbility = abilityDcBonusMatch[1].toLowerCase();
         // Store DC/Bonus only if explicitly found
         this.importNPC.traitCastingDC = abilityDcBonusMatch[2] ? parseInt(abilityDcBonusMatch[2], 10) : undefined;
         this.importNPC.traitCastingBonus = abilityDcBonusMatch[3] ? parseInt(abilityDcBonusMatch[3].replace('+',''), 10) : undefined;
      } else {
          // Reset DC/Bonus if regex fails, allowing auto-calc
          this.importNPC.traitCastingDC = undefined;
          this.importNPC.traitCastingBonus = undefined;
      }

      // Spellcasting Class (Optional)
      const classRegex = /following (\w+) spells prepared/i;
      const classMatch = desc.match(classRegex);
      if (classMatch) {
         this.importNPC.traitCastingClass = classMatch[1].charAt(0).toUpperCase() + classMatch[1].slice(1).toLowerCase();
      } else {
         this.importNPC.traitCastingClass = ''; // Reset if not found
      }

      // --- Extract Spells Block ---
      const spellsStartIndex = desc.indexOf(':'); // Find first colon after potential flavor text
      if (spellsStartIndex === -1) {
         console.warn("Could not find start of trait spell list (missing colon ':').");
         this.importNPC.traits.splice(traitIndex, 1); // Remove trait even if spells fail
         return;
      }
      // Find the end: Start of marked spell text or end of description
      const markedSpellIndex = desc.lastIndexOf('\n*'); // Look for newline followed by asterisk
      const spellsEndIndex = markedSpellIndex !== -1 ? markedSpellIndex : desc.length;
      // Extract the block between the first colon and the marked text/end
      const spellsBlock = desc.substring(spellsStartIndex + 1, spellsEndIndex).trim();

      // --- Parse Spells Block ---
      // Reset lists/slots
      this.importNPC.traitCastingList = Array(10).fill('');
      this.importNPC.traitCastingSlots = Array(9).fill('0');

      // --- Parse Cantrips (More robust) ---
      const cantripRegex = /Cantrips\s*\(at will\):\s*([\s\S]*?)(?=(\n?\d+(?:st|nd|rd|th)\s+level)|\Z)/i;
      const cantripMatch = spellsBlock.match(cantripRegex);
      if (cantripMatch) {
          const spellsRaw = cantripMatch[1].trim();
          const spellNames = spellsRaw.split(',')
              .map(spell => spell.replace(/<\/?i>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').replace('*', '').trim().toLowerCase()) // Clean up heavily
              .filter(spell => spell);
          this.importNPC.traitCastingList[0] = spellNames.join(', ');
      } else {
         console.warn("Could not find Cantrips line in spellcasting block.")
      }

      // --- Parse Leveled Spells ---
      const levelRegexGlobal = /(\d+)(?:st|nd|rd|th)\s+level\s*\((\d+)\s+slots?\):\s*([\s\S]*?)(?=(\n?\d+(?:st|nd|rd|th)\s+level)|\Z)/gi;
      let levelMatchGlobal;

      while ((levelMatchGlobal = levelRegexGlobal.exec(spellsBlock)) !== null) {
          const level = parseInt(levelMatchGlobal[1], 10);
          const slots = levelMatchGlobal[2]; // Slot number
          const spellsRaw = levelMatchGlobal[3].trim(); // Spells string
          if (level >= 1 && level <= 9) {
              this.importNPC.traitCastingSlots[level - 1] = slots;
              const spellNames = spellsRaw.split(',')
                  .map(spell => spell.replace(/<\/?i>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()) // Clean up heavily
                  // Keep only trailing asterisk, remove others
                  .map(spell => spell.endsWith('*') ? spell : spell.replace('*',''))
                  .filter(spell => spell);
              this.importNPC.traitCastingList[level] = spellNames.join(', ');
          }
      }

      // Extract Marked Spell Description
      this.importNPC.traitCastingMarked = ''; // Reset first
      if (markedSpellIndex !== -1) {
          this.importNPC.traitCastingMarked = desc.substring(markedSpellIndex).trim();
      } else {
          // Check last line if no newline-asterisk found
          const lines = desc.split('\n');
          const lastLine = lines[lines.length -1]?.trim(); // Use optional chaining
          if (lastLine?.startsWith('*')) {
             this.importNPC.traitCastingMarked = lastLine;
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

      const parts = line.replace('Speed', '').split(',');
      parts.forEach(part => {
         part = part.trim();
         // Match speed value, ignoring "ft." which might be missing/varied
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
            // Assume the first non-specific speed is the base speed
            this.importNPC.speedBase = speedVal;
         }
      });
      // Ensure base speed has a default if none parsed
      if (this.importNPC.speedBase === 0 && this.importNPC.speedFly === 0 && this.importNPC.speedClimb === 0 && this.importNPC.speedSwim === 0 && this.importNPC.speedBurrow === 0) {
         this.importNPC.speedBase = 30; // Default to 30ft if nothing else found
      }
   },

   parseSaves(savesString) {
      const saves = savesString.split(',');
      saves.forEach(save => {
         const match = save.trim().match(/(\w+)\s+([+-]\d+)/);
         if (match) {
            const abilityShort = match[1].toLowerCase().substring(0, 3); // Get 'str', 'dex', etc.
            const bonus = parseInt(match[2], 10);
            // Find the full ability name key ('strength', 'dexterity', etc.)
            const abilityFull = Object.keys(window.app.defaultNPC).find(k => k.startsWith(abilityShort) && ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(k));
            if (abilityFull) {
               // Store the parsed bonus temporarily for later inference
               this.importNPC[`${abilityFull}SavingThrowAdjust`] = bonus;
               this.importNPC[`${abilityFull}SavingThrowProf`] = false; // Will be inferred later
            }
         }
      });
   },

   parseSkills(skillsString) {
      const skillsList = skillsString.split(',');
      skillsList.forEach(skill => {
         // Match skill name (can have spaces) followed by bonus
         const match = skill.trim().match(/([\w\s]+)\s+([+-]\d+)/);
         if (match) {
            const skillName = match[1].trim();
            const bonus = parseInt(match[2], 10);
            // Find the skill object by matching name (case-insensitive)
            const skillData = window.app.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
            if (skillData) {
               // Store parsed bonus temporarily for inference
               this.importNPC[`skill_${skillData.id}_adjust`] = bonus;
               this.importNPC[`skill_${skillData.id}_prof`] = false; // To be inferred
               this.importNPC[`skill_${skillData.id}_exp`] = false; // To be inferred
            } else {
               console.warn("Unrecognized skill name found:", skillName);
            }
         }
      });
   },

   parseDamageModifiers(modsString, type) {
       const npc = this.importNPC;
       // Reset relevant properties first
       window.app.damageTypes.forEach(dt => npc[`${type}_${dt}`] = false);
       if (type === 'resistance') npc.weaponResistance = 'none';
       if (type === 'immunity') npc.weaponImmunity = 'none';

       // Split by semicolon first (for weapon mods), then by comma
       const parts = modsString.split(';').map(s => s.trim()).filter(s => s);

       parts.forEach(part => {
           // Check for specific weapon resistance/immunity clauses
           if (part.includes('from nonmagical attacks')) {
               let weaponModType = 'nonmagical';
               if (part.includes("that aren't silvered")) weaponModType = 'silvered';
               else if (part.includes("that aren't adamantine")) weaponModType = 'adamantine';
               else if (part.includes("that aren't cold-forged iron")) weaponModType = 'cold-forged';
               // Add more clauses (e.g., magical) if needed

               if (type === 'resistance') npc.weaponResistance = weaponModType;
               else if (type === 'immunity') npc.weaponImmunity = weaponModType;

               // Parse any other damage types listed BEFORE the weapon clause
               // e.g., "fire, poison; bludgeoning... from nonmagical..."
               const typesBeforeWeapon = part.split(';')[0].replace(/bludgeoning|piercing|slashing/gi, '').split(',').map(t => t.trim().toLowerCase()).filter(t => t);
               typesBeforeWeapon.forEach(t => {
                   if (window.app.damageTypes.includes(t)) {
                       npc[`${type}_${t}`] = true;
                   }
               });

           } else {
               // Handle simple comma-separated lists
               part.split(',').forEach(t => {
                   const cleanType = t.trim().toLowerCase();
                   if (window.app.damageTypes.includes(cleanType)) {
                       npc[`${type}_${cleanType}`] = true;
                   } else if (cleanType) { // Log unknown types if not empty
                       console.warn(`Unknown damage type "${cleanType}" encountered during ${type} parsing.`);
                   }
               });
           }
       });
   },

   parseConditionImmunities(conditionsString) {
       // Reset all first
       window.app.conditions.forEach(cond => this.importNPC[`ci_${cond}`] = false);
       // Parse the list
       conditionsString.split(',').forEach(cond => {
         const cleanCond = cond.trim().toLowerCase();
         if (window.app.conditions.includes(cleanCond)) {
            this.importNPC[`ci_${cleanCond}`] = true;
         } else if (cleanCond) { // Log unknown conditions if not empty
             console.warn(`Unknown condition immunity "${cleanCond}" encountered during parsing.`);
         }
      });
   },

   parseSenses(sensesString) {
       // Reset senses
       this.importNPC.senseBlindsight = 0;
       this.importNPC.blindBeyond = false;
       this.importNPC.senseDarkvision = 0;
       this.importNPC.senseTremorsense = 0;
       this.importNPC.senseTruesight = 0;
       this.importNPC.passivePerception = 10; // Default

      // Extract passive Perception first
      let passivePerception = 10; // Default
      const passiveMatch = sensesString.match(/passive Perception\s+(\d+)/i);
      if (passiveMatch) {
         passivePerception = parseInt(passiveMatch[1], 10);
         // Remove the passive perception part from the string for easier sense parsing
         sensesString = sensesString.replace(/,?\s*passive Perception\s+\d+/i, '').trim();
      }
      this.importNPC.passivePerception = passivePerception;

      // Parse individual senses
      sensesString.split(',').forEach(sense => {
         sense = sense.trim();
         // Match sense type and range (optional "ft.")
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
   },

   parseLanguages(languagesString) {
       // Reset languages and telepathy
       this.importNPC.selectedLanguages = [];
       this.importNPC.hasTelepathy = false;
       this.importNPC.telepathyRange = 0;
       this.importNPC.specialLanguageOption = 0;

       // Handle special cases first
       const langLower = languagesString.toLowerCase();
       if (langLower === '—' || langLower === '-') {
          this.importNPC.specialLanguageOption = 1; // Speaks no languages equivalent
          return;
       }
       if (langLower === 'the languages it knew in life') {
           this.importNPC.specialLanguageOption = 3;
           return;
       }
       if (langLower === 'all languages') {
           this.importNPC.specialLanguageOption = 2;
           // If telepathy is also mentioned, parse it
           const telepathyMatch = languagesString.match(/telepathy\s+(\d+)/i);
           if (telepathyMatch) {
               this.importNPC.hasTelepathy = true;
               this.importNPC.telepathyRange = parseInt(telepathyMatch[1], 10);
           }
           return;
       }
       // Add other potential special cases like "creator's languages" if needed

       // Parse comma-separated list
       const parts = languagesString.split(',');
       parts.forEach(part => {
           part = part.trim();
           // Check for telepathy clause
           const telepathyMatch = part.match(/^telepathy\s+(\d+)/i); // Match at start
           if (telepathyMatch) {
               this.importNPC.hasTelepathy = true;
               this.importNPC.telepathyRange = parseInt(telepathyMatch[1], 10);
           } else if (part && part !== '—' && part !== '-') {
               // Add language to selected list (handle case-insensitivity later if needed)
               // Simple push for now, duplicates/validation handled by main app typically
               this.importNPC.selectedLanguages.push(part);
           }
       });

       // Check for "understands X but can't speak" scenarios - may need refinement
       if (langLower.includes("understands") && langLower.includes("but can't speak")) {
          if (langLower.includes("languages known in life") || langLower.includes("languages it knew in life")) {
             this.importNPC.specialLanguageOption = 6;
          } else if (langLower.includes("creator's languages")) {
             this.importNPC.specialLanguageOption = 5;
          } else {
             this.importNPC.specialLanguageOption = 4;
          }
           // Languages were already pushed, option 4 covers "selected languages"
       }

       // Sort parsed languages alphabetically
       this.importNPC.selectedLanguages.sort((a,b) => a.localeCompare(b));
   },

   // --- Inference Logic ---
   inferSavesAndSkills() {
        const npc = this.importNPC;
        const profBonus = npc.proficiencyBonus;

        // Skip inference if proficiency bonus is not reasonably determined (e.g., CR 0, 1/8, etc often lack saves/skills)
        const skipInfer = !profBonus || profBonus < 2;
        if (skipInfer) {
            // If skipping, ensure adjustments are zeroed out if they were placeholders
            ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
                npc[`${ability}SavingThrowAdjust`] = 0;
                npc[`${ability}SavingThrowProf`] = false;
            });
            window.app.skills.forEach(skill => {
                npc[`skill_${skill.id}_adjust`] = 0;
                npc[`skill_${skill.id}_prof`] = false;
                npc[`skill_${skill.id}_exp`] = false;
            });
            console.warn("Skipping save/skill proficiency inference due to low/undefined Proficiency Bonus.");
            return;
        }


        // Infer Saving Throws
        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
            const abilityBonus = npc[`${ability}Bonus`] ?? 0;
            const keyAdjust = `${ability}SavingThrowAdjust`;
            const keyProf = `${ability}SavingThrowProf`;
            // Check if a bonus was actually parsed for this save
            const parsedBonus = npc[keyAdjust]; // Use the stored parsed value

            // Reset proficiency and adjustment before inference
            npc[keyProf] = false;
            npc[keyAdjust] = 0; // Final adjustment defaults to 0

            // If no bonus was parsed, nothing to infer
            if (parsedBonus === undefined || parsedBonus === null) return;

            // Calculate expected bonuses
            const expectedBase = abilityBonus;
            const expectedProf = abilityBonus + profBonus;
            const diffFromBase = parsedBonus - expectedBase;
            const diffFromProf = parsedBonus - expectedProf;

            // Determine best fit: Proficiency or just base ability?
            if (parsedBonus === expectedProf) {
                 npc[keyProf] = true; // Perfect match for proficiency
            } else if (parsedBonus === expectedBase) {
                 npc[keyProf] = false; // Perfect match for base ability
            } else if (Math.abs(diffFromProf) <= Math.abs(diffFromBase)) {
                // Closer to proficiency, assume proficiency + adjustment
                npc[keyProf] = true;
                npc[keyAdjust] = diffFromProf; // Store the difference
            } else {
                // Closer to base ability, assume no proficiency + adjustment
                npc[keyProf] = false;
                npc[keyAdjust] = diffFromBase; // Store the difference
            }
        });

        // Infer Skills
        window.app.skills.forEach(skill => {
            const abilityBonus = npc[`${skill.attribute}Bonus`] ?? 0;
            const keyAdjust = `skill_${skill.id}_adjust`;
            const keyProf = `skill_${skill.id}_prof`;
            const keyExp = `skill_${skill.id}_exp`;
            const parsedBonus = npc[keyAdjust]; // Use stored parsed value

            // Reset flags and adjustment
            npc[keyProf] = false;
            npc[keyExp] = false;
            npc[keyAdjust] = 0; // Final adjustment defaults to 0

            // If no bonus was parsed, nothing to infer
            if (parsedBonus === undefined || parsedBonus === null) return;

            // Calculate expected bonuses for base, proficiency, and expertise
            const expectedBase = abilityBonus;
            const expectedProf = abilityBonus + profBonus;
            const expectedExp = abilityBonus + (profBonus * 2);

            // Calculate differences from parsed bonus
            const diffFromBase = parsedBonus - expectedBase;
            const diffFromProf = parsedBonus - expectedProf;
            const diffFromExp = parsedBonus - expectedExp;

            // Check for perfect matches first
             if (parsedBonus === expectedExp) {
                 npc[keyProf] = true;
                 npc[keyExp] = true;
             } else if (parsedBonus === expectedProf) {
                 npc[keyProf] = true;
                 npc[keyExp] = false;
             } else if (parsedBonus === expectedBase) {
                 npc[keyProf] = false;
                 npc[keyExp] = false;
            } else {
                // No perfect match, find the closest expected value
                const diffs = [
                    { diff: Math.abs(diffFromExp), prof: true, exp: true, adj: diffFromExp },
                    { diff: Math.abs(diffFromProf), prof: true, exp: false, adj: diffFromProf },
                    { diff: Math.abs(diffFromBase), prof: false, exp: false, adj: diffFromBase }
                ];
                // Sort by the smallest difference
                diffs.sort((a, b) => a.diff - b.diff);

                // Apply the best fit and store the remaining difference as adjustment
                npc[keyProf] = diffs[0].prof;
                npc[keyExp] = diffs[0].exp;
                npc[keyAdjust] = diffs[0].adj;
            }
        });
   },


   // --- Confirmation ---
   confirmImport() {
      if (!this.importNPC || !window.app.activeBestiary) return;

      const uniqueName = window.app.findUniqueNpcName(this.importNPC.name || "New Import");
      this.importNPC.name = uniqueName;

      // Make sure FG group is set, default to bestiary name if missing/invalid
       const validGroups = [window.app.activeBestiary.projectName, ...(window.app.activeBestiary.metadata?.fg_groups || [])];
       if (!this.importNPC.fg_group || !validGroups.includes(this.importNPC.fg_group)) {
           this.importNPC.fg_group = window.app.activeBestiary.projectName;
       }


      window.app.activeBestiary.npcs.push(this.importNPC);
      window.app.sortAndSwitchToNpc(this.importNPC); // Sort and switch focus
      window.app.saveActiveBestiaryToDB();
      this.closeImportModal();
   },

// --- Event Listeners ---
   setupEventListeners() {
      const cancelBtn = document.getElementById('import-cancel-btn');
      const confirmBtn = document.getElementById('import-confirm-btn');
      const clearBtn = document.getElementById('import-clear-btn');
      const appendBtn = document.getElementById('import-append-btn');
      const textArea = document.getElementById('import-text-area');

      if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeImportModal());
      if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmImport());
      if (clearBtn) clearBtn.addEventListener('click', () => {
         if (textArea) textArea.value = '';
         this.parseText(); // Re-parse empty text to clear preview
      });

      if (appendBtn) appendBtn.addEventListener('click', async () => {
         try {
            let text = await navigator.clipboard.readText(); // Read text
            // Clean the *clipboard* text before appending
            if (window.importCleaner && typeof window.importCleaner.cleanImportText === 'function') {
               text = window.importCleaner.cleanImportText(text);
            }
            if (textArea) {
               // Append with double newline for separation
               textArea.value += (textArea.value ? '\n\n' : '') + text;
               this.parseText(); // Parse the *entire* text area content now
            }
         } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            window.app.showAlert("Could not read from clipboard. Check browser permissions.");
         }
      });

      if (textArea) {
         textArea.addEventListener('paste', (e) => {
            e.preventDefault();
            let text = (e.clipboardData || window.clipboardData).getData('text/plain');

            // --- CLEAN THE PASTED TEXT ---
            if (window.importCleaner && typeof window.importCleaner.cleanImportText === 'function') {
               text = window.importCleaner.cleanImportText(text); // Clean it
            }
            // --- END CLEANING ---

            // Insert cleaned text manually at cursor position
            const start = textArea.selectionStart;
            const end = textArea.selectionEnd;
            textArea.value = textArea.value.substring(0, start) + text + textArea.value.substring(end);
            // Move cursor to end of pasted text
            textArea.selectionStart = textArea.selectionEnd = start + text.length;

             this.parseText(); // Parse the *entire* text area content now
         });

         // Debounce parsing during regular input (no cleaning on typed input)
         let debounceTimer;
         textArea.addEventListener('input', () => {
             clearTimeout(debounceTimer);
             debounceTimer = setTimeout(() => {
                 this.parseText();
             }, 300); // 300ms delay after last keystroke
         });

         // --- NEW: Shortcut Listeners ---
         textArea.addEventListener('keydown', (e) => {
            // --- CTRL+J / CMD+J : Join Lines ---
            if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
               e.preventDefault(); // Prevent default browser action (like opening downloads)
               const start = textArea.selectionStart;
               const end = textArea.selectionEnd;
               if (start !== end && window.importCleaner?.joinSelectedLines) {
                  const selectedText = textArea.value.substring(start, end);
                  const joinedText = window.importCleaner.joinSelectedLines(selectedText);
                  textArea.value = textArea.value.substring(0, start) + joinedText + textArea.value.substring(end);
                  // Adjust selection to cover the modified text (excluding final newline for selection)
                  textArea.selectionStart = start;
                  textArea.selectionEnd = start + joinedText.length -1; // -1 for the trailing newline
                  this.parseText(); // Re-parse after modification
               }
            }
            // --- CTRL+E / CMD+E : Cycle Case ---
            else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
               e.preventDefault();
               const start = textArea.selectionStart;
               const end = textArea.selectionEnd;
               if (start !== end && window.importCleaner?.cycleSelectedTextCase) {
                  const selectedText = textArea.value.substring(start, end);
                  const cycledText = window.importCleaner.cycleSelectedTextCase(selectedText);
                  textArea.value = textArea.value.substring(0, start) + cycledText + textArea.value.substring(end);
                  // Keep the text selected
                  textArea.selectionStart = start;
                  textArea.selectionEnd = start + cycledText.length;
                  this.parseText(); // Re-parse after modification
               }
            }
         });
      }
   },

   // --- Viewport Logic ---
   updateImportViewport() {
      const activeNPC = this.importNPC; // Use the staging NPC
      const importViewportElement = document.getElementById('import-viewport');

      if (!activeNPC || !importViewportElement) {
         if (importViewportElement) importViewportElement.innerHTML = ''; // Clear if no NPC
         return;
      }

      // --- Re-use rendering logic from viewport.js ---
      // Destructure properties from the staging NPC
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

      // Calculate derived strings using window.app helpers, passing the staging NPC
      const { vulnerabilities, resistances, immunities } = window.app.calculateDamageModifiersString(activeNPC);
      const conditionImmunities = window.app.calculateConditionImmunitiesString(activeNPC);
      const senses = window.app.calculateSensesString(activeNPC);
      const languages = window.app.calculateLanguagesString(activeNPC);

      // Prepare variables for template (use staging NPC data)
      const NPCName = name || "[Import Preview]";
      const NPCac = armorClass || "";
      const NPChp = hitPoints || "";
      const NPCDescriptionHTML = window.app.processTraitString(description, activeNPC) || "";
      const NPCprofBonus = proficiencyBonus !== undefined ? `+${proficiencyBonus}` : '+?'; // Indicate potentially calculated bonus

      let NPCTypeString = `${size || ""} ${type || ""}`.trim();
      if (species) { NPCTypeString += ` (${species})`; }
      if (alignment) { NPCTypeString += `, ${alignment}`; }

      const NPCspeed = speed || ""; // Speed string is calculated by calculateAllStats
      const NPCstr = strength || "10";
      // Use calculated bonuses if they exist, otherwise show '?'
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

      // Assume default viewport settings for preview
      const previewUseDropCap = true;
      const previewAddDescription = true;

      const dropCapClass = previewUseDropCap ? 'drop-cap' : '';
      const descriptionHtml = previewAddDescription && NPCDescriptionHTML ? `<div class="npcdescrip ${dropCapClass}"> ${NPCDescriptionHTML} </div>` : '';

      // Helper to format spell lists (same as viewport.js)
      function formatSpellList(listString) {
          if (!listString) return "";
          const spellRegex = /([\w\s'-]+)(\*?)/g;
          let match;
          let result = [];
          while ((match = spellRegex.exec(listString)) !== null) {
              const spellName = match[1].trim();
              const asterisk = match[2];
              if (spellName) {
                  result.push(`<i>${spellName}</i>${asterisk}`);
              }
          }
          return result.join(', ');
      }

      // --- Build Combined Traits/Spellcasting List ---
      let combinedTraitsList = [];

      // Innate Spellcasting
      if (hasInnateSpellcasting) {
          const innateTitle = innateIsPsionics ? 'Innate Spellcasting (Psionics)' : 'Innate Spellcasting';
          const abilityName = (innateAbility || 'charisma').charAt(0).toUpperCase() + (innateAbility || 'charisma').slice(1);
          // Recalculate DC/Bonus for display using staging NPC data
          const {dc: recalcInnateDC, bonus: recalcInnateBonus} = window.app.calculateSpellcastingDCBonus(innateAbility, proficiencyBonus, activeNPC);
          const dcValue = innateDC ?? recalcInnateDC; // Use parsed DC if exists, else calculated
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

      // Trait-based Spellcasting
      if (hasSpellcasting && spellcastingPlacement === 'traits') {
          const traitSpellcastingTitle = 'Spellcasting';
          const levels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th'];
          const levelText = levels[(parseInt(traitCastingLevel, 10) || 1) - 1] || '1st';
          const abilityName = (traitCastingAbility || 'intelligence').charAt(0).toUpperCase() + (traitCastingAbility || 'intelligence').slice(1);
          const {dc: recalcTraitDC, bonus: recalcTraitBonus} = window.app.calculateSpellcastingDCBonus(traitCastingAbility, proficiencyBonus, activeNPC);
          const dcValue = traitCastingDC ?? recalcTraitDC; // Use parsed or calculated
          const bonusValue = traitCastingBonus ?? recalcTraitBonus; // Use parsed or calculated
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

      // Regular Traits
      if (traits && traits.length > 0) {
          traits.forEach(trait => {
              if (!trait) return;
              const processedDescription = window.app.processTraitString(trait.desc || '', activeNPC);
              const traitHtml = `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${trait.name || 'Unnamed Trait'}.</b></i> ${processedDescription}</div>`;
              combinedTraitsList.push({ name: trait.name || 'Unnamed Trait', html: traitHtml });
          });
      }

      // Sort combined list if needed
      const sortPreviewTraits = true; // Assume sorting for preview consistency
      if (sortPreviewTraits) {
          combinedTraitsList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      }
      const allTraitsHtml = combinedTraitsList.map(item => item.html).join('');

      // --- Build Action Spellcasting Block (for potential inclusion) ---
      let actionSpellcastingBlockItem = null;
      if (hasSpellcasting && spellcastingPlacement === 'actions') {
          const actionTitle = 'Spellcasting';
          const abilityName = (actionCastingAbility || 'intelligence').toLowerCase();
          const {dc: recalcActionDC} = window.app.calculateSpellcastingDCBonus(actionCastingAbility, proficiencyBonus, activeNPC); // Recalc needed
          const dcValue = actionCastingDC ?? recalcActionDC; // Use parsed or calc
          const componentsText = actionCastingComponents ? ` ${actionCastingComponents}` : '';
          let boilerplate = `The ${NPCName} casts one of the following spells, using ${abilityName} as the spellcasting ability (spell save DC ${dcValue})${componentsText}:`;
          const spellListHtml = (Array.isArray(actionCastingSpells) ? actionCastingSpells : [])
              .filter(spell => spell?.freq && spell?.list)
              .map(spell => `<div style="color: black; padding-bottom: 0.25em; padding-left: 1em;">${spell.freq}: ${formatSpellList(spell.list)}</div>`)
              .join('');
          const actionSpellcastingHtml = `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${actionTitle}.</b></i> ${boilerplate}${spellListHtml || '<div style="color: black; padding-bottom: 0.25em; padding-left: 1em;">None</div>'}</div>`;
          actionSpellcastingBlockItem = { name: actionTitle, desc: '(See Spellcasting details)', html: actionSpellcastingHtml };
      }

      // --- Create Action Section Function (using staging NPC) ---
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
              const processedDesc = window.app.processTraitString(action.desc || '', activeNPC); // Process with staging NPC
              return `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${action.name || 'Unnamed Action'}.</b></i> ${processedDesc}</div>`;
          }).join('');

          const boilerplateHtml = boilerplate ? `<div class="npctop" style="padding-bottom: 0.5em; color: black;">${window.app.processTraitString(boilerplate, activeNPC)}</div>` : ''; // Process with staging NPC
          return `<div class="action-header">${title}</div><div class="npcdiv2"><svg viewBox="0 0 200 1" preserveAspectRatio="none" width="100%" height="1"><polyline points="0,0 200,0 200,1 0,1" fill="#7A200D" class="whoosh"></polyline></svg></div>${boilerplateHtml}${actionItemsHtml}`;
      };

      // --- Build Action Sections ---
      const safeActions = actions || {}; // Default if actions object is missing
      const actionsHtml = createActionSection(safeActions.actions, 'Actions');
      const bonusActionsHtml = createActionSection(safeActions['bonus-actions'], 'Bonus Actions');
      const reactionsHtml = createActionSection(safeActions.reactions, 'Reactions');
      const legendaryActionsHtml = createActionSection(safeActions['legendary-actions'], 'Legendary Actions', legendaryBoilerplate);
      const lairActionsHtml = createActionSection(safeActions['lair-actions'], 'Lair Actions', lairBoilerplate);

       // --- Challenge Line ---
       let challengeLineHtml = '';
       if (challenge !== undefined && experience !== undefined) {
           challengeLineHtml = `
               <div class="npctop" style="display: flex; justify-content: space-between; align-items: baseline;">
                   <span><b>Challenge</b> ${challenge} (${experience} XP)</span>
                   <span><b>Proficiency Bonus</b> ${NPCprofBonus}</span>
               </div>
           `;
       }

      // --- Assemble Final HTML ---
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

// Ensure init is called when the DOM is ready (if not already handled in main.js)
// document.addEventListener('DOMContentLoaded', () => window.importer.init());
// ^^ This might be redundant if main.js calls importer.init() after ui.init()