import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { profileService } from '../services/profileService';
import { icons } from '../contants/Icons';
import { useNavigation } from '@react-navigation/native';
import { hp, wp } from '../contants/StyleGuide';

interface HeaderProps {
    title?: string;
    subtitle?: string;
    logoSrc?: string;
    userImageSrc?: string;
    logoHover?: boolean;
    isGuest?: boolean;
    isAnonymous?: boolean;
    shareId?: string;
    isDashboard?: boolean;
    fromScreen?: string;
    setUserName?: (name: string) => void;
}

const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    logoSrc = icons.logo,
    logoHover,
    isAnonymous,
    shareId,
    fromScreen,
    setUserName,
    // isDashboard
}) => {
    const navigation: any = useNavigation();
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch profile and update profilePictureUrl in state (do NOT use localStorage)
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const profile = await profileService.getUserProfile();
                const url = profile.profilePictureUrl || null;
                setProfilePictureUrl(url);
                if (setUserName) {
                    setUserName(profile.fullName || '');
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={styles.headerContainer}>
            <View style={styles.rowBetween}>
                <View style={styles.rowAlign}>
                    {logoHover && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => {
                                if (fromScreen === 'photoSaved') {
                                    navigation.replace('joinedEvent');
                                } else {
                                    navigation.goBack();
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            {/* Custom SVG for back arrow */}
                            <View style={styles.svgContainer}>
                                {/* Instead of inline style, use a custom style for the arrow container */}
                                <View style={styles.arrowContainer}>
                                    {/* Instead of inline style, use a custom style for the arrow itself */}
                                    <View style={styles.arrowShape} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    <Image
                        source={typeof logoSrc === 'string' ? { uri: logoSrc } : logoSrc}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appTitle}>Overlay Pix</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => {
                        if (isAnonymous) {
                            navigation.navigate('login', { guest: true, shareId: shareId, isAnonymous: true });
                        } else {
                            navigation.navigate('profile');
                        }
                    }}
                    activeOpacity={0.7}
                >
                    {loading ? (
                        <View style={styles.profileLoading}>
                            <ActivityIndicator size="small" color="#3DA9B7" />
                        </View>
                    ) : profilePictureUrl ? (
                        <View style={styles.profileImageWrapper}>
                            <Image
                                source={{ uri: profilePictureUrl }}
                                style={styles.profileImage}
                                resizeMode="cover"
                            />
                        </View>
                    ) : (
                        <Image
                            source={icons.user}
                            style={styles.defaultUserIcon}
                            resizeMode="contain"
                        />
                    )}
                </TouchableOpacity>
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        marginBottom: hp(2),
        paddingHorizontal: wp(4),
        paddingTop: hp(2),
        backgroundColor: 'transparent',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowAlign: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        marginRight: wp(2),
        padding: wp(1),
        borderRadius: wp(5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    svgContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // New style for the arrow container (replaces inline style)
    arrowContainer: {
        width: wp(7),
        height: wp(7),
        justifyContent: 'center',
        alignItems: 'center',
    },
    // New style for the arrow shape (replaces inline style)
    arrowShape: {
        width: 0,
        height: 0,
        borderTopWidth: wp(3),
        borderBottomWidth: wp(3),
        borderRightWidth: wp(4),
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: '#3DA9B7',
    },
    logo: {
        width: wp(12),
        height: wp(12),
        marginRight: wp(2),
    },
    appTitle: {
        fontWeight: 'bold',
        fontSize: wp(4),
        color: '#263140',
        marginBottom: 0,
    },
    profileButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        overflow: 'hidden',
    },
    profileLoading: {
        width: wp(8),
        height: wp(8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageWrapper: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        borderWidth: 2,
        borderColor: '#3DA9B7',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(0.5),
        backgroundColor: '#fff',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: wp(5),
    },
    defaultUserIcon: {
        width: wp(7),
        height: wp(7),
    },
    title: {
        marginLeft: wp(2.5),
        fontWeight: '600',
        fontSize: wp(5),
        color: '#3DA9B7',
        textAlign: 'left',
        marginTop: hp(1),
    },
    subtitle: {
        marginLeft: wp(2.5),
        fontSize: wp(3.2),
        color: '#626666',
        textAlign: 'left',
        marginTop: hp(0.5),
    },
});

export default Header;