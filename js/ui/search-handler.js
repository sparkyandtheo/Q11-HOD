// js/ui/search-handler.js
import { $ } from './dom.js';

let activeIndex = -1;
let results = []; // Stores the current search results for keyboard navigation

/**
 * Renders the search results in the dropdown.
 * It now accepts a callback function to load a record.
 * @param {Array<object>} records - The array of records to display.
 * @param {function} loadRecordHandler - Callback function to load a specific record.
 */
export function renderSearchResults(records, loadRecordHandler) {
    const searchResultsContainer = $('searchResults');
    results = records; // Update global results for keyboard navigation
    activeIndex = -1; // Reset active index

    if (records.length === 0) {
        searchResultsContainer.style.display = 'none'; // Hide if no results
        return;
    }

    searchResultsContainer.innerHTML = ''; // Clear previous results
    records.forEach((record, index) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.recordId = record.id; // Store record ID for easy retrieval
        item.innerHTML = `
            <strong>${record.name || 'No Name'}</strong>
            <small>${record.jobsite || 'No Address'}</small>
        `;
        // Attach click listener, using the passed loadRecordHandler
        item.addEventListener('click', () => {
            loadRecordHandler(record.id); // Use the provided handler
            clearSearchResults(); // Clear results after selection
        });
        searchResultsContainer.appendChild(item);
    });

    searchResultsContainer.style.display = 'block'; // Show the results dropdown
}

/**
 * Clears the search results dropdown and resets internal state.
 */
export function clearSearchResults() {
    const searchResultsContainer = $('searchResults');
    searchResultsContainer.innerHTML = '';
    searchResultsContainer.style.display = 'none';
    results = [];
    activeIndex = -1;
}

/**
 * Handles keyboard strokes for navigation within search results.
 * @param {KeyboardEvent} e - The keyboard event object.
 */
export function handleSearchKeystrokes(e) {
    const items = document.querySelectorAll('.search-result-item');
    if (items.length === 0) return; // No items to navigate

    if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent scrolling the page
        activeIndex = (activeIndex + 1) % items.length;
        updateActiveItem();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent scrolling the page
        activeIndex = (activeIndex - 1 + items.length) % items.length; // Handle wrap-around
        updateActiveItem();
    } else if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        if (activeIndex > -1) {
            items[activeIndex].click(); // Simulate click on the active item
        }
    } else if (e.key === 'Escape') {
        clearSearchResults(); // Hide results on Escape key
    }
}

/**
 * Updates the 'active' class on search result items for keyboard navigation.
 * Scrolls the active item into view.
 */
function updateActiveItem() {
    const items = document.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
        if (index === activeIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' }); // Scroll to make active item visible
        } else {
            item.classList.remove('active');
        }
    });
}
