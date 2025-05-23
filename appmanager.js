
// GEODE App Management Module
// Handles CRUD operations for applications via simulated backend API calls.

// Simulate or use real API calls (toggle below)
// Note: The flag is defined in auth.js. Assuming auth.js is loaded first.
// const USE_SIMULATED_AUTH_API = true; // Already defined in auth.js


// --- Simulated Backend API Stub (Does NOT persist data) ---
// In a real application, this would be server-side code interacting with a database.

// GEODE App Management Module
// Handles CRUD operations for applications via simulated backend API calls.

// Simulate or use real API calls (toggle below)
// Note: The flag is defined in auth.js. Assuming auth.js is loaded first.
// const USE_SIMULATED_AUTH_API = true; // Already defined in auth.js

// --- Simulated Backend API Stub (Does NOT persist data) ---
// In a real application, this would be server-side code interacting with a database.

const SIMULATED_APPS_DB = []; // In-memory storage for simulated apps
let nextAppId = 1;

async function fetchAppsAPI(endpoint, options = {}) {
    console.warn(`Attempting Apps API endpoint: ${endpoint}`, options);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const currentUser = getCurrentUser(); // Get current user from auth.js (simulated or real session)

    // Simulate Authorization Check (simple presence check)
    // Note: Real backend auth would be more robust (token validation, permissions)
    // Endpoints allowed without authentication: GET /apps and GET /apps/{id}
    const allowedUnauthenticatedEndpoints = ['/apps', '/apps/'];
    const isGettingSingleApp = endpoint.startsWith('/apps/') && endpoint.split('/').length === 3 && options.method === 'GET';

    if (!currentUser && !allowedUnauthenticatedEndpoints.includes(endpoint) && !isGettingSingleApp) {
         // For other endpoints (like developer-specific ones or add/edit/delete), require auth
         console.error("STUB: Unauthorized access - No user logged in.");
         return { ok: false, json: async () => ({ success: false, message: 'Unauthorized: User not logged in (Simulated).' }), status: 401 };
    }


    // --- STUB IMPLEMENTATION ---

    // GET /apps (Get all apps)
    if (endpoint === '/apps' && options.method === 'GET') {
        console.warn("STUB: Fetching all apps.");
        // Simulate successful response
        return { ok: true, json: async () => SIMULATED_APPS_DB, status: 200 };
    }

    // POST /apps (Add new app)
    if (endpoint === '/apps' && options.method === 'POST') {
        // In a real backend, this would handle file uploads and database insertion.
        // Here, we simulate processing the form data and adding to in-memory list.
        const data = options.body instanceof FormData ? Object.fromEntries(options.body.entries()) : JSON.parse(options.body);
        console.warn("STUB: Adding app:", data.name, "by", currentUser?.username);

        // Simulate backend validation for new app
         const validationErrors = [];
         if (!data.name || data.name.trim() === '') validationErrors.push('App Name is required.');
         if (!data.description || data.description.trim() === '') validationErrors.push('Description is required.');
         if (!data.price || data.price.trim() === '') validationErrors.push('Price is required.');
         if (data.apkLink && !isValidUrl(data.apkLink.trim())) validationErrors.push('Invalid URL for APK link.');
         if (data.iosLink && !isValidUrl(data.iosLink.trim())) validationErrors.push('Invalid URL for iOS link.');
        // Simulate file validation (though file is not processed)
        const logoFile = data.logoFile; // This will be a File object if FormData was used
        if (logoFile && typeof logoFile === 'object' && logoFile.size > 0) { // Check if a file object exists and has size
            const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // Match client-side constant
            const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Match client-side constant
             if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
                 validationErrors.push('Invalid logo file type. Please upload a JPG, PNG, GIF, or WEBP image.');
             }
             if (logoFile.size > MAX_LOGO_SIZE_BYTES) {
                 validationErrors.push(`Logo file size exceeds limit (${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB).`);
             }
         }


         if (validationErrors.length > 0) {
             return { ok: false, json: async () => ({ success: false, message: 'Validation failed: ' + validationErrors.join(' ') }), status: 400 };
         }


        // Simulate successful add
        const newApp = {
            id: nextAppId++, // Assign simulated ID
            developer: currentUser.username, // Assign logged-in user as developer
            name: data.name.trim(),
            description: data.description.trim(),
            price: data.price.trim(),
            platform: data.platform || 'Both', // Default platform
            apkLink: data.apkLink ? data.apkLink.trim() : '',
            iosLink: data.iosLink ? data.iosLink.trim() : '',
             // Simulate logo URL (in a real app, this would be the URL to the uploaded file)
             // If a file was uploaded, we could simulate a URL based on the filename,
             // otherwise use the logo string if present (e.g., existing URL during edit sent as JSON)
            logo: logoFile ? `/uploads/logos/${logoFile.name}` : (data.logo || '') // Simulate URL based on filename or use provided logo string
        };
        SIMULATED_APPS_DB.push(newApp);
        console.warn("STUB: App added:", newApp);

        return { ok: true, json: async () => ({ success: true, message: 'App added successfully (Simulated).', app: newApp }), status: 201 };
    }

    // PUT /apps/{id} (Update app)
    if (endpoint.startsWith('/apps/') && options.method === 'PUT') {
        const appId = parseInt(endpoint.split('/')[2], 10); // Extract ID from URL
        const appIndex = SIMULATED_APPS_DB.findIndex(app => app.id === appId);

        if (appIndex === -1) {
            console.warn("STUB: App not found for update:", appId);
            return { ok: false, json: async () => ({ success: false, message: 'App not found (Simulated).' }), status: 404 };
        }

        const existingApp = SIMULATED_APPS_DB[appIndex];

        // Simulate ownership check
        if (existingApp.developer !== currentUser?.username) {
             console.error("STUB: Unauthorized update attempt:", currentUser?.username, "trying to edit app", appId);
             return { ok: false, json: async () => ({ success: false, message: 'Unauthorized: You do not own this app (Simulated).' }), status: 403 };
        }


        // Get updated data (could be JSON or FormData)
        const updatedData = options.body instanceof FormData ? Object.fromEntries(options.body.entries()) : JSON.parse(options.body);
        console.warn("STUB: Updating app:", appId, "with data:", updatedData);

         // Simulate backend validation for update
         const validationErrors = [];
         if (!updatedData.name || updatedData.name.trim() === '') validationErrors.push('App Name is required.');
         if (!updatedData.description || updatedData.description.trim() === '') validationErrors.push('Description is required.');
         if (!updatedData.price || updatedData.price.trim() === '') validationErrors.push('Price is required.');
         if (updatedData.apkLink && !isValidUrl(updatedData.apkLink.trim())) validationErrors.push('Invalid URL for APK link.');
         if (updatedData.iosLink && !isValidUrl(updatedData.iosLink.trim())) validationErrors.push('Invalid URL for iOS link.');

        // Simulate file validation for the NEW logo file input (if FormData was used)
        const logoFile = updatedData.logoFile; // This will be a File object if FormData was used
        if (logoFile && typeof logoFile === 'object' && logoFile.size > 0) { // Check if a file object exists and has size
            const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // Match client-side constant
            const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Match client-side constant
             if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
                 validationErrors.push('Invalid logo file type. Please upload a JPG, PNG, GIF, or WEBP image.');
             }
             if (logoFile.size > MAX_LOGO_SIZE_BYTES) {
                 validationErrors.push(`Logo file size exceeds limit (${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB).`);
             }
         }

         if (validationErrors.length > 0) {
             return { ok: false, json: async () => ({ success: false, message: 'Validation failed: ' + validationErrors.join(' ') }), status: 400 };
         }


        // Simulate updating the app data
        // Note: This doesn't handle file replacement properly in the stub.
        // If logoFile exists, we simulate a new URL. If not, we keep the old one
        // unless a 'logo' string was sent (e.g., clearing the logo).
        const newLogoUrl = logoFile ? `/uploads/logos/${logoFile.name}` : (updatedData.logo === '' ? '' : existingApp.logo); // If logo is explicitly set to empty, clear it. Otherwise, keep old if no new file.

        const updatedApp = {
            ...existingApp, // Keep original ID and developer
            name: updatedData.name.trim(),
            description: updatedData.description.trim(),
            price: updatedData.price.trim(),
            platform: updatedData.platform || existingApp.platform,
            apkLink: updatedData.apkLink ? updatedData.apkLink.trim() : '',
            iosLink: updatedData.iosLink ? updatedData.iosLink.trim() : '',
            logo: newLogoUrl
        };

         // Update in the simulated DB
        SIMULATED_APPS_DB[appIndex] = updatedApp;
        console.warn("STUB: App updated:", updatedApp);

        return { ok: true, json: async () => ({ success: true, message: 'App updated successfully (Simulated).', app: updatedApp }), status: 200 };
    }

    // DELETE /apps/{id} (Delete app)
    if (endpoint.startsWith('/apps/') && options.method === 'DELETE') {
        const appId = parseInt(endpoint.split('/')[2], 10); // Extract ID from URL
        const appIndex = SIMULATED_APPS_DB.findIndex(app => app.id === appId);

        if (appIndex === -1) {
            console.warn("STUB: App not found for deletion:", appId);
            return { ok: false, json: async () => ({ success: false, message: 'App not found (Simulated).' }), status: 404 };
        }

        const appToDelete = SIMULATED_APPS_DB[appIndex];

        // Simulate ownership check
        if (appToDelete.developer !== currentUser?.username) {
             console.error("STUB: Unauthorized deletion attempt:", currentUser?.username, "trying to delete app", appId);
             return { ok: false, json: async () => ({ success: false, message: 'Unauthorized: You do not own this app (Simulated).' }), status: 403 };
        }

        // Simulate deletion
        SIMULATED_APPS_DB.splice(appIndex, 1);
        console.warn("STUB: App deleted:", appId);

        // Simulate successful deletion response (often 204 No Content, or 200 with a message)
        return { ok: true, json: async () => ({ success: true, message: 'App deleted successfully (Simulated).' }), status: 200 }; // Using 200 with message for simplicity

    }

     // GET /apps/{id} (Get app by ID)
     if (endpoint.startsWith('/apps/') && options.method === 'GET') {
         const appId = parseInt(endpoint.split('/')[2], 10); // Extract ID from URL
         console.warn("STUB: Fetching app by ID:", appId);
         const app = SIMULATED_APPS_DB.find(app => app.id === appId);

         if (!app) {
             console.warn("STUB: App not found by ID:", appId);
             return { ok: false, json: async () => ({ success: false, message: 'App not found (Simulated).' }), status: 404 };
         }

         return { ok: true, json: async () => app, status: 200 };
     }

     // GET /developers/{username}/apps (Get apps by developer)
     if (endpoint.startsWith('/developers/') && endpoint.endsWith('/apps') && options.method === 'GET') {
         const parts = endpoint.split('/');
         const developerUsername = parts[2]; // Extract username from URL
         console.warn("STUB: Fetching apps for developer:", developerUsername);

         // Simulate filtering apps by developer username
         const developerApps = SIMULATED_APPS_DB.filter(app => app.developer === developerUsername);

         return { ok: true, json: async () => developerApps, status: 200 };
     }


    // Return a 404 for any other unhandled endpoint in this stub
     console.warn("STUB: Apps API endpoint not implemented:", endpoint, options.method);
     return { ok: false, json: async () => ({ success: false, message: `API endpoint ${endpoint} not implemented in Apps STUB.` }), status: 404 };

}

