// js/ui/dom.js

/**
 * A shorthand for document.getElementById.
 * @param {string} id The ID of the element to find.
 * @returns {HTMLElement}
 */
export const $ = id => document.getElementById(id);

/**
 * Shows a toast notification message.
 * @param {string} msg The message to display.
 */
export function notify(msg) {
    const container = $('toast-container');
    if (!container) return;
    const n = document.createElement('div');
    n.className = 'toast';
    n.textContent = msg;
    container.appendChild(n);
    
    // Automatically remove the toast after 5 seconds
    setTimeout(() => {
        n.remove();
    }, 5000);
}

/**
 * Generates a unique ID based on the current timestamp.
 * @returns {string} A unique document ID.
 */
export function generateUniqueId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `DOC-${year}${month}${day}-${hours}${minutes}${seconds}`;
}
