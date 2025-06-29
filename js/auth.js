// js/auth.js

// This module handles Firebase Authentication.
// FIX: Using full CDN URLs for Firebase imports to work directly in the browser.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Importing configuration from a separate, non-version-controlled file.
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase and Auth services.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/**
 * Main authentication initializer. Sets up the listener for auth state changes.
 * @param {function} onLogin - Callback function to execute when a user successfully signs in. Receives the user object.
 * @param {function} onLogout - Callback function to execute when a user signs out.
 */
export function initAuth(onLogin, onLogout) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onLogin(user);
        } else {
            onLogout();
        }
    });
}

/**
 * Initiates the Google Sign-In flow using a popup window.
 */
export function login() {
    signInWithPopup(auth, provider).catch(error => {
        console.error("Authentication failed:", error);
        alert(`Login Failed: ${error.message}`);
    });
}

/**
 * Signs the current user out.
 */
export function logout() {
    signOut(auth).catch(error => {
        console.error("Sign out failed:", error);
        alert(`Logout Failed: ${error.message}`);
    });
}