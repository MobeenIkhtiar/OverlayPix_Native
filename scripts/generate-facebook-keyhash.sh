#!/bin/bash

# Script to generate Facebook Key Hash for Android development
# Based on Facebook Android documentation: https://developers.facebook.com/docs/android/getting-started/

echo "Generating Facebook Key Hash for Android development..."

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo "Error: keytool not found. Please install Java Development Kit (JDK)"
    exit 1
fi

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "Error: openssl not found. Please install OpenSSL"
    exit 1
fi

# Generate key hash for debug keystore
echo "Generating key hash for debug keystore..."
DEBUG_KEYHASH=$(keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android | openssl sha1 -binary | openssl base64)

echo "Debug Key Hash: $DEBUG_KEYHASH"
echo ""
echo "Add this key hash to your Facebook App settings:"
echo "1. Go to https://developers.facebook.com/"
echo "2. Select your app (App ID: 1152635456681077)"
echo "3. Go to Settings > Basic"
echo "4. Add this key hash to the 'Android' section"
echo ""
echo "For production, you'll need to generate a release key hash using:"
echo "keytool -exportcert -alias <RELEASE_KEY_ALIAS> -keystore <RELEASE_KEY_PATH> | openssl sha1 -binary | openssl base64"