// Basic URL validation helper (can be shared or moved to uiHelpers)
function isValidUrl(string) {
    if (!string) return true; // Allow empty string
    try {
        new URL(string);
        return true;
    } catch (e) {
        return false;
    }
}


// --- Asynchronous Functions Interacting with the Simulated API ---
// These functions wrap the fetchAppsAPI stub calls and provide clearer interfaces.

async function getApps() {
    try {
        // fetchAppsAPI returns { ok, json(), status } or throws an error
        const response = await fetchAppsAPI('/apps', { method: 'GET' });
        // If response.ok is true, fetchAppsAPI doesn't throw. Parse JSON.
        const apps = await response.json();
        return apps; // Returns array of apps from the stub's static data
    } catch (error) {
        console.error("Failed to fetch apps (STUB):", error.message);
        // Catch error thrown by fetchAppsAPI and return empty array
        return [];
    }
}

async function addApp(appData) {
    // Check if user is authenticated and is a developer (redundant if backend enforces, but good client-side check)
    // fetchAppsAPI handles unauthorized access simulation
    // Client-side validation should also happen before calling this.

    try {
        // Send data to the simulated API
        // appData might contain a File object for logoFile, so use FormData
        const formData = new FormData();
        for (const key in appData) {
            // Append all key-value pairs, including the File object if present
            formData.append(key, appData[key]);
        }

        // fetchAppsAPI expects the body to be either JSON string or FormData
        const result = await fetchAppsAPI('/apps', {
            method: 'POST',
            body: formData // Use FormData for file uploads (simulated)
        });
        // If fetchAppsAPI didn't throw, it was response.ok.
        // The STUB's POST /apps returns { success, message, app? }
        const data = await result.json();
        return data; // { success: boolean, app?: object, message: string }
    } catch (error) {
        console.error("Add app failed (STUB):", error.message);
        // Catch the error thrown by fetchAppsAPI and return its message
        return { success: false, message: error.message || 'Failed to add app (STUB).' };
    }
}

