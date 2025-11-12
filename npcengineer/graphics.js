// graphics.js

window.graphicsUtils = {
   /**
    * Processes an image file or data URL for resizing and/or conversion.
    *
    * @param {File|string} source The image File object or a data URL string.
    * @param {object} options Options for processing.
    * @param {number} [options.maxWidth] The maximum width to resize to.
    * @param {number} [options.maxHeight] The maximum height to resize to.
    * @param {string} [options.outputFormat] The desired output MIME type (e.g., 'image/webp').
    * @param {number} [options.quality] The quality for 'image/webp' or 'image/jpeg' (0-100).
    * @returns {Promise<string>} A promise that resolves with the processed image as a data URL.
    */
   processImage: function(source, options = {}) {
      return new Promise((resolve, reject) => {
         const img = new Image();
         
         img.onload = () => {
            try {
               let { width, height } = img;
               const { maxWidth, maxHeight, outputFormat, quality = 80 } = options;

               const needsResize = (maxWidth && width > maxWidth) || (maxHeight && height > maxHeight);
               const needsConversion = outputFormat && !img.src.startsWith(`data:${outputFormat}`);

               // If no changes are needed, return the original source
               if (!needsResize && !needsConversion) {
                  resolve(img.src);
                  return;
               }

               // Calculate new dimensions if resizing is needed
               if (needsResize) {
                  // Use Math.min to ensure we only scale down, never up, and respect both constraints
                  const widthRatio = maxWidth ? maxWidth / width : 1;
                  const heightRatio = maxHeight ? maxHeight / height : 1;
                  const ratio = Math.min(widthRatio, heightRatio, 1); // Add '1' to never scale up

                  width = Math.round(width * ratio);
                  height = Math.round(height * ratio);
               }

               // Draw to canvas
               const canvas = document.createElement('canvas');
               canvas.width = width;
               canvas.height = height;
               const ctx = canvas.getContext('2d');
               ctx.drawImage(img, 0, 0, width, height);

               // Determine final format and quality
               const format = outputFormat || (img.src.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');
               const q = Math.max(0.1, Math.min(1.0, quality / 100)); // Clamp quality 0.1-1.0

               // Get the new data URL
               const newDataUrl = canvas.toDataURL(format, q);
               resolve(newDataUrl);

            } catch (error) {
               console.error("Error during image processing:", error);
               reject(error);
            }
         };

         img.onerror = () => {
            reject(new Error("Failed to load image for processing."));
         };

         // Load the image source
         if (typeof source === 'string') {
            // It's already a data URL
            img.src = source;
         } else if (source instanceof File) {
            // It's a File, use FileReader
            const reader = new FileReader();
            reader.onload = (e) => {
               img.src = e.target.result;
            };
            reader.onerror = () => {
               reject(new Error("Failed to read image file."));
            };
            reader.readAsDataURL(source);
         } else {
            reject(new Error("Invalid image source type. Must be a File or data URL."));
         }
      });
   }
};