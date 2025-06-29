// js/main.js

import { initAuth, login, logout } from './auth.js';
import { listenForRecords, detachRecordsListener, persistRecord, deleteRecord } from './database.js';
import { $, notify } from './ui/dom.js';
import { getFormData, setFormData, clearForm, prefillDates, updateDocIdDisplay, updateQuoteContactDisplay } from './ui/form-handler.js';
import { renderEquipmentTabs, addEquipmentTab, deleteEquipmentTab } from './ui/equipment-handler.js';
import { renderSearchResults, clearSearchResults, handleSearchKeystrokes } from './ui/search-handler.js';
import { renderSummary, clearSummary } from './ui/summary-view.js';
import { generateServiceTicketOutput, generateQuoteOutput, printRecord, sendEmail, generatePaymentPDF } from './ui/output-generators.js';
import { updateLocationVisuals, handleStreetViewError, clearStreetViewError } from './ui/location-visuals.js';
import { setupTabs } from './ui/tabs.js';

// --- APPLICATION STATE ---
const appState = {
    currentUser: null,
    currentRecordData: {},
    currentEquipmentData: [],
    currentViewRecords: [],
    autoSaveTimer: null,
    
    handleAutoSave: () => {
        clearTimeout(appState.autoSaveTimer);
        appState.autoSaveTimer = setTimeout(() => appState.handleSaveRecord(false), 2000);
    },
    
    handleSaveRecord: async (isManual = false) => {
        if (!appState.currentUser) {
            notify("You must be logged in to save.");
            return;
        }
        const formData = getFormData(appState.currentEquipmentData);
        
        try {
            const id = await persistRecord(formData);
            appState.currentRecordData.id = id; // Update the ID in the state
            
            if (isManual) {
                notify('✅ Record Saved!');
            }
            renderSummary(formData); // Update summary on save
        } catch (error) {
            console.error("Failed to save record:", error);
            notify(`❌ Error saving record: ${error.message}`);
        }
    },

    loadRecord: (recordId) => {
        const recordToEdit = appState.currentViewRecords.find(r => r.id === recordId);
        if (recordToEdit) {
            appState.currentRecordData = { ...recordToEdit };
            appState.currentEquipmentData = recordToEdit.equipment || [];
            
            setFormData(recordToEdit, (data) => {
                renderEquipmentTabs();
                updateLocationVisuals(data.jobsite || '');
                updateDocIdDisplay(data.docId);
                updateQuoteContactDisplay();
                renderSummary(data);
            });

            notify('📝 Record loaded for editing.');
            window.scrollTo(0, 0);
            clearSearchResults();
            $('searchBox').value = '';
        }
    }
};
window.appState = appState;

// --- AUTH HANDLERS ---
function handleLogin(user) {
    appState.currentUser = user;
    $('loginScreen').style.display = 'none';
    $('mainAppContainer').style.display = 'block';
    $('profileSection').style.display = 'flex';
    $('userInfo').textContent = `Signed in as: ${user.displayName || user.email}`;
    const initialsInput = $('initials');
    if (initialsInput && user.displayName && !initialsInput.value) {
        const nameParts = user.displayName.split(' ');
        let initials = nameParts[0].substring(0, 1) + (nameParts.length > 1 ? nameParts[nameParts.length - 1].substring(0, 1) : '');
        initialsInput.value = initials.toUpperCase();
    }
}

function handleLogout() {
    appState.currentUser = null;
    detachRecordsListener();
    $('loginScreen').style.display = 'flex';
    $('mainAppContainer').style.display = 'none';
}

// --- DATA HANDLERS ---
function handleDataUpdate(records) {
    appState.currentViewRecords = records;
    if (document.activeElement === $('searchBox') && $('searchBox').value.length > 0) {
        renderSearchResults(records);
    }
}

function handleDataError(error) {
    notify('❌ Error loading records.');
    console.error(error);
}

// --- EVENT HANDLERS ---
function handleNewForm() {
    const newId = clearForm(false);
    appState.currentRecordData = { docId: newId, equipment: [] };
    appState.currentEquipmentData = [];
    renderEquipmentTabs();
    clearSummary();
    notify('Form cleared for new record.');
}

