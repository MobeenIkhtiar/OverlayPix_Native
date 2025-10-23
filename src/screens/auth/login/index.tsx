import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
// import ConversionBanner from '../../../components/ConversionBanner';
import { Mail, LockKeyhole, ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { loginWithEmail, loginWithGoogle, loginWithApple, loginWithFacebook, db } from '../../../services/loginService.ts';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { showErrorToastWithSupport } from '../../../utils/HelperFunctions.ts';
import CustomInput from '../../../components/CustomInput.tsx';
import Loader from '../../../components/Loader.tsx';
import { icons } from '../../../contants/Icons.ts';
import CustomButton from '../../../components/CustomButton.tsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hp, wp } from '../../../contants/StyleGuide.tsx';

const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [checkingAuth, setCheckingAuth] = useState<boolean>(false);
    // const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
    // const [showConversionBanner, setShowConversionBanner] = useState<boolean>(false);
    // const [conversionProvider, setConversionProvider] = useState<'Google' | 'Facebook' | 'Apple' | 'Email'>('Google');

    const navigation: any = useNavigation();
    const route = useRoute();

    // To avoid setting state on unmounted component
    const isMounted = useRef(true);
    useEffect(() => {
        // AsyncStorage.clear();
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Helper to fetch user role from Firestore
    const fetchUserRole = async (uid: string): Promise<string | null> => {
        try {
            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                console.log('user firebase =>>>>>>>', data)
                return data?.role || null;
            }
            return null;
        } catch (err) {
            console.error('Error fetching user role:', err);
            return null;
        }
    };

    // Helper to navigate and replace history so user can't go back to login
    const safeNavigate = (path: string, params?: any) => {
        // In react-navigation, you can use navigation.replace for replace: true
        // path is expected to be a route name, not a URL
        // We'll map the URLs to route names for navigation
        // You may need to adjust route names to match your navigator
        let routeName = '';
        let routeParams = params || {};
        if (path.startsWith('/dashboard')) routeName = 'dashboard';
        else if (path.startsWith('/joinedEvent')) routeName = 'JoinedEvent';
        else if (path.startsWith('/termsAndPolicy/')) {
            routeName = 'TermsAndPolicy';
            routeParams = { ...routeParams, shareId: path.split('/').pop() };
        }
        else if (path.startsWith('/forgotPassword')) routeName = 'ForgotPassword';
        else if (path.startsWith('/signup')) routeName = 'signup';
        else if (path.startsWith('/createEventLanding')) routeName = 'CreateEventLanding';
        else if (path.startsWith('/landingpage')) routeName = 'LandingPage';
        else routeName = path.replace(/^\//, '');

        navigation.navigate(routeName, routeParams);
    };

    // AsyncStorage helpers
    const getItem = async (key: string) => {
        try {
            return await AsyncStorage.getItem(key);
        } catch {
            return null;
        }
    };
    const setItem = async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch { }
    };
    const removeItem = async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch { }
    };

    // Check if token exists, if so, redirect to dashboard or joinedEvent based on role
    const checkAndRedirect = useCallback(async () => {
        setCheckingAuth(true);
        const token = await getItem('token');
        const isAnon = await getItem('isAnonymous');
        const uid = await getItem('uid');
        // Only check if token exists and isAnonymous is not true
        if (token && isAnon !== 'true' && uid) {
            const role = await fetchUserRole(uid);
            if (role && role !== 'guest') {
                safeNavigate('/dashboard');
                return;
            }
            if (role === 'guest') {
                safeNavigate('/joinedEvent');
                return;
            }
        }
        if (isMounted.current) {
            setCheckingAuth(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Safely extract guest and shareId from route.params
    // In react-navigation, route.params is used instead of location.state
    const params = (route as any).params || {};
    const isGuest = params.guest ?? false;
    const shareId = params.shareId ?? '';
    const isAnonymous = params.isAnonymous ?? false;

    useEffect(() => {
        if (!isGuest) {
            checkAndRedirect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkAndRedirect]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault && e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { user, token } = await loginWithEmail(email, password);
            const role = await fetchUserRole(user.uid);
            if (role !== 'guest' && !user.emailVerified) {
                setError('Please verify your email before logging in. Check your inbox for a verification link.');
                showErrorToastWithSupport('Please verify your email before logging in. Check your inbox for a verification link.');
                setLoading(false);
                return;
            }
            // Save token and UID to AsyncStorage
            await setItem('token', token);
            await setItem('uid', user.uid);
            await setItem('guest_login', isGuest.toString());

            // Remove anonymous flag if user was anonymous
            if (isAnonymous) {
                await removeItem('isAnonymous');
                // setConversionProvider('Email');
                // setShowConversionBanner(true);
                // setTimeout(() => setShowConversionBanner(false), 3000);
            }

            if (shareId && role === 'guest' && !isGuest) {
                await removeItem('isAnonymous');
                safeNavigate(`/termsAndPolicy/${shareId}`);
                return;
            } else if (shareId && isGuest) {
                await removeItem('isAnonymous');
                safeNavigate(`/termsAndPolicy/${shareId}`);
                return;
            }
            else if (role === 'guest' && !isGuest) {
                safeNavigate('/joinedEvent');
                return;
            } else {
                // safeNavigate('/dashboard');

                navigation.navigate('joinedEvent');
                return;
            }
        } catch {
            if (isAnonymous) {
                setError('Account not found. Please sign up to create your account.');
                showErrorToastWithSupport('Account not found. Please sign up to create your account.');
            } else {
                setError('Login failed: Invalid credentials');
                showErrorToastWithSupport('Login failed: Invalid credentials');
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
            await setItem('guest_login', isGuest.toString());

            if (res && res.user) {
                await setItem('token', res.token);
                await setItem('uid', res.user.uid);

                if (res.converted) {
                    await removeItem('isAnonymous');
                    // setConversionProvider('Google');
                    // setShowConversionBanner(true);
                    // setTimeout(() => setShowConversionBanner(false), 3000);
                }

                const role = await fetchUserRole(res.user.uid);

                if (shareId && role === 'guest' && !isGuest) {
                    await removeItem('isAnonymous');
                    safeNavigate(`/termsAndPolicy/${shareId}`);
                    return;
                } else if (shareId && isGuest) {
                    await removeItem('isAnonymous');
                    safeNavigate(`/termsAndPolicy/${shareId}`);
                    return;
                }
                else if (role === 'guest' && !isGuest) {
                    safeNavigate('/joinedEvent');
                    return;
                } else {
                    safeNavigate('/dashboard');
                }
            } else {
                setError('Google login failed: No user returned.');
                showErrorToastWithSupport('Google login failed: No user returned.');
            }
        } catch (err) {
            const msg = 'Google login failed: ' + (err as Error).message;
            setError(msg);
            showErrorToastWithSupport(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await loginWithFacebook(isGuest);
            await setItem('guest_login', isGuest.toString());

            if (res && res.user) {
                await setItem('token', res.token);
                await setItem('uid', res.user.uid);

                if (res.converted) {
                    await removeItem('isAnonymous');
                    // setConversionProvider('Facebook');
                    // setShowConversionBanner(true);
                    // setTimeout(() => setShowConversionBanner(false), 3000);
                }

                const role = await fetchUserRole(res.user.uid);

                if (shareId && role === 'guest' && !isGuest) {
                    await removeItem('isAnonymous');
                    safeNavigate(`/termsAndPolicy/${shareId}`);
                    return;
                } else if (shareId && isGuest) {
                    await removeItem('isAnonymous');
                    safeNavigate(`/termsAndPolicy/${shareId}`);
                    return;
                }
                else if (role === 'guest' && !isGuest) {
                    safeNavigate('/joinedEvent');
                    return;
                } else {
                    safeNavigate('/dashboard');
                }
            } else {
                setError('Facebook login failed: No user returned.');
                showErrorToastWithSupport('Facebook login failed: No user returned.');
            }
        } catch (facebookError: unknown) {
            const msg = 'Facebook login failed: ' + (facebookError instanceof Error ? facebookError.message : String(facebookError));
            setError(msg);
            showErrorToastWithSupport(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await loginWithApple(isGuest);
            await setItem('guest_login', isGuest.toString());

            if (res && res.user) {
                await setItem('token', res.token);
                await setItem('uid', res.user.uid);

                if (res.converted) {
                    await removeItem('isAnonymous');
                    // setConversionProvider('Apple');
                    // setShowConversionBanner(true);
                    // setTimeout(() => setShowConversionBanner(false), 3000);
                }

                const role = await fetchUserRole(res.user.uid);

                if (shareId && role === 'guest' && !isGuest) {
                    await removeItem('isAnonymous');
                    safeNavigate(`/termsAndPolicy/${shareId}`);
                    return;
                } else if (shareId && isGuest) {
                    await removeItem('isAnonymous');
                    safeNavigate(`/termsAndPolicy/${shareId}`);
                    return;
                }
                else if (role === 'guest' && !isGuest) {
                    safeNavigate('/joinedEvent');
                    return;
                } else {
                    safeNavigate('/dashboard');
                }
            } else {
                setError('apple login failed: No user returned.');
                showErrorToastWithSupport('Apple login failed: No user returned.');
            }
        } catch (err: unknown) {
            const msg = 'Apple login failed: ' + (err instanceof Error ? err.message : String(err));
            setError(msg);
            showErrorToastWithSupport(msg);
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <View style={styles.loadingContainer}>
                <Loader />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
                    {/* Conversion Banner */}
                    {/* <ConversionBanner isVisible={showConversionBanner} provider={conversionProvider} /> */}

                    {/* Show left chevron if isAnonymous is true */}
                    {isAnonymous && (
                        <View style={styles.backButtonContainer}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                                accessibilityLabel="Go back"
                            >
                                <ChevronLeft size={wp(6)} color="#3DA9B7" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image source={icons.logo} style={styles.logo} resizeMode="contain" />
                    </View>

                    <Text style={styles.appTitle}>Overlay Pix</Text>
                    <Text style={styles.welcomeText}>
                        Welcome Back
                    </Text>

                    <View style={styles.formContainer}>
                        <Text style={styles.signInTitle}>
                            Sign in
                        </Text>
                        <Text style={styles.signInSubtitle}>
                            Enter your details to access your account
                        </Text>

                        <View>
                            <CustomInput
                                label="Email"
                                placeholder="Enter your email"
                                icon={<Mail size={wp(4)} color="rgba(0,0,0,0.35)" />}
                                value={email}
                                onChange={(val: string) => setEmail(val)}
                            />
                            <CustomInput
                                label="Password"
                                placeholder="Enter your password"
                                icon={<LockKeyhole size={wp(4)} color="rgba(0,0,0,0.35)" />}
                                value={password}
                                onChange={(val: string) => setPassword(val)}
                                secureTextEntry={true}
                            />
                            {error && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}
                            <CustomButton
                                title={loading ? 'Signing in...' : 'Sign in'}
                                onPress={handleSubmit}
                                disabled={loading}
                                loading={loading}
                                testID="login-submit-button"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.forgotPasswordContainer}
                            onPress={() => safeNavigate('/forgotPassword')}
                        >
                            <Text style={styles.forgotPasswordText}>
                                Forgot Password
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialButtonsContainer}>
                            {Platform.OS === 'android' && <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleGoogleLogin}
                                disabled={loading}
                            >
                                <Image source={icons.google} style={styles.socialIcon} />
                            </TouchableOpacity>}
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleFacebookLogin}
                                disabled={loading}
                            >
                                <Image source={icons.facebook} style={styles.socialIcon} />
                            </TouchableOpacity>
                            {Platform.OS === 'ios' && <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleAppleLogin}
                                disabled={loading}
                            >
                                <Image source={icons.apple} style={styles.socialIcon} />
                            </TouchableOpacity>}
                        </View>

                        <View style={styles.signUpContainer}>
                            <Text style={styles.signUpText}>
                                Don't have an account?
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    safeNavigate('/signup', {
                                        guest: isGuest,
                                        shareId: shareId,
                                        isAnonymous: isAnonymous
                                    })
                                }}
                            >
                                <Text style={styles.signUpLink}>
                                    Sign up
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
    },
    contentContainer: {
        flexGrow: 1,
        alignItems: 'center',
        paddingTop: hp(1),
        paddingBottom: hp(2.5),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F6FEFF',
    },
    backButtonContainer: {
        position: 'absolute',
        top: hp(2),
        left: wp(4),
        zIndex: 10,
    },
    backButton: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: hp(0.25),
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 0,
    },
    logo: {
        width: wp(15),
        height: wp(15),
    },
    appTitle: {
        fontSize: wp(3.5),
        fontWeight: 'bold',
        color: '#263140',
        marginBottom: 0,
    },
    welcomeText: {
        fontSize: wp(4.5),
        fontWeight: 'bold',
        color: '#3DA9B7',
        marginTop: hp(0.5),
        marginBottom: hp(2),
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: wp(4),
        marginBottom: hp(4),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: hp(0.25),
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        padding: wp(6),
        width: wp(85),
        maxWidth: '90%',
        borderWidth: 0.2,
        borderColor: '#40F1E9',
    },
    signInTitle: {
        color: '#3DA9B7',
        fontWeight: '600',
        fontSize: wp(4.5),
        marginBottom: hp(0.5),
        textAlign: 'left',
    },
    signInSubtitle: {
        color: '#7B8A9D',
        fontSize: wp(3),
        marginBottom: hp(1.5),
        textAlign: 'left',
    },
    errorText: {
        color: '#ef4444',
        fontSize: wp(3),
        marginTop: hp(1),
        marginBottom: hp(0.5),
    },
    forgotPasswordContainer: {
        marginTop: hp(1.5),
    },
    forgotPasswordText: {
        color: 'rgba(0,0,0,0.4)',
        fontSize: wp(3.2),
        fontWeight: '500',
    },
    dividerContainer: {
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
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: wp(4),
    },
    socialButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: wp(2),
        width: wp(12),
        height: wp(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialIcon: {
        width: wp(6),
        height: wp(6),
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(3),
    },
    signUpText: {
        color: 'rgba(0,0,0,0.5)',
        fontSize: wp(3.2),
        fontWeight: '500',
    },
    signUpLink: {
        color: '#3DA9B7',
        fontSize: wp(3.5),
        fontWeight: '600',
    },
});

export default Login;
