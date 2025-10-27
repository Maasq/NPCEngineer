// import-cleaner.js

/**
 * Cleans up raw text pasted from scanned statblocks to improve parsing accuracy.
 * @param {string} inputText The raw text input.
 * @returns {string} The cleaned text.
 */
function cleanImportText(inputText) {
   if (!inputText) return "";

   let fixme = inputText;

   // --- Ligatures & Special Characters ---
   const replacements = [
      // Ligatures
      { find: /\uFB02/g, replace: 'fl' }, // liga_fl (ﬂ)
      { find: /\uFB01/g, replace: 'fi' }, // liga_fi (ﬁ)
      { find: /\uFB00/g, replace: 'ff' }, // liga_ff (ﬀ) // Corrected AHK map
      { find: /\u2010/g, replace: '-' }, // liga_hy (‐) - Hyphen

      // Smart Quotes / Primes -> Standard Quotes
      { find: /[\u2018\u2019\u201B\u2032]/g, replace: "'" }, // liga_sq1-4 (‘ ’ ‛ ′) -> '
      { find: /[\u201C\u201D\u201F\u2033]/g, replace: '"' }, // liga_dq1-4 (“ ” ‟ ″) -> "

      // Replacement Characters (often from encoding errors)
      { find: /\uFFFD/g, replace: "'" }, // Specific replacement character  -> ' (Adjust if needed)
      // Generic catch-all for potential other bad chars if needed, but risky.
      // { find: /[^\x00-\x7F]+/g, replace: '' }, // Example: Remove non-ASCII, might remove valid chars

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
      { find: /Vulnerabilities:?/gi, replace: 'Vulnerabilities' }, // Added from AHK list
      { find: /Resistances:?/gi, replace: 'Resistances' },         // Added from AHK list
      { find: /Immunities:?/gi, replace: 'Immunities' },           // Added from AHK list

      // Word spacing / character errors
      { find: /o f /g, replace: 'of ' }, // Note: Added trailing space
      { find: /w ere /g, replace: 'were ' }, // Note: Added trailing space
      { find: / {2,}/g, replace: ' ' }, // Replace multiple spaces with one
      { find: / xp/gi, replace: ' XP' }, // Ensure XP is uppercase
      { find: /0XP/g, replace: '0 XP' }, // Add space after CR 0
      { find: /{/g, replace: '(' },
      { find: /}/g, replace: ')' },
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
      { find: / ,/g, replace: ',' }, // Space before comma
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

       // General cleanup
      { find: /\s+\./g, replace: '.'}, // Remove space before period
      { find: /\s+,/g, replace: ','}, // Remove space before comma
      { find: /\s+:/g, replace: ':'}, // Remove space before colon
      { find: /:\s*\./g, replace: ':'}, // Replace ': .' with just ':'
      { find: /\.\s*\./g, replace: '.'}, // Replace '. .' with just '.'
      { find: /,\s*,/g, replace: ','}, // Replace ', ,' with just ','
      { find: /\n\s*\n/g, replace: '\n' }, // Remove empty lines
   ];

   for (const { find, replace } of replacements) {
      if (typeof find === 'string') {
         // Basic string replacement if needed, though regex is more powerful
         // fixme = fixme.split(find).join(replace); // Basic replaceAll simulation
      } else {
         // Regex replacement
         fixme = fixme.replace(find, replace);
      }
   }

   return fixme.trim(); // Trim final result
}

// Assign to window if needed, or keep scoped if only used by import.js
window.importCleaner = {
   cleanImportText
};