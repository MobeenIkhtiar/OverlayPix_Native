// src/services/authService.ts
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    GoogleAuthProvider,
    FacebookAuthProvider,
    AppleAuthProvider,
    signInAnonymously,
    linkWithCredential,
    signInWithCredential,
    EmailAuthProvider,
    getAuth
} from '@react-native-firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

// Import the default auth and db instances
export const auth = getAuth();
export const db = getFirestore();

// Login user
export const loginWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
};

// Convert anonymous user to registered user with email and password
export const convertAnonymousToEmail = async (email: string, password: string, fullName: string, isGuest: boolean) => {
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.isAnonymous) {
        throw new Error('No anonymous user to convert');
    }

    try {
        // Create credential with email and password
        const credential = EmailAuthProvider.credential(email, password);
        console.log('isGuest 1 =>>>>>>>', isGuest);
        // Link the anonymous account with email/password
        const result = await linkWithCredential(currentUser, credential);

        // Get the anonymous user's data from Firestore
        const anonymousUserDoc = doc(db, "users", currentUser.uid);
        const anonymousUserData = await getDoc(anonymousUserDoc);

        let role = isGuest ? 'guest' : 'client';
        let existingData: { role?: string } = {};

        // Preserve existing anonymous user data
        if (anonymousUserData.exists()) {
            existingData = anonymousUserData.data() as { role?: string };
            role = existingData?.role || role;
        }

        // Send email verification only if not a guest
        if (!isGuest) {
            console.log('sending email verification not a guest', isGuest);
            await sendEmailVerification(result.user);
        }

        // Update the user document with email registration information
        await updateDoc(anonymousUserDoc, {
            uid: result.user.uid,
            email: result.user.email,
            fullName: fullName,
            role: role,
            provider: "email",
            isAnonymous: false,
            convertedAt: new Date().toISOString()
        });

        const token = await result.user.getIdToken();
        return { user: result.user, token, converted: true };
    } catch (error) {
        console.error('Error converting anonymous user to email:', error);
        throw error;
    }
};

// Register user with email verification and Firestore storage
export const registerWithEmail = async (email: string, password: string, isGuest: boolean, fullName: string) => {
    const currentUser = auth.currentUser;

    // Check if current user is anonymous and convert them
    if (currentUser && currentUser.isAnonymous) {
        return await convertAnonymousToEmail(email, password, fullName, isGuest);
    }

    // Regular registration flow for new users
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Send email verification only if not a guest
    if (!isGuest) {
        console.log('sending email verification new user signup=>', isGuest, 'user=>', result.user);
        await sendEmailVerification(result.user);
    }

    const role = isGuest ? 'guest' : 'client';
    // Store user in Firestore
    await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        fullName: fullName,
        role: role,
        provider: "email",
        createdAt: new Date().toISOString()
    });

    const token = await result.user.getIdToken();
    return { user: result.user, token, converted: false };
};

// Helper function to convert anonymous user to Google signed-in user
const convertAnonymousUserGoogle = async (isGuest: boolean) => {
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.isAnonymous) {
        throw new Error('No anonymous user to convert');
    }

    try {
        // Get Google credentials
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signInResult = await GoogleSignin.signIn();

        const idToken = signInResult.data?.idToken;
        if (!idToken) {
            throw new Error('No ID token found');
        }

        const googleCredential = GoogleAuthProvider.credential(idToken);

        // Link the anonymous account with Google
        const result = await linkWithCredential(currentUser, googleCredential);

        // Get the anonymous user's data from Firestore
        const anonymousUserDoc = doc(db, "users", currentUser.uid);
        const anonymousUserData = await getDoc(anonymousUserDoc);

        let role = isGuest ? 'guest' : 'client';
        let existingData: { role?: string } = {};

        // Preserve existing anonymous user data
        if (anonymousUserData.exists()) {
            existingData = anonymousUserData.data() as { role?: string };
            role = existingData?.role || role;
        }

        // Update the user document with Google login information
        await updateDoc(anonymousUserDoc, {
            uid: result.user.uid,
            email: result.user.email,
            fullName: result.user.displayName,
            role: role,
            provider: 'google',
            isAnonymous: false,
            convertedAt: new Date().toISOString()
        });

        const token = await result.user.getIdToken();
        return { user: result.user, token, converted: true };
    } catch (error) {
        console.error('Error converting anonymous user to Google:', error);
        throw error;
    }
};