async function updateApp(appId, updatedData) {
    // Check if user is authenticated (backend should verify ownership - STUB simulates this)
    // Client-side validation should also happen before calling this.

     try {
         // Send data to the simulated API
         // updatedData might contain a File object for logoFile, so use FormData
         const formData = new FormData();
         for (const key in updatedData) {
             formData.append(key, updatedData[key]);
         }

        const result = await fetchAppsAPI(`/apps/${appId}`, {
            method: 'PUT',
             body: formData // Use FormData for file uploads (simulated)
        });
         // If fetchAppsAPI didn't throw, it was response.ok.
         // The STUB's PUT /apps/{id} returns { success, message, app? }
         const data = await result.json();
        return data; // { success: boolean, app?: object, message: string }
     } catch (error) {
         console.error("Update app failed (STUB):", error.message);
          // Catch the error thrown by fetchAppsAPI and return its message
         return { success: false, message: error.message || 'Failed to update app (STUB).' };
     }
}

async function deleteApp(appId) {
    // Check if user is authenticated (backend should verify ownership - STUB simulates this)
    // Client-side confirmation should happen before calling this.

     try {
         // DELETE requests usually don't have bodies
         const result = await fetchAppsAPI(`/apps/${appId}`, {
             method: 'DELETE'
         });
         // If fetchAppsAPI didn't throw, it was response.ok.
         // The STUB's DELETE /apps/{id} returns { success, message }
         const data = await result.json();
         return data; // { success: boolean, message: string }
     } catch (error) {
         console.error("Delete app failed (STUB):", error.message);
          // Catch the error thrown by fetchAppsAPI and return its message
         return { success: false, message: error.message || 'Failed to delete app (STUB).' };
     }
}

async function getAppById(appId) {
     try {
         const response = await fetchAppsAPI(`/apps/${appId}`, { method: 'GET' });
          // If response.ok, parse JSON
         const app = await response.json();
         return app; // Returns app object
     } catch (error) {
         console.error(`Failed to fetch app by ID ${appId} (STUB):`, error.message);
          // Catch the error thrown by fetchAppsAPI. If 404, return undefined. Re-throw others?
          if (error.status === 404) {
              return undefined; // Indicate app not found
          }
         // Or simply return undefined for any error for simplicity in the stub
         return undefined;
     }
}

async function getAppsByDeveloper(developerUsername) {
     // Check if user is authenticated (should be done on developer page load)
     // fetchAppsAPI handles unauthorized access simulation

     try {
         // Assuming the backend endpoint is something like /api/developers/{username}/apps
         const response = await fetchAppsAPI(`/developers/${developerUsername}/apps`, { method: 'GET' });
         // If response.ok, parse JSON
         const apps = await response.json();
         return apps; // Returns array of apps from the stub's static data, filtered
     } catch (error) {
         console.error(`Failed to fetch apps for developer ${developerUsername} (STUB):`, error.message);
         // Catch the error thrown by fetchAppsAPI and return empty array
         return [];
     }
}

