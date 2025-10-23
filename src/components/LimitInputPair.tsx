import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { wp, hp } from '../contants/StyleGuide';

interface LimitInputPairProps {
    currentLabel: string;
    currentValue: number;
    newLabel: string;
    newValue: number;
    onNewValueChange: (value: number) => void;
    style?: any;
}

const LimitInputPair: React.FC<LimitInputPairProps> = ({
    currentLabel,
    currentValue,
    newLabel,
    newValue,
    onNewValueChange,
}) => {
    // Only allow increasing the value, not decreasing below currentValue
    const handleNewValueChange = (text: string) => {
        const value = Number(text.replace(/[^0-9]/g, ''));
        if (!isNaN(value) && value >= currentValue) {
            onNewValueChange(value);
        } else if (text === '') {
            onNewValueChange(currentValue);
        }
    };

    const handleIncrement = () => {
        onNewValueChange(newValue + 1);
    };

    const handleDecrement = () => {
        if (newValue > currentValue) {
            onNewValueChange(newValue - 1);
        }
    };

    return (
        <View style={styles.container}>
            {/* Current Value */}
            <View style={styles.flexItem}>
                <Text style={styles.label}>{currentLabel}</Text>
                <TextInput
                    value={String(currentValue)}
                    editable={false}
                    style={styles.currentInput}
                />
            </View>
            {/* New Value with plus/minus buttons */}
            <View style={styles.flexItem}>
                <Text style={styles.label}>{newLabel}</Text>
                <View style={styles.inputRow}>
                    <TouchableOpacity
                        onPress={handleDecrement}
                        disabled={newValue <= currentValue}
                        style={[
                            styles.button,
                            styles.buttonLeft,
                            newValue <= currentValue && styles.buttonDisabled,
                        ]}
                        accessibilityLabel="Decrease"
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.buttonText,
                            newValue <= currentValue && styles.buttonTextDisabled
                        ]}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                        value={String(newValue)}
                        keyboardType="numeric"
                        onChangeText={handleNewValueChange}
                        style={[styles.newInput,]}
                        textAlign="center"
                    />
                    <TouchableOpacity
                        onPress={handleIncrement}
                        style={[styles.button, styles.buttonRight]}
                        accessibilityLabel="Increase"
                        activeOpacity={0.7}
                    >
                        <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        width: '100%',
        gap: wp(3),
        marginBottom: hp(2.5),
    },
    flexItem: {
        flex: 1,
    },
    label: {
        color: '#000',
        opacity: 0.55,
        textAlign: 'left',
        fontSize: wp(3.5),
        marginBottom: hp(0.5),
    },
    currentInput: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: wp(3),
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(3),
        fontSize: wp(3),
        color: '#ABABAB',
        borderWidth: 1.5,
        borderColor: '#E9E9E9',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
        backgroundColor: '#F3F4F6',
        borderWidth: 1.5,
        borderColor: '#E9E9E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonLeft: {
        borderTopLeftRadius: wp(3),
        borderBottomLeftRadius: wp(3),
    },
    buttonRight: {
        borderTopRightRadius: wp(3),
        borderBottomRightRadius: wp(3),
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: wp(5),
        fontWeight: 'bold',
        color: '#808080',
    },
    buttonTextDisabled: {
        color: '#B0B0B0',
    },
    newInput: {
        width: wp(16),
        backgroundColor: '#fff',
        paddingVertical: hp(1.5),
        fontSize: wp(3),
        color: '#808080',
        borderTopWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: '#E9E9E9',
    },
});

export default LimitInputPair;