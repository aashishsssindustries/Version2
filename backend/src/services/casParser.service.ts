// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import logger from '../config/logger';
import { TransactionType, parseTransactionType } from '../types/transactionType';

/**
 * Parsed holding from CAS PDF
 */
export interface CASHolding {
    isin: string;
    schemeName: string;
    units: number;
    nav?: number;
    value?: number;
    folio?: string;
}

/**
 * Parsed transaction from CAS PDF
 */
export interface CASTransaction {
    isin: string;
    schemeName: string;
    transactionDate: Date;
    transactionType: TransactionType;
    units: number;
    amount: number;
    nav?: number;
    folio?: string;
    description?: string;
}

/**
 * Result of CAS PDF parsing
 */
export interface CASParseResult {
    success: boolean;
    holdings: CASHolding[];
    transactions: CASTransaction[];
    errors: string[];
    totalHoldingsFound: number;
    totalTransactionsFound: number;
}

// ISIN pattern for Indian securities: INF followed by 9 alphanumeric characters
const ISIN_PATTERN = /\b(INF[A-Z0-9]{9})\b/g;

// Pattern to extract units (decimal number)
const UNITS_PATTERN = /(\d{1,10}(?:\.\d{1,4})?)\s*(?:units?|Units?)?/i;

// Pattern to extract NAV
const NAV_PATTERN = /(?:NAV|Nav)\s*[:\s]*(?:Rs\.?\s*)?(\d+(?:\.\d{1,4})?)/i;

// Pattern to extract current value
const VALUE_PATTERN = /(?:Value|Current\s*Value|Market\s*Value)\s*[:\s]*(?:Rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i;

// Pattern to extract folio number
const FOLIO_PATTERN = /(?:Folio\s*(?:No\.?)?|Folio:)\s*([A-Z0-9\/\-]+)/i;

// Month mapping for date parsing
const MONTH_MAP: { [key: string]: number } = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
};

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date | null {
    // Try DD-MMM-YYYY
    const match1 = dateStr.match(/(\d{2})-([A-Za-z]{3})-(\d{4})/);
    if (match1) {
        const month = MONTH_MAP[match1[2].toLowerCase()];
        if (month !== undefined) {
            return new Date(parseInt(match1[3]), month, parseInt(match1[1]));
        }
    }

    // Try DD/MM/YYYY or DD-MM-YYYY
    const match2 = dateStr.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
    if (match2) {
        return new Date(parseInt(match2[3]), parseInt(match2[2]) - 1, parseInt(match2[1]));
    }

    return null;
}

/**
 * Parse CAS PDF and extract mutual fund holdings and transactions
 */
export async function parseCASPdf(buffer: Buffer, password?: string): Promise<CASParseResult> {
    const errors: string[] = [];
    const holdings: CASHolding[] = [];
    const transactions: CASTransaction[] = [];

    try {
        // Parse PDF with optional password
        const options: any = {};
        if (password) {
            options.password = password;
        }

        const pdfData = await pdfParse(buffer, options);
        const text = pdfData.text;

        logger.info('CAS PDF parsed', { pages: pdfData.numpages, textLength: text.length });

        // Extract holdings from text
        const extractedHoldings = extractHoldingsFromText(text);

        if (extractedHoldings.length === 0) {
            errors.push('No mutual fund holdings (ISINs) found in the CAS PDF');
        }

        // Process holdings
        for (const holding of extractedHoldings) {
            if (holding.units > 0) {
                holdings.push(holding);
            } else {
                errors.push(`Skipped ${holding.isin}: Invalid or zero units`);
            }
        }

        // Extract transactions from text
        const extractedTransactions = extractTransactionsFromText(text, extractedHoldings);

        for (const txn of extractedTransactions) {
            if (txn.units !== 0 && txn.amount !== 0) {
                transactions.push(txn);
            }
        }

        logger.info('CAS extraction complete', {
            holdings: holdings.length,
            transactions: transactions.length
        });

        return {
            success: holdings.length > 0 || transactions.length > 0,
            holdings,
            transactions,
            errors,
            totalHoldingsFound: extractedHoldings.length,
            totalTransactionsFound: extractedTransactions.length
        };

    } catch (error: any) {
        logger.error('CAS PDF parsing error', error);

        // Handle specific PDF errors
        if (error.message?.includes('password')) {
            errors.push('PDF is password protected. Please provide the correct password.');
        } else if (error.message?.includes('Invalid PDF')) {
            errors.push('Invalid or corrupted PDF file');
        } else {
            errors.push(`PDF parsing failed: ${error.message}`);
        }

        return {
            success: false,
            holdings: [],
            transactions: [],
            errors,
            totalHoldingsFound: 0,
            totalTransactionsFound: 0
        };
    }
}

