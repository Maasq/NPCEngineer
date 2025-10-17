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
        useDropCap, addDescription, speed, challenge, experience, traits, sortTraitsAlpha
    } = activeNPC;
    
    const { vulnerabilities, resistances, immunities } = window.app.calculateDamageModifiersString(activeNPC);
    const conditionImmunities = window.app.calculateConditionImmunitiesString(activeNPC);
    const senses = window.app.calculateSensesString(activeNPC);
    const languages = window.app.calculateLanguagesString(activeNPC);

    const NPCName = name || "";
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

    const dropCapClass = useDropCap ? 'drop-cap' : '';
    const descriptionHtml = addDescription ? `<div class="npcdescrip ${dropCapClass}"> ${NPCDescriptionHTML} </div>` : '';

    let traitsHtml = '';
	if (traits && traits.length > 0) {
		let traitsToRender = [...traits]; // Create a copy to avoid modifying the original
		if (sortTraitsAlpha ?? true) {
			traitsToRender.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
		}
		traitsHtml = `
            <div class="npcdiv">
                <svg width="100%" height="5"><use href="#divider-swoosh"></use></svg>
            </div>
            ${traitsToRender.map(trait => {
                const processedDescription = window.app.processTraitString(trait.description, activeNPC);
                return `<div class="npctop" style="margin-bottom: 0.5em; color: black;"><i><b>${trait.name}.</b></i> ${processedDescription}</div>`
            }).join('')}
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
            ${challenge ? `<div class="npctop"><b>Challenge</b> ${challenge} (${experience} XP)</div>` : ''}
            ${traitsHtml}
            <div class="npcdiv">
                <svg width="100%" height="5"><use href="#divider-swoosh"></use></svg>
            </div>
            <div class="npcbottom">&nbsp;</div>
            <div class="cap"></div>
        </div>
        ${descriptionHtml}
    `;
    viewport.innerHTML = generatedHtml;
}