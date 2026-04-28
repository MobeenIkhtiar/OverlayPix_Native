import { StatusBar, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import Toast from 'react-native-toast-message'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { configureGoogleSignIn } from './src/config/googleSignIn'
import { configureFacebookSDK } from './src/config/facebookSDK'
import { CreateEventProvider } from './src/contexts/CreateEventContext'
import { revenueCatService } from './src/services/revenueCatService'
import { onAuthStateChanged } from '@react-native-firebase/auth'
import { auth } from './src/services/loginService'
import SplashScreen from './src/screens/SplashScreen'

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize social authentication providers
    configureGoogleSignIn();
    configureFacebookSDK();

    // Initialize RevenueCat (with safety check)
    try {
      revenueCatService.initialize().catch(error => {
        console.error('Failed to initialize RevenueCat:', error);
      });
    } catch (error) {
      console.error('RevenueCat module not available:', error);
    }

    // Listen for auth state changes to sync RevenueCat user ID
    const subscriber = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('User logged in, setting RevenueCat ID:', user.uid);
        await revenueCatService.setUserId(user.uid);
      } else {
        console.log('User logged out, resetting RevenueCat');
        await revenueCatService.logout();
      }
    });

    return () => subscriber(); // unsubscribe on unmount
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <>
      {/* StatusBar */}


      <SafeAreaProvider style={styles.container}>
        <StatusBar
          backgroundColor="#fff"
          barStyle="dark-content"
        />
        <CreateEventProvider>
          <AppNavigator />
          <Toast />
        </CreateEventProvider>
      </SafeAreaProvider>
    </>
  );
}

export default App
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