/**
 * Extract holdings from PDF text content
 */
function extractHoldingsFromText(text: string): CASHolding[] {
    const holdings: CASHolding[] = [];
    const seenIsins = new Set<string>();

    // Split text into sections for better context extraction
    const sections = text.split(/\n{2,}/);

    // Find all ISINs in the text
    const isinMatches = text.match(ISIN_PATTERN) || [];
    const uniqueIsins = [...new Set(isinMatches)];

    logger.info(`Found ${uniqueIsins.length} unique ISINs in CAS`);

    for (const isin of uniqueIsins) {
        if (seenIsins.has(isin)) continue;
        seenIsins.add(isin);

        // Find the section containing this ISIN
        const relevantSection = sections.find(s => s.includes(isin)) || '';

        // Extract scheme name
        const schemeName = extractSchemeName(relevantSection, isin);

        // Extract units
        const unitsMatch = relevantSection.match(UNITS_PATTERN);
        const units = unitsMatch ? parseFloat(unitsMatch[1].replace(/,/g, '')) : 0;

        // Extract NAV
        const navMatch = relevantSection.match(NAV_PATTERN);
        const nav = navMatch ? parseFloat(navMatch[1].replace(/,/g, '')) : undefined;

        // Extract value
        const valueMatch = relevantSection.match(VALUE_PATTERN);
        const value = valueMatch ? parseFloat(valueMatch[1].replace(/,/g, '')) : undefined;

        // Extract folio
        const folioMatch = relevantSection.match(FOLIO_PATTERN);
        const folio = folioMatch ? folioMatch[1] : undefined;

        holdings.push({
            isin,
            schemeName: schemeName || `Mutual Fund (${isin})`,
            units,
            nav,
            value,
            folio
        });
    }

    return holdings;
}

/**
 * Extract transactions from PDF text content
 */
function extractTransactionsFromText(text: string, holdings: CASHolding[]): CASTransaction[] {
    const transactions: CASTransaction[] = [];

    // Build ISIN to scheme mapping
    const isinToScheme = new Map<string, { name: string; folio?: string }>();
    for (const h of holdings) {
        isinToScheme.set(h.isin, { name: h.schemeName, folio: h.folio });
    }

    // Split text into lines for transaction parsing
    const lines = text.split('\n');
    let currentIsin: string | null = null;
    let currentScheme: string | null = null;
    let currentFolio: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check if line contains an ISIN - update current context
        const isinMatch = line.match(ISIN_PATTERN);
        if (isinMatch) {
            currentIsin = isinMatch[1];
            const schemeInfo = isinToScheme.get(currentIsin);
            currentScheme = schemeInfo?.name || null;
            currentFolio = schemeInfo?.folio || null;
        }

        // Check for folio number
        const folioMatch = line.match(FOLIO_PATTERN);
        if (folioMatch) {
            currentFolio = folioMatch[1];
        }

        // Skip if we don't have a current ISIN context
        if (!currentIsin) continue;

        // Try to parse transaction from line
        const transaction = parseTransactionLine(line, currentIsin, currentScheme, currentFolio);
        if (transaction) {
            transactions.push(transaction);
        }
    }

    logger.info(`Extracted ${transactions.length} transactions from CAS`);
    return transactions;
}

/**
 * Parse a single transaction line
 */
