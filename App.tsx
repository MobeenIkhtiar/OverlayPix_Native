import { StatusBar, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import Toast from 'react-native-toast-message'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { configureGoogleSignIn } from './src/config/googleSignIn'
import { configureFacebookSDK } from './src/config/facebookSDK'
import { CreateEventProvider } from './src/contexts/CreateEventContext'
import { StripeProvider } from '@stripe/stripe-react-native'
import { STRIPE_PUBLISHABLE_KEY } from '@env'

const App = () => {
  useEffect(() => {
    // Initialize social authentication providers
    configureGoogleSignIn();
    configureFacebookSDK();
  }, []);

  return (
    <>
      {/* StatusBar */}
      <StatusBar
        backgroundColor="#fff"
        barStyle="dark-content"
      />

      <SafeAreaProvider style={styles.container}>
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY || ''}
          merchantIdentifier="merchant.com.overlaypix"
          urlScheme="overlaypix"
        >
          <CreateEventProvider>
            <AppNavigator />
            <Toast />
          </CreateEventProvider>
        </StripeProvider>
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
