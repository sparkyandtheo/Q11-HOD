// js/ui/equipment-handler.js
import { $ } from './dom.js';

const equipmentFieldIds = [
    'door','operator','floorCeiling','floorObstruction','construction','backroom','sideroom','headroom','power','color','jambs','floor','spring','weatherstop',
    'doorSizeWidthFt', 'doorSizeWidthIn', 'doorSizeHeightFt', 'doorSizeHeightIn'
];

function getDropdownOptions(max, suffix = '') {
    let options = '<option value=""></option>';
    for (let i = 0; i <= max; i++) {
        options += `<option value="${i}${suffix}">${i}${suffix}</option>`;
    }
    return options;
}

function getEquipmentPanelHTML(index, doorData) {
    const i = index;
    const isOpen = index === window.appState.currentEquipmentData.length - 1;

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

export function renderEquipmentTabs() {
    const accordionContainer = $('equipment-accordion-container');
    if (!accordionContainer) return;

    const autoSaveHandler = window.appState.handleAutoSave;

    accordionContainer.innerHTML = ''; 

    if (!window.appState.currentEquipmentData || window.appState.currentEquipmentData.length === 0) {
        return;
    }

    window.appState.currentEquipmentData.forEach((doorData, index) => {
        const panelHTML = getEquipmentPanelHTML(index, doorData);
        accordionContainer.insertAdjacentHTML('beforeend', panelHTML);
        
        const panel = accordionContainer.querySelector(`[data-equipment-index="${index}"]`);
        equipmentFieldIds.forEach(fieldId => {
            const input = panel.querySelector(`[data-field="${fieldId}"]`);
            if (input) {
                input.value = doorData[fieldId] || '';
                input.addEventListener('input', (e) => {
                    const currentPanel = e.target.closest('.equipment-accordion');
                    const currentIdx = parseInt(currentPanel.dataset.equipmentIndex, 10);
                    const field = e.target.dataset.field;
                    window.appState.currentEquipmentData[currentIdx][field] = e.target.value;
                    
                    if (field === 'door') {
                        const headerSpan = currentPanel.querySelector('summary span');
                        headerSpan.textContent = `Door ${currentIdx + 1}: ${e.target.value || 'New Door'}`;
                    }
                    autoSaveHandler();
                });
            }
        });
    });
}

export function addEquipmentTab() {
    const newDoorData = {};
    equipmentFieldIds.forEach(id => newDoorData[id] = '');
    
    if (!Array.isArray(window.appState.currentEquipmentData)) {
        window.appState.currentEquipmentData = [];
    }
    
    window.appState.currentEquipmentData.push(newDoorData);
    renderEquipmentTabs();
    window.appState.handleAutoSave();
}

export function deleteEquipmentTab(indexToDelete) {
    if (!confirm(`Are you sure you want to delete Door ${indexToDelete + 1}?`)) return;
    
    window.appState.currentEquipmentData.splice(indexToDelete, 1);
    renderEquipmentTabs();
    window.appState.handleAutoSave();
}