function parseTransactionLine(
    line: string,
    isin: string,
    schemeName: string | null,
    folio: string | null
): CASTransaction | null {
    // Pattern: Date Description Amount Units NAV
    // Example: 15-Jan-2024 Purchase 10,000.00 100.5000 99.50

    // Try standard CAS format
    const standardMatch = line.match(
        /^(\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{3,4})\s+([\d,]+\.\d{2,4})$/
    );

    if (standardMatch) {
        const date = parseDate(standardMatch[1]);
        if (!date) return null;

        const description = standardMatch[2].trim();
        const amount = parseFloat(standardMatch[3].replace(/,/g, ''));
        const units = parseFloat(standardMatch[4].replace(/,/g, ''));
        const nav = parseFloat(standardMatch[5].replace(/,/g, ''));

        const transactionType = parseTransactionType(description);
        if (!transactionType) return null;

        return {
            isin,
            schemeName: schemeName || `Mutual Fund (${isin})`,
            transactionDate: date,
            transactionType,
            units: Math.abs(units),
            amount: Math.abs(amount),
            nav,
            folio: folio || undefined,
            description
        };
    }

    // Try alternative format: DD/MM/YYYY or DD-MM-YYYY
    const altMatch = line.match(
        /^(\d{2}[\/-]\d{2}[\/-]\d{4})\s+(.+?)\s+(-?[\d,]+\.\d{2})\s+(-?[\d,]+\.\d{3,4})(?:\s+([\d,]+\.\d{2,4}))?$/
    );

    if (altMatch) {
        const date = parseDate(altMatch[1]);
        if (!date) return null;

        const description = altMatch[2].trim();
        const amount = parseFloat(altMatch[3].replace(/,/g, ''));
        const units = parseFloat(altMatch[4].replace(/,/g, ''));
        const nav = altMatch[5] ? parseFloat(altMatch[5].replace(/,/g, '')) : undefined;

        const transactionType = parseTransactionType(description);
        if (!transactionType) return null;

        return {
            isin,
            schemeName: schemeName || `Mutual Fund (${isin})`,
            transactionDate: date,
            transactionType,
            units: Math.abs(units),
            amount: Math.abs(amount),
            nav,
            folio: folio || undefined,
            description
        };
    }

    // Try simplified format: Date Type Amount Units
    const simpleMatch = line.match(
        /^(\d{2}-[A-Za-z]{3}-\d{4})\s+(Purchase|Redemption|SIP|Switch\s*In|Switch\s*Out|Dividend)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{3,4})/i
    );

    if (simpleMatch) {
        const date = parseDate(simpleMatch[1]);
        if (!date) return null;

        const description = simpleMatch[2].trim();
        const amount = parseFloat(simpleMatch[3].replace(/,/g, ''));
        const units = parseFloat(simpleMatch[4].replace(/,/g, ''));

        const transactionType = parseTransactionType(description);
        if (!transactionType) return null;

        return {
            isin,
            schemeName: schemeName || `Mutual Fund (${isin})`,
            transactionDate: date,
            transactionType,
            units: Math.abs(units),
            amount: Math.abs(amount),
            folio: folio || undefined,
            description
        };
    }

    return null;
}

/**
 * Extract scheme name from text near ISIN
 */
function extractSchemeName(text: string, isin: string): string {
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(isin)) {
            // Check current line for scheme name before ISIN
            const beforeIsin = lines[i].split(isin)[0].trim();
            if (beforeIsin.length > 10) {
                return cleanSchemeName(beforeIsin);
            }

            // Check previous lines for scheme name
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const prevLine = lines[j].trim();
                if (prevLine.length > 10 && !prevLine.match(/^\d/) && !prevLine.match(/^Folio/i)) {
                    return cleanSchemeName(prevLine);
                }
            }
        }
    }

    return '';
}

/**
 * Clean up scheme name
 */
function cleanSchemeName(name: string): string {
    return name
        .replace(/\s+/g, ' ')
        .replace(/^[-–—\s]+/, '')
        .replace(/[-–—\s]+$/, '')
        .trim()
        .substring(0, 200);
}

export default { parseCASPdf };
