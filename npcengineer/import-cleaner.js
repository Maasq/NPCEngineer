// import-cleaner.js

/**
 * Converts a string to Title Case.
 * @param {string} str - The string to convert.
 * @returns {string} The Title Cased string.
 */
function toTitleCase(str) {
   if (!str) return "";
   return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Converts a string to Sentence case.
 * @param {string} str - The string to convert.
 * @returns {string} The Sentence cased string.
 */
function toSentenceCase(str) {
   if (!str) return "";
   const lower = str.toLowerCase();
   return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Cleans up raw text pasted from scanned statblocks to improve parsing accuracy.
 * @param {string} inputText The raw text input.
 * @returns {string} The cleaned text.
 */
function cleanImportText(inputText) {
   if (!inputText) return "";

   let fixme = inputText;

   const protect = [
      { find: /components:/gi, replace: 'components~##~' },
      { find: /component:/gi, replace: 'component~##~' },
      { find: /spells:/gi, replace: 'spells~##~' },
      { find: /Weapon Attack:\r\n/g, replace: 'Weapon Attack~##~ \r\n' },
      { find: /Weapon Attack:/gi, replace: 'Weapon Attack~##~' },
      { find: /Spell Attack:/gi, replace: 'Spell Attack~##~' },
      { find: /will:/gi, replace: 'will~##~' },
      { find: /each:/gi, replace: 'each~##~' },
      { find: /slots:/gi, replace: 'slots~##~' },
      { find: /slot:/gi, replace: 'slot~##~' },
      { find: /prepared:/gi, replace: 'prepared~##~' },
      { find: /will\):/gi, replace: 'will)~##~' },
      { find: /each\):/gi, replace: 'each)~##~' },
      { find: /slots\):/gi, replace: 'slots)~##~' },
      { find: /slot\):/g, replace: 'slot)~##~' },
      { find: /Hit:/gi, replace: 'Hit~##~' },
      { find: /\/Day:/g, replace: '/day~##~' },
      { find: /\/day:/g, replace: '/day~##~' },
   ];

   // Apply protection
   for (const { find, replace } of protect) {
      fixme = fixme.replace(find, replace);
   }
   // Replace all remaining (non-protected) colons with periods
   fixme = fixme.replace(/:/g, '.');
   // Restore protected colons
   fixme = fixme.replace(/~##~/g, ':');

   // --- Ligatures & Special Characters ---
   const replacements = [
      // Line Endings (CRLF -> LF, CR -> LF) - Run First!
      { find: /\r\n/g, replace: '\n' },
      { find: /\r/g, replace: '\n' },

      // Replace Non-Breaking Spaces with Regular Spaces - Run Early!
      { find: /\u00A0/g, replace: ' ' },

      // Normalize Dashes (En and Em)
      { find: /[\u2013\u2014]/g, replace: '-' },

      // Standardize Ellipses
      { find: /\.\.\./g, replace: '\u2026' },
      
      // Ligatures
      { find: /\uFB02/g, replace: 'fl' }, // liga_fl (ﬂ)
      { find: /\uFB01/g, replace: 'fi' }, // liga_fi (ﬁ)
      { find: /\uFB00/g, replace: 'ff' }, // liga_ff (ﬀ) 
      { find: /\u2010/g, replace: '-' }, // liga_hy (‐) - Hyphen 

      // Smart Quotes / Primes -> Standard Quotes
      { find: /[\u2018\u2019\u201B\u2032]/g, replace: "'" }, // liga_sq1-4 (‘ ’ ‛ ′) -> '
      { find: /[\u201C\u201D\u201F\u2033]/g, replace: '"' }, // liga_dq1-4 (“ ” ‟ ″) -> "

      // Replacement Characters (often from encoding errors)
      { find: /\uFFFD/g, replace: "'" }, // Specific replacement character  -> ' (Adjust if needed)

      // --- Common OCR/Formatting Fixes ---
      // Normalize Headers (Remove colon, fix case variations)
      { find: /Armor Class:?/gi, replace: 'Armor Class' },
      { find: /Armour Class:?/gi, replace: 'Armor Class' },
      { find: /Hit Points:?/gi, replace: 'Hit Points' },
      { find: /Speed:?/gi, replace: 'Speed' },
      { find: /Saving Throws:?/gi, replace: 'Saving Throws' },
      { find: /Skills:?/gi, replace: 'Skills' },
      { find: /Senses:?/gi, replace: 'Senses' },
      { find: /Languages:?/gi, replace: 'Languages' },
      { find: /Challenge:?/gi, replace: 'Challenge' },
      { find: /Vulnerabilities:?/gi, replace: 'Vulnerabilities' },
      { find: /Resistances:?/gi, replace: 'Resistances' },
      { find: /Immunities:?/gi, replace: 'Immunities' }, 

      // Word spacing / character errors
      { find: /o f /g, replace: 'of ' }, 
      { find: /w ere /g, replace: 'were ' }, 
      { find: / wea pon /g, replace: ' weapon ' }, 
      { find: / wea pon\./g, replace: ' weapon.' }, 
      { find: / followin g /g, replace: ' following ' }, 
      { find: / followin g\./g, replace: ' following.' }, 
      { find: /Med ium/g, replace: 'Medium' }, 
      { find: / xp/gi, replace: ' XP' }, 
      { find: /0XP/g, replace: '0 XP' }, 
      { find: /{/g, replace: '(' },
      { find: /}/g, replace: ')' },
      { find: /Melee Weapon Attack\.(?=\s)/gi, replace: 'Melee Weapon Attack:' }, 
      { find: /Melee Weapon Attack\.\n/gi, replace: 'Melee Weapon Attack: ' }, 
      { find: /Ranged Weapon Attack\.(?=\s)/gi, replace: 'Ranged Weapon Attack:' }, 
      { find: /Ranged Weapon Attack\.\n/gi, replace: 'Ranged Weapon Attack: ' }, 
      { find: /Melee Spell Attack\.(?=\s)/gi, replace: 'Melee Spell Attack:' }, 
      { find: /Melee Spell Attack\.\n/gi, replace: 'Melee Spell Attack: ' },
      { find: /Ranged Spell Attack\.(?=\s)/gi, replace: 'Ranged Spell Attack:' },
      { find: /Ranged Spell Attack\.\n/gi, replace: 'Ranged Spell Attack: ' }, 
      { find: / fre /g, replace: ' fire ' },
      { find: /f re /g, replace: ' fire ' },
      { find: / fi re /g, replace: ' fire ' }, 
      { find: /Dam age /g, replace: 'Damage ' },
      { find: /ft\. ,/g, replace: 'ft.,' }, 
      { find: /ft \./g, replace: 'ft.' }, 
      { find: /~/g, replace: 'r' }, 
      { find: /[Jjƒ]\/Day/gi, replace: '/Day' }, // J/f -> /
      { find: /[Ll]1\/Day/gi, replace: '1/Day' }, 
      { find: /(\d)JDay/gi, replace: '$1/Day' },
      { find: /fitnd/gi, replace: 'fiend' },
      { find: /choolic/gi, replace: 'chaotic' },
      { find: /Armo\.r/gi, replace: 'Armor' },
      { find: /dl0|dlO/gi, replace: 'd10' }, // l0/lO -> 10
      { find: /ld([1468])/g, replace: '1d$1' }, // l -> 1 before d#
      { find: /non magical/gi, replace: 'nonmagical' },
      { find: /\(at wi ll\)/gi, replace: '(At will)' }, // Fix spacing and case
      { find: /\(at will\)/gi, replace: '(At will)' }, // Fix case
      { find: /inn ate/gi, replace: 'innate' },
      { find: /speilcasting/gi, replace: 'spellcasting' },
      { find: / 1st(?![-\w])/gi, replace: ' 1st ' }, // Add space around 1st (careful not to add in words)
      { find: /Whi1st/g, replace: 'Whilst' }, // 1 -> l
      { find: /whi1st/g, replace: 'whilst' }, // 1 -> l
      { find: /\) :/g, replace: '):' }, // Space between ) and :
      { find: / Te(?=\s)/g, replace: ' The' }, // Te -> The
      { find: / te(?=\s)/g, replace: ' the' }, // te -> the
      { find: / Tey(?=\s)/g, replace: ' They' }, // Tey -> They
      { find: / tey(?=\s)/g, replace: ' they' }, // tey -> they
      { find: /fght/gi, replace: 'fight' },
      { find: / ca n /g, replace: ' can ' }, // Word spacing
      { find: / th e /g, replace: ' the ' }, // Word spacing
      { find: / savin g /g, replace: ' saving ' }, // Word spacing
      { find: /\.\s*\n/g, replace: '.\n' }, // Remove space after period before newline
      { find: /(Actions|ACTIONS)\s*\n/g, replace: '$1\n' }, // Remove space after ACTIONS before newline
      { find: /(Challenge\s+[\d\/]+\s*\([\d,]+\s*XP\))\s*\n\s*(Proficiency Bonus\s*[+-]\d+)/gi, replace: '$1 $2' },

      // Challenge Rating formatting (adjust if needed)
      { find: /(\d)\(/g, replace: '$1 (' },
      // Add XP inside parentheses. Handles existing XP, commas in XP, optional space before parentheses
      { find: /Challenge(.*)\s*\((\d{1,3}(?:,\d{3})*)(?:\s*XP)?\)/gi, replace: 'Challenge$1($2 XP)' },

      // --- SPECIFIC OCR FIX: Using specific string replacements ---
      { find: 'Challenges (1, 800 XP)', replace: 'Challenge 5 (1,800 XP)' },
      { find: 'Challenges (1,800 XP)', replace: 'Challenge 5 (1,800 XP)' },
      { find: 'Challenges (1800 XP)', replace: 'Challenge 5 (1,800 XP)' },
      { find: 'Challenges (1 800 XP)', replace: 'Challenge 5 (1,800 XP)' },
      { find: 'E~i/', replace: 'Evil' },
      { find: 'Eri/', replace: 'Evil' },
      { find: '(+O)', replace: '(+0)' },
      { find: '(+l)', replace: '(+1)' },
      { find: '(-l)', replace: '(-1)' },

       // General cleanup & Whitespace around punctuation
      { find: /\s+([.,:;])/g, replace: '$1'}, // Remove space BEFORE .,:;
      // { find: /([.,:;])(?![\n\s.,:;)]|$)/g, replace: '$1 '}, // MODIFIED BELOW
      { find: /:\s*\./g, replace: ':'}, // Replace ': .' with just ':'
      // NEW: Remove double punctuation
      { find: /\.\.+/g, replace: '.'}, // Replace '..' or more with '.'
      { find: /,,+/g, replace: ','}, // Replace ',,' or more with ','
      { find: /::+/g, replace: ':'}, // Replace '::' or more with ':'
      { find: /;;+/g, replace: ';'}, // Replace ';;' or more with ';'

      // Space before newline
      { find: / +\n/g, replace: '\n'},

      // Multiple Spaces / Blank Lines - Run near the end
      { find: / {2,}/g, replace: ' ' }, 
      { find: /\n{2,}/g, replace: '\n' },
   ];
   
   for (const { find, replace } of replacements) {
      if (typeof find === 'string') {
         fixme = fixme.split(find).join(replace); // This is a global replacement for simple strings
      } else {
         fixme = fixme.replace(find, replace); // Regex replacement (respects 'g' flag)
      }
   }

   // Final pass to ensure space after punctuation handles edge cases after multiple space removal
   
   fixme = fixme.replace(/([.,:;])(?![\n\s.,:;)\d]|$) /g, '$1 ');
   fixme = fixme.trim(); 

   // Title Case the first line (the Name) 
   let lines = fixme.split('\n');
   if (lines.length > 0) {
      lines[0] = toTitleCase(lines[0]); // Use the function defined in this file
   }
   return lines.join('\n');
}