// getAllApps function is now just an alias for the new async getApps
async function getAllApps() {
    return getApps();
}


// --- Example Simulation: Pre-populating the STUB DB ---
// This simulates some existing data if the STUB is used.
if (typeof USE_SIMULATED_AUTH_API !== 'undefined' && USE_SIMULATED_AUTH_API) {
     SIMULATED_APPS_DB.push({
         id: nextAppId++,
         developer: 'dev1',
         name: 'GEODE Miner',
         description: 'A simple game where you mine precious GEODEs.',
         price: 'Free',
         platform: 'Android',
         apkLink: '#', // Simulate a link
         iosLink: '',
         logo: 'https://via.placeholder.com/150/00BCD4/FFFFFF?text=GM' // Simulate a logo URL
     });
      SIMULATED_APPS_DB.push({
         id: nextAppId++,
         developer: 'dev1',
         name: 'GEODE Chat',
         description: 'Secure messaging for the GEODE community.',
         price: '$2.99',
         platform: 'iOS',
         apkLink: '',
         iosLink: '#', // Simulate a link
         logo: 'https://via.placeholder.com/150/FF9800/FFFFFF?text=GC' // Simulate a logo URL
     });
     SIMULATED_APPS_DB.push({
         id: nextAppId++,
         developer: 'dev1',
         name: 'GEODE Wallet',
         description: 'Manage your GEODE coins securely.',
         price: 'Free',
         platform: 'Both',
         apkLink: '#', // Simulate a link
         iosLink: '#', // Simulate a link
         logo: 'https://via.placeholder.com/150/1A237E/FFFFFF?text=GW' // Simulate a logo URL
     });
     SIMULATED_APPS_DB.push({
         id: nextAppId++,
         developer: 'dev1',
         name: 'Another Dev1 App',
         description: 'Just another app.',
         price: '$0.99',
         platform: 'Android',
         apkLink: '#',
         iosLink: '',
         logo: '' // Simulate no logo
     });
      SIMULATED_APPS_DB.push({
         id: nextAppId++,
         developer: 'anotherdev', // Simulate another developer
         name: 'Simple App',
         description: 'A very simple app.',
         price: 'Free',
         platform: 'iOS',
         apkLink: '',
         iosLink: '#',
         logo: 'https://via.placeholder.com/150/757575/FFFFFF?text=SA'
     });

    console.warn(`STUB: Pre-populated SIMULATED_APPS_DB with ${SIMULATED_APPS_DB.length} apps.`);
}


