import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, } from 'react-native';
import { Eye, SquarePen, type LucideIcon, QrCode } from 'lucide-react-native';
import { wp, hp } from '../contants/StyleGuide';

interface ActionButtonProps {
    icon?: LucideIcon;
    label: string;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, label, className = '', onClick, disabled = false }) => (
    <TouchableOpacity
        style={[
            styles.actionButton,
            className === 'border-[0.5px] border-[#E6E6E6] px-5 text-[#666666] hover:bg-gray-50' && styles.actionButtonBorder,
            className === 'bg-[#3DA9B7] text-white px-5 hover:bg-[#31909a]' && styles.actionButtonEdit,
            className === 'border border-[#3DA9B7] justify-center text-[#3DA9B7] hover:bg-[#e6f7fa]' && styles.actionButtonUpgrade,
            disabled && styles.actionButtonDisabled,
        ]}
        onPress={disabled ? undefined : onClick}
        activeOpacity={0.7}
        disabled={disabled}
    >
        {Icon && <Icon size={wp(4.5)} color={className?.includes('text-[#3DA9B7]') ? '#3DA9B7' : className?.includes('text-white') ? '#fff' : '#666'} style={{ marginRight: wp(2) }} />}
        <Text
            style={[
                styles.actionButtonText,
                className === 'bg-[#3DA9B7] text-white px-5 hover:bg-[#31909a]' && { color: '#fff' },
                className === 'border border-[#3DA9B7] justify-center text-[#3DA9B7] hover:bg-[#e6f7fa]' && { color: '#3DA9B7' },
                className === 'border-[0.5px] border-[#E6E6E6] px-5 text-[#666666] hover:bg-gray-50' && { color: '#666' },
                disabled && { opacity: 0.5 }
            ]}
        >
            {label}
        </Text>
    </TouchableOpacity>
);

interface EventInfoRowProps {
    label: string;
    value: React.ReactNode;
    className?: string;
    valueClassName?: string;
}

const EventInfoRow: React.FC<EventInfoRowProps> = ({ label, value, className = '', valueClassName = '' }) => (
    <View
        style={[
            styles.infoRow,
            className === 'mb-2 bg-[#F4FEFE]' && styles.infoRowStatus,
            className === 'mb-2 bg-[#F7F7F7]' && styles.infoRowDefault,
        ]}
    >
        <Text
            style={[
                styles.infoLabel,
            ]}
        >
            {label}
        </Text>
        <Text
            style={[
                styles.infoValue,
                valueClassName === 'text-[#FF3B3B]' && { color: '#FF3B3B' },
                valueClassName === 'text-[#40F140]' && { color: '#40F140' },
                valueClassName === 'text-[#000] opacity-60' && { color: '#000', opacity: 0.6 },
            ]}
        >
            {value}
        </Text>
    </View>
);

interface EventCardProps {
    title: string;
    type: string;
    status: string;
    date: string;
    photos: number;
    guests: number;
    onViewImages?: () => void;
    onEdit?: () => void;
    onUpgrade?: () => void;
    onQRCode?: () => void;
    storageExpired?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
    title,
    type,
    status,
    date,
    photos,
    guests,
    onViewImages,
    onEdit,
    onUpgrade,
    onQRCode,
    storageExpired,
}) => {
    // Normalize status to string and check for "expired" (case-insensitive)
    const isExpired = typeof status === 'string' && status.trim().toLowerCase() === 'expired';

    return (
        <View style={styles.cardContainer}>
            <View style={{ marginBottom: hp(0.5) }}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardType}>{type}</Text>
            </View>
            <View style={styles.cardGrid}>
                <View style={{ flex: 1 }}>
                    <EventInfoRow
                        label="Status"
                        value={status}
                        className="mb-2 bg-[#F4FEFE]"
                        valueClassName={isExpired ? 'text-[#FF3B3B]' : 'text-[#40F140]'}
                    />
                    <EventInfoRow
                        label="Date"
                        value={date}
                        className="mb-2 bg-[#F7F7F7]"
                        valueClassName='text-[#000] opacity-60'
                    />
                    <EventInfoRow
                        label="Photos"
                        value={photos}
                        className="mb-2 bg-[#F7F7F7]"
                        valueClassName='text-[#000] opacity-60'
                    />
                    <EventInfoRow
                        label="Guests"
                        value={guests}
                        className="mb-2 bg-[#F7F7F7]"
                        valueClassName='text-[#000] opacity-60'
                    />
                </View>
                <View style={styles.actionColumn}>
                    <ActionButton
                        icon={Eye}
                        label="View Images"
                        className="border-[0.5px] border-[#E6E6E6] px-5 text-[#666666] hover:bg-gray-50"
                        onClick={onViewImages}
                        disabled={storageExpired}
                    />
                    <ActionButton
                        icon={SquarePen}
                        label="Edit"
                        className="bg-[#3DA9B7] text-white px-5 hover:bg-[#31909a]"
                        onClick={onEdit}
                        disabled={isExpired}
                    />
                    <ActionButton
                        label="Upgrade"
                        className="border border-[#3DA9B7] justify-center text-[#3DA9B7] hover:bg-[#e6f7fa]"
                        onClick={onUpgrade}
                        disabled={isExpired}
                    />
                    <ActionButton
                        icon={QrCode}
                        label="QR Code"
                        className="border-[0.5px] border-[#E6E6E6] px-5 text-[#666666] hover:bg-gray-50"
                        onClick={onQRCode}
                        disabled={isExpired}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: wp(3),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        padding: wp(3),
        width: '100%',
        marginBottom: hp(2),
    },
    cardTitle: {
        fontWeight: '600',
        fontSize: wp(4.5),
        textAlign: 'left',
        color: '#000',
        lineHeight: wp(5.5),
    },
    cardType: {
        fontSize: wp(3.7),
        textAlign: 'left',
        marginTop: hp(0.5),
        color: '#000',
        opacity: 0.5,
    },
    cardGrid: {
        flexDirection: 'row',
        gap: wp(4),
        marginTop: hp(2),
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: hp(1),
        borderRadius: wp(1),
        paddingHorizontal: wp(2),
        marginBottom: hp(0.7),
        backgroundColor: '#F7F7F7',
    },
    infoRowStatus: {
        backgroundColor: '#F4FEFE',
    },
    infoRowDefault: {
        backgroundColor: '#F7F7F7',
    },
    infoLabel: {
        fontSize: wp(2.7),
        fontWeight: '400',
        color: '#626666',
    },
    infoValue: {
        fontSize: wp(2.7),
        fontWeight: '600',
    },
    actionColumn: {
        flex: 1,
        justifyContent: 'space-between',
        gap: hp(1.2),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: wp(1.5),
        paddingVertical: hp(1.1),
        paddingHorizontal: wp(4),
        fontSize: wp(3.2),
        fontWeight: '500',
        backgroundColor: '#fff',
        borderWidth: 0,
        marginBottom: hp(0.5),
    },
    actionButtonBorder: {
        borderWidth: 0.5,
        borderColor: '#E6E6E6',
        backgroundColor: '#fff',
    },
    actionButtonEdit: {
        backgroundColor: '#3DA9B7',
    },
    actionButtonUpgrade: {
        borderWidth: 1,
        borderColor: '#3DA9B7',
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: wp(3.2),
        fontWeight: '500',
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
});

export default EventCard; 