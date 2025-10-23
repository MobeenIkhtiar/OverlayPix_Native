export interface TermsAcceptanceData {
    shareId: string;
    acceptedAt: string;
    acceptanceId: string;
    userAgent?: string;
    ipAddress?: string;
}

export interface TermsAcceptanceResponse {
    success: boolean;
    acceptanceId: string;
    acceptedAt: string;
    message?: string;
}

export interface TermsCheckResponse {
    accepted: boolean;
    acceptanceId?: string;
    acceptedAt?: string;
}

export interface EventData {
    eventName?: string;
    hostName?: string;
    ownerName: string;
    eventImage?: string;
    guestPicturesLeft?: number;
    guestPicturesMax?: number;
    shareId?: string;
    eventId?: string;
    eventPictureUrl?: string
    overlayUrl?: string;
    fontSize?: number;
    fontStyle?: string;
    typography?: string
    brandColor?: string
    currentGuestCount?: number;
    guestLimit?: number;
    eventStatus?: string;
    customPlan?: any;
} 
