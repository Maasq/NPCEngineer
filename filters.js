// filters.js

/**
 * Applies the 'No Filter' (default) option, returning the text unchanged.
 * @param {string} text The raw text.
 * @returns {string} The original, unchanged text.
 */
function applyNoFilter(text) {
   return text;
}

/**
 * Applies 'PDF Filter 1'
 * @param {string} text The raw text.
 * @returns {string} The processed text.
 */
function applyPdfFilter1(text) {
   
   // Normalize newlines first
   let processedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

   // Find the multi-line stat block (STR...CHA).
   let statBlockMatch = processedText.match(/STR\n.*CHA\n/s);
   
   if (statBlockMatch) {
      let statBlock = statBlockMatch[0];
      
      // Remove the original malformed block.
      processedText = processedText.replace(statBlock, "");
      
      // Flatten the block by removing newlines.
      let flattenedStats = statBlock.replace(/\n/g, "");
      
      // Strip the ability labels, leaving only numbers.
      flattenedStats = flattenedStats.replace(/STR ?/g, "");
      flattenedStats = flattenedStats.replace(/DEX ?/g, "");
      flattenedStats = flattenedStats.replace(/CON ?/g, "");
      flattenedStats = flattenedStats.replace(/INT ?/g, "");
      flattenedStats = flattenedStats.replace(/WIS ?/g, "");
      flattenedStats = flattenedStats.replace(/CHA ?/g, "");
      
      // Rebuild the stat line correctly.
      let rebuiltStatLine = "STR DEX CON INT WIS CHA " + flattenedStats + "\n";
      
      // Find the 'Speed' line to insert after.
      let speedLineMatch = processedText.match(/Speed.*?ft\.\n/);
      
      if (speedLineMatch) {
         let speedLine = speedLineMatch[0];
         let speedLineEndPos = speedLineMatch.index + speedLine.length;
         
         // Get the text from the start to the end of the speed line.
         let headerPart = processedText.substring(0, speedLineEndPos);
         
         // Get the rest of the text.
         let restOfText = processedText.substring(speedLineEndPos);
         
         // Reconstruct the text with the fixed stat line.
         processedText = headerPart + rebuiltStatLine + restOfText;
      }
   }
   
   // Fix 'AC:' (first instance only).
   processedText = processedText.replace("AC:", "Armor Class");
   
   return processedText;
}

/**
 * Applies 'PDF Filter 2'
 * @param {string} text The raw text.
 * @returns {string} The processed text.
 */
function applyPdfFilter2(text) {

   // Normalize newlines first
   let processedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

   // General whitespace and alignment cleanup.
   processedText = processedText.replace(/  CHA /g, " CHA");
   processedText = processedText.replace(/  /g, " ");
   processedText = processedText.replace(/\n\n/g, "\n");
   processedText = processedText.replace(/\(normally\nlawful good\)/g, "\n");

   // Detect and fix semicolon-separated stats.
   if (processedText.includes("; DEX")) {
      processedText = processedText.replace(/; DEX/g, "");
      processedText = processedText.replace(/; CON/g, "");
      processedText = processedText.replace(/; INT/g, "");
      processedText = processedText.replace(/; WIS/g, "");
      processedText = processedText.replace(/; CHA/g, "");
      // Add the correct header line (first instance only).
      processedText = processedText.replace("STR ", "STR DEX CON INT WIS CHA\n");
   }
   
   // More specific whitespace and punctuation cleanup.
   processedText = processedText.replace(/\n \n/g, "\n");
   processedText = processedText.replace(/Like Ability \(at will\):/g, "Like Ability (at will).");
   processedText = processedText.replace(/\) \n/g, ")\n");
   processedText = processedText.replace(/ACTIONS \n/g, "ACTIONS\n");

   // Remove lines starting with " CR ". 'gm' flags = global, multiline.
   processedText = processedText.replace(/^ CR .*?\n/gm, "\n");

   // Find the 'Equipment' section.
   let equipmentMatch = processedText.match(/Equipment\n/i);

   if (equipmentMatch) {
      let equipmentBlockPos = equipmentMatch.index;
      
      // Store the equipment block.
      let equipmentBlock = processedText.substring(equipmentBlockPos);
      
      // Remove equipment block from main text.
      processedText = processedText.substring(0, equipmentBlockPos);
      
      // Reformat equipment header to 'Equipment. '
      equipmentBlock = equipmentBlock.replace(/Equipment\n/gi, "Equipment. ");
      
      // Flatten equipment block.
      equipmentBlock = equipmentBlock.replace(/\n/g, "");
      
      // Add non-breaking space (U+00A0) prefix.
      equipmentBlock = "\u00A0" + equipmentBlock;
      
      // Ensure it ends with a period.
      if (equipmentBlock.slice(-1) !== ".") {
         equipmentBlock = equipmentBlock + ".";
      }
      
      // Add a newline.
      equipmentBlock = equipmentBlock + "\n";
      
      // Find the (XP) line.
      let xpLineMatch = processedText.match(/\(.*XP\)\n/i);
      
      if (xpLineMatch) {
         let xpLine = xpLineMatch[0];
         let xpLineEndPos = xpLineMatch.index + xpLine.length;
         
         // Get the text after the XP line.
         let afterXpBlock = processedText.substring(xpLineEndPos);
         
         // Get the text before the block we're moving.
         processedText = processedText.substring(0, xpLineEndPos);
         
         // Re-insert the equipment block after the XP line.
         processedText = processedText + equipmentBlock + afterXpBlock;
      }
   }
   
   return processedText;
}

