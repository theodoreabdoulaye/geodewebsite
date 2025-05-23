
// GEODE Authentication Module
// Manages user registration, login, logout, and session persistence.
// Replaced localStorage user list persistence with simulated asynchronous API calls.
// Added Google Sign-In integration client-side and simulated backend handling.

const AUTH_SESSION_KEY = 'geodeCurrentUserSession'; // Use session storage for current user state
// const USERS_STORAGE_KEY = 'geodeUsersSimulated'; // Removed: Simulated users no longer stored client-side

// Simulate or use real API calls (toggle below)
const USE_SIMULATED_AUTH_API = true; // Set to false to use the real fetch implementation example
// If USE_SIMULATED_AUTH_API is true, the stub implementation below is used.
// If USE_SIMULATED_AUTH_API is false, the commented-out 'Real API Implementation Example' functions are intended to be used.
// Ensure your backend provides the corresponding '/api/...' endpoints if USE_SIMULATED_AUTH_API is false.

async function fetchAuthAPI(endpoint, options = {}) {
    console.warn(`Attempting Auth API endpoint: ${endpoint}`, options);

    if (USE_SIMULATED_AUTH_API) {
        // --- STUB IMPLEMENTATION (DOES NOT USE A REAL DATABASE) ---
        // This stub simulates API responses but does NOT persist data beyond the current session (except for the session state itself).
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        // Simulated Register
        if (endpoint === '/users/register' && options.method === 'POST') {
            const data = JSON.parse(options.body);
            const username = data.username ? data.username.trim() : '';
            const password = data.password || '';
            const role = data.role;

            // Basic server-side like validation
            if (!username) {
                return { ok: false, json: async () => ({ success: false, message: 'Username is required.' }), status: 400 };
            }
            if (username.length < 3) {
                 return { ok: false, json: async () => ({ success: false, message: 'Username must be at least 3 characters long.' }), status: 400 };
            }
             if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                 return { ok: false, json: async () => ({ success: false, message: 'Username can only contain letters, numbers, and underscores.' }), status: 400 };
             }
            if (!password) {
                return { ok: false, json: async () => ({ success: false, message: 'Password is required.' }), status: 400 };
            }
             if (password.length < 6) {
                 return { ok: false, json: async () => ({ success: false, message: 'Password must be at least 6 characters long.' }), status: 400 };
             }
             if (role !== 'user' && role !== 'developer') {
                 return { ok: false, json: async () => ({ success: false, message: 'Invalid role specified.' }), status: 400 };
             }

            // Simulate username conflict check (using the hardcoded testuser)
             if (username.toLowerCase() === 'testuser') {
                 return { ok: false, json: async () => ({ success: false, message: 'Username already exists (Simulated Conflict).' }), status: 409 };
             }

             console.warn("STUB: Registering user:", username, role);
             return { ok: true, json: async () => ({ success: true, message: 'Registration successful (Simulated). Please log in.' }), status: 201 };
        }

        // Simulated Traditional Login
        if (endpoint === '/users/login' && options.method === 'POST') {
             const data = JSON.parse(options.body);
             console.warn("STUB: Attempting login for:", data.username);
             const simulatedUsers = {
                 'user1': { username: 'user1', password: 'password', role: 'user' },
                 'dev1': { username: 'dev1', password: 'password', role: 'developer' },
                'testuser': { username: 'testuser', password: 'password', role: 'user' } // Simulate this user exists after a simulated register
             };
             const user = simulatedUsers[data.username.toLowerCase()];

             if (user && user.password === data.password) {
                const userSession = { username: user.username, role: user.role, token: 'fake-token-' + Math.random().toString(36).substr(2, 9) };
                sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userSession));
                 return { ok: true, json: async () => ({ success: true, user: { username: user.username, role: user.role }, token: userSession.token }), status: 200 };
             }
             return { ok: false, json: async () => ({ success: false, message: 'Invalid username or password (Simulated).' }), status: 401 };
        }

        // Simulated Google Login
        if (endpoint === '/users/login/google' && options.method === 'POST') {
             const data = JSON.parse(options.body);
             const credential = data.credential;
             console.warn("STUB: Attempting Google login with credential:", credential);

             if (!credential) {
                 return { ok: false, json: async () => ({ success: false, message: 'Google credential is required.' }), status: 400 };
             }

             // Simulate backend verification and user creation/lookup
            const simulatedUser = { username: 'google_user_' + Math.random().toString(36).substr(2, 5), role: 'user' }; // Default to user role
            const userSession = { ...simulatedUser, token: 'fake-google-token-' + Math.random().toString(36).substr(2, 9) };
            sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userSession));

            console.warn("STUB: Google login successful. User:", userSession);
             return { ok: true, json: async () => ({ success: true, user: { username: userSession.username, role: userSession.role }, token: userSession.token }), status: 200 };
        }

        // Simulated Logout
        if (endpoint === '/users/logout' && options.method === 'POST') {
            console.warn("STUB: Logging out user.");
            sessionStorage.removeItem(AUTH_SESSION_KEY);
            return { ok: true, json: async () => ({ success: true }), status: 200 };
        }

        // Return a 404 for any other unhandled endpoint in this stub
         console.warn("STUB: Auth API endpoint not implemented:", endpoint, options.method);
         return { ok: false, json: async () => ({ success: false, message: `API endpoint ${endpoint} not implemented in Auth STUB.` }), status: 404 };

    } else {
        // --- REAL API IMPLEMENTATION EXAMPLE (Requires a backend at /api/auth) ---
        const response = await fetch(`/api/auth${endpoint}`, {
            method: options.method,
            headers: {
                'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
                ...options.headers
            },
            body: options.body
        });

        if (!response.ok) {
            let errorData = {};
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                     errorData = await response.json();
                } else {
                     const text = await response.text();
                     errorData.message = text || response.statusText;
                }
            } catch (e) {
                console.warn(`Could not parse error response body for ${endpoint}:`, e);
                errorData.message = `API Error: ${response.status} ${response.statusText}`;
            }
            const error = new Error(errorData.message || `API Error: ${response.status}`);
            error.status = response.status;
            error.response = response;
            error.data = errorData;
            throw error;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
             return response.json();
        } else {
             return {};
        }
        // --- END REAL API IMPLEMENTATION EXAMPLE ---
    }
}