// --- INITIALIZATION ---
function initializeSettings() {
    const darkModeToggle = $('darkModeToggle');
    darkModeToggle?.addEventListener('change', (e) => {
        localStorage.setItem('darkMode', e.target.checked);
        document.documentElement.classList.toggle('dark-mode', e.target.checked);
    });
    if (localStorage.getItem('darkMode') === 'true') darkModeToggle.checked = true;

    const googleMapsApiKeyInput = $('googleMapsApiKey');
    if (googleMapsApiKeyInput) {
        googleMapsApiKeyInput.value = localStorage.getItem('googleMapsApiKey') || '';
    }
}

function bindEventListeners() {
    const mainContainer = $('mainAppContainer');
    const form = $('intakeForm');
    const searchBox = $('searchBox');

    if (mainContainer) {
        mainContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.id === 'logoutBtn') logout();
            if (target.id === 'newFormBtnTop') handleNewForm();
            if (target.id === 'saveBtn') appState.handleSaveRecord(true);
            if (target.id === 'genServiceTicketOutputBtn') generateServiceTicketOutput(getFormData(appState.currentEquipmentData));
            if (target.id === 'genQuoteOutputBtn') generateQuoteOutput(getFormData(appState.currentEquipmentData));
            if (target.id === 'printBtn') printRecord(getFormData(appState.currentEquipmentData));
            if (target.id === 'emailQuoteBtn') sendEmail('quote');
            if (target.id === 'emailInvoiceBtn') sendEmail('invoice');
            if (target.id === 'emailDepositBtn') sendEmail('depositReceipt');
            if (target.id === 'paymentPdfBtn') generatePaymentPDF();
            
            if (target.closest('#add-door-btn')) {
                addEquipmentTab();
            }
            if (target.closest('.menu-icon')) {
                $('menuDropdown').classList.toggle('show');
            }
            if (target.classList.contains('delete-door-btn')) {
                const index = parseInt(target.dataset.deleteIndex, 10);
                deleteEquipmentTab(index);
            }
            if (target.closest('.location-tab-btn')) {
                const view = target.dataset.view;
                document.querySelectorAll('.location-tab-btn').forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');
                
                $('mapView').style.display = (view === 'map') ? 'block' : 'none';
                $('streetViewImg').style.display = (view === 'streetview') ? 'block' : 'none';
            }
        });
    }
    
    if (searchBox) {
        searchBox.addEventListener('input', () => {
            const searchTerm = searchBox.value.trim();
            if(searchTerm.length > 0) {
                listenForRecords(searchTerm, handleDataUpdate, handleDataError);
            } else {
                clearSearchResults();
            }
        });
        searchBox.addEventListener('keydown', handleSearchKeystrokes);
        searchBox.addEventListener('blur', () => setTimeout(clearSearchResults, 200));
    }
    
    if(form) form.addEventListener('input', appState.handleAutoSave);
    
    const googleMapsApiKeyInput = $('googleMapsApiKey');
    if (googleMapsApiKeyInput) {
        googleMapsApiKeyInput.addEventListener('input', (e) => {
            localStorage.setItem('googleMapsApiKey', e.target.value);
            if ($('jobsite')) {
                updateLocationVisuals($('jobsite').value);
            }
        });
    }

    const phoneInput = $('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            const input = e.target.value.replace(/\D/g, '');
            const match = input.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (!match) return;
            let formatted = '';
            if (match[1]) formatted += `(${match[1]}`;
            if (match[2]) formatted += `) ${match[2]}`;
            if (match[3]) formatted += `-${match[3]}`;
            e.target.value = formatted;
        });
    }
    
    const poTypeInput = $('poType');
    if(poTypeInput) {
        poTypeInput.addEventListener('change', (e) => {
            const selection = e.target.value;
            $('poNumberGroup').style.display = (selection === 'PO Number') ? 'block' : 'none';
            $('verbalPoGroup').style.display = (selection === 'Verbal PO') ? 'block' : 'none';
            $('warrantyGroup').style.display = (selection === 'Warranty') ? 'block' : 'none';
            $('cc-info-group').style.display = (selection === 'CC on File') ? 'block' : 'none';
        });
    }
    
    const sameAsBillingCheckbox = $('sameAsBilling');
    if (sameAsBillingCheckbox) {
        sameAsBillingCheckbox.addEventListener('change', (e) => {
            if(e.target.checked) {
                $('jobsite').value = $('billing').value;
                $('jobsite').dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }
}

// --- Main Execution ---
function main() {
    document.addEventListener('DOMContentLoaded', () => {
        setupTabs();
        prefillDates();
        initializeSettings();
        bindEventListeners();
        initAuth(handleLogin, handleLogout);
    });
}

main();
