import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../../contants/Icons';
import { images } from '../../../contants/Images';
import { hp, wp } from '../../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

const PhotoSavedScreen = () => {
    const navigation: any = useNavigation();
    const route: any = useRoute();
    const { photo = images.happyBirthday, eventId, fromDashboard = false } = route.params || {};

    // Animated values
    const progressAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const bounceAnim = React.useRef(new Animated.Value(0.7)).current;
    const opacityAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
            easing: Easing.out(Easing.cubic),
        }).start();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
        }).start();
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 1200,
                    delay: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 600);
    }, []);

    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={{ flex: 1 }}>
            {/* Logo and App Name */}
            <View style={styles.header}>
                <Image source={icons.logo} style={styles.logo} resizeMode="contain" />
                <Text style={styles.appName}>Overlay Pix</Text>
                <Text style={styles.photoSaved}>Photo Saved!!</Text>
            </View>

            {/* Photo Preview */}
            <View style={styles.photoPreviewContainer}>
                <Image
                    source={typeof photo === 'string' ? { uri: photo } : photo}
                    style={styles.photoPreview}
                    resizeMode="stretch"
                />
            </View>

            {/* Progress and Success Message (Animated) */}
            <Animated.View style={[styles.progressBox, { opacity: fadeAnim }]}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressHeaderText}>Completed</Text>
                    <Text style={styles.progressHeaderText}>100%</Text>
                </View>
                {/* Animated Progress Bar */}
                <View style={styles.progressBarBackground}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            { width: progressBarWidth }
                        ]}
                    />
                </View>
                
                {/* Animated Success Message */}
                <Animated.View
                    style={[
                        styles.successMsgRow,
                        {
                            transform: [{ scale: bounceAnim }],
                            opacity: bounceAnim,
                        },
                    ]}
                >
                    {/* Check SVG as RN icon workaround: Use Emoji or custom SVG if needed */}
                    <Text style={styles.successIcon}>✅</Text>
                    <Animated.Text style={[styles.successText, { opacity: opacityAnim }]}>
                        Successfully Saved!
                    </Animated.Text>
                </Animated.View>
            </Animated.View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate('userGallery', { eventId, fromDashboard, fromScreen: 'photoSaved' })
                    }
                    style={styles.galleryButton}
                >
                    <Text style={styles.galleryButtonText}>View Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.disabledButton}
                    disabled={true}
                >
                    <Text style={styles.disabledButtonText}>Take Another Photo</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
        padding: wp(3),
        // Simulate gradient: from top to bottom
    },
    header: {
        marginTop: hp(6),
        alignItems: 'center',
    },
    logo: {
        width: wp(15),
        height: wp(15),
        marginBottom: hp(1),
    },
    appName: {
        fontSize: wp(5),
        fontWeight: 'bold',
        color: '#263140',
    },
    photoSaved: {
        fontSize: wp(7),
        fontWeight: 'bold',
        color: '#3DA9B7',
    },
    photoPreviewContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: hp(3),
        maxWidth: wp(96),
        alignSelf: 'center',
    },
    photoPreview: {
        width: '75%',
        height: hp(50),
        borderRadius: wp(4),
        backgroundColor: '#fff',
    },
    progressBox: {
        width: '100%',
        maxWidth: wp(96),
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#CDFBFA',
        borderRadius: wp(4),
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 2 },
        marginTop: hp(3),
        padding: wp(4),
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    progressHeaderText: {
        color: '#424242',
        fontSize: wp(3.5),
        fontWeight: '500',
    },
    progressBarBackground: {
        width: '100%',
        height: hp(1.7),
        backgroundColor: '#E6F6F8',
        borderRadius: wp(1),
        marginBottom: hp(1.5),
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3DA9B7',
        borderRadius: wp(1),
    },
    successMsgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(0.7),
    },
    successIcon: {
        fontSize: wp(5),
        marginRight: wp(1),
        color: '#3DA9B7',
    },
    successText: {
        fontSize: wp(4),
        fontWeight: '600',
        color: '#3DA9B7',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: wp(96),
        borderWidth: 1,
        borderColor: '#CDFBFA',
        backgroundColor: '#fff',
        padding: wp(3),
        borderRadius: wp(4),
        marginTop: hp(4),
        flexDirection: 'column',
        gap: hp(1.5), // Use gap or just marginBottom for buttons
    },
    galleryButton: {
        width: '100%',
        paddingVertical: hp(2),
        backgroundColor: '#3DA9B7',
        borderRadius: wp(3),
        alignItems: 'center',
        marginBottom: hp(1.5),
        shadowColor: '#31909b',
        shadowOpacity: 0.20,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
    galleryButtonText: {
        color: '#fff',
        fontSize: wp(4),
        fontWeight: '600',
    },
    disabledButton: {
        width: '100%',
        paddingVertical: hp(2),
        backgroundColor: '#fff',
        borderRadius: wp(3),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C0BEBE',
        opacity: 0.4,
    },
    disabledButtonText: {
        color: '#C0BEBE',
        fontSize: wp(4),
        fontWeight: '500',
    }
});

export default PhotoSavedScreen;
