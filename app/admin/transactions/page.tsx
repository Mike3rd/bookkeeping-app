'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { formatDateShort } from '@/lib/formatters';
import { ReceiptViewer } from '../components/ReceiptViewer';
import { Eye, Calendar, Tag, Store, FileText, DollarSign, Filter } from 'lucide-react';

type Transaction = {
    id: string;
    date: string;
    type: 'Income' | 'Expense';
    amount: number | null;
    category: string | null;
    description: string | null;
    vendor: string | null;
    income_source?: 'Subscriptions' | 'Book Sales' | 'Partner Spots' | string | null;
    receipt_url?: string | null;
};

export default function TransactionsListPage() {
    const user = useSupabaseUser();
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
    const [categoryFilter, setCategoryFilter] = useState<'All' | string>('All');
    const [incomeSourceFilter, setIncomeSourceFilter] = useState<'All' | string>('All');
    const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; name: string } | null>(null);

    // Fetch all transactions for the month (unfiltered)
    const fetchAllTransactions = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const [year, monthStr] = month.split('-');
            const startDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1).toISOString();
            const endDate = new Date(parseInt(year), parseInt(monthStr), 1).toISOString();

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', startDate)
                .lt('date', endDate)
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching transactions:', error);
                setAllTransactions([]);
            } else {
                setAllTransactions(data as Transaction[]);
            }
        } catch (err) {
            console.error('Unexpected error fetching transactions:', err);
            setAllTransactions([]);
        }

        setLoading(false);
    }, [user, month]);

    // Apply filters whenever filters change
    useEffect(() => {
        let result = [...allTransactions];

        if (typeFilter !== 'All') {
            result = result.filter(t => t.type === typeFilter);
        }

        if (categoryFilter !== 'All') {
            result = result.filter(t => t.category === categoryFilter);
        }

        if (incomeSourceFilter !== 'All') {
            result = result.filter(t => t.income_source === incomeSourceFilter);
        }

        setFilteredTransactions(result);
    }, [allTransactions, typeFilter, categoryFilter, incomeSourceFilter]);

    // Reset income source filter when switching away from Income type
    useEffect(() => {
        if (typeFilter !== 'Income') {
            setIncomeSourceFilter('All');
        }
    }, [typeFilter]);

    // Fetch data when month or user changes
    useEffect(() => {
        fetchAllTransactions();
    }, [fetchAllTransactions]);

    // Calculate unique values from ALL transactions in the month, not just filtered ones
    const { uniqueCategories, uniqueIncomeSources } = useMemo(() => {
        const categories = Array.from(
            new Set(allTransactions.map(t => t.category).filter(Boolean))
        ) as string[];

        const incomeSources = Array.from(
            new Set(allTransactions.map(t => t.income_source).filter(Boolean))
        ) as string[];

        return { uniqueCategories: categories, uniqueIncomeSources: incomeSources };
    }, [allTransactions]);

    const handleInlineUpdate = async (id: string, field: 'amount' | 'category', value: any) => {
        const { error } = await supabase.from('transactions').update({ [field]: value }).eq('id', id);
        if (error) {
            console.error('Error updating transaction:', error);
        } else {
            // Update local state immediately for better UX
            setAllTransactions(prev => prev.map(t =>
                t.id === id ? { ...t, [field]: value } : t
            ));
        }
    };

    const handleTypeFilterChange = (value: 'All' | 'Income' | 'Expense') => {
        setTypeFilter(value);
        // Keep category filter only if it makes sense for the new type
        if (value === 'Income' && categoryFilter !== 'All') {
            // Reset category filter when switching to Income (since Income typically doesn't have categories)
            setCategoryFilter('All');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Transactions</h1>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => handleTypeFilterChange(e.target.value as 'All' | 'Income' | 'Expense')}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="All">All Types</option>
                            <option value="Income">Income</option>
                            <option value="Expense">Expense</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={typeFilter === 'Income' && uniqueCategories.length === 0}
                        >
                            <option value="All">All Categories</option>
                            {uniqueCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {typeFilter === 'Income' && (
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Income Source</label>
                            <select
                                value={incomeSourceFilter}
                                onChange={(e) => setIncomeSourceFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="All">All Income Sources</option>
                                {uniqueIncomeSources.map((src) => (
                                    <option key={src} value={src}>
                                        {src}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading transactions...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No transactions found for the selected filters.</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Stats */}
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-4">
                            {filteredTransactions.map((tx) => (
                                <div key={tx.id} className="border border-gray-200 p-4 rounded-lg shadow-sm bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.type === 'Income'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {tx.type}
                                        </span>
                                        <span className="text-gray-500 text-sm">{formatDateShort(tx.date)}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-gray-600 text-sm">Amount:</span>
                                            <input
                                                type="number"
                                                value={tx.amount ?? 0}
                                                onChange={(e) => handleInlineUpdate(tx.id, 'amount', parseFloat(e.target.value))}
                                                className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                                                step="0.01"
                                            />
                                        </div>

                                        {tx.type === 'Income' && (
                                            <div>
                                                <span className="text-gray-600 text-sm">Income Source:</span>
                                                <p className="font-medium">{tx.income_source || '-'}</p>
                                            </div>
                                        )}

                                        {tx.type === 'Expense' && (
                                            <div>
                                                <span className="text-gray-600 text-sm">Category:</span>
                                                <input
                                                    type="text"
                                                    value={tx.category ?? ''}
                                                    onChange={(e) => handleInlineUpdate(tx.id, 'category', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}

                                        {tx.description && (
                                            <div>
                                                <span className="text-gray-600 text-sm">Description:</span>
                                                <p className="font-medium">{tx.description}</p>
                                            </div>
                                        )}

                                        {tx.vendor && (
                                            <div>
                                                <span className="text-gray-600 text-sm">Vendor:</span>
                                                <p className="font-medium">{tx.vendor}</p>
                                            </div>
                                        )}

                                        {/* Add Receipt Section */}
                                        {tx.receipt_url && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <span className="text-gray-600 text-sm block mb-2">Receipt:</span>
                                                <button
                                                    onClick={() => setSelectedReceipt({
                                                        url: tx.receipt_url!,
                                                        name: `receipt_${tx.date}_${tx.amount}.jpg`
                                                    })}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Receipt
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="w-full min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income Source</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDateShort(tx.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.type === 'Income'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {tx.income_source || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <input
                                                    type="number"
                                                    value={tx.amount ?? 0}
                                                    onChange={(e) => handleInlineUpdate(tx.id, 'amount', parseFloat(e.target.value))}
                                                    className="w-32 border border-gray-300 rounded-md p-1.5 text-right focus:ring-2 focus:ring-blue-500"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {tx.type === 'Expense' ? (
                                                    <input
                                                        type="text"
                                                        value={tx.category ?? ''}
                                                        onChange={(e) => handleInlineUpdate(tx.id, 'category', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={tx.description || ''}>
                                                {tx.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {tx.vendor || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {tx.receipt_url ? (
                                                    <button
                                                        onClick={() => setSelectedReceipt({
                                                            url: tx.receipt_url!,
                                                            name: `receipt_${tx.date}_${tx.amount}.jpg`
                                                        })}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Receipt Viewer Modal */}
                {selectedReceipt && (
                    <ReceiptViewer
                        receiptUrl={selectedReceipt.url}
                        fileName={selectedReceipt.name}
                        onClose={() => setSelectedReceipt(null)}
                    />
                )}
            </div>
        </div>
    );
}