/**
 * Applies 'PDF Filter 3'
 * @param {string} text The raw text.
 * @returns {string} The processed text.
 */
function applyPdfFilter3(text) {
   // Normalize newlines first
   let processedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

   const stats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
   const statValues = [];
   let statsFound = false;

   for (const stat of stats) {
      // Regex: ^[optional-whitespace]STAT[optional-whitespace]\n(CAPTURE_LINE)\n
      // 'm' flag = ^ matches start of line
      const statRegex = new RegExp('^\\s*' + stat + '\\s*\\n(.*?)\\n', 'm');
      const match = processedText.match(statRegex);

      if (match) {
         statsFound = true;
         // Clean up the stat value: "(- 2)" -> "(-2)"
         const cleanedValue = match[1].trim().replace(/(\([+-])\s+(\d+\))/g, '$1$2');
         statValues.push(cleanedValue);
         // Remove the matched lines
         processedText = processedText.replace(match[0], "");
      } else {
         // Handle case where stat is at the very end of the file
         const statAtEndRegex = new RegExp('^\\s*' + stat + '\\s*\\n(.*?)$', 'm');
         const endMatch = processedText.match(statAtEndRegex);
         if (endMatch) {
            statsFound = true;
            // Clean up the stat value: "(- 2)" -> "(-2)"
            const cleanedValue = endMatch[1].trim().replace(/(\([+-])\s+(\d+\))/g, '$1$2');
            statValues.push(cleanedValue);
            processedText = processedText.replace(endMatch[0], "");
         } else {
            // Stat not found, push a default
            console.warn(`PDF Filter 3: Could not find stat ${stat}.`);
            statValues.push("10 (+0)"); // Default fallback
         }
      }
   }

   // If we found any stats, reconstruct and insert them
   if (statsFound) {
      const statHeader = "STR DEX CON INT WIS CHA\n";
      const statLine = statValues.join(' ') + "\n";
      const newStatBlock = statHeader + statLine;
      
      // Find the 'Speed' line to insert after.
      const speedLineMatch = processedText.match(/Speed.*?ft\.\n/);
      
      if (speedLineMatch) {
         const speedLine = speedLineMatch[0];
         const speedLineEndPos = speedLineMatch.index + speedLine.length;
         
         const headerPart = processedText.substring(0, speedLineEndPos);
         const restOfText = processedText.substring(speedLineEndPos);
         
         // Reconstruct the text with the fixed stat line
         processedText = headerPart + newStatBlock + restOfText;
      } else {
         console.warn("PDF Filter 3: Could not find 'Speed' line to insert stats after.");
         // Fallback: insert it after the first line (name)
         let firstLineEnd = processedText.indexOf('\n') + 1;
         if (firstLineEnd > 0) {
            processedText = processedText.substring(0, firstLineEnd) + newStatBlock + processedText.substring(firstLineEnd);
         } else {
            processedText = processedText + newStatBlock; // Append if no newline
         }
      }
   }
   
   return processedText;
}

/**
 * Applies 'PDF Filter 4'
 * @param {string} text The raw text.
 * @returns {string} The processed text.
 */
