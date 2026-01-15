import React, { useEffect, useState } from 'react';
import { marketplaceService } from '../services/api';
import { ProductRecommendation } from '../types/marketplace';
import { ProductCard } from '../components/marketplace/ProductCard';
import { ShoppingBag, Star, Shield, Filter } from 'lucide-react';
import './Marketplace.css';

const Marketplace: React.FC = () => {
    const [products, setProducts] = useState<ProductRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    useEffect(() => {
        fetchProducts();
    }, []);

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

    if (loading) {
        return (
            <div className="marketplace-loading">
                <p>Curating products for your profile...</p>
            </div>
        );
    }

    // Remove duplicates using Set
    const uniqueProducts = Array.from(
        new Map(products.map(p => [p.id, p])).values()
    );

    // Filter Logic
    const topPicks = uniqueProducts.filter(p => p.relevanceScore >= 50);
    const insurance = uniqueProducts.filter(p => p.category === 'Term Insurance');
    const investments = uniqueProducts.filter(p =>
        p.category === 'SIP' || p.category === 'Tax Saving' || p.category === 'Retirement'
    );
    const safe = uniqueProducts.filter(p => p.riskLevel === 'Low');

    // Filter pills data
    const filters = [
        { id: 'all', label: 'All Products', count: uniqueProducts.length },
        { id: 'recommended', label: 'Recommended for You', count: topPicks.length },
        { id: 'low-risk', label: 'Low Risk', count: safe.length },
        { id: 'tax-saving', label: 'Tax Saving', count: uniqueProducts.filter(p => p.category === 'Tax Saving').length },
        { id: 'long-term', label: 'Long Term', count: uniqueProducts.filter(p => p.tags.includes('long-term') || p.category === 'Retirement').length }
    ];

    return (
        <div className="marketplace-container">
            <div className="marketplace-header">
                <h1>Marketplace</h1>
                <p className="marketplace-subtitle">
                    Curated financial products tailored to your persona and risk profile.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {/* Filter Pills */}
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

            {/* Top Picks Section */}
            {topPicks.length > 0 && (
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

            {/* Insurance Protection Section */}
            {insurance.length > 0 && (
                <>
                    <h2 className="section-title mt-2xl">
                        <Shield className="text-primary" size={24} />
                        Insurance Protection
                    </h2>
                    <div className="product-grid">
                        {insurance.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </>
            )}

            {/* Wealth Creation Section */}
            {investments.length > 0 && (
                <>
                    <h2 className="section-title mt-2xl">
                        <ShoppingBag className="text-success" size={24} />
                        Wealth Creation
                    </h2>
                    <div className="product-grid">
                        {investments.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Marketplace;
