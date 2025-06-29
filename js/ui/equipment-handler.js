// js/ui/equipment-handler.js
import { $ } from './dom.js';

const equipmentFieldIds = [
    'door','operator','floorCeiling','floorObstruction','construction','backroom','sideroom','headroom','power','color','jambs','floor','spring','weatherstop',
    'doorSizeWidthFt', 'doorSizeWidthIn', 'doorSizeHeightFt', 'doorSizeHeightIn'
];

/**
 * Generates dropdown options for feet or inches.
 * @param {number} max - The maximum value for the dropdown.
 * @param {string} suffix - Suffix to append to each option (e.g., "'" for feet, '"' for inches).
 * @returns {string} HTML string of options.
 */
function getDropdownOptions(max, suffix = '') {
    let options = '<option value=""></option>';
    for (let i = 0; i <= max; i++) {
        options += `<option value="${i}${suffix}">${i}${suffix}</option>`;
    }
    return options;
}

/**
 * Generates the HTML structure for a single equipment accordion panel.
 * @param {number} index - The index of the door in the equipment array.
 * @param {object} doorData - The data for the specific door.
 * @param {number} totalDoors - The total number of doors, used to determine if this is the last one.
 * @returns {string} HTML string for the equipment panel.
 */
function getEquipmentPanelHTML(index, doorData, totalDoors) {
    const i = index;
    // Open the last added door by default for better UX
    const isOpen = index === totalDoors - 1;

    return `
        <details class="equipment-accordion" data-equipment-index="${i}" ${isOpen ? 'open' : ''}>
            <summary class="equipment-accordion-header">
                <span>Door ${i + 1}: ${doorData.door || 'New Door'}</span>
                <button type="button" class="delete-door-btn" data-delete-index="${i}" title="Delete Door ${i + 1}">×</button>
            </summary>
            <div class="equipment-accordion-content">
                <div class="form-group full-width">
                    <label>Door Size</label>
                    <div class="door-size-selector">
                        <select id="doorSizeWidthFt-${i}" data-field="doorSizeWidthFt">${getDropdownOptions(20, "'")}</select>
                        <select id="doorSizeWidthIn-${i}" data-field="doorSizeWidthIn">${getDropdownOptions(11, '"')}</select>
                        <span>&times;</span>
                        <select id="doorSizeHeightFt-${i}" data-field="doorSizeHeightFt">${getDropdownOptions(20, "'")}</select>
                        <select id="doorSizeHeightIn-${i}" data-field="doorSizeHeightIn">${getDropdownOptions(11, '"')}</select>
                    </div>
                </div>
                <div class="form-group full-width"><label for="door-${i}">Door Info</label><textarea id="door-${i}" data-field="door" rows="3"></textarea></div>
                <div class="form-group full-width"><label for="operator-${i}">Operator Info</label><textarea id="operator-${i}" data-field="operator" rows="3"></textarea></div>
                
                <div class="measurements-grid">
                    <div class="form-group"><label for="floorCeiling-${i}">Floor to Ceiling</label><input type="text" id="floorCeiling-${i}" data-field="floorCeiling" /></div>
                    <div class="form-group"><label for="floorObstruction-${i}">Floor to Lowest Obstruction</label><input type="text" id="floorObstruction-${i}" data-field="floorObstruction" /></div>
                    <div class="form-group"><label for="construction-${i}">Construction Type</label><input type="text" id="construction-${i}" data-field="construction" /></div>
                    <div class="form-group"><label for="backroom-${i}">Backroom</label><input type="text" id="backroom-${i}" data-field="backroom" /></div>
                    <div class="form-group"><label for="sideroom-${i}">Sideroom</label><input type="text" id="sideroom-${i}" data-field="sideroom" /></div>
                    <div class="form-group"><label for="headroom-${i}">Headroom</label><input type="text" id="headroom-${i}" data-field="headroom" /></div>
                    <div class="form-group"><label for="power-${i}">Power</label><input type="text" id="power-${i}" data-field="power" /></div>
                    <div class="form-group"><label for="color-${i}">Color</label><input type="text" id="color-${i}" data-field="color" /></div>
                    <div class="form-group"><label for="jambs-${i}">Jambs</label><input type="text" id="jambs-${i}" data-field="jambs" /></div>
                    <div class="form-group"><label for="floor-${i}">Floor</label><input type="text" id="floor-${i}" data-field="floor" /></div>
                    <div class="form-group"><label for="track-${i}">Track Radius</label><input type="text" id="track-${i}" data-field="track" /></div>
                    <div class="form-group"><label for="weatherstop-${i}">Weatherstop Color</label><input type="text" id="weatherstop-${i}" data-field="weatherstop" /></div>
                </div>
                <div class="form-group full-width"><label for="spring-${i}">Spring Info</label><textarea id="spring-${i}" data-field="spring" rows="3"></textarea></div>
            </div>
        </details>
    `;
}

