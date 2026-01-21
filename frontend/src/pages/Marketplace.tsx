import React, { useEffect, useState } from 'react';
import { marketplaceService } from '../services/api';
import { ProductRecommendation } from '../types/marketplace';
import { ProductCard } from '../components/marketplace/ProductCard';
import { Star, Filter } from 'lucide-react';
import './Marketplace.css';

const Marketplace: React.FC = () => {
    const [products, setProducts] = useState<ProductRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            handleSearch();
        } else if (searchQuery.length === 0) {
            setIsSearchMode(false);
            fetchProducts();
        }
    }, [searchQuery]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getRecommendations();
            setProducts(data);
        } catch (err) {
            console.error('Failed to load marketplace', err);
            setError('Failed to load product recommendations');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            setIsSearchMode(true);
            const results = await marketplaceService.searchProducts(searchQuery);
            setProducts(results);
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="marketplace-loading">
                <p>{isSearchMode ? 'Searching catalog...' : 'Curating products for your profile...'}</p>
            </div>
        );
    }

    // Remove duplicates using Set
    const uniqueProducts = Array.from(
        new Map(products.map(p => [p.id, p])).values()
    );

    // Filter Logic
    const topPicks = uniqueProducts.filter(p => p.relevanceScore >= 50);
    // const safe = uniqueProducts.filter(p => p.riskLevel === 'Low'); // Unused

    // Filter pills data
    const filters = [
        { id: 'all', label: 'All Products', count: uniqueProducts.length },
        { id: 'recommended', label: 'Recommended for You', count: topPicks.length },
        { id: 'low-risk', label: 'Low Risk', count: uniqueProducts.filter(p => p.riskLevel === 'Low').length },
        { id: 'tax-saving', label: 'Tax Saving', count: uniqueProducts.filter(p => p.category === 'Tax Saving').length },
        { id: 'long-term', label: 'Long Term', count: uniqueProducts.filter(p => p.tags.includes('long-term') || p.category === 'Retirement').length }
    ];

    return (
        <div className="marketplace-container">
            <div className="marketplace-header">
                <h1>Marketplace</h1>
                <p className="marketplace-subtitle">
                    {isSearchMode
                        ? `Found ${uniqueProducts.length} results for "${searchQuery}"`
                        : 'Curated financial products tailored to your persona and risk profile.'
                    }
                </p>

                {/* Search Bar */}
                <div className="marketplace-search">
                    <input
                        type="text"
                        placeholder="Search by name, ISIN, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {/* Filter Pills */}
            {!isSearchMode && (
                <div className="filter-pills">
                    <div className="filter-icon">
                        <Filter size={18} />
                        <span>Filter:</span>
                    </div>
                    {filters.map(filter => (
                        <button
                            key={filter.id}
                            className={`filter-pill ${activeFilter === filter.id ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            {filter.label}
                            <span className="filter-count">{filter.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* If Search Mode or 'All' filter, show simple grid */}
            {(isSearchMode || activeFilter === 'all') && (
                <div className="product-grid mt-2xl">
                    {uniqueProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {/* Top Picks Section - Only show when NOT searching and 'recommended' or default view */}
            {!isSearchMode && activeFilter === 'recommended' && topPicks.length > 0 && (
                <>
                    <h2 className="section-title">
                        <Star className="text-warning" size={24} />
                        Top Recommendations
                    </h2>
                    <div className="product-grid">
                        {topPicks.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </>
            )}

            {/* Specific Category Filters */}
            {!isSearchMode && activeFilter === 'tax-saving' && (
                <div className="product-grid mt-2xl">
                    {uniqueProducts.filter(p => p.category === 'Tax Saving').map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {!isSearchMode && activeFilter === 'low-risk' && (
                <div className="product-grid mt-2xl">
                    {uniqueProducts.filter(p => p.riskLevel === 'Low').map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {!isSearchMode && activeFilter === 'long-term' && (
                <div className="product-grid mt-2xl">
                    {uniqueProducts.filter(p => p.tags.includes('long-term')).map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {/* Default View Sections (when activeFilter is something else but handled by logic above, or if we want to show categorized view) */}
            {/* The logic above simplifies the view. Only 'all' shows everything flat. */}

            {/* Show categorized sections only on initial load or if user hasn't selected specific filter? 
                Current logic: 
                - isSearchMode -> flat list
                - activeFilter==='all' -> flat list (all)
                - activeFilter==='recommended' -> recommended
                - etc.
                
                Actually the original code showed sections. Let's restore section view if filter is 'all' but organized?
                No, 'all' usually means flat list.
                Let's stick to the conditional rendering.
            */}
        </div>
    );
};

export default Marketplace;
