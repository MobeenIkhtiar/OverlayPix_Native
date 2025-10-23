import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QrCode, Calendar, Crown, Users, Clock, Copy, Share2, Aperture, Link } from 'lucide-react-native';
import { hp, wp } from '../contants/StyleGuide';

interface EventSummaryCardProps {
    eventName?: string;
    dateTime?: string;
    plan?: string;
    guestLimit?: string;
    photoPool?: string;
    photoDuration?: string;
    eventLink?: string;
    onCopyLink?: () => void;
    onShareLink?: () => void;
    onViewQR?: () => void;
}

export const EventSummaryCard: React.FC<EventSummaryCardProps> = ({
    eventName,
    dateTime,
    plan,
    guestLimit,
    photoPool,
    photoDuration,
    eventLink,
    onCopyLink,
    onShareLink,
    onViewQR,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.eventName}>{eventName || 'No event name'}</Text>
            <View style={styles.summaryRows}>
                <SummaryRow icon={<Calendar color="#3DA9B7" size={wp(5)} />} label="Date & Time" value={dateTime || 'No date'} />
                <SummaryRow icon={<Crown color="#3DA9B7" size={wp(5)} />} label="Plan" value={plan || 'No plan'} />
                <SummaryRow icon={<Users color="#3DA9B7" size={wp(5)} />} label="Guest Limit" value={guestLimit || 'No limit'} />
                <SummaryRow icon={<Aperture color="#3DA9B7" size={wp(5)} />} label="Photo Pool" value={photoPool || 'No pool'} />
                <SummaryRow icon={<Clock color="#3DA9B7" size={wp(5)} />} label="Photo Duration" value={photoDuration || 'No duration'} />
                <View style={styles.linkSection}>
                    <View style={styles.linkRow}>
                        <View style={styles.linkLabelRow}>
                            <Link color="#3DA9B7" size={wp(5)} />
                            <Text style={styles.linkLabel}>Event Link</Text>
                        </View>
                        <TouchableOpacity onPress={onShareLink} style={styles.iconButton}>
                            <Share2 color="#3DA9B7" size={wp(4)} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.linkRow}>
                        <Text style={styles.eventLinkText} numberOfLines={1} ellipsizeMode="middle">
                            {eventLink || 'No link'}
                        </Text>
                        <TouchableOpacity onPress={onCopyLink} style={styles.iconButton}>
                            <Copy color="#808080" size={wp(4)} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <View style={styles.qrSection}>
                <QrCode color="#626464" size={wp(6)} />
                <Text style={styles.qrText}>Share With QR</Text>
                <TouchableOpacity onPress={onViewQR} style={styles.qrButton}>
                    <Text style={styles.qrButtonText}>View QR</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

interface SummaryRowProps {
    icon: React.ReactNode;
    label: string;
    value?: string;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ icon, label, value }) => (
    <View style={styles.summaryRow}>
        <View style={styles.summaryRowLabel}>
            <View style={{ marginRight: wp(2) }}>{icon}</View>
            <Text style={styles.summaryLabelText}>{label}</Text>
        </View>
        <Text style={styles.summaryValueText}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    eventName: {
        fontSize: wp(4.2),
        fontWeight: '600',
        textAlign: 'left',
        color: '#3DA9B7',
        marginBottom: hp(1.2),
    },
    summaryRows: {
        // space-y-2 equivalent
        marginBottom: hp(1),
    },
    summaryRow: {
        paddingVertical: hp(1.2),
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F2',
    },
    summaryRowLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    summaryLabelText: {
        fontSize: wp(3.5),
        color: '#B2B2B2',
        fontWeight: '600',
    },
    summaryValueText: {
        fontSize: wp(3.5),
        color: '#666666',
        fontWeight: '600',
        marginTop: hp(0.5),
        marginLeft: wp(8),
        textAlign: 'left',
    },
    linkSection: {
        gap: hp(1),
        paddingVertical: hp(1.2),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F2F2F2',
        marginVertical: hp(1.2),
        flexDirection: 'column',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: wp(2),
    },
    linkLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    linkLabel: {
        fontSize: wp(3),
        color: '#A0A0A0',
        fontWeight: '500',
        marginRight: wp(2),
    },
    eventLinkText: {
        fontSize: wp(3),
        color: '#626666',
        width: '60%',
        marginLeft: wp(8),
    },
    iconButton: {
        padding: wp(1.5),
        borderRadius: wp(2),
    },
    qrSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(2),
        backgroundColor: '#F3FAFB',
        borderRadius: wp(2),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        gap: wp(3),
    },
    qrText: {
        color: '#626464',
        fontSize: wp(3.8),
        fontWeight: '500',
        flex: 1,
        marginLeft: wp(2),
    },
    qrButton: {
        backgroundColor: '#3DA9B7',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: wp(1.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    qrButtonText: {
        color: '#fff',
        fontSize: wp(3.2),
        fontWeight: '600',
    },
});