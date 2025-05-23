
document.addEventListener('DOMContentLoaded', async () => { // Made async to await initialLoad
    // checkAuthAndRedirect is called here just to redirect if not logged in.
    // We don't necessarily need the currentUser object returned here if updateUserNav handles it.
    // However, keeping it simplifies subsequent logic if needed.
    const currentUser = checkAuthAndRedirect(null, 'index.html'); // null allows any role, redirects to index if not logged in
    // If checkAuthAndRedirect returned false, it already handled the redirection.
    // Stop further execution of this script.
    if (!currentUser) {
        console.log("User not authorized or not logged in. Redirecting handled by checkAuthAndRedirect.");
        return;
    }

    // Update header navigation based on user status and role
    // Use the new main-nav ID
    updateUserNav('main-nav');

    const userAppsList = document.getElementById('user-apps-list'); // This is now a Bootstrap row
    const searchInput = document.getElementById('search-apps');
    const platformFilter = document.getElementById('filter-platform');
    const sortBySelect = document.getElementById('sort-by');
    // Removed userNav = document.getElementById('main-nav'); as it's handled by updateUserNav now

    // Add a message placeholder div to the user page section
    const userPageMessageDiv = document.getElementById('user-page-message'); // Use the placeholder added in HTML

    const { openModal, closeModal } = initializeModal('app-detail-modal', '.view-details-btn', '.close-btn'); // Modal for app details

    function renderApps(appsToRender) {
        if (!userAppsList) return;
        userAppsList.innerHTML = ''; // Clear current list (the row's content)

        if (appsToRender.length === 0) {
             // Add a Bootstrap column wrapper for the message
            userAppsList.innerHTML = '<div class="col"><p>Aucune application trouvée correspondant à vos critères.</p></div>'; // Translated, wrapped in col
            return;
        }

        appsToRender.forEach(app => {
            // createAppCard now returns a Bootstrap grid column div containing the card
            const appCardCol = createAppCard(app, false); // false for user context
            userAppsList.appendChild(appCardCol); // Append the column div to the row
        });
    }

    function getPriceValue(priceStr) {
        if (!priceStr) return Infinity; // Handle null/undefined price
        if (priceStr.toLowerCase() === 'gratuit') { // Translated "Free"
            return 0;
        }
        // Remove currency symbols and commas, then parse as float
        const numericPrice = parseFloat(priceStr.replace(/[^0-9.,]+/g, "").replace(',', '.')); // Also handle comma as decimal separator
        return isNaN(numericPrice) ? Infinity : numericPrice; // Put unparseable prices at the end
    }

    async function applyFiltersAndSort() { // This function is already async
        // Clear previous messages
        if (userPageMessageDiv) {
             userPageMessageDiv.textContent = '';
             userPageMessageDiv.className = 'mt-3'; // Reset Bootstrap alert classes
        }


        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedPlatform = platformFilter ? platformFilter.value : 'All';
        const sortBy = sortBySelect ? sortBySelect.value : 'name-asc';

        // Fetch all apps (this is now async)
        const allApps = await getAllApps(); // Await the async call

        let filteredApps = allApps; // Start with all fetched apps

        // Apply Search
        if (searchTerm) {
            filteredApps = filteredApps.filter(app => {
                // Check if app properties exist and are strings before accessing them
                const name = (app.name && typeof app.name === 'string') ? app.name.toLowerCase() : '';
                const description = (app.description && typeof app.description === 'string') ? app.description.toLowerCase() : '';
                const developer = (app.developer && typeof app.developer === 'string') ? app.developer.toLowerCase() : '';

                return name.includes(searchTerm) || description.includes(searchTerm) || developer.includes(searchTerm);
            });
        }


        // Apply Platform Filter
        if (selectedPlatform !== 'All') {
            filteredApps = filteredApps.filter(app =>
                 // Check if platform property exists and is a string
                app.platform && typeof app.platform === 'string' && (app.platform === selectedPlatform || app.platform === 'Both')
            );
        }

        // Apply Sorting
        filteredApps.sort((a, b) => {
            // Handle potential null/undefined app objects or properties gracefully
            if (!a && !b) return 0;
            if (!a) return 1; // b comes first
            if (!b) return -1; // a comes first

            switch (sortBy) {
                case 'name-asc':
                    // Ensure name exists before calling localeCompare
                    const nameA_asc = (a.name && typeof a.name === 'string') ? a.name : '';
                    const nameB_asc = (b.name && typeof b.name === 'string') ? b.name : '';
                    return nameA_asc.localeCompare(nameB_asc);
                case 'name-desc':
                    const nameA_desc = (a.name && typeof a.name === 'string') ? a.name : '';
                    const nameB_desc = (b.name && typeof b.name === 'string') ? b.name : '';
                    return nameB_desc.localeCompare(nameA_desc);
                case 'price-asc':
                    const priceA = getPriceValue(a.price);
                    const priceB = getPriceValue(b.price);
                    if (priceA === priceB) {
                         const nameA = (a.name && typeof a.name === 'string') ? a.name : '';
                         const nameB = (b.name && typeof b.name === 'string') ? b.name : '';
                         return nameA.localeCompare(nameB); // Secondary sort by name
                    }
                    // Sort Infinity (unparseable prices) to the end
                    if (priceA === Infinity) return 1;
                    if (priceB === Infinity) return -1;
                    return priceA - priceB;
                case 'price-desc':
                    const priceA_desc = getPriceValue(a.price);
                    const priceB_desc = getPriceValue(b.price);
                    if (priceA_desc === priceB_desc) {
                         const nameA = (a.name && typeof a.name === 'string') ? a.name : '';
                         const nameB = (b.name && typeof b.name === 'string') ? b.name : '';
                         return nameA.localeCompare(nameB); // Secondary sort by name
                    }
                    // Sort Infinity (unparseable prices) to the end
                    if (priceA_desc === Infinity) return 1;
                    if (priceB_desc === Infinity) return -1;
                     return priceB_desc - priceA_desc;
                default:
                    return 0; // No sort
            }
        });

         renderApps(filteredApps);
    }


    // Event delegation for view details buttons on the app list (which is now a row)
    // Target the column div, as it contains the app ID data attribute
    userAppsList.addEventListener('click', async (e) => { // Make async
        const viewDetailsBtn = e.target.closest('.view-details-btn'); // Use closest to handle clicks on icon or button text
        if (viewDetailsBtn) {
            const colDiv = e.target.closest('.col[data-app-id]'); // Find the closest column with the app ID
            // Ensure colDiv and dataset exist
            if (!colDiv || !colDiv.dataset || !colDiv.dataset.appId) return;
            const appId = colDiv.dataset.appId;
            // Fetch app details by ID to ensure we have the latest data
            const app = await getAppById(appId); // Await the async function
            if (app) {
                displayAppInModal(app);
            } else {
                // Handle case where app is not found (e.g., show error message)
                console.error(`App with ID ${appId} not found.`);
                showMessage('user-page-message', `Erreur : Application avec l'ID ${appId} introuvable.`, false); // Translated message, use page message div
            }
        }
    });

    // Function to display app details in the modal
    function displayAppInModal(app) {
        const modalContent = document.getElementById('modal-app-content');
        if (!modalContent) return;

        // Clear previous content
        modalContent.innerHTML = '';

        let logoHtml = '';
         // Use Bootstrap classes for logo styling within the modal
         const modalLogoClass = 'img-fluid rounded-3 mb-3'; // Responsive image, rounded corners, bottom margin
         const modalPlaceholderClass = 'app-logo-placeholder modal-logo-placeholder rounded-3 mb-3 d-flex align-items-center justify-content-center bg-light'; // Custom placeholder styles + Bootstrap flex utilities

        if (app.logo) {
             // Apply img-fluid and rounded-3 from Bootstrap, keep custom app-logo for size/float
            logoHtml = `<img src="${app.logo}" alt="Logo ${app.name}" class="app-logo ${modalLogoClass}" style="max-width: 120px; max-height: 120px; object-fit: cover;">`; // Specific size for modal
        } else {
             let platformIcon = 'fa-mobile-alt'; // Generic
            if (app.platform === 'Android') platformIcon = 'fa-android';
            if (app.platform === 'iOS') platformIcon = 'fa-apple';
            // Apply Bootstrap utilities for centering/size within placeholder
            logoHtml = `<div class="${modalPlaceholderClass}" style="width: 120px; height: 120px;"><i class="fab ${platformIcon} text-muted fs-2"></i></div>`; // Larger size for modal placeholder
        }

        let downloadLinks = '';
        // Add Android link if available and platform matches
        if ((app.platform === 'Android' || app.platform === 'Both') && app.apkLink && isValidUrl(app.apkLink)) {
            downloadLinks += `<a href="${app.apkLink}" target="_blank" rel="noopener noreferrer" class="btn btn-success me-2"><i class="fab fa-android me-1"></i> Obtenir pour Android</a>`; // Translated, Bootstrap success button
        } else if (app.platform === 'Android' || app.platform === 'Both') {
             // Show disabled button if link is missing
             downloadLinks += `<button class="btn btn-secondary disabled me-2" disabled title="Lien non disponible"><i class="fab fa-android me-1"></i> Android</button>`; // Translated, Bootstrap secondary disabled button
        }

        // Add iOS link if available and platform matches
        if ((app.platform === 'iOS' || app.platform === 'Both') && app.iosLink && isValidUrl(app.iosLink)) {
             // Add a margin if an Android button was already added (Bootstrap me-2 handles this)
            downloadLinks += `<a href="${app.iosLink}" target="_blank" rel="noopener noreferrer" class="btn btn-info"><i class="fab fa-apple me-1"></i> Obtenir pour iOS</a>`; // Translated, Bootstrap info button
        } else if (app.platform === 'iOS' || app.platform === 'Both') {
             // Show disabled button if link is missing
             downloadLinks += `<button class="btn btn-secondary disabled" disabled title="Lien non disponible"><i class="fab fa-apple me-1"></i> iOS</button>`; // Translated, Bootstrap secondary disabled button
        }


        if (!downloadLinks.trim()) { // Check if any links were generated
            downloadLinks = "<p>Aucun lien de téléchargement fourni pour cette application.</p>"; // Translated
        }

        // Populate modal content with translated strings and Bootstrap classes
        modalContent.innerHTML = `
            <div class="d-flex mb-3"> <!-- Use flexbox to wrap logo and text -->
                 ${logoHtml}
                 <div class="flex-grow-1"> <!-- Allow text content to take remaining space -->
                    <h2 class="mb-2 text-primary">${app.name || 'Application Sans Titre'}</h2> <!-- Translated fallback, Bootstrap primary color -->
                    <h6 class="mb-2 text-muted">Par : ${app.developer || 'Développeur Inconnu'}</h6> <!-- Translated fallback, Bootstrap muted text -->
                    <p class="mb-2"><strong class="text-warning"><i class="fas fa-tag me-1"></i> ${app.price || 'N/A'}</strong></p> <!-- Translated fallback, Bootstrap warning color -->
                     <span class="badge bg-secondary">${app.platform || 'Plateforme Inconnue'}</span> <!-- Translated fallback, Bootstrap badge -->
                 </div>
            </div>
            <hr>
            <p><strong>Description :</strong></p> <!-- Translated -->
            <p>${app.description ? app.description.replace(/\n/g, '<br>') : 'Aucune description fournie.'}</p> <!-- Translated fallback -->
            <hr>
            <p><strong>Liens de téléchargement :</strong></p> <!-- Translated -->
            <div class="app-downloads">
                ${downloadLinks}
            </div>
             <hr>
        `;
        openModal(); // No contentSetter needed as we populate it here
    }

    // Add event listeners for search, filter, and sort
    if (searchInput) {
        // Use 'input' for real-time search, 'change' is fine for select dropdowns
        searchInput.addEventListener('input', applyFiltersAndSort);
    }
    if (platformFilter) {
        platformFilter.addEventListener('change', applyFiltersAndSort);
    }
     if (sortBySelect) {
        sortBySelect.addEventListener('change', applyFiltersAndSort);
    }

    // Initial load with default filters/sort
    // Need to make the initial load and applyFiltersAndSort async
    // to handle the asynchronous getApps call
    async function initialLoad() {
         // Fetch apps first, then apply filters and render
         // Note: `getAllApps` is an async function from appManager.js
         // We need to await it or refactor applyFiltersAndSort to fetch data itself.
         // Let's refactor applyFiltersAndSort to fetch data itself.
         await applyFiltersAndSort(); // Now applyFiltersAndSort fetches data
    }

    initialLoad();
});
    