/**
 * Joins selected lines into a single paragraph with spaces.
 * Removes blank lines within the selection before joining.
 * @param {string} selectedText The text currently selected in the textarea.
 * @returns {string} The processed text as a single paragraph.
 */
function joinSelectedLines(selectedText) {
   if (!selectedText) return ''; 
   
   // 1. Normalize line endings to LF (\n)
   let processed = selectedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

   // 2. Remove blank lines within the selection
   processed = processed.replace(/\n\s*\n/g, '\n');

   // 3. Replace all remaining LF characters with a single space
   processed = processed.replace(/\n/g, ' ');

   // 4. Collapse multiple spaces into single spaces
   processed = processed.replace(/ {2,}/g, ' ');

   // 5. Trim leading/trailing whitespace
   processed = processed.trim();

   // 6. Return the processed text without adding a newline
   return processed;
}

/**
 * Cycles the case of the selected text through: Title -> UPPER -> lower -> Sentence.
 * @param {string} selectedText The text currently selected.
 * @returns {string} The text with the next case applied.
 */
function cycleSelectedTextCase(selectedText) {
   if (!selectedText) return "";

   const firstChar = selectedText.charAt(0);
   const isLower = selectedText === selectedText.toLowerCase();
   const isUpper = selectedText === selectedText.toUpperCase();
   const words = selectedText.split(' ');
   const titleCaseWordCount = words.filter(word => word.length === 0 || word[0] === word[0].toUpperCase()).length;
   const isTitle = !isUpper && !isLower && titleCaseWordCount >= words.length / 2; // Heuristic
   const isSentence = !isLower && !isUpper && !isTitle && firstChar === firstChar.toUpperCase() && selectedText.slice(1) === selectedText.slice(1).toLowerCase();

   if (isTitle) {
      return selectedText.toUpperCase(); // Title -> UPPER
   } else if (isUpper) {
      return selectedText.toLowerCase(); // UPPER -> lower
   } else if (isLower) {
      return toSentenceCase(selectedText); // lower -> Sentence
   } else { // Includes Sentence case or mixed case
      return toTitleCase(selectedText); // Sentence/Mixed -> Title
   }
}


// Assign functions to the window object
window.importCleaner = {
   cleanImportText,
   joinSelectedLines,
   cycleSelectedTextCase // Expose the new function
};