'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, DollarSign, Calendar, Building, Gift, CreditCard, FileText, Paperclip, Upload, CheckCircle } from 'lucide-react';
import { validateFile } from '@/lib/fileValidation';

export default function DonationsPage() {
    const user = useSupabaseUser();
    const router = useRouter();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [charity, setCharity] = useState('');
    const [donationType, setDonationType] = useState('Cash');
    const [method, setMethod] = useState('');
    const [notes, setNotes] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const donationTypes = [
        { value: 'Cash', label: 'Cash' },
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Bank Transfer', label: 'Bank Transfer' },
        { value: 'Check', label: 'Check' },
        { value: 'Online', label: 'Online' },
        { value: 'Goods', label: 'Goods/In-Kind' },
        { value: 'Stocks', label: 'Stocks' },
        { value: 'Other', label: 'Other' }
    ];

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
            setMessage('Please sign in to record donations');
            return;
        }

        if (!charity.trim()) {
            setMessage('Please enter a charity name');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setMessage('Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);
        setMessage('');

        try {
            let receipt_url: string | null = null;

            // Upload receipt if provided
            if (receipt) {
                setMessage('Uploading receipt...');
                setUploadProgress(30);

                const fileExt = receipt.name.split('.').pop();
                const fileName = `${Date.now()}_${charity.replace(/\s+/g, '_')}_${amount}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('donation-receipts')
                    .upload(filePath, receipt, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                receipt_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/donation-receipts/${filePath}`;
                setUploadProgress(100);
            }

            const { error } = await supabase.from('donations').insert({
                user_id: user.id,
                date,
                amount: parseFloat(amount),
                charity: charity.trim(),
                donation_type: donationType,
                method: method.trim() || null,
                notes: notes.trim() || null,
                receipt_url,
            });

            if (error) throw error;

            setMessage('Donation recorded successfully! Your generosity makes a difference. 💝');

            // Reset form
            setAmount('');
            setCharity('');
            setMethod('');
            setNotes('');
            setReceipt(null);
            setUploadProgress(0);

            // Redirect to donations list after delay
            setTimeout(() => {
                router.push('/admin/donations/list');
            }, 2500);

        } catch (err: any) {
            console.error('Error saving donation:', err);
            setMessage(err.message || 'Error saving donation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [user, date, amount, charity, donationType, method, notes, receipt, router]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Please sign in to record donations</p>
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
                            href="/admin"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Back to admin"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Heart className="w-6 h-6 text-purple-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Record Donation</h1>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Track your charitable giving. All donations are recorded for your records and tax purposes.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Date Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Donation Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right text-lg"
                                required
                            />
                        </div>

                        {/* Charity Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building className="w-4 h-4" />
                                Charity Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Red Cross, Local Food Bank"
                                value={charity}
                                onChange={(e) => setCharity(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                required
                                maxLength={100}
                            />
                        </div>

                        {/* Donation Type Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Gift className="w-4 h-4" />
                                Donation Type
                            </label>
                            <select
                                value={donationType}
                                onChange={(e) => setDonationType(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                {donationTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Method Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <CreditCard className="w-4 h-4" />
                                Payment Method (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Visa ending in 4321, PayPal, Check #1234"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                maxLength={50}
                            />
                        </div>

                        {/* Notes Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Notes (Optional)
                            </label>
                            <textarea
                                placeholder="e.g., Monthly pledge, Disaster relief, Matching gift"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[100px] resize-vertical"
                                maxLength={500}
                            />
                            <div className="text-xs text-gray-500 mt-1 text-right">
                                {notes.length}/500 characters
                            </div>
                        </div>

                        {/* Receipt Upload */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Paperclip className="w-4 h-4" />
                                Receipt (Optional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                                <input
                                    type="file"
                                    id="donation-receipt-upload"
                                    accept=".png,.jpg,.jpeg,.pdf"
                                    onChange={handleReceiptChange}
                                    className="hidden"
                                />
                                <label htmlFor="donation-receipt-upload" className="cursor-pointer">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm text-gray-600">
                                        {receipt ? (
                                            <span className="text-purple-600 font-medium">{receipt.name}</span>
                                        ) : (
                                            'Click to upload donation receipt'
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
                                            const input = document.getElementById('donation-receipt-upload') as HTMLInputElement;
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
                                            className="bg-purple-600 h-2 rounded-full transition-all"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 text-right">
                                        Uploading receipt... {uploadProgress}%
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !amount || !date || !charity}
                            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isSubmitting || !amount || !date || !charity
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-sm hover:shadow'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Recording Donation...
                                </>
                            ) : (
                                <>
                                    <Heart className="w-5 h-5" />
                                    Save Donation
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
                            <span className="whitespace-pre-wrap">{message}</span>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link
                            href="/admin/donations/list"
                            className="block p-3 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center font-medium"
                        >
                            View All Donations
                        </Link>
                        <Link
                            href="/admin/add-income"
                            className="block p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center font-medium"
                        >
                            Add Income
                        </Link>
                        <Link
                            href="/admin/add-expense"
                            className="block p-3 border border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-center font-medium"
                        >
                            Add Expense
                        </Link>
                    </div>
                </div>

                {/* Tax Information */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <div className="text-yellow-600 mt-0.5">💡</div>
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Tax Documentation</p>
                            <p className="text-yellow-700">Keep receipts for donations over $250. Most charitable donations are tax-deductible in the US.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}