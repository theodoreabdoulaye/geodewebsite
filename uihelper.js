
// GEODE UI Helpers Module
// Provides common functions for manipulating the UI, like modals and messages.

/**
 * Displays a message in a designated element using Bootstrap alert styles.
 * @param {string} elementId - The ID of the HTML element to display the message in.
 * @param {string} message - The message text.
 * @param {boolean} isSuccess - True for success message (green), false for error message (red).
 */
function showMessage(elementId, message, isSuccess = true) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        // Use Bootstrap alert classes
        el.className = 'alert mt-3'; // Reset classes and add Bootstrap alert base class with margin-top
        el.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
        el.setAttribute('role', 'alert'); // Add ARIA role
        el.style.display = 'block'; // Ensure it's visible

        // Automatically hide after 5 seconds
        setTimeout(() => {
            // Use Bootstrap display utility to hide
            el.classList.remove('d-block'); // Remove block display
            el.classList.add('d-none'); // Add none display
             el.textContent = ''; // Clear text when hidden
        }, 5000);
         // Ensure it's initially block if it was hidden
         el.classList.remove('d-none');
         el.classList.add('d-block');
    }
}

// Modal Functionality (Keeping custom modal for simplicity with existing CSS)
function initializeModal(modalId, openButtonClass, closeButtonClass) {
    const modal = document.getElementById(modalId);
    // Use querySelector for more flexibility in finding the close button
    const closeBtn = modal ? modal.querySelector(closeButtonClass) : null;

    if (!modal || !closeBtn) {
        // console.warn(`Modal or close button not found for ${modalId}`);
        return { openModal: () => {}, closeModal: () => {} };
    }

    const openModal = (contentSetter) => {
        if (contentSetter && typeof contentSetter === 'function') {
            contentSetter(); // Call function to populate modal content
        }
        modal.style.display = "block";
        document.body.classList.add('modal-open'); // Optional: Add class to body to prevent scrolling
    };

    const closeModal = () => {
        modal.style.display = "none";
         document.body.classList.remove('modal-open'); // Optional: Remove class from body
    };

    closeBtn.onclick = closeModal;

    // Close modal when clicking outside of the modal content
    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    // Note: Attaching listeners to open buttons is done by page-specific JS
    // using event delegation on the container of the app cards.
    return { openModal, closeModal };
}

// Helper to create app card HTML (used by both developer and user pages)
// Now uses Bootstrap card and grid classes
function createAppCard(app, isDeveloperContext = false) {
    // Create a column div which will contain the card
    const colDiv = document.createElement('div');
    // Use Bootstrap grid column classes - col-12, col-md-6, col-lg-4 etc.
    // These classes are added to the row in the HTML (e.g., row-cols-md-2)
    // We just need to ensure it's a column item in the grid.
    colDiv.className = 'col'; // Add 'col' class for Bootstrap grid item
    colDiv.dataset.appId = app.id; // Attach app ID to the column element

    // Create the card element itself
    const card = document.createElement('div');
    card.className = 'card h-100'; // Bootstrap card class, h-100 for equal height

    let logoHtml = '';
    // Use Bootstrap classes for logo styling within the card
    const logoClass = 'img-fluid rounded-3 mb-2'; // Responsive image, rounded corners, bottom margin
    const placeholderClass = 'app-logo-placeholder rounded-3 mb-2 d-flex align-items-center justify-content-center bg-light'; // Custom placeholder styles + Bootstrap flex utilities

    if (app.logo) {
        // Add custom app-logo class for potential additional styling if needed
        logoHtml = `<img src="${app.logo}" alt="Logo ${app.name}" class="${logoClass} app-logo" style="width: 80px; height: 80px; object-fit: cover;">`; // Fixed size for card view
    } else {
        let platformIcon = 'fa-mobile-alt'; // Generic
        if (app.platform === 'Android') platformIcon = 'fa-android';
        if (app.platform === 'iOS') platformIcon = 'fa-apple';
        // Add custom app-logo-placeholder class
        logoHtml = `<div class="${placeholderClass} app-logo-placeholder" style="width: 80px; height: 80px;"><i class="fab ${platformIcon} text-muted fs-4"></i></div>`; // Fixed size, muted icon, larger font size
    }

    const descriptionShort = app.description && app.description.length > 100 ? app.description.substring(0, 97) + "..." : (app.description || 'Aucune description.'); // Translated fallback

    // Create the card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column'; // Bootstrap card body, use flex column to push buttons down

    // Populate card body inner HTML
    cardBody.innerHTML = `
        <div class="d-flex justify-content-center mb-2">${logoHtml}</div> <!-- Center logo -->
        <h5 class="card-title mb-2 text-primary">${app.name || 'Application Sans Titre'}</h5> <!-- Translated fallback, Bootstrap title, primary color -->
        ${!isDeveloperContext ? `<h6 class="card-subtitle mb-2 text-muted">Par: ${app.developer || 'Développeur Inconnu'}</h6>` : ''} <!-- Translated subtitle, muted text -->
        <p class="card-text mb-2"><strong class="text-warning"><i class="fas fa-tag me-1"></i> ${app.price || 'N/A'}</strong></p> <!-- Bootstrap text, warning color -->
        <span class="badge bg-secondary mb-2">${app.platform || 'Plateforme Inconnue'}</span> <!-- Bootstrap badge, secondary color, translated fallback -->
        <p class="card-text small app-description-short">${descriptionShort}</p> <!-- Bootstrap text, small font size -->
        <div class="mt-auto d-flex justify-content-end gap-2 actions"> <!-- Push actions to bottom, Bootstrap flex utilities, gap -->
            ${isDeveloperContext ? `
                <button class="btn btn-sm btn-primary edit-app-btn"><i class="fas fa-edit me-1"></i> Modifier</button> <!-- Translated -->
                <button class="btn btn-sm btn-danger delete-app-btn"><i class="fas fa-trash me-1"></i> Supprimer</button> <!-- Translated -->
            ` : `
                <button class="btn btn-sm btn-info view-details-btn"><i class="fas fa-info-circle me-1"></i> Détails</button> <!-- Translated -->
            `}
        </div>
    `;

    // Append card body to card, and card to column div
    card.appendChild(cardBody);
    colDiv.appendChild(card);

    return colDiv; // Return the column div containing the card
}
    
