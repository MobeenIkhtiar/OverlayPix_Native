# Apple Pay "merchantIdentifier" Error - FIXED ✅

## The Problem
Error: **"You must provide merchantIdentifier"** when selecting Apple Pay and clicking "Pay and Continue"

## Why This Happens
Apple Pay requires a **Merchant Identifier** to be configured in the Stripe SDK. This is a unique identifier registered with Apple that links your app to your Apple Pay merchant account.

## What Was Fixed

### 1. Added Merchant Identifier to .env
```bash
APPLE_MERCHANT_ID=merchant.com.overlaypix
```

### 2. Updated App.tsx
Added `merchantIdentifier` prop to StripeProvider:
```typescript
<StripeProvider 
  publishableKey={STRIPE_PUBLISHABLE_KEY || ''}
  merchantIdentifier={APPLE_MERCHANT_ID || 'merchant.com.overlaypix'}
>
```

### 3. Updated TypeScript Declarations
Added `APPLE_MERCHANT_ID` to `src/types/env.d.ts`

## Next Steps to Complete Apple Pay Setup

### For Development/Testing:
1. **Restart Metro bundler:**
   ```bash
   npm start -- --reset-cache
   ```

2. **Rebuild the iOS app:**
   ```bash
   cd ios
   pod install
   cd ..
   npm run ios
   ```

### For Production:
You need to create a **real Apple Merchant ID** in Apple Developer Portal:

1. **Go to Apple Developer Portal:**
   - Visit: https://developer.apple.com/account
   - Navigate to: Certificates, Identifiers & Profiles
   - Click: Identifiers → Add (+)
   - Select: Merchant IDs

2. **Create Merchant ID:**
   - Identifier: `merchant.com.overlaypix` (or your preferred ID)
   - Description: "OverlayPix Apple Pay"
   - Register the merchant ID

3. **Update .env with your real Merchant ID:**
   ```bash
   APPLE_MERCHANT_ID=merchant.com.yourcompany.appname
   ```

4. **Configure in Xcode:**
   - Open: `ios/overlayPixNew.xcworkspace`
   - Select target: overlayPixNew
   - Go to: Signing & Capabilities
   - Add capability: Apple Pay
   - Add your Merchant ID

5. **Configure in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com
   - Navigate to: Settings → Payment Methods
   - Enable: Apple Pay
   - Add your Apple Merchant ID
   - Upload Payment Processing Certificate

## Testing Apple Pay

### Requirements:
- ✅ Physical iOS device (Apple Pay doesn't work in simulator)
- ✅ iOS 12.0 or later
- ✅ At least one card added to Apple Wallet
- ✅ Merchant ID configured

### Test Flow:
1. Select Apple Pay as payment method
2. Click "Pay and Continue"
3. Apple Pay sheet should appear
4. Authenticate with Face ID/Touch ID
5. Payment processes successfully

## Troubleshooting

### Error: "merchantIdentifier is required"
- ✅ **FIXED** - Merchant ID now configured in App.tsx

### Error: "Apple Pay is not available"
- Ensure device has Apple Pay set up
- Add at least one card to Apple Wallet
- Test on physical device, not simulator

### Error: "Payment failed"
- Verify Stripe publishable key is correct
- Check that merchant ID matches Apple Developer Portal
- Ensure test mode is enabled in Stripe for testing

## Important Notes

1. **Current Setup:** Uses placeholder merchant ID `merchant.com.overlaypix`
2. **For Testing:** This will work with Stripe test mode
3. **For Production:** Must create real merchant ID in Apple Developer Portal
4. **Restart Required:** After changing .env, restart Metro and rebuild app

## Files Modified
- ✅ `.env` - Added APPLE_MERCHANT_ID
- ✅ `App.tsx` - Added merchantIdentifier to StripeProvider
- ✅ `src/types/env.d.ts` - Added TypeScript declaration

The error should now be resolved! 🎉
