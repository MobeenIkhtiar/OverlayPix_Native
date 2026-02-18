// RevenueCat type definitions and extensions

import { CustomerInfo, PurchasesPackage, PurchasesStoreTransaction } from 'react-native-purchases';

/**
 * Extended purchase data for event creation
 */
export interface RevenueCatPurchaseData {
    method: 'revenuecat' | 'free';
    customerInfo?: CustomerInfo;
    productId?: string;
    transactionId?: string;
    platform?: 'ios' | 'android';
    packageIdentifier?: string;
}

/**
 * Subscription status helper
 */
export interface SubscriptionStatus {
    isActive: boolean;
    entitlementId: string | null;
    expirationDate: Date | null;
    productIdentifier: string | null;
}

/**
 * Package with plan mapping
 */
export interface PackageWithPlan extends PurchasesPackage {
    planId?: string;
}
