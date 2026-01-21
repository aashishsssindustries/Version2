/**
 * Sync status for portfolio imports
 */
export type SyncStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

/**
 * Valid sync status values
 */
export const SYNC_STATUS_VALUES: SyncStatus[] = ['SUCCESS', 'PARTIAL', 'FAILED'];

/**
 * Check if a string is a valid sync status
 */
export function isValidSyncStatus(value: string): value is SyncStatus {
    return SYNC_STATUS_VALUES.includes(value as SyncStatus);
}
