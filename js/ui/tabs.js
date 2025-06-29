// js/ui/tabs.js
import { $ } from './dom.js';

export function setupTabs() {
    const tabContainer = document.querySelector('.tab-container');
    if (!tabContainer) return;
    const tabNav = tabContainer.querySelector('.tab-nav');
    const form = $('intakeForm');
    
    tabNav.addEventListener('click', (e) => {
        const targetTab = e.target.closest('.tab-button');
        if (targetTab) {
            const tabName = targetTab.dataset.tab;
            localStorage.setItem('activeQuasarTab', tabName);
            tabNav.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            targetTab.classList.add('active');
            
            form.querySelectorAll('.tab-panel').forEach(panel => {
                panel.style.display = 'none'; // Hide all panels
            });
            const activePanel = form.querySelector(`[data-tab-content="${tabName}"]`);
            if (activePanel) {
                activePanel.style.display = 'grid'; // Show the active one
            }
        }
    });
}

export function showReviewTab() {
    const reviewTab = document.querySelector('.review-tab');
    if (reviewTab) {
        reviewTab.style.display = 'block';
    }
}

export function hideReviewTab() {
    const reviewTab = document.querySelector('.review-tab');
    if (reviewTab) {
        reviewTab.style.display = 'none';
        if (reviewTab.classList.contains('active')) {
            // If it was active, switch back to the meta tab
            document.querySelector('.tab-button[data-tab="meta"]').click();
        }
    }
}
