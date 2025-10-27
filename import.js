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
      return str.toLowerCase().split(' ').map(word =>
         word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
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

      // Replace common ligatures and special characters
      const cleanedText = text
         .replace(/ﬂ/g, 'fl')
         .replace(/ﬁ/g, 'fi')
         .replace(/’/g, "'")
         .replace(/‘/g, "'")
         .replace(/”/g, '"')
         .replace(/“/g, '"')
         .replace(/—/g, '--') // Em dash
         .replace(/–/g, '-'); // En dash

      const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line); // Trim and remove empty lines
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
         if (!line) { currentLineIndex++; continue; }

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
               currentSection = 'traits';
               currentItem = null;
               continue; // Re-process line as trait
            }
         }
         else if (currentSection === 'stats') {
             const statRegex = /(\d+)\s*\([+-]?\d+\)\s+(\d+)\s*\([+-]?\d+\)\s+(\d+)\s*\([+-]?\d+\)\s+(\d+)\s*\([+-]?\d+\)\s+(\d+)\s*\([+-]?\d+\)\s+(\d+)\s*\([+-]?\d+\)/;
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
            const traitMatch = line.match(/^([\w\s().,'’-]+?)\.\s*(.*)/); // Adjusted to handle more characters in name

            if (traitMatch) {
               currentItem = { name: traitMatch[1].trim(), desc: traitMatch[2].trim() };
               this.importNPC.traits.push(currentItem);
            } else if (currentItem) {
               currentItem.desc += " " + line;
            } else if (line) {
               console.warn("Assuming line is a trait name (missing period?):", line);
               currentItem = { name: line.trim(), desc: "" }; // Start with empty desc
               this.importNPC.traits.push(currentItem);
            } else {
                console.warn("Could not parse trait line (orphan/empty?):", line);
            }
         }
         else if (currentSection === 'actions') {
            const spellcastingHeaderMatch = line.match(/^Spellcasting\.\s*(.*)/i);
            const standardAttackMatch = line.match(/^(Melee Weapon Attack|Ranged Weapon Attack|Melee Spell Attack|Ranged Spell Attack):\s*(.*)/i);
            const actionMatch = line.match(/^([\w\s().,'’-]+?)\.\s*(.*)/); // Adjusted to handle more characters in name

            if (spellcastingHeaderMatch) {
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
                while (spellListIndex < 4) { // Max 4 frequency lines
                    currentLineIndex++;
                    let spellLine = getLine(currentLineIndex);
                    const spellListMatch = spellLine ? spellLine.match(/^(.*?):\s*(.*)/) : null;
                    // Improved check for frequency format
                    if (spellListMatch && (spellListMatch[1].toLowerCase() === 'at will' || spellListMatch[1].match(/^\d+\s*\/\s*day(?:\s+each)?/i))) {
                        if (this.importNPC.actionCastingSpells[spellListIndex]) {
                           this.importNPC.actionCastingSpells[spellListIndex].freq = spellListMatch[1].trim();
                           const spellNames = spellListMatch[2].split(',')
                               .map(spell => spell.replace(/<\/?i>/g, '').trim().toLowerCase()) // Remove italics, trim, lowercase
                               .filter(spell => spell);
                           this.importNPC.actionCastingSpells[spellListIndex].list = spellNames.join(', ');
                        }
                        spellListIndex++;
                    } else {
                        currentLineIndex--; // Backtrack if it's not a spell list line
                        break; // Stop parsing spell lists
                    }
                }
                currentItem = null; // Reset item parsing after spellcasting block
                continue; // Process next line (or end if spell list was last)
            }
            else if (standardAttackMatch) {
               currentItem = { name: standardAttackMatch[1].trim(), desc: line }; // Store FULL line in desc
               this.importNPC.actions.actions.push(currentItem);
            }
            else if (actionMatch) {
               currentItem = { name: actionMatch[1].trim(), desc: actionMatch[2].trim() };
               this.importNPC.actions.actions.push(currentItem);
            } else if (currentItem) {
               currentItem.desc += " " + line;
            } else {
               console.warn("Could not parse action line (orphan line?):", line);
            }
         }
         else if (currentSection === 'legendary') {
            const legendaryMatch = line.match(/^([\w\s().,'’-]+?)(?:\s*\((Costs\s+\d+\s+Actions?)\))?\.\s*(.*)/); // Adjusted
            if (legendaryMatch) {
               let name = legendaryMatch[1].trim();
               let descText = legendaryMatch[3].trim();
               if (legendaryMatch[2]) {
                   name += ` (${legendaryMatch[2]})`;
               }
               currentItem = { name: name, desc: descText };
               this.importNPC.actions['legendary-actions'].push(currentItem);
            } else if (currentItem) {
               currentItem.desc += " " + line;
            } else {
                if (!this.importNPC.legendaryBoilerplate && line.length > 50) { // Simple check if it might be boilerplate
                    this.importNPC.legendaryBoilerplate = line;
                } else {
                   console.warn("Could not parse legendary action line (orphan line?):", line);
                }
            }
         }

         currentLineIndex++;
      } // End while loop

      // --- Post-Processing ---
      this.parseInnateSpellcastingTrait(); // Parse innate spellcasting from captured traits
      this.parseTraitSpellcastingTrait(); // Parse trait spellcasting from captured traits

      ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
           this.importNPC[`${ability}Bonus`] = window.app.calculateAbilityBonus(this.importNPC[ability]);
       });
      this.inferSavesAndSkills(); // Infer proficiencies/adjustments based on bonuses
      window.app.calculateAllStats.call({ activeNPC: this.importNPC }); // Use .call

      this.updateImportViewport();
   },

   // --- Parse Innate Spellcasting from Trait Description ---
   parseInnateSpellcastingTrait() {
      const traitIndex = this.importNPC.traits.findIndex(trait => trait?.name?.toLowerCase().startsWith('innate spellcasting')); // Match start
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
         if (abilityDcMatch[2]) {
            this.importNPC.innateDC = parseInt(abilityDcMatch[2], 10);
         }
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
                  .map(spell => spell.replace(/<\/?i>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()) // Remove italics, newlines, extra spaces, trim, lowercase
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
         if (abilityDcBonusMatch[2]) {
            this.importNPC.traitCastingDC = parseInt(abilityDcBonusMatch[2], 10);
         }
         if (abilityDcBonusMatch[3]) {
            this.importNPC.traitCastingBonus = parseInt(abilityDcBonusMatch[3].replace('+',''), 10);
         }
      }

      const classRegex = /following (\w+) spells prepared/i;
      const classMatch = desc.match(classRegex);
      if (classMatch) {
         this.importNPC.traitCastingClass = classMatch[1].charAt(0).toUpperCase() + classMatch[1].slice(1).toLowerCase();
      }

      // --- Extract Spells Block ---
      const spellsStartIndex = desc.indexOf(':');
      if (spellsStartIndex === -1) {
         console.warn("Could not find start of trait spell list (missing colon ':').");
         this.importNPC.traits.splice(traitIndex, 1); // Remove trait even if spells fail
         return;
      }
      // Find the end of the spell list (start of marked spell text or end of description)
      const markedSpellIndex = desc.lastIndexOf('\n*'); // Look for newline followed by asterisk
      const spellsEndIndex = markedSpellIndex !== -1 ? markedSpellIndex : desc.length;
      const spellsBlock = desc.substring(spellsStartIndex + 1, spellsEndIndex).trim();

      // --- Parse Spells Block ---
      // Reset lists/slots
      this.importNPC.traitCastingList = Array(10).fill('');
      this.importNPC.traitCastingSlots = Array(9).fill('0');

      // --- Parse Cantrips (More robust) ---
      // Match "Cantrips (at will):" and capture everything until the start of the next level or end of block
      const cantripRegex = /Cantrips\s*\(at will\):\s*([\s\S]*?)(?=(\n?\d+(?:st|nd|rd|th)\s+level)|\Z)/i;
      const cantripMatch = spellsBlock.match(cantripRegex);
      if (cantripMatch) {
          const spellsRaw = cantripMatch[1].trim();
          const spellNames = spellsRaw.split(',')
              .map(spell => spell.replace(/<\/?i>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').replace('*', '').trim().toLowerCase()) // Remove italics, newlines, extra spaces, asterisk, trim, lowercase
              .filter(spell => spell);
          this.importNPC.traitCastingList[0] = spellNames.join(', ');
      } else {
         console.warn("Could not find Cantrips line in spellcasting block.")
      }

      // --- Parse Leveled Spells (Reverted to original, more reliable regex) ---
      // Match "1st level (4 slots): ..." captures level, slots, and spells until next level or end. Handles multi-line spells.
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
                  .map(spell => spell.endsWith('*') ? spell : spell.replace('*','')) // Keep only trailing asterisk
                  .filter(spell => spell);
              this.importNPC.traitCastingList[level] = spellNames.join(', ');
          }
      }

      // Extract Marked Spell Description
      if (markedSpellIndex !== -1) {
          this.importNPC.traitCastingMarked = desc.substring(markedSpellIndex).trim(); // Get text from * onwards
      } else {
          // Check last line if no newline-asterisk found
          const lines = desc.split('\n');
          const lastLine = lines[lines.length -1].trim();
          if (lastLine.startsWith('*')) {
             this.importNPC.traitCastingMarked = lastLine;
          }
      }


      this.importNPC.traits.splice(traitIndex, 1); // Remove the processed trait
   },

   // --- Parsing Helper Functions ---

   parseSpeed(line) {
      this.importNPC.speedBase = 0;
      this.importNPC.speedFly = 0;
      this.importNPC.flyHover = false;
      this.importNPC.speedClimb = 0;
      this.importNPC.speedSwim = 0;
      this.importNPC.speedBurrow = 0;

      const parts = line.replace('Speed', '').split(',');
      parts.forEach(part => {
         part = part.trim();
         const match = part.match(/(\d+)\s*ft\.?/);
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
   },

   parseSaves(savesString) {
      const saves = savesString.split(',');
      saves.forEach(save => {
         const match = save.trim().match(/(\w+)\s+([+-]\d+)/);
         if (match) {
            const ability = match[1].toLowerCase().substring(0, 3);
            const bonus = parseInt(match[2], 10);
            const abilityFull = Object.keys(window.app.defaultNPC).find(k => k.startsWith(ability) && !k.includes('Bonus') && !k.includes('Saving'));
            if (abilityFull) {
               this.importNPC[`${abilityFull}SavingThrowAdjust`] = bonus;
               this.importNPC[`${abilityFull}SavingThrowProf`] = false;
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
               this.importNPC[`skill_${skillData.id}_adjust`] = bonus;
               this.importNPC[`skill_${skillData.id}_prof`] = false;
               this.importNPC[`skill_${skillData.id}_exp`] = false;
            }
         }
      });
   },

   parseDamageModifiers(modsString, type) {
       const npc = this.importNPC;
       window.app.damageTypes.forEach(dt => npc[`${type}_${dt}`] = false);
       if (type === 'resistance') npc.weaponResistance = 'none';
       if (type === 'immunity') npc.weaponImmunity = 'none';

       const parts = modsString.split(';').map(s => s.trim());

       parts.forEach(part => {
           if (part.includes('from nonmagical attacks')) {
               let weaponModType = 'nonmagical';
               if (part.includes("that aren't silvered")) {
                   weaponModType = 'silvered';
               } else if (part.includes("that aren't adamantine")) {
                   weaponModType = 'adamantine';
               } // Add cold-forged etc.

               if (type === 'resistance') npc.weaponResistance = weaponModType;
               else if (type === 'immunity') npc.weaponImmunity = weaponModType;

               const typesInClause = ['bludgeoning', 'piercing', 'slashing'];
               const remainingTypes = part.replace(/bludgeoning,\s*piercing,\s*and\s*slashing\s*from.*?$/i, '').trim();

               if (remainingTypes) {
                   remainingTypes.split(',').forEach(t => {
                       const cleanType = t.trim().toLowerCase();
                       if (window.app.damageTypes.includes(cleanType) && !typesInClause.includes(cleanType)) {
                           npc[`${type}_${cleanType}`] = true;
                       }
                   });
               }
           } else {
               part.split(',').forEach(t => {
                   const cleanType = t.trim().toLowerCase();
                   if (window.app.damageTypes.includes(cleanType)) {
                       npc[`${type}_${cleanType}`] = true;
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
         }
      });
   },

   parseSenses(sensesString) {
       this.importNPC.senseBlindsight = 0;
       this.importNPC.blindBeyond = false;
       this.importNPC.senseDarkvision = 0;
       this.importNPC.senseTremorsense = 0;
       this.importNPC.senseTruesight = 0;

      let passivePerception = 10;
      const passiveMatch = sensesString.match(/passive Perception\s+(\d+)/i);
      if (passiveMatch) {
         passivePerception = parseInt(passiveMatch[1], 10);
      }
      this.importNPC.passivePerception = passivePerception;


      sensesString.split(',').forEach(sense => {
         sense = sense.trim();
         const match = sense.match(/(darkvision|blindsight|tremorsense|truesight)\s+(\d+)\s*ft\.?/i);
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
         }
      });
   },

   parseLanguages(languagesString) {
       this.importNPC.selectedLanguages = [];
       this.importNPC.hasTelepathy = false;
       this.importNPC.telepathyRange = 0;
       this.importNPC.specialLanguageOption = 0;

       const langLower = languagesString.toLowerCase();
       if (langLower === 'the languages it knew in life') {
           this.importNPC.specialLanguageOption = 3;
           return;
       }
       // Add other special cases

       const parts = languagesString.split(',');
       parts.forEach(part => {
           part = part.trim();
           const telepathyMatch = part.match(/telepathy\s+(\d+)\s*ft\.?/i);
           if (telepathyMatch) {
               this.importNPC.hasTelepathy = true;
               this.importNPC.telepathyRange = parseInt(telepathyMatch[1], 10);
           } else if (part && part !== '—' && part !== '-') {
               const knownLangs = [
                   ...window.app.standardLanguages,
                   ...window.app.exoticLanguages,
                   ...window.app.monstrousLanguages1,
                   ...window.app.monstrousLanguages2
               ];
               let found = false;
               for (const known of knownLangs) {
                   if (known.toLowerCase() === part.toLowerCase()) {
                       this.importNPC.selectedLanguages.push(known);
                       found = true;
                       break;
                   }
               }
               if (!found) {
                   this.importNPC.selectedLanguages.push(part);
                   console.warn("Imported potentially unknown language:", part);
               }
           }
       });
       this.importNPC.selectedLanguages.sort((a,b) => a.localeCompare(b));
   },

   inferSavesAndSkills() {
        const npc = this.importNPC;
        const profBonus = npc.proficiencyBonus;
        const skipInfer = !profBonus || profBonus < 2;

        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
            const abilityBonus = npc[`${ability}Bonus`] ?? 0;
            const keyAdjust = `${ability}SavingThrowAdjust`;
            const keyProf = `${ability}SavingThrowProf`;
            const parsedBonus = npc[keyAdjust];

            npc[keyAdjust] = 0;
            npc[keyProf] = false;

            if (skipInfer || parsedBonus === undefined || parsedBonus === 0) return;

            const expectedBase = abilityBonus;
            const expectedProf = abilityBonus + profBonus;
            const diffFromBase = parsedBonus - expectedBase;
            const diffFromProf = parsedBonus - expectedProf;

            if (parsedBonus === expectedProf) {
                 npc[keyProf] = true;
                 npc[keyAdjust] = 0;
            } else if (parsedBonus === expectedBase) {
                 npc[keyProf] = false;
                 npc[keyAdjust] = 0;
            } else if (Math.abs(diffFromProf) <= Math.abs(diffFromBase)) {
                npc[keyProf] = true;
                npc[keyAdjust] = diffFromProf;
            } else {
                npc[keyProf] = false;
                npc[keyAdjust] = diffFromBase;
            }
        });

        window.app.skills.forEach(skill => {
            const abilityBonus = npc[`${skill.attribute}Bonus`] ?? 0;
            const keyAdjust = `skill_${skill.id}_adjust`;
            const keyProf = `skill_${skill.id}_prof`;
            const keyExp = `skill_${skill.id}_exp`;
            const parsedBonus = npc[keyAdjust];

            npc[keyAdjust] = 0;
            npc[keyProf] = false;
            npc[keyExp] = false;

            if (skipInfer || parsedBonus === undefined || parsedBonus === 0) return;

            const expectedBase = abilityBonus;
            const expectedProf = abilityBonus + profBonus;
            const expectedExp = abilityBonus + (profBonus * 2);
            const diffFromBase = parsedBonus - expectedBase;
            const diffFromProf = parsedBonus - expectedProf;
            const diffFromExp = parsedBonus - expectedExp;

             if (parsedBonus === expectedExp) {
                 npc[keyProf] = true;
                 npc[keyExp] = true;
                 npc[keyAdjust] = 0;
             } else if (parsedBonus === expectedProf) {
                 npc[keyProf] = true;
                 npc[keyExp] = false;
                 npc[keyAdjust] = 0;
             } else if (parsedBonus === expectedBase) {
                 npc[keyProf] = false;
                 npc[keyExp] = false;
                 npc[keyAdjust] = 0;
            } else {
                const diffs = [
                    { diff: Math.abs(diffFromExp), prof: true, exp: true, adj: diffFromExp },
                    { diff: Math.abs(diffFromProf), prof: true, exp: false, adj: diffFromProf },
                    { diff: Math.abs(diffFromBase), prof: false, exp: false, adj: diffFromBase }
                ];
                diffs.sort((a, b) => a.diff - b.diff);

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

      window.app.activeBestiary.npcs.push(this.importNPC);
      window.app.sortAndSwitchToNpc(this.importNPC);
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
         this.parseText();
      });

      if (appendBtn) appendBtn.addEventListener('click', async () => {
         try {
            let text = await navigator.clipboard.readText(); // Read text
            if (window.importCleaner && typeof window.importCleaner.cleanImportText === 'function') {
               text = window.importCleaner.cleanImportText(text); // Clean it
            }
            if (textArea) {
               textArea.value += text + '\n\n'; // Add spacing after appending cleaned text
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

            // Insert cleaned text manually
            if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
               document.execCommand('insertText', false, text);
            } else {
                // Fallback insertion
                const start = textArea.selectionStart;
                const end = textArea.selectionEnd;
                textArea.value = textArea.value.substring(0, start) + text + textArea.value.substring(end);
                textArea.selectionStart = textArea.selectionEnd = start + text.length;
            }
             this.parseText(); // Parse the *entire* text area content now
         });

         // Debounce parsing during input (no cleaning on regular input)
         let debounceTimer;
         textArea.addEventListener('input', () => {
             clearTimeout(debounceTimer);
             debounceTimer = setTimeout(() => {
                 this.parseText();
             }, 300);
         });
      }
   },

   // --- Viewport Logic ---
   updateImportViewport() {
      const activeNPC = this.importNPC;
      const importViewportElement = document.getElementById('import-viewport');

      if (!activeNPC || !importViewportElement) {
         if (importViewportElement) importViewportElement.innerHTML = '';
         return;
      }

      // --- Re-use rendering logic from viewport.js ---
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
      const NPCprofBonus = proficiencyBonus !== undefined ? `+${proficiencyBonus}` : '+2';

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
      const descriptionHtml = addDescription ? `<div class="npcdescrip ${dropCapClass}"> ${NPCDescriptionHTML} </div>` : '';

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

      let combinedTraitsList = [];

      if (hasInnateSpellcasting) {
          const innateTitle = innateIsPsionics ? 'Innate Spellcasting (Psionics)' : 'Innate Spellcasting';
          const abilityName = (innateAbility || 'charisma').charAt(0).toUpperCase() + (innateAbility || 'charisma').slice(1);
          const {dc: recalcInnateDC, bonus: recalcInnateBonus} = window.app.calculateSpellcastingDCBonus(innateAbility, proficiencyBonus, activeNPC); // Always recalc for display
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

      if (sortTraitsAlpha ?? true) {
          combinedTraitsList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      }
      const allTraitsHtml = combinedTraitsList.map(item => item.html).join('');

      let actionSpellcastingBlockItem = null;
      if (hasSpellcasting && spellcastingPlacement === 'actions') {
          const actionTitle = 'Spellcasting';
          const abilityName = (actionCastingAbility || 'intelligence').toLowerCase();
           const {dc: recalcActionDC} = window.app.calculateSpellcastingDCBonus(actionCastingAbility, proficiencyBonus, activeNPC); // Always recalc
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