// js/database.js

// This module handles all interactions with Google Firestore.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let recordsListenerUnsubscribe = null; // To keep track of the real-time listener

/**
 * Sets up a real-time listener for the records collection in Firestore.
 * @param {string} searchTerm - The term to filter records by.
 * @param {function} onDataChange - Callback function that receives the array of records.
 * @param {function} onError - Callback function for any errors.
 */
export function listenForRecords(searchTerm, onDataChange, onError) {
    if (recordsListenerUnsubscribe) {
        recordsListenerUnsubscribe();
    }
    const user = auth.currentUser;
    if (!user) {
        onDataChange([]);
        return;
    }
    const recordsCollectionRef = collection(db, 'users', user.uid, 'records');
    let q;
    
    if (searchTerm) {
        q = query(recordsCollectionRef, where('tokens', 'array-contains', searchTerm.toLowerCase()));
    } else {
        q = query(recordsCollectionRef, orderBy('editedAt', 'desc'));
    }

    recordsListenerUnsubscribe = onSnapshot(q, (querySnapshot) => {
        const records = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function' 
                ? data.createdAt.toDate() 
                : null;
            const editedAt = data.editedAt && typeof data.editedAt.toDate === 'function'
                ? data.editedAt.toDate()
                : new Date();

            return {
                id: doc.id,
                ...data,
                createdAt: createdAt,
                editedAt: editedAt
            };
        });
        onDataChange(records);
    }, (error) => {
        console.error("Error fetching records: ", error);
        onError(error);
    });
}

/**
 * Detaches the real-time Firestore listener.
 */
export function detachRecordsListener() {
    if (recordsListenerUnsubscribe) {
        recordsListenerUnsubscribe();
        recordsListenerUnsubscribe = null;
    }
}

/**
 * Saves or updates a record in Firestore.
 * @param {object} recordData - The complete record object to save.
 * @returns {Promise<string>} The ID of the saved document.
 */
export async function persistRecord(recordData) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const recordToSave = { ...recordData };
    
    if (recordToSave.equipment === undefined) {
        recordToSave.equipment = [];
    }
    
    recordToSave.editedAt = serverTimestamp();

    // === Enhanced Omni-Search Tokenization ===
    const tokens = new Set();
    const addTokens = (value) => {
        if (value && typeof value === 'string') {
            value.toLowerCase().split(/\s+/).forEach(token => {
                if(token) tokens.add(token);
            });
        }
    };
    
    // Add all base fields to tokens
    Object.values(recordData).forEach(value => {
        if (typeof value === 'string') {
            addTokens(value);
        }
    });

    // Add all equipment fields to tokens
    if (recordData.equipment && Array.isArray(recordData.equipment)) {
        recordData.equipment.forEach(door => {
            Object.values(door).forEach(value => {
                if (typeof value === 'string') {
                    addTokens(value);
                }
            });
        });
    }
    recordToSave.tokens = Array.from(tokens);
    // =========================================
    
    const recordsCollectionRef = collection(db, 'users', user.uid, 'records');

    if (recordToSave.id) {
        const docRef = doc(db, 'users', user.uid, 'records', recordToSave.id);
        await setDoc(docRef, recordToSave, { merge: true });
        return recordToSave.id;
    } else {
        recordToSave.createdAt = serverTimestamp();
        const docRef = await addDoc(recordsCollectionRef, recordToSave);
        return docRef.id;
    }
}

/**
 * Deletes a record from Firestore.
 * @param {string} recordId - The ID of the record to delete.
 */
export async function deleteRecord(recordId) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const docRef = doc(db, 'users', user.uid, 'records', recordId);
    await deleteDoc(docRef);
}
