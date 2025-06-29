// js/ui/form-handler.js

import { $ } from './dom.js';
import { updateLocationVisuals } from './location-visuals.js';
import { generateUniqueId } from './dom.js';

const baseFieldIds = [
  'billing','jobsite','name','phone','email','availability','request','notes',
  'paymentAccountName','paymentAccountNumber','paymentExpDate','paymentSecurityCode','billingChanges','depositAmount','remainingBalance','tsNumber','receiptMethod','initials',
  'poType', 'poNumberInput', 'verbalPoInput', 'directions', 'installDate', 'installer', 'warrantyTsNumber', 'callType', 'quotedAmount', 'googleMapsApiKey',
  'wePropose', 'leadTime', 'docId', 'siteSpecs'
];

/**
 * Gathers all data from the form fields into a single object.
 * This function now explicitly receives the current equipment data.
 * @param {Array} currentEquipmentData The current state of the equipment data array.
 * @returns {object} The form data.
 */
export function getFormData(currentEquipmentData) {
    const data = {};
    baseFieldIds.forEach(id => {
        if ($(id)) data[id] = $(id).value;
    });

    // Ensure equipment data is part of the returned form data
    data.equipment = (currentEquipmentData || []).map((door, index) => {
        const doorData = { ...door }; // Start with existing data
        
        // Combine door size dropdowns into a single string
        // Accessing these by ID as they are form elements
        const widthFt = $(`doorSizeWidthFt-${index}`)?.value || '';
        const widthIn = $(`doorSizeWidthIn-${index}`)?.value || '';
        const heightFt = $(`doorSizeHeightFt-${index}`)?.value || '';
        const heightIn = $(`doorSizeHeightIn-${index}`)?.value || '';
        if (widthFt || widthIn || heightFt || heightIn) {
            doorData.doorSize = `${widthFt} ${widthIn} x ${heightFt} ${heightIn}`.trim();
        } else {
            doorData.doorSize = '';
        }
        
        return doorData;
    });

    return data;
}

/**
 * Populates the form fields with data from a record object.
 * @param {object} data The record data to display.
 * @param {function} onDataSet A callback function to run after data is set (e.g., to trigger UI updates).
 */
export function setFormData(data, onDataSet) {
    baseFieldIds.forEach(id => {
        if ($(id)) {
           $(id).value = data[id] || '';
        }
    });
  
    if (data.id) {
        $('intakeForm').dataset.editing = data.id;
    } else {
        delete $('intakeForm').dataset.editing;
    }
    
    // Ensure the main TS Number display is updated
    $('tsNumber-main').value = data.tsNumber || '';
    
    // Trigger change event for poType to show/hide relevant fields
    if ($('poType')) $('poType').dispatchEvent(new Event('change'));
    
    // Execute callback after data is set
    if (onDataSet && typeof onDataSet === 'function') {
        onDataSet(data);
    }
}

/**
 * Resets the form to its initial state, generates a new ID, and pre-fills dates.
 * It now explicitly receives the user object for initials.
 * @param {boolean} keepInitials - Whether to preserve the CSR initials.
 * @param {object} user - The current authenticated user object (optional, for initials).
 * @returns {string} The new unique ID for the form.
 */
export function clearForm(keepInitials, user = null) {
    const initialsInput = $('initials');
    let initialsValue = '';

    // If 'keep initials' is checked, store current initials before resetting
    if (keepInitials && initialsInput) {
        initialsValue = initialsInput.value;
    }
    
    $('intakeForm').reset(); // Reset all form fields

    // Restore or set initials based on 'keepInitials' or logged-in user
    if (initialsInput) {
        if (keepInitials) {
            initialsInput.value = initialsValue;
            $('keepInitials').checked = true; // Ensure checkbox remains checked
        } else if (user?.displayName) {
            const nameParts = user.displayName.split(' ');
            let initials = nameParts[0].substring(0, 1);
            if (nameParts.length > 1) {
                initials += nameParts[nameParts.length - 1].substring(0, 1);
            }
            initialsInput.value = initials.toUpperCase();
        } else {
            initialsInput.value = ''; // Clear initials if no user and not keeping
        }
    }
    
    const newId = generateUniqueId();
    if ($('docId')) $('docId').value = newId; // Update the hidden docId field
    updateDocIdDisplay(newId); // Update all doc ID display elements
    updateQuoteContactDisplay(); // Clear or update quote contact info
    prefillDates(); // Set current date and time
    
    // Remove the 'editing' dataset attribute if present
    delete $('intakeForm').dataset.editing;
    
    // Hide the output area
    if ($('output')) $('output').style.display = 'none';
    
    // Clear and hide location visuals
    updateLocationVisuals('');
    
    // Switch back to the 'Meta' tab (assuming it's the default/first tab)
    const metaTabButton = document.querySelector('.tab-button[data-tab="meta"]');
    if (metaTabButton) metaTabButton.click();

    return newId;
}

/**
 * Prefills the current date and time into the respective form fields.
 */
export function prefillDates() {
    const now = new Date();
    // Use toLocaleDateString for date, and toLocaleTimeString for time with specific options
    if ($("current-date")) $("current-date").value = now.toLocaleDateString();
    if ($("current-time")) $("current-time").value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Set installDate to today's date in YYYY-MM-DD format
    const todayStr = now.toISOString().split('T')[0];
    if ($('installDate')) $('installDate').value = todayStr;
}

/**
 * Updates all elements with the class 'doc-id-display' with the given ID.
 * @param {string} id - The document ID to display.
 */
export function updateDocIdDisplay(id) {
    document.querySelectorAll('.doc-id-display').forEach(el => {
        el.textContent = id || '';
    });
}

/**
 * Updates the contact information displayed in the Quote tab.
 * Retrieves data directly from 'name', 'phone', 'email' fields.
 */
export function updateQuoteContactDisplay() {
    const name = $('name')?.value || 'N/A';
    const phone = $('phone')?.value || 'N/A';
    const email = $('email')?.value || 'N/A';
    
    if($('quote-contact-name')) $('quote-contact-name').textContent = name;
    if($('quote-contact-phone')) $('quote-contact-phone').textContent = phone;
    if($('quote-contact-email')) $('quote-contact-email').textContent = email;
}