// --- Real API Implementation Example (Requires a backend) ---
// Commented out the stub functions above and uncommented these if USE_SIMULATED_AUTH_API is false.
/*
async function fetchAppsAPI(endpoint, options = {}) {
    const currentUser = getCurrentUser(); // Get current user from auth.js
    const headers = {
        ...options.headers, // Allow caller to override headers
        'Content-Type': options.body instanceof FormData ? undefined : 'application/json', // Use 'application/json' unless sending FormData
    };

    // Add Authorization header if user is logged in and has a token
    if (currentUser && currentUser.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
    } else if (endpoint !== '/apps' && !endpoint.startsWith('/apps/')) { // Allow fetching /apps without auth
        // For other endpoints (like developer-specific ones or add/edit/delete),
        // redirection should have already happened if not logged in.
        // Add a check here just in case.
        console.error("Attempted to access protected app endpoint without being logged in.");
        // In a real app, the backend would enforce this, but client-side check is good.
        // Consider redirecting or showing an error message here if needed.
        // For now, just let fetch proceed, the backend will likely return 401/403.
    }


    try {
        const response = await fetch(`/api${endpoint}`, {
            method: options.method,
            headers: headers,
            body: options.body
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
                console.warn("Could not parse error response body:", e);
                errorData.message = `API Error: ${response.status} ${response.statusText}`;
            }

            const error = new Error(errorData.message || `API Error: ${response.status}`);
            error.status = response.status;
            error.response = response; // Keep reference to the response
            error.data = errorData; // Keep parsed data if available
            throw error;
        }

        // Check if response has a body before parsing JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
             return response.json();
        } else {
             // No JSON body (e.g., successful DELETE with 204 No Content)
             return {}; // Return empty object
        }


    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        // Re-throw the enhanced error object
        throw error;
    }
}


// --- Asynchronous Functions Interacting with the Real API ---

async function getApps() {
    try {
        const apps = await fetchAppsAPI('/apps', { method: 'GET' });
        return apps; // Returns array of apps from backend
    } catch (error) {
        console.error("Failed to fetch apps:", error.message);
        // Specific error handling could be added here if needed, e.g., redirect on 401
        return []; // Return empty array on error
    }
}

async function addApp(appData) {
    // Check if user is authenticated and is a developer (redundant if backend enforces, but good client-side check)
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'developer') {
        console.error("Unauthorized client-side: Only developers can add apps.");
        return { success: false, message: "Unauthorized: Only developers can add apps." };
    }

    // Prepare data for API call
    // If appData includes a File object (for logo), use FormData
    // Otherwise, use JSON
    let body;
    let headers = {}; // Use default headers handled by fetchAppsAPI unless special ones are needed

    if (appData.logo instanceof File) {
        // Create FormData for file upload + other fields
        const formData = new FormData();
        formData.append('name', appData.name);
        formData.append('description', appData.description);
        formData.append('price', appData.price);
        formData.append('platform', appData.platform);
        formData.append('apkLink', appData.apkLink);
        formData.append('iosLink', appData.iosLink);
        formData.append('logoFile', appData.logo); // Append the File object
        formData.append('developer', currentUser.username); // Add developer username
        body = formData;
        // Note: Do NOT manually set 'Content-Type' to 'multipart/form-data' with FormData,
        // the browser sets it automatically with the correct boundary.
        // fetchAppsAPI handles this by checking body type.
    } else {
        // If no file, send as JSON (assuming logo is a URL or empty)
        body = JSON.stringify({
             ...appData,
             developer: currentUser.username,
             // If appData.logo is empty string or URL, send it.
             // If it was a File and now isn't, this handles the case where
             // a new file wasn't selected during edit.
             logo: appData.logo || ''
        });
        // 'Content-Type': 'application/json' is handled by fetchAppsAPI
    }


    try {
        const result = await fetchAppsAPI('/apps', {
            method: 'POST',
            body: body
        });
        // The API should return { success: boolean, app?: object, message: string }
        return { success: true, ...result };
    } catch (error) {
        console.error("Add app failed:", error.message);
        return { success: false, message: error.message || 'Failed to add app.' };
    }
}

async function updateApp(appId, updatedData) {
    // Check if user is authenticated (backend should verify ownership)
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error("Unauthorized client-side: No user logged in for update.");
        return { success: false, message: "Unauthorized: No user logged in." };
    }

    // Prepare data for API call - similar logic to addApp
    let body;
    let headers = {};

     if (updatedData.logo instanceof File) {
         // Create FormData for file upload + other fields
         const formData = new FormData();
         formData.append('name', updatedData.name);
         formData.append('description', updatedData.description);
         formData.append('price', updatedData.price);
         formData.append('platform', updatedData.platform);
         formData.append('apkLink', updatedData.apkLink);
         formData.append('iosLink', updatedData.iosLink);
         formData.append('logoFile', updatedData.logo); // Append the NEW File object
         // When sending FormData for PUT, usually you identify the resource in the URL
         // and send the fields to update. The backend processes the file and updates the record.
         body = formData;
     } else {
         // If no new file selected, send as JSON
         body = JSON.stringify({
              ...updatedData,
              // Include logo field from updatedData - could be the old URL or empty string
              logo: updatedData.logo || ''
         });
     }

    try {
        const result = await fetchAppsAPI(`/apps/${appId}`, {
            method: 'PUT',
            body: body
        });
        // The API should return { success: boolean, app?: object, message: string }
         return { success: true, ...result };
     } catch (error) {
        console.error("Update app failed:", error.message);
         return { success: false, message: error.message || 'Failed to update app.' };
     }
}

async function deleteApp(appId) {
    // Check if user is authenticated (backend should verify ownership)
     const currentUser = getCurrentUser();
     if (!currentUser) {
         console.error("Unauthorized client-side: No user logged in for delete.");
         return { success: false, message: "Unauthorized: No user logged in." };
     }

     try {
         // DELETE requests usually don't have bodies
         await fetchAppsAPI(`/apps/${appId}`, {
             method: 'DELETE'
         });
         // If the API returns 200/204 on success, the response.ok check passes.
         // If it returns a JSON success message, that's fine too.
         // Assume success if fetchAppsAPI doesn't throw an error.
         return { success: true, message: 'App deleted successfully.' };
     } catch (error) {
         console.error("Delete app failed:", error.message);
         return { success: false, message: error.message || 'Failed to delete app.' };
     }
}

async function getAppById(appId) {
     try {
         const app = await fetchAppsAPI(`/apps/${appId}`, { method: 'GET' });
         return app; // Returns app object from backend
     } catch (error) {
         console.error(`Failed to fetch app by ID ${appId}:`, error.message);
         // Specific handling for 404 could return null/undefined vs throw
         if (error.status === 404) {
             return undefined; // Indicate app not found
         }
         throw error; // Re-throw other errors
     }
}

async function getAppsByDeveloper(developerUsername) {
     // Check if user is authenticated (should be done on developer page load)
     const currentUser = getCurrentUser();
     if (!currentUser) {
         console.error("Unauthorized client-side: No user logged in to fetch developer apps.");
         return []; // Return empty array if not logged in
     }

     try {
         // Assuming the backend endpoint is something like /api/developers/{username}/apps
         const apps = await fetchAppsAPI(`/developers/${developerUsername}/apps`, { method: 'GET' });
         return apps; // Returns array of apps from backend
     } catch (error) {
         console.error(`Failed to fetch apps for developer ${developerUsername}:`, error.message);
         return []; // Return empty array on error
     }
}

// getAllApps function alias remains for clarity if needed elsewhere
async function getAllApps() {
    return getApps();
}
*/
// --- END Real API Implementation Example ---


// --- Asynchronous Functions Interacting with the Simulated API ---
// These functions wrap the fetchAppsAPI stub calls and provide clearer interfaces.

async function getApps() {
    try {
        const response = await fetchAppsAPI('/apps', { method: 'GET' });
        if (!response.ok) { // fetchAppsAPI only throws if response.ok is false
             // If fetchAppsAPI didn't throw but returned !ok, this case is caught
             const errorData = await response.json(); // Attempt to get message from body
             throw new Error(errorData.message || 'Failed to fetch apps from stub API');
        }
        const apps = await response.json();
        return apps; // Returns array of apps from the stub's static data
    } catch (error) {
        console.error("Failed to fetch apps (STUB):", error.message);
        return []; // Return empty array on error
    }
}

