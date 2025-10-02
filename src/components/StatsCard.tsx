import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { wp, hp } from '../contants/StyleGuide';

interface StatsCardProps {
    value: string | number;
    label: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ value, label }) => {
    return (
        <View style={styles.cardContainer}>
            <Text style={styles.valueText}>
                {value.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.labelText}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EBFAFB',
        opacity: 0.8,
        borderRadius: wp(2),
        width: '48%',
        paddingVertical: hp(2),
        paddingHorizontal: 0,
    },
    valueText: {
        color: '#3DA9B7',
        fontSize: wp(5),
        fontWeight: 'bold',
        marginBottom: hp(0.5),
        fontFamily: 'System',
    },
    labelText: {
        color: '#666666',
        fontSize: wp(2.2),
        fontWeight: '500',
        fontFamily: 'System',
    },
});

export default StatsCard; 