'use client';

import { useState, useEffect } from 'react';
import { X, Download, Eye, ExternalLink, FileText, FileImage, File } from 'lucide-react';

interface ReceiptViewerProps {
    receiptUrl: string;
    fileName?: string;
    onClose: () => void;
}

export function ReceiptViewer({ receiptUrl, fileName, onClose }: ReceiptViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Extract filename from URL if not provided
    const actualFileName = fileName || receiptUrl.split('/').pop() || 'receipt';

    const isPDF = receiptUrl.toLowerCase().includes('.pdf');
    const isImage = receiptUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

    // Prevent body scroll when viewer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = receiptUrl;
        link.download = actualFileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFileIcon = () => {
        if (isPDF) return <FileText className="w-6 h-6 text-red-500" />;
        if (isImage) return <FileImage className="w-6 h-6 text-blue-500" />;
        return <File className="w-6 h-6 text-gray-500" />;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        {getFileIcon()}
                        <div>
                            <h3 className="font-semibold text-gray-900 text-lg">Receipt</h3>
                            <p className="text-sm text-gray-600 truncate max-w-xs sm:max-w-md">{actualFileName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                            aria-label="Download receipt"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Close viewer"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-auto max-h-[calc(90vh-120px)]">
                    {isPDF ? (
                        <div className="space-y-4">
                            <iframe
                                src={receiptUrl}
                                className="w-full h-[60vh] rounded-lg border border-gray-300"
                                title="Receipt PDF"
                            />
                            <div className="text-center">
                                <a
                                    href={receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open in New Tab
                                </a>
                            </div>
                        </div>
                    ) : isImage ? (
                        <div className="flex justify-center">
                            <div className="relative max-w-full">
                                <img
                                    src={receiptUrl}
                                    alt="Receipt"
                                    className="max-w-full h-auto max-h-[65vh] rounded-lg shadow-sm border border-gray-200"
                                    loading="lazy"
                                />
                                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                                    Click outside to close
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">This file type cannot be previewed.</p>
                            <button
                                onClick={handleDownload}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download File
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Receipts are stored securely in Supabase Storage
                    </p>
                </div>
            </div>
        </div>
    );
}