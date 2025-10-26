// import.js
window.importer = {
   importNPC: null,
   htmlLoaded: false,

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
      // Create a fresh, deep copy of the default NPC
      this.importNPC = JSON.parse(JSON.stringify(window.app.defaultNPC));
      this.importNPC.name = "Import Preview"; // Default name for blank

      const textArea = document.getElementById('import-text-area');
      if (textArea) textArea.value = '';
      this.updateImportViewport(); // Show blank preview

      window.app.openModal('import-modal');
   },

   closeImportModal() {
      window.app.closeModal('import-modal');
      this.importNPC = null; // Discard the staging object
   },

   /**
    * Parses the text in #import-text-area and updates this.importNPC.
    */
   parseText() {
      if (!this.htmlLoaded) return;

      // Reset NPC to defaults before parsing
      this.importNPC = JSON.parse(JSON.stringify(window.app.defaultNPC));

      const textArea = document.getElementById('import-text-area');
      const text = textArea ? textArea.value.trim() : '';
      if (!text) {
         this.importNPC.name = "Import Preview"; // Reset name if text cleared
         this.updateImportViewport();
         return;
      }

      const lines = text.split('\n').map(line => line.trim()).filter(line => line); // Trim and remove empty lines
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
      this.importNPC.name = lines[currentLineIndex++] || "Unnamed Import";

      // --- Line 2: Size Type (Species), Alignment ---
      let line = getLine(currentLineIndex);
      if (line) {
         const sizeTypeAlignRegex = /^(\w+)\s+(.+?)(?:,\s*(.*?))?$/i;
         const match = line.match(sizeTypeAlignRegex);
         if (match) {
            this.importNPC.size = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(); // Capitalize Size
            let typeSpecies = match[2].trim();
            this.importNPC.alignment = (match[3] || '').toLowerCase().replace(/^typically\s+/,''); // Clean alignment

            // Check for species in parentheses
            const speciesMatch = typeSpecies.match(/^(.*?)\s*\((.+)\)$/);
            if (speciesMatch) {
               this.importNPC.type = speciesMatch[1].trim().toLowerCase();
               this.importNPC.species = speciesMatch[2].trim();
            } else {
               this.importNPC.type = typeSpecies.toLowerCase();
               this.importNPC.species = ""; // Clear species if not found
            }
            currentLineIndex++;
         } else {
             console.warn("Could not parse Size/Type/Alignment line:", line);
             // Attempt to continue parsing even if this line fails
         }
      }

      // --- Process Remaining Lines ---
      while (currentLineIndex < lines.length) {
         line = getLine(currentLineIndex);
         if (!line) { currentLineIndex++; continue; } // Should not happen with filter, but safe

         // Section Header Checks (Case Insensitive)
         const lowerLine = line.toLowerCase();
         if (lowerLine === 'actions') {
            currentSection = 'actions';
            currentItem = null; // Reset item parsing
            currentLineIndex++;
            continue;
         } else if (lowerLine === 'legendary actions') {
            currentSection = 'legendary';
            currentItem = null; // Reset item parsing
            currentLineIndex++;
            // Check for boilerplate on the next line
            let nextLine = getLine(currentLineIndex);
            // If next line exists and doesn't look like a typical action start "Name." or "Name (Cost)."
            if (nextLine && !nextLine.match(/^([\w\s-]+)(?:\s*\((Costs\s+\d+\s+Actions?)\))?\.\s/)) {
                this.importNPC.legendaryBoilerplate = nextLine;
                currentLineIndex++;
            }
            continue;
         }
         // Add checks for Bonus Actions, Reactions, Lair Actions if needed later

         // --- Stat Block Header Section ---
         if (currentSection === 'header') {
            let match;
            if ((match = line.match(/^Armor Class\s+(\d+)(?:\s*\((.*?)\))?/i))) {
               this.importNPC.armorClass = match[2] ? `${match[1]} (${match[2]})` : match[1];
            } else if ((match = line.match(/^Hit Points\s+(\d+)\s*\((.*?)\)/i))) {
               this.importNPC.hitPoints = `${match[1]} (${match[2]})`;
            } else if (line.startsWith('Speed')) {
               this.parseSpeed(line);
            } else if (line.startsWith('STR DEX CON INT WIS CHA')) {
               currentSection = 'stats'; // Switch section after finding header
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
               // Assume traits start after this line if Actions haven't started
               currentSection = 'traits'; // Switch section
            } else {
               // If it doesn't match known header lines assume it's a trait (start of traits section)
               currentSection = 'traits';
               currentItem = null; // Ensure new item processing starts
               continue; // Re-process the current line as a trait
            }
         }
         // --- Stat Scores ---
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
                 // Bonuses will be calculated later
                 currentSection = 'header'; // Go back to parsing header items below stats
             } else {
                console.warn("Could not parse stat line:", line);
                currentSection = 'header'; // Assume stats done even if parse failed
                continue; // Re-process line in header context
             }
         }
         // --- Traits ---
         else if (currentSection === 'traits') {
            const traitMatch = line.match(/^([\w\s-]+(?:\s*\([^)]+\))?)\.\s*(.*)/); // Name. Desc...
            if (traitMatch) {
               // Start of a new trait
               currentItem = { name: traitMatch[1].trim(), desc: traitMatch[2].trim() }; // Use 'desc'
               this.importNPC.traits.push(currentItem);
            } else if (currentItem) {
               // Continuation of the previous trait's description
               currentItem.desc += " " + line; // Use 'desc'
            } else {
               // Orphan line in traits section
               console.warn("Could not parse trait line (orphan line?):", line);
            }
         }
         // --- Actions ---
         else if (currentSection === 'actions') {
             const spellcastingHeaderMatch = line.match(/^Spellcasting\.\s*(.*)/i);
             const actionMatch = line.match(/^([\w\s-]+(?:\s*\([^)]+\))?)\.\s*(.*)/); // Name. Desc...

             if (spellcastingHeaderMatch) {
                 // Start of Action Spellcasting block
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
                     // Check if the line looks like a frequency: list pair
                     const spellListMatch = spellLine ? spellLine.match(/^(.*?):\s*(.*)/) : null;
                     if (spellListMatch && (spellListMatch[1].toLowerCase() === 'at will' || spellListMatch[1].match(/^\d+\/day/i))) {
                         if (this.importNPC.actionCastingSpells[spellListIndex]) {
                            this.importNPC.actionCastingSpells[spellListIndex].freq = spellListMatch[1].trim();
                            this.importNPC.actionCastingSpells[spellListIndex].list = spellListMatch[2].replace(/,\s*/g, ', ').trim(); // Standardize comma spacing
                         }
                         spellListIndex++;
                     } else {
                         currentLineIndex--; // Backtrack if it's not a spell list line
                         break; // Stop parsing spell lists
                     }
                 }
                 currentItem = null; // Reset item parsing after spellcasting block
                 continue; // Continue to next line after processing spell lists (already incremented in loop)
             }
             else if (actionMatch) {
                // Start of a new regular action
                currentItem = { name: actionMatch[1].trim(), desc: actionMatch[2].trim() }; // Use 'desc'
                this.importNPC.actions.actions.push(currentItem);
             } else if (currentItem) {
                // Continuation of the previous action's description
                currentItem.desc += " " + line; // Use 'desc'
             } else {
                 // Orphan line in actions section
                console.warn("Could not parse action line (orphan line?):", line);
             }
         }
         // --- Legendary Actions ---
         else if (currentSection === 'legendary') {
            const legendaryMatch = line.match(/^([\w\s-]+)(?:\s*\((Costs\s+\d+\s+Actions?)\))?\.\s*(.*)/); // Name (Cost). Desc...
            if (legendaryMatch) {
               // Start of a new legendary action
               let name = legendaryMatch[1].trim();
               let descText = legendaryMatch[3].trim(); // Use different variable name
               if (legendaryMatch[2]) { // Include cost in name if present
                   name += ` (${legendaryMatch[2]})`;
               }
               currentItem = { name: name, desc: descText }; // Use 'desc'
               this.importNPC.actions['legendary-actions'].push(currentItem);
            } else if (currentItem) {
               // Continuation of the previous legendary action's description
               currentItem.desc += " " + line; // Use 'desc'
            } else {
                // Orphan line in legendary section (might be missed boilerplate)
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
      // Recalculate all derived stats based on imported scores and proficiency
      // Need to ensure bonuses are calculated before inferring saves/skills
      ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
           this.importNPC[`${ability}Bonus`] = window.app.calculateAbilityBonus(this.importNPC[ability]);
       });
      this.inferSavesAndSkills(); // Infer proficiencies/adjustments based on bonuses
       // Call the main stat calculation which also handles derived strings like saves, skills, senses etc.
      window.app.calculateAllStats.call({ activeNPC: this.importNPC }); // Use .call to provide context

      this.updateImportViewport();
   },

   // --- Parsing Helper Functions --- (No changes below this line needed for this fix)

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
         const match = part.match(/(\d+)\s*ft\.?/); // Made '.' optional
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
         } else if (speedVal > 0 && this.importNPC.speedBase === 0) { // Assume first numeric speed is base walking
            this.importNPC.speedBase = speedVal;
         }
      });
      // Recalculate speed string (needs activeNPC context)
      // Speed string is now calculated within calculateAllStats
   },

   parseSaves(savesString) {
      const saves = savesString.split(',');
      saves.forEach(save => {
         const match = save.trim().match(/(\w+)\s+([+-]\d+)/);
         if (match) {
            const ability = match[1].toLowerCase().substring(0, 3); // Use abbreviation
            const bonus = parseInt(match[2], 10);
            const abilityFull = Object.keys(window.app.defaultNPC).find(k => k.startsWith(ability) && !k.includes('Bonus') && !k.includes('Saving'));
            if (abilityFull) {
                // Store raw bonus in adjustment for inferSavesAndSkills to process
               this.importNPC[`${abilityFull}SavingThrowAdjust`] = bonus;
               // Clear proficiency flag initially, let inferSavesAndSkills determine it
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
               // Store raw bonus in adjustment for inferSavesAndSkills to process
               this.importNPC[`skill_${skillData.id}_adjust`] = bonus;
                // Clear flags initially
               this.importNPC[`skill_${skillData.id}_prof`] = false;
               this.importNPC[`skill_${skillData.id}_exp`] = false;
            }
         }
      });
   },

   parseDamageModifiers(modsString, type) {
       const npc = this.importNPC;
       // Reset relevant types first
       window.app.damageTypes.forEach(dt => npc[`${type}_${dt}`] = false);
       if (type === 'resistance') npc.weaponResistance = 'none';
       if (type === 'immunity') npc.weaponImmunity = 'none';

       const parts = modsString.split(';').map(s => s.trim()); // Split by semicolon first for weapon resist clause

       parts.forEach(part => {
           if (part.includes('from nonmagical attacks')) {
               let weaponModType = 'nonmagical'; // Default
               if (part.includes("that aren't silvered")) {
                   weaponModType = 'silvered';
               } else if (part.includes("that aren't adamantine")) {
                   weaponModType = 'adamantine';
               } // Add other checks like cold-forged if needed

               if (type === 'resistance') npc.weaponResistance = weaponModType;
               else if (type === 'immunity') npc.weaponImmunity = weaponModType;

               // Check if specific physical types are *also* listed separately BEFORE the weapon clause
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
               // Regular damage types
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
        // Reset first
       window.app.conditions.forEach(cond => this.importNPC[`ci_${cond}`] = false);
       conditionsString.split(',').forEach(cond => {
         const cleanCond = cond.trim().toLowerCase();
         if (window.app.conditions.includes(cleanCond)) {
            this.importNPC[`ci_${cleanCond}`] = true;
         }
      });
   },

   parseSenses(sensesString) {
       // Reset first
       this.importNPC.senseBlindsight = 0;
       this.importNPC.blindBeyond = false;
       this.importNPC.senseDarkvision = 0;
       this.importNPC.senseTremorsense = 0;
       this.importNPC.senseTruesight = 0;
       // Don't reset passive perception here, calculate it later

      let passivePerception = 10; // Default
      const passiveMatch = sensesString.match(/passive Perception\s+(\d+)/i);
      if (passiveMatch) {
         passivePerception = parseInt(passiveMatch[1], 10);
         // Don't remove passive P from string, just record it, calculateAllStats will derive final value
      }
      // Store the parsed passive P temporarily, calculateAllStats will override it based on skills/wisdom
      // It's mainly useful if skills aren't listed, providing a fallback value.
      this.importNPC.passivePerception = passivePerception;


      sensesString.split(',').forEach(sense => {
         sense = sense.trim();
         const match = sense.match(/(darkvision|blindsight|tremorsense|truesight)\s+(\d+)\s*ft\.?/i); // Made '.' optional
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
      // Senses string is calculated in calculateAllStats
   },

   parseLanguages(languagesString) {
       this.importNPC.selectedLanguages = [];
       this.importNPC.hasTelepathy = false;
       this.importNPC.telepathyRange = 0;
       this.importNPC.specialLanguageOption = 0; // Reset

       // Check for special phrases first
       const langLower = languagesString.toLowerCase();
       if (langLower === 'the languages it knew in life') {
           this.importNPC.specialLanguageOption = 3;
           return; // Don't parse further if special option found
       }
       // Add other special cases if needed

       const parts = languagesString.split(',');
       parts.forEach(part => {
           part = part.trim();
           const telepathyMatch = part.match(/telepathy\s+(\d+)\s*ft\.?/i); // Made '.' optional
           if (telepathyMatch) {
               this.importNPC.hasTelepathy = true;
               this.importNPC.telepathyRange = parseInt(telepathyMatch[1], 10);
           } else if (part && part !== '—' && part !== '-') { // Handle explicit '—', '-' or empty parts
               // Attempt to match against known languages (case-insensitive)
               const knownLangs = [
                   ...window.app.standardLanguages,
                   ...window.app.exoticLanguages,
                   ...window.app.monstrousLanguages1,
                   ...window.app.monstrousLanguages2
                   // We don't know user languages during import parse
               ];
               let found = false;
               for (const known of knownLangs) {
                   if (known.toLowerCase() === part.toLowerCase()) {
                       this.importNPC.selectedLanguages.push(known); // Use original capitalization
                       found = true;
                       break;
                   }
               }
               if (!found) {
                   // If not found, add it anyway. User can manage later.
                   this.importNPC.selectedLanguages.push(part);
                   console.warn("Imported potentially unknown language:", part);
               }
           }
       });
       // Sort imported languages
       this.importNPC.selectedLanguages.sort((a,b) => a.localeCompare(b));
       // Language string is calculated in calculateAllStats
   },

   // Attempt to infer Proficiency/Expertise/Adjustment from parsed bonuses
   inferSavesAndSkills() {
        const npc = this.importNPC;
        const profBonus = npc.proficiencyBonus;
        const skipInfer = !profBonus || profBonus < 2; // Don't try if prof bonus invalid

        // Saves
        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(ability => {
            const abilityBonus = npc[`${ability}Bonus`] ?? 0; // Use calculated bonus
            const keyAdjust = `${ability}SavingThrowAdjust`;
            const keyProf = `${ability}SavingThrowProf`;
            const parsedBonus = npc[keyAdjust]; // We stored the total bonus here temporarily

            npc[keyAdjust] = 0; // Reset adjustment for calculation
            npc[keyProf] = false; // Reset proficiency for calculation

            if (skipInfer || parsedBonus === undefined || parsedBonus === 0) return; // Skip if no bonus parsed, 0, or invalid prof

            const expectedBase = abilityBonus;
            const expectedProf = abilityBonus + profBonus;
            const diffFromBase = parsedBonus - expectedBase;
            const diffFromProf = parsedBonus - expectedProf;

             // Prioritize exact matches first
            if (parsedBonus === expectedProf) {
                 npc[keyProf] = true;
                 npc[keyAdjust] = 0;
            } else if (parsedBonus === expectedBase) {
                 npc[keyProf] = false;
                 npc[keyAdjust] = 0;
            } else if (Math.abs(diffFromProf) <= Math.abs(diffFromBase)) {
                // Closer to proficient bonus implies proficiency + adjustment
                npc[keyProf] = true;
                npc[keyAdjust] = diffFromProf; // Remainder is the adjustment
            } else {
                // Closer to base bonus implies no proficiency + adjustment
                npc[keyProf] = false;
                npc[keyAdjust] = diffFromBase; // Remainder is the adjustment
            }
        });

        // Skills
        window.app.skills.forEach(skill => {
            const abilityBonus = npc[`${skill.attribute}Bonus`] ?? 0; // Use calculated bonus
            const keyAdjust = `skill_${skill.id}_adjust`;
            const keyProf = `skill_${skill.id}_prof`;
            const keyExp = `skill_${skill.id}_exp`;
            const parsedBonus = npc[keyAdjust]; // Stored total bonus here

            npc[keyAdjust] = 0; // Reset
            npc[keyProf] = false;
            npc[keyExp] = false;

            if (skipInfer || parsedBonus === undefined || parsedBonus === 0) return;

            const expectedBase = abilityBonus;
            const expectedProf = abilityBonus + profBonus;
            const expectedExp = abilityBonus + (profBonus * 2);
            const diffFromBase = parsedBonus - expectedBase;
            const diffFromProf = parsedBonus - expectedProf;
            const diffFromExp = parsedBonus - expectedExp;

            // Prioritize exact matches
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
                // Find the minimum difference if no exact match
                const diffs = [
                    { diff: Math.abs(diffFromExp), prof: true, exp: true, adj: diffFromExp },
                    { diff: Math.abs(diffFromProf), prof: true, exp: false, adj: diffFromProf },
                    { diff: Math.abs(diffFromBase), prof: false, exp: false, adj: diffFromBase }
                ];
                diffs.sort((a, b) => a.diff - b.diff); // Sort by smallest difference

                npc[keyProf] = diffs[0].prof;
                npc[keyExp] = diffs[0].exp;
                npc[keyAdjust] = diffs[0].adj;
            }
        });

       // Note: Recalculating Saves and Skills strings now happens in calculateAllStats called after this.
   },


   // --- Confirmation ---
   confirmImport() {
      if (!this.importNPC || !window.app.activeBestiary) return;

      const uniqueName = window.app.findUniqueNpcName(this.importNPC.name || "New Import");
      this.importNPC.name = uniqueName;

      // Add the finalized NPC object to the bestiary
      window.app.activeBestiary.npcs.push(this.importNPC);
      window.app.sortAndSwitchToNpc(this.importNPC); // Sort and switch
      window.app.saveActiveBestiaryToDB(); // Save
      this.closeImportModal(); // Close
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
            const text = await navigator.clipboard.readText();
            if (textArea) {
               textArea.value += text + '\n\n'; // Add spacing after appending
               this.parseText();
            }
         } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            window.app.showAlert("Could not read from clipboard. Check browser permissions.");
         }
      });

      if (textArea) {
         textArea.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
               document.execCommand('insertText', false, text);
            } else {
                const start = textArea.selectionStart;
                const end = textArea.selectionEnd;
                textArea.value = textArea.value.substring(0, start) + text + textArea.value.substring(end);
                textArea.selectionStart = textArea.selectionEnd = start + text.length;
            }
             this.parseText(); // Parse after paste
         });

         // Debounce parsing during input
         let debounceTimer;
         textArea.addEventListener('input', () => {
             clearTimeout(debounceTimer);
             debounceTimer = setTimeout(() => {
                 this.parseText();
             }, 300); // Adjust delay as needed (e.g., 300ms)
         });
      }
   },

   // --- Viewport Logic ---
   updateImportViewport() {
      const activeNPC = this.importNPC; // Use our staging object
      const importViewportElement = document.getElementById('import-viewport');

      if (!activeNPC || !importViewportElement) {
         if (importViewportElement) importViewportElement.innerHTML = '';
         return;
      }

      // Re-use most of the logic from window.viewport.updateViewport, adapting slightly
      // This relies on calculation functions being available on window.app

      const {
         name, size, type, species, alignment, armorClass, hitPoints, description, saves, npcSkills,
         strength, dexterity, constitution, intelligence, wisdom, charisma,
         strengthBonus, dexterityBonus, constitutionBonus, intelligenceBonus, wisdomBonus, charismaBonus,
         useDropCap, addDescription, speed, challenge, experience, proficiencyBonus, traits, sortTraitsAlpha, // Added prof bonus
         actions, legendaryBoilerplate, lairBoilerplate,
         // Spellcasting properties (used by viewport generation helpers)
         hasInnateSpellcasting, innateIsPsionics, innateAbility, innateDC, innateComponents, innateSpells,
         hasSpellcasting, spellcastingPlacement,
         traitCastingLevel, traitCastingAbility, traitCastingDC, traitCastingBonus, traitCastingClass, traitCastingFlavor,
         traitCastingSlots, traitCastingList, traitCastingMarked,
         actionCastingAbility, actionCastingDC, actionCastingComponents, actionCastingSpells
      } = activeNPC;

      // Use global calculation helpers
      const { vulnerabilities, resistances, immunities } = window.app.calculateDamageModifiersString(activeNPC);
      const conditionImmunities = window.app.calculateConditionImmunitiesString(activeNPC);
      const senses = window.app.calculateSensesString(activeNPC);
      const languages = window.app.calculateLanguagesString(activeNPC);

      const NPCName = name || "[Import Preview]"; // Use placeholder
      const NPCac = armorClass || "";
      const NPChp = hitPoints || "";
      const NPCDescriptionHTML = window.app.processTraitString(description, activeNPC) || ""; // Process tokens
      const NPCprofBonus = proficiencyBonus !== undefined ? `+${proficiencyBonus}` : '+2'; // Ensure formatted

      let NPCTypeString = `${size || ""} ${type || ""}`.trim();
      if (species) { NPCTypeString += ` (${species})`; }
      if (alignment) { NPCTypeString += `, ${alignment}`; }

      const NPCspeed = speed || ""; // Use the calculated string
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
      // Use simpler description block for import preview for now
      const descriptionHtml = addDescription ? `<div class="npcdescrip ${dropCapClass}"> ${NPCDescriptionHTML} </div>` : '';


      // --- Copying trait/action/spellcasting rendering from viewport.js ---
      // --- Helper function to italicize spell names ---
      function formatSpellList(listString) {
          if (!listString) return "";
          const spellRegex = /([\w\s'-]+)(\*?)/g;
          let match;
          let result = [];
          while ((match = spellRegex.exec(listString)) !== null) {
              const spellName = match[1].trim(); // Keep original case for display
              const asterisk = match[2];
              if (spellName) {
                  result.push(`<i>${spellName}</i>${asterisk}`);
              }
          }
          return result.join(', ');
      }

      // --- Build Trait/Spellcasting Sections ---
      let combinedTraitsList = [];

      // Innate Spellcasting
      if (hasInnateSpellcasting) {
          const innateTitle = innateIsPsionics ? 'Innate Spellcasting (Psionics)' : 'Innate Spellcasting';
          const abilityName = (innateAbility || 'charisma').charAt(0).toUpperCase() + (innateAbility || 'charisma').slice(1);
          // Recalculate bonus for display if needed (might be missing if parseText hasn't run fully)
          const innateBonusRecalc = window.app.calculateSpellcastingDCBonus(innateAbility, proficiencyBonus, activeNPC).bonus;
          const bonusString = (innateBonusRecalc ?? 0) >= 0 ? `+${innateBonusRecalc ?? 0}` : (innateBonusRecalc ?? 0);
          const dcValue = innateDC ?? 10; // Use parsed DC or fallback
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
          const dcValue = traitCastingDC ?? 10; // Use parsed or fallback
          const bonusValue = traitCastingBonus ?? 2; // Use parsed or fallback
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
              const processedDescription = window.app.processTraitString(trait.desc || '', activeNPC); // Use 'desc'
              const traitHtml = `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${trait.name || 'Unnamed Trait'}.</b></i> ${processedDescription}</div>`;
              combinedTraitsList.push({ name: trait.name || 'Unnamed Trait', html: traitHtml });
          });
      }

      // Sort Combined Traits
      if (sortTraitsAlpha ?? true) {
          combinedTraitsList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      }
      const allTraitsHtml = combinedTraitsList.map(item => item.html).join('');

      // --- Action-based Spellcasting HTML (for Actions section) ---
      let actionSpellcastingBlockItem = null;
      if (hasSpellcasting && spellcastingPlacement === 'actions') {
          const actionTitle = 'Spellcasting';
          const abilityName = (actionCastingAbility || 'intelligence').toLowerCase();
          const dcValue = actionCastingDC ?? 10; // Use parsed or fallback
          const componentsText = actionCastingComponents ? ` ${actionCastingComponents}` : '';
          let boilerplate = `The ${NPCName} casts one of the following spells, using ${abilityName} as the spellcasting ability (spell save DC ${dcValue})${componentsText}:`;
          const spellListHtml = (Array.isArray(actionCastingSpells) ? actionCastingSpells : [])
              .filter(spell => spell?.freq && spell?.list)
              .map(spell => `<div style="color: black; padding-bottom: 0.25em; padding-left: 1em;">${spell.freq}: ${formatSpellList(spell.list)}</div>`)
              .join('');
          const actionSpellcastingHtml = `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${actionTitle}.</b></i> ${boilerplate}${spellListHtml || '<div style="color: black; padding-bottom: 0.25em; padding-left: 1em;">None</div>'}</div>`;
          // Create a dummy desc for sorting purposes if needed
          actionSpellcastingBlockItem = { name: actionTitle, desc: '(See Spellcasting details)', html: actionSpellcastingHtml };
      }

      // --- Create Action Section Function ---
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
              // Use pre-rendered HTML for spellcasting block
              if (action === actionSpellcastingBlockItem) return action.html;
              // Render normal actions
              const processedDesc = window.app.processTraitString(action.desc || '', activeNPC); // Use 'desc'
              return `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${action.name || 'Unnamed Action'}.</b></i> ${processedDesc}</div>`;
          }).join('');
          const boilerplateHtml = boilerplate ? `<div class="npctop" style="padding-bottom: 0.5em; color: black;">${window.app.processTraitString(boilerplate, activeNPC)}</div>` : '';
          return `<div class="action-header">${title}</div><div class="npcdiv2"><svg viewBox="0 0 200 1" preserveAspectRatio="none" width="100%" height="1"><polyline points="0,0 200,0 200,1 0,1" fill="#7A200D" class="whoosh"></polyline></svg></div>${boilerplateHtml}${actionItemsHtml}`;
      };

      // --- Build Action Sections ---
      const safeActions = actions || {};
      const actionsHtml = createActionSection(safeActions.actions, 'Actions');
      const bonusActionsHtml = createActionSection(safeActions['bonus-actions'], 'Bonus Actions');
      const reactionsHtml = createActionSection(safeActions.reactions, 'Reactions');
      const legendaryActionsHtml = createActionSection(safeActions['legendary-actions'], 'Legendary Actions', legendaryBoilerplate);
      const lairActionsHtml = createActionSection(safeActions['lair-actions'], 'Lair Actions', lairBoilerplate);

       // --- Challenge/XP/Proficiency Bonus Line ---
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