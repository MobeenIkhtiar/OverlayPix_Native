import { Plan } from '../types/plan';
import { revenueCatService } from './revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';

/**
 * RevenueCat Plan Adapter Service
 * Converts RevenueCat packages to your app's Plan format
 */
class RevenueCatPlanService {
    /**
     * Fetch plans from RevenueCat offerings
     * Converts RevenueCat packages to Plan objects
     */
    async getPlans(): Promise<Plan[]> {
        try {
            // Fetch offerings from RevenueCat
            const offerings = await revenueCatService.fetchOfferings();

            console.log('RevenueCat Offerings:', JSON.stringify(offerings, null, 2));

            if (!offerings) {
                return [];
            }

            // The user has configured plans as separate Offerings.
            // We need to aggregate packages from ALL available offerings, not just the 'current' duplicate one.
            const allPackages: PurchasesPackage[] = [];

            // Helper to add unique packages (avoiding duplicates if same package is in multiple offerings)
            const addedPackageIdentifiers = new Set<string>();

            // Iterate over all offerings
            if (offerings.all) {
                Object.values(offerings.all).forEach(offering => {
                    if (offering.availablePackages && offering.availablePackages.length > 0) {
                        offering.availablePackages.forEach(pkg => {
                            if (!addedPackageIdentifiers.has(pkg.identifier) && pkg.identifier !== 'starter_pass1') {
                                allPackages.push(pkg);
                                addedPackageIdentifiers.add(pkg.identifier);
                            }
                        });
                    }
                });
            }

            // Fallback: If no packages found in 'all', check 'current' specifically (though 'all' usually contains 'current')
            if (allPackages.length === 0 && offerings.current) {
                offerings.current.availablePackages.forEach(pkg => {
                    if (!addedPackageIdentifiers.has(pkg.identifier) && pkg.identifier !== 'starter_pass1') {
                        allPackages.push(pkg);
                        addedPackageIdentifiers.add(pkg.identifier);
                    }
                });
            }

            console.log(`Found ${allPackages.length} packages across all offerings.`);

            // Convert packages to Plan format
            const plans: Plan[] = allPackages.map((pkg, index) =>
                this.convertPackageToPlan(pkg, index)
            );

            // Sort plans by price to ensure logical order
            plans.sort((a, b) => a.price - b.price);

            console.log('Fetched plans from RevenueCat:', plans);
            return plans;
        } catch (error) {
            console.error('Error fetching plans from RevenueCat:', error);
            return [];
        }
    }

    /**
     * Get a specific plan by ID (package identifier)
     */
    async getPlanById(planId: string): Promise<Plan | undefined> {
        try {
            const plans = await this.getPlans();
            return plans.find(plan => plan.id === planId);
        } catch (error) {
            console.error('Error fetching plan by ID from RevenueCat:', error);
            return undefined;
        }
    }

    /**
     * Convert RevenueCat package to Plan format
     */
    private convertPackageToPlan(pkg: PurchasesPackage, index: number): Plan {
        // Extract plan details from package
        const productId = pkg.product.identifier;
        const price = pkg.product.price;
        const priceString = pkg.product.priceString;
        // Android often appends (App Name) to the product title. We remove it for cleaner display.
        const rawTitle = pkg.product.title;
        const title = rawTitle ? rawTitle.replace(/\s*\(Overlay Pix\)\s*$/i, '') : '';
        const description = pkg.product.description;

        // Parse plan details from product description or use defaults
        // You can customize this based on how you structure your RevenueCat products
        const planDetails = this.parsePlanDetails(pkg, index);

        return {
            id: pkg.identifier, // Use package identifier as plan ID
            name: title || `Plan ${index + 1}`,
            price: price,
            formattedPrice: priceString,
            basePlan: price,
            guestLimit: planDetails.guestLimit,
            photoPool: planDetails.photoPool,
            features: this.extractFeatures(description),
            storageOptions: planDetails.storageOptions,
            defaultStorageDays: planDetails.defaultStorageDays,
            guestLimitIncreasePricePerGuest: planDetails.guestLimitIncreasePricePerGuest,
            photoPoolLimitIncreasePricePerPhoto: planDetails.photoPoolLimitIncreasePricePerPhoto,
        };
    }

