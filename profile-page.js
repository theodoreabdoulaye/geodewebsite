document.addEventListener('DOMContentLoaded', () => {
    // Ensure user is logged in and get user data
    const currentUser = checkAuthAndRedirect(null, 'index.html'); // null allows any role, redirects to index if not logged in
    if (!currentUser) {
         // If checkAuthAndRedirect returned false, it already handled the redirection.
        // Stop further execution of this script.
        console.log("User not authorized or not logged in. Redirecting handled by checkAuthAndRedirect.");
        return;
    }

    // Update header navigation based on user status and role
    // Use the new main-nav ID
    updateUserNav('main-nav');

    const profileDetailsDiv = document.getElementById('profile-details');

    function displayProfile(user) {
        if (!profileDetailsDiv) return;

        profileDetailsDiv.innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <!-- Add more profile details here if available -->
        `;
    }

    // Display the current user's profile details
    displayProfile(currentUser);

    // Removed static logout button listener as it is now handled by updateUserNav
    // on the #nav-logout element within #main-nav.
});
