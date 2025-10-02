import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { wp, hp } from '../contants/StyleGuide';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    isEditMode?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled, isEditMode }) => {
    const isDisabled = disabled || isEditMode;
    const translateX = useRef(new Animated.Value(checked ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: checked ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [checked, translateX]);

    const handlePress = () => {
        if (!isDisabled) {
            onChange(!checked);
        }
    };

    const thumbTranslateX = translateX.interpolate({
        inputRange: [0, 1],
        outputRange: [wp(0.5), wp(5.5)],
    });

    return (
        <TouchableOpacity
            activeOpacity={isDisabled ? 1 : 0.7}
            onPress={handlePress}
            disabled={isDisabled}
            style={[styles.container, isDisabled && styles.containerDisabled]}
        >
            <View style={[styles.track, checked ? styles.trackChecked : styles.trackUnchecked]}>
                <Animated.View
                    style={[
                        styles.thumb,
                        {
                            transform: [{ translateX: thumbTranslateX }],
                        },
                    ]}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerDisabled: {
        opacity: 0.5,
    },
    track: {
        width: wp(11),
        height: hp(3),
        borderRadius: wp(6),
        justifyContent: 'center',
        position: 'relative',
    },
    trackChecked: {
        backgroundColor: '#3DA9B7',
    },
    trackUnchecked: {
        backgroundColor: '#B1B1B1',
    },
    thumb: {
        width: wp(5),
        height: wp(5),
        borderRadius: wp(2.5),
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
        position: 'absolute',
    },
});

export default ToggleSwitch; 