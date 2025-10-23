#!/bin/bash

# Script to generate a release keystore for Android app signing
# This will also generate the Facebook key hash for the release keystore

echo "=========================================="
echo "Android Release Keystore Generator"
echo "=========================================="
echo ""

# Configuration
KEYSTORE_PATH="../android/app/release.keystore"
KEY_ALIAS="overlaypix-release"
VALIDITY_DAYS=10000

echo "This script will create a release keystore at: android/app/release.keystore"
echo ""
echo "⚠️  IMPORTANT: Keep this keystore file and passwords safe!"
echo "   You'll need them to sign all future updates of your app."
echo ""

# Prompt for keystore password
read -sp "Enter keystore password (minimum 6 characters): " KEYSTORE_PASSWORD
echo ""
read -sp "Confirm keystore password: " KEYSTORE_PASSWORD_CONFIRM
echo ""

if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords don't match. Exiting."
    exit 1
fi

if [ ${#KEYSTORE_PASSWORD} -lt 6 ]; then
    echo "❌ Password must be at least 6 characters. Exiting."
    exit 1
fi

# Prompt for key password
read -sp "Enter key password (can be same as keystore password): " KEY_PASSWORD
echo ""
read -sp "Confirm key password: " KEY_PASSWORD_CONFIRM
echo ""

if [ "$KEY_PASSWORD" != "$KEY_PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords don't match. Exiting."
    exit 1
fi

# Prompt for certificate details
echo ""
echo "Enter certificate details:"
read -p "Your Name: " CERT_NAME
read -p "Organizational Unit (e.g., Development): " CERT_OU
read -p "Organization (e.g., Company Name): " CERT_ORG
read -p "City: " CERT_CITY
read -p "State/Province: " CERT_STATE
read -p "Country Code (2 letters, e.g., US): " CERT_COUNTRY

echo ""
echo "Generating release keystore..."

# Generate the keystore
keytool -genkeypair \
    -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY_DAYS \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$CERT_NAME, OU=$CERT_OU, O=$CERT_ORG, L=$CERT_CITY, ST=$CERT_STATE, C=$CERT_COUNTRY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Release keystore created successfully!"
    echo ""
    echo "📁 Keystore location: android/app/release.keystore"
    echo "🔑 Key alias: $KEY_ALIAS"
    echo ""
    
    # Generate Facebook key hash
    echo "Generating Facebook key hash for release keystore..."
    RELEASE_KEYHASH=$(keytool -exportcert -alias "$KEY_ALIAS" -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD" -keypass "$KEY_PASSWORD" | openssl sha1 -binary | openssl base64)
    
    echo ""
    echo "=========================================="
    echo "FACEBOOK KEY HASH (RELEASE):"
    echo "$RELEASE_KEYHASH"
    echo "=========================================="
    echo ""
    
    # Generate SHA-1 for Google
    echo "SHA-1 Fingerprint (for Google/Firebase):"
    keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$KEY_ALIAS" -storepass "$KEYSTORE_PASSWORD" -keypass "$KEY_PASSWORD" 2>/dev/null | grep "SHA1:" | head -1
    echo ""
    
    # Save credentials to a secure file
    CREDENTIALS_FILE="../android/app/release-credentials.txt"
    echo "Keystore Password: $KEYSTORE_PASSWORD" > "$CREDENTIALS_FILE"
    echo "Key Alias: $KEY_ALIAS" >> "$CREDENTIALS_FILE"
    echo "Key Password: $KEY_PASSWORD" >> "$CREDENTIALS_FILE"
    echo "Facebook Key Hash: $RELEASE_KEYHASH" >> "$CREDENTIALS_FILE"
    
    echo "⚠️  Credentials saved to: android/app/release-credentials.txt"
    echo "   KEEP THIS FILE SECURE AND DO NOT COMMIT TO GIT!"
    echo ""
    echo "Next steps:"
    echo "1. Add release-credentials.txt to .gitignore"
    echo "2. Update android/app/build.gradle with release signing config"
    echo "3. Add the Facebook key hash to your Facebook Developer Console"
    echo "4. Add the SHA-1 fingerprint to Firebase Console"
    echo ""
else
    echo "❌ Failed to create keystore"
    exit 1
fi
