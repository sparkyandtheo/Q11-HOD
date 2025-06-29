// js/ui/review-handler.js
import { $ } from './dom.js';

function getObjectDiff(obj1, obj2, path = '') {
    const diff = {};
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        const val1 = obj1[key];
        const val2 = obj2[key];

        if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null && !Array.isArray(val1) && !Array.isArray(val2)) {
            const nestedDiff = getObjectDiff(val1, val2, newPath);
            if (Object.keys(nestedDiff).length > 0) {
                Object.assign(diff, nestedDiff);
            }
        } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            diff[newPath] = {
                old: val1 !== undefined ? val1 : '',
                new: val2 !== undefined ? val2 : ''
            };
        }
    }
    return diff;
}

export function renderDiff(originalData, currentData) {
    const diffContainer = $('diff-container');
    const diff = getObjectDiff(originalData, currentData);
    let diffHtml = '';
    let hasChanges = false;

    for (const key in diff) {
        if (diff.hasOwnProperty(key)) {
            hasChanges = true;
            const oldValue = JSON.stringify(diff[key].old, null, 2);
            const newValue = JSON.stringify(diff[key].new, null, 2);
            const diffResult = Diff.diffLines(oldValue, newValue);
            
            let fieldHtml = `<strong>${key}:</strong>\n`;
            diffResult.forEach(part => {
                const color = part.added ? 'ins' : part.removed ? 'del' : 'span';
                fieldHtml += `<${color}>${part.value}</${color}>`;
            });
            diffHtml += fieldHtml + '\n\n';
        }
    }

    if (hasChanges) {
        diffContainer.innerHTML = diffHtml;
    } else {
        diffContainer.innerHTML = '<p>No changes detected.</p>';
    }
    
    return hasChanges;
}

export function clearDiff() {
    const diffContainer = $('diff-container');
    diffContainer.innerHTML = '';
}
