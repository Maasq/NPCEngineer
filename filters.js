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


// Expose filters on the window object
window.filters = {
   applyNoFilter,
   applyPdfFilter1,
   applyPdfFilter2,
   applyPdfFilter3
};