function applyPdfFilter4(text) {
   let processedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

   // 1. Define the regex to find the 12-line malformed block
   // This captures the 6 stat values in groups $1 to $6
   const statBlockRegex = /(?:^\s*STR\s*\n\s*DEX\s*\n\s*CON\s*\n\s*INT\s*\n\s*WIS\s*\n\s*CHA\s*$\n\s*)^\s*(\d+\s*\([+-]?\d+\))\s*\n\s*(\d+\s*\([+-]?\d+\))\s*\n\s*(\d+\s*\([+-]?\d+\))\s*\n\s*(\d+\s*\([+-]?\d+\))\s*\n\s*(\d+\s*\([+-]?\d+\))\s*\n\s*(\d+\s*\([+-]?\d+\))\s*$/gm;

   let newStatBlock = "";

   // 2. Use replace() with a function to find the block, capture its parts, and remove it
   processedText = processedText.replace(statBlockRegex, (match, str, dex, con, intl, wis, cha) => {
      // 3. Store the newly formatted block in an outer variable
      newStatBlock = `STR DEX CON INT WIS CHA\n${str} ${dex} ${con} ${intl} ${wis} ${cha}\n`;
      // 4. Remove the old block by returning an empty string from the replace
      return ""; 
   });

   // 5. If we successfully created a new stat block, insert it
   if (newStatBlock) {
      // Find the 'Speed' line to insert after.
      // We look for a line ending in 'ft.' followed by a newline.
      let speedLineMatch = processedText.match(/^(Speed.*?ft\.)\n/im); // 'i' for case-insensitive, 'm' for ^

      if (speedLineMatch) {
         let speedLine = speedLineMatch[1]; // This is the "Speed 25ft." part
         
         // 6. Reconstruct the text
         // Replace the original "Speed 25ft.\n" with "Speed 25ft.\n[NEW_STAT_BLOCK]"
         processedText = processedText.replace(speedLineMatch[0], `${speedLine}\n${newStatBlock}`);
      } else {
         // Fallback: If 'Speed' line not found (e.g., "Speed 25ft. Skills..."),
         // try to insert it after the Type/Alignment line (line 2).
         console.warn("PDF Filter 4: Could not find 'Speed' line. Inserting after Type/Alignment line.");
         let lines = processedText.split('\n');
         if (lines.length > 2) {
            lines.splice(2, 0, newStatBlock.trim()); // Insert after line 2
            processedText = lines.join('\n');
         } else {
            processedText += newStatBlock; // Append if file is very short
         }
      }
   }
   
   // --- START: New Rules ---

   // Rule 1: Swap Proficiency Bonus and Challenge lines
   processedText = processedText.replace(
      /(Proficiency Bonus\s*[+-]\d+)\s*\n\s*(Challenge\s+[\d\/]+\s*\([\d,]+\s*xp\))/gi,
      '$2 $1'
   );

   // Rule 2: Fix "Exhausted" only in "Condition Immunities" line
   const ciRegex = /(Condition Immunities[^\n]*)Exhausted/i;
   while (ciRegex.test(processedText)) {
       processedText = processedText.replace(ciRegex, '$1Exhaustion');
   }
   
   // --- END: New Rules ---

   // 7. Return the processed (or unprocessed) text
   return processedText;
}

/**
 * Applies 'PDF Filter 5'
 * @param {string} text The raw text.
 * @returns {string} The processed text.
 */
function applyPdfFilter5(text) {
   let processedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

   // 1. Define the regex to find the 7-line malformed block
   // This captures the 6 stat values (all on one line) in groups $1 to $6
   const statBlockRegex = /(?:^\s*STR\s*\n\s*DEX\s*\n\s*CON\s*\n\s*INT\s*\n\s*WIS\s*\n\s*CHA\s*$\n\s*)^\s*(\d+\s*\([+-]?\d+\))\s+(\d+\s*\([+-]?\d+\))\s+(\d+\s*\([+-]?\d+\))\s+(\d+\s*\([+-]?\d+\))\s+(\d+\s*\([+-]?\d+\))\s+(\d+\s*\([+-]?\d+\))\s*$/gm;

   let newStatBlock = "";

   // 2. Use replace() with a function to find the block, capture its parts, and remove it
   processedText = processedText.replace(statBlockRegex, (match, str, dex, con, intl, wis, cha) => {
      // 3. Store the newly formatted block in an outer variable
      newStatBlock = `STR DEX CON INT WIS CHA\n${str} ${dex} ${con} ${intl} ${wis} ${cha}\n`;
      // 4. Remove the old block by returning an empty string from the replace
      return ""; 
   });

   // 5. If we successfully created a new stat block, insert it
   if (newStatBlock) {
      // Find the 'Speed' line to insert after.
      let speedLineMatch = processedText.match(/^(Speed.*?ft\.)\n/im); // 'i' for case-insensitive, 'm' for ^

      if (speedLineMatch) {
         let speedLine = speedLineMatch[1]; // This is the "Speed 25ft." part
         // 6. Reconstruct the text
         processedText = processedText.replace(speedLineMatch[0], `${speedLine}\n${newStatBlock}`);
      } else {
         // Fallback: If 'Speed' line not found
         console.warn("PDF Filter 5: Could not find 'Speed' line. Inserting after Type/Alignment line.");
         let lines = processedText.split('\n');
         if (lines.length > 2) {
            lines.splice(2, 0, newStatBlock.trim()); // Insert after line 2
            processedText = lines.join('\n');
         } else {
            processedText += newStatBlock; // Append if file is very short
         }
      }
   }
   
   // --- START: Copied Rules from Filter 4 ---

   // Rule 1: Swap Proficiency Bonus and Challenge lines
   processedText = processedText.replace(
      /(Proficiency Bonus\s*[+-]\d+)\s*\n\s*(Challenge\s+[\d\/]+\s*\([\d,]+\s*xp\))/gi,
      '$2 $1'
   );

   // Rule 2: Fix "Exhausted" only in "Condition Immunities" line
   const ciRegex = /(Condition Immunities[^\n]*)Exhausted/i;
   while (ciRegex.test(processedText)) {
       processedText = processedText.replace(ciRegex, '$1Exhaustion');
   }
   
   // --- END: Copied Rules ---

   // 7. Return the processed (or unprocessed) text
   return processedText;
}


// Expose filters on the window object
window.filters = {
   applyNoFilter,
   applyPdfFilter1,
   applyPdfFilter2,
   applyPdfFilter3,
   applyPdfFilter4,
   applyPdfFilter5
};