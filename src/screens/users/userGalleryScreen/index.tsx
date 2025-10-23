import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, TextInput, ActivityIndicator, StyleSheet, ScrollView, Platform, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Header from '../../../components/Header';
import PhotoLimitModal from '../../../components/PhotoLimitModal';
import { guestServices } from '../../../services/guestsService';
import { proxyOverlayImage, showErrorToastWithSupport } from '../../../utils/HelperFunctions';
import { useNavigation, useRoute } from '@react-navigation/native';
import { hp, wp } from '../../../contants/StyleGuide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Share2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const UserGalleryScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const locationState = route.params || {};
    const fromDashboard = locationState.fromDashboard ?? false;
    const fromScreen = locationState.fromScreen ?? false;

    const [eventID, setEventID] = useState<string>(locationState.eventId)
    const [selectedGuest, setSelectedGuest] = useState<string>('');
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'your' | 'live'>('your');
    const [showPhotoLimitModal, setShowPhotoLimitModal] = useState(false);
    const [galleryImages, setGalleryImages] = useState<any>([]);
    const [liveGalleryImages, setLiveGalleryImages] = useState<any>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
    const [searchGuest, setSearchGuest] = useState<string>('');

    useEffect(() => {
        // Modified to use AsyncStorage instead of localStorage for native, keep localStorage for web
        const checkIsAnonymous = async () => {
            try {
                let isAnon: string | null = null;

                isAnon = await AsyncStorage.getItem('isAnonymous');

                setIsAnonymous(isAnon === 'true');
            } catch { }
        };
        checkIsAnonymous();
    }, []);

    useEffect(() => {
        fetchImages();
    }, [activeTab, eventID]);

    const fetchImages = async () => {
        if (
            eventID === undefined ||
            eventID === null ||
            eventID === '' ||
            typeof eventID === 'boolean'
        ) {
            setGalleryImages([]);
            setLiveGalleryImages([]);
            setError('No eventId');
            return;
        }

        setLoading(true);
        setError(null);
        const endpoint = activeTab === 'your' ? 'photos' : 'live-gallery';
        try {
            const response: any = await guestServices.getGuestsImages(eventID, endpoint);

            if (activeTab === 'your') {
                setGalleryImages(response || []);
            } else {
                setLiveGalleryImages(response || []);
            }
        } catch (err: any) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error fetching gallery images'
            );
            setGalleryImages([]);
            setLiveGalleryImages([]);
            setEventID(eventID)
        } finally {
            setLoading(false);
        }
    };

    const handleTakePicture = () => {
        const allowedPhotos = galleryImages?.allowedPhotosPerGuest ?? null;
        const photoCount = galleryImages?.photoCount ?? 0;
        const totalPhotoPool = galleryImages?.totalPhotoPool ?? 0;
        const currentPhotoCount = galleryImages?.currentPhotoCount ?? 0;
        const overlayUrl = proxyOverlayImage(galleryImages?.overlayUrl);

        if (allowedPhotos === 0) {
            if (totalPhotoPool === currentPhotoCount) {
                setShowPhotoLimitModal(true);
            } else {
                navigation.navigate('takePicture', { eventId: eventID, overlayUrl, fromDashboard });
            }
            return;
        }

        if (allowedPhotos === null) {
            if (totalPhotoPool === currentPhotoCount) {
                setShowPhotoLimitModal(true);
            } else {
                navigation.navigate('takePicture', { eventId: eventID, overlayUrl, fromDashboard });
            }
            return;
        }

        if (typeof allowedPhotos === 'number' && allowedPhotos > 0) {
            if (photoCount === allowedPhotos) {
                setShowPhotoLimitModal(true);
            } else {
                navigation.navigate('takePicture', { eventId: eventID, overlayUrl, fromDashboard });
            }
            return;
        }
        setShowPhotoLimitModal(true);
    };

    const imagesToShow = activeTab === 'your' ? galleryImages?.photos : liveGalleryImages?.photos;

    const guestList: string[] = Array.from(
        new Set(
            (liveGalleryImages?.photos || [])
                .map((img: any) => img.guestName)
                .filter((name: string | undefined) => !!name)
        )
    );
    const filteredGuestList = guestList.filter((guest) =>
        guest.toLowerCase().includes(searchGuest.toLowerCase())
    );
    const filteredImagesToShow =
        activeTab === 'live' && selectedGuest
            ? imagesToShow?.filter((img: any) => img.guestName === selectedGuest)
            : imagesToShow;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F6FFFF' }}>
                <Header
                    title={galleryImages?.eventName}
                    subtitle={`${filteredImagesToShow?.length ?? 0} photos`}
                    isGuest={true}
                    logoHover={fromDashboard}
                    isAnonymous={isAnonymous}
                    shareId={galleryImages?.shareId}
                    fromScreen={fromScreen}
                />
                {/* Top Bar */}
                <View style={styles.container}>
                <View style={styles.topBarRow}>
                    <View style={styles.tabBtnRow}>
                        <TouchableOpacity
                            style={[
                                styles.tabBtn,
                                activeTab === 'your' && styles.activeTabBtn
                            ]}
                            onPress={() => { setActiveTab('your'); setSelectedGuest(''); setSearchGuest(''); }}
                        >
                            <Text style={[styles.tabBtnText, activeTab === 'your' ? styles.activeTabBtnText : styles.tabBtnText]}>{'Your gallery'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tabBtn,
                                activeTab === 'live' && styles.activeTabBtn
                            ]}
                            onPress={() => { setActiveTab('live'); setSelectedGuest(''); setSearchGuest(''); }}
                        >
                            <Text style={[styles.tabBtnText, activeTab === 'live' ? styles.activeTabBtnText : styles.tabBtnText]}>{'Live gallery'}</Text>
                        </TouchableOpacity>
                    </View>
                    {activeTab === 'live' && (
                        <View>
                            <TouchableOpacity
                                style={styles.guestDropdownBtn}
                                onPress={() => setDropdownOpen((prev) => !prev)}
                            >
                                <Text style={styles.guestDropdownBtnText}>{selectedGuest ? selectedGuest : 'Guests'}</Text>
                            </TouchableOpacity>
                            {dropdownOpen && (
                                <View style={styles.dropdownListWrap}>
                                    {/* Search Bar */}
                                    <View style={styles.dropdownSearchBar}>
                                        <TextInput
                                            placeholder="Search guests..."
                                            placeholderTextColor="#aaa"
                                            style={styles.guestDropdownInput}
                                            value={searchGuest}
                                            onChangeText={setSearchGuest}
                                        />
                                    </View>
                                    <ScrollView style={styles.guestDropdownScroll}>
                                        {filteredGuestList.length === 0 ? (
                                            <Text style={styles.noGuestText}>No guests found.</Text>
                                        ) : (
                                            filteredGuestList.map((guest) => (
                                                <TouchableOpacity
                                                    key={guest}
                                                    style={[
                                                        styles.guestItem,
                                                        selectedGuest === guest
                                                            ? styles.guestItemSelected
                                                            : {}
                                                    ]}
                                                    onPress={() => { setSelectedGuest(guest); setDropdownOpen(false); }}
                                                >
                                                    <Text style={[
                                                        styles.guestItemText,
                                                        selectedGuest === guest
                                                            ? styles.guestItemSelectedText
                                                            : {}
                                                    ]}>{guest}</Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                        {selectedGuest ? (
                                            <TouchableOpacity
                                                style={styles.guestItem}
                                                onPress={() => { setSelectedGuest(''); setDropdownOpen(false); }}
                                            >
                                                <Text style={styles.guestItemText}>Show all guests</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* GALLERY START */}
                <View style={styles.galleryWrap}>

                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color="#3DA9B7" />
                        </View>
                    ) : error ? (
                        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
                    ) : !filteredImagesToShow || filteredImagesToShow.length === 0 ? (
                        <View style={styles.centered}><Text style={styles.noPhotosText}>No photos yet.</Text></View>
                    ) : (
                        <FlatList
                            data={filteredImagesToShow}
                            numColumns={2}
                            keyExtractor={(item: any, idx: number) => item.id?.toString() ?? idx.toString()}
                            contentContainerStyle={styles.galleryGrid}
                            columnWrapperStyle={styles.galleryRow}
                            renderItem={({ item, index }) => (
                                <GalleryCard
                                    key={item.id || index}
                                    name={item.guestName || 'Guest'}
                                    image={item.photoUrl}
                                    activeTab={activeTab}
                                    onClick={() => {
                                        navigation.navigate('viewImage', {
                                            eventID,
                                            shareId: galleryImages?.shareId,
                                            guestId: item.guestId
                                        });
                                    }}
                                    photoUrl={item.photoUrl}
                                />
                            )}
                        />
                    )}
                </View>
                {/* GALLERY END */}

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={styles.fab}
                    accessibilityLabel="Add Photo"
                    onPress={handleTakePicture}
                >
                        <Plus color={'#fff'} size={wp(7)} />
                </TouchableOpacity>

                <PhotoLimitModal open={showPhotoLimitModal} onClose={() => setShowPhotoLimitModal(false)} />
            </View>
        </SafeAreaView>
    );
};

const GalleryCard: React.FC<{ name: string; image: string; activeTab: 'your' | 'live', onClick: () => void, photoUrl: string }> = ({ name, image, activeTab, onClick, photoUrl }) => {
    const [copied, setCopied] = useState(false);

    const handleShareLink = async () => {
        if (!photoUrl) return;

        try {
            const result = await Share.share({
                message: name
                    ? `Check out this photo from ${name}: ${photoUrl}`
                    : photoUrl,
                url: photoUrl,
            });

            if (result.action === Share.sharedAction) {
                showErrorToastWithSupport('Shared successfully!');
            }
        } catch (error) {
            // If share fails, copy to clipboard as fallback
            try {
                Clipboard.setString(photoUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (e) {
                // nothing
            }
        }
    };

    return (
        <TouchableOpacity
            style={styles.galleryCard}
            onPress={onClick}
            activeOpacity={0.92}
        >
            <Image source={{ uri: image }} style={styles.cardImage} resizeMode="stretch" />
            {activeTab === 'live' ? (
                <View style={styles.galleryCardLiveBar}>
                    <Text style={styles.galleryCardLiveName} numberOfLines={1}>{name}</Text>
                    <TouchableOpacity onPress={handleShareLink} style={styles.shareBtn}>
                         <Share2 color={'#000'} size={wp(5)} />
                    </TouchableOpacity>
                    {copied && (
                        <View style={styles.copiedToast}>
                            <Text style={styles.copiedToastText}>Link copied!</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.galleryCardBtnBar}>
                    <TouchableOpacity onPress={handleShareLink} style={styles.shareBtn}>
                         <Share2 color={'#000'} size={wp(5)} />
                    </TouchableOpacity>
                    {copied && (
                        <View style={styles.copiedToast}>
                            <Text style={styles.copiedToastText}>Link copied!</Text>
                        </View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: wp(3),
        backgroundColor: '#F6FFFF'
    },
    topBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(2),
        justifyContent: 'space-between',
        marginBottom: hp(4),
    },
    tabBtnRow: {
        flexDirection: 'row',
    },
    tabBtn: {
        paddingHorizontal: wp(6),
        paddingVertical: hp(1.2),
        borderRadius: 3,
        borderBottomWidth: 4,
        borderColor: 'transparent',
        backgroundColor: '#F6FFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: wp(2),
    },
    activeTabBtn: {
        backgroundColor: '#E6F6F8',
        borderColor: '#3DA9B7'
    },
    tabBtnText: {
        fontSize: wp(3),
        fontWeight: '600',
        color: '#606464'
    },
    activeTabBtnText: {
        color: '#3DA9B7'
    },
    guestDropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderWidth: 0.5,
        borderColor: '#626464',
        borderRadius: 6,
        justifyContent: 'space-between',
        backgroundColor: 'white',
        marginLeft: wp(1)
    },
    guestDropdownBtnText: {
        fontSize: wp(2.4),
        color: '#606464',
        fontWeight: '400'
    },
    dropdownListWrap: {
        width: wp(45),
        position: 'absolute',
        top: hp(5),
        right: 0,
        backgroundColor: 'white',
        borderColor: '#eee',
        borderWidth: 1,
        borderRadius: 9,
        shadowColor: "#000",
        shadowOpacity: 0.13,
        shadowRadius: 4,
        zIndex: 2,
        maxHeight: hp(40),
        paddingVertical: hp(1.2),
        paddingHorizontal: wp(2),
        marginTop: hp(1)
    },
    dropdownSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F2F2F2',
        marginTop: hp(1),
        backgroundColor: '#FFF',
        borderRadius: 8,
        paddingHorizontal: wp(2)
    },
    guestDropdownInput: {
        flex: 1,
        padding: 0,
        color: '#000',
        fontWeight: '500',
        fontSize: wp(2.6),
        height: hp(4.5),
    },
    guestDropdownScroll: {
        maxHeight: hp(35),
        paddingVertical: hp(1)
    },
    noGuestText: {
        color: 'gray',
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        fontSize: wp(3),
        marginTop: hp(1.5),
        textAlign: 'center'
    },
    guestItem: {
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        borderRadius: 8,
        marginTop: hp(1.3),
    },
    guestItemText: {
        fontSize: wp(3),
        color: '#969696',
        fontWeight: '400',
        textAlign: 'left'
    },
    guestItemSelected: {
        backgroundColor: '#ECF6F8'
    },
    guestItemSelectedText: {
        color: '#3DA9B7'
    },
    galleryWrap: {
        flex: 1,
        marginTop: hp(1),
        marginBottom: hp(6),
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(4)
    },
    errorText: {
        color: 'red',
        fontSize: wp(3.2),
        paddingVertical: hp(2),
        textAlign: 'center'
    },
    noPhotosText: {
        color: '#bbb',
        fontSize: wp(3.2),
        paddingVertical: hp(2),
        textAlign: 'center'
    },
    galleryGrid: {
        paddingBottom: hp(2),
    },
    galleryRow: {
        justifyContent: 'space-between',
        marginBottom: hp(1),
    },
    galleryCard: {
        width: '48%',
        height: hp(23),
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#e6e6e6',
        shadowColor: "#aaa",
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        shadowOpacity: 0.05,
        elevation: 2,
        position: 'relative'
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    galleryCardLiveBar: {
        position: 'absolute',
        left: '5%',
        bottom: hp(1.5),
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        backgroundColor: 'rgba(61, 169, 183, 0.67)',
        borderRadius: 8,
    },
    galleryCardLiveName: {
        color: '#fff',
        fontSize: wp(3.4),
        fontWeight: '600',
        flex: 1
    },
    shareBtn: {
        // marginLeft: wp(2),
        padding: wp(1.3),
        backgroundColor: 'rgba(255,255,255,0.24)',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    shareIcon: {
        fontSize: wp(4.2),
        color: '#fff',
    },
    galleryCardBtnBar: {
        position: 'absolute',
        right: wp(2),
        bottom: wp(2),
        backgroundColor: 'rgba(61, 169, 183, 0.6)',
        borderRadius: 10,
        padding: wp(2),
        alignItems: 'center',
        justifyContent: 'center',
    },
    copiedToast: {
        position: 'absolute',
        bottom: -hp(3),
        left: '50%',
        marginLeft: -wp(12),
        backgroundColor: '#3DA9B7',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.6),
        borderRadius: 8,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6
    },
    copiedToastText: {
        color: '#fff',
        fontSize: wp(2.8)
    },
    fab: {
        position: 'absolute',
        bottom: hp(4),
        right: wp(5),
        backgroundColor: '#3DA9B7',
        width: wp(16),
        height: wp(16),
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 99
    },
    fabPlus: {
        fontSize: wp(11),
        color: "#fff",
        fontWeight: '900',
    },
});

export default UserGalleryScreen;