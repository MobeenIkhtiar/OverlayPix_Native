# Platform Pay Setup Guide

## iOS - Apple Pay Setup

### 1. Apple Developer Portal Configuration

1. **Create Merchant ID:**
   - Go to [Apple Developer Portal](https://developer.apple.com/account)
   - Navigate to Certificates, Identifiers & Profiles
   - Click on Identifiers → Add (+)
   - Select "Merchant IDs" and click Continue
   - Create identifier: `merchant.com.overlaypix` (or your preferred ID)
   - Add description and register

2. **Create Payment Processing Certificate:**
   - In Merchant ID settings, click "Create Certificate"
   - Download the CSR from Stripe Dashboard
   - Upload CSR to Apple Developer Portal
   - Download the certificate

### 2. Xcode Project Configuration

1. **Enable Apple Pay Capability:**
   ```bash
   # Open Xcode project
   cd ios
   open overlayPixNew.xcworkspace
   ```

2. **In Xcode:**
   - Select your project in the navigator
   - Select the target "overlayPixNew"
   - Go to "Signing & Capabilities" tab
   - Click "+ Capability"
   - Add "Apple Pay"
   - Add your Merchant ID

3. **Update Info.plist:**
   Add the following if not present:
   ```xml
   <key>NSFaceIDUsageDescription</key>
   <string>We use Face ID to authenticate your payment securely</string>
   ```

### 3. Stripe Dashboard Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Settings → Payment Methods
3. Enable Apple Pay
4. Add your Apple Merchant ID
5. Upload the Payment Processing Certificate from Apple

### 4. Test Apple Pay

**Test Cards for Apple Wallet:**
- Add test cards to Apple Wallet on your device
- Stripe test card: 4242 4242 4242 4242
- Any future expiry date and any CVC

**Testing Checklist:**
- [ ] Physical iOS device (not simulator)
- [ ] iOS 12.0 or later
- [ ] Apple Pay set up with test card
- [ ] App built with Apple Pay capability
- [ ] Merchant ID configured in Stripe

---

## Android - Google Pay Setup

### 1. Google Pay Business Console Configuration

1. **Register Business:**
   - Go to [Google Pay Business Console](https://pay.google.com/business/console)
   - Register your business
   - Complete business verification

2. **Create Merchant Account:**
   - Add business information
   - Link to your Stripe account

### 2. Android Project Configuration

1. **Update AndroidManifest.xml:**
   ```xml
   <application>
     <!-- Add this meta-data inside application tag -->
     <meta-data
       android:name="com.google.android.gms.wallet.api.enabled"
       android:value="true" />
   </application>
   ```

2. **Verify Google Play Services:**
   The app already has the necessary dependencies through `@stripe/stripe-react-native`.

### 3. Stripe Dashboard Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Settings → Payment Methods
3. Enable Google Pay
4. Add your Google Merchant ID
5. Configure merchant name: "OverlayPix"

### 4. Test Google Pay

**Test Environment:**
- Development mode uses `testEnv: true` (already configured)
- Add test cards to Google Pay on your device or emulator

**Test Cards:**
- Add Stripe test card to Google Pay: 4242 4242 4242 4242
- Any future expiry date and any CVC

**Testing Checklist:**
- [ ] Android device or emulator with Google Play Services
- [ ] Android 5.0 (API level 21) or later
- [ ] Google Pay app installed
- [ ] Test card added to Google Pay
- [ ] Merchant configured in Stripe

---

## Environment Variables

Ensure your `.env` file has the Stripe publishable key:

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

For production:
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
```

---

## Production Deployment

### iOS Production Checklist
- [ ] Use production Stripe publishable key
- [ ] Test with real cards (not test cards)
- [ ] Verify Apple Pay merchant ID is production-ready
- [ ] Test on multiple iOS devices
- [ ] Verify Face ID/Touch ID authentication works

### Android Production Checklist
- [ ] Change `testEnv: false` in code (currently set to `__DEV__`)
- [ ] Use production Stripe publishable key
- [ ] Test with real cards (not test cards)
- [ ] Verify Google Pay merchant account is approved
- [ ] Test on multiple Android devices
- [ ] Verify payment confirmation flow

---

## Troubleshooting

### Apple Pay Issues

**"Apple Pay is not available"**
- Ensure device has Apple Pay set up
- Verify at least one card is added to Wallet
- Check that app has Apple Pay capability enabled
- Confirm merchant ID is correct

**Payment fails immediately**
- Verify Stripe merchant ID matches Apple Developer Portal
- Check that payment processing certificate is uploaded to Stripe
- Ensure test mode is enabled in Stripe Dashboard for testing

### Google Pay Issues

**"Google Pay is not available"**
- Ensure Google Play Services is installed
- Verify Google Pay app is installed and configured
- Check that device meets minimum requirements (Android 5.0+)
- Confirm at least one card is added to Google Pay

**Payment fails immediately**
- Verify Google Merchant ID in Stripe Dashboard
- Check that merchant name is configured correctly
- Ensure test environment is enabled for development
- Verify Google Pay is enabled in Stripe Dashboard

### General Issues

**"Payment requires additional action"**
- This usually means 3D Secure authentication is required
- For platform pay, this shouldn't occur with properly configured test cards
- Try with a different test card

**"Stripe is not properly initialized"**
- Check that `STRIPE_PUBLISHABLE_KEY` is set in `.env`
- Verify StripeProvider is wrapping the app in `App.tsx`
- Restart the app after changing environment variables

---

## Testing Commands

### iOS
```bash
# Install dependencies
cd ios
pod install

# Run on device
cd ..
npm run ios -- --device "Your Device Name"
```

### Android
```bash
# Run on device
npm run android

# Or specify device
adb devices
npm run android -- --deviceId=DEVICE_ID
```

---

## Additional Resources

- [Stripe Apple Pay Documentation](https://stripe.com/docs/apple-pay)
- [Stripe Google Pay Documentation](https://stripe.com/docs/google-pay)
- [Stripe React Native SDK](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Apple Pay Developer Guide](https://developer.apple.com/apple-pay/)
- [Google Pay Developer Guide](https://developers.google.com/pay/api)