async function addApp(appData) {
    // Check if user is authenticated and is a developer (redundant if backend enforces, but good client-side check)
    // fetchAppsAPI handles unauthorized access simulation

    try {
        // Send data to the simulated API
        // appData might contain a File object for logoFile, so use FormData
        const formData = new FormData();
        for (const key in appData) {
            // Append all key-value pairs, including the File object if present
            // Ensure non-string values (like File) are handled correctly by FormData
             if (appData[key] !== null && appData[key] !== undefined) {
                formData.append(key, appData[key]);
             }
        }


        // fetchAppsAPI expects the body to be either JSON string or FormData
        const result = await fetchAppsAPI('/apps', {
            method: 'POST',
            body: formData // Use FormData for file uploads (simulated)
        });
        // If fetchAppsAPI didn't throw, it was response.ok.
        // The STUB's POST /apps returns { success, message, app? }
         if (!result.ok) { // Check success from stub response's perspective
            const errorData = await result.json();
            throw new Error(errorData.message || 'Add app failed (STUB).');
         }
        const data = await result.json();
        return data; // { success: boolean, app?: object, message: string }
    } catch (error) {
        console.error("Add app failed (STUB):", error.message);
        // Catch the error thrown by fetchAppsAPI and return its message
        return { success: false, message: error.message || 'Failed to add app (STUB).' };
    }
}

async function updateApp(appId, updatedData) {
    // Check if user is authenticated (backend should verify ownership - STUB simulates this)
    // Client-side validation should also happen before calling this.

     try {
         // Send data to the simulated API
         // updatedData might contain a File object for logoFile, so use FormData
         const formData = new FormData();
         for (const key in updatedData) {
             // Append all key-value pairs, including the File object if present
             if (updatedData[key] !== null && updatedData[key] !== undefined) {
                formData.append(key, updatedData[key]);
             }
         }


        const result = await fetchAppsAPI(`/apps/${appId}`, {
            method: 'PUT',
             body: formData // Use FormData for file uploads (simulated)
        });
         // If fetchAppsAPI didn't throw, it was response.ok.
         // The STUB's PUT /apps/{id} returns { success, message, app? }
         if (!result.ok) { // Check success from stub response's perspective
            const errorData = await result.json();
            throw new Error(errorData.message || 'Update app failed (STUB).');
         }
         const data = await result.json();
        return data; // { success: boolean, app?: object, message: string }
     } catch (error) {
         console.error("Update app failed (STUB):", error.message);
          // Catch the error thrown by fetchAppsAPI and return its message
         return { success: false, message: error.message || 'Failed to update app (STUB).' };
     }
}

async function deleteApp(appId) {
    // Check if user is authenticated (backend should verify ownership - STUB simulates this)
    // Client-side confirmation should happen before calling this.

     try {
         // DELETE requests usually don't have bodies
         const result = await fetchAppsAPI(`/apps/${appId}`, {
             method: 'DELETE'
         });
         // If fetchAppsAPI didn't throw, it was response.ok.
         // The STUB's DELETE /apps/{id} returns { success, message }
         if (!result.ok) { // Check success from stub response's perspective
            const errorData = await result.json();
            throw new Error(errorData.message || 'Delete app failed (STUB).');
         }
         const data = await result.json();
         return data; // { success: boolean, message: string }
     } catch (error) {
         console.error("Delete app failed (STUB):", error.message);
          // Catch the error thrown by fetchAppsAPI and return its message
         return { success: false, message: error.message || 'Failed to delete app (STUB).' };
     }
}

async function getAppById(appId) {
     try {
         const response = await fetchAppsAPI(`/apps/${appId}`, { method: 'GET' });
          if (!response.ok) { // Check response.ok
             // Even for 404, fetchAppsAPI throws the error object with status
             throw new Error(`App with ID ${appId} not found (STUB).`);
          }
          // If response.ok, parse JSON
         const app = await response.json();
         return app; // Returns app object
     } catch (error) {
         console.error(`Failed to fetch app by ID ${appId} (STUB):`, error.message);
          // Catch the error thrown by fetchAppsAPI. If 404, return undefined. Re-throw others?
          if (error.status === 404) { // Use the status property from the thrown error
              return undefined; // Indicate app not found
          }
         // Re-throw other types of errors if necessary, or just return undefined for simplicity
         // For this stub, let's return undefined on any error for simplicity
         return undefined;
     }
}

async function getAppsByDeveloper(developerUsername) {
     // Check if user is authenticated (should be done on developer page load)
     // fetchAppsAPI handles unauthorized access simulation

     try {
         // Assuming the backend endpoint is something like /api/developers/{username}/apps
         const response = await fetchAppsAPI(`/developers/${developerUsername}/apps`, { method: 'GET' });
         if (!response.ok) { // Check response.ok
             const errorData = await response.json();
             throw new Error(errorData.message || `Failed to fetch apps for developer ${developerUsername} from stub API`);
         }
         // If response.ok, parse JSON
         const apps = await response.json();
         return apps; // Returns array of apps from the stub's static data, filtered
     } catch (error) {
         console.error(`Failed to fetch apps for developer ${developerUsername} (STUB):`, error.message);
         // Catch the error thrown by fetchAppsAPI and return empty array
         return [];
     }
}

// getAllApps function is now just an alias for the new async getApps
async function getAllApps() {
    return getApps();
}

