# PayPal Deep Link Configuration

## ✅ Configuration Complete

Deep linking is now configured for **both iOS and Android** to handle PayPal redirects.

---

## 📱 iOS Configuration

**File:** `ios/overlayPixNew/Info.plist`

Added URL scheme:
```xml
<dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>org.reactjs.native.example.overlayPixNew</string>
    <key>CFBundleURLSchemes</key>
    <array>
        <string>overlaypix</string>
    </array>
</dict>
```

---

## 🤖 Android Configuration

**File:** `android/app/src/main/AndroidManifest.xml`

Added intent filter:
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="overlaypix" android:host="paypal" />
</intent-filter>
```

---

## 🔗 Deep Link URLs

The app will handle these URLs:

- **Success:** `overlaypix://paypal/success`
- **Cancel:** `overlaypix://paypal/cancel`

---

## 🧪 Testing Deep Links

### Test on iOS Simulator:
```bash
xcrun simctl openurl booted "overlaypix://paypal/success"
```

### Test on Android Emulator:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "overlaypix://paypal/success" org.reactjs.native.example.overlayPixNew
```

### Test on Physical Device:
Create a test HTML file and open it in Safari/Chrome:
```html
<!DOCTYPE html>
<html>
<body>
    <h1>Test PayPal Deep Links</h1>
    <a href="overlaypix://paypal/success">Test Success</a><br><br>
    <a href="overlaypix://paypal/cancel">Test Cancel</a>
</body>
</html>
```

---

## 🔧 Backend Requirements

Your backend must include these URLs when creating PayPal orders:

```javascript
// In /payments/create-paypal-order endpoint
const order = await paypalClient.orders.create({
  intent: 'CAPTURE',
  application_context: {
    return_url: req.body.returnUrl,  // 'overlaypix://paypal/success'
    cancel_url: req.body.cancelUrl,  // 'overlaypix://paypal/cancel'
    brand_name: 'OverlayPix',
    landing_page: 'BILLING',
    user_action: 'PAY_NOW'
  },
  purchase_units: [{
    amount: {
      currency_code: 'USD',
      value: req.body.finalPrice || req.body.upgradePrice
    }
  }]
});

return {
  success: true,
  orderId: order.id,
  approvalUrl: order.links.find(link => link.rel === 'approve').href
};
```

---

## 🚀 How It Works

1. **User selects PayPal** → App calls backend API
2. **Backend creates order** → Returns `approvalUrl` with return URLs
3. **App opens Safari/Chrome** → User completes payment
4. **PayPal redirects** → `overlaypix://paypal/success`
5. **App opens automatically** → Captures payment via backend
6. **Event created/upgraded** → User sees success screen

---

## 📝 Next Steps

1. **Rebuild the app** (required for native config changes):
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

2. **Update your backend** to accept and use `returnUrl` and `cancelUrl`

3. **Test the flow** end-to-end

---

## 🐛 Troubleshooting

### Deep link not opening app?
- Make sure you rebuilt the app after config changes
- Check that the URL scheme matches exactly: `overlaypix://`
- Verify backend is sending correct return URLs

### App opens but payment not captured?
- Check console logs for `🔗 Deep link received:`
- Verify `paypalOrderId` is stored in state
- Check backend capture endpoint is working

### Still in browser after payment?
- Ensure backend includes `return_url` in PayPal order
- Check PayPal sandbox settings allow custom return URLs
