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
   
   // --- START DEBUG: Append filter name to NPC name ---
   // Replaces the first newline sequence with the appended name and a newline.
   // This correctly handles both \r\n and \n.
   let processedText = text.replace(/(\r\n|\n)/, " PDF Filter 1$1");
   // --- END DEBUG ---

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

   // --- START DEBUG: Append filter name to NPC name ---
   // Replaces the first newline sequence with the appended name and a newline.
   let processedText = text.replace(/(\r\n|\n)/, " PDF Filter 2$1");
   // --- END DEBUG ---

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


// Expose filters on the window object
window.filters = {
   applyNoFilter,
   applyPdfFilter1,
   applyPdfFilter2
};