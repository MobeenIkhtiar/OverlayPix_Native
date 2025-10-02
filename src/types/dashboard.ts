export interface DashboardStats {
    totalEvents: number;
    activeEvents: number;
    totalPhotos: number;
    totalGuests: number;
}

export interface PlanData {
    planId: string;
    guestLimit: string;
    photoPool: string;
    storageDays: string;
}

export interface EventData {
    eventId: string;
    name: string;
    type: string;
    status: 'Active' | 'Inactive';
    eventDate: string | { _seconds: number; _nanoseconds: number };
    photosCount: number;
    guestsCount: number;
    eventLink?: string;
    shareCode?: string;
    plan?: PlanData;
}

export interface DashboardData {
    totalEvents: number;
    activeEvents: number;
    totalPhotos: number;
    totalGuests: number;
    events: EventData[];
} 