'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingDown, DollarSign, Calendar, FileText, Tag, Store, Paperclip, CheckCircle, Upload } from 'lucide-react';
import { validateFile } from '@/lib/fileValidation';


export default function AddExpensePage() {
    const user = useSupabaseUser();
    const router = useRouter();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [description, setDescription] = useState('');
    const [vendor, setVendor] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const commonCategories = ['Advertising and Promotion', 'Business Meals', 'Use of Car', 'Business Travel', 'Home Office', 'Professional Services and Legal Fees', 'Office Supplies', 'Utilities', 'Travel', 'Software', 'Cybersecurity', 'Event sponsorships', 'Other'];

    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    }, []);

    const handleReceiptChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            const validation = validateFile(file, 5);

            if (!validation.valid) {
                setMessage(validation.error || 'Invalid file');
                e.target.value = '';
                return;
            }

            setReceipt(file);
            setMessage('');
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setMessage('Please sign in to add expenses');
            return;
        }

        if (!category || (category === 'Other' && !customCategory.trim())) {
            setMessage('Please select or enter a category');
            return;
        }

        const finalCategory = category === 'Other' ? customCategory.trim() : category;

        setIsSubmitting(true);
        setUploadProgress(0);
        setMessage('');

        try {
            let receipt_url: string | null = null;

            // Upload receipt if provided
            if (receipt) {
                setMessage('Uploading receipt...');
                setUploadProgress(30);

                // Better file naming
                const fileExt = receipt.name.split('.').pop();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const safeCategory = finalCategory.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const fileName = `${timestamp}_${safeCategory}_${amount}.${fileExt}`;

                // Create folder structure: user/year/month/
                const now = new Date();
                const year = now.getFullYear();
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const filePath = `${user.id}/${year}/${month}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(filePath, receipt, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                receipt_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${filePath}`;
                setUploadProgress(100);
            }


            const { error: insertError } = await supabase.from('transactions').insert({
                user_id: user.id,
                date,
                type: 'Expense',
                amount: parseFloat(amount),
                category: finalCategory,
                description: description.trim() || null,
                vendor: vendor.trim() || null,
                receipt_url,
                income_source: null,
            });

            if (insertError) throw insertError;

            setMessage('Expense added successfully!');

            // Reset form but keep date
            setAmount('');
            setCategory('');
            setCustomCategory('');
            setDescription('');
            setVendor('');
            setReceipt(null);
            setUploadProgress(0);

            setTimeout(() => {
                setMessage('');
                router.push('/admin/transactions');
            }, 2000);

        } catch (err: any) {
            console.error('Error adding expense:', err);
            setMessage(err.message || 'Error adding expense. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [user, date, amount, category, customCategory, description, vendor, receipt, router]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Please sign in to add expenses</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <div className="max-w-md mx-auto">
                {/* Header with back navigation */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Link
                            href="/admin/add-transaction"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Back to add transaction"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Record business expenses with optional receipt upload. Receipts are stored securely.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Date Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {/* Amount Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Amount
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={amount}
                                onChange={handleAmountChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right text-lg"
                                required
                            />
                        </div>

                        {/* Category Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Tag className="w-4 h-4" />
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select a category</option>
                                {commonCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>

                            {category === 'Other' && (
                                <div className="mt-3">
                                    <input
                                        type="text"
                                        placeholder="Enter custom category"
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        maxLength={50}
                                    />
                                    <div className="text-xs text-gray-500 mt-1 text-right">
                                        {customCategory.length}/50 characters
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Vendor Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Store className="w-4 h-4" />
                                Vendor (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Amazon, Office Depot"
                                value={vendor}
                                onChange={(e) => setVendor(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                maxLength={100}
                            />
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Description (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Monthly office supplies"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                maxLength={200}
                            />
                            <div className="text-xs text-gray-500 mt-1 text-right">
                                {description.length}/200 characters
                            </div>
                        </div>

                        {/* Receipt Upload */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Paperclip className="w-4 h-4" />
                                Receipt (Optional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                                <input
                                    type="file"
                                    id="receipt-upload"
                                    accept=".png,.jpg,.jpeg,.pdf"
                                    onChange={handleReceiptChange}
                                    className="hidden"
                                />
                                <label htmlFor="receipt-upload" className="cursor-pointer">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm text-gray-600">
                                        {receipt ? (
                                            <span className="text-blue-600 font-medium">{receipt.name}</span>
                                        ) : (
                                            'Click to upload receipt'
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        JPG, PNG or PDF (Max 5MB)
                                    </div>
                                </label>

                                {receipt && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReceipt(null);
                                            const input = document.getElementById('receipt-upload') as HTMLInputElement;
                                            if (input) input.value = '';
                                        }}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                                    >
                                        Remove file
                                    </button>
                                )}
                            </div>

                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 text-right">
                                        Uploading... {uploadProgress}%
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !amount || !date || !category || (category === 'Other' && !customCategory)}
                            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isSubmitting || !amount || !date || !category || (category === 'Other' && !customCategory)
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Adding Expense...
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="w-5 h-5" />
                                    Add Expense
                                </>
                            )}
                        </button>
                    </form>

                    {/* Status Message */}
                    {message && (
                        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${message.includes('successfully')
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'}`}
                        >
                            {message.includes('successfully') ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : null}
                            {message}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link
                            href="/admin/add-transaction/income/"
                            className="block p-3 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center font-medium"
                        >
                            Add Income Instead
                        </Link>
                        <Link
                            href="/admin/transactions"
                            className="block p-3 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-center font-medium"
                        >
                            View All Transactions
                        </Link>
                        <Link
                            href="/admin/donations"
                            className="block p-3 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center font-medium"
                        >
                            Record Donation
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Expenses are tracked for tax purposes. Keep receipts for deductible items.</p>
                </div>
            </div>
        </div>
    );
}