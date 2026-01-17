'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AddIncomePage() {
    const user = useSupabaseUser();
    const router = useRouter();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [incomeSource, setIncomeSource] = useState<'Subscriptions' | 'Book Sales' | 'Partner Spots'>('Subscriptions');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setMessage('Please sign in to add income');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            const { error: insertError } = await supabase.from('transactions').insert({
                user_id: user.id,
                date,
                type: 'Income',
                amount: parseFloat(amount),
                income_source: incomeSource,
                description: description.trim() || null,
                category: null,
                vendor: null,
                receipt_url: null,

            });

            if (insertError) throw insertError;

            setMessage('Income added successfully!');
            setAmount('');
            setDescription('');

            // Reset form but keep date and income source
            setTimeout(() => {
                setMessage('');
            }, 3000);

        } catch (err: any) {
            console.error('Error adding income:', err);
            setMessage(err.message || 'Error adding income. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [user, date, amount, incomeSource, description]);

    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty, numbers, and decimals
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Please sign in to add income</p>
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
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Income</h1>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Record new income transactions. All fields are saved automatically.
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

                        {/* Income Source Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Income Source
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIncomeSource('Subscriptions')}
                                    className={`p-3 rounded-lg border-2 transition-all ${incomeSource === 'Subscriptions'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                        : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    WCU Registry
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIncomeSource('Book Sales')}
                                    className={`p-3 rounded-lg border-2 transition-all ${incomeSource === 'Book Sales'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                        : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    Book Sales
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIncomeSource('Partner Spots')}
                                    className={`p-3 rounded-lg border-2 transition-all ${incomeSource === 'Partner Spots'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                        : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    Partner Spots
                                </button>
                            </div>
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Description (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Monthly subscription revenue"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                maxLength={200}
                            />
                            <div className="text-xs text-gray-500 mt-1 text-right">
                                {description.length}/200 characters
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !amount || !date}
                            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isSubmitting || !amount || !date
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-5 h-5" />
                                    Add Income
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
                            href="/admin/add-transaction"
                            className="block p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center font-medium"
                        >
                            Add Expense Instead
                        </Link>
                        <Link
                            href="/admin/transactions"
                            className="block p-3 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-center font-medium"
                        >
                            View All Transactions
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Income transactions are automatically categorized and don&apos;t require vendor details.</p>
                </div>
            </div>
        </div>
    );
}