/**
 * Registers a new user.
 * @param {string} username
 * @param {string} password
 * @param {'user'|'developer'} role
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function registerUser(username, password, role) {
    try {
        const result = await fetchAuthAPI('/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        return result; // { success: boolean, message: string }
    } catch (error) {
        console.error("Registration failed:", error.message);
        return { success: false, message: error.message || 'Registration failed due to unexpected error.' };
    }
}

/**
 * Logs in a user with username and password.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: object, message?: string, token?: string}>}
 */
async function loginUser(username, password) {
     try {
        const result = await fetchAuthAPI('/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        // If fetchAuthAPI didn't throw, it means response.ok was true.
        // We expect the backend JSON to contain { success: boolean, ... }
        return result; // { success: boolean, user?: object, message?: string, token?: string }
    } catch (error) {
         console.error("Login failed:", error.message);
         return { success: false, message: error.message || 'Login failed due to unexpected error.' };
    }
}


/**
 * Sends Google credential to the backend for verification and login.
 * @param {string} credential - The Google ID token.
 * @returns {Promise<{success: boolean, user?: object, message?: string, token?: string}>}
 */
async function loginWithGoogle(credential) {
     try {
        const result = await fetchAuthAPI('/users/login/google', { // Use the new Google login endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential })
        });
        // fetchAuthAPI throws on !response.ok. If it didn't throw, it's ok.
        // The stub/real backend should return { success: true, user: ..., token: ... }
        // The caller (index-page.js) checks result.success.
        return result;
     } catch (error) {
         console.error("Google login failed:", error.message);
         return { success: false, message: error.message || 'Google login failed due to unexpected error.' };
     }
}


/**
 * Logs out the current user by clearing client-side session and calling backend API.
 * @returns {Promise<void>}
 */
async function logoutUser() {
     try {
        // A real logout might invalidate a server-side session/token
        await fetchAuthAPI('/users/logout', { method: 'POST' });
     } catch (error) {
         console.error("Logout API Error:", error.message); // Log the specific error message
         // Continue even if API call fails client-side, as clearing local session is critical
     } finally {
         sessionStorage.removeItem(AUTH_SESSION_KEY); // Clear client-side session state
     }
}

function getCurrentUser() {
    const userSession = sessionStorage.getItem(AUTH_SESSION_KEY);
    // In a real app, you might validate a token here or fetch user data based on a session cookie
    return userSession ? JSON.parse(userSession) : null;
}

function isAuthenticated() {
    // In a real app, this might involve checking token expiry or validating with backend
    return getCurrentUser() !== null;
}

// checkAuthAndRedirect remains synchronous for immediate checks on page load.
function checkAuthAndRedirect(requiredRole = null, redirectPath = 'index.html') {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        if (window.location.pathname.endsWith(redirectPath)) {
             // Already on redirect page, prevent infinite loop
             return false;
        }
        console.warn(`Redirecting to ${redirectPath}: User not authenticated.`);
        window.location.href = redirectPath;
        return false;
    }
    if (requiredRole && currentUser.role !== requiredRole) {
         if (window.location.pathname.endsWith(redirectPath)) {
             // Already on redirect page, prevent infinite loop
             return false;
        }
        console.warn(`Redirecting to ${redirectPath}: User role '${currentUser.role}' does not meet required role '${requiredRole}'.`);
        window.location.href = redirectPath; // Or an "access denied" page
        return false;
    }
    return currentUser; // Return user object if authenticated and authorized
}

