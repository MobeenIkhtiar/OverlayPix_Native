import Purchases, {
    PurchasesOfferings,
    PurchasesPackage,
    PurchasesStoreTransaction,
    CustomerInfo,
    LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - Replace with your actual keys
const REVENUECAT_API_KEYS = {
    ios: 'appl_yOURZZuVaYWkfXnBxNVNITwMraa', // Replace with your iOS API key from RevenueCat dashboard
    android: 'goog_GzBPhYCoDtCrBmnDigKZoYSAGtB', // Replace with your Android API key from RevenueCat dashboard
};

// Product/Entitlement identifiers
// Currently using single product: starter_pass1
export const ENTITLEMENT_IDS = {
    starter_event: 'starter_event',
    classic_event: 'classic_event',
    celebration_event: 'celebration_event',
    grand_event: 'grand_event',
    ultimate_event: 'ultimate_event',
};

interface PurchaseResult {
    customerInfo: CustomerInfo;
    transaction?: PurchasesStoreTransaction;
}

interface RestoreResult {
    customerInfo: CustomerInfo;
}

/**
 * RevenueCat Service
 * Handles all in-app purchase operations using RevenueCat SDK
 */
class RevenueCatService {
    private isInitialized = false;
    private currentOfferings: PurchasesOfferings | null = null;

    /**
     * Initialize RevenueCat SDK
     * Call this when the app starts
     */
    async initialize(userId?: string): Promise<boolean> {
        try {
            if (this.isInitialized) {
                console.log('RevenueCat already initialized');
                return true;
            }

            // Get the appropriate API key for the platform
            const apiKey = Platform.select({
                ios: REVENUECAT_API_KEYS.ios,
                android: REVENUECAT_API_KEYS.android,
            });

            if (!apiKey) {
                console.error('RevenueCat API key not found for platform:', Platform.OS);
                return false;
            }

            // Configure RevenueCat
            await Purchases.configure({
                apiKey,
                appUserID: userId, // Optional: set user ID for cross-platform purchases
            });

            // Set log level for debugging (remove in production)
            if (__DEV__) {
                await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            }

            this.isInitialized = true;
            console.log('RevenueCat initialized successfully');

            // Fetch offerings on initialization
            await this.fetchOfferings();

            return true;
        } catch (error) {
            console.error('Error initializing RevenueCat:', error);
            return false;
        }
    }

    /**
     * Fetch available offerings from RevenueCat
     * Offerings are configured in the RevenueCat dashboard
     */
    async fetchOfferings(): Promise<PurchasesOfferings | null> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const offerings = await Purchases.getOfferings();
            this.currentOfferings = offerings;

            console.log('Available offerings:', offerings);

            if (offerings.current) {
                console.log('Current offering:', offerings.current);
                console.log('Available packages:', offerings.current.availablePackages);
            }

            return offerings;
        } catch (error) {
            console.error('Error fetching offerings:', error);
            return null;
        }
    }

    /**
     * Get current offerings (cached)
     */
    getCurrentOfferings(): PurchasesOfferings | null {
        return this.currentOfferings;
    }

    /**
     * Get a specific package by identifier
     * @param packageIdentifier The package identifier (e.g., '$rc_monthly', '$rc_annual', or custom)
     */
    async getPackage(packageIdentifier: string): Promise<PurchasesPackage | null> {
        try {
            const offerings = this.currentOfferings || await this.fetchOfferings();

            if (!offerings?.current) {
                console.log('No current offering available');
                return null;
            }

            const pkg = offerings.current.availablePackages.find(
                p => p.identifier === packageIdentifier
            );

            return pkg || null;
        } catch (error) {
            console.error('Error getting package:', error);
            return null;
        }
    }

    /**
     * Get package by plan ID (maps your plan IDs to RevenueCat packages)
     * @param planId Your internal plan ID (e.g., 'basic', 'standard', 'premium')
     */
    async getPackageByPlanId(planId: string): Promise<PurchasesPackage | null> {
        try {
            const offerings = this.currentOfferings || await this.fetchOfferings();

            if (!offerings) {
                console.log('No offerings available');
                return null;
            }

            // 1. Direct Lookup: Try to find planId as the package identifier
            let targetIdentifier = planId;

            // 2. Fallback Lookup: Check legacy mapping if direct lookup will fail or if we want to support legacy IDs
            const packageMapping: Record<string, string> = {
                starter_event: 'starter_event',
                classic_event: 'classic_event',
                celebration_event: 'celebration_event',
                grand_event: 'grand_event',
                ultimate_event: 'ultimate_event',
            };

            if (packageMapping[planId.toLowerCase()]) {
                targetIdentifier = packageMapping[planId.toLowerCase()];
            }

            // 3. Search Loop: Look for targetIdentifier in ALL offerings
            // Because plans might be split across multiple offerings (user setup), we can't just check 'current'

            // Check current offering first
            if (offerings.current) {
                const pkg = offerings.current.availablePackages.find(p => p.identifier === targetIdentifier);
                if (pkg) return pkg;
            }

            // Check all offerings
            if (offerings.all) {
                for (const offeringId in offerings.all) {
                    const offering = offerings.all[offeringId];
                    if (offering.availablePackages) {
                        const pkg = offering.availablePackages.find(p => p.identifier === targetIdentifier);
                        if (pkg) return pkg;
                    }
                }
            }

            console.error('No package found for plan:', planId, 'Target Identifier:', targetIdentifier);
            return null;

        } catch (error) {
            console.error('Error getting package by plan ID:', error);
            return null;
        }
    }

    /**
     * Purchase a package
     * RevenueCat automatically handles receipt validation
     */
    async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult | null> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('Initiating purchase for package:', pkg.identifier);

            const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);

            console.log('Purchase successful:', {
                productIdentifier,
                entitlements: customerInfo.entitlements.active,
            });

            return {
                customerInfo,
            };
        } catch (error: any) {
            console.error('Error purchasing package:', error);

            // Handle specific RevenueCat errors
            if (error.code === 'PURCHASE_CANCELLED_ERROR') {
                throw new Error('Purchase was cancelled');
            } else if (error.code === 'PRODUCT_ALREADY_PURCHASED_ERROR') {
                throw new Error('You already own this product');
            } else if (error.code === 'NETWORK_ERROR') {
                throw new Error('Network error. Please check your connection');
            } else if (error.code === 'INVALID_CREDENTIALS_ERROR') {
                throw new Error('Invalid credentials. Please contact support');
            } else {
                throw new Error(error.message || 'Purchase failed');
            }
        }
    }

    /**
     * Restore previous purchases
     * RevenueCat automatically syncs purchases across devices
     */
    async restorePurchases(): Promise<RestoreResult | null> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('Restoring purchases...');
            const customerInfo = await Purchases.restorePurchases();

            console.log('Purchases restored:', {
                entitlements: customerInfo.entitlements.active,
            });

            return { customerInfo };
        } catch (error) {
            console.error('Error restoring purchases:', error);
            throw new Error('Failed to restore purchases');
        }
    }

    /**
     * Get current customer info
     * This includes active entitlements and subscription status
     */
    async getCustomerInfo(): Promise<CustomerInfo | null> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const customerInfo = await Purchases.getCustomerInfo();
            console.log('Customer info:', {
                activeEntitlements: Object.keys(customerInfo.entitlements.active),
                allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
            });

            return customerInfo;
        } catch (error) {
            console.error('Error getting customer info:', error);
            return null;
        }
    }

    /**
     * Check if user has active entitlement
     * @param entitlementId The entitlement identifier
     */
    async hasActiveEntitlement(entitlementId: string): Promise<boolean> {
        try {
            const customerInfo = await this.getCustomerInfo();

            if (!customerInfo) {
                return false;
            }

            return customerInfo.entitlements.active[entitlementId] !== undefined;
        } catch (error) {
            console.error('Error checking entitlement:', error);
            return false;
        }
    }

    /**
     * Set user ID for RevenueCat
     * Useful for linking purchases to your backend user
     */
    async setUserId(userId: string): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initialize(userId);
                return;
            }

            await Purchases.logIn(userId);
            console.log('User ID set:', userId);
        } catch (error) {
            console.error('Error setting user ID:', error);
        }
    }

    /**
     * Log out the current user
     */
    async logout(): Promise<void> {
        try {
            if (!this.isInitialized) {
                return;
            }

            await Purchases.logOut();
            console.log('User logged out from RevenueCat');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    /**
     * Get formatted price for a package
     */
    getFormattedPrice(pkg: PurchasesPackage): string {
        return pkg.product.priceString;
    }

    /**
     * Get product title
     */
    getProductTitle(pkg: PurchasesPackage): string {
        return pkg.product.title;
    }

    /**
     * Get product description
     */
    getProductDescription(pkg: PurchasesPackage): string {
        return pkg.product.description;
    }

    /**
     * Check if this is a subscription product
     * Note: This is a best-effort check based on package identifier
     */
    isSubscription(pkg: PurchasesPackage): boolean {
        // Check based on package identifier patterns
        const identifier = pkg.identifier.toLowerCase();
        return identifier.includes('monthly') ||
            identifier.includes('annual') ||
            identifier.includes('yearly') ||
            identifier.includes('subscription') ||
            identifier === '$rc_monthly' ||
            identifier === '$rc_annual';
    }

    /**
     * Get subscription period (if applicable)
     */
    getSubscriptionPeriod(pkg: PurchasesPackage): string | null {
        if (!this.isSubscription(pkg)) {
            return null;
        }

        // Map package identifier to period
        if (pkg.identifier.includes('monthly') || pkg.identifier === '$rc_monthly') {
            return 'Monthly';
        } else if (pkg.identifier.includes('annual') || pkg.identifier === '$rc_annual') {
            return 'Annual';
        } else if (pkg.identifier.includes('weekly') || pkg.identifier === '$rc_weekly') {
            return 'Weekly';
        }

        return null;
    }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
