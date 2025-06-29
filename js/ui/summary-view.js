// js/ui/summary-view.js
import { $ } from './dom.js';

export function renderSummary(record) {
    const container = $('summary-container');
    const content = $('summary-content');

    if (!record || Object.keys(record).length === 0) {
        container.style.display = 'none';
        return;
    }

    const sanitize = (str) => {
        const temp = document.createElement('div');
        temp.textContent = str || '';
        return temp.innerHTML;
    };

    let summaryHtml = `
        <div class="summary-section">
            <h4>Contact</h4>
            <div class="summary-item"><strong>Name:</strong> <span>${sanitize(record.name) || 'N/A'}</span></div>
            <div class="summary-item"><strong>Phone:</strong> <span>${sanitize(record.phone) || 'N/A'}</span></div>
            <div class="summary-item"><strong>Email:</strong> <span>${sanitize(record.email) || 'N/A'}</span></div>
            <div class="summary-item"><strong>Address:</strong> <span>${sanitize(record.jobsite) || 'N/A'}</span></div>
        </div>
    `;

    if (record.equipment && record.equipment.length > 0) {
        summaryHtml += '<div class="summary-section"><h4>Equipment</h4>';
        record.equipment.forEach((door, index) => {
            summaryHtml += `<div class="summary-item"><strong>Door ${index + 1}:</strong> <span>${sanitize(door.door) || 'N/A'}</span></div>`;
        });
        summaryHtml += '</div>';
    }

    content.innerHTML = summaryHtml;
    container.style.display = 'block';
}

export function clearSummary() {
    const container = $('summary-container');
    container.style.display = 'none';
    $('summary-content').innerHTML = '';
}