/**
 * Renders all equipment tabs (accordions) based on the current equipment data.
 * It now accepts the currentEquipmentData and a callback for changes.
 * @param {Array} currentEquipmentData - The array holding all door equipment data.
 * @param {function} onDataChange - Callback function to notify when equipment data changes (e.g., auto-cache).
 */
export function renderEquipmentTabs(currentEquipmentData, onDataChange) {
    const accordionContainer = $('equipment-accordion-container');
    if (!accordionContainer) return;

    accordionContainer.innerHTML = ''; // Clear existing accordions

    if (!currentEquipmentData || currentEquipmentData.length === 0) {
        return; // No equipment to render
    }

    currentEquipmentData.forEach((doorData, index) => {
        // Generate HTML for each panel and insert it
        const panelHTML = getEquipmentPanelHTML(index, doorData, currentEquipmentData.length);
        accordionContainer.insertAdjacentHTML('beforeend', panelHTML);
        
        // Find the newly added panel to attach event listeners
        const panel = accordionContainer.querySelector(`[data-equipment-index="${index}"]`);
        
        // Populate fields and attach input listeners for each field in the panel
        equipmentFieldIds.forEach(fieldId => {
            const input = panel.querySelector(`[data-field="${fieldId}"]`);
            if (input) {
                input.value = doorData[fieldId] || ''; // Set initial value from data
                
                // Add event listener for input changes to update state and trigger auto-save
                input.addEventListener('input', (e) => {
                    const currentPanel = e.target.closest('.equipment-accordion');
                    const currentIdx = parseInt(currentPanel.dataset.equipmentIndex, 10);
                    const field = e.target.dataset.field;
                    
                    // Update the specific field in the current equipment data array
                    currentEquipmentData[currentIdx][field] = e.target.value;
                    
                    // Update the accordion header if the 'door' field changes
                    if (field === 'door') {
                        const headerSpan = currentPanel.querySelector('summary span');
                        headerSpan.textContent = `Door ${currentIdx + 1}: ${e.target.value || 'New Door'}`;
                    }
                    
                    // Trigger the provided callback (e.g., auto-cache)
                    onDataChange();
                });
            }
        });
    });
}

/**
 * Adds a new empty equipment tab (accordion) to the form.
 * It now accepts the currentEquipmentData and a callback for changes.
 * @param {Array} currentEquipmentData - The array holding all door equipment data.
 * @param {function} onDataChange - Callback function to notify when equipment data changes (e.g., auto-cache).
 */
export function addEquipmentTab(currentEquipmentData, onDataChange) {
    const newDoorData = {};
    // Initialize all fields for the new door as empty strings
    equipmentFieldIds.forEach(id => newDoorData[id] = '');
    
    // Ensure currentEquipmentData is an array before pushing
    if (!Array.isArray(currentEquipmentData)) {
        console.warn('currentEquipmentData is not an array. Initializing as empty array.');
        currentEquipmentData = [];
    }
    
    currentEquipmentData.push(newDoorData); // Add new empty door to the array
    renderEquipmentTabs(currentEquipmentData, onDataChange); // Re-render all tabs to include the new one
    onDataChange(); // Trigger auto-cache after adding a new door
}

/**
 * Deletes an equipment tab (accordion) by its index.
 * It now accepts the index, currentEquipmentData, and a callback for changes.
 * @param {number} indexToDelete - The index of the door to delete.
 * @param {Array} currentEquipmentData - The array holding all door equipment data.
 * @param {function} onDataChange - Callback function to notify when equipment data changes (e.g., auto-cache).
 */
export function deleteEquipmentTab(indexToDelete, currentEquipmentData, onDataChange) {
    // Confirmation dialog before deletion (consider custom modal instead of native confirm)
    if (!confirm(`Are you sure you want to delete Door ${indexToDelete + 1}?`)) return;
    
    currentEquipmentData.splice(indexToDelete, 1); // Remove the door from the array
    renderEquipmentTabs(currentEquipmentData, onDataChange); // Re-render remaining tabs
    onDataChange(); // Trigger auto-cache after deletion
}

