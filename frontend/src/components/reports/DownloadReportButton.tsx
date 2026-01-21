import React, { useState } from 'react';
import { Download, X, Loader2, AlertCircle } from 'lucide-react';
import './DownloadReportButton.css';
import './DownloadReportButton.css';

interface DownloadReportButtonProps {
    className?: string;
    disabled?: boolean;
    flowStatus: {
        canDownloadReport: boolean;
        message?: string;
    };
}

export const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({
    className,
    disabled,
    flowStatus
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // White-label form state
    const [branding, setBranding] = useState({
        companyName: '',
        tagline: '',
        primaryColor: '#1a56db'
    });

    const handleOpenModal = () => {
        if (flowStatus.canDownloadReport && !disabled) {
            setIsModalOpen(true);
            setError(null);
        }
    };

    const handleDownload = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build V3 URL with query params
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
            const queryParams = new URLSearchParams();

            // Allow empty company name to fall back to default "WealthMax"
            if (branding.companyName) {
                queryParams.append('company_name', branding.companyName);
            }
            if (branding.tagline) {
                queryParams.append('tagline', branding.tagline);
            }
            queryParams.append('primary_color', branding.primaryColor);

            const queryString = queryParams.toString();
            const url = `${baseUrl}/pdf/advisory-report-v3${queryString ? `?${queryString}` : ''}`;

            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to generate PDF');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const filename = branding.companyName
                ? `${branding.companyName.replace(/\s+/g, '_')}_Advisory_Report.pdf`
                : `WealthMax_Advisory_Report.pdf`;

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            setIsModalOpen(false); // Close on success

        } catch (err: any) {
            console.error('Download error:', err);
            setError(err.message || 'Failed to download report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                className={`download-btn flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
                onClick={handleOpenModal}
                disabled={disabled || !flowStatus.canDownloadReport}
                title={!flowStatus.canDownloadReport ? flowStatus.message : 'Download Advisory Report'}
            >
                <Download size={18} />
                Download Report
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Download Advisory Report</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <p className="text-sm text-gray-600">
                                Generate a comprehensive white-labeled advisory report. Customize the branding details below.
                            </p>

                            {/* White-label Form */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Company Name</label>
                                    <input
                                        type="text"
                                        value={branding.companyName}
                                        onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                                        placeholder="Ex: Acme Wealth (Defaults to WealthMax)"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Tagline (Optional)</label>
                                    <input
                                        type="text"
                                        value={branding.tagline}
                                        onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                                        placeholder="Ex: Your Trusted Partner"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