    /**
     * Parse plan details from package
     * You can customize this based on your RevenueCat product configuration
     */
    private parsePlanDetails(pkg: PurchasesPackage, index: number) {
        // Default values - customize based on your needs
        const defaults = {
            guestLimit: 50,
            photoPool: 100,
            storageOptions: [
                { days: 7, price: 0 },
                { days: 30, price: 5 },
                { days: 90, price: 10 },
            ],
            defaultStorageDays: 7,
            guestLimitIncreasePricePerGuest: 0.5,
            photoPoolLimitIncreasePricePerPhoto: 0.1,
        };

        const identifier = pkg.identifier.toLowerCase();

        // New Plan Mappings
        if (identifier === 'starter_event') {
            return {
                guestLimit: 25,
                photoPool: 150,
                storageOptions: [{ days: 30, price: 0 }],
                defaultStorageDays: 30,
                guestLimitIncreasePricePerGuest: 0.5,
                photoPoolLimitIncreasePricePerPhoto: 0.1,
            };
        } else if (identifier === 'classic_event') {
            return {
                guestLimit: 50,
                photoPool: 300,
                storageOptions: [{ days: 30, price: 0 }],
                defaultStorageDays: 30,
                guestLimitIncreasePricePerGuest: 0.5,
                photoPoolLimitIncreasePricePerPhoto: 0.1,
            };
        } else if (identifier === 'celebration_event') {
            return {
                guestLimit: 100,
                photoPool: 600,
                storageOptions: [{ days: 30, price: 0 }],
                defaultStorageDays: 30,
                guestLimitIncreasePricePerGuest: 0.3,
                photoPoolLimitIncreasePricePerPhoto: 0.05,
            };
        } else if (identifier === 'grand_event') {
            return {
                guestLimit: 150,
                photoPool: 1000,
                storageOptions: [{ days: 30, price: 0 }],
                defaultStorageDays: 30,
                guestLimitIncreasePricePerGuest: 0.3,
                photoPoolLimitIncreasePricePerPhoto: 0.05,
            };
        } else if (identifier === 'ultimate_event') {
            return {
                guestLimit: 250,
                photoPool: 2000,
                storageOptions: [{ days: 30, price: 0 }],
                defaultStorageDays: 30,
                guestLimitIncreasePricePerGuest: 0.2,
                photoPoolLimitIncreasePricePerPhoto: 0.03,
            };
        }

        // Fallback or legacy logic (optional, but good to keep if identifiers mismatch)
        if (identifier.includes('starter') || identifier.includes('basic')) {
            return {
                guestLimit: 25,
                photoPool: 50,
                storageOptions: [
                    { days: 7, price: 0 },
                    { days: 30, price: 3 },
                ],
                defaultStorageDays: 7,
                guestLimitIncreasePricePerGuest: 0.5,
                photoPoolLimitIncreasePricePerPhoto: 0.1,
            };
        } else if (identifier.includes('standard') || identifier.includes('pro')) {
            return {
                guestLimit: 100,
                photoPool: 200,
                storageOptions: [
                    { days: 7, price: 0 },
                    { days: 30, price: 5 },
                    { days: 90, price: 10 },
                ],
                defaultStorageDays: 30,
                guestLimitIncreasePricePerGuest: 0.3,
                photoPoolLimitIncreasePricePerPhoto: 0.05,
            };
        } else if (identifier.includes('premium') || identifier.includes('unlimited')) {
            return {
                guestLimit: 500,
                photoPool: 1000,
                storageOptions: [
                    { days: 30, price: 0 },
                    { days: 90, price: 10 },
                    { days: 365, price: 20 },
                ],
                defaultStorageDays: 90,
                guestLimitIncreasePricePerGuest: 0.2,
                photoPoolLimitIncreasePricePerPhoto: 0.03,
            };
        }

        return defaults;
    }

    /**
     * Extract features from product description
     */
    private extractFeatures(description: string): string[] {
        // Default features
        const defaultFeatures = [
            'Live photo gallery',
            'Custom branding',
            'Photo downloads',
        ];

        // You can parse the description to extract features
        // For now, return default features
        return defaultFeatures;
    }

    /**
     * Get RevenueCat package for a plan ID
     * This is used during purchase
     */
    async getPackageForPlan(planId: string): Promise<PurchasesPackage | null> {
        try {
            const offerings = await revenueCatService.fetchOfferings();

            if (!offerings?.current) {
                return null;
            }

            // Find package by identifier
            const pkg = offerings.current.availablePackages.find(
                p => p.identifier === planId
            );

            return pkg || null;
        } catch (error) {
            console.error('Error getting package for plan:', error);
            return null;
        }
    }
}

// Export singleton instance
export const revenueCatPlanService = new RevenueCatPlanService();
