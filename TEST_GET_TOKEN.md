# Get Firebase Token from Running App

## Method 1: Add to createEventFourthStep/index.tsx

Add this code temporarily in the `handlePayAndContinue` function (around line 133):

```typescript
const token = await AsyncStorage.getItem('token');
const userId = await AsyncStorage.getItem('uid');
console.log('🔑 FIREBASE TOKEN FOR POSTMAN:', token);
console.log('👤 USER ID:', userId);
```

Then run the app, go to the payment screen, and check the Metro console.

## Method 2: Use React Native Debugger

1. Open React Native Debugger
2. Go to Console tab
3. Run this in the console:
```javascript
AsyncStorage.getItem('token').then(token => console.log('Token:', token));
AsyncStorage.getItem('uid').then(uid => console.log('UID:', uid));
```

## Method 3: Add a Test Button

Add this temporarily to your payment screen:

```typescript
<TouchableOpacity onPress={async () => {
  const token = await AsyncStorage.getItem('token');
  const userId = await AsyncStorage.getItem('uid');
  console.log('TOKEN:', token);
  console.log('UID:', userId);
  Alert.alert('Check Console', 'Token and UID logged to console');
}}>
  <Text>Get Token (Debug)</Text>
</TouchableOpacity>
```