// Helper to update the header navigation based on user status
// Assumes the header nav has static links/spans with specific IDs
function updateUserNav(navElementId) {
    const navElement = document.getElementById(navElementId);
    if (!navElement) {
        console.error(`Navigation element with ID "${navElementId}" not found.`);
        return;
    }

    const currentUser = getCurrentUser(); // Get the latest user status

    // Get all navigation links/elements by their agreed-upon IDs
    const navHome = document.getElementById('nav-home');
    const navAppStore = document.getElementById('nav-app-store');
    const navDevDashboard = document.getElementById('nav-dev-dashboard');
    const navProfile = document.getElementById('nav-profile');
    const navUsernameDisplay = document.getElementById('nav-username-display');
    const navLoginRegister = document.getElementById('nav-login-register');
    const navLogout = document.getElementById('nav-logout');

    // Ensure all elements exist before trying to modify them
    const elements = [navHome, navAppStore, navDevDashboard, navProfile, navUsernameDisplay, navLoginRegister, navLogout];
    elements.forEach(el => {
        if (el) el.style.display = 'none'; // Hide all by default
    });


    // Logic to show/hide based on authentication status and role
    if (navHome) navHome.style.display = 'inline-block'; // Home is always visible
    if (navAppStore) navAppStore.style.display = 'inline-block'; // App Store is always visible

    if (currentUser) {
        // Logged in state
        if (navUsernameDisplay) {
             navUsernameDisplay.textContent = `Welcome, ${currentUser.username} (${currentUser.role})!`;
             navUsernameDisplay.style.display = 'inline-block';
        }
        if (navProfile) navProfile.style.display = 'inline-block';
        if (navLogout) navLogout.style.display = 'inline-block';

        if (currentUser.role === 'developer') {
            if (navDevDashboard) navDevDashboard.style.display = 'inline-block';
        }

        // Attach logout listener if not already attached (or re-attach if element is dynamic - but we're using static elements now)
        // Let's add the listener here, and make sure it's only added once per element.
        // A simple way for static elements is to add it directly after they are found,
        // but ensure it's not added multiple times if updateUserNav is called repeatedly.
        // Using remove/addEventListener is one way, or a flag.
        if (navLogout && !navLogout.dataset.listenerAttached) { // Check for a custom flag
             navLogout.addEventListener('click', async (e) => {
                 e.preventDefault();
                 await logoutUser();
                 // Determine redirect based on current page
                 const currentPage = window.location.pathname;
                 // Redirect from protected pages or index
                 if (currentPage.includes('developer.html') || currentPage.includes('profile.html') || currentPage.endsWith('index.html') || currentPage.endsWith('/')) {
                      window.location.href = 'index.html'; // Redirect to index
                 } else {
                      // If on a public page like user.html, just reload or update nav
                      window.location.reload(); // Simple reload to update UI
                 }
             });
            navLogout.dataset.listenerAttached = 'true'; // Set flag
        }


    } else {
        // Not logged in state
        if (navLoginRegister) navLoginRegister.style.display = 'inline-block';
        // Username, Profile, Dev Dashboard, Logout are hidden by default or explicitly set to none above
    }
}

// Export functions that might be needed by other scripts
// Note: checkAuthAndRedirect and getCurrentUser are already effectively global
// if auth.js is the first script loaded. Explicit export is cleaner for modules
// but we are in a script tag context. Let's keep them implicitly global for now,
// assuming auth.js is loaded first. If using ES Modules, export would be needed.

// window.registerUser = registerUser; // Make globally available if needed outside
// window.loginUser = loginUser; // Make globally available if needed outside
// window.loginWithGoogle = loginWithGoogle; // Make globally available if needed outside
// window.logoutUser = logoutUser; // Make globally available if needed outside
// window.getCurrentUser = getCurrentUser;
// window.isAuthenticated = isAuthenticated;
// window.checkAuthAndRedirect = checkAuthAndRedirect;
// window.updateUserNav = updateUserNav; // Make globally available


// Ensure updateUserNav is called when the DOM is ready on pages that use it
// The page-specific scripts should call updateUserNav after the DOM is ready
// and they have checked authentication. This prevents needing a DOMContentLoaded
// listener *inside* auth.js itself which might fire before elements exist.

// However, for the index page (login/register), we might want to call it immediately.
// Let's add a small snippet that runs if the main-nav exists when the script loads.
// This handles the initial state before DOMContentLoaded for faster UI update.
// A more robust approach is to always call it from DOMContentLoaded in each page script.

/*
// Optional: Call updateUserNav once immediately if nav exists
const mainNavEarly = document.getElementById('main-nav');
if (mainNavEarly) {
    console.log("Calling updateUserNav immediately.");
    updateUserNav('main-nav');
}
*/

// Better: Rely on page-specific scripts calling updateUserNav on DOMContentLoaded.
// Example: in index-page.js, user-page.js, developer-page.js, profile-page.js:
// document.addEventListener('DOMContentLoaded', () => {
//     // ... auth checks ...
//     updateUserNav('main-nav'); // Pass the nav ID
//     // ... rest of page logic ...
// });

// The checkAuthAndRedirect function is often called *before* DOMContentLoaded
// to prevent rendering protected content. This is a challenge with purely static HTML
// and dynamic JS headers. A flicker might occur. The current pattern in
// page scripts (checkAuthAndRedirect then DOMContentLoaded then updateUserNav)
// means the header might show default/wrong state briefly.
// For this project's scope, this is likely acceptable. The redirection
// happens quickly if not authorized.

// Let's ensure page scripts correctly call updateUserNav('main-nav').
// developer-page.js already calls updateUserNav('developer-nav').
// user-page.js already calls updateUserNav('user-nav').
// profile-page.js already calls updateUserNav('user-nav').
// We need to change these calls to updateUserNav('main-nav')
// and remove their specific nav IDs in HTML, replacing with 'main-nav'.
// This is done in the HTML diffs.

