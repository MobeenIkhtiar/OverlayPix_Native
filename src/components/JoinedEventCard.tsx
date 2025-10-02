import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, type LucideIcon } from 'lucide-react-native';
import { wp, hp } from '../contants/StyleGuide';

interface ActionButtonProps {
    icon?: LucideIcon;
    label: string;
    onPress?: () => void;
    disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, label, onPress, disabled = false }) => (
    <TouchableOpacity
        style={[
            styles.actionButton,
            disabled && styles.actionButtonDisabled
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
    >
        {Icon && <Icon size={wp(4.5)} color="#3DA9B7" style={{ marginRight: wp(2) }} />}
        <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
);

interface EventInfoRowProps {
    label: string;
    value: React.ReactNode;
    highlightColor?: string;
}

const EventInfoRow: React.FC<EventInfoRowProps> = ({ label, value, highlightColor }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, highlightColor ? { color: highlightColor } : null]}>{value}</Text>
    </View>
);

interface EventCardProps {
    title: string;
    type: any;
    status: any;
    date?: string;
    photos?: number;
    guests?: number;
    onViewImages?: () => void;
    storageExpired?: boolean;
}

const JoinedEventCard: React.FC<EventCardProps> = ({
    title,
    type,
    status,
    date,
    photos,
    guests,
    onViewImages,
    storageExpired,
}) => {
    // Normalize status to string for comparison
    const statusStr = typeof status === 'string' ? status.toLowerCase() : String(status).toLowerCase();
    const isExpired = statusStr === 'expired';

    return (
        <View style={styles.cardContainer}>
            <View style={styles.headerSection}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.type}>{type}</Text>
            </View>
            <View style={styles.contentRow}>
                <View style={styles.infoSection}>
                    <EventInfoRow
                        label="Status"
                        value={status}
                        highlightColor={isExpired ? "#EF4444" : "#22C55E"}
                    />
                    <EventInfoRow
                        label="Date"
                        value={date}
                    />
                    <EventInfoRow
                        label="Photos"
                        value={photos}
                    />
                    <EventInfoRow
                        label="Guests"
                        value={guests}
                    />
                </View>
                <View style={styles.buttonSection}>
                    <ActionButton
                        icon={Eye}
                        label="View Event"
                        onPress={onViewImages}
                        disabled={storageExpired}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: wp(4),
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: wp(2),
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        padding: wp(5),
        width: '100%',
        borderWidth: 1,
        borderColor: '#F0F4F8',
        marginBottom: hp(2),
    },
    headerSection: {
        marginBottom: hp(1.5),
    },
    title: {
        fontWeight: 'bold',
        fontSize: wp(4.5),
        color: '#222',
        lineHeight: wp(5.5),
    },
    type: {
        fontSize: wp(3.2),
        color: '#3DA9B7',
        fontWeight: '500',
        marginTop: hp(0.2),
    },
    contentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: hp(1),
    },
    infoSection: {
        flex: 1,
        marginRight: wp(3),
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: wp(2),
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
        marginBottom: hp(1),
    },
    infoLabel: {
        fontSize: wp(3),
        fontWeight: '500',
        color: '#6B7280',
    },
    infoValue: {
        fontSize: wp(3),
        fontWeight: '600',
        color: '#64748B',
    },
    buttonSection: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        flex: 0.8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: wp(2),
        paddingVertical: hp(1.2),
        paddingHorizontal: wp(5),
        borderWidth: 1,
        borderColor: '#E6E6E6',
        backgroundColor: '#F8FAFC',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: wp(1),
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        fontSize: wp(3.2),
        fontWeight: '600',
        color: '#3DA9B7',
    },
});

export default JoinedEventCard;