async function fetchAppsAPI(endpoint, options = {}) {
    const currentUser = getCurrentUser(); // Get current user from auth.js
    const headers = {
        ...options.headers, // Allow caller to override headers
        'Content-Type': options.body instanceof FormData ? undefined : 'application/json', // Use 'application/json' unless sending FormData
    };

    // Add Authorization header if user is logged in and has a token
    if (currentUser && currentUser.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
    } else if (endpoint !== '/apps' && !endpoint.startsWith('/apps/')) { // Allow fetching /apps without auth
        // For other endpoints (like developer-specific ones or add/edit/delete),
        // redirection should have already happened if not logged in.
        // Add a check here just in case.
        console.error("Attempted to access protected app endpoint without being logged in.");
        // In a real app, the backend would enforce this, but client-side check is good.
        // Consider redirecting or showing an error message here if needed.
        // For now, just let fetch proceed, the backend will likely return 401/403.
    }


    try {
        const response = await fetch(`/api${endpoint}`, {
            method: options.method,
            headers: headers,
            body: options.body
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
                console.warn("Could not parse error response body:", e);
                errorData.message = `API Error: ${response.status} ${response.statusText}`;
            }

            const error = new Error(errorData.message || `API Error: ${response.status}`);
            error.status = response.status;
            error.response = response; // Keep reference to the response
            error.data = errorData; // Keep parsed data if available
            throw error;
        }

        // Check if response has a body before parsing JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
             return response.json();
        } else {
             // No JSON body (e.g., successful DELETE with 204 No Content)
             return {}; // Return empty object
        }


    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        // Re-throw the enhanced error object
        throw error;
    }
}


// --- Asynchronous Functions Interacting with the Real API ---

async function getApps() {
    try {
        const apps = await fetchAppsAPI('/apps', { method: 'GET' });
        return apps; // Returns array of apps from backend
    } catch (error) {
        console.error("Failed to fetch apps:", error.message);
        // Specific error handling could be added here if needed, e.g., redirect on 401
        return []; // Return empty array on error
    }
}

async function addApp(appData) {
    // Check if user is authenticated and is a developer (redundant if backend enforces, but good client-side check)
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'developer') {
        console.error("Unauthorized client-side: Only developers can add apps.");
        return { success: false, message: "Unauthorized: Only developers can add apps." };
    }

    // Prepare data for API call
    // If appData includes a File object (for logo), use FormData
    // Otherwise, use JSON
    let body;
    let headers = {}; // Use default headers handled by fetchAppsAPI unless special ones are needed

    if (appData.logo instanceof File) {
        // Create FormData for file upload + other fields
        const formData = new FormData();
        formData.append('name', appData.name);
        formData.append('description', appData.description);
        formData.append('price', appData.price);
        formData.append('platform', appData.platform);
        formData.append('apkLink', appData.apkLink);
        formData.append('iosLink', appData.iosLink);
        formData.append('logoFile', appData.logo); // Append the File object
        formData.append('developer', currentUser.username); // Add developer username
        body = formData;
        // Note: Do NOT manually set 'Content-Type' to 'multipart/form-data' with FormData,
        // the browser sets it automatically with the correct boundary.
        // fetchAppsAPI handles this by checking body type.
    } else {
        // If no file, send as JSON (assuming logo is a URL or empty)
        body = JSON.stringify({
             ...appData,
             developer: currentUser.username,
             // If appData.logo is empty string or URL, send it.
             // If it was a File and now isn't, this handles the case where
             // a new file wasn't selected during edit.
             logo: appData.logo || ''
        });
        // 'Content-Type': 'application/json' is handled by fetchAppsAPI
    }


    try {
        const result = await fetchAppsAPI('/apps', {
            method: 'POST',
            body: body
        });
        // The API should return { success: boolean, app?: object, message: string }
        return { success: true, ...result };
    } catch (error) {
        console.error("Add app failed:", error.message);
        return { success: false, message: error.message || 'Failed to add app.' };
    }
}

async function updateApp(appId, updatedData) {
    // Check if user is authenticated (backend should verify ownership)
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error("Unauthorized client-side: No user logged in for update.");
        return { success: false, message: "Unauthorized: No user logged in." };
    }

    // Prepare data for API call - similar logic to addApp
    let body;
    let headers = {};

     if (updatedData.logo instanceof File) {
         // Create FormData for file upload + other fields
         const formData = new FormData();
         formData.append('name', updatedData.name);
         formData.append('description', updatedData.description);
         formData.append('price', updatedData.price);
         formData.append('platform', updatedData.platform);
         formData.append('apkLink', updatedData.apkLink);
         formData.append('iosLink', updatedData.iosLink);
         formData.append('logoFile', updatedData.logo); // Append the NEW File object
         // When sending FormData for PUT, usually you identify the resource in the URL
         // and send the fields to update. The backend processes the file and updates the record.
         body = formData;
     } else {
         // If no new file selected, send as JSON
         body = JSON.stringify({
              ...updatedData,
              // Include logo field from updatedData - could be the old URL or empty string
              logo: updatedData.logo || ''
         });
     }

    try {
        const result = await fetchAppsAPI(`/apps/${appId}`, {
            method: 'PUT',
            body: body
        });
        // The API should return { success: boolean, app?: object, message: string }
         return { success: true, ...result };
     } catch (error) {
        console.error("Update app failed:", error.message);
         return { success: false, message: error.message || 'Failed to update app.' };
     }
}

