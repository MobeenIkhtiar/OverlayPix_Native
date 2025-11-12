import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Mail, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, sendPasswordResetEmail } from '@react-native-firebase/auth';
import { showErrorToastWithSupport } from '../../../utils/HelperFunctions';
import CustomInput from '../../../components/CustomInput';
import CustomButton from '../../../components/CustomButton';
import { icons } from '../../../contants/Icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hp, wp } from '../../../contants/StyleGuide';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);
    
    const navigation: any = useNavigation();
    const auth = getAuth();

    const handleSubmit = async () => {
        setError('');
        setSuccess(false);

        if (!email) {
            setError('Please enter your email.');
            showErrorToastWithSupport('Please enter your email.');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            showErrorToastWithSupport('Please enter a valid email address.');
            return;
        }

        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
            
            // Show success alert
            Alert.alert(
                'Email Sent',
                'Password reset email has been sent. Please check your inbox.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (err: any) {
            console.error('Password reset error:', err);
            
            let errorMessage = 'Failed to send password reset email. Please try again.';
            
            if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please try again later.';
            }
            
            setError(errorMessage);
            showErrorToastWithSupport(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView 
                    contentContainerStyle={styles.contentContainer} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back Button */}
                    <View style={styles.backButtonContainer}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            accessibilityLabel="Go back"
                        >
                            <ChevronLeft size={wp(6)} color="#3DA9B7" />
                        </TouchableOpacity>
                    </View>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image source={icons.logo} style={styles.logo} resizeMode="contain" />
                    </View>

                    <Text style={styles.appTitle}>Overlay Pix</Text>
                    <Text style={styles.pageTitle}>
                        Forgot Password?
                    </Text>
                    <Text style={styles.pageSubtitle}>
                        No worries, we'll send you reset instructions
                    </Text>

                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>
                            Reset Password
                        </Text>
                        <Text style={styles.formSubtitle}>
                            Enter your email address and we'll send you a link to reset your password
                        </Text>

                        <View>
                            <CustomInput
                                label="Email"
                                placeholder="Enter your email"
                                icon={<Mail size={wp(4)} color="rgba(0,0,0,0.35)" />}
                                value={email}
                                onChange={(val: string) => setEmail(val)}
                                keyboardType="email-address"
                            />
                            
                            {error && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}
                            
                            {success && (
                                <Text style={styles.successText}>
                                    Password reset email sent! Check your inbox.
                                </Text>
                            )}

                            <CustomButton
                                title={loading ? 'Sending...' : 'Send Reset Link'}
                                onPress={handleSubmit}
                                disabled={loading}
                                loading={loading}
                                testID="forgot-password-submit-button"
                            />
                        </View>

                        <View style={styles.backToLoginContainer}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backToLoginButton}
                            >
                                <ChevronLeft size={wp(4)} color="#3DA9B7" />
                                <Text style={styles.backToLoginText}>
                                    Back to Login
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
        marginTop: hp(6),
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
    pageTitle: {
        fontSize: wp(5),
        fontWeight: 'bold',
        color: '#3DA9B7',
        marginTop: hp(0.5),
        marginBottom: hp(0.5),
    },
    pageSubtitle: {
        fontSize: wp(3.2),
        color: '#7B8A9D',
        marginBottom: hp(2),
        textAlign: 'center',
        paddingHorizontal: wp(8),
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
    formTitle: {
        color: '#3DA9B7',
        fontWeight: '600',
        fontSize: wp(4.5),
        marginBottom: hp(0.5),
        textAlign: 'left',
    },
    formSubtitle: {
        color: '#7B8A9D',
        fontSize: wp(3),
        marginBottom: hp(1.5),
        textAlign: 'left',
        lineHeight: wp(4.5),
    },
    errorText: {
        color: '#ef4444',
        fontSize: wp(3),
        marginTop: hp(1),
        marginBottom: hp(0.5),
    },
    successText: {
        color: '#10b981',
        fontSize: wp(3),
        marginTop: hp(1),
        marginBottom: hp(0.5),
    },
    backToLoginContainer: {
        marginTop: hp(2),
        alignItems: 'center',
    },
    backToLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backToLoginText: {
        color: '#3DA9B7',
        fontSize: wp(3.5),
        fontWeight: '600',
        marginLeft: wp(1),
    },
});

export default ForgotPassword;
