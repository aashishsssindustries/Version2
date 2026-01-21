import React, { useState, useRef } from 'react';
import { X, Edit3, FileSpreadsheet, FileText, CreditCard, Upload, Check, AlertCircle, Info } from 'lucide-react';
import './ImportPortfolioModal.css';

interface ImportPortfolioModalProps {
    onClose: () => void;
    onManualAdd: (isin: string, assetType: string, quantity: number) => Promise<{ success: boolean; message: string }>;
    onCsvUpload: (csv: string) => Promise<{ success: boolean; message: string; imported?: number; errors?: string[] }>;
    onCasUpload: (file: File, password?: string) => Promise<{ success: boolean; message: string; data?: any }>;
}

type ImportSource = 'MANUAL' | 'CSV' | 'CAS' | 'PAN';

interface ImportOption {
    id: ImportSource;
    title: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
    tooltip?: string;
}

export const ImportPortfolioModal: React.FC<ImportPortfolioModalProps> = ({
    onClose,
    onManualAdd,
    onCsvUpload,
    onCasUpload
}) => {
    const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Manual entry state
    const [manualData, setManualData] = useState({ isin: '', assetType: 'MUTUAL_FUND', quantity: '' });

    // CSV state
    const [csvContent, setCsvContent] = useState('');
    const csvFileRef = useRef<HTMLInputElement>(null);

    // CAS state
    const [casFile, setCasFile] = useState<File | null>(null);
    const [casPassword, setCasPassword] = useState('');
    const casFileRef = useRef<HTMLInputElement>(null);

    const importOptions: ImportOption[] = [
        {
            id: 'MANUAL',
            title: 'Manual Entry',
            description: 'Add a single holding by ISIN',
            icon: <Edit3 size={24} />,
            enabled: true
        },
        {
            id: 'CSV',
            title: 'CSV Upload',
            description: 'Bulk import from spreadsheet',
            icon: <FileSpreadsheet size={24} />,
            enabled: true
        },
        {
            id: 'CAS',
            title: 'CAS Upload',
            description: 'Import from CAMS/KFintech PDF',
            icon: <FileText size={24} />,
            enabled: true
        },
        {
            id: 'PAN',
            title: 'PAN Import',
            description: 'Auto-fetch via PAN card',
            icon: <CreditCard size={24} />,
            enabled: false,
            tooltip: 'Pending regulatory approval'
        }
    ];

    const handleOptionSelect = (option: ImportOption) => {
        if (!option.enabled) return;
        setSelectedSource(option.id);
        setStatus(null);
    };

    const handleBack = () => {
        setSelectedSource(null);
        setStatus(null);
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualData.isin || !manualData.quantity) {
            setStatus({ type: 'error', message: 'Please fill all fields' });
            return;
        }
        setLoading(true);
        try {
            const result = await onManualAdd(manualData.isin, manualData.assetType, parseFloat(manualData.quantity));
            if (result.success) {
                setStatus({ type: 'success', message: 'Holding added successfully!' });
                setManualData({ isin: '', assetType: 'MUTUAL_FUND', quantity: '' });
            } else {
                setStatus({ type: 'error', message: result.message });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to add holding' });
        } finally {
            setLoading(false);
        }
    };

    const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCsvContent(event.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleCsvSubmit = async () => {
        if (!csvContent.trim()) {
            setStatus({ type: 'error', message: 'Please select a CSV file or paste content' });
            return;
        }
        setLoading(true);
        try {
            const result = await onCsvUpload(csvContent);
            if (result.success || (result.imported && result.imported > 0)) {
                setStatus({ type: 'success', message: `Imported ${result.imported || 0} holdings!` });
                setCsvContent('');
            } else {
                setStatus({ type: 'error', message: result.message });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to import CSV' });
        } finally {
            setLoading(false);
        }
    };

    const handleCasFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCasFile(file);
        }
    };

    const handleCasSubmit = async () => {
        if (!casFile) {
            setStatus({ type: 'error', message: 'Please select a CAS PDF file' });
            return;
        }
        setLoading(true);
        try {
            const result = await onCasUpload(casFile, casPassword || undefined);
            if (result.success) {
                const imported = result.data?.imported || 0;
                setStatus({ type: 'success', message: `Imported ${imported} holdings from CAS!` });
                setCasFile(null);
                setCasPassword('');
            } else {
                setStatus({ type: 'error', message: result.message });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to import CAS' });
        } finally {
            setLoading(false);
        }
    };

    const renderSourceSelection = () => (
        <div className="import-options-grid">
            {importOptions.map(option => (
                <div
                    key={option.id}
                    className={`import-option-card ${!option.enabled ? 'disabled' : ''}`}
                    onClick={() => handleOptionSelect(option)}
                    title={option.tooltip}
                >
                    <div className="option-icon">{option.icon}</div>
                    <div className="option-content">
                        <h3>{option.title}</h3>
                        <p>{option.description}</p>
                    </div>
                    {!option.enabled && (
                        <div className="disabled-badge">
                            <Info size={14} />
                            <span>{option.tooltip}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderManualForm = () => (
        <form className="import-form" onSubmit={handleManualSubmit}>
            <div className="form-group">
                <label>ISIN Code</label>
                <input
                    type="text"
                    placeholder="e.g. INF200K01RJ1"
                    value={manualData.isin}
                    onChange={(e) => setManualData({ ...manualData, isin: e.target.value.toUpperCase() })}
                    maxLength={12}
                />
            </div>
            <div className="form-group">
                <label>Asset Type</label>
                <select
                    value={manualData.assetType}
                    onChange={(e) => setManualData({ ...manualData, assetType: e.target.value })}
                >
                    <option value="MUTUAL_FUND">Mutual Fund</option>
                    <option value="EQUITY">Equity</option>
                </select>
            </div>
            <div className="form-group">
                <label>Quantity / Units</label>
                <input
                    type="number"
                    placeholder="e.g. 100.5"
                    value={manualData.quantity}
                    onChange={(e) => setManualData({ ...manualData, quantity: e.target.value })}
                    step="0.0001"
                    min="0"
                />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Holding'}
            </button>
        </form>
    );

    const renderCsvForm = () => (
        <div className="import-form">
            <div className="form-group">
                <label>Upload CSV File</label>
                <input
                    type="file"
                    accept=".csv"
                    ref={csvFileRef}
                    onChange={handleCsvFileSelect}
                    className="file-input"
                />
                <button className="btn-secondary file-btn" onClick={() => csvFileRef.current?.click()}>
                    <Upload size={16} /> Choose File
                </button>
            </div>
            <div className="form-group">
                <label>Or Paste CSV Content</label>
                <textarea
                    placeholder="isin,asset_type,quantity&#10;INF200K01RJ1,MUTUAL_FUND,100"
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    rows={6}
                />
            </div>
            <div className="csv-hint">
                <Info size={14} />
                <span>CSV must have headers: isin, asset_type, quantity</span>
            </div>
            <button className="btn-submit" onClick={handleCsvSubmit} disabled={loading || !csvContent.trim()}>
                {loading ? 'Importing...' : 'Import CSV'}
            </button>
        </div>
    );

    const renderCasForm = () => (
        <div className="import-form">
            <div className="form-group">
                <label>Upload CAS PDF</label>
                <input
                    type="file"
                    accept=".pdf"
                    ref={casFileRef}
                    onChange={handleCasFileSelect}
                    className="file-input"
                />
                <button className="btn-secondary file-btn" onClick={() => casFileRef.current?.click()}>
                    <Upload size={16} /> {casFile ? casFile.name : 'Choose PDF'}
                </button>
            </div>
            <div className="form-group">
                <label>PDF Password (if encrypted)</label>
                <input
                    type="password"
                    placeholder="Leave blank if not password protected"
                    value={casPassword}
                    onChange={(e) => setCasPassword(e.target.value)}
                />
            </div>
            <div className="csv-hint">
                <Info size={14} />
                <span>Download your CAS from camsonline.com or kfintech.com</span>
            </div>
            <button className="btn-submit" onClick={handleCasSubmit} disabled={loading || !casFile}>
                {loading ? 'Importing...' : 'Import CAS'}
            </button>
        </div>
    );

    const renderSelectedForm = () => {
        switch (selectedSource) {
            case 'MANUAL':
                return renderManualForm();
            case 'CSV':
                return renderCsvForm();
            case 'CAS':
                return renderCasForm();
            default:
                return null;
        }
    };

    const selectedOption = importOptions.find(o => o.id === selectedSource);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="import-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>
                        {selectedSource ? (
                            <>
                                {selectedOption?.icon}
                                <span>{selectedOption?.title}</span>
                            </>
                        ) : (
                            'Import Portfolio'
                        )}
                    </h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Status Message */}
                {status && (
                    <div className={`status-banner ${status.type}`}>
                        {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                        <span>{status.message}</span>
                    </div>
                )}

                {/* Body */}
                <div className="modal-body">
                    {selectedSource ? renderSelectedForm() : renderSourceSelection()}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    {selectedSource ? (
                        <button className="btn-secondary" onClick={handleBack}>
                            ← Back to Options
                        </button>
                    ) : (
                        <button className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportPortfolioModal;
