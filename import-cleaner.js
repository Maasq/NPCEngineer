// import-cleaner.js

/**
 * Converts a string to Title Case.
 * @param {string} str - The string to convert.
 * @returns {string} The Title Cased string.
 */
function toTitleCase(str) {
   if (!str) return "";
   // Basic Title Case, doesn't handle articles/prepositions specially.
   return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Converts a string to Sentence case.
 * Capitalizes the first letter of the first word and keeps the rest lower.
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

   // --- NEW: Colon Protection Logic (from AHK script) ---
   // This section converts non-structural colons to periods to aid parsing.
   // It first protects known structural colons by replacing them with a placeholder.
   // Using global regex replacement (e.g., /find/g) is the JS equivalent of AHK's "All" flag.

   const protect = [
      // From user's snippet
      { find: /components:/gi, replace: 'components~##~' },
      { find: /component:/gi, replace: 'component~##~' },
      { find: /spells:/gi, replace: 'spells~##~' },
      { find: /Weapon Attack:\r\n/g, replace: 'Weapon Attack~##~ \r\n' }, // Specific case from snippet
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
      { find: /\/Day:/g, replace: '/day~##~' }, // Corrected case
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

   // --- End of Colon Protection Logic ---


   // --- Ligatures & Special Characters ---
   const replacements = [
      // Line Endings (CRLF -> LF, CR -> LF) - Run First!
      { find: /\r\n/g, replace: '\n' },
      { find: /\r/g, replace: '\n' },

      // Replace Non-Breaking Spaces with Regular Spaces - Run Early!
      { find: /\u00A0/g, replace: ' ' },

      // Normalize Dashes (En and Em)
      { find: /[\u2013\u2014]/g, replace: '-' }, // En-dash (–), Em-dash (—) -> Hyphen (-)

      // Standardize Ellipses
      { find: /\.\.\./g, replace: '\u2026' }, // Three periods -> Ellipsis character (…)

      // Ligatures
      { find: /\uFB02/g, replace: 'fl' }, // liga_fl (ﬂ)
      { find: /\uFB01/g, replace: 'fi' }, // liga_fi (ﬁ)
      { find: /\uFB00/g, replace: 'ff' }, // liga_ff (ﬀ) // Corrected AHK map
      { find: /\u2010/g, replace: '-' }, // liga_hy (‐) - Hyphen (redundant but safe)

      // Smart Quotes / Primes -> Standard Quotes
      { find: /[\u2018\u2019\u201B\u2032]/g, replace: "'" }, // liga_sq1-4 (‘ ’ ‛ ′) -> '
      { find: /[\u201C\u201D\u201F\u2033]/g, replace: '"' }, // liga_dq1-4 (“ ” ‟ ″) -> "

      // Replacement Characters (often from encoding errors)
      { find: /\uFFFD/g, replace: "'" }, // Specific replacement character  -> ' (Adjust if needed)

      // --- Common OCR/Formatting Fixes ---
      // Normalize Headers (Remove colon, fix case variations)
      // NOTE: User's script handles this by NOT protecting these.
      { find: /Armor Class:?/gi, replace: 'Armor Class' },
      { find: /Armour Class:?/gi, replace: 'Armor Class' },
      { find: /Hit Points:?/gi, replace: 'Hit Points' },
      { find: /Speed:?/gi, replace: 'Speed' },
      { find: /Saving Throws:?/gi, replace: 'Saving Throws' },
      { find: /Skills:?/gi, replace: 'Skills' },
      { find: /Senses:?/gi, replace: 'Senses' },
      { find: /Languages:?/gi, replace: 'Languages' },
      { find: /Challenge:?/gi, replace: 'Challenge' }, // General Challenge normalization
      { find: /Vulnerabilities:?/gi, replace: 'Vulnerabilities' }, // Added from AHK list
      { find: /Resistances:?/gi, replace: 'Resistances' },         // Added from AHK list
      { find: /Immunities:?/gi, replace: 'Immunities' },           // Added from AHK list

      // Word spacing / character errors
      { find: /o f /g, replace: 'of ' }, // Note: Added trailing space
      { find: /w ere /g, replace: 'were ' }, // Note: Added trailing space
      { find: / xp/gi, replace: ' XP' }, // Ensure XP is uppercase
      { find: /0XP/g, replace: '0 XP' }, // Add space after CR 0
      { find: /{/g, replace: '(' },
      { find: /}/g, replace: ')' },
      // Note: The colon-protection logic above should handle Weapon Attack:
      // We still need these to fix cases where a period was used instead of a colon
      { find: /Melee Weapon Attack\.(?=\s)/gi, replace: 'Melee Weapon Attack:' }, // Fix period to colon
      { find: /Melee Weapon Attack\.\n/gi, replace: 'Melee Weapon Attack: ' }, // Fix period to colon with newline
      { find: /Ranged Weapon Attack\.(?=\s)/gi, replace: 'Ranged Weapon Attack:' }, // Added for Ranged
      { find: /Ranged Weapon Attack\.\n/gi, replace: 'Ranged Weapon Attack: ' }, // Added for Ranged
      { find: /Melee Spell Attack\.(?=\s)/gi, replace: 'Melee Spell Attack:' }, // Added for Spell
      { find: /Melee Spell Attack\.\n/gi, replace: 'Melee Spell Attack: ' }, // Added for Spell
      { find: /Ranged Spell Attack\.(?=\s)/gi, replace: 'Ranged Spell Attack:' }, // Added for Spell
      { find: /Ranged Spell Attack\.\n/gi, replace: 'Ranged Spell Attack: ' }, // Added for Spell
      { find: / fre /g, replace: ' fire ' },
      { find: /f re /g, replace: ' fire ' },
      { find: / fi re /g, replace: ' fire ' }, // Need spaces around word
      { find: /Dam age /g, replace: 'Damage ' },
      { find: /ft\. ,/g, replace: 'ft.,' }, // Fix space before comma after ft.
      { find: /ft \./g, replace: 'ft.' }, // Fix space before period
      { find: /~/g, replace: 'r' }, // Often OCR error for 'r'
      { find: /[Jjƒ]\/Day/gi, replace: '/Day' }, // J/f -> /
      { find: /[Ll]1\/Day/gi, replace: '1/Day' }, // L/l -> 1 for 1/Day
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

      // Challenge Rating formatting (adjust if needed)
      // (\d)\( -> $1 ( : Add space between digit and opening parenthesis
      { find: /(\d)\(/g, replace: '$1 (' },
      // Challenge(.*)\((\d+)\) -> Challenge$1($2 XP) : Add XP inside parentheses
      // Made robust: Handles existing XP, commas in XP, optional space before paren
      { find: /Challenge(.*)\s*\((\d{1,3}(?:,\d{3})*)(?:\s*XP)?\)/gi, replace: 'Challenge$1($2 XP)' },

      // --- SPECIFIC OCR FIX: Using specific string replacements ---
      { find: 'Challenges (1, 800 XP)', replace: 'Challenge 5 (1,800 XP)' },
      { find: 'Challenges (1,800 XP)', replace: 'Challenge 5 (1,800 XP)' },
      { find: 'Challenges (1800 XP)', replace: 'Challenge 5 (1,800 XP)' },
      { find: 'Challenges (1 800 XP)', replace: 'Challenge 5 (1,800 XP)' },

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
      { find: / +\n/g, replace: '\n'}, // Remove space(s) right before a newline

      // Multiple Spaces / Blank Lines - Run near the end
      { find: / {2,}/g, replace: ' ' }, // Replace multiple spaces with one
      { find: /\n{2,}/g, replace: '\n' }, // Remove blank lines (replace multiple LFs with one)
   ];

   for (const { find, replace } of replacements) {
      if (typeof find === 'string') {
         fixme = fixme.replace(find, replace); // string replacement (first occurrence only)
      } else {
         fixme = fixme.replace(find, replace); // Regex replacement (respects 'g' flag)
      }
   }

   // Final pass to ensure space after punctuation handles edge cases after multiple space removal
   // --- MODIFIED REGEX: Now excludes digits \d in the negative lookahead ---
   fixme = fixme.replace(/([.,:;])(?![\n\s.,:;)\d]|$) /g, '$1 ');

   fixme = fixme.trim(); // Trim final result

   // --- NEW: Title Case the first line (the Name) ---
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
   if (!selectedText) return ''; // Return empty string if input is empty

   // 1. Normalize line endings to LF (\n)
   let processed = selectedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

   // 2. Remove blank lines within the selection (sequences of newline + whitespace + newline)
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
   // Improved Title Case check: Check if *most* words start with uppercase
   const words = selectedText.split(' ');
   const titleCaseWordCount = words.filter(word => word.length === 0 || word[0] === word[0].toUpperCase()).length;
   const isTitle = !isUpper && !isLower && titleCaseWordCount >= words.length / 2; // Heuristic
   // Sentence case check: First char upper, rest mostly lower (simplistic)
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