// js/ui/search-handler.js
import { $ } from './dom.js';

let activeIndex = -1;
let results = [];

export function renderSearchResults(records) {
    const searchResultsContainer = $('searchResults');
    results = records;
    activeIndex = -1;

    if (records.length === 0) {
        searchResultsContainer.style.display = 'none';
        return;
    }

    searchResultsContainer.innerHTML = '';
    records.forEach((record, index) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.recordId = record.id;
        item.innerHTML = `
            <strong>${record.name || 'No Name'}</strong>
            <small>${record.jobsite || 'No Address'}</small>
        `;
        item.addEventListener('click', () => {
            window.appState.loadRecord(record.id);
            clearSearchResults();
        });
        searchResultsContainer.appendChild(item);
    });

    searchResultsContainer.style.display = 'block';
}

export function clearSearchResults() {
    const searchResultsContainer = $('searchResults');
    searchResultsContainer.innerHTML = '';
    searchResultsContainer.style.display = 'none';
    results = [];
    activeIndex = -1;
}

export function handleSearchKeystrokes(e) {
    const items = document.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        updateActiveItem();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        updateActiveItem();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex > -1) {
            items[activeIndex].click();
        }
    } else if (e.key === 'Escape') {
        clearSearchResults();
    }
}

function updateActiveItem() {
    const items = document.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
        if (index === activeIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}
