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
 * @param {Array} currentEquipmentData The current state of the equipment data array.
 * @returns {object} The form data.
 */
export function getFormData(currentEquipmentData) {
    const data = {};
    baseFieldIds.forEach(id => {
        if ($(id)) data[id] = $(id).value;
    });

    data.equipment = (currentEquipmentData || []).map((door, index) => {
        const doorData = { ...door }; // Start with existing data
        
        // Combine door size dropdowns into a single string
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
 * @param {function} onDataSet A callback function to run after data is set.
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
    
    $('tsNumber-main').value = data.tsNumber || '';
    if ($('poType')) $('poType').dispatchEvent(new Event('change'));
    
    onDataSet(data);
}

/**
 * Resets the form to its initial state.
 * @param {boolean} keepInitials - Whether to preserve the CSR initials.
 * @returns {string} The new unique ID for the form.
 */
export function clearForm(keepInitials) {
    const initialsValue = $('initials').value;
    const user = window.appState.currentUser;
    
    $('intakeForm').reset();
    
    if (keepInitials) {
        $('initials').value = initialsValue;
        $('keepInitials').checked = true;
    } else if (user?.displayName) {
        const nameParts = user.displayName.split(' ');
        let initials = nameParts[0].substring(0, 1);
        if (nameParts.length > 1) {
            initials += nameParts[nameParts.length - 1].substring(0, 1);
        }
        $('initials').value = initials.toUpperCase();
    }
    
    const newId = generateUniqueId();
    $('docId').value = newId;
    updateDocIdDisplay(newId);
    updateQuoteContactDisplay();
    prefillDates();
    delete $('intakeForm').dataset.editing;
    $('output').style.display = 'none';
    updateLocationVisuals('');
    document.querySelector('.tab-button[data-tab="meta"]').click();
    return newId;
}

export function prefillDates() {
    const now = new Date();
    if ($("current-date")) $("current-date").value = now.toLocaleDateString();
    if ($("current-time")) $("current-time").value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];
    if ($('installDate')) $('installDate').value = todayStr;
}

export function updateDocIdDisplay(id) {
    document.querySelectorAll('.doc-id-display').forEach(el => {
        el.textContent = id || '';
    });
}

export function updateQuoteContactDisplay() {
    const name = $('name').value || 'N/A';
    const phone = $('phone').value || 'N/A';
    const email = $('email').value || 'N/A';
    
    if($('quote-contact-name')) $('quote-contact-name').textContent = name;
    if($('quote-contact-phone')) $('quote-contact-phone').textContent = phone;
    if($('quote-contact-email')) $('quote-contact-email').textContent = email;
}
