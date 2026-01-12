document.addEventListener("DOMContentLoaded", () => {
    if (Webamp.browserIsSupported()) {
        const webamp = new Webamp({
            initialTracks: [{
                metaData: { artist: "System", title: "Startup_Sound.mp3" },
                url: "https://www.soundjay.com/misc/sounds/wind-chime-1.mp3",
                duration: 5
            }],
            // Let it float!
        });
        
        // Render
        webamp.renderWhenReady(document.getElementById('app'));
        
        // Expose to window so our "Open Player" button works
        window.WebampGlobal = webamp;
    }
});