async function deleteApp(appId) {
    // Check if user is authenticated (backend should verify ownership)
     const currentUser = getCurrentUser();
     if (!currentUser) {
         console.error("Unauthorized client-side: No user logged in for delete.");
         return { success: false, message: "Unauthorized: No user logged in." };
     }

     try {
         // DELETE requests usually don't have bodies
         await fetchAppsAPI(`/apps/${appId}`, {
             method: 'DELETE'
         });
         // If the API returns 200/204 on success, the response.ok check passes.
         // If it returns a JSON success message, that's fine too.
         // Assume success if fetchAppsAPI doesn't throw an error.
         return { success: true, message: 'App deleted successfully.' };
     } catch (error) {
         console.error("Delete app failed:", error.message);
         return { success: false, message: error.message || 'Failed to delete app.' };
     }
}

async function getAppById(appId) {
     try {
         const app = await fetchAppsAPI(`/apps/${appId}`, { method: 'GET' });
         return app; // Returns app object from backend
     } catch (error) {
         console.error(`Failed to fetch app by ID ${appId}:`, error.message);
         // Specific handling for 404 could return null/undefined vs throw
         if (error.status === 404) {
             return undefined; // Indicate app not found
         }
         throw error; // Re-throw other errors
     }
}

async function getAppsByDeveloper(developerUsername) {
     // Check if user is authenticated (should be done on developer page load)
     const currentUser = getCurrentUser();
     if (!currentUser) {
         console.error("Unauthorized client-side: No user logged in to fetch developer apps.");
         return []; // Return empty array if not logged in
     }

     try {
         // Assuming the backend endpoint is something like /api/developers/{username}/apps
         const apps = await fetchAppsAPI(`/developers/${developerUsername}/apps`, { method: 'GET' });
         return apps; // Returns array of apps from backend
     } catch (error) {
         console.error(`Failed to fetch apps for developer ${developerUsername}:`, error.message);
         return []; // Return empty array on error
     }
}

// getAllApps function alias remains for clarity if needed elsewhere
async function getAllApps() {
    return getApps();
}


// --- Asynchronous Functions Interacting with the Simulated API ---

async function getApps() {
    try {
        const response = await fetchAppsAPI('/apps', { method: 'GET' });
        if (!response.ok) throw new Error('Failed to fetch apps from stub API');
        const apps = await response.json();
        return apps; // Returns array of apps from the stub's static data
    } catch (error) {
        console.error("Failed to fetch apps (STUB):", error);
        return []; // Return empty array on error
    }
}

async function addApp(appData) {
    const currentUser = getCurrentUser(); // Assumes auth.js is loaded
    if (!currentUser || currentUser.role !== 'developer') {
        console.error("Unauthorized: Only developers can add apps.");
        return { success: false, message: "Unauthorized: Only developers can add apps." };
    }

    try {
        // Send data to the simulated API
        const appDataToSend = { ...appData, developer: currentUser.username };
        const response = await fetchAppsAPI('/apps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appDataToSend)
        });
        const data = await response.json();
        // Data should contain success, app object (with simulated ID), message
        // NOTE: This app will NOT persist after page refresh in the stub.
        return data; // { success: boolean, app?: object, message: string }
    } catch (error) {
        console.error("Add app failed (STUB):", error.message);
        return { success: false, message: `Failed to add app: ${error.message}` };
    }
}

async function updateApp(appId, updatedData) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error("Unauthorized: No user logged in.");
        return { success: false, message: "Unauthorized: No user logged in." };
    }

    try {
        // Send data to the simulated API
        const response = await fetchAppsAPI(`/apps/${appId}`, {
            method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(updatedData)
        });
         const data = await response.json();
         // Data should contain success, app object, message
         // NOTE: The app will NOT persist the update after page refresh in the stub.
        return data; // { success: boolean, app?: object, message: string }
     } catch (error) {
         console.error("Update app failed (STUB):", error.message);
         return { success: false, message: `Failed to update app: ${error.message}` };
     }
}

async function deleteApp(appId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error("Unauthorized: No user logged in.");
        return { success: false, message: "Unauthorized: No user logged in." };
    }

     try {
         const response = await fetchAppsAPI(`/apps/${appId}`, {
             method: 'DELETE'
         });
         const data = await response.json();
         // Data should contain success, message
         // NOTE: The app will NOT actually be deleted from the stub's static data.
         return data; // { success: boolean, message: string }
     } catch (error) {
         console.error("Delete app failed (STUB):", error.message);
         return { success: false, message: `Failed to delete app: ${error.message}` };
     }
}

async function getAppById(appId) {
     try {
         const response = await fetchAppsAPI(`/apps/${appId}`, { method: 'GET' });
         if (!response.ok) throw new Error(`App with ID ${appId} not found`);
         const app = await response.json();
         return app; // Returns app object from the stub's static data
     } catch (error) {
         console.error(`Failed to fetch app by ID ${appId} (STUB):`, error.message);
         return undefined; // Indicate app not found or error
     }
}

async function getAppsByDeveloper(developerUsername) {
     try {
         const response = await fetchAppsAPI(`/developer/${developerUsername}/apps`, { method: 'GET' }); // Hypothetical endpoint
         if (!response.ok) throw new Error(`Failed to fetch apps for developer ${developerUsername} from stub API`);
         const apps = await response.json();
         return apps; // Returns array of apps from the stub's static data, filtered
     } catch (error) {
         console.error(`Failed to fetch apps for developer ${developerUsername} (STUB):`, error.message);
         return []; // Return empty array on error
     }
}

// getAllApps function is now just an alias for the new async getApps
async function getAllApps() {
    return getApps();
}
    
