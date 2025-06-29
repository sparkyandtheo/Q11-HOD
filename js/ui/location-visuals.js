// js/ui/location-visuals.js
import { $ } from './dom.js';

export function handleStreetViewError() {
    clearStreetViewError(); 
    const img = $('streetViewImg');
    if(img) img.style.display = 'none'; 

    const container = $('location-content');
    if (!container || container.querySelector('.streetview-error')) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'streetview-error';
    errorDiv.innerHTML = `<strong>Street View Not Available</strong><small>This may be due to an invalid API key, missing billing, or no imagery for this location.</small>`;
    container.appendChild(errorDiv);
}

export function clearStreetViewError() {
    const container = $('location-content');
    if (!container) return;
    const errorDiv = container.querySelector('.streetview-error');
    if (errorDiv) errorDiv.remove();

    const img = $('streetViewImg');
    const isActive = document.querySelector('.location-tab-btn[data-view="streetview"]')?.classList.contains('active');
    if (img && img.style.display === 'none' && isActive) {
         img.style.display = 'block';
    }
}

export function updateLocationVisuals(addr) {
    const container = $('location-visuals-container');
    const mapFrame = $('mapView');
    const streetViewImg = $('streetViewImg');
    
    const googleMapsApiKey = localStorage.getItem('googleMapsApiKey') || '';

    if (!container || !mapFrame || !streetViewImg) return;
    
    clearStreetViewError();

    if (!addr || addr.trim() === '' || !googleMapsApiKey) {
        container.style.display = 'none';
        return;
    }
    const q = encodeURIComponent(addr.trim());
    mapFrame.src = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${q}`;
    streetViewImg.src = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${q}&key=${googleMapsApiKey}`;
    container.style.display = 'block';
}