// The logout logic in updateUserNav should handle the redirect correctly
// regardless of the starting page.

    // --- STUB IMPLEMENTATION (DOES NOT USE A REAL DATABASE) ---
    // This stub simulates API responses but does NOT persist data beyond the current session (except for the session state itself).
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    if (endpoint === '/users/register' && options.method === 'POST') {
        const data = JSON.parse(options.body);
        // In a real backend, you'd check for existing username in your database
        // and then save the new user (with a hashed password).
        console.warn("STUB: Registering user:", data.username, data.role);
        // Simulate success for unique username, failure for 'testuser' to show conflict handling
         if (data.username.toLowerCase() === 'testuser') {
             return { ok: false, json: async () => ({ success: false, message: 'Username already exists (Simulated Conflict).' }), status: 409 };
         }
         // Simulate successful registration response
         return { ok: true, json: async () => ({ success: true, message: 'Registration successful (Simulated).' }), status: 201 };

    }

    if (endpoint === '/users/login' && options.method === 'POST') {
         const data = JSON.parse(options.body);
         // In a real backend, you'd check username and verify password hash
        console.warn("STUB: Attempting login for:", data.username);
         // Simulate successful login for a few hardcoded users
        const simulatedUsers = {
             'user1': { username: 'user1', password: 'password', role: 'user' },
             'dev1': { username: 'dev1', password: 'password', role: 'developer' },
            'testuser': { username: 'testuser', password: 'password', role: 'user' } // Simulate this user exists after a simulated register
         };
         const user = simulatedUsers[data.username.toLowerCase()];

         if (user && user.password === data.password) {
            // Simulate generating a token (a real backend would use JWT or similar)
             const userSession = { username: user.username, role: user.role, token: 'fake-token-' + Math.random().toString(36).substr(2, 9) };
            sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userSession)); // Store session state client-side
             return { ok: true, json: async () => ({ success: true, user: { username: user.username, role: user.role }, token: userSession.token }), status: 200 };
         }
         // Simulate login failure
         return { ok: false, json: async () => ({ success: false, message: 'Invalid username or password (Simulated).' }), status: 401 };
    }

    if (endpoint === '/users/logout' && options.method === 'POST') {
        // In a real backend, you might invalidate the token server-side
        console.warn("STUB: Logging out user.");
        sessionStorage.removeItem(AUTH_SESSION_KEY); // Clear client-side session state
        return { ok: true, json: async () => ({ success: true }), status: 200 };
    }

    // Return a 404 for any other unhandled endpoint in this stub
     return { ok: false, json: async () => ({ success: false, message: `API endpoint ${endpoint} not implemented in Auth STUB.` }), status: 404 };
}


