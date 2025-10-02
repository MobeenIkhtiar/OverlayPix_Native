import React, { useState } from 'react';
// import ConversionBanner from '../../../components/ConversionBanner';
import { Mail, LockKeyhole, ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// import { apiService } from '../../../services/api';
// import { endPoints } from '../../../services/Endpoints';
import { db, loginWithApple, loginWithGoogle, loginWithFacebook, registerWithEmail } from '../../../services/loginService.ts';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { icons } from '../../../contants/Icons.ts';
import { Image, Text, View, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomInput from '../../../components/CustomInput.tsx';
import CustomButton from '../../../components/CustomButton.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hp, wp } from '../../../contants/StyleGuide.tsx';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation: at least 8 characters
const passwordRegex = /^.{8,}$/;

const Signup: React.FC = () => {
    const navigation: any = useNavigation();
    const route = useRoute();

    // Extract params from route
    const params = (route as any).params || {};
    const isGuest = params.guest ?? false;
    const shareId = params.shareId ?? '';
    const isAnonymous = params.isAnonymous ?? false;

    const [fullName, setFullName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    // const [showConversionBanner, setShowConversionBanner] = useState<boolean>(false);
    // const [conversionProvider, setConversionProvider] = useState<'Google' | 'Facebook' | 'Apple' | 'Email'>('Google');

    // Validation error states
    const [fullNameError, setFullNameError] = useState<string>('');
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Helper to fetch user role from Firestore
    const fetchUserRole = async (uid: string): Promise<string | null> => {
        try {
            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                // console.log('user firebase =>>>>>>>', data)
                return data?.role || null;
            }
            return null;
        } catch (err) {
            console.error('Error fetching user role:', err);
            return null;
        }
    };

    // Helper to navigate and replace history so user can't go back to signup
    const safeNavigate = (screen: string, navigationParams?: any) => {
        navigation.navigate(screen, navigationParams);
    };

    const validate = () => {
        let valid = true;

        // Full name validation
        if (!fullName.trim()) {
            setFullNameError('Full name is required');
            valid = false;
        } else {
            setFullNameError('');
        }

        // Email validation
        if (!email) {
            setEmailError('Email is required');
            valid = false;
        } else if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email');
            valid = false;
        } else {
            setEmailError('');
        }

        // Password validation
        if (!password) {
            setPasswordError('Password is required');
            valid = false;
        } else if (!passwordRegex.test(password)) {
            setPasswordError(
                'Password must be at least 8 characters'
            );
            valid = false;
        } else {
            setPasswordError('');
        }

        // Confirm password validation
        if (!confirmPassword) {
            setConfirmPasswordError('Please confirm your password');
            valid = false;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            valid = false;
        } else {
            setConfirmPasswordError('');
        }

        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            return;
        }
        setLoading(true);
        try {
            const res = await registerWithEmail(email, password, isGuest, fullName);
            // console.log('Firebase Signup response:', res.user);

            if (res) {
                // Store token and UID if user was converted or created
                if (res.user) {
                    // await AsyncStorage.setItem('token', res.token);
                    // await AsyncStorage.setItem('uid', res.user.uid);
                    // await AsyncStorage.setItem('guest_login', isGuest.toString());

                    // Remove anonymous flag if user was converted
                    if (res.converted) {
                        await AsyncStorage.removeItem('isAnonymous');
                        console.log('Anonymous user successfully converted to email account');
                        // setConversionProvider('Email');
                        // setShowConversionBanner(true);
                        // Hide banner after 3 seconds
                        // setTimeout(() => setShowConversionBanner(false), 3000);
                    }
                }

                // After successful signup, always navigate to "Login"
                navigation.navigate('login', { guest: isGuest, shareId: shareId });
                return;
            }
        } catch (signupError: unknown) {
            console.error('Signup error:', signupError);
            const firebaseError = signupError as { code?: string };
            if (firebaseError.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists. Please try signing in instead.');
            } else if (firebaseError.code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger password.');
            } else if (firebaseError.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('Signup failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await loginWithGoogle(isGuest);
            await AsyncStorage.setItem('guest_login', isGuest.toString());

            if (res && res.user) {
                await AsyncStorage.setItem('token', res.token);
                await AsyncStorage.setItem('uid', res.user.uid);

                // Remove anonymous flag if user was converted
                if (res.converted) {
                    await AsyncStorage.removeItem('isAnonymous');
                    console.log('Anonymous user successfully converted to Google account');
                    // setConversionProvider('Google');
                    // setShowConversionBanner(true);
                    // Hide banner after 3 seconds
                    // setTimeout(() => setShowConversionBanner(false), 3000);
                }

                // Fetch user role from Firestore
                const role = await fetchUserRole(res.user.uid);

                // If isGuest is true, redirect to terms and conditions page with shareId
                if (shareId) {
                    safeNavigate('TermsAndPolicy', { shareId });
                    return;
                } else {
                    // Check if user already exists and has a role
                    if (role === 'guest') {
                        // If role is guest, navigate to joinedEvent screen
                        safeNavigate('JoinedEvent');
                        return;
                    } else if (role === 'client') {
                        // If role is client, navigate to dashboard
                        safeNavigate('dashboard');
                        return;
                    } else {
                        // New user, navigate to dashboard
                        safeNavigate('dashboard');
                        return;
                    }
                }
            } else {
                setError('Google login failed: No user returned.');
            }
        } catch (googleError) {
            setError('Google login failed: ' + (googleError as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await loginWithFacebook(isGuest);
            await AsyncStorage.setItem('guest_login', isGuest.toString());

            if (res && res.user) {
                await AsyncStorage.setItem('token', res.token);
                await AsyncStorage.setItem('uid', res.user.uid);

                // Remove anonymous flag if user was converted
                if (res.converted) {
                    await AsyncStorage.removeItem('isAnonymous');
                    console.log('Anonymous user successfully converted to Facebook account');
                    // setConversionProvider('Facebook');
                    // setShowConversionBanner(true);
                    // // Hide banner after 3 seconds
                    // setTimeout(() => setShowConversionBanner(false), 3000);
                }

                // Fetch user role from Firestore
                const role = await fetchUserRole(res.user.uid);

                // If isGuest is true, redirect to terms and conditions page with shareId
                if (shareId) {
                    safeNavigate('TermsAndPolicy', { shareId });
                    return;
                } else {
                    // Check if user already exists and has a role
                    if (role === 'guest') {
                        // If role is guest, navigate to joinedEvent screen
                        safeNavigate('JoinedEvent');
                        return;
                    } else if (role === 'client') {
                        // If role is client, navigate to dashboard
                        safeNavigate('dashboard');
                        return;
                    } else {
                        // New user, navigate to dashboard
                        safeNavigate('dashboard');
                        return;
                    }
                }
            } else {
                setError('Facebook login failed: No user returned.');
            }
        } catch (facebookError: unknown) {
            setError('Facebook login failed: ' + (facebookError instanceof Error ? facebookError.message : String(facebookError)));
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await loginWithApple(isGuest);
            await AsyncStorage.setItem('guest_login', isGuest.toString());

            if (res && res.user) {
                await AsyncStorage.setItem('token', res.token);
                await AsyncStorage.setItem('uid', res.user.uid);

                // Remove anonymous flag if user was converted
                if (res.converted) {
                    await AsyncStorage.removeItem('isAnonymous');
                    console.log('Anonymous user successfully converted to Apple account');
                    // setConversionProvider('Apple');
                    // setShowConversionBanner(true);
                    // // Hide banner after 3 seconds
                    // setTimeout(() => setShowConversionBanner(false), 3000);
                }

                // Fetch user role from Firestore
                const role = await fetchUserRole(res.user.uid);

                // If isGuest is true, redirect to terms and conditions page with shareId
                if (shareId) {
                    safeNavigate('TermsAndPolicy', { shareId });
                    return;
                } else {
                    // Check if user already exists and has a role
                    if (role === 'guest') {
                        // If role is guest, navigate to joinedEvent screen
                        safeNavigate('JoinedEvent');
                        return;
                    } else if (role === 'client') {
                        // If role is client, navigate to dashboard
                        safeNavigate('dashboard');
                        return;
                    } else {
                        // New user, navigate to dashboard
                        safeNavigate('dashboard');
                        return;
                    }
                }
            } else {
                setError('Apple login failed: No user returned.');
            }
        } catch (appleError: unknown) {
            setError('Apple login failed: ' + (appleError instanceof Error ? appleError.message : String(appleError)));
        } finally {
            setLoading(false);
        }
    };

    // The following is a React Native version of the UI, using View, TouchableOpacity, etc.
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1, width: '100%' }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Conversion Banner */}
                    {/* <ConversionBanner isVisible={showConversionBanner} provider={conversionProvider} /> */}

                    {/* Show left chevron if isAnonymous is true */}
                    {isAnonymous && (
                        <View style={styles.chevronContainer}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.chevronButton}
                                accessibilityLabel="Go back"
                            >
                                <ChevronLeft size={wp(6)} color="#3DA9B7" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={{ alignItems: 'center' }}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image source={icons.logo} style={styles.logo} />
                        </View>
                        <Text style={styles.overlayPixText}>Overlay Pix</Text>
                        <Text style={styles.createAccountText}>
                            {'Create Account'}
                        </Text>
                        <Text style={styles.subtitleText}>
                            {'Start creating your events today'}
                        </Text>
                    </View>
                    <View style={styles.formCard}>
                        <Text style={styles.signupTitle}>
                            {'Sign up'}
                        </Text>
                        <Text style={styles.signupSubtitle}>
                            {'Enter your details to create your account'}
                        </Text>
                        {/* Form */}
                        <View>
                            <CustomInput
                                label="Full Name"
                                placeholder="Enter your Full Name"
                                icon={<Mail size={wp(4)} color="rgba(0,0,0,0.35)" />}
                                value={fullName}
                                onChange={setFullName}
                                error={fullNameError}
                            />
                            <CustomInput
                                label="Email"
                                placeholder="Enter your email"
                                icon={<Mail size={wp(4)} color="rgba(0,0,0,0.35)" />}
                                value={email}
                                onChange={setEmail}
                                error={emailError}
                            />
                            <CustomInput
                                label="Password"
                                placeholder="Enter your password"
                                icon={<LockKeyhole size={wp(4)} color="rgba(0,0,0,0.35)" />}
                                value={password}
                                onChange={setPassword}
                                secureTextEntry={true}
                                error={passwordError}
                            />
                            <CustomInput
                                label="Confirm password"
                                placeholder="Enter your Confirm password"
                                icon={<LockKeyhole size={wp(4)} color="rgba(0,0,0,0.35)" />}
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                secureTextEntry={true}
                                error={confirmPasswordError}
                            />
                            {/* Show error in red below the form if present */}
                            {error ? (
                                <Text style={styles.errorText}>{error}</Text>
                            ) : null}
                            <CustomButton
                                title={loading ? 'Signing Up...' : 'Sign Up'}
                                onPress={handleSubmit}
                                disabled={loading}
                                loading={loading}
                                testID="signup-submit-button"
                            />
                        </View>
                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>
                        {/* Social Buttons */}
                        <View style={styles.socialButtonsRow}>
                            {Platform.OS === 'android' &&
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <Image source={icons.google} style={styles.socialIcon} />
                                </TouchableOpacity>
                            }
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleFacebookLogin}
                                disabled={loading}
                            >
                                <Image source={icons.facebook} style={styles.socialIcon} />
                            </TouchableOpacity>
                            {Platform.OS === 'ios' &&
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={handleAppleLogin}
                                    disabled={loading}
                                >
                                    <Image source={icons.apple} style={styles.socialIcon} />
                                </TouchableOpacity>
                            }
                        </View>
                        <View style={styles.signinRow}>
                            <Text style={styles.alreadyAccountText}>
                                {'Already have an account? '}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    navigation.replace('login', { guest: isGuest, shareId: shareId, isAnonymous: isAnonymous });
                                }}
                            >
                                <Text style={styles.signinText}>
                                    Sign in
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: hp(5),
        backgroundColor: '#F6FEFF',
    },
    chevronContainer: {
        position: 'absolute',
        top: hp(2),
        left: wp(4),
        zIndex: 10,
    },
    chevronButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logoContainer: {
        marginBottom: 0,
    },
    logo: {
        width: wp(20),
        height: wp(20),
        resizeMode: 'contain',
    },
    overlayPixText: {
        fontWeight: 'bold',
        fontSize: wp(4.5),
        color: '#263140',
        marginBottom: 0,
    },
    createAccountText: {
        fontWeight: 'bold',
        fontSize: wp(5),
        color: '#3DA9B7',
        marginTop: hp(1),
        marginBottom: 0,
    },
    subtitleText: {
        color: '#7B8A9D',
        fontSize: wp(3.5),
        marginTop: hp(1),
        marginBottom: hp(3),
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: wp(4),
        marginBottom: hp(4),
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        padding: wp(6),
        width: wp(85),
        maxWidth: '90%',
        alignSelf: 'center',
        borderWidth: 0.2,
        borderColor: '#40F1E9',
    },
    signupTitle: {
        color: '#3DA9B7',
        fontWeight: '600',
        fontSize: wp(5),
        marginBottom: hp(0.5),
        textAlign: 'left',
    },
    signupSubtitle: {
        color: '#7B8A9D',
        fontSize: wp(3),
        marginBottom: hp(2),
        textAlign: 'left',
    },
    errorText: {
        color: '#f87171',
        fontSize: wp(3),
        marginTop: hp(1),
        marginBottom: hp(0.5),
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: hp(1.5),
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: wp(3),
        color: '#7B8A9D',
        fontSize: wp(3.5),
    },
    socialButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: wp(4),
    },
    socialButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: wp(2),
        width: wp(12),
        height: wp(12),
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: wp(2), // fallback for gap
    },
    socialIcon: {
        width: wp(6),
        height: wp(6),
    },
    signinRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(3),
    },
    alreadyAccountText: {
        color: '#000',
        opacity: 0.5,
        fontSize: wp(3.2),
        fontWeight: '500',
    },
    signinText: {
        color: '#3DA9B7',
        fontSize: wp(3.5),
        fontWeight: '600',
    },
});

export default Signup;
