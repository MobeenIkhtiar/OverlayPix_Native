# PayPal Upgrade Event - Debug Guide

## Issue
PayPal payment is captured but `upgradeEvent` is not being called.

## What Was Fixed

### 1. Added Comprehensive Logging
Added detailed console logs throughout the PayPal capture flow:

```javascript
// At start of handlePayPalCapture
🎯 Capturing PayPal payment for order: [orderId]
🔍 Current state - isUpgradeMode: true/false
🔍 Current state - eventId: [eventId]
🔍 Current state - step4Data: {...}

// During capture
PayPal capture response: {...}
✅ PayPal payment captured successfully!

// During upgrade
⬆️ Upgrading event: [eventId]
Calling upgradeEvent with eventId: [eventId]
Upgrade event response: {...}
✅ Event upgraded successfully!
```

### 2. Improved Error Handling
- Added try-catch around `upgradeEvent` call
- Added specific error messages for missing eventId
- Better logging of upgrade failures

### 3. Fixed Endpoint Routing
- Uses `/payments/paypal-upgrade-order` for upgrade mode
- Uses `/payments/create-paypal-order` for create mode

## How to Debug

### Step 1: Check Console Logs
When you complete PayPal payment and return to app, check Metro console for:

```
📱 App state changed to: active
✨ App became active, checking for pending PayPal order...
🔍 Found pending PayPal order: [orderId]
🎯 Auto-capturing payment...
🎯 Capturing PayPal payment for order: [orderId]
🔍 Current state - isUpgradeMode: true  ← Should be TRUE
🔍 Current state - eventId: [eventId]   ← Should have value
```

### Step 2: Verify State Values
If `isUpgradeMode` is `false` or `eventId` is `null`:
- Check that you navigated from upgrade screen with proper params
- Verify route params are being set correctly

### Step 3: Check API Response
Look for:
```
PayPal capture response: { success: true, status: 'COMPLETED' }
⬆️ Upgrading event: [eventId]
Calling upgradeEvent with eventId: [eventId]
```

### Step 4: Check Upgrade Response
```
Upgrade event response: { success: true, ... }
✅ Event upgraded successfully!
```

## Common Issues

### Issue 1: isUpgradeMode is false
**Cause:** Route params not passed correctly
**Solution:** Check navigation from upgrade screen:
```javascript
navigation.navigate('createEventFourthStep', { upgrade: eventId })
```

### Issue 2: eventId is null/undefined
**Cause:** Route params not being read
**Solution:** Verify useEffect that sets eventId from route.params

### Issue 3: upgradeEvent not called
**Cause:** Payment capture failed or returned wrong status
**Solution:** Check backend capture endpoint returns:
```json
{
  "success": true,
  "status": "COMPLETED"
}
```

### Issue 4: upgradeEvent called but fails
**Cause:** Backend upgrade endpoint issue
**Solution:** Check backend logs and verify payment data is included

## Testing Checklist

- [ ] Navigate to upgrade screen
- [ ] Select PayPal payment method
- [ ] Click "Proceed to Payment"
- [ ] Complete payment in PayPal
- [ ] App returns to foreground
- [ ] Check console for all logs above
- [ ] Verify `isUpgradeMode: true`
- [ ] Verify `eventId` has value
- [ ] Verify payment captured
- [ ] Verify `upgradeEvent` called
- [ ] Verify navigation to success screen

## Expected Console Flow

```
💾 Storing PayPal order ID: 8B95353963701232W
📱 App state changed to: active
✨ App became active, checking for pending PayPal order...
🔍 Found pending PayPal order: 8B95353963701232W
🎯 Auto-capturing payment...
🎯 Capturing PayPal payment for order: 8B95353963701232W
🔍 Current state - isUpgradeMode: true
🔍 Current state - eventId: abc123xyz
🔍 Current state - step4Data: { payment: { method: 'paypal', paypalOrderId: '...' } }
PayPal capture response: { success: true, status: 'COMPLETED' }
✅ PayPal payment captured successfully!
⬆️ Upgrading event: abc123xyz
Calling upgradeEvent with eventId: abc123xyz
Upgrade event response: { success: true }
✅ Event upgraded successfully!
```