async function registerUser(username, password, role) {
     // In a real app, hash password on the backend
    try {
        const response = await fetchFromAPI('/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const data = await response.json();
        return data; // { success: boolean, message: string }
    } catch (error) {
        console.error("Registration API Error (STUB):", error);
        return { success: false, message: 'Registration failed due to network error (STUB).' };
    }
}

async function loginUser(username, password) {
     try {
        const response = await fetchFromAPI('/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        // data.success will be checked by the caller
        return data; // { success: boolean, user?: object, message: string }
    } catch (error) {
         console.error("Login API Error (STUB):", error);
         return { success: false, message: 'Login failed due to network error (STUB).' };
    }
}

async function logoutUser() {
     try {
        // A real logout might invalidate a server-side session/token
        await fetchFromAPI('/users/logout', { method: 'POST' });
     } catch (error) {
         console.error("Logout API Error (STUB):", error);
         // Continue even if API call fails client-side
     } finally {
         sessionStorage.removeItem(AUTH_SESSION_KEY); // Clear client-side session state
     }
}

function getCurrentUser() {
    const userSession = sessionStorage.getItem(AUTH_SESSION_KEY);
    // In a real app, you might validate a token here or fetch user data based on a session cookie
    return userSession ? JSON.parse(userSession) : null;
}

function isAuthenticated() {
    // In a real app, this might involve checking token expiry or validating with backend
    return getCurrentUser() !== null;
}

// This function might still work if getCurrentUser is synchronous,
// but calling code using login/register will need to handle promises.
// checkAuthAndRedirect remains synchronous for immediate checks on page load.
function checkAuthAndRedirect(requiredRole = null, redirectPath = 'index.html') {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        if (window.location.pathname.endsWith(redirectPath)) {
             // Already on redirect page, prevent infinite loop
             return false;
        }
        window.location.href = redirectPath;
        return false;
    }
    if (requiredRole && currentUser.role !== requiredRole) {
         if (window.location.pathname.endsWith(redirectPath)) {
             // Already on redirect page, prevent infinite loop
             return false;
        }
        window.location.href = redirectPath; // Or an "access denied" page
        return false;
    }
    return currentUser; // Return user object if authenticated and authorized
}

// Helper to display username or login/register links in header
// This function relies on getCurrentUser being relatively quick (sync or cached async result)
function updateUserNav(navElementId, currentUser) {
    const navElement = document.getElementById(navElementId);
    if (!navElement) return;

    // Clear existing dynamic content first (only affects #user-nav in user.html)
     if (navElement.id === 'user-nav') {
        navElement.innerHTML = '';
     }


    if (currentUser) {
        let navLinksHtml = `<span id="username-display">Welcome, ${currentUser.username}!</span>`; // Simplified welcome message
        navLinksHtml += `<a href="profile.html"><i class="fas fa-user-circle"></i> My Profile</a>`; // Add link to profile page


        if (currentUser.role === 'developer') {
            // Add Developer Dashboard link if not on developer page
            if (!window.location.pathname.includes('developer.html')) {
                 navLinksHtml += `<a href="developer.html"><i class="fas fa-tools"></i> Developer Dashboard</a>`;
            }
        }
        // Add App Store link if not on user page (App Store is for all users)
        if (!window.location.pathname.includes('user.html')) {
            navLinksHtml += `<a href="user.html"><i class="fas fa-store"></i> App Store</a>`;
        }


        // Add dynamic logout button if we are populating a dynamic nav area (#user-nav)
        // developer.html has a static #logout-btn handled in its own JS
        if (navElement.id === 'user-nav' || navElement.id === 'static-nav-placeholder') { // Added static-nav-placeholder case
             navLinksHtml += `<a href="#" id="logout-btn-dynamic"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
             if (navElement.id === 'user-nav') {
                 navElement.innerHTML = navLinksHtml; // Replace content for dynamic nav
             } else {
                 // For static headers, just ensure username is displayed and handle the dynamic logout link if needed
                 // This part needs refinement if we want to insert dynamic elements into static navs.
                 // A simpler approach for static headers is to rely on their own JS for static buttons.
                 // Let's revert to only modifying dynamic navs or the developer.html static span.
             }
        }


        // Re-attach listener as innerHTML replaced the element
        // Only add listener if the element was actually added dynamically by this function
        if (navElement.id === 'user-nav') {
            navElement.innerHTML = navLinksHtml; // Ensure content is replaced
             // Re-attach listener
             // Re-attach listener as innerHTML replaced the element
             const logoutBtnDynamic = document.getElementById('logout-btn-dynamic');
             if(logoutBtnDynamic) {
                 logoutBtnDynamic.addEventListener('click', async (e) => { // Make async
                     e.preventDefault();
                     await logoutUser(); // Await logout
                     window.location.href = 'index.html';
                 });
             }
        } else {
             // For developer.html's static nav, just ensure the username is displayed
             // and rely on the page script to handle the static #logout-btn
             const usernameSpan = document.getElementById('username-display');
             if (usernameSpan) {
                 usernameSpan.textContent = `Welcome, ${currentUser.username} (${currentUser.role})!`;
             }
            // Note: Static links in developer.html header are not managed by this function's innerHTML replacement
        }


    } else { // Not logged in
         // Similar logic for login/register links, only for #user-nav
        if (navElement.id === 'user-nav') {
             let navLinksHtml = '';
             if (!window.location.pathname.includes('user.html')) {
                navLinksHtml += `<a href="user.html"><i class="fas fa-store"></i> App Store</a>`;
             }
             if (!window.location.pathname.includes('index.html')) {
                // Only show Login/Register link if not already on the index page
                navLinksHtml += `<a href="index.html"><i class="fas fa-sign-in-alt"></i> Login/Register</a>`;
             }
            navElement.innerHTML = navLinksHtml;
        }
        // Developer.html header has static links and won't be updated by this function when logged out
    }
}

             if (user && user.password === data.password) {
                // Simulate generating a token (a real backend would use JWT or similar)
                 const userSession = { username: user.username, role: user.role, token: 'fake-token-' + Math.random().toString(36).substr(2, 9) };
                sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userSession)); // Store session state client-side
                 return { ok: true, json: async () => ({ success: true, user: { username: user.username, role: user.role }, token: userSession.token }), status: 200 };
             }
             // Simulate login failure
             return { ok: false, json: async () => ({ success: false, message: 'Invalid username or password (Simulated).' }), status: 401 };
        }

        if (endpoint === '/users/logout' && options.method === 'POST') {
            // In a real backend, you might invalidate the token server-side
            console.warn("STUB: Logging out user.");
            sessionStorage.removeItem(AUTH_SESSION_KEY); // Clear client-side session state
            return { ok: true, json: async () => ({ success: true }), status: 200 };
        }

        // Return a 404 for any other unhandled endpoint in this stub
         return { ok: false, json: async () => ({ success: false, message: `API endpoint ${endpoint} not implemented in Auth STUB.` }), status: 404 };

    } else {
        // --- REAL API IMPLEMENTATION EXAMPLE (Requires a backend at /api) ---
        const response = await fetch(`/api${endpoint}`, {
            method: options.method,
            headers: {
                'Content-Type': options.body instanceof FormData ? undefined : 'application/json', // Use 'application/json' unless sending FormData
                // Include authorization header if needed:
                // 'Authorization': `Bearer ${getCurrentUser()?.token}` // Note: May not be needed for login/register/logout
                ...options.headers // Allow caller to override
            },
            body: options.body // options.body should be a JSON string or FormData
        });

        if (!response.ok) {
            // Attempt to parse error message from response body
            let errorData = {};
            try {
                 // Check if response has a body and is JSON
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                     errorData = await response.json();
                } else {
                    // If not JSON, try reading as text or just use status text
                     const text = await response.text();
                     errorData.message = text || response.statusText;
                }
            } catch (e) {
                console.warn(`Could not parse error response body for ${endpoint}:`, e);
                errorData.message = `API Error: ${response.status} ${response.statusText}`;
            }

            const error = new Error(errorData.message || `API Error: ${response.status}`);
            error.status = response.status;
            error.response = response; // Keep reference to the response
            error.data = errorData; // Keep parsed data if available
            throw error; // Throw structured error
        }

        // Check if response has a body before parsing JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
             return response.json();
        } else {
             // No JSON body (e.g., successful DELETE with 204 No Content or successful POST returning no body)
             return {}; // Return empty object
        }
        // --- END REAL API IMPLEMENTATION EXAMPLE ---
    }
}


async function registerUser(username, password, role) {
     // In a real app, hash password on the backend
    try {
        const response = await fetchFromAPI('/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const data = await response.json();
        return data; // { success: boolean, message: string } - Expecting this format from API
    } catch (error) {
        console.error("Registration failed:", error.message);
        // Catch the error thrown by fetchAuthAPI and return its message
        return { success: false, message: error.message || 'Registration failed due to unexpected error.' };
    }
}

async function loginUser(username, password) {
     try {
        const result = await fetchAuthAPI('/users/login', { // Using fetchAuthAPI
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        // If fetchAuthAPI did not throw, it means response.ok was true.
        // We still expect the backend JSON to contain { success: boolean, ... }
        // but fetchAuthAPI only checks response.ok, not the JSON body's success flag.
        // So, we return the whole result from fetchAuthAPI.
        // Callers should check result.success and result.user/message.
        // Note: The STUB returns { success: true, user: ..., token: ... } on success
        // and { success: false, message: ... } on simulated failure (which results in !response.ok and is caught).
        // If a real backend *successfully* returned a response (200 OK) but the body indicated a logical failure
        // like { success: false, message: "Account pending activation" }, this current loginUser
        // function would not differentiate it easily from a fetch error.
        // A more robust approach might check `result.success` here too before storing the session,
        // but let's stick to the current pattern where the backend indicates *fetch* success/failure via HTTP status.
        // The STUB's success/failure simulation aligns with this.
        return result; // { success: boolean, user?: object, message?: string, token?: string }
    } catch (error) {
         console.error("Login failed:", error.message);
         // Catch the error thrown by fetchAuthAPI and return its message
         return { success: false, message: error.message || 'Login failed due to unexpected error.' };
    }
}

async function logoutUser() {
     try {
        // A real logout might invalidate a server-side session/token
        await fetchAuthAPI('/users/logout', { method: 'POST' }); // Using fetchAuthAPI
     } catch (error) {
         console.error("Logout API Error:", error.message); // Log the specific error message
         // Continue even if API call fails client-side, as clearing local session is critical
     } finally {
         sessionStorage.removeItem(AUTH_SESSION_KEY); // Clear client-side session state
     }
}

function getCurrentUser() {
    const userSession = sessionStorage.getItem(AUTH_SESSION_KEY);
    // In a real app, you might validate a token here or fetch user data based on a session cookie
    return userSession ? JSON.parse(userSession) : null;
}

function isAuthenticated() {
    // In a real app, this might involve checking token expiry or validating with backend
    return getCurrentUser() !== null;
}

// This function might still work if getCurrentUser is synchronous,
// but calling code using login/register will need to handle promises.
// checkAuthAndRedirect remains synchronous for immediate checks on page load.
function checkAuthAndRedirect(requiredRole = null, redirectPath = 'index.html') {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        if (window.location.pathname.endsWith(redirectPath)) {
             // Already on redirect page, prevent infinite loop
             return false;
        }
        console.warn(`Redirecting to ${redirectPath}: User not authenticated.`);
        window.location.href = redirectPath;
        return false;
    }
    if (requiredRole && currentUser.role !== requiredRole) {
         if (window.location.pathname.endsWith(redirectPath)) {
             // Already on redirect page, prevent infinite loop
             return false;
        }
        console.warn(`Redirecting to ${redirectPath}: User role '${currentUser.role}' does not meet required role '${requiredRole}'.`);
        window.location.href = redirectPath; // Or an "access denied" page
        return false;
    }
    return currentUser; // Return user object if authenticated and authorized
}

// Helper to display username or login/register links in header
// This function relies on getCurrentUser being relatively quick (sync or cached async result)
function updateUserNav(navElementId, currentUser) {
    const navElement = document.getElementById(navElementId);
    if (!navElement) return;

    // Clear existing dynamic content first (only affects #user-nav in user.html)
     if (navElement.id === 'user-nav') {
        navElement.innerHTML = '';
     }


    if (currentUser) {
        // Add profile link (visible for all logged-in users)
        let navLinksHtml = `<span id="username-display">Welcome, ${currentUser.username}!</span>`; // Simplified welcome message
        navLinksHtml += `<a href="profile.html"><i class="fas fa-user-circle"></i> My Profile</a>`; // Add link to profile page


        if (currentUser.role === 'developer') {
            // Add Developer Dashboard link if not on developer page
            if (!window.location.pathname.includes('developer.html')) {
                 navLinksHtml += `<a href="developer.html"><i class="fas fa-tools"></i> Developer Dashboard</a>`;
            }
        }
        // Add App Store link if not on user page (App Store is for all users)
        if (!window.location.pathname.includes('user.html')) {
            navLinksHtml += `<a href="user.html"><i class="fas fa-store"></i> App Store</a>`;
        }


        // Add dynamic logout button if we are populating a dynamic nav area (#user-nav)
        // developer.html has a static #logout-btn handled in its own JS
        // Check if we are specifically targeting the user-nav element or if a placeholder exists
        if (navElement.id === 'user-nav' || document.getElementById('logout-btn-dynamic')) { // Check if dynamic button might already exist
             navLinksHtml += `<a href="#" id="logout-btn-dynamic"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
             if (navElement.id === 'user-nav') {
                 navElement.innerHTML = navLinksHtml; // Replace content for dynamic nav
             } else {
                 // If not user-nav, maybe just update username and ensure a static logout is present?
                 // For developer.html, the username is updated via its own script, and it has a static logout.
                 // Let's simplify: This function primarily updates the user-nav structure dynamically.
                 // Static headers (like developer.html) should manage their parts separately or just use checkAuthAndRedirect/getCurrentUser.
             }
        }


        // Re-attach listener as innerHTML replaced the element
        // Only add listener if the element was actually added dynamically by this function
        if (navElement.id === 'user-nav') {
            navElement.innerHTML = navLinksHtml; // Ensure content is replaced
             // Re-attach listener
             const logoutBtnDynamic = document.getElementById('logout-btn-dynamic');
             if(logoutBtnDynamic) {
                 logoutBtnDynamic.addEventListener('click', async (e) => { // Make async
                     e.preventDefault();
                     await logoutUser(); // Await logout
                     window.location.href = 'index.html';
                 });
             }
        } else {
             // For developer.html's static nav, just ensure the username is displayed
             // and rely on the page script to handle the static #logout-btn
             const usernameSpan = document.getElementById('username-display');
             if (usernameSpan && currentUser) { // Check currentUser again in case this block is somehow reached when not logged in
                 usernameSpan.textContent = `Welcome, ${currentUser.username} (${currentUser.role})!`;
             }
            // Note: Static links in developer.html header are not managed by this function's innerHTML replacement
            // and the static logout button listener is in developer-page.js
        }


    } else { // Not logged in
         // Similar logic for login/register links, only for #user-nav
        if (navElement.id === 'user-nav') {
             let navLinksHtml = '';
             // App Store link is available to everyone
             if (!window.location.pathname.includes('user.html')) {
                navLinksHtml += `<a href="user.html"><i class="fas fa-store"></i> App Store</a>`;
             }
             // Only show Login/Register link if not already on the index page
             if (!window.location.pathname.includes('index.html')) {
                 navLinksHtml += `<a href="index.html"><i class="fas fa-sign-in-alt"></i> Login/Register</a>`;
             }
            navElement.innerHTML = navLinksHtml;
        }
        // Developer.html header has static links and won't be updated by this function when logged out
    }
}


    // --- STUB IMPLEMENTATION (DOES NOT USE A REAL DATABASE) ---
    // This stub simulates API responses but does NOT persist data beyond the current session (except for the session state itself).
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    if (endpoint === '/users/register' && options.method === 'POST') {
        const data = JSON.parse(options.body);
        // In a real backend, you'd check for existing username in your database
        // and then save the new user (with a hashed password).
        console.warn("STUB: Registering user:", data.username, data.role);
        // Simulate success for unique username, failure for 'testuser' to show conflict handling
         if (data.username.toLowerCase() === 'testuser') {
             return { ok: false, json: async () => ({ success: false, message: 'Username already exists (Simulated Conflict).' }), status: 409 };
         }
         // Simulate successful registration response
         return { ok: true, json: async () => ({ success: true, message: 'Registration successful (Simulated).' }), status: 201 };

    }

    if (endpoint === '/users/login' && options.method === 'POST') {
         const data = JSON.parse(options.body);
         // In a real backend, you'd check username and verify password hash
        console.warn("STUB: Attempting login for:", data.username);
         // Simulate successful login for a few hardcoded users
        const simulatedUsers = {
             'user1': { username: 'user1', password: 'password', role: 'user' },
             'dev1': { username: 'dev1', password: 'password', role: 'developer' },
            'testuser': { username: 'testuser', password: 'password', role: 'user' } // Simulate this user exists after a simulated register
         };
         const user = simulatedUsers[data.username.toLowerCase()];

         if (user && user.password === data.password) {
            // Simulate generating a token (a real backend would use JWT or similar)
             const userSession = { username: user.username, role: user.role, token: 'fake-token-' + Math.random().toString(36).substr(2, 9) };
            sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userSession)); // Store session state client-side
             return { ok: true, json: async () => ({ success: true, user: { username: user.username, role: user.role }, token: userSession.token }), status: 200 };
         }
         // Simulate login failure
         return { ok: false, json: async () => ({ success: false, message: 'Invalid username or password (Simulated).' }), status: 401 };
    }

    if (endpoint === '/users/logout' && options.method === 'POST') {
        // In a real backend, you might invalidate the token server-side
        console.warn("STUB: Logging out user.");
        sessionStorage.removeItem(AUTH_SESSION_KEY); // Clear client-side session state
        return { ok: true, json: async () => ({ success: true }), status: 200 };
    }

    // Return a 404 for any other unhandled endpoint in this stub
     return { ok: false, json: async () => ({ success: false, message: `API endpoint ${endpoint} not implemented in Auth STUB.` }), status: 404 };
}


