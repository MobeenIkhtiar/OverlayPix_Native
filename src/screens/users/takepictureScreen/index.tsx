import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Platform, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, useCameraDevice, CameraPermissionStatus } from 'react-native-vision-camera';
import { Canvas, Image as SkiaImage, useImage, makeImageFromView } from '@shopify/react-native-skia';
import Loader from '../../../components/Loader';
import { guestServices } from '../../../services/guestsService';
import { HEIGHT, hp, wp } from '../../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

const FILTERS = [
    { name: 'none', label: 'Original', style: '' },
    { name: 'grayscale', label: 'B&W', style: 'grayscale(1)' },
    { name: 'sepia', label: 'Vintage', style: 'sepia(0.8)' },
    { name: 'invert', label: 'Invert', style: 'invert(1)' },
    { name: 'contrast', label: 'Contrast', style: 'contrast(1.5)' },
    { name: 'brightness', label: 'Bright', style: 'brightness(1.3)' },
    { name: 'blur', label: 'Soft', style: 'blur(1px)' },
    { name: 'hue-rotate', label: 'Color', style: 'hue-rotate(90deg)' },
    { name: 'saturate', label: 'Vivid', style: 'saturate(1.8)' },
    { name: 'warm', label: 'Warm', style: 'sepia(0.3) brightness(1.1) saturate(1.2)' },
    { name: 'cool', label: 'Cool', style: 'hue-rotate(180deg) brightness(0.9)' },
];

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
    const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [flashSupported, setFlashSupported] = useState<boolean>(true); // Most mobile devices support 'torch'
    const [flashOn, setFlashOn] = useState<boolean>(false);
    const [flashError, setFlashError] = useState<string | null>(null);
    // const [cropRect, setCropRect] = useState<{ sx: number, sy: number, sw: number, sh: number } | null>(null);
    const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>('not-determined');
    const [isCameraReady, setIsCameraReady] = useState<boolean>(false);

    // Popup State
    const [showClickAnywherePopup, setShowClickAnywherePopup] = useState<boolean>(false);
    const popupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Camera/Filters state
    const [selectedFilter, setSelectedFilter] = useState<string>('none');
    const [frameRect, setFrameRect] = useState<{ left: number, top: number, width: number, height: number }>({ left: 0, top: 0, width: 0, height: 0 });
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [hideButton, setHideButton] = useState<boolean>(false);
    // const filterImageRef = useRef<Image | null>(null);

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
            // Give camera a moment to initialize after mounting
            const timer = setTimeout(() => {
                setIsCameraReady(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setIsCameraReady(false);
        }
    }, [cameraPermission, device, isPreviewMode]);

    useEffect(() => {
        // Show popup on mount, hide after 5 seconds
        if (!isPreviewMode) {
            setShowClickAnywherePopup(true);
            if (popupTimeout.current) clearTimeout(popupTimeout.current);
            popupTimeout.current = setTimeout(() => {
                setShowClickAnywherePopup(false);
            }, 5000);
        } else {
            setShowClickAnywherePopup(false);
            if (popupTimeout.current) clearTimeout(popupTimeout.current);
        }
        return () => {
            if (popupTimeout.current) clearTimeout(popupTimeout.current);
        };
    }, [isPreviewMode]);

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
                    const dataUrl = Platform.OS === 'web'
                        ? URL.createObjectURL(blob)
                        : overlayUrl; // For native, pass as uri directly
                    if (isMounted) setimageOverlay(dataUrl);
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
        // Since camera and overlay fill the full screen with cover mode,
        // frameRect should represent the full visible area
        setFrameRect({ left: 0, top: 0, width: width, height: height });
    }, []);

    // Flash toggle handler (native torch mode)
    const handleToggleFlash = async () => {
        setFlashError(null);
        setFlashOn((prev) => !prev);
        // Real device flash controlled via prop on Camera (see below)
    };

    // Turn off flash util
    const turnOffFlash = async () => setFlashOn(false);

    // Camera screen tap handler
    const handleCameraScreenPress = async () => {
        if (!isPreviewMode) {
            setShowClickAnywherePopup(false);
            if (popupTimeout.current) clearTimeout(popupTimeout.current);
            await handleCapture();
        }
    };

    // Capture handling with Skia for proper transparency
    const handleCapture = async () => {
        console.log('Capture attempt - Permission:', cameraPermission, 'Device:', !!device, 'Device ID:', device?.id, 'Ref:', !!cameraRef.current, 'Ready:', isCameraReady);

        // Check permissions first
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
            
            // Hide the button before capturing
            setHideButton(true);
            
            // Wait a brief moment for the UI to update
            await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
            
            // First, take the camera photo
            const photo = await cameraRef.current.takePhoto({ flash: flashOn ? 'on' : 'off' });
            const cameraUri = `file://${photo.path}`;
            
            // If we have an overlay, composite it with Skia
            if (imageOverlay && cameraViewRef.current) {
                try {
                    // Use Skia's makeImageFromView to capture the entire view with proper alpha blending
                    const snapshot:any = await makeImageFromView(cameraViewRef);
                    const base64 = snapshot.encodeToBase64();
                    const compositeUri = `data:image/png;base64,${base64}`;
                    setCapturedImage(compositeUri);
                } catch (compositeError) {
                    console.error('Composite error:', compositeError);
                    // Fallback to camera image only
                    setCapturedImage(cameraUri);
                }
            } else {
                // No overlay, just use camera photo
                setCapturedImage(cameraUri);
            }
            
            setIsPreviewMode(true);
        } catch (err: any) {
            console.error('Capture error:', err);
            Alert.alert("Error", err?.message || "Failed to take photo. Please try again.");
        } finally {
            setLoading(false);
            // Show the button again
            setHideButton(false);
        }
    };

    // Retake
    const handleRetake = () => {
        setIsPreviewMode(false);
        setCapturedImage(null);
        setSelectedFilter('none');
    };

    // Get RN filter style (not all css filters supported; map to RN compatible ones)
    const getFilterStyle = (filterName: string | null) => {
        // For react-native: Only "grayscale", "sepia", "invert", "brightness", "contrast"
        const filterObj = FILTERS.find(f => f.name === filterName);
        if (!filterObj || filterObj.style === '') return {};
        if (filterObj.name === 'grayscale') return { tintColor: 'gray', opacity: 0.7 };
        if (filterObj.name === 'invert') return { tintColor: undefined, opacity: 0.95 };
        // For sepia, brightness, etc, you will need a lib or image-filter-proc; using placeholder here
        return {};
    };

    // DataURL to file util (native: just use image uri/path; web: fetch as blob)
    const dataURLtoFile = async (dataurl: string, filename: string) => {
        if (Platform.OS !== 'web') return { uri: dataurl, name: filename, type: 'image/png' }; // RN, just pass uri + meta
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

    // Save with filter (native: only supported with an image filter lib, this is a placeholder pass-through)
    const handleSave = async () => {
        if (!capturedImage) return;

        const filterStyle = getFilterStyle(selectedFilter);

        const randomName = `photo_${Math.random().toString(36).substring(2, 10)}.png`;
        let file = null;
        let fileUrl = capturedImage;
        // If advanced filters are required, implement using something like react-native-image-filter-kit or react-native-image-editor.
        // Here, just pass original uri
        file = await dataURLtoFile(capturedImage, randomName);
        await uploadPhoto(file, fileUrl);
    };

    // UI Render
    return (
        <SafeAreaView style={styles.container}>
            {/* Popup message */}
            {showClickAnywherePopup && !isPreviewMode && !hideButton && (
                <Animated.View
                    style={[
                        styles.popup,
                        {
                            opacity: 0.97,
                            top: hp(6),
                            alignSelf: 'center',
                        }
                    ]}
                >
                    <View style={styles.popupBox}>
                        <Text style={styles.popupText}>Click anywhere to take a picture</Text>
                    </View>
                </Animated.View>
            )}

            {/* Camera Preview */}
            <TouchableOpacity
                ref={cameraViewRef}
                style={styles.previewContainer}
                activeOpacity={1}
                disabled={isPreviewMode}
                onPress={handleCameraScreenPress}
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

                {/* Framing mask - custom overlay with lines */}
                {
                    !isPreviewMode && (
                        <View style={styles.frameMask}>
                            {/* ToDRAW: You can place SVG here (using react-native-svg) */}
                            {/* Here, just a semi-transparent mask & borders */}
                            <View style={[StyleSheet.absoluteFill, styles.maskBG]} />
                            <View style={[styles.maskBorder, { left: frameRect.left, top: frameRect.top, width: frameRect.width, height: frameRect.height }]} />
                        </View>
                    )
                }

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
            </TouchableOpacity>

            {/* Preview & Filters Modal */}
            {isPreviewMode && capturedImage && (
                <View style={styles.previewModal}>
                    {/* Full screen image preview */}
                    <View style={styles.previewImageBox}>
                        <Image
                            source={{ uri: capturedImage }}
                            style={[styles.capturedImage, getFilterStyle(selectedFilter)]}
                            resizeMode="cover"
                        />
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
                                        isSelected && styles.filterSelected,
                                        { marginLeft: idx === 0 ? wp(8) : 0 }
                                    ]}
                                >
                                    <Image
                                        source={{ uri: capturedImage }}
                                        style={[
                                            styles.filterPreviewImg,
                                            isSelected ? styles.filterSelectedImg : {},
                                            getFilterStyle(filter.name)
                                        ]}
                                    />
                                    <Text style={styles.filterLabel}>{filter.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        <View style={{ width: wp(4) }} />
                    </ScrollView>

                    {/* Bottom Buttons - positioned at very bottom */}
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
        // backgroundColor: 'black',
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
        // shadowColor: "#000",
    },
    previewModal: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        // backgroundColor: '#000',
    },
    previewImageBox: {
        width: '100%',
        flex: 1,
        // backgroundColor: '#000',
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
    filterSelected: {
        shadowColor: '#00ff88',
        shadowOpacity: 0.55,
        shadowRadius: 8,
        borderWidth: 3,
        borderColor: '#00ff88',
        borderRadius: wp(8),
    },
    filterPreviewImg: {
        width: wp(12),
        height: wp(12),
        borderRadius: wp(8),
        marginBottom: hp(1),
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
        // backgroundColor: '#000',
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
        textAlign: 'center',
        fontWeight: '500',
    }
});

export default TakePictureScreen;