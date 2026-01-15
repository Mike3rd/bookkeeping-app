'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { formatDateShort } from '@/lib/formatters';
import { ReceiptViewer } from '../../components/ReceiptViewer'; // Add this import
import { Calendar, TrendingUp, ExternalLink, Heart, Eye } from 'lucide-react'; // Add Eye icon

type Donation = {
    id: string;
    date: string;
    amount: number;
    charity: string;
    donation_type: string;
    receipt_url?: string | null;
};

export default function DonationListPage() {
    const user = useSupabaseUser();
    const currentYear = new Date().getFullYear();

    const [year, setYear] = useState(currentYear);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; name: string } | null>(null); // Add this state

    const fetchDonations = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const start = `${year}-01-01`;
            const end = `${year}-12-31`;

            const { data, error } = await supabase
                .from('donations')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching donations:', error);
                return;
            }

            setDonations(data || []);
        } catch (err) {
            console.error('Unexpected error fetching donations:', err);
        } finally {
            setLoading(false);
        }
    }, [user, year]);

    useEffect(() => {
        fetchDonations();
    }, [fetchDonations]);

    // Calculate total using useMemo for performance
    const total = useMemo(() => {
        return donations.reduce((sum, d) => sum + Number(d.amount), 0);
    }, [donations]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Get unique years for the dropdown (could be fetched from database)
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Heart className="w-6 h-6 text-purple-600" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Donations</h1>
                    </div>

                    {/* Year Selector Card */}
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Select Year</div>
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(Number(e.target.value))}
                                        className="mt-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Total Donations Card */}
                            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    <div className="text-sm text-gray-600">Total Donated in {year}</div>
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-emerald-700">
                                    ${total.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Donations List */}
                <div className="space-y-0 rounded-xl overflow-hidden shadow-sm">
                    {/* Header Row - Desktop */}
                    <div className="hidden md:grid md:grid-cols-5 bg-gradient-to-r from-purple-50 to-purple-100 p-4 border-b border-purple-200">
                        <div className="font-semibold text-gray-900">Date</div>
                        <div className="font-semibold text-gray-900">Charity</div>
                        <div className="font-semibold text-gray-900">Type</div>
                        <div className="font-semibold text-gray-900 text-right">Amount</div>
                        <div className="font-semibold text-gray-900">Receipt</div>
                    </div>

                    {donations.length === 0 ? (
                        <div className="bg-white p-8 text-center rounded-lg">
                            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No donations for {year}</p>
                            <p className="text-sm text-gray-400 mt-1">Start making a difference!</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Layout - UPDATED */}
                            <div className="md:hidden space-y-0">
                                {donations.map((d) => (
                                    <div
                                        key={d.id}
                                        className="bg-white p-4 border-b border-gray-100"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">
                                                    {formatDateShort(d.date)}
                                                </span>
                                            </div>
                                            <div className="text-lg font-bold text-emerald-700">
                                                ${Number(d.amount).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            <div className="font-semibold text-gray-900 text-lg">
                                                {d.charity}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {d.donation_type}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                            {d.receipt_url ? (
                                                <button
                                                    onClick={() => setSelectedReceipt({
                                                        url: d.receipt_url!,
                                                        name: `donation_${d.date}_${d.charity.replace(/\s+/g, '_')}.jpg`
                                                    })}
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Receipt
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No receipt</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Layout - UPDATED */}
                            <div className="hidden md:block">
                                {donations.map((d) => (
                                    <div
                                        key={d.id}
                                        className="bg-white grid grid-cols-5 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-900">
                                                {formatDateShort(d.date)}
                                            </span>
                                        </div>
                                        <div className="font-medium text-gray-900 truncate" title={d.charity}>
                                            {d.charity}
                                        </div>
                                        <div className="text-gray-600 truncate" title={d.donation_type}>
                                            {d.donation_type}
                                        </div>
                                        <div className="text-right font-bold text-emerald-700">
                                            ${Number(d.amount).toFixed(2)}
                                        </div>
                                        <div className="flex justify-end items-center">
                                            {d.receipt_url ? (
                                                <button
                                                    onClick={() => setSelectedReceipt({
                                                        url: d.receipt_url!,
                                                        name: `donation_${d.date}_${d.charity.replace(/\s+/g, '_')}.jpg`
                                                    })}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors mr-2"
                                                    aria-label={`View receipt for ${d.charity}`}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span className="font-medium">View</span>
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 pr-6" aria-hidden="true">—</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Footer */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div className="text-gray-600">
                                        {donations.length} donation{donations.length !== 1 ? 's' : ''} in {year}
                                    </div>
                                    <div className="font-bold text-lg text-gray-900">
                                        Total: ${total.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

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