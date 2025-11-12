export interface EventPermissions {
    canViewGallery: boolean;
    canSharePhotos: boolean;
    canDownload: boolean;
}

export interface EventPlan {
    planId: string;
    guestLimit: number;
    photoPool: number;
    photosPerGuest: number;
    storageDays: number;
    finalPrice: number;
    permissions: EventPermissions;
    basePlan?: number
    storageDaysPrice?: number
    guestLimitPrice?: number;
    photoPoolPrice?: number;
}

export interface CustomPlan {
    guestLimit: number;
    photoPool: number;
    photosPerGuest: number;
    storageDays: number;
    permissions: EventPermissions;
}

export interface EventPayment {
    method: string;
    paymentIntentId?: string;
    paypalOrderId?: string;
}

export interface EventBranding {
    brandColor: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: string;
    eventImage: string | null;
}

export interface EventData {
    id: string;
    name: string;
    type: string;
    date: string;
    timeZone: string;
    startTime: string;
    endTime: string;
    plan: EventPlan;
    branding?: EventBranding;
    payment?: EventPayment;
}

export interface CreateEventData {
    name: string;
    type: string;
    eventDate: string;
    eventStartTime: string;
    eventEndTime: string;
    timeZone: string;
    brandColor: string;
    typography: string;
    fontStyle: string;
    fontSize: number;
    planId: string;
    customPlan: CustomPlan;
    finalPrice: number;
    payment: EventPayment & { discountCode?: string };
    overlay?: any,
    eventPicture?: any
}

export interface CreateEventStep1Data {
    name: string;
    type: string;
    date: string;
    timeZone: string;
    startTime: string;
    endTime: string;
    overlay: any;
    overlayName: string;
    overlayId: string;
}

export interface CreateEventStep2Data {
    plan: EventPlan;
}

export interface CreateEventStep3Data {
    brandColor: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: string;
    eventPicture: string | null;
    eventPictureFile?: any;
    overlayTemplate?: File;
}

export interface CreateEventStep4Data {
    discountPrice: number
    payment: EventPayment;
}

export interface CreateEventContextType {
    // Step data
    step1Data: CreateEventStep1Data;
    step2Data: CreateEventStep2Data;
    step3Data: CreateEventStep3Data;
    step4Data: CreateEventStep4Data;

    // Actions
    updateStep1Data: (data: Partial<CreateEventStep1Data>) => void;
    updateStep2Data: (data: Partial<CreateEventStep2Data>) => void;
    updateStep3Data: (data: Partial<CreateEventStep3Data>) => void;
    updateStep4Data: (data: Partial<CreateEventStep4Data>) => void;

    // Form validation
    isStep1Valid: boolean;
    isStep2Valid: boolean;
    isStep3Valid: boolean;
    isStep4Valid: boolean;

    // API actions
    createEvent: () => Promise<any>;
    createEventWithData: (data: {
        step1Data: any;
        step2Data: any;
        step3Data: any;
        step4Data: any;
    }, paymentIntent?: any) => Promise<{ success: boolean; eventId?: string; event?: { eventId: string } } | null>;
    loadEventForEdit: (eventId: string) => Promise<void>;
    updateEvent: (eventId: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    upgradeEvent: (eventId: string) => Promise<{ success: boolean } | null>;
    upgradeEventWithData: (eventId: string, data: {
        step2Data: any;
        step4Data: any;
    }, paymentIntent?: any) => Promise<{ success: boolean } | null>;

    // Reset
    resetEventData: () => void;
} 