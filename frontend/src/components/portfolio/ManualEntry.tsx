import React, { useState } from 'react';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';

interface ManualEntryProps {
    onAdd: (isin: string, assetType: string, quantity: number) => Promise<{ success: boolean; message: string }>;
}

const ManualEntry: React.FC<ManualEntryProps> = ({ onAdd }) => {
    const [isin, setIsin] = useState('');
    const [assetType, setAssetType] = useState<string>('');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateISIN = (value: string): boolean => {
        return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(value.toUpperCase());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!assetType) {
            setError('Please select an Asset Type');
            return;
        }

        if (!isin.trim()) {
            setError('ISIN is required');
            return;
        }
        if (!validateISIN(isin)) {
            setError('Invalid ISIN format. Expected: 2 letters + 9 alphanumeric + 1 digit');
            return;
        }
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Quantity must be a positive number');
            return;
        }

        setLoading(true);
        try {
            const result = await onAdd(isin.toUpperCase(), assetType, qty);
            if (result.success) {
                setSuccess(result.message);
                setIsin('');
                setQuantity('');
                setAssetType(''); // Reset to force explicit selection for next entry
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add holding');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="manual-entry-card">
            <div className="card-header">
                <Plus size={20} />
                <h3>Add Holding Manually</h3>
            </div>

            <form onSubmit={handleSubmit} className="manual-entry-form">
                <div className="form-group">
                    <label htmlFor="isin">ISIN Code</label>
                    <input
                        id="isin"
                        type="text"
                        value={isin}
                        onChange={(e) => setIsin(e.target.value.toUpperCase())}
                        placeholder="e.g., INE002A01018"
                        maxLength={12}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="assetType">Asset Type <span className="text-red-500">*</span></label>
                    <select
                        id="assetType"
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value)}
                        className={`form-select ${!assetType ? 'text-gray-500' : ''}`}
                    >
                        <option value="" disabled>Select Asset Type</option>
                        <option value="EQUITY">Equity</option>
                        <option value="MUTUAL_FUND">Mutual Fund</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="e.g., 100"
                        min="0.0001"
                        step="0.0001"
                        className="form-input"
                    />
                </div>

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <CheckCircle size={16} />
                        <span>{success}</span>
                    </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Holding'}
                </button>
            </form>
        </div>
    );
};

export default ManualEntry;
