// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import logger from '../config/logger';

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
 * Result of CAS PDF parsing
 */
export interface CASParseResult {
    success: boolean;
    holdings: CASHolding[];
    errors: string[];
    totalFound: number;
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

/**
 * Parse CAS PDF and extract mutual fund holdings
 */
export async function parseCASPdf(buffer: Buffer, password?: string): Promise<CASParseResult> {
    const errors: string[] = [];
    const holdings: CASHolding[] = [];

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
            return {
                success: false,
                holdings: [],
                errors,
                totalFound: 0
            };
        }

        // Process each extracted holding
        for (const holding of extractedHoldings) {
            if (holding.units > 0) {
                holdings.push(holding);
            } else {
                errors.push(`Skipped ${holding.isin}: Invalid or zero units`);
            }
        }

        return {
            success: holdings.length > 0,
            holdings,
            errors,
            totalFound: extractedHoldings.length
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
            errors,
            totalFound: 0
        };
    }
}

/**
 * Extract holdings from PDF text content
 * Uses regex patterns to find ISINs and associated data
 */
function extractHoldingsFromText(text: string): CASHolding[] {
    const holdings: CASHolding[] = [];
    const seenIsins = new Set<string>();

    // Split text into sections/paragraphs for better context extraction
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

        // Try to extract scheme name (text before ISIN on same line or nearby)
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
 * Extract scheme name from text near ISIN
 */
function extractSchemeName(text: string, isin: string): string {
    // Find lines containing or near the ISIN
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
        .substring(0, 200); // Limit length
}

export default { parseCASPdf };
