import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    TouchableWithoutFeedback,
} from 'react-native';
import { wp, hp } from '../contants/StyleGuide';

interface DropdownOption {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    label: string;
    value: string;
    options: DropdownOption[];
    onSelect: (value: string) => void;
    placeholder?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    label,
    value,
    options,
    onSelect,
    placeholder = 'Select an option',
}) => {
    const [isVisible, setIsVisible] = useState(false);


    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : placeholder;

    const handleSelect = (optionValue: string) => {
        onSelect(optionValue);
        setIsVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={styles.dropdownText}>{displayValue}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{label}</Text>
                                    <TouchableOpacity
                                        onPress={() => setIsVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={options}
                                    keyExtractor={(item) => item.value}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.option,
                                                item.value === value && styles.selectedOption,
                                            ]}
                                            onPress={() => handleSelect(item.value)}
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    item.value === value && styles.selectedOptionText,
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                            {item.value === value && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    style={styles.optionsList}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: hp(1.5),
    },
    label: {
        fontSize: wp(3.5),
        fontWeight: '500',
        color: '#666666',
        marginBottom: hp(0.5),
    },
    dropdown: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: wp(1.5),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: wp(3.5),
        color: '#666666',
        flex: 1,
    },
    dropdownIcon: {
        fontSize: wp(3),
        color: '#666666',
        marginLeft: wp(2),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: wp(3),
        width: wp(85),
        maxHeight: hp(60),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: wp(4.5),
        fontWeight: '600',
        color: '#3DA9B7',
    },
    closeButton: {
        padding: wp(1),
    },
    closeButtonText: {
        fontSize: wp(5),
        color: '#666666',
        fontWeight: 'bold',
    },
    optionsList: {
        maxHeight: hp(50),
    },
    option: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: '#E3F6F8',
    },
    optionText: {
        fontSize: wp(3.8),
        color: '#666666',
    },
    selectedOptionText: {
        color: '#3DA9B7',
        fontWeight: '600',
    },
    checkmark: {
        fontSize: wp(4.5),
        color: '#3DA9B7',
        fontWeight: 'bold',
    },
});

export default CustomDropdown;
