document.addEventListener('DOMContentLoaded', () => {
    
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
            // We look up to the parent card container (.mb-8) and then find the image inside it
            const cardContainer = btn.closest('.mb-8');
            const logoImg = cardContainer.querySelector('img');

            if (!logoImg) {
                window.location.href = targetUrl;
                return;
            }

            // --- START THE ANIMATION ---
            // 4. Create the Fade Overlay
            const fadeOverlay = document.createElement('div');
            Object.assign(fadeOverlay.style, {
                position: 'fixed',
                top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: '#f0f0f0',
                opacity: '0',
                zIndex: '9998',
                transition: 'opacity 1.0s ease-in-out',
                pointerEvents: 'none' // Allow clicks to pass through just in case
            });
            document.body.appendChild(fadeOverlay);

            // 5. Clone the Logo
            const rect = logoImg.getBoundingClientRect();
            const clone = logoImg.cloneNode(true);

            // Style the clone to sit exactly on top of the original
            Object.assign(clone.style, {
                position: 'fixed',
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                zIndex: '9999',
                transition: 'all 1.0s ease-in-out', 
                borderRadius: '50%', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            });

            document.body.appendChild(clone);

            // 6. Trigger the Move (Next Frame)
            requestAnimationFrame(() => {
                // Fade out the background
                fadeOverlay.style.opacity = '1';

                // Move Clone to Center and Scale up
                clone.style.top = '50%';
                clone.style.left = '50%';
                clone.style.transform = 'translate(-50%, -50%)';
                clone.style.width = '500px';
                clone.style.height = '500px';
            });

            // 7. Navigate after animation
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 1000); // 1.5s match
        });
    });
});