#!/bin/bash

# Ensure the js directory exists
mkdir -p js

# Create the firebase-config.js file using Netlify's environment variables
echo "export const firebaseConfig = {" > js/firebase-config.js
echo "  apiKey: \"$FIREBASE_API_KEY\"," >> js/firebase-config.js
echo "  authDomain: \"$FIREBASE_AUTH_DOMAIN\"," >> js/firebase-config.js
echo "  projectId: \"$FIREBASE_PROJECT_ID\"," >> js/firebase-config.js
echo "  storageBucket: \"$FIREBASE_STORAGE_BUCKET\"," >> js/firebase-config.js
echo "  messagingSenderId: \"$FIREBASE_MESSAGING_SENDER_ID\"," >> js/firebase-config.js
echo "  appId: \"$FIREBASE_APP_ID\"," >> js/firebase-config.js
echo "  measurementId: \"$FIREBASE_MEASUREMENT_ID\"" >> js/firebase-config.js
echo "};" >> js/firebase-config.js

# Optional: If you decided to inject Google Maps API Key at build time
# Uncomment and adjust if you added Maps_API_KEY to Netlify env variables
# echo "export const googleMapsApiKey = \"$Maps_API_KEY\";" >> js/firebase-config.js

# Your existing build command, if any. For a simple static site, this might be empty.
# If you have steps like 'npm install' or 'npm run build', add them here.
# Example: npm install && npm run build