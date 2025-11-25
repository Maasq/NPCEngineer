document.addEventListener('DOMContentLoaded', function() {
    
    // --- CHECK IF WE SHOULD RUN THE INTRO ---
    const today = new Date().toDateString(); // e.g., "Tue Nov 25 2025"
    const lastRunDate = localStorage.getItem('engineerSuiteIntroLastRun');

    if (lastRunDate === today) {
        // We have already run it today. Stop here.
        return; 
    }

    // If we are here, it's a new day (or first visit).
    // Save today's date so we don't run it again today.
    localStorage.setItem('engineerSuiteIntroLastRun', today);

    // --- START INTRO LOGIC ---
    
    const introContainer = document.createElement('div');
    introContainer.id = 'intro-overlay'; 
    
    Object.assign(introContainer.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000', 
        zIndex: '9999', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'opacity 1s ease-out, background-color 6.3s ease-in-out' 
    });

    const svgContainer = document.createElement('div');
    svgContainer.style.width = '100%'; 
    svgContainer.style.height = '100%';
    svgContainer.innerHTML = svgString; 
    
    // 3. Styling for the Animation
    const paths = svgContainer.querySelectorAll('path');
    
    paths.forEach(path => {
        // --- INITIAL COLORS ---
        path.style.stroke = '#9d7a24';
        path.style.strokeWidth = '1px';
        path.style.fill = 'transparent'; 
        
        // Calculate length for the draw effect
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        
        // Transitions:
        path.style.transition = 'stroke-dashoffset 3s ease-in-out, fill 1s ease-in-out 2.5s, stroke 1.5s ease-in-out';
    });

    introContainer.appendChild(svgContainer);
    document.body.appendChild(introContainer);

    // 4. Trigger the Drawing AND Background Fade
    setTimeout(() => {
        introContainer.style.backgroundColor = '#f0f0f0'; 

        paths.forEach(path => {
            path.style.strokeDashoffset = '0'; 
            path.style.fill = '#93793a';       
        });
    }, 100);

    // 5. Trigger the Logo Color Shift (To Faint Gray/Purple)
    setTimeout(() => {
        paths.forEach(path => {
            path.style.transition = 'fill 2.0s ease-in-out, stroke 2.0s ease-in-out';
            path.style.stroke = '#e8e5ec';
            path.style.fill = '#e8e5ec'; 
        });
    }, 4000);

    // 6. Final Fade Out
    setTimeout(() => {
        introContainer.style.opacity = '0';
        
        // Remove from DOM after fade completes
        setTimeout(() => {
            introContainer.remove();
        }, 1000); 
    }, 6300); 
});