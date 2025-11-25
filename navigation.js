document.addEventListener('DOMContentLoaded', () => {
    
    // Clean up function for the "Back" button issue
    // This runs whenever the page is shown (including coming back from history)
    window.addEventListener('pageshow', (event) => {
        const overlays = document.querySelectorAll('.nav-fade-overlay');
        const clones = document.querySelectorAll('.nav-logo-clone');
        
        overlays.forEach(el => el.remove());
        clones.forEach(el => el.remove());
    });

    const buttons = document.querySelectorAll('.btn-primary');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetUrl = btn.getAttribute('href');

            // 1. Safety Check: Only run if there is a valid link
            if (!targetUrl || targetUrl === "") {
                e.preventDefault(); 
                return;
            }

            // 2. Stop immediate navigation
            e.preventDefault();

            // 3. Find the associated Logo
            const cardContainer = btn.closest('.mb-8');
            const logoImg = cardContainer.querySelector('img');

            if (!logoImg) {
                window.location.href = targetUrl;
                return;
            }

            // --- START THE ANIMATION ---
            
            // 4. Create the Fade Overlay
            const fadeOverlay = document.createElement('div');
            fadeOverlay.classList.add('nav-fade-overlay'); // Class added for cleanup
            
            Object.assign(fadeOverlay.style, {
                position: 'fixed',
                top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: '#f0f0f0',
                opacity: '0',
                zIndex: '9998',
                transition: 'opacity 1.5s ease-in-out', // 1.5s to match clone
                pointerEvents: 'none' 
            });
            document.body.appendChild(fadeOverlay);

            // 5. Clone the Logo
            const rect = logoImg.getBoundingClientRect();
            const clone = logoImg.cloneNode(true);
            clone.classList.add('nav-logo-clone'); // Class added for cleanup

            // Style the clone to start at CENTER SCREEN, but ORIGINAL SIZE
            Object.assign(clone.style, {
                position: 'fixed',
                top: '50%',        // Center Vertically
                left: '50%',       // Center Horizontally
                transform: 'translate(-50%, -50%)', // Perfect centering alignment
                width: `${rect.width}px`,   // Start at original size (128px)
                height: `${rect.height}px`,
                zIndex: '9999',
                transition: 'all 1.5s ease-in-out', 
                borderRadius: '50%', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            });

            // Note: We removed the opacity line for the original logo as requested previously
            document.body.appendChild(clone);

            // 6. Trigger the Grow (Next Frame)
            requestAnimationFrame(() => {
                // Fade out the background
                fadeOverlay.style.opacity = '1';

                // Scale up to max size (position remains centered via top 50% / translate)
                clone.style.width = '500px';
                clone.style.height = '500px';
            });

            // 7. Navigate after animation
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 1500); 
        });
    });
});