// js/ui/record-list.js
import { $ } from './dom.js';

export function renderRecordList(records, currentPage, recordsPerPage) {
    const listEl = $('record-list');
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const paginatedRecords = records.slice(startIndex, endIndex);

    const fragment = document.createDocumentFragment();
    if (paginatedRecords.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #999;">No records found. Sign in to see your records.</p>';
        setupPagination(0, 1, recordsPerPage);
        return;
    }
    
    paginatedRecords.forEach(r => {
        const req = r.request || '';
        const truncatedRequest = req.length > 50 ? req.substring(0, 50) + '…' : req;
        const card = document.createElement('div');
        card.className = 'card';

        const nameEl = document.createElement('strong');
        nameEl.textContent = r.name || 'No Name';

        const phoneEl = document.createElement('small');
        phoneEl.textContent = `📞 ${r.phone || '—'} | 📧 `;
        const emailLink = document.createElement('a');
        emailLink.href = `mailto:${r.email}`;
        emailLink.className = 'email-link';
        emailLink.textContent = r.email || '—';
        phoneEl.appendChild(emailLink);

        const requestEl = document.createElement('p');
        requestEl.className = 'card-request';
        requestEl.textContent = truncatedRequest || 'No request specified';
        
        const timeEl = document.createElement('small');
        timeEl.textContent = `🕒 ${r.editedAt ? new Date(r.editedAt).toLocaleString() : 'Saving...'}`;
        
        card.innerHTML = `
            <div></div>
            <div class="card-buttons">
              <button type="button" class="edit-btn" data-record-id="${r.id}">Edit</button>
              <button type="button" class="delete-btn" data-record-id="${r.id}">Delete</button>
            </div>
        `;
        card.firstElementChild.append(nameEl, document.createElement('br'), phoneEl, requestEl, timeEl);
        fragment.appendChild(card);
    });
    listEl.innerHTML = '';
    listEl.appendChild(fragment);

    setupPagination(records.length, currentPage, recordsPerPage);
}

function setupPagination(totalRecords, currentPage, recordsPerPage) {
    const controlsContainer = $('pagination-controls');
    const totalPages = Math.ceil(totalRecords / recordsPerPage);

    if (totalPages <= 1) {
        controlsContainer.innerHTML = '';
        return;
    }

    controlsContainer.innerHTML = `
        <button type="button" id="prevPageBtn" title="Previous Page" ${currentPage === 1 ? 'disabled' : ''}>« Prev</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button type="button" id="nextPageBtn" title="Next Page" ${currentPage >= totalPages ? 'disabled' : ''}>Next »</button>
    `;
}
