
// GEODE Index Page Script
// This file primarily updates the header navigation on load.
// Traditional login/registration and Google Sign-In functionality have been removed from this page.

document.addEventListener('DOMContentLoaded', () => {
    // Update header navigation based on user status and role.
    // This ensures the correct links (Profile, Developer Dashboard, Logout)
    // are shown or hidden based on whether a user is currently logged in
    // via session storage.
    // The 'Accueil' and 'Place de marché' links are always visible and handled by updateUserNav.
    updateUserNav('main-nav');

    // No login/registration forms or Google Sign-In elements are present
    // on this page anymore, so the related JavaScript is removed.
});
    
