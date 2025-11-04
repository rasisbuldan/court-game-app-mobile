/**
 * RevenueCat Service
 *
 * Handles in-app purchase integration using RevenueCat SDK.
 * Supports iOS and Android with App Store and Google Play.
 */

import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { Logger } from '../utils/logger';
import type { SubscriptionTier } from '../hooks/useSubscription';

// ============================================================================
// Constants
// ============================================================================

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Entitlement identifiers (configured in RevenueCat dashboard)
export const ENTITLEMENTS = {
  PERSONAL: 'personal',
  CLUB: 'club',
} as const;

// Offering identifiers (configured in RevenueCat dashboard)
export const OFFERING_IDS = {
  DEFAULT: 'default',
  PERSONAL_MONTHLY: 'personal_monthly',
  PERSONAL_YEARLY: 'personal_yearly',
  CLUB_MONTHLY: 'club_monthly',
  CLUB_YEARLY: 'club_yearly',
} as const;

// ============================================================================
// Initialization
// ============================================================================

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts (after user is authenticated)
 */
export async function initializeRevenueCat(userId: string): Promise<void> {
  if (isInitialized) {
    Logger.debug('RevenueCat already initialized', { userId });
    return;
  }

  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

    if (!apiKey) {
      throw new Error(
        `RevenueCat API key not found for platform: ${Platform.OS}. Please add EXPO_PUBLIC_REVENUECAT_${Platform.OS.toUpperCase()}_KEY to .env`
      );
    }

    // Configure SDK
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

    // Initialize with user ID
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    isInitialized = true;

    Logger.info('RevenueCat initialized successfully', {
      action: 'revenuecat_init',
      metadata: { userId, platform: Platform.OS },
    });
  } catch (error) {
    Logger.error('RevenueCat: Failed to initialize', error as Error, {
      action: 'revenuecat_init_error',
      metadata: { userId, platform: Platform.OS },
    });
    throw error;
  }
}

/**
 * Check if RevenueCat is initialized
 */
export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

// ============================================================================
// Customer Info
// ============================================================================

/**
 * Get current customer info (active subscriptions, entitlements)
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();

    Logger.debug('RevenueCat: Customer info fetched', {
      entitlements: Object.keys(customerInfo.entitlements.active),
    });

    return customerInfo;
  } catch (error) {
    Logger.error('RevenueCat: Failed to get customer info', error as Error, {
      action: 'get_customer_info',
    });
    throw error;
  }
}

/**
 * Get subscription tier from customer info
 */
export function getSubscriptionTierFromCustomerInfo(customerInfo: CustomerInfo): SubscriptionTier {
  const activeEntitlements = customerInfo.entitlements.active;

  // Check for club subscription (higher tier)
  if (ENTITLEMENTS.CLUB in activeEntitlements) {
    return 'club';
  }

  // Check for personal subscription
  if (ENTITLEMENTS.PERSONAL in activeEntitlements) {
    return 'personal';
  }

  // Default to free
  return 'free';
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(customerInfo: CustomerInfo): boolean {
  return Object.keys(customerInfo.entitlements.active).length > 0;
}

// ============================================================================
// Offerings & Packages
// ============================================================================

/**
 * Get available offerings (subscription plans)
 */
export async function getOfferings(): Promise<PurchasesOffering[]> {
  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      Logger.warn('RevenueCat: No current offering available', {
        action: 'get_offerings',
      });
      return [];
    }

    Logger.info('RevenueCat: Offerings fetched', {
      action: 'get_offerings',
      metadata: {
        offeringId: offerings.current.identifier,
        packagesCount: offerings.current.availablePackages.length,
      },
    });

    // Return all offerings (current + others)
    return [offerings.current, ...Object.values(offerings.all)];
  } catch (error) {
    Logger.error('RevenueCat: Failed to get offerings', error as Error, {
      action: 'get_offerings',
    });
    throw error;
  }
}

/**
 * Get specific package by identifier
 */
export async function getPackage(packageIdentifier: string): Promise<PurchasesPackage | null> {
  try {
    const offerings = await getOfferings();

    for (const offering of offerings) {
      const pkg = offering.availablePackages.find(
        (p) => p.identifier === packageIdentifier
      );
      if (pkg) {
        return pkg;
      }
    }

    Logger.warn('RevenueCat: Package not found', {
      action: 'get_package',
      metadata: { packageIdentifier },
    });

    return null;
  } catch (error) {
    Logger.error('RevenueCat: Failed to get package', error as Error, {
      action: 'get_package',
      metadata: { packageIdentifier },
    });
    throw error;
  }
}

// ============================================================================
// Purchase Flow
// ============================================================================

/**
 * Purchase a package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo; userCancelled: boolean }> {
  try {
    Logger.info('RevenueCat: Starting purchase', {
      action: 'purchase_start',
      metadata: {
        packageId: pkg.identifier,
        productId: pkg.product.identifier,
      },
    });

    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);

    Logger.info('RevenueCat: Purchase successful', {
      action: 'purchase_success',
      metadata: {
        packageId: pkg.identifier,
        productId: productIdentifier,
        tier: getSubscriptionTierFromCustomerInfo(customerInfo),
      },
    });

    return { customerInfo, userCancelled: false };
  } catch (error: any) {
    // User cancelled
    if (error.userCancelled) {
      Logger.info('RevenueCat: User cancelled purchase', {
        action: 'purchase_cancelled',
        metadata: { packageId: pkg.identifier },
      });
      return { customerInfo: await getCustomerInfo(), userCancelled: true };
    }

    // Other error
    Logger.error('RevenueCat: Purchase failed', error as Error, {
      action: 'purchase_error',
      metadata: {
        packageId: pkg.identifier,
        errorCode: error.code,
        errorMessage: error.message,
      },
    });

    throw error;
  }
}

/**
 * Restore purchases (for users who reinstalled or switched devices)
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    Logger.info('RevenueCat: Restoring purchases', {
      action: 'restore_purchases_start',
    });

    const customerInfo = await Purchases.restorePurchases();

    Logger.info('RevenueCat: Purchases restored', {
      action: 'restore_purchases_success',
      metadata: {
        tier: getSubscriptionTierFromCustomerInfo(customerInfo),
        hasActiveSubscription: hasActiveSubscription(customerInfo),
      },
    });

    return customerInfo;
  } catch (error) {
    Logger.error('RevenueCat: Failed to restore purchases', error as Error, {
      action: 'restore_purchases_error',
    });
    throw error;
  }
}

// ============================================================================
// User Management
// ============================================================================

/**
 * Set user attributes (for analytics and targeting)
 */
export async function setUserAttributes(attributes: Record<string, string | null>): Promise<void> {
  try {
    await Purchases.setAttributes(attributes);

    Logger.debug('RevenueCat: User attributes set', {
      attributes: Object.keys(attributes),
    });
  } catch (error) {
    Logger.error('RevenueCat: Failed to set user attributes', error as Error, {
      action: 'set_user_attributes',
    });
  }
}

/**
 * Log out user (clear cached data)
 */
export async function logoutRevenueCat(): Promise<void> {
  try {
    const customerInfo = await Purchases.logOut();

    isInitialized = false;

    Logger.info('RevenueCat: User logged out', {
      action: 'revenuecat_logout',
    });
  } catch (error) {
    Logger.error('RevenueCat: Failed to log out', error as Error, {
      action: 'revenuecat_logout_error',
    });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format price for display
 */
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get subscription period description
 */
export function getSubscriptionPeriod(pkg: PurchasesPackage): string {
  const { subscriptionPeriod } = pkg.product;

  if (!subscriptionPeriod) {
    return 'One-time purchase';
  }

  const unit = subscriptionPeriod.unit;
  const numberOfUnits = subscriptionPeriod.numberOfUnits;

  const unitMap: Record<string, string> = {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
  };

  const unitStr = unitMap[unit] || unit.toLowerCase();
  return numberOfUnits === 1 ? unitStr : `${numberOfUnits} ${unitStr}s`;
}
