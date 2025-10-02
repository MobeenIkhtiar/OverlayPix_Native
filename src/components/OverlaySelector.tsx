import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
} from 'react-native';
import { useCreateEvent } from '../hooks/useCreateEvent';
import { hp, wp } from '../contants/StyleGuide';
import { overlayService } from '../services/overlayService';

export type Overlay = {
    id: string;
    src: string;
    category: string;
    name: string;
};

interface OverlaySelectorProps {
    overlays?: Overlay[];
    categories?: string[];
    onSelect?: (overlay: Overlay) => void;
    isOpen: boolean;
    onClose: () => void;
    selectedOverlayId?: string | null;
}

const OverlaySelector: React.FC<OverlaySelectorProps> = ({
    overlays: propOverlays,
    categories: propCategories,
    isOpen,
    onClose,
    onSelect,
    selectedOverlayId,
}) => {
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { step1Data } = useCreateEvent();

    // Fetch overlays from API
    useEffect(() => {
        if (!isOpen) return;
        const fetchOverlays = async () => {
            try {
                setLoading(true);
                setError(null);
                const overlayData = await overlayService.getAllOverlays();

                // Transform API data to component format
                const transformedOverlays: Overlay[] = overlayData.map((overlay: any) => ({
                    id: overlay.id,
                    src: overlay.url,
                    category: overlay.category,
                    name: overlay.name,
                }));

                setOverlays(transformedOverlays);

                // Extract unique categories
                const uniqueCategories = ['All', ...Array.from(new Set(overlayData.map((overlay: any) => overlay.category)))];
                setCategories(uniqueCategories as string[]);
            } catch (err) {
                console.error('Error fetching overlays:', err);
                setError('Failed to load overlays. Please try again later.');
                setOverlays([]);
                setCategories(['All']);
            } finally {
                setLoading(false);
            }
        };

        fetchOverlays();
    }, [isOpen]);

    // Use prop data if provided (for backward compatibility)
    const finalOverlays = propOverlays || overlays;
    const finalCategories = propCategories || categories;

    // Update the useEffect to use the prop value
    useEffect(() => {
        if (selectedOverlayId) {
            setSelectedOverlay(selectedOverlayId);
        } else if (
            step1Data &&
            typeof step1Data.overlay === 'string' &&
            finalOverlays.length > 0
        ) {
            const match = finalOverlays.find((o) => o.id === step1Data.overlay);
            if (match) {
                setSelectedOverlay(match.id);
            }
        }
    }, [selectedOverlayId, step1Data, finalOverlays]);

    // Filter overlays by selected category (except 'All')
    const filteredOverlays = selectedCategory === 'All'
        ? finalOverlays
        : finalOverlays.filter((o) => o.category === selectedCategory);

    // Show all overlays, no restriction
    const overlaysToShow = filteredOverlays;

    // Fill grid to at least 16 items (4x4) with empty slots if needed, but show all overlays
    const gridLength = Math.max(16, overlaysToShow.length);
    const gridItems = [
        ...overlaysToShow,
        ...Array(Math.max(0, gridLength - overlaysToShow.length)).fill(null),
    ];

    // Modal not open: render nothing
    if (!isOpen) return null;

    // Grid config
    const numColumns = 4;
    const itemSize = wp(18); // width/height of each grid item

    const renderGridItem = ({ item, index }: { item: Overlay | null; index: number }) => {
        const isSelected = item && selectedOverlay === item.id;
        return (
            <TouchableOpacity
                key={item ? item.id : `empty-${index}`}
                style={[
                    styles.gridItem,
                    {
                        width: itemSize,
                        height: itemSize,
                        borderColor: isSelected ? '#2AB7C2' : 'transparent',
                        backgroundColor: isSelected
                            ? '#B9B6E5'
                            : '#F6F6F6',
                    },
                    isSelected && styles.selectedGridItem,
                ]}
                activeOpacity={item ? 0.7 : 1}
                onPress={() => {
                    if (item) setSelectedOverlay(item.id);
                }}
                disabled={!item}
            >
                {item ? (
                    <>
                        <Image
                            source={{ uri: item.src }}
                            style={styles.overlayImage}
                            resizeMode="cover"
                            onError={() => { /* Optionally handle image error */ }}
                        />
                        {isSelected && (
                            <View style={styles.selectedIconContainer}>
                                {/* Checkmark SVG as React Native SVG or fallback to emoji */}
                                <Text style={styles.selectedIcon}>✔️</Text>
                            </View>
                        )}
                    </>
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={isOpen}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContent}>
                    {/* Close button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        accessibilityLabel="Close"
                    >
                        <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Select an Overlay</Text>
                    {/* Error notification */}
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3DA9B7" />
                        </View>
                    ) : (
                        <>
                            {/* Tabs */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.tabsRow}
                                style={{ marginBottom: hp(1.5) }}
                            >
                                {finalCategories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.tabButton,
                                            selectedCategory === cat && styles.tabButtonActive,
                                        ]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <Text
                                            style={[
                                                styles.tabButtonText,
                                                selectedCategory === cat && styles.tabButtonTextActive,
                                            ]}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            {/* Overlay Grid */}
                            <FlatList
                                data={gridItems}
                                renderItem={renderGridItem}
                                keyExtractor={(item, idx) => (item ? item.id : `empty-${idx}`)}
                                numColumns={numColumns}
                                scrollEnabled={true}
                                contentContainerStyle={styles.grid}
                                style={{ marginBottom: hp(2) }}
                            />
                            {/* Action Buttons */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.selectButton,
                                        !selectedOverlay && styles.selectButtonDisabled,
                                    ]}
                                    onPress={() => {
                                        if (selectedOverlay) {
                                            const selected = finalOverlays.find(o => o.id === selectedOverlay);
                                            if (selected) {
                                                onSelect?.(selected);
                                                onClose();
                                            }
                                        }
                                    }}
                                    disabled={!selectedOverlay}
                                >
                                    <Text style={styles.selectButtonText}>Select</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    modalContent: {
        width: wp(90),
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: wp(3),
        padding: wp(5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: wp(3),
        right: wp(3),
        zIndex: 2,
        width: wp(7),
        height: wp(7),
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: wp(7),
        color: '#888',
        fontWeight: 'bold',
    },
    title: {
        fontSize: wp(4.5),
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: hp(2),
        marginTop: hp(1),
        color: '#222',
    },
    errorText: {
        color: '#F59E42',
        fontSize: wp(3),
        textAlign: 'center',
        marginBottom: hp(1),
    },
    loadingContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(5),
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        marginBottom: hp(1),
    },
    tabButton: {
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.7),
        borderRadius: wp(2),
        backgroundColor: 'transparent',
        marginRight: wp(1),
    },
    tabButtonActive: {
        backgroundColor: '#E6F7F9',
    },
    tabButtonText: {
        fontSize: wp(3),
        color: '#626666',
    },
    tabButtonTextActive: {
        color: '#3DA9B7',
        fontWeight: 'bold',
    },
    grid: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
        marginBottom: hp(2),
    },
    gridItem: {
        borderWidth: 2,
        borderRadius: wp(2),
        overflow: 'hidden',
        margin: wp(1),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F6F6F6',
        position: 'relative',
    },
    selectedGridItem: {
        backgroundColor: '#B9B6E5',
        borderColor: '#2AB7C2',
    },
    overlayImage: {
        width: '100%',
        height: '100%',
        borderRadius: wp(2),
    },
    selectedIconContainer: {
        position: 'absolute',
        top: wp(1),
        left: wp(1),
        backgroundColor: '#2AB7C2',
        borderRadius: wp(2),
        padding: wp(0.5),
        zIndex: 2,
    },
    selectedIcon: {
        color: '#fff',
        fontSize: wp(4),
        fontWeight: 'bold',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: wp(2),
        marginTop: hp(1),
    },
    cancelButton: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: wp(2),
        backgroundColor: '#E5E7EB',
        marginRight: wp(2),
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: wp(3.5),
    },
    selectButton: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: wp(2),
        backgroundColor: '#3DA9B7',
    },
    selectButtonDisabled: {
        backgroundColor: '#BDBDBD',
    },
    selectButtonText: {
        color: '#fff',
        fontSize: wp(3.5),
        fontWeight: '600',
    },
});

export default OverlaySelector;
