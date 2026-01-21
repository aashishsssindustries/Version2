/**
 * Enum representing the source/origin of a portfolio holding.
 * Used to track how each holding was imported into the system.
 */
export type HoldingSource = 'MANUAL' | 'CSV' | 'CAS' | 'PAN';

/**
 * Valid holding source values for validation
 */
export const HOLDING_SOURCE_VALUES: HoldingSource[] = ['MANUAL', 'CSV', 'CAS', 'PAN'];

/**
 * Default source for holdings when not specified (backward compatibility)
 */
export const DEFAULT_HOLDING_SOURCE: HoldingSource = 'MANUAL';

/**
 * Check if a string is a valid holding source
 */
export function isValidHoldingSource(value: string): value is HoldingSource {
    return HOLDING_SOURCE_VALUES.includes(value as HoldingSource);
}
