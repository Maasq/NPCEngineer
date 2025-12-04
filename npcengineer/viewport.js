window.viewport = {
   updateViewport
};

function updateViewport() {
   const { activeNPC } = window.app;
   const { viewport } = window.ui;

   if (!activeNPC) {
      viewport.innerHTML = '';
      return;
   }
   const {
      name, size, type, species, alignment, armorClass, hitPoints, description, saves, npcSkills,
      strength, dexterity, constitution, intelligence, wisdom, charisma,
      strengthBonus, dexterityBonus, constitutionBonus, intelligenceBonus, wisdomBonus, charismaBonus,
      useDropCap, addDescription, addTitle, addImageLink, speed, challenge, experience, proficiencyBonus, traits, sortTraitsAlpha, 
      actions, legendaryBoilerplate, lairBoilerplate,
      cameraToken, nonId, damageThreshold,
      // Innate Spellcasting properties
      hasInnateSpellcasting, innateIsPsionics, innateAbility, innateDC, innateComponents, innateSpells,
      // Regular Spellcasting properties
      hasSpellcasting, spellcastingPlacement,
      // Trait Spellcasting properties
      traitCastingLevel, traitCastingAbility, traitCastingDC, traitCastingBonus, traitCastingClass, traitCastingFlavor,
      traitCastingSlots, traitCastingList, traitCastingMarked,
      // Action Spellcasting properties
      actionCastingAbility, actionCastingDC, actionCastingComponents, actionCastingSpells
   } = activeNPC;

   const { vulnerabilities, resistances, immunities } = window.app.calculateDamageModifiersString(activeNPC);
   const conditionImmunities = window.app.calculateConditionImmunitiesString(activeNPC);
   const senses = window.app.calculateSensesString(activeNPC);
   const languages = window.app.calculateLanguagesString(activeNPC);

   const NPCName = name || "[Creature Name]";
   const NPCac = armorClass || "";
   const NPChp = hitPoints || "";
   const NPCDescriptionHTML = window.app.processTraitString(description, activeNPC) || "";

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
   const NPCprofBonus = proficiencyBonus !== undefined ? `+${proficiencyBonus}` : '+2';

   // --- NEW DROP CAP LOGIC ---
   let processedDescriptionHtml = NPCDescriptionHTML;
   
   // Only process if drop cap is requested and description exists
   if (useDropCap && addDescription && NPCDescriptionHTML) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = NPCDescriptionHTML;
      
      const children = Array.from(tempDiv.children);
      let targetElement = null;

      for (const child of children) {
         const tag = child.tagName.toLowerCase();
         // Skip quotes and headers, looking for the first paragraph-like block
         if (tag !== 'blockquote' && tag !== 'h1' && tag !== 'h2' && tag !== 'h3') {
            targetElement = child;
            break;
         }
      }

      if (targetElement) {
         targetElement.classList.add('drop-cap');
         processedDescriptionHtml = tempDiv.innerHTML;
      }
   }
   // --- END DROP CAP LOGIC ---

   const titleHtml = addTitle ? `<div style="font-family: 'Questrial', sans-serif; font-size: 17pt; color: #7A200D; font-weight: bold; padding-left: 0.1cm; padding-bottom: 0.0cm; padding-top: 0.4cm;">${NPCName}</div>` : '';
   const descriptionTopPadding = addTitle ? '0.0cm' : '0.4cm';
   
   const imageLinkHtml = (addImageLink && activeNPC.image) ? `<div style="font-family: 'Questrial', sans-serif; font-size: 11pt; color: #222222; padding-left: 0.1cm; padding-bottom: 0.5cm; display: flex; align-items: center;"><img src="graphics/link.webp" style="height: 18px; width: 18px; margin-left: 6px; margin-right: 4px;"> Image: ${NPCName}</div>` : '';
   
   const descriptionBlockHtml = addDescription ?
      `${titleHtml}${imageLinkHtml}<div class="npcdescrip" style="padding: ${descriptionTopPadding} 0.1cm 0cm 0.1cm;"> ${processedDescriptionHtml} </div>`
      : '';

   // --- Helper function to italicize spell names ---
   function formatSpellList(listString) {
      if (!listString) return "";
      const spellRegex = /([\w\s'()-]+)(\*?)/g;
      let match;
      let result = [];
      while ((match = spellRegex.exec(listString)) !== null) {
         const spellName = match[1].trim().toLowerCase();
         const asterisk = match[2];
         if (spellName) {
            result.push(`<i>${spellName}</i>${asterisk}`);
         }
      }
      return result.join(', ');
   }


   // --- Build Trait/Spellcasting Sections (as individual items for sorting) ---
   let combinedTraitsList = [];

   // Build Innate Spellcasting Trait Block
   if (hasInnateSpellcasting) {
      const innateTitle = innateIsPsionics ? 'Innate Spellcasting (Psionics)' : 'Innate Spellcasting';
      const abilityName = (innateAbility || 'charisma').charAt(0).toUpperCase() + (innateAbility || 'charisma').slice(1);
      const { bonus: innateBonusForDisplay } = window.app.calculateSpellcastingDCBonus(innateAbility, activeNPC.proficiencyBonus, activeNPC);
      const bonusString = (innateBonusForDisplay ?? 0) >= 0 ? `+${innateBonusForDisplay ?? 0}` : (innateBonusForDisplay ?? 0);
      const dcValue = innateDC ?? 10;

      let boilerplate = `The ${NPCName}'s innate spellcasting ability is ${abilityName} (spell save DC ${dcValue}, ${bonusString} to hit with spell attacks). `;
      const componentsText = innateComponents || '';
      boilerplate += `It can innately cast the following spells${componentsText ? `, ${componentsText}` : ''}:`;

      const spellListHtml = (Array.isArray(innateSpells) ? innateSpells : [])
         .filter(spell => spell?.freq && spell?.list)
         .map(spell => {
            const formattedList = formatSpellList(spell.list);
            return `<div style="color: black; padding-bottom: 0.25em;">${spell.freq}: ${formattedList}</div>`;
         })
         .join('');

      const innateTraitHtml = `
         <div class="npctop" style="padding-bottom: 0.5em; color: black;">
            <i><b>${innateTitle}.</b></i> ${boilerplate}
            ${spellListHtml || '<div style="color: black; padding-bottom: 0.25em;">None</div>'}
         </div>
      `;
      combinedTraitsList.push({ name: innateTitle, html: innateTraitHtml });
   }

   // Build Trait-based Spellcasting Block
   if (hasSpellcasting && spellcastingPlacement === 'traits') {
      const traitSpellcastingTitle = 'Spellcasting';
      const levels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th'];
      const levelText = levels[(parseInt(traitCastingLevel, 10) || 1) - 1] || '1st';
      const abilityName = (traitCastingAbility || 'intelligence').charAt(0).toUpperCase() + (traitCastingAbility || 'intelligence').slice(1);
      const dcValue = traitCastingDC ?? 10;
      const bonusValue = traitCastingBonus ?? 2;
      const bonusString = bonusValue >= 0 ? `+${bonusValue}` : bonusValue;
      const className = traitCastingClass ? ` ${traitCastingClass}` : '';

      let boilerplate = traitCastingFlavor || `The ${NPCName} is a ${levelText}-level spellcaster. Its spellcasting ability is ${abilityName} (spell save DC ${dcValue}, ${bonusString} to hit with spell attacks).`;
      boilerplate += ` The ${NPCName} has the following${className} spells prepared:`;

      let spellListHtml = '';
      const safeTraitList = Array.isArray(traitCastingList) ? traitCastingList : [];
      const safeTraitSlots = Array.isArray(traitCastingSlots) ? traitCastingSlots : [];

      if (safeTraitList[0]) {
         spellListHtml += `<div style="color: black; padding-bottom: 0.25em;">Cantrips (at will): ${formatSpellList(safeTraitList[0])}</div>`;
      }

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

      const traitSpellcastingHtml = `
         <div class="npctop" style="padding-bottom: 0.5em; color: black;">
            <i><b>${traitSpellcastingTitle}.</b></i> ${boilerplate}
            ${spellListHtml || '<div style="color: black; padding-bottom: 0.25em;">None</div>'}
            ${markedSpellsHtml}
         </div>
      `;
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
      const dcValue = actionCastingDC ?? 10;
      const componentsText = actionCastingComponents ? ` ${actionCastingComponents}` : '';

      let boilerplate = `The ${NPCName} casts one of the following spells, using ${abilityName} as the spellcasting ability (spell save DC ${dcValue})${componentsText}:`;

      const spellListHtml = (Array.isArray(actionCastingSpells) ? actionCastingSpells : [])
         .filter(spell => spell?.freq && spell?.list)
         .map(spell => {
            const formattedList = formatSpellList(spell.list);
            return `<div style="color: black; padding-bottom: 0.25em; padding-left: 1em;">${spell.freq}: ${formattedList}</div>`;
         })
         .join('');

      const actionSpellcastingHtml = `
         <div class="npctop" style="padding-bottom: 0.5em; color: black;">
            <i><b>${actionTitle}.</b></i> ${boilerplate}
            ${spellListHtml || '<div style="color: black; padding-bottom: 0.25em; padding-left: 1em;">None</div>'}
         </div>
      `;
      actionSpellcastingBlockItem = { name: actionTitle, desc: boilerplate + (spellListHtml ? '...' : ''), html: actionSpellcastingHtml };
   }

   const createActionSection = (actionList, title, boilerplate = '') => {
      const safeActionList = Array.isArray(actionList) ? actionList : [];
      let combinedActions = [...safeActionList];

      if (title === 'Actions' && actionSpellcastingBlockItem) {
         combinedActions.push(actionSpellcastingBlockItem);
      }

      if (combinedActions.length === 0) return '';

      let sortedList = [];
      if(title === 'Actions') {
         let multiattack = null;
         const otherItems = combinedActions.filter(item => {
            if (item && item.name && item.name.toLowerCase() === 'multiattack') {
               multiattack = item;
               return false;
            }
            return true;
         });
         otherItems.sort((a,b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
         sortedList = multiattack ? [multiattack, ...otherItems] : otherItems;
      } else {
         sortedList = combinedActions.sort((a,b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
      }

      const actionItemsHtml = sortedList.map(action => {
         if (!action) return '';
         if (action === actionSpellcastingBlockItem) {
            return action.html;
         }
         const processedDesc = window.app.processTraitString(action.desc || '', activeNPC);
         return `<div class="npctop" style="padding-bottom: 0.5em; color: black;"><i><b>${action.name || 'Unnamed Action'}.</b></i> ${processedDesc}</div>`;
      }).join('');

      const boilerplateHtml = boilerplate ? `<div class="npctop" style="padding-bottom: 0.5em; color: black;">${window.app.processTraitString(boilerplate, activeNPC)}</div>` : '';

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
         ${damageThreshold > 0 ? `<div class="npctop"><b>Damage Threshold</b> ${damageThreshold}</div>` : ''}
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
      ${!addDescription ? '<div style="height: 1.5rem;"></div>' : ''} ${descriptionBlockHtml}
   `;
   viewport.innerHTML = generatedHtml;
}