async function registerUser(username, password, role) {
     // In a real app, hash password on the backend
    try {
        const response = await fetchFromAPI('/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const data = await response.json();
        return data; // { success: boolean, message: string }
    } catch (error) {
        console.error("Registration API Error (STUB):", error);
        return { success: false, message: 'Registration failed due to network error (STUB).' };
    }
}

async function loginUser(username, password) {
     try {
        const response = await fetchFromAPI('/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        // data.success will be checked by the caller
        return data; // { success: boolean, user?: object, message: string }
    } catch (error) {
         console.error("Login API Error (STUB):", error);
         return { success: false, message: 'Login failed due to network error (STUB).' };
    }
}

async function logoutUser() {
     try {
        // A real logout might invalidate a server-side session/token
        await fetchFromAPI('/users/logout', { method: 'POST' });
     } catch (error) {
         console.error("Logout API Error (STUB):", error);
         // Continue even if API call fails client-side
     } finally {
         sessionStorage.removeItem(AUTH_SESSION_KEY); // Clear client-side session state
     }
}

function getCurrentUser() {
    const userSession = sessionStorage.getItem(AUTH_SESSION_KEY);
    // In a real app, you might validate a token here or fetch user data based on a session cookie
    return userSession ? JSON.parse(userSession) : null;
}

function isAuthenticated() {
    // In a real app, this might involve checking token expiry or validating with backend
    return getCurrentUser() !== null;
}

// This function might still work if getCurrentUser is synchronous,
// but calling code using login/register will need to handle promises.
// checkAuthAndRedirect remains synchronous for immediate checks on page load.
function checkAuthAndRedirect(requiredRole = null, redirectPath = 'index.html') {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        if (window.location.pathname.endsWith(redirectPath)) {
             // Already on redirect page, prevent infinite loop
             return false;
        }
        window.location.href = redirectPath;
        return false;
    }
    if (requiredRole && currentUser.role !== requiredRole) {
         if (window.location.pathname.endsWith(redirectPath)) {
             // Already on redirect page, prevent infinite loop
             return false;
        }
        window.location.href = redirectPath; // Or an "access denied" page
        return false;
    }
    return currentUser; // Return user object if authenticated and authorized
}

// Helper to display username or login/register links in header
// This function relies on getCurrentUser being relatively quick (sync or cached async result)
function updateUserNav(navElementId, currentUser) {
    const navElement = document.getElementById(navElementId);
    if (!navElement) return;

    // Clear existing dynamic content first (only affects #user-nav in user.html)
     if (navElement.id === 'user-nav') {
        navElement.innerHTML = '';
     }


    if (currentUser) {
        let navLinksHtml = `<span id="username-display">Welcome, ${currentUser.username}!</span>`; // Simplified welcome message
        navLinksHtml += `<a href="profile.html"><i class="fas fa-user-circle"></i> My Profile</a>`; // Add link to profile page


        if (currentUser.role === 'developer') {
            // Add Developer Dashboard link if not on developer page
            if (!window.location.pathname.includes('developer.html')) {
                 navLinksHtml += `<a href="developer.html"><i class="fas fa-tools"></i> Developer Dashboard</a>`;
            }
        }
        // Add App Store link if not on user page (App Store is for all users)
        if (!window.location.pathname.includes('user.html')) {
            navLinksHtml += `<a href="user.html"><i class="fas fa-store"></i> App Store</a>`;
        }


        // Add dynamic logout button if we are populating a dynamic nav area (#user-nav)
        // developer.html has a static #logout-btn handled in its own JS
        if (navElement.id === 'user-nav' || navElement.id === 'static-nav-placeholder') { // Added static-nav-placeholder case
             navLinksHtml += `<a href="#" id="logout-btn-dynamic"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
             if (navElement.id === 'user-nav') {
                 navElement.innerHTML = navLinksHtml; // Replace content for dynamic nav
             } else {
                 // For static headers, just ensure username is displayed and handle the dynamic logout link if needed
                 // This part needs refinement if we want to insert dynamic elements into static navs.
                 // A simpler approach for static headers is to rely on their own JS for static buttons.
                 // Let's revert to only modifying dynamic navs or the developer.html static span.
             }
        }


        // Re-attach listener as innerHTML replaced the element
        // Only add listener if the element was actually added dynamically by this function
        if (navElement.id === 'user-nav') {
            navElement.innerHTML = navLinksHtml; // Ensure content is replaced
             // Re-attach listener
             // Re-attach listener as innerHTML replaced the element
             const logoutBtnDynamic = document.getElementById('logout-btn-dynamic');
             if(logoutBtnDynamic) {
                 logoutBtnDynamic.addEventListener('click', async (e) => { // Make async
                     e.preventDefault();
                     await logoutUser(); // Await logout
                     window.location.href = 'index.html';
                 });
             }
        } else {
             // For developer.html's static nav, just ensure the username is displayed
             // and rely on the page script to handle the static #logout-btn
             const usernameSpan = document.getElementById('username-display');
             if (usernameSpan) {
                 usernameSpan.textContent = `Welcome, ${currentUser.username} (${currentUser.role})!`;
             }
            // Note: Static links in developer.html header are not managed by this function's innerHTML replacement
        }


    } else { // Not logged in
         // Similar logic for login/register links, only for #user-nav
        if (navElement.id === 'user-nav') {
             let navLinksHtml = '';
             if (!window.location.pathname.includes('user.html')) {
                navLinksHtml += `<a href="user.html"><i class="fas fa-store"></i> App Store</a>`;
             }
             if (!window.location.pathname.includes('index.html')) {
                // Only show Login/Register link if not already on the index page
                navLinksHtml += `<a href="index.html"><i class="fas fa-sign-in-alt"></i> Login/Register</a>`;
             }
            navElement.innerHTML = navLinksHtml;
        }
        // Developer.html header has static links and won't be updated by this function when logged out
    }
}
    