// Helper function to convert anonymous user to Facebook signed-in user
const convertAnonymousUserFacebook = async (isGuest: boolean) => {
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.isAnonymous) {
        throw new Error('No anonymous user to convert');
    }

    try {
        // Get Facebook credentials
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

        if (result.isCancelled) {
            throw new Error('User cancelled the login process');
        }

        const data = await AccessToken.getCurrentAccessToken();

        if (!data) {
            throw new Error('Something went wrong obtaining access token');
        }

        const facebookCredential = FacebookAuthProvider.credential(data.accessToken);

        // Link the anonymous account with Facebook
        const linkResult = await linkWithCredential(currentUser, facebookCredential);

        // Get the anonymous user's data from Firestore
        const anonymousUserDoc = doc(db, "users", currentUser.uid);
        const anonymousUserData = await getDoc(anonymousUserDoc);

        let role = isGuest ? 'guest' : 'client';
        let existingData: { role?: string } = {};

        // Preserve existing anonymous user data
        if (anonymousUserData.exists()) {
            existingData = anonymousUserData.data() as { role?: string };
            role = existingData?.role || role;
        }

        // Update the user document with Facebook login information
        await updateDoc(anonymousUserDoc, {
            uid: linkResult.user.uid,
            email: linkResult.user.email,
            fullName: linkResult.user.displayName,
            role: role,
            provider: 'facebook',
            isAnonymous: false,
            convertedAt: new Date().toISOString()
        });

        const token = await linkResult.user.getIdToken();
        return { user: linkResult.user, token, converted: true };
    } catch (error) {
        console.error('Error converting anonymous user to Facebook:', error);
        throw error;
    }
};

// Helper function to convert anonymous user to Apple signed-in user
const convertAnonymousUserApple = async (isGuest: boolean) => {
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.isAnonymous) {
        throw new Error('No anonymous user to convert');
    }

    try {
        // Get Apple credentials
        const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
        });

        if (!appleAuthRequestResponse.identityToken) {
            throw new Error('Apple Sign-In failed - no identify token returned');
        }

        const { identityToken, nonce } = appleAuthRequestResponse;
        const appleCredential = AppleAuthProvider.credential(identityToken, nonce);

        // Link the anonymous account with Apple
        const result = await linkWithCredential(currentUser, appleCredential);

        // Get the anonymous user's data from Firestore
        const anonymousUserDoc = doc(db, "users", currentUser.uid);
        const anonymousUserData = await getDoc(anonymousUserDoc);

        let role = isGuest ? 'guest' : 'client';
        let existingData: { role?: string } = {};

        // Preserve existing anonymous user data
        if (anonymousUserData.exists()) {
            existingData = anonymousUserData.data() as { role?: string };
            role = existingData?.role || role;
        }

        // Update the user document with Apple login information
        await updateDoc(anonymousUserDoc, {
            uid: result.user.uid,
            email: result.user.email,
            fullName: result.user.displayName,
            role: role,
            provider: 'apple',
            isAnonymous: false,
            convertedAt: new Date().toISOString()
        });

        const token = await result.user.getIdToken();
        return { user: result.user, token, converted: true };
    } catch (error) {
        console.error('Error converting anonymous user to Apple:', error);
        throw error;
    }
};

