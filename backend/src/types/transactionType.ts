/**
 * Transaction type enum for CAS imports
 */
export type TransactionType = 'BUY' | 'SELL' | 'SIP' | 'SWITCH_IN' | 'SWITCH_OUT' | 'DIVIDEND' | 'REDEMPTION';

/**
 * Valid transaction type values for validation
 */
export const TRANSACTION_TYPE_VALUES: TransactionType[] = [
    'BUY', 'SELL', 'SIP', 'SWITCH_IN', 'SWITCH_OUT', 'DIVIDEND', 'REDEMPTION'
];

/**
 * Check if a string is a valid transaction type
 */
export function isValidTransactionType(value: string): value is TransactionType {
    return TRANSACTION_TYPE_VALUES.includes(value as TransactionType);
}

/**
 * Map common CAS transaction descriptions to transaction types
 */
export function parseTransactionType(description: string): TransactionType | null {
    const desc = description.toUpperCase().trim();

    if (desc.includes('PURCHASE') || desc.includes('ADDITIONAL PURCHASE') || desc.includes('NEW FUND OFFER')) {
        return 'BUY';
    }
    if (desc.includes('SIP') || desc.includes('SYSTEMATIC INVESTMENT')) {
        return 'SIP';
    }
    if (desc.includes('REDEMPTION') || desc.includes('REDEEM')) {
        return 'REDEMPTION';
    }
    if (desc.includes('SWITCH IN') || desc.includes('SWITCH-IN') || desc.includes('SWITCHIN')) {
        return 'SWITCH_IN';
    }
    if (desc.includes('SWITCH OUT') || desc.includes('SWITCH-OUT') || desc.includes('SWITCHOUT')) {
        return 'SWITCH_OUT';
    }
    if (desc.includes('DIVIDEND') || desc.includes('DIV')) {
        return 'DIVIDEND';
    }
    if (desc.includes('SELL')) {
        return 'SELL';
    }

    // Default to BUY for unrecognized positive transactions
    return null;
}
