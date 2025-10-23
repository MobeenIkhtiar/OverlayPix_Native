import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ScrollView,
} from 'react-native';
import ColorPicker, { Panel1, HueSlider, returnedResults } from 'reanimated-color-picker';
import { useCreateEvent } from '../hooks/useCreateEvent';
import { wp, hp } from '../contants/StyleGuide';
import { runOnJS } from 'react-native-reanimated';
import { X } from 'lucide-react-native'

interface ColorPickerModalProps {
    open: boolean;
    color: string;
    onChange: (color: string) => void;
    onClose: () => void;
    lastUsedColors?: string[];
}

const defaultLastUsed = [
    '#000000', '#2196F3', '#4CAF50', '#FFEB3B', '#FF9800', '#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#8BC34A', '#FF5252'
];

function rgbaToHex(r: number, g: number, b: number) {
    return (
        '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    );
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ open, color, onChange, onClose, lastUsedColors = defaultLastUsed }) => {
    const [hex, setHex] = useState(color);

    useEffect(() => {
        setHex(color);
    }, [color]);

    const { updateStep3Data } = useCreateEvent();

    useEffect(() => {
        // If color is rgba, extract hex
        if (color.startsWith('rgba')) {
            const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
            if (match) {
                const r = Number(match[1]);
                const g = Number(match[2]);
                const b = Number(match[3]);
                setHex(rgbaToHex(r, g, b));
            }
        } else {
            setHex(color);
        }
    }, [color]);

    // Handler for picking a color (from swatch)
    const handlePick = (pickedHex: string) => {
        setHex(pickedHex);
        onChange(pickedHex);
        onClose();
        updateStep3Data({ brandColor: pickedHex });
    };

    // JS thread function to update state
    const updateColor = (hexColor: string) => {
        setHex(hexColor);
        updateStep3Data({ brandColor: hexColor });
        onChange(hexColor);
    };

    // Handler for picking a color from the color picker (does NOT close modal)
    const handleColorPickerChange = (result: returnedResults) => {
        'worklet';
        const hexColor = result.hex;
        runOnJS(updateColor)(hexColor);
    };

    const handleTextChange = (text: string) => {
        setHex(text);
        if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
            onChange(text);
            updateStep3Data({ brandColor: text });
        }
    };

    return (
        <Modal
            visible={open}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                {/* Modal Content */}
                <View style={styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Close Button */}
                        <View style={styles.headingBox}>
                            <Text style={styles.title}>Color Picker</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <X size={wp(6)} color="#3DA9B7" />
                            </TouchableOpacity>
                        </View>
                        {/* Color Area */}
                        <View style={styles.colorPickerContainer}>
                            <ColorPicker
                                value={hex}
                                onComplete={handleColorPickerChange}
                                style={styles.colorPicker}
                            >
                                <Panel1 style={styles.panel} />
                                <HueSlider style={styles.slider} />
                            </ColorPicker>
                        </View>

                        {/* Tabs (only Hex active) */}
                        <View style={styles.tabsContainer}>
                            <View style={[styles.tab, styles.tabActive]}>
                                <Text style={styles.tabTextActive}>Hex</Text>
                            </View>
                            <View style={[styles.tab, styles.tabDisabled]}>
                                <Text style={styles.tabTextDisabled}>RGB</Text>
                            </View>
                            <View style={[styles.tab, styles.tabDisabled]}>
                                <Text style={styles.tabTextDisabled}>HSL</Text>
                            </View>
                            <View style={[styles.tab, styles.tabDisabled]}>
                                <Text style={styles.tabTextDisabled}>HSB</Text>
                            </View>
                        </View>

                        {/* Hex Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.emoji}>🎨</Text>
                            <TextInput
                                value={hex}
                                onChangeText={handleTextChange}
                                style={styles.input}
                                maxLength={7}
                                autoCapitalize="characters"
                            />
                        </View>

                        {/* Last Used Colors */}
                        <View style={styles.lastUsedContainer}>
                            <Text style={styles.lastUsedTitle}>Last Used</Text>
                            <View style={styles.swatchContainer}>
                                {lastUsedColors.map((c, i) => (
                                    <TouchableOpacity
                                        key={c + i}
                                        style={[styles.swatch, { backgroundColor: c }]}
                                        onPress={() => handlePick(c)}
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(2),
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: wp(4),
        width: wp(80),
        maxHeight: hp(80),
        padding: wp(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    headingBox: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    closeButton: {
        width: wp(8),
        height: wp(8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#808080',
        fontSize: wp(8),
        fontWeight: 'bold',
    },
    title: {
        fontSize: wp(4.5),
        fontWeight: '600',
        marginBottom: hp(2),
    },
    colorPickerContainer: {
        alignItems: 'center',
        marginBottom: hp(2),
    },
    colorPicker: {
        width: wp(65),
    },
    panel: {
        width: wp(65),
        height: hp(22),
        borderRadius: wp(3),
        marginBottom: hp(1),
    },
    slider: {
        width: wp(65),
        height: hp(4),
        borderRadius: wp(2),
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: wp(2),
        marginBottom: hp(2),
    },
    tab: {
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: wp(1.5),
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    tabActive: {
        backgroundColor: '#F6F6F6',
    },
    tabDisabled: {
        opacity: 0.5,
    },
    tabTextActive: {
        color: '#222',
        fontSize: wp(3),
        fontWeight: '600',
    },
    tabTextDisabled: {
        color: '#B0B0B0',
        fontSize: wp(3),
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        marginBottom: hp(2),
    },
    emoji: {
        fontSize: wp(5),
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: wp(1.5),
        paddingHorizontal: wp(2),
        paddingVertical: hp(1),
        fontSize: wp(3),
    },
    lastUsedContainer: {
        marginTop: hp(2),
    },
    lastUsedTitle: {
        fontSize: wp(3),
        marginBottom: hp(1),
    },
    swatchContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
    },
    swatch: {
        width: wp(6),
        height: wp(6),
        borderRadius: wp(1.5),
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
});

export default ColorPickerModal;