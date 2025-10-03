import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Phone, MapPin, ChevronDown, ChevronLeft, Camera, LogOut, Trash2 } from 'lucide-react-native';
import { profileService, type UserProfile } from '../../services/profileService';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { icons } from '../../contants/Icons';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const TIMEZONES = [
    'Pacific Time',
    'Mountain Time',
    'Central Time',
    'Eastern Time',
];

const ProfileScreen: React.FC = () => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [form, setForm] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        location: '',
        timezone: TIMEZONES[0],
        profilePicture: '', // for preview (base64 or uri)
    });
    const [profilePictureFile, setProfilePictureFile] = useState<any>(null); // store file for API
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    const navigation: any = useNavigation();

    useEffect(() => {
        const fetchProfileAsync = async () => {
            await fetchProfile();
            setInitialLoading(false);
        };
        fetchProfileAsync();
    }, []);

    // Effect to clear success after 2 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const fetchProfile = async () => {
        try {
            const profile = await profileService.getUserProfile();

            setUserProfile(profile);
            setForm({
                fullName:
                    profile.fullName && profile.fullName.trim().length > 0
                        ? profile.fullName
                        : '',
                phoneNumber: profile.phoneNumber || '',
                email: profile.email || '',
                location: profile.location || '',
                timezone: profile.timeZone || TIMEZONES[0],
                profilePicture: profile.profilePictureUrl || '',
            });

            setPreviewImage(profile.profilePictureUrl || null);
            setProfilePictureFile(null); // clear file on fetch
            setError(null);
        } catch (error) {
            setError('Failed to fetch user profile');
            console.error('Failed to fetch user profile:', error);
        }
    };

    // Determine display name: show name if exists, otherwise empty
    const displayName = React.useMemo(() => {
        if (userProfile) {
            if (userProfile.fullName && userProfile.fullName.trim().length > 0) {
                return userProfile.fullName;
            }
        }
        return "";
    }, [userProfile]);

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle profile picture selection using react-native-image-picker
    const handleCameraClick = async () => {
        // react-native-image-picker does not require explicit permission request for library
        const options = {
            mediaType: 'photo',
            includeBase64: true,
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.7,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                // User cancelled
                return;
            }
            if (response.errorCode) {
                Alert.alert('Error', response.errorMessage || 'Failed to pick image');
                return;
            }
            if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                setProfilePictureFile(asset);
                setPreviewImage(asset.uri || null);
                setForm((prev) => ({
                    ...prev,
                    profilePicture: asset.base64
                        ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
                        : asset.uri || '',
                }));
            }
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setSuccess(null);
        setError(null);
        try {
            // Prepare FormData for file upload
            const formData: any = new FormData();
            formData.append('fullName', form.fullName);
            formData.append('phoneNumber', form.phoneNumber);
            formData.append('location', form.location);
            formData.append('timeZone', form.timezone);
            // Only append file if user selected a new one
            if (profilePictureFile && profilePictureFile.uri) {
                // react-native-image-picker asset has uri, fileName, type
                formData.append('profilePicture', {
                    uri: profilePictureFile.uri,
                    name: profilePictureFile.fileName || 'profile.jpg',
                    type: profilePictureFile.type || 'image/jpeg',
                });
            }

            const res = await profileService.updateUserProfile(formData);
            fetchProfile();
            setUserProfile(res);
            setSuccess('Profile updated successfully!');
            // Optionally update preview image if the profile picture was changed
            if (profilePictureFile) {
                setPreviewImage(form.profilePicture);
                setProfilePictureFile(null);
            }
        } catch (err) {
            setError('Failed to update profile');
            console.error('Failed to update user profile:', err);
        } finally {
            setLoading(false);
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('uid');
            await AsyncStorage.removeItem('profilePicture');
            await AsyncStorage.removeItem('isAnonymous');
        } catch (e) {
            // handle error if needed
        }
        Alert.alert('Logout', 'You have been logged out.');
        navigation.reset({ index: 0, routes: [{ name: 'login' }] });
    };

    // Back button handler
    const handleBack = () => {
        navigation.goBack();
    };

    const deleteAccount = async () => {
        try {
            const res: any = await profileService.deleteUserProfile();
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('uid');
            await AsyncStorage.removeItem('profilePicture');
            await AsyncStorage.removeItem('isAnonymous');

            console.log('delete account res =>>>>>>>>>>>>>>>>>>>>>>>>>', res);
            Toast.show({
                type: 'success',
                text1: 'Account deleted successfully',
            });
            navigation.reset({ index: 0, routes: [{ name: 'login' }] });
        } catch (error: any) {
            console.error('Failed to delete user profile:', error);
        }
    };

    // Account deletion handler (placeholder)
    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                // You can implement actual deletion logic here
                { text: 'Delete', style: 'destructive', onPress: () => deleteAccount() },
            ]
        );
    };

    // Show loader while fetching initial profile data
    if (initialLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3DA9B7" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            onPress={handleBack}
                            style={styles.backButton}
                            accessibilityLabel="Back"
                        >
                            <ChevronLeft size={24} color="#181D27" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Profile</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.logoutButton}
                        accessibilityLabel="Logout"
                    >
                        <LogOut size={20} color="#ffffff" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
                {/* {userProfile && (
                <Text style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>Logged in as: {userProfile.email}</Text>
            )} */}

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={previewImage ? { uri: previewImage } : icons.user}
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                        {/* Camera icon overlay (for edit avatar) */}
                        <TouchableOpacity
                            style={styles.cameraOverlay}
                            onPress={handleCameraClick}
                            accessibilityLabel="Change profile picture"
                        >
                            <Camera color="#3DA9B7" size={18} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profileEmail}>{userProfile?.email}</Text>
                    </View>
                    {/* Delete account icon on the right */}
                    <TouchableOpacity
                        style={styles.deleteAccountButton}
                        onPress={handleDeleteAccount}
                        accessibilityLabel="Delete account"
                    >
                        <Trash2 size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Personal Information Form */}
                <View style={styles.formCard}>
                    <View style={{ marginBottom: 24 }}>
                        <Text style={styles.formTitle}>Personal Information</Text>
                        <Text style={styles.formSubtitle}>Update your personal details and contact information</Text>
                    </View>
                    <View>
                        <CustomInput
                            label="Full Name"
                            placeholder="Full Name"
                            value={form.fullName}
                            onChange={(name: string) =>
                                handleChange('fullName', name)
                            }
                        />
                        <CustomInput
                            label="Email"
                            placeholder="john.doe@example.com"
                            icon={<Mail size={16} color="#3DA9B7" />}
                            keyboardType="email-address"
                            value={form.email}
                            readOnly={false}
                            disabled={true}
                        />
                        <CustomInput
                            label="Phone Number"
                            placeholder="+1 (555) 123-4567"
                            icon={<Phone size={16} color="#3DA9B7" />}
                            keyboardType="phone-pad"
                            value={form.phoneNumber}
                            onChange={(val: string) =>
                                handleChange('phoneNumber', val)
                            }
                        />
                        <CustomInput
                            label="Location"
                            placeholder="San Francisco, CA"
                            icon={<MapPin size={16} color="#3DA9B7" />}
                            value={form.location}
                            onChange={(val: string) =>
                                handleChange('location', val)
                            }
                        />
                        {/* Time zone dropdown */}
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.timezoneLabel}>Time zone</Text>
                            <View style={styles.timezonePickerRow}>
                                <View style={styles.timezoneIcon}>
                                    <Phone size={16} color="#B2B2B2" />
                                </View>
                                <View style={styles.timezonePickerContainer}>
                                    <TouchableOpacity
                                        style={styles.timezonePickerTouchable}
                                        onPress={() => {
                                            Alert.alert(
                                                'Select Timezone',
                                                undefined,
                                                TIMEZONES.map((tz) => ({
                                                    text: tz,
                                                    onPress: () => handleChange('timezone', tz),
                                                }))
                                            );
                                        }}
                                    >
                                        <Text style={styles.timezonePickerText}>{form.timezone}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.timezoneChevron}>
                                    <ChevronDown size={16} color="#B2B2B2" />
                                </View>
                            </View>
                        </View>
                        {success && (
                            <Text style={styles.successText}>{success}</Text>
                        )}
                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}
                        <CustomButton
                            title={loading ? 'Saving...' : 'Save'}
                            onPress={handleSubmit}
                            disabled={loading}
                            loading={loading}
                            testID="login-submit-button"
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        minHeight: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        marginTop: 24,
        marginLeft: 4,
        paddingHorizontal: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 999,
        backgroundColor: '#F6FEFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#EF4444',
        borderRadius: 6,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 4,
    },
    profileCard: {
        width: '100%',
        backgroundColor: '#3DA9B7',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginBottom: 24,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 4,
        borderColor: '#fff',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#fff',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E6F7FA',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 4,
        left: 44,
        zIndex: 20,
        backgroundColor: '#fff',
        borderRadius: 999,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    profileName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'left',
        marginBottom: 2,
    },
    profileEmail: {
        color: '#fff',
        opacity: 0.8,
        fontSize: 14,
        textAlign: 'left',
    },
    deleteAccountButton: {
        marginLeft: 16,
        padding: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(239,68,68,0.8)', // red with some transparency
        alignItems: 'center',
        justifyContent: 'center',
    },
    formCard: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E6F7FA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        marginBottom: 32,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3DA9B7',
        textAlign: 'left',
        marginBottom: 4,
    },
    formSubtitle: {
        color: '#626666',
        textAlign: 'left',
        fontSize: 12,
    },
    timezoneLabel: {
        fontWeight: '500',
        fontSize: 14,
        color: '#000',
        opacity: 0.5,
        marginBottom: 6,
        textAlign: 'left',
    },
    timezonePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
    },
    timezoneIcon: {
        marginRight: 8,
    },
    timezonePickerContainer: {
        flex: 1,
    },
    timezonePickerTouchable: {
        flex: 1,
        justifyContent: 'center',
        height: 48,
    },
    timezonePickerText: {
        color: '#B2B2B2',
        fontSize: 14,
    },
    timezoneChevron: {
        marginLeft: 8,
    },
    successText: {
        color: '#16A34A',
        fontSize: 14,
        marginBottom: 8,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        marginBottom: 8,
    },
});

export default ProfileScreen;
