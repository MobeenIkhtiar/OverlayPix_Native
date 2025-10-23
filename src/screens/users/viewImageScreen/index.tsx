import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../../components/Header';
import { guestServices } from '../../../services/guestsService';
import { hp, wp } from '../../../contants/StyleGuide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share2 } from 'lucide-react-native';

type Photo = {
    photoUrl: string;
    guestName?: string;
    [key: string]: unknown;
};

type EventInfo = {
    name?: string;
    [key: string]: unknown;
};

type AllImagesResponse = {
    eventInfo?: EventInfo;
    photos?: Photo[];
};

const ViewImageScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { eventID, guestId, shareId } = route.params || {};
    const [allImages, setAllImages] = useState<AllImagesResponse>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

    // Track which image is currently selected for main display
    const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

    // For share feedback
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
        const checkIsAnonymous = async () => {
            try {
                const isAnon = await AsyncStorage.getItem('isAnonymous');
                setIsAnonymous(isAnon === 'true');
            } catch (error) {
                console.error('Error reading isAnonymous:', error);
            }
        };

        checkIsAnonymous();
    }, []);

    useEffect(() => {
        fetchAllImages();
    }, []);

    const fetchAllImages = async () => {
        if (!eventID) {
            setError('No eventId');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching images for eventId:', eventID, 'guestId:', guestId);
            const response: any = await guestServices.getImageById(eventID, guestId);
            console.log('View Image Fetched response:', response);

            setAllImages(response || {});
            setSelectedImageIdx(0); // Reset to first image on new fetch
        } catch (err: any) {
            setError(
                err instanceof Error
                    ? (err as any).error || err.message
                    : 'Error fetching All photos images'
            );
        } finally {
            setLoading(false);
        }
    };

    // Prepare photos array
    const photos: Photo[] = Array.isArray(allImages?.photos) ? allImages.photos : [];

    // Use the selected image as the main image, fallback to null
    const mainImage = photos.length > 0 && selectedImageIdx >= 0 && selectedImageIdx < photos.length
        ? photos[selectedImageIdx].photoUrl
        : null;

    // Use the rest as gallery thumbnails, fallback to fallbackGalleryImages
    const galleryImages: { src: string; owner: string }[] =
        photos.length > 0
            ? photos.map((img) => ({
                src: img.photoUrl,
                owner: img.guestName || 'Unknown',
            }))
            : [];

    // Get the guest name for the selected image
    const mainImageGuestName =
        photos.length > 0 && selectedImageIdx >= 0 && selectedImageIdx < photos.length
            ? photos[selectedImageIdx].guestName || 'Unknown'
            : '';

    // Get the main image's url and event name for sharing
    const name = allImages.eventInfo?.name || '';

    const handleShareLink = async (imageUrl?: string, eventName?: string) => {
        const url = imageUrl || mainImage;
        const eventTitle = eventName || name;

        if (!url) return;

        console.log('click on share button =>>>>>>>>>')

        try {
            const result = await Share.share({
                message: eventTitle
                    ? `Check out this photo from ${eventTitle}: ${url}`
                    : `Check out this photo: ${url}`,
                url: url,
            });

            if (result.action === Share.sharedAction) {
                console.log('Shared successfully');
            }
        } catch (error) {
            try {
                Clipboard.setString(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (e) {
                console.error('Error copying to clipboard:', e);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Header
                        title=""
                        subtitle=""
                        isGuest={true}
                        isAnonymous={isAnonymous}
                        shareId={shareId}
                    />
                </View>

                {/* Loader */}
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#3DA9B7" />
                    </View>
                ) : (
                    <>
                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Event Title Row */}
                        <View style={styles.titleRow}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                            <ArrowLeft color={'#000'} size={wp(6)} />
                            </TouchableOpacity>
                            <View style={styles.titleInfo}>
                                <Text style={styles.eventName}>{allImages.eventInfo?.name || 'Event'}</Text>
                                <Text style={styles.photoCount}>
                                    {photos.length > 0 ? `${photos.length} photos` : `0 photos`}
                                </Text>
                            </View>
                        </View>

                        {/* Event Info & Actions */}
                        <View style={styles.infoRow}>
                            <Text style={styles.guestName}>
                                {mainImageGuestName}
                            </Text>
                            <TouchableOpacity
                                style={styles.shareButton}
                                onPress={() => handleShareLink()}
                            >
                             <Share2 color={'#000'} size={wp(5)} />
                            </TouchableOpacity>
                        </View>

                        {/* Main Image */}
                        <View style={styles.mainImageContainer}>
                            <View style={styles.mainImageWrapper}>
                                {mainImage ? (
                                    <Image
                                        source={{ uri: mainImage }}
                                        style={styles.mainImage}
                                        resizeMode="stretch"
                                    />
                                ) : (
                                    <View style={[styles.mainImage, styles.placeholderContainer]}>
                                        <Text style={styles.placeholderText}>No photos available</Text>
                                    </View>
                                )}
                            </View>
                            {copied && (
                                <Text style={styles.copiedText}>Link copied!</Text>
                            )}
                        </View>

                        {/* Gallery Thumbnails */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.galleryScroll}
                            contentContainerStyle={styles.galleryContent}
                        >
                            {galleryImages.map((img, idx) => (
                                img.src ? (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[
                                            styles.thumbnailContainer,
                                            selectedImageIdx === idx && styles.thumbnailSelected
                                        ]}
                                        onPress={() => setSelectedImageIdx(idx)}
                                    >
                                        <Image
                                            source={{ uri: img.src }}
                                            style={styles.thumbnailImage}
                                            resizeMode="stretch"
                                        />
                                        <TouchableOpacity
                                            style={styles.thumbnailShareBar}
                                            onPress={() => handleShareLink(img.src, allImages.eventInfo?.name)}
                                        >
                                            <Text style={styles.thumbnailOwner} numberOfLines={1}>
                                                {img.owner}
                                            </Text>
                                           <Share2 color={'#000'} size={wp(3)} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ) : null
                            ))}
                        </ScrollView>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerContainer: {
        paddingHorizontal: wp(4),
        paddingTop: hp(2),
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(4),
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(2),
    },
    errorText: {
        color: 'red',
        fontSize: wp(3.5),
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(6),
        marginBottom: hp(2),
    },
    backButton: {
        width: wp(10),
        height: hp(6),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: '#C1C8C8',
        marginRight: wp(3),
    },
    backIcon: {
        fontSize: wp(6),
        color: '#000',
    },
    titleInfo: {
        flex: 1,
    },
    eventName: {
        fontSize: wp(5),
        fontWeight: 'bold',
        color: '#3DA9B7',
    },
    photoCount: {
        fontSize: wp(3.2),
        color: '#626666',
        marginTop: hp(0.5),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(6),
    },
    guestName: {
        fontSize: wp(3.8),
        fontWeight: '600',
        color: '#0F1F38',
    },
    shareButton: {
        width: wp(9),
        height: wp(9),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: '#C1C8C8',
        backgroundColor: 'white',
    },
    shareIcon: {
        fontSize: wp(5),
        color: '#0F1F38',
    },
    mainImageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: wp(4),
        marginTop: hp(2),
    },
    mainImageWrapper: {
        width: '90%',
        aspectRatio: 3 / 4,
        maxHeight: hp(60),
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mainImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f3f3f3',
    },
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E8F4F5',
    },
    placeholderText: {
        fontSize: wp(4),
        color: '#999',
        fontWeight: '500',
    },
    copiedText: {
        marginTop: hp(1),
        color: '#00AA00',
        fontSize: wp(3.5),
        fontWeight: '500',
    },
    galleryScroll: {
        marginTop: hp(3),
        marginBottom: hp(3),
    },
    galleryContent: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(2),
    },
    thumbnailContainer: {
        width: wp(28),
        height: wp(28),
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
        marginRight: wp(3),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    thumbnailSelected: {
        borderWidth: 2,
        borderColor: '#3DA9B7',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailShareBar: {
        position: 'absolute',
        bottom: wp(2),
        left: '5%',
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        backgroundColor: 'rgba(61, 169, 183, 0.8)',
        borderRadius: 4,
    },
    thumbnailOwner: {
        color: 'white',
        fontSize: wp(2.5),
        fontWeight: '500',
        flex: 1,
    },
    thumbnailShareIcon: {
        color: 'white',
        fontSize: wp(4),
        marginLeft: wp(2),
    },
});

export default ViewImageScreen;