export const loginWithGoogle = async (isGuest: boolean) => {
    try {
        // Check if current user is anonymous
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
            return await convertAnonymousUserGoogle(isGuest);
        }

        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // Get the users ID token
        const signInResult = await GoogleSignin.signIn();

        // Get the ID token from the sign-in result
        const idToken = signInResult.data?.idToken;
        if (!idToken) {
            throw new Error('No ID token found');
        }
        // Create a Google credential with the token
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // Sign-in the user with the credential
        const result = await signInWithCredential(auth, googleCredential);
        console.log("Logged in google:", result.user);

        // Check if user already exists in Firestore
        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);

        let role = isGuest ? 'guest' : 'client';

        // If user already exists, preserve their existing role
        if (userDoc.exists()) {
            const existingData = userDoc.data();
            role = existingData?.role || role; // Keep existing role if it exists
        }

        await setDoc(userDocRef, {
            uid: result.user.uid,
            email: result.user.email,
            fullName: result.user.displayName,
            role: role,
            provider: "google",
            createdAt: new Date().toISOString()
        }, { merge: true });

        const token = await result.user.getIdToken();
        return { user: result.user, token, converted: false };
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
};

export const loginWithFacebook = async (isGuest: boolean) => {
    try {
        // Check if current user is anonymous
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
            return await convertAnonymousUserFacebook(isGuest);
        }

        // Attempt login with permissions
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

        if (result.isCancelled) {
            throw new Error('User cancelled the login process');
        }

        // Once signed in, get the users AccessToken
        const data = await AccessToken.getCurrentAccessToken();

        if (!data) {
            throw new Error('Something went wrong obtaining access token');
        }

        // Create a Firebase credential with the AccessToken
        const facebookCredential = FacebookAuthProvider.credential(data.accessToken);

        // Sign-in the user with the credential
        const signInResult = await signInWithCredential(auth, facebookCredential);
        console.log("Logged in facebook:", signInResult.user);

        // Check if user already exists in Firestore
        const userDocRef = doc(db, "users", signInResult.user.uid);
        const userDoc = await getDoc(userDocRef);

        let role = isGuest ? 'guest' : 'client';

        // If user already exists, preserve their existing role
        if (userDoc.exists()) {
            const existingData = userDoc.data();
            role = existingData?.role || role; // Keep existing role if it exists
        }

        await setDoc(userDocRef, {
            uid: signInResult.user.uid,
            email: signInResult.user.email,
            fullName: signInResult.user.displayName,
            role: role,
            provider: "facebook",
            createdAt: new Date().toISOString()
        }, { merge: true });

        const token = await signInResult.user.getIdToken();
        return { user: signInResult.user, token, converted: false };
    } catch (error) {
        console.error('Facebook login error:', error);
        throw error;
    }
};

// Apple login using AppleAuthProvider
export const loginWithApple = async (isGuest: boolean) => {
    try {
        // Check if current user is anonymous
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
            return await convertAnonymousUserApple(isGuest);
        }

        // Start the sign-in request
        const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
            // See: https://github.com/invertase/react-native-apple-authentication#faqs
            requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
        });

        // Ensure Apple returned a user identityToken
        if (!appleAuthRequestResponse.identityToken) {
            throw new Error('Apple Sign-In failed - no identify token returned');
        }

        // Create a Firebase credential from the response
        const { identityToken, nonce } = appleAuthRequestResponse;
        const appleCredential = AppleAuthProvider.credential(identityToken, nonce);

        // Sign the user in with the credential
        const result = await signInWithCredential(auth, appleCredential);

        // Check if user already exists in Firestore
        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);

        let role = isGuest ? 'guest' : 'client';

        // If user already exists, preserve their existing role
        if (userDoc.exists()) {
            const existingData = userDoc.data();
            role = existingData?.role || role; // Keep existing role if it exists
        }

        await setDoc(userDocRef, {
            uid: result.user.uid,
            email: result.user.email,
            fullName: result.user.displayName,
            role: role,
            provider: "apple",
            createdAt: new Date().toISOString()
        }, { merge: true });

        const token = await result.user.getIdToken();
        return { user: result.user, token, converted: false };
    } catch (error) {
        console.error('Apple login error:', error);
        throw error;
    }
};

// Anonymous sign-in
export const loginAnonymously = async () => {
    const result = await signInAnonymously(auth);
    await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        isAnonymous: true,
        createdAt: new Date().toISOString()
    }, { merge: true });
    const token = await result.user.getIdToken();
    return { user: result.user, token };
};
