import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { wp } from '../contants/StyleGuide';

interface CustomCheckBoxProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    size?: number;
    checkedColor?: string;
    uncheckedColor?: string;
    borderColor?: string;
}

const CustomCheckBox: React.FC<CustomCheckBoxProps> = ({
    value,
    onValueChange,
    size = wp(5),
    checkedColor = '#2EC4B6',
    uncheckedColor = '#fff',
    borderColor = '#9CA3AF',
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size * 0.2,
                    backgroundColor: value ? checkedColor : uncheckedColor,
                    borderColor: value ? checkedColor : borderColor,
                },
            ]}
            onPress={() => onValueChange(!value)}
            activeOpacity={0.7}
        >
            {value && (
                <Check
                    size={size * 0.7}
                    color="#fff"
                    strokeWidth={3}
                />
            )}
        </TouchableOpacity>
    );
};

export default CustomCheckBox;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
});
