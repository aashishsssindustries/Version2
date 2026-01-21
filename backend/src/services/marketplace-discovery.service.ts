/**
 * Marketplace Discovery Service
 * 
 * Read-only product catalog browsing with search and filtering.
 * No payments, mandates, or execution - discovery only.
 */

import { MARKETPLACE_PRODUCTS } from '../data/products';
import {
    Product,
    ProductCategory,
    RiskLevel,
    AssetClass,
    CatalogFilters,
    CategoryInfo,
    FilterOptions
} from '../types/marketplace';

const CATEGORY_DESCRIPTIONS: Record<ProductCategory, string> = {
    'SIP': 'Systematic Investment Plans & Mutual Funds',
    'Term Insurance': 'Life protection for your family',
    'Tax Saving': 'Save tax under Section 80C',
    'Retirement': 'Plan for your golden years',
    'General': 'Other investment options'
};

export class MarketplaceDiscoveryService {

    /**
     * Get full product catalog with optional filters
     */
    static getCatalog(filters?: CatalogFilters): Product[] {
        let products = [...MARKETPLACE_PRODUCTS];

        if (!filters) return products;

        // Filter by category
        if (filters.category) {
            products = products.filter(p => p.category === filters.category);
        }

        // Filter by risk level
        if (filters.riskLevel) {
            products = products.filter(p => p.riskLevel === filters.riskLevel);
        }

        // Filter by asset class
        if (filters.assetClass) {
            products = products.filter(p => p.assetClass === filters.assetClass);
        }

        // Filter by fund house
        if (filters.fundHouse) {
            products = products.filter(p =>
                p.fundHouse?.toLowerCase() === filters.fundHouse?.toLowerCase()
            );
        }

        // Filter by max investment amount
        if (filters.minInvestmentMax !== undefined) {
            products = products.filter(p =>
                (p.minInvestment || 0) <= filters.minInvestmentMax!
            );
        }

        // Filter by tags (product must have at least one matching tag)
        if (filters.tags && filters.tags.length > 0) {
            const lowerTags = filters.tags.map(t => t.toLowerCase());
            products = products.filter(p =>
                p.tags.some(tag => lowerTags.includes(tag.toLowerCase()))
            );
        }

        return products;
    }

    /**
     * Get single product by ID
     */
    static getProductById(id: string): Product | null {
        return MARKETPLACE_PRODUCTS.find(p => p.id === id) || null;
    }

    /**
     * Get product by ISIN code
     */
    static getProductByIsin(isin: string): Product | null {
        const upperIsin = isin.toUpperCase();
        return MARKETPLACE_PRODUCTS.find(p =>
            p.isin?.toUpperCase() === upperIsin
        ) || null;
    }

    /**
     * Search products by name, ISIN, description, or tags
     */
    static searchProducts(query: string): Product[] {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const lowerQuery = query.toLowerCase().trim();

        return MARKETPLACE_PRODUCTS.filter(p => {
            // Search in name
            if (p.name.toLowerCase().includes(lowerQuery)) return true;

            // Search in description
            if (p.description.toLowerCase().includes(lowerQuery)) return true;

            // Search in ISIN
            if (p.isin?.toLowerCase().includes(lowerQuery)) return true;

            // Search in scheme code
            if (p.schemeCode?.includes(lowerQuery)) return true;

            // Search in fund house
            if (p.fundHouse?.toLowerCase().includes(lowerQuery)) return true;

            // Search in tags
            if (p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;

            // Search in category
            if (p.category.toLowerCase().includes(lowerQuery)) return true;

            return false;
        });
    }

    /**
     * Get available categories with product counts
     */
    static getCategories(): CategoryInfo[] {
        const categoryMap = new Map<ProductCategory, number>();

        MARKETPLACE_PRODUCTS.forEach(p => {
            categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
        });

        return Array.from(categoryMap.entries()).map(([name, count]) => ({
            name,
            count,
            description: CATEGORY_DESCRIPTIONS[name] || name
        }));
    }

    /**
     * Get all available filter options for UI dropdowns
     */
    static getFilterOptions(): FilterOptions {
        const categories = new Set<ProductCategory>();
        const riskLevels = new Set<RiskLevel>();
        const assetClasses = new Set<AssetClass>();
        const fundHouses = new Set<string>();
        const tags = new Set<string>();

        MARKETPLACE_PRODUCTS.forEach(p => {
            categories.add(p.category);
            riskLevels.add(p.riskLevel);
            if (p.assetClass) assetClasses.add(p.assetClass);
            if (p.fundHouse) fundHouses.add(p.fundHouse);
            p.tags.forEach(t => tags.add(t));
        });

        return {
            categories: Array.from(categories),
            riskLevels: Array.from(riskLevels),
            assetClasses: Array.from(assetClasses),
            fundHouses: Array.from(fundHouses).sort(),
            tags: Array.from(tags).sort()
        };
    }

    /**
     * Get products grouped by category
     */
    static getProductsByCategory(): Record<ProductCategory, Product[]> {
        const grouped: Partial<Record<ProductCategory, Product[]>> = {};

        MARKETPLACE_PRODUCTS.forEach(p => {
            if (!grouped[p.category]) {
                grouped[p.category] = [];
            }
            grouped[p.category]!.push(p);
        });

        return grouped as Record<ProductCategory, Product[]>;
    }
}
