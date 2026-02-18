import { useState, useEffect, useCallback } from 'react';
import { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { revenueCatService } from '../services/revenueCatService';

interface UseIAPReturn {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    customerInfo: CustomerInfo | null;
    currentPackage: PurchasesPackage | null;
    initializeIAP: (userId?: string) => Promise<void>;
    purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
    restorePurchases: () => Promise<CustomerInfo | null>;
    getPackageByPlanId: (planId: string) => Promise<PurchasesPackage | null>;
    hasActiveEntitlement: (entitlementId: string) => Promise<boolean>;
    clearError: () => void;
}

/**
 * React hook for managing In-App Purchases with RevenueCat
 * Handles initialization, purchase flow, and subscription status
 */
export const useIAP = (): UseIAPReturn => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [currentPackage, setCurrentPackage] = useState<PurchasesPackage | null>(null);

    // Initialize RevenueCat on mount
    useEffect(() => {
        initializeIAP();

        // Cleanup is handled by RevenueCat SDK automatically
        return () => {
            // No cleanup needed for RevenueCat
        };
    }, []);

    /**
     * Initialize RevenueCat SDK
     */
    const initializeIAP = useCallback(async (userId?: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const success = await revenueCatService.initialize(userId);
            setIsInitialized(success);

            if (!success) {
                setError('Failed to initialize payment system');
            } else {
                // Fetch customer info after initialization
                const info = await revenueCatService.getCustomerInfo();
                setCustomerInfo(info);
            }
        } catch (err: any) {
            console.error('Error initializing RevenueCat:', err);
            setError(err.message || 'Failed to initialize payment system');
            setIsInitialized(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get package by plan ID
     */
    const getPackageByPlanId = useCallback(
        async (planId: string): Promise<PurchasesPackage | null> => {
            try {
                setIsLoading(true);
                setError(null);

                if (!isInitialized) {
                    await initializeIAP();
                }

                const pkg = await revenueCatService.getPackageByPlanId(planId);
                setCurrentPackage(pkg);
                return pkg;
            } catch (err: any) {
                console.error('Error getting package:', err);
                setError(err.message || 'Failed to fetch product');
                setIsLoading(false);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [isInitialized, initializeIAP]
    );

    /**
     * Purchase a package
     * RevenueCat automatically validates the receipt
     */
    const purchasePackage = useCallback(
        async (pkg: PurchasesPackage): Promise<CustomerInfo | null> => {
            try {
                setIsLoading(true);
                setError(null);
                setCurrentPackage(pkg);

                if (!isInitialized) {
                    await initializeIAP();
                }

                const result = await revenueCatService.purchasePackage(pkg);

                if (result) {
                    setCustomerInfo(result.customerInfo);
                    setIsLoading(false);
                    return result.customerInfo;
                }

                setIsLoading(false);
                return null;
            } catch (err: any) {
                console.error('Error purchasing package:', err);
                setError(err.message || 'Purchase failed');
                setIsLoading(false);
                return null;
            }
        },
        [isInitialized, initializeIAP]
    );

    /**
     * Restore previous purchases
     */
    const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
        try {
            setIsLoading(true);
            setError(null);

            if (!isInitialized) {
                await initializeIAP();
            }

            const result = await revenueCatService.restorePurchases();

            if (result) {
                setCustomerInfo(result.customerInfo);
                setIsLoading(false);
                return result.customerInfo;
            }

            setIsLoading(false);
            return null;
        } catch (err: any) {
            console.error('Error restoring purchases:', err);
            setError(err.message || 'Failed to restore purchases');
            setIsLoading(false);
            return null;
        }
    }, [isInitialized, initializeIAP]);

    /**
     * Check if user has active entitlement
     */
    const hasActiveEntitlement = useCallback(
        async (entitlementId: string): Promise<boolean> => {
            try {
                if (!isInitialized) {
                    await initializeIAP();
                }

                return await revenueCatService.hasActiveEntitlement(entitlementId);
            } catch (err: any) {
                console.error('Error checking entitlement:', err);
                return false;
            }
        },
        [isInitialized, initializeIAP]
    );

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isInitialized,
        isLoading,
        error,
        customerInfo,
        currentPackage,
        initializeIAP,
        purchasePackage,
        getPackageByPlanId,
        restorePurchases,
        hasActiveEntitlement,
        clearError,
    };
};
