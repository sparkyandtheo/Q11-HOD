// js/ui/dom.js

/**
 * A shorthand for document.getElementById.
 * Exposed globally for convenience in console/debugging.
 * @param {string} id The ID of the element to find.
 * @returns {HTMLElement}
 */
export const $ = id => document.getElementById(id);
// Attach to window for global access, e.g., in console
window.$ = $; 

/**
 * Shows a toast notification message.
 * Exposed globally for convenience in console/debugging.
 * @param {string} msg The message to display.
 */
export function notify(msg) {
    const container = $('toast-container');
    if (!container) {
        console.warn('Toast container not found. Notification not displayed:', msg);
        return;
    }
    const n = document.createElement('div');
    n.className = 'toast';
    n.textContent = msg;
    container.appendChild(n);
    
    // Automatically remove the toast after 5 seconds
    setTimeout(() => {
        n.remove();
    }, 5000);
}
// Attach to window for global access
window.notify = notify;

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

