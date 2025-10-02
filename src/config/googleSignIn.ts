import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '897196028997-3mlm6p213cfkd9h3udv9j4u9fjgg4p8p.apps.googleusercontent.com',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
    });
};
