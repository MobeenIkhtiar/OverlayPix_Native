export interface StorageOption {
    days: number;
    price: number;
}

export interface Plan {
    id: string;
    name: string;
    price: number;
    basePlan?: number;
    guestLimit: number;
    photoPool: number;
    features: string[];
    storageOptions: StorageOption[];
    defaultStorageDays: number;
    guestLimitIncreasePricePerGuest: number;
    photoPoolLimitIncreasePricePerPhoto: number;
}

export interface PlansResponse {
    success: boolean;
    data: Plan[];
    message?: string;
}

export interface PlanSelection {
    planId: string;
    guestLimit: number;
    photoPool: number;
    photosPerGuest: number;
    storageDays: number;
    permissions: {
        canViewGallery: boolean;
        canSharePhotos: boolean;
        canDownload: boolean;
    };
} 