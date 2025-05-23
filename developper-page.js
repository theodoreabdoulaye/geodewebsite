
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and redirect if not logged in or not a developer
    const currentUser = checkAuthAndRedirect('developer', 'index.html');
    if (!currentUser) {
        // If checkAuthAndRedirect returned false, it already handled the redirection.
        // Stop further execution of this script.
        console.log("User not authorized or not logged in. Redirecting handled by checkAuthAndRedirect.");
        return;
    }

    // Update header navigation based on user status and role
    // Use the new main-nav ID
    updateUserNav('main-nav');

    // The rest of the script handles the developer page UI and app management logic.
    // This part remains largely the same, relying on the simplified auth.js for user info.

    // Removed the static logout button listener as it is now handled by updateUserNav
    // on the #nav-logout element within #main-nav.

    const addAppForm = document.getElementById('add-app-form');
    const developerAppsList = document.getElementById('developer-apps-list');
    const appFormMessage = document.getElementById('app-form-message');
    const submitAppBtn = document.getElementById('submit-app-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const appIdInput = document.getElementById('app-id');
    const appNameInput = document.getElementById('app-name');
    const appDescriptionInput = document.getElementById('app-description');
    const appLogoFileInput = document.getElementById('app-logo-file');
    const logoPreviewContainer = document.getElementById('logo-preview-container');
    const currentLogoDisplay = document.getElementById('current-logo-display'); // Used for existing logo during edit
    const newLogoPreview = document.getElementById('new-logo-preview'); // Used for preview of new file
    const newLogoPreviewImg = newLogoPreview ? newLogoPreview.querySelector('img') : null;
    const appPriceInput = document.getElementById('app-price');
    const appPlatformSelect = document.getElementById('app-platform');
    const appApkLinkInput = document.getElementById('app-apk-link');
    const appIosLinkInput = document.getElementById('app-ios-link');

    const appNameError = document.getElementById('app-name-error');
    const appDescriptionError = document.getElementById('app-description-error');
    const appLogoFileError = document.getElementById('app-logo-file-error');
    const appPriceError = document.getElementById('app-price-error');
    const appApkLinkError = document.getElementById('app-apk-link-error');
    const appIosLinkError = document.getElementById('app-ios-link-error');

    // File validation constants (keep for client-side UX, backend should re-validate)
    const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
    const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Explicit types

    // Helper to clear validation errors
    function clearErrors() {
        document.querySelectorAll('#add-app-form .error-message').forEach(span => span.textContent = '');
        appFormMessage.textContent = ''; // Clear general form message too
        appFormMessage.className = 'message'; // Reset message class
    }

    // Basic URL validation helper (keep for client-side UX)
    function isValidUrl(string) {
        if (!string) return true; // Allow empty string
        try {
            new URL(string);
            return true;
        } catch (e) {
            return false;
        }
    }

    function resetForm() {
        addAppForm.reset();
        appIdInput.value = ''; // Clear hidden ID field
        submitAppBtn.textContent = 'Add Application';
        cancelEditBtn.style.display = 'none';
        document.querySelector('#add-app-section h2').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Application';
        clearErrors(); // Clear errors when resetting form
        appLogoFileInput.value = ''; // Clear file input
        currentLogoDisplay.innerHTML = ''; // Clear current logo display
        currentLogoDisplay.style.display = 'none'; // Hide current logo display
        if (newLogoPreview) newLogoPreview.style.display = 'none'; // Hide new logo preview
        if (newLogoPreviewImg) newLogoPreviewImg.src = '#'; // Clear new logo preview image src
        if (logoPreviewContainer) logoPreviewContainer.style.display = 'block'; // Keep container visible
    }

    cancelEditBtn.addEventListener('click', resetForm);

    // Event listener for file input change to show preview
    if (appLogoFileInput && newLogoPreviewImg && newLogoPreview) {
        appLogoFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                // Validate file type and size before showing preview (basic client-side check)
                if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
                     appLogoFileError.textContent = 'Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.';
                     newLogoPreview.style.display = 'none';
                     newLogoPreviewImg.src = '#';
                     return; // Stop here if type is wrong
                 }
                 if (file.size > MAX_LOGO_SIZE_BYTES) {
                     appLogoFileError.textContent = `File size exceeds limit (${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB).`;
                      newLogoPreview.style.display = 'none';
                     newLogoPreviewImg.src = '#';
                     return; // Stop here if size is wrong
                 }

                // Clear any previous file error if validation passes
                appLogoFileError.textContent = '';


                const reader = new FileReader();
                reader.onload = (e) => {
                    newLogoPreviewImg.src = e.target.result;
                    newLogoPreview.style.display = 'block'; // Show the new preview
                    currentLogoDisplay.style.display = 'none'; // Hide the current logo display when new file is selected
                };
                reader.readAsDataURL(file);
            } else {
                // No file selected or cleared
                newLogoPreview.style.display = 'none';
                newLogoPreviewImg.src = '#';
                 // Re-show the current logo display if we were in edit mode with an existing logo
                 if (appIdInput.value && currentLogoDisplay.innerHTML.trim() !== '<p><small>No current logo.</small></p>') {
                     currentLogoDisplay.style.display = 'block';
                 }
            }
        });
    }


    addAppForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessagesAndErrors(); // Clear previous errors and messages

        let isValid = true;

        if (appNameInput.value.trim() === '') {
            appNameError.textContent = 'App Name is required.';
            isValid = false;
        }

        if (appDescriptionInput.value.trim() === '') {
            appDescriptionError.textContent = 'Description is required.';
            isValid = false;
        }

        if (appPriceInput.value.trim() === '') {
            appPriceError.textContent = 'Price is required.';
            isValid = false;
        }

         if (!isValidUrl(appApkLinkInput.value.trim())) {
             appApkLinkError.textContent = 'Please enter a valid URL for the APK link.';
             isValid = false;
         }

         if (!isValidUrl(appIosLinkInput.value.trim())) {
             appIosLinkError.textContent = 'Please enter a valid URL for the iOS link.';
             isValid = false;
         }

        // File Validation Logic for the new logo file input
        const logoFile = appLogoFileInput.files.length > 0 ? appLogoFileInput.files[0] : null;

        if (logoFile) {
            if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
                appLogoFileError.textContent = 'Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.';
                isValid = false;
            }
            if (logoFile.size > MAX_LOGO_SIZE_BYTES) {
                appLogoFileError.textContent = `File size exceeds limit (${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB).`;
                isValid = false;
            }
        }

        // If validation fails, display general message and stop
        if (!isValid) {
            showMessage('app-form-message', 'Please fix the errors above.', false);
            return;
        }

        // Construct appData *after* validation
        // The appDataToSend FormData logic below is correct for sending File objects
        const appData = {
            name: appNameInput.value.trim(),
            description: appDescriptionInput.value.trim(),
            price: appPriceInput.value.trim(),
            platform: appPlatformSelect.value,
            apkLink: appApkLinkInput.value.trim(),
            iosLink: appIosLinkInput.value.trim(),
        };

        const appDataToSend = new FormData();
        appDataToSend.append('name', appData.name);
        appDataToSend.append('description', appData.description);
        appDataToSend.append('price', appData.price);
        appDataToSend.append('platform', appData.platform);
        appDataToSend.append('apkLink', appData.apkLink);
        appDataToSend.append('iosLink', appData.iosLink);

        if (logoFile) {
             appDataToSend.append('logoFile', logoFile); // Append the NEW File object
        } else if (appIdInput.value) {
             // If editing and no new file, we might need to tell the backend
             // whether to keep the old logo or clear it.
             // The current STUB logic in appManager.js keeps the old logo if 'logoFile' is absent
             // and no 'logo' string is provided. This is fine for the STUB.
             // A real API might expect a flag like `clearLogo: true` or the existing URL.
             // For consistency with the STUB, we only append 'logo' if editing and there's
             // an *existing* logo URL displayed (meaning we intend to keep it if no new file).
             // Or, we could explicitly send the existing logo URL if no new file is selected.
             // Let's stick to the STUB's current interpretation: if logoFile is absent,
             // and no 'logo' string is sent, it keeps the old one. If 'logo' is sent (e.g., empty string), it clears.
             // The UI doesn't have a "clear logo" checkbox, so omitting 'logo' when no new file means "keep existing".
             // The existing 'currentLogoDisplay' logic is just for client-side preview.
             // So, if NOT adding (it's an edit) AND no logoFile is selected,
             // we don't append *anything* related to the logo to the FormData,
             // and the backend STUB interprets this as "keep the existing logo".
             // If a real backend expects the old logo URL explicitly, this logic needs adjustment.
             // For the current STUB, this is okay.
             const existingLogoUrl = currentLogoDisplay.querySelector('img')?.src || '';
             if (appIdInput.value && !logoFile && existingLogoUrl && existingLogoUrl !== '#' && !existingLogoUrl.includes('placeholder')) {
                 // We are editing, no new file, there was an old logo.
                 // Explicitly append the old URL if the backend expects it this way.
                 // The STUB handles this correctly by keeping the old one if no logoFile.
                 // So, we don't *need* to append anything here for the STUB to keep the old one.
                 // But if a real API requires it, uncomment the line below.
                 // appDataToSend.append('logo', existingLogoUrl);
             } else if (appIdInput.value && !logoFile && (!existingLogoUrl || existingLogoUrl.includes('placeholder'))) {
                 // We are editing, no new file, AND there was no old logo (or it was placeholder).
                 // This state shouldn't really happen during edit unless the user manually cleared something
                 // the UI doesn't allow. But if it did, ensure the backend doesn't keep a phantom logo.
                 // Explicitly send an empty string for 'logo' to tell the backend to clear it.
                 // The STUB already handles this if `logo` is present and empty.
                 // appDataToSend.append('logo', ''); // Only needed if editing AND want to clear existing
             }
         }


        // Add the developer username for the backend (STUB uses this for ownership)
        appDataToSend.append('developer', currentUser.username);


        // Show processing message
        showMessage('app-form-message', 'Processing application data...', true);


        let result;
        const editingAppId = appIdInput.value;

        if (editingAppId) { // Editing existing app
            result = await updateApp(editingAppId, appDataToSend); // Pass FormData
        } else { // Adding new app
            result = await addApp(appDataToSend); // Pass FormData
        }

        if (result.success) {
            showMessage('app-form-message', result.message, true);
            resetForm();
            await loadDeveloperApps(); // Reload the list of apps
        } else {
            // Display API error message
            showMessage('app-form-message', result.message || 'Operation failed.', false);
        }
    });

    // Function to load and display developer's apps
    async function loadDeveloperApps() {
        if (!developerAppsList) return;
        developerAppsList.innerHTML = ''; // Clear current list
         // Fetch apps for the *current logged-in developer*
        const apps = await getAppsByDeveloper(currentUser.username);
        if (!apps || apps.length === 0) {
            developerAppsList.innerHTML = '<p>You have not submitted any applications yet.</p>';
            return;
        }
        apps.forEach(app => {
            // Use the createAppCard helper from uiHelpers.js
            const appCard = createAppCard(app, true); // true indicates developer context (shows edit/delete buttons)
            developerAppsList.appendChild(appCard);
        });
    }

    // Event delegation for edit and delete buttons on the app list
    developerAppsList.addEventListener('click', async (e) => {
        // Check if the clicked element or its closest ancestor is an edit or delete button
        const editBtn = e.target.closest('.edit-app-btn');
        const deleteBtn = e.target.closest('.delete-app-btn');
        const card = e.target.closest('.app-card');

        if (!card) return; // Click wasn't inside an app card

        const appId = card.dataset.appId;

        if (editBtn) {
             e.preventDefault(); // Prevent default button click behavior
            // Fetch the specific app data for editing
            const appToEdit = await getAppById(appId);
            if (appToEdit) {
                populateFormForEdit(appToEdit); // Populate the form with app data
            } else {
                 showMessage('app-form-message', 'Could not fetch app details for editing.', false);
            }
        } else if (deleteBtn) {
             e.preventDefault(); // Prevent default button click behavior
            // Confirm deletion
            if (confirm('Are you sure you want to delete this application? This cannot be undone.')) {
                // Call deleteApp function
                showMessage('app-form-message', 'Deleting application...', true);
                const result = await deleteApp(appId);
                if (result.success) {
                    showMessage('app-form-message', result.message, true);
                    await loadDeveloperApps(); // Reload the list after deletion
                } else {
                    showMessage('app-form-message', result.message || 'Failed to delete application.', false);
                }
            }
        }
    });

    // Function to populate the form when editing an app
    function populateFormForEdit(app) {
        // Set the hidden ID field
        appIdInput.value = app.id;

        // Populate form fields with app data
        appNameInput.value = app.name;
        appDescriptionInput.value = app.description;
        // File input cannot be programmatically set for security, clear any existing selection
        appLogoFileInput.value = ''; // This clears the selected file

        appPriceInput.value = app.price;
        appPlatformSelect.value = app.platform;
        appApkLinkInput.value = app.apkLink;
        appIosLinkInput.value = app.iosLink;

        // Handle logo preview and current logo display
        // Clear and hide the new logo preview when populating for edit
        if (newLogoPreview) newLogoPreview.style.display = 'none';
        if (newLogoPreviewImg) newLogoPreviewImg.src = '#';
         // Clear any previous file error
         appLogoFileError.textContent = '';


        // Display current logo if it exists
        currentLogoDisplay.innerHTML = ''; // Clear previous display
        if (app.logo) {
             currentLogoDisplay.style.display = 'block';
            const currentLogoImg = document.createElement('img');
            currentLogoImg.src = app.logo;
            currentLogoImg.alt = 'Current Logo';
            // Apply some basic styling to the current logo image
            currentLogoImg.style.maxWidth = '150px';
            currentLogoImg.style.maxHeight = '150px';
            currentLogoImg.style.borderRadius = '10px';
            currentLogoImg.style.objectFit = 'cover';
            currentLogoDisplay.appendChild(currentLogoImg);
            // Optionally show the current logo URL
            currentLogoDisplay.innerHTML += `<p><small>Current Logo: <a href="${app.logo}" target="_blank">${app.logo}</a></small></p>`;
        } else {
             // Explicitly show message if no current logo
             currentLogoDisplay.innerHTML = '<p><small>No current logo.</small></p>';
             currentLogoDisplay.style.display = 'block'; // Still show the container for the "No current logo" message
        }

        // Change button text and show cancel button
        submitAppBtn.textContent = 'Update Application';
        cancelEditBtn.style.display = 'inline-block';

        // Ensure logo preview container is visible (it contains both current and new previews)
        if (logoPreviewContainer) logoPreviewContainer.style.display = 'block';

        // Update section heading
        document.querySelector('#add-app-section h2').innerHTML = '<i class="fas fa-edit"></i> Edit Application';

        // Clear form messages/errors from previous submissions
        clearErrors();

        // Scroll to the form
        window.scrollTo(0, addAppForm.offsetTop - 20);
    }


    const developerAnalyticsContent = document.getElementById('developer-analytics-content');
    const analyticsMessageDiv = document.getElementById('analytics-message');
    const totalAppsMetric = document.getElementById('total-apps-metric');
    const totalViewsMetric = document.getElementById('total-views-metric');
    const totalDownloadsMetric = document.getElementById('total-downloads-metric');

    const viewsChartCanvas = document.getElementById('viewsChart');
    const downloadsChartCanvas = document.getElementById('downloadsChart');

    let viewsChartInstance = null; // To hold the Chart.js instance for views
    let downloadsChartInstance = null; // To hold the Chart.js instance for downloads


    // File validation constants (keep for client-side UX, backend should re-validate)
    const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
    const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Explicit types

    // Helper to clear validation errors and messages
    function clearMessagesAndErrors() {
        document.querySelectorAll('#add-app-form .error-message').forEach(span => span.textContent = '');
        // Check if the form message div exists before trying to modify it
        if (appFormMessage) {
             appFormMessage.textContent = ''; // Clear general form message too
             appFormMessage.className = 'mt-3'; // Reset Bootstrap alert classes
         }
         if (analyticsMessageDiv) { // Also clear analytics messages
             analyticsMessageDiv.textContent = '';
             analyticsMessageDiv.className = 'mt-3'; // Reset Bootstrap alert classes
         }
    }

    // Basic URL validation helper (keep for client-side UX)
    function isValidUrl(string) {
        if (!string) return true; // Allow empty string
        try {
            new URL(string);
            return true;
        } catch (e) {
            return false;
        }
    }

    function resetForm() {
        addAppForm.reset();
        appIdInput.value = ''; // Clear hidden ID field
        submitAppBtn.textContent = 'Ajouter l\'application'; // Translated button text
        cancelEditBtn.style.display = 'none';
        document.querySelector('#add-app-section h2').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter une nouvelle application'; // Translated heading
        clearMessagesAndErrors(); // Clear errors when resetting form
        appLogoFileInput.value = ''; // Clear file input
        currentLogoDisplay.innerHTML = ''; // Clear current logo display
        currentLogoDisplay.style.display = 'none'; // Hide current logo display
        if (newLogoPreview) newLogoPreview.style.display = 'none'; // Hide new logo preview
        if (newLogoPreviewImg) newLogoPreviewImg.src = '#'; // Clear new logo preview image src
        // Ensure logo preview container is visible after reset if it was hidden for some reason
        if (logoPreviewContainer) logoPreviewContainer.style.display = 'block';
    }

    cancelEditBtn.addEventListener('click', resetForm);

    // Event listener for file input change to show preview
    if (appLogoFileInput && newLogoPreviewImg && newLogoPreview) {
        appLogoFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                // Validate file type and size before showing preview (basic client-side check)
                if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
                     appLogoFileError.textContent = 'Type de fichier invalide. Veuillez télécharger une image JPG, PNG, GIF ou WEBP.'; // Translated error
                     newLogoPreview.style.display = 'none';
                     newLogoPreviewImg.src = '#';
                     return; // Stop here if type is wrong
                 }
                 if (file.size > MAX_LOGO_SIZE_BYTES) {
                     appLogoFileError.textContent = `La taille du fichier dépasse la limite (${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}Mo).`; // Translated error
                      newLogoPreview.style.display = 'none';
                     newLogoPreviewImg.src = '#';
                     return; // Stop here if size is wrong
                 }

                // Clear any previous file error if validation passes
                appLogoFileError.textContent = '';


                const reader = new FileReader();
                reader.onload = (e) => {
                    newLogoPreviewImg.src = e.target.result;
                    newLogoPreview.style.display = 'block'; // Show the new preview
                    currentLogoDisplay.style.display = 'none'; // Hide the current logo display when new file is selected
                };
                reader.readAsDataURL(file);
            } else {
                // No file selected or cleared
                newLogoPreview.style.display = 'none';
                newLogoPreviewImg.src = '#';
                 // Re-show the current logo display if we were in edit mode with an existing logo
                 if (appIdInput.value && currentLogoDisplay.innerHTML.trim() !== '<p><small>No current logo.</small></p>') { // Check the content structure
                     currentLogoDisplay.style.display = 'block';
                 }
            }
        });
    }


    addAppForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(); // Clear previous errors

        let isValid = true;

        if (appNameInput.value.trim() === '') {
            appNameError.textContent = 'Le nom de l\'application est requis.'; // Translated error
            isValid = false;
        }

        if (appDescriptionInput.value.trim() === '') {
            appDescriptionError.textContent = 'La description est requise.'; // Translated error
            isValid = false;
        }

        if (appPriceInput.value.trim() === '') {
            appPriceError.textContent = 'Le prix est requis.'; // Translated error
            isValid = false;
        }

         if (!isValidUrl(appApkLinkInput.value.trim())) {
             appApkLinkError.textContent = 'Veuillez saisir une URL valide pour le lien APK.'; // Translated error
             isValid = false;
         }

         if (!isValidUrl(appIosLinkInput.value.trim())) {
             appIosLinkError.textContent = 'Veuillez saisir une URL valide pour le lien App Store.'; // Translated error
             isValid = false;
         }

        // File Validation Logic for the new logo file input
        const logoFile = appLogoFileInput.files.length > 0 ? appLogoFileInput.files[0] : null;

        if (logoFile) {
            if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
                appLogoFileError.textContent = 'Type de fichier invalide. Veuillez télécharger une image JPG, PNG, GIF ou WEBP.'; // Translated error
                isValid = false;
            }
            if (logoFile.size > MAX_LOGO_SIZE_BYTES) {
                appLogoFileError.textContent = `La taille du fichier dépasse la limite (${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}Mo).`; // Translated error
                isValid = false;
            }
        }

        // If client-side validation fails, display general message and stop
        if (!isValid) {
            showMessage('app-form-message', 'Veuillez corriger les erreurs ci-dessus.', false); // Translated message using uiHelpers
            return;
        }

        // Construct appData *after* validation
        // Use FormData to handle potential file upload
        const appData = {
            name: appNameInput.value.trim(),
            description: appDescriptionInput.value.trim(),
            price: appPriceInput.value.trim(),
            platform: appPlatformSelect.value,
            apkLink: appApkLinkInput.value.trim(),
            iosLink: appIosLinkInput.value.trim(),
        };

        const appDataToSend = new FormData();
        appDataToSend.append('name', appData.name);
        appDataToSend.append('description', appData.description);
        appDataToSend.append('price', appData.price);
        appDataToSend.append('platform', appData.platform);
        appDataToSend.append('apkLink', appData.apkLink);
        appDataToSend.append('iosLink', appData.iosLink);

        if (logoFile) {
             appDataToSend.append('logoFile', logoFile); // Append the NEW File object
        } else if (appIdInput.value) {
             // If editing and no new file, we might need to tell the backend
             // whether to keep the old logo or clear it.
             // The current STUB logic in appManager.js keeps the old logo if 'logoFile' is absent
             // and no 'logo' string is provided. This is fine for the STUB.
             // A real API might expect a flag like `clearLogo: true` or the existing URL.
             // For consistency with the STUB, we only append 'logo' if editing and there's
             // an *existing* logo URL displayed (meaning we intend to keep it if no new file).
             // Or, we could explicitly send the existing logo URL if no new file is selected.
             // Let's stick to the STUB's current interpretation: if logoFile is absent,
             // and no 'logo' string is sent, it keeps the old one. If 'logo' is sent (e.g., empty string), it clears.
             // The UI doesn't have a "clear logo" checkbox, so omitting 'logo' when no new file means "keep existing".
             // The existing 'currentLogoDisplay' logic is just for client-side preview.
             // So, if NOT adding (it's an edit) AND no logoFile is selected,
             // we don't append *anything* related to the logo to the FormData,
             // and the backend STUB interprets this as "keep the existing logo".
             // If a real backend expects the old logo URL explicitly, this logic needs adjustment.
             // For the current STUB, this is okay.
             const existingLogoImg = currentLogoDisplay.querySelector('img');
             const existingLogoUrl = existingLogoImg ? existingLogoImg.src : '';

             // The STUB handles keeping the old logo if 'logoFile' is not sent.
             // If we wanted a "clear logo" feature, we'd add a checkbox and send
             // `formData.append('clearLogo', 'true')` or `formData.append('logo', '')`
             // when checked and no new file is selected. Without that UI element,
             // we assume no new file means "keep existing".
         }


        // Add the developer username for the backend (simulated or real API)
        // Ensure currentUser exists before accessing username
        if (currentUser && currentUser.username) {
            appDataToSend.append('developer', currentUser.username);
        } else {
             // This case should theoretically not happen if checkAuthAndRedirect worked,
             // but it's a safe fallback.
             showMessage('app-form-message', 'Erreur utilisateur : impossible de déterminer le développeur.', false);
             return;
        }


        // Show processing message using uiHelpers
        showMessage('app-form-message', 'Traitement des données de l\'application...', true); // Translated message


        let result;
        const editingAppId = appIdInput.value;

        if (editingAppId) { // Editing existing app
            result = await updateApp(editingAppId, appDataToSend); // Pass FormData
        } else { // Adding new app
            result = await addApp(appDataToSend); // Pass FormData
        }

        let result;
        const editingAppId = appIdInput.value;

        if (editingAppId) { // Editing existing app
            // Note: updateApp now expects FormData
            result = await updateApp(editingAppId, appDataToSend);
        } else { // Adding new app
             // Note: addApp now expects FormData
            result = await addApp(appDataToSend);
        }

        if (result.success) {
            showMessage('app-form-message', result.message, true);
            resetForm();
            // Reload apps and analytics
            await loadDeveloperAppsAndAnalytics();
        } else {
            // Display API error message using uiHelpers
            showMessage('app-form-message', result.message || 'Opération échouée.', false); // Translated message
        }
    });

    // Function to load and display developer's apps AND analytics
    // Combined these to ensure analytics always reflects the current app list state
    async function loadDeveloperAppsAndAnalytics() {
         if (!developerAppsList) {
             console.error("Developer apps list element not found.");
             return; // Cannot proceed if list element is missing
         }
        developerAppsList.innerHTML = ''; // Clear current list (the row's content)

         // Show loading message for apps and analytics
        showMessage('analytics-message', 'Chargement des applications et des statistiques...', true); // Translated message


         // Fetch apps for the *current logged-in developer*
         // Ensure currentUser exists before fetching
        if (!currentUser || !currentUser.username) {
             showMessage('analytics-message', 'Erreur utilisateur : impossible de charger les applications.', false);
             developerAppsList.innerHTML = '<div class="col"><p>Erreur lors du chargement de vos applications.</p></div>';
             return;
        }
        const apps = await getAppsByDeveloper(currentUser.username);


        if (!apps || apps.length === 0) {
            developerAppsList.innerHTML = '<div class="col"><p>Vous n\'avez pas encore soumis d\'applications.</p></div>'; // Translated default message, wrapped in col
            // Even if no apps, we still want to load analytics (which will show 0 for totals)
            await loadAnalytics(apps || []); // Pass empty array if fetch failed or returned null
            return; // Exit after handling empty case and loading analytics
        }

        // Render the apps
        apps.forEach(app => {
            // Use the createAppCard helper from uiHelpers.js
            const appCard = createAppCard(app, true); // true indicates developer context (shows edit/delete buttons)
            developerAppsList.appendChild(appCard);
        });

         // Now load analytics based on the fetched apps
        await loadAnalytics(apps); // Pass the fetched apps to loadAnalytics
    }


    // Function to load and display analytics
    async function loadAnalytics(apps) {
        if (!developerAnalyticsContent || !totalAppsMetric || !totalViewsMetric || !totalDownloadsMetric) {
            console.error("Analytics elements not found.");
            return; // Cannot proceed if analytics elements are missing
        }

        // In a real application, this would involve fetching analytics data
        // from a backend API specific to this developer.
        // Since we have a simulated backend, we'll simulate some metrics
        // based on the list of apps provided.

        // Clear previous chart instances before creating new ones
        if (viewsChartInstance) {
            viewsChartInstance.destroy();
            viewsChartInstance = null;
        }
        if (downloadsChartInstance) {
            downloadsChartInstance.destroy();
            downloadsChartInstance = null;
        }


        // Simulate metrics based on the fetched apps
        const totalApps = apps.length;

        // Simulate random views and downloads if not already present (persistence doesn't matter in the stub)
        let totalSimulatedViews = 0;
        let totalSimulatedDownloads = 0;

        // Arrays for chart data
        const appNames = [];
        const appViews = [];
        const appDownloads = [];

        apps.forEach(app => {
            // Ensure properties exist or assign initial random ones for the stub
            if (typeof app.simulatedViews === 'undefined') {
                // Assign initial random views/downloads if not already present (e.g., from pre-populated data)
                 app.simulatedViews = Math.floor(Math.random() * 1000) + 50; // 50-1050 views
            }
             if (typeof app.simulatedDownloads === 'undefined') {
                app.simulatedDownloads = Math.floor(Math.random() * 200) + 10; // 10-210 downloads
            }

            totalSimulatedViews += app.simulatedViews;
            totalSimulatedDownloads += app.simulatedDownloads;

             // Add data for charts
            appNames.push(app.name || `App ${app.id}`); // Use ID as fallback name
            appViews.push(app.simulatedViews);
            appDownloads.push(app.simulatedDownloads);
        });


        // Display the total metrics
        totalAppsMetric.textContent = totalApps;
        totalViewsMetric.textContent = totalSimulatedViews.toLocaleString(); // Format number
        totalDownloadsMetric.textContent = totalSimulatedDownloads.toLocaleString(); // Format number


        // Render the charts if canvas elements exist and there are apps
        if (apps.length > 0 && viewsChartCanvas && downloadsChartCanvas) {
            const viewsCtx = viewsChartCanvas.getContext('2d');
            const downloadsCtx = downloadsChartCanvas.getContext('2d');

            // Create Views Chart
            viewsChartInstance = new Chart(viewsCtx, {
                type: 'bar', // Bar chart
                data: {
                    labels: appNames, // App names on X axis
                    datasets: [{
                        label: 'Simulated Views', // Translated label?
                        data: appViews, // Views data
                        backgroundColor: 'rgba(0, 188, 212, 0.6)', // Teal color
                        borderColor: 'rgba(0, 188, 212, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow charts to take up more space
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Nombre de Vues (Simulé)' // Translated Y-axis title
                            }
                        },
                         x: {
                            title: {
                                display: true,
                                text: 'Application' // Translated X-axis title
                            }
                        }
                    },
                     plugins: {
                         legend: {
                             display: false // Hide dataset legend
                         },
                          title: {
                            display: true,
                            text: 'Vues par Application (Simulé)' // Translated chart title
                         },
                         tooltip: {
                             callbacks: {
                                 title: function(tooltipItems) {
                                     // Display App Name in tooltip title
                                     return tooltipItems[0].label;
                                 },
                                  label: function(tooltipItem) {
                                     // Display Views in tooltip label
                                      return `Vues : ${tooltipItem.raw.toLocaleString()}`; // Translated label
                                  }
                             }
                         }
                     }
                }
            });

            // Create Downloads Chart
            downloadsChartInstance = new Chart(downloadsCtx, {
                type: 'bar', // Bar chart
                data: {
                    labels: appNames, // App names on X axis
                    datasets: [{
                        label: 'Simulated Downloads', // Translated label?
                        data: appDownloads, // Downloads data
                        backgroundColor: 'rgba(46, 204, 113, 0.6)', // Success color
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    }]
                },
                 options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow charts to take up more space
                    scales: {
                        y: {
                            beginAtZero: true,
                             title: {
                                display: true,
                                text: 'Nombre de Téléchargements (Simulé)' // Translated Y-axis title
                            }
                        },
                         x: {
                            title: {
                                display: true,
                                text: 'Application' // Translated X-axis title
                            }
                        }
                    },
                    plugins: {
                         legend: {
                             display: false // Hide dataset legend
                         },
                         title: {
                            display: true,
                            text: 'Téléchargements par Application (Simulé)' // Translated chart title
                         },
                         tooltip: {
                             callbacks: {
                                 title: function(tooltipItems) {
                                     // Display App Name in tooltip title
                                     return tooltipItems[0].label;
                                 },
                                  label: function(tooltipItem) {
                                      // Display Downloads in tooltip label
                                      return `Téléchargements : ${tooltipItem.raw.toLocaleString()}`; // Translated label
                                  }
                             }
                         }
                     }
                }
            });
             // Clear loading message after charts are rendered
             clearMessagesAndErrors();

        } else if (apps.length === 0) {
            // If no apps, clear loading message and show message
             clearMessagesAndErrors();
             showMessage('analytics-message', 'Soumettez des applications pour voir les statistiques.', true); // Translated message
        } else {
             // If canvases weren't found, show an error message
             clearMessagesAndErrors();
             showMessage('analytics-message', 'Erreur : Éléments de graphique introuvables.', false); // Translated error
        }

    }


    // Event delegation for edit and delete buttons on the app list (which is now a row)
    // Target the column div, as it contains the app ID data attribute
    developerAppsList.addEventListener('click', async (e) => {
        // Check if the clicked element or its closest ancestor is an edit or delete button
        const editBtn = e.target.closest('.edit-app-btn');
        const deleteBtn = e.target.closest('.delete-app-btn');
        // card class is now on the div *inside* the col div
        // const card = e.target.closest('.card'); // Not needed to get app ID

         // The app ID is now on the parent column div
        const colDiv = e.target.closest('.col[data-app-id]');

        if (!colDiv) return; // Click wasn't inside an app card column

        const appId = colDiv.dataset.appId;

        if (editBtn) {
             e.preventDefault(); // Prevent default button click behavior
            // Fetch the specific app data for editing
            const appToEdit = await getAppById(appId); // Assumes getAppById is available
            if (appToEdit) {
                populateFormForEdit(appToEdit); // Populate the form with app data
            } else {
                 showMessage('app-form-message', 'Impossible de récupérer les détails de l\'application pour modification.', false); // Translated message
            }
        } else if (deleteBtn) {
             e.preventDefault(); // Prevent default button click behavior
            // Confirm deletion
            if (confirm('Êtes-vous sûr de vouloir supprimer cette application ? Cette action est irréversible.')) { // Translated confirmation
                // Call deleteApp function
                showMessage('app-form-message', 'Suppression de l\'application...', true); // Translated message
                const result = await deleteApp(appId); // Assumes deleteApp is available
                if (result.success) {
                    showMessage('app-form-message', result.message, true);
                    // Reload apps and analytics after deletion
                    await loadDeveloperAppsAndAnalytics();
                } else {
                    showMessage('app-form-message', result.message || 'Échec de la suppression de l\'application.', false); // Translated message
                }
            }
        }
    });

    // Function to populate the form when editing an app
    function populateFormForEdit(app) {
        // Set the hidden ID field
        appIdInput.value = app.id;

        // Populate form fields with app data
        appNameInput.value = app.name;
        appDescriptionInput.value = app.description;
        // File input cannot be programmatically set for security, clear any existing selection
        appLogoFileInput.value = ''; // This clears the selected file

        appPriceInput.value = app.price;
        appPlatformSelect.value = app.platform;
        appApkLinkInput.value = app.apkLink;
        appIosLinkInput.value = app.iosLink;

        // Handle logo preview and current logo display
        // Clear and hide the new logo preview when populating for edit
        if (newLogoPreview) newLogoPreview.style.display = 'none';
        if (newLogoPreviewImg) newLogoPreviewImg.src = '#';
         // Clear any previous file error
         appLogoFileError.textContent = '';


        // Display current logo if it exists
        currentLogoDisplay.innerHTML = ''; // Clear previous display
        if (app.logo) {
             currentLogoDisplay.style.display = 'block';
            const currentLogoImg = document.createElement('img');
            currentLogoImg.src = app.logo;
            currentLogoImg.alt = 'Current Logo'; // Translated alt text
            // Apply some basic styling to the current logo image
            // These styles match the ones in uiHelpers for card logo but applied directly
            currentLogoImg.style.maxWidth = '150px';
            currentLogoImg.style.maxHeight = '150px';
            currentLogoImg.style.borderRadius = '10px'; // Keep custom border-radius for current display
            currentLogoImg.style.objectFit = 'cover';
             currentLogoImg.classList.add('img-thumbnail', 'mb-2'); // Add Bootstrap styling
            currentLogoDisplay.appendChild(currentLogoImg);
            // Optionally show the current logo URL below the image
             const urlParagraph = document.createElement('p');
             urlParagraph.classList.add('mb-2'); // Add margin below
             urlParagraph.innerHTML = `<small>Logo actuel : <a href="${app.logo}" target="_blank" rel="noopener noreferrer">${app.logo}</a></small>`; // Translated text
             currentLogoDisplay.appendChild(urlParagraph);

        } else {
             // Explicitly show message if no current logo
             currentLogoDisplay.innerHTML = '<p><small>Pas de logo actuel.</small></p>'; // Translated message
             currentLogoDisplay.style.display = 'block'; // Still show the container for the "No current logo" message
        }

        // Change button text and show cancel button
        submitAppBtn.textContent = 'Mettre à jour l\'application'; // Translated button text
        cancelEditBtn.style.display = 'inline-block';

        // Ensure logo preview container is visible (it contains both current and new previews)
        if (logoPreviewContainer) logoPreviewContainer.style.display = 'block';

        // Update section heading
        document.querySelector('#add-app-section h2').innerHTML = '<i class="fas fa-edit"></i> Modifier l\'application'; // Translated heading

        // Clear form messages/errors from previous submissions
        clearMessagesAndErrors(); // Clear form messages too

        // Scroll to the form
        window.scrollTo(0, addAppForm.offsetTop - 20);
    }


    // Initial load of the developer's apps and analytics when the page loads
    // Need to await both. Load apps first as analytics uses app data.
    await loadDeveloperAppsAndAnalytics(); // Start the initial loading process


});
    async function loadDeveloperApps() {
        if (!developerAppsList) return;
        developerAppsList.innerHTML = ''; // Clear current list
         // Fetch apps for the *current logged-in developer*
        const apps = await getAppsByDeveloper(currentUser.username);
        if (!apps || apps.length === 0) {
            developerAppsList.innerHTML = '<div class="col"><p>Vous n\'avez pas encore soumis d\'applications.</p></div>'; // Translated default message, wrapped in col
            return apps; // Return the empty array for analytics
        }
        apps.forEach(app => {
            // Use the createAppCard helper from uiHelpers.js
            const appCard = createAppCard(app, true); // true indicates developer context (shows edit/delete buttons)
            developerAppsList.appendChild(appCard);
        });
         return apps; // Return the loaded apps for analytics
    }

    // Function to load and display analytics
    async function loadAnalytics() {
        if (!developerAnalyticsContent || !totalAppsMetric || !totalViewsMetric || !totalDownloadsMetric) return;

        // In a real application, this would involve fetching analytics data
        // from a backend API specific to this developer.
        // Since we have a simulated backend, we'll simulate some metrics
        // based on the list of apps.

        showMessage('analytics-message', 'Chargement des statistiques...', true); // Translated message

        // Re-fetch the developer's apps to get the latest count
        const apps = await getAppsByDeveloper(currentUser.username);

        if (!apps) {
            showMessage('analytics-message', 'Erreur lors du chargement des statistiques.', false); // Translated error
            totalAppsMetric.textContent = '-';
            totalViewsMetric.textContent = '-';
            totalDownloadsMetric.textContent = '-';
            return;
        }

        // Simulate metrics based on the fetched apps
        const totalApps = apps.length;

        // Simulate random views and downloads (persistence doesn't matter in the stub)
        // Assign simulated views/downloads to each app object for demonstration
        // In a real system, this data would come from a database.
        let totalSimulatedViews = 0;
        let totalSimulatedDownloads = 0;

        apps.forEach(app => {
            // Ensure properties exist or default to 0
            if (typeof app.simulatedViews === 'undefined') {
                // Assign initial random views/downloads if not already present (e.g., from pre-populated data)
                 app.simulatedViews = Math.floor(Math.random() * 1000) + 50; // 50-1050 views
                 app.simulatedDownloads = Math.floor(Math.random() * 200) + 10; // 10-210 downloads
            }
            totalSimulatedViews += app.simulatedViews;
            totalSimulatedDownloads += app.simulatedDownloads;
        });

        // Display the metrics
        totalAppsMetric.textContent = totalApps;
        totalViewsMetric.textContent = totalSimulatedViews.toLocaleString(); // Format number
        totalDownloadsMetric.textContent = totalSimulatedDownloads.toLocaleString(); // Format number

        showMessage('analytics-message', 'Statistiques chargées.', true); // Translated success message (optional, might disappear fast)
         // Clear success message after a delay
         setTimeout(() => {
              if (analyticsMessageDiv && analyticsMessageDiv.classList.contains('alert-success')) {
                 analyticsMessageDiv.classList.remove('d-block', 'alert-success');
                 analyticsMessageDiv.classList.add('d-none');
                 analyticsMessageDiv.textContent = '';
              }
         }, 2000); // Clear success message after 2 seconds

    }


    // Event delegation for edit and delete buttons on the app list
    developerAppsList.addEventListener('click', async (e) => {
        // Check if the clicked element or its closest ancestor is an edit or delete button
        const editBtn = e.target.closest('.edit-app-btn');
        const deleteBtn = e.target.closest('.delete-app-btn');
        // card class is now on the div *inside* the col div
        const card = e.target.closest('.card'); // Find the closest card
         // The app ID is now on the parent column div
        const colDiv = e.target.closest('.col[data-app-id]');

        if (!colDiv) return; // Click wasn't inside an app card column

        const appId = colDiv.dataset.appId;

        if (editBtn) {
             e.preventDefault(); // Prevent default button click behavior
            // Fetch the specific app data for editing
            const appToEdit = await getAppById(appId);
            if (appToEdit) {
                populateFormForEdit(appToEdit); // Populate the form with app data
            } else {
                 showMessage('app-form-message', 'Impossible de récupérer les détails de l\'application pour modification.', false); // Translated message
            }
        } else if (deleteBtn) {
             e.preventDefault(); // Prevent default button click behavior
            // Confirm deletion
            if (confirm('Êtes-vous sûr de vouloir supprimer cette application ? Cette action est irréversible.')) { // Translated confirmation
                // Call deleteApp function
                showMessage('app-form-message', 'Suppression de l\'application...', true); // Translated message
                const result = await deleteApp(appId);
                if (result.success) {
                    showMessage('app-form-message', result.message, true);
                    await loadDeveloperApps(); // Reload the list after deletion
                     await loadAnalytics(); // Reload analytics after app changes
                } else {
                    showMessage('app-form-message', result.message || 'Échec de la suppression de l\'application.', false); // Translated message
                }
            }
        }
    });

    // Function to populate the form when editing an app
    function populateFormForEdit(app) {
        // Set the hidden ID field
        appIdInput.value = app.id;

        // Populate form fields with app data
        appNameInput.value = app.name;
        appDescriptionInput.value = app.description;
        // File input cannot be programmatically set for security, clear any existing selection
        appLogoFileInput.value = ''; // This clears the selected file

        appPriceInput.value = app.price;
        appPlatformSelect.value = app.platform;
        appApkLinkInput.value = app.apkLink;
        appIosLinkInput.value = app.iosLink;

        // Handle logo preview and current logo display
        // Clear and hide the new logo preview when populating for edit
        if (newLogoPreview) newLogoPreview.style.display = 'none';
        if (newLogoPreviewImg) newLogoPreviewImg.src = '#';
         // Clear any previous file error
         appLogoFileError.textContent = '';


        // Display current logo if it exists
        currentLogoDisplay.innerHTML = ''; // Clear previous display
        if (app.logo) {
             currentLogoDisplay.style.display = 'block';
            const currentLogoImg = document.createElement('img');
            currentLogoImg.src = app.logo;
            currentLogoImg.alt = 'Current Logo'; // Translated alt text
            // Apply some basic styling to the current logo image
            currentLogoImg.style.maxWidth = '150px';
            currentLogoImg.style.maxHeight = '150px';
            currentLogoImg.style.borderRadius = '10px';
            currentLogoImg.style.objectFit = 'cover';
             currentLogoImg.classList.add('img-thumbnail', 'mb-2'); // Add Bootstrap styling
            currentLogoDisplay.appendChild(currentLogoImg);
            // Optionally show the current logo URL
            currentLogoDisplay.innerHTML += `<p><small>Logo actuel : <a href="${app.logo}" target="_blank" rel="noopener noreferrer">${app.logo}</a></small></p>`; // Translated text
        } else {
             // Explicitly show message if no current logo
             currentLogoDisplay.innerHTML = '<p><small>Pas de logo actuel.</small></p>'; // Translated message
             currentLogoDisplay.style.display = 'block'; // Still show the container for the "No current logo" message
        }

        // Change button text and show cancel button
        submitAppBtn.textContent = 'Mettre à jour l\'application'; // Translated button text
        cancelEditBtn.style.display = 'inline-block';

        // Ensure logo preview container is visible (it contains both current and new previews)
        if (logoPreviewContainer) logoPreviewContainer.style.display = 'block';

        // Update section heading
        document.querySelector('#add-app-section h2').innerHTML = '<i class="fas fa-edit"></i> Modifier l\'application'; // Translated heading

        // Clear form messages/errors from previous submissions
        clearErrors();

        // Scroll to the form
        window.scrollTo(0, addAppForm.offsetTop - 20);
    }


    // Initial load of the developer's apps and analytics when the page loads
    // Need to await both. Load apps first as analytics uses app data.
    const loadedApps = await loadDeveloperApps(); // Await the initial loading of apps
     if (loadedApps) { // Only load analytics if apps fetch was successful (even if empty array)
         await loadAnalytics(); // Then load analytics based on the apps
     }


});
    
