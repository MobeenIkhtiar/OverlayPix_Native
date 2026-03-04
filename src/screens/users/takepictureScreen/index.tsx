import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Platform, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, useCameraDevice, CameraPermissionStatus } from 'react-native-vision-camera';
import { Canvas, Image as SkiaImage, useImage, makeImageFromView, Skia } from '@shopify/react-native-skia';
import Loader from '../../../components/Loader';
import { guestServices } from '../../../services/guestsService';
import { HEIGHT, hp, wp } from '../../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FILTERS } from './filterMatrices';
import SkiaFilteredImage from './SkiaFilteredImage';
import { applyFilterToImage } from './applySkiaFilter';

const TakePictureScreen = () => {
    const navigation: any = useNavigation();
    const route: any = useRoute();
    const { eventId } = route.params || {};
    const overlayUrl = route.params?.overlayUrl;
    const fromDashboard = route.params?.fromDashboard ?? false;
    const fromScreen = route.params?.fromScreen ?? false;

    const cameraRef = useRef<Camera | null>(null);
    const cameraViewRef = useRef<View>(null);
    const [imageOverlay, setimageOverlay] = useState<string | null>(null);
    const overlayImage = useImage(imageOverlay || '');
    const [overlayLoading, setOverlayLoading] = useState<boolean>(false);
    const [capturedImage, setCapturedImage] = useState<any>(null);
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [flashSupported, setFlashSupported] = useState<boolean>(true);
    const [flashOn, setFlashOn] = useState<boolean>(false);
    const [flashError, setFlashError] = useState<string | null>(null);
    const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>('not-determined');
    const [isCameraReady, setIsCameraReady] = useState<boolean>(false);

    // Camera/Filters state
    const [selectedFilter, setSelectedFilter] = useState<string>('none');
    const [frameRect, setFrameRect] = useState<{ left: number, top: number, width: number, height: number }>({ left: 0, top: 0, width: 0, height: 0 });
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [hideButton, setHideButton] = useState<boolean>(false);

    // Camera device (v4 API)
    const device = useCameraDevice('back');

    // Request camera permissions
    useEffect(() => {
        const requestPermission = async () => {
            try {
                const permission = await Camera.requestCameraPermission();
                setCameraPermission(permission);
                if (permission !== 'granted') {
                    Alert.alert(
                        'Camera Permission Required',
                        'Please enable camera access in your device settings to take pictures.',
                        [{ text: 'OK' }]
                    );
                }
            } catch (error) {
                console.error('Permission request error:', error);
                Alert.alert('Error', 'Failed to request camera permission');
            }
        };
        requestPermission();
    }, []);

    // Track camera ready state
    useEffect(() => {
        if (cameraPermission === 'granted' && device && !isPreviewMode) {
            const timer = setTimeout(() => {
                setIsCameraReady(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setIsCameraReady(false);
        }
    }, [cameraPermission, device, isPreviewMode]);

    // Overlay loading on mount
    useEffect(() => {
        let isMounted = true;
        if (overlayUrl) {
            setOverlayLoading(true);
            const fetchOverlayImage = async () => {
                try {
                    const response = await fetch(overlayUrl);
                    if (!response.ok) throw new Error('Failed to fetch overlay image');
                    const blob = await response.blob();
                    if (Platform.OS === 'web') {
                        if (isMounted) setimageOverlay(URL.createObjectURL(blob));
                    } else {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            if (isMounted) setimageOverlay(reader.result as string);
                        };
                        reader.readAsDataURL(blob);
                    }
                } catch (e) {
                    if (isMounted) setimageOverlay(overlayUrl);
                } finally {
                    if (isMounted) setOverlayLoading(false);
                }
            };
            fetchOverlayImage();
        } else {
            setOverlayLoading(false);
        }
        return () => { isMounted = false; };
    }, [overlayUrl]);

    // Frame calculation for overlay/filter area
    useEffect(() => {
        const { width, height } = Dimensions.get('window');
        setFrameRect({ left: 0, top: 0, width: width, height: height });
    }, []);

    // Flash toggle handler
    const handleToggleFlash = async () => {
        setFlashError(null);
        setFlashOn((prev) => !prev);
    };

    const turnOffFlash = async () => setFlashOn(false);

    // Capture handling with Skia for proper transparency
    const handleCapture = async () => {
        console.log('Capture attempt - Permission:', cameraPermission, 'Device:', !!device, 'Device ID:', device?.id, 'Ref:', !!cameraRef.current, 'Ready:', isCameraReady);

        if (cameraPermission !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is required to take photos.');
            return;
        }

        if (!device) {
            Alert.alert('Error', 'No camera device available.');
            return;
        }

        if (!isCameraReady) {
            Alert.alert('Please wait', 'Camera is initializing. Please try again in a moment.');
            return;
        }

        if (!cameraRef.current) {
            console.error('Camera ref is null even though camera should be ready');
            Alert.alert('Error', 'Camera is not ready. Please try again.');
            return;
        }

        await turnOffFlash();

        try {
            setLoading(true);
            setHideButton(true);
            await new Promise<void>(resolve => setTimeout(() => resolve(), 100));

            const photo = await cameraRef.current.takePhoto({ flash: flashOn ? 'on' : 'off' });
            const cameraUri = `file://${photo.path}`;

            setCapturedImage(cameraUri);
            setIsPreviewMode(true);

            // Generate a lightweight thumbnail asynchronously for the filters 
            // so 10 filters don't parse the 12MP image synchronously and freeze Android JS thread
            requestAnimationFrame(() => {
                setTimeout(() => {
                    applyFilterToImage(cameraUri, 'none', 300).then(uri => {
                        setThumbnailUri(uri);
                    }).catch(err => console.error('Thumbnail generation error:', err));
                }, 50);
            });
        } catch (err: any) {
            console.error('Capture error:', err);
            Alert.alert("Error", err?.message || "Failed to take photo. Please try again.");
        } finally {
            setLoading(false);
            setHideButton(false);
        }
    };

    // Retake
    const handleRetake = () => {
        setIsPreviewMode(false);
        setCapturedImage(null);
        setThumbnailUri(null);
        setSelectedFilter('none');
    };

    // DataURL to file util
    const dataURLtoFile = async (dataurl: string, filename: string) => {
        if (Platform.OS !== 'web') return { uri: dataurl, name: filename, type: 'image/png' };
        try {
            const res = await fetch(dataurl);
            const blob = await res.blob();
            return new File([blob], filename, { type: 'image/png' });
        } catch (e) {
            throw e;
        }
    };

    // Upload
    const uploadPhoto = async (file: any, fileUrl: string) => {
        if (!eventId) {
            setUploadError('No eventId');
            throw new Error('No eventId');
        }
        const formData = new FormData();
        if (Platform.OS === 'web') {
            formData.append('photo', file);
        } else {
            formData.append('photo', {
                uri: file.uri,
                type: 'image/png',
                name: file.name,
            });
        }
        setLoading(true);
        setUploadError(null);
        try {
            const response = await guestServices.uploadPhoto(eventId, formData, navigation);
            if (fromScreen === 'client') {
                navigation.goBack();
            } else {
                navigation.navigate('photoSaved', { photo: fileUrl, eventId, fromDashboard });
            }
        } catch (err: any) {
            let errorMessage = 'Network error while uploading photo';
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }
            setUploadError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Save — composites overlay and bakes the selected filter into the image before uploading
    const handleSave = async () => {
        if (!capturedImage) return;
        try {
            setLoading(true);

            // Yield the thread so React Native can draw the ActivityIndicator on screen immediately
            // before the synchronous Skia computations freeze the thread for 1 second.
            await new Promise<void>(resolve => setTimeout(resolve, 50));

            // Apply filter and overlay Native-side at native resolution (returns data URI with composition baked in)
            const filteredUri = await applyFilterToImage(capturedImage, selectedFilter, undefined, imageOverlay);
            const randomName = `photo_${Math.random().toString(36).substring(2, 10)}.png`;
            const file = await dataURLtoFile(filteredUri, randomName);
            await uploadPhoto(file, filteredUri);
        } catch (err: any) {
            console.error('Save error:', err);
            Alert.alert('Error', err?.message || 'Failed to save photo.');
        } finally {
            setLoading(false);
        }
    };

    // UI Render
    return (
        <SafeAreaView style={styles.container}>
            {/* Camera Preview */}
            <View
                ref={cameraViewRef as any}
                style={styles.previewContainer}
            >
                {/* Loader for overlay loading */}
                {overlayLoading && !isPreviewMode && (
                    <View style={styles.overlayLoader}>
                        <Loader size="large" color="#00ff88" />
                    </View>
                )}

                {/* Flash Button */}
                {!isPreviewMode && !hideButton && (
                    <View style={styles.flashButtonContainer}>
                        <TouchableOpacity
                            onPress={handleToggleFlash}
                            disabled={!flashSupported}
                            style={[styles.flashButton, !flashSupported && styles.disabledFlashButton]}
                        >
                            <Text>
                                {flashOn ? "⚡" : "⚡︎"}
                            </Text>
                        </TouchableOpacity>
                        {flashError && (
                            <Text style={styles.flashError}>{flashError}</Text>
                        )}
                    </View>
                )}

                {/* Camera preview */}
                {!isPreviewMode && cameraPermission === 'granted' && device ? (
                    <Camera
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={!isPreviewMode}
                        photo={true}
                        enableZoomGesture={true}
                        torch={flashOn ? "on" : "off"}
                        resizeMode="cover"
                        onInitialized={() => {
                            console.log('Camera initialized');
                            setIsCameraReady(true);
                        }}
                        onError={(error) => {
                            console.error('Camera error:', error);
                            setIsCameraReady(false);
                        }}
                    />
                ) : !isPreviewMode && cameraPermission !== 'granted' ? (
                    <View style={styles.permissionContainer}>
                        <Text style={styles.permissionText}>
                            {cameraPermission === 'not-determined'
                                ? 'Requesting camera permission...'
                                : 'Camera permission is required to take photos. Please enable it in settings.'}
                        </Text>
                    </View>
                ) : !isPreviewMode && !device ? (
                    <View style={styles.permissionContainer}>
                        <Text style={styles.permissionText}>No camera available on this device.</Text>
                    </View>
                ) : null}

                {/* Overlay image */}
                {!isPreviewMode && !!imageOverlay && (
                    <View style={styles.overlayContainer}>
                        <Image
                            source={{ uri: imageOverlay }}
                            style={styles.overlayImage}
                            resizeMode="stretch"
                        />
                    </View>
                )}

                {/* Framing mask */}
                {!isPreviewMode && (
                    <View style={styles.frameMask}>
                        <View style={[StyleSheet.absoluteFill, styles.maskBG]} />
                        <View style={[styles.maskBorder, { left: frameRect.left, top: frameRect.top, width: frameRect.width, height: frameRect.height }]} />
                    </View>
                )}

                {/* Capture Button */}
                {!isPreviewMode && !hideButton && (
                    <View style={styles.captureButtonContainer}>
                        <TouchableOpacity
                            onPress={handleCapture}
                            style={[styles.captureButton, !isCameraReady && styles.captureButtonDisabled]}
                            accessibilityLabel="Capture photo"
                            disabled={!isCameraReady}
                        >
                            <View style={[styles.captureInner, !isCameraReady && styles.captureInnerDisabled]} />
                        </TouchableOpacity>
                        {!isCameraReady && cameraPermission === 'granted' && device && (
                            <Text style={styles.cameraInitText}>Initializing camera...</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Preview & Filters Modal */}
            {isPreviewMode && capturedImage && (
                <View style={styles.previewModal}>
                    {/* Full screen image preview */}
                    <View style={styles.previewImageBox}>
                        <SkiaFilteredImage
                            uri={capturedImage}
                            style={styles.capturedImage}
                            filterName={selectedFilter}
                            fit="cover"
                            maxSize={selectedFilter === 'none' ? undefined : 1200}
                        />

                        {/* Overlay separately layered on top, so it renders instantly via RN Views instead of merging 12 MP Skia Canvas on frame 1 */}
                        {!!imageOverlay && (
                            <View style={styles.overlayContainer}>
                                <SkiaFilteredImage
                                    uri={imageOverlay}
                                    style={styles.overlayImage as any}
                                    filterName={selectedFilter}
                                    fit={"stretch" as any}
                                />
                            </View>
                        )}
                    </View>

                    {/* Filter carousel - positioned at bottom */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterRow}
                        style={styles.filterScrollView}
                    >
                        <View style={{ width: wp(4) }} />
                        {FILTERS.map((filter, idx) => {
                            const isSelected = selectedFilter === filter.name;
                            return (
                                <TouchableOpacity
                                    key={filter.name}
                                    onPress={() => setSelectedFilter(filter.name)}
                                    style={[
                                        styles.filterThumb,
                                        { marginLeft: idx === 0 ? wp(8) : 0 }
                                    ]}
                                >
                                    <View style={[styles.filterThumbImgContainer, isSelected && styles.filterThumbImgContainerSelected]}>
                                        {thumbnailUri || filter.name === 'none' ? (
                                            <SkiaFilteredImage
                                                uri={thumbnailUri || capturedImage}
                                                style={[
                                                    styles.filterThumbImgWrap,
                                                    isSelected ? styles.filterSelectedImg : {},
                                                ] as any}
                                                filterName={filter.name}
                                                fit="cover"
                                                maxSize={filter.name === 'none' ? undefined : 200}
                                            />
                                        ) : (
                                            <View style={[
                                                styles.filterThumbImgWrap,
                                                isSelected ? styles.filterSelectedImg : {},
                                                { backgroundColor: '#222' }
                                            ]} />
                                        )}
                                        {/* Overlay layered on top with absolute position, for zero-delay thumbnail overlay display, now supporting filters as well! */}
                                        {!!imageOverlay && (thumbnailUri || filter.name === 'none') && (
                                            <View style={[StyleSheet.absoluteFill, { zIndex: 5, borderRadius: wp(8), overflow: 'hidden' }]}>
                                                <SkiaFilteredImage
                                                    uri={imageOverlay}
                                                    style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }] as any}
                                                    filterName={filter.name}
                                                    fit="stretch"
                                                    maxSize={200}
                                                />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.filterLabel}>{filter.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        <View style={{ width: wp(4) }} />
                    </ScrollView>

                    {/* Bottom Buttons */}
                    <View style={styles.bottomBar}>
                        <TouchableOpacity
                            onPress={handleRetake}
                            disabled={loading}
                            style={styles.retakeButton}
                        >
                            <Text style={styles.retakeButtonText}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            style={styles.saveButton}
                        >
                            {loading
                                ? <ActivityIndicator size="small" color="#000" />
                                : <Text style={styles.saveButtonText}>Save</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        backgroundColor: 'black',
        position: 'relative'
    },
    popup: {
        position: 'absolute',
        width: wp(90),
        zIndex: 1100,
        alignItems: 'center',
        justifyContent: 'center'
    },
    popupBox: {
        backgroundColor: 'rgba(35,37,38,0.98)',
        borderRadius: wp(3),
        paddingHorizontal: wp(6),
        paddingVertical: hp(2.2),
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        maxWidth: wp(95),
    },
    popupText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: wp(4.2),
        textAlign: 'center'
    },
    previewContainer: {
        width: '100%',
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
    },
    overlayLoader: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2000,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flashButtonContainer: {
        position: 'absolute',
        top: hp(3),
        left: wp(4),
        zIndex: 200,
        flexDirection: 'row',
        alignItems: 'center',
    },
    flashButton: {
        padding: wp(2.2),
        borderRadius: wp(7),
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledFlashButton: {
        opacity: 0.5,
    },
    flashError: {
        marginLeft: wp(2),
        fontSize: wp(2.7),
        color: '#f99',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.6),
        borderRadius: wp(2),
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 3,
        pointerEvents: 'none',
    },
    overlayImage: {
        width: '100%',
        height: HEIGHT,
        opacity: 0.98,
    },
    frameMask: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 30,
        position: 'absolute',
        pointerEvents: 'none',
        width: '100%',
        height: '100%'
    },
    maskBG: {
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    maskBorder: {
        borderWidth: wp(1),
        borderColor: 'rgba(255,255,255,0.6)',
        position: 'absolute',
        borderRadius: wp(2),
    },
    captureButtonContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: hp(16),
        minHeight: hp(14),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 100
    },
    captureButton: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(20),
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        zIndex: 101,
    },
    captureInner: {
        width: wp(16),
        height: wp(16),
        borderRadius: wp(16),
        backgroundColor: '#fff',
    },
    previewModal: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    previewImageBox: {
        width: '100%',
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    capturedImage: {
        width: '100%',
        height: '100%',
    },
    filterScrollView: {
        position: 'absolute',
        bottom: hp(10),
        left: 0,
        right: 0,
        maxHeight: hp(12),
    },
    filterRow: {
        paddingBottom: hp(2),
        paddingTop: hp(1.5),
        backgroundColor: 'rgba(0,0,0,0.4)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: wp(6),
        paddingRight: wp(6),
    },
    filterThumb: {
        flexDirection: 'column',
        alignItems: 'center',
        marginHorizontal: wp(1),
    },
    filterThumbImgContainer: {
        marginBottom: hp(1),
        borderRadius: wp(8),
    },
    filterThumbImgContainerSelected: {
        shadowColor: '#00ff88',
        shadowOpacity: 0.55,
        shadowRadius: 8,
        borderWidth: 3,
        borderColor: '#00ff88',
        borderRadius: wp(9),
    },
    filterThumbImgWrap: {
        width: wp(12),
        height: wp(12),
        borderRadius: wp(8),
        overflow: 'hidden',
    },
    filterPreviewImg: {
        width: wp(12),
        height: wp(12),
        borderRadius: wp(8),
        resizeMode: 'cover'
    },
    filterSelectedImg: {
        width: wp(15),
        height: wp(15),
        borderRadius: wp(9),
    },
    filterLabel: {
        fontSize: wp(2.7),
        color: '#fff',
        fontWeight: '500',
        textAlign: 'center'
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        paddingHorizontal: wp(6),
        paddingVertical: hp(2),
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    retakeButton: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.6),
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: wp(5),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    retakeButtonText: {
        color: '#fff',
        fontSize: wp(3.0),
        fontWeight: '500'
    },
    saveButton: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: wp(5),
        backgroundColor: '#00ff88',
        shadowColor: '#00ff88',
        shadowOpacity: 0.24,
        shadowRadius: 7,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#000',
        fontWeight: '500',
        fontSize: wp(3.0),
    },
    permissionContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    permissionText: {
        color: '#fff',
        fontSize: wp(4),
        textAlign: 'center',
        paddingHorizontal: wp(10),
        fontWeight: '500',
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureInnerDisabled: {
        backgroundColor: '#888',
    },
    cameraInitText: {
        color: '#fff',
        fontSize: wp(3),
        marginTop: hp(1),
        opacity: 0.7,
    },
});

export default TakePictureScreen;