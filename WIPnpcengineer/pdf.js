// pdf.js
window.pdfExporter = {
   init() {
      // Attach listener to the button we created earlier
      const pdfBtn = document.getElementById('footer-export-pdf-btn');
      if (pdfBtn) {
         // REMOVED: pdfBtn.disabled = false; -> State is now managed by ui-updates.js
         pdfBtn.addEventListener('click', () => this.generatePdf());
      }
   },

   async generatePdf() {
      if (!window.app.activeNPC) {
         window.app.showAlert("No NPC loaded to export.");
         return;
      }

      const npc = window.app.activeNPC;
      
      // Ensure jsPDF is loaded
      if (!window.jspdf || !window.jspdf.jsPDF) {
          window.app.showAlert("Error: jsPDF library not loaded.");
          return;
      }

      const { jsPDF } = window.jspdf;

      // 1. Create the document (Portrait, Millimeters, A4)
      const doc = new jsPDF({
         orientation: "portrait",
         unit: "mm",
         format: "a4"
      });

      // 2. Settings & Constants
      const margin = 10;
      let cursorY = margin;
      const pageWidth = doc.internal.pageSize.getWidth(); // approx 210mm
      const contentWidth = pageWidth - (margin * 2);

      // 3. Draw Content (Proof of Concept)
      
      // -- Name --
      doc.setFont("helvetica", "bold"); // We will load custom fonts later
      doc.setFontSize(24);
      doc.setTextColor(122, 32, 13); // #7A200D (Your red color)
      doc.text(npc.name.toUpperCase(), margin, cursorY + 8); 
      cursorY += 10;

      // -- Type --
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Black
      
      let typeString = `${npc.size} ${npc.type}`;
      if (npc.species) typeString += ` (${npc.species})`;
      if (npc.alignment) typeString += `, ${npc.alignment}`;
      
      doc.text(typeString, margin, cursorY + 4);
      cursorY += 8;

      // -- Divider Line --
      doc.setDrawColor(186, 78, 59); // #BA4E3B
      doc.setLineWidth(0.5);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 5;

      // -- Armor Class --
      doc.setFont("helvetica", "bold");
      doc.text("Armor Class", margin, cursorY + 4);
      
      doc.setFont("helvetica", "normal");
      const acWidth = doc.getTextWidth("Armor Class ");
      doc.text(String(npc.armorClass), margin + acWidth, cursorY + 4);
      
      // 4. Save
      doc.save(`${npc.name}.pdf`);
   }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
   // Wait a tick to ensure jsPDF is loaded if script is async
   setTimeout(() => {
      if (window.pdfExporter) {
         window.pdfExporter.init();
      }
   }, 100);
});