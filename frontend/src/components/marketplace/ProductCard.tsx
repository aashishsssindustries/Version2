import { ProductRecommendation } from '../../types/marketplace';
import { Shield, TrendingUp, PiggyBank, Sparkles, Tag } from 'lucide-react';
import './ProductCard.css';

interface ProductCardProps {
    product: ProductRecommendation;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {

    const getIcon = (category: string) => {
        switch (category) {
            case 'Term Insurance': return <Shield size={24} />;
            case 'SIP': return <TrendingUp size={24} />;
            case 'Tax Saving': return <PiggyBank size={24} />;
            case 'Retirement': return <Sparkles size={24} />;
            default: return <TrendingUp size={24} />;
        }
    };

    const getRiskClass = (level: string) => {
        switch (level) {
            case 'Low': return 'risk-low';
            case 'Moderate': return 'risk-moderate';
            case 'High': return 'risk-high';
            default: return 'risk-moderate';
        }
    };

    const getCategoryClass = (category: string) => {
        switch (category) {
            case 'Term Insurance': return 'category-insurance';
            case 'SIP': return 'category-sip';
            case 'Tax Saving': return 'category-tax';
            case 'Retirement': return 'category-retirement';
            default: return 'category-general';
        }
    };

    return (
        <div className={`card product-card ${product.relevanceScore > 40 ? 'match-high' : ''}`}>
            <div className="product-card-header">
                <div className="product-icon">
                    {getIcon(product.category)}
                </div>
                <span className={`risk-badge ${getRiskClass(product.riskLevel)}`}>
                    {product.riskLevel} Risk
                </span>
            </div>

            {/* Category Badge */}
            <div className={`category-badge ${getCategoryClass(product.category)}`}>
                <Tag size={12} />
                <span>{product.category}</span>
            </div>

            <h3 className="text-lg font-bold mb-xs">{product.name}</h3>

            {/* Suitable Persona */}
            {product.suitablePersona && (
                <div className="persona-tag">
                    <span>For: {product.suitablePersona}</span>
                </div>
            )}

            {/* Why Recommended */}
            {product.matchReason && (
                <div className="match-reason">
                    <Sparkles size={14} />
                    <span>{product.matchReason}</span>
                </div>
            )}

            <p className="product-description">{product.description}</p>

            <div className="product-metrics">
                <div>
                    <span className="metric-label">Min Investment</span>
                    <span className="metric-value">₹{product.minInvestment.toLocaleString('en-IN')}</span>
                </div>
                <div>
                    <span className="metric-label">Hist. Returns</span>
                    <span className="metric-value" style={{ color: 'var(--color-success)' }}>
                        {product.returns || (
                            <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>Market Linked</span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
};
