'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target, DollarSign, Calendar, Minus, Plus } from 'lucide-react';
import { CSVExports } from '../components/CSVExports';

const DONATION_PERCENTAGE = 0.03; //0.2= 20%

type Transaction = {
    id: string;
    amount: number;
    type: 'Income' | 'Expense';
    income_source?: 'Subscriptions' | 'Book Sales' | 'Partner Spots' | string | null;
    date: string;
};

type Donation = {
    id: string;
    amount: number;
    date: string;
};

export default function MonthlySummaryPage() {
    const user = useSupabaseUser();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);

            // SOLID FIX: Calculate the first and last day of the month properly
            const firstDay = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0); // Last day of the current month

            // Format dates as YYYY-MM-DD for Supabase
            const monthStart = firstDay.toISOString().split('T')[0];
            const monthEnd = lastDay.toISOString().split('T')[0];

            const { data: transData, error: transError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', monthStart)
                .lte('date', monthEnd);

            if (transError) {
                console.error('Error fetching transactions:', transError?.message ?? transError);
                setLoading(false);
                return;
            }

            const { data: donationData, error: donationError } = await supabase
                .from('donations')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', monthStart)
                .lte('date', monthEnd);

            if (donationError) {
                console.error('Error fetching donations:', donationError?.message ?? donationError);
                setLoading(false);
                return;
            }

            setTransactions(transData || []);
            setDonations(donationData || []);
            setLoading(false);
        };

        fetchData();
    }, [user, month, year]);

    if (!user) return null;
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    // === Calculations ===
    const incomeSubs = transactions
        .filter(t => t.type === 'Income' && t.income_source === 'Subscriptions')
        .reduce((sum, t) => sum + t.amount, 0);
    const incomeBooks = transactions
        .filter(t => t.type === 'Income' && t.income_source === 'Book Sales')
        .reduce((sum, t) => sum + t.amount, 0);
    const incomePartners = transactions
        .filter(t => t.type === 'Income' && t.income_source === 'Partner Spots')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomeSubs + incomeBooks + incomePartners;

    const expenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    const donationActual = donations.reduce((sum, d) => sum + d.amount, 0);
    const donationTarget = totalIncome * DONATION_PERCENTAGE;
    const donationDiff = donationActual - donationTarget;
    const percentDonated = totalIncome ? (donationActual / totalIncome) * 100 : 0;

    // NEW CALCULATIONS
    const netProfitBeforeDonations = totalIncome - expenses; // Profit - Expenses only
    const netProfitAfterDonations = totalIncome - expenses - donationActual; // Profit - Expenses - Donations

    // Year-to-date
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const incomeYTD = transactions
        .filter(t => t.type === 'Income' && t.date >= yearStart && t.date <= yearEnd)
        .reduce((sum, t) => sum + t.amount, 0);
    const expensesYTD = transactions
        .filter(t => t.type === 'Expense' && t.date >= yearStart && t.date <= yearEnd)
        .reduce((sum, t) => sum + t.amount, 0);
    const donationsYTD = donations
        .filter(d => d.date >= yearStart && d.date <= yearEnd)
        .reduce((sum, d) => sum + d.amount, 0);

    // NEW YTD CALCULATIONS
    const netProfitBeforeDonationsYTD = incomeYTD - expensesYTD;
    const netProfitYTD = incomeYTD - expensesYTD - donationsYTD;
    const donationTargetYTD = incomeYTD * DONATION_PERCENTAGE;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Monthly Summary</h1>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>

                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div className="text-center">
                                <div className="text-xl font-semibold text-gray-900">
                                    {monthNames[month - 1]} {year}
                                </div>
                                <div className="text-sm text-gray-500">Current Period</div>
                            </div>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Next month"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Monthly Stats Grid - No spacing between cards */}
                <div className="space-y-0 rounded-xl overflow-hidden shadow-sm">
                    {/* Income Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 border-b border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Monthly Income</h2>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                <span className="text-gray-700">Subscriptions</span>
                                <span className="font-semibold text-gray-900">${incomeSubs.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                <span className="text-gray-700">Book Sales</span>
                                <span className="font-semibold text-gray-900">${incomeBooks.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                <span className="text-gray-700">Partner Spots</span>
                                <span className="font-semibold text-gray-900">${incomePartners.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-blue-200">
                                <span className="font-bold text-gray-900">Total Income</span>
                                <span className="text-xl font-bold text-blue-700">${totalIncome.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Card - ADD THIS */}
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-5 border-b border-red-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Monthly Expenses</h2>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                <span className="text-gray-700">Total Expenses</span>
                                <span className="text-xl font-bold text-red-700">${expenses.toFixed(2)}</span>
                            </div>

                            {/* Optional: Add expense categories if you want */}
                            <div className="text-sm text-gray-600 pt-2 border-t border-red-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span>Tracked across {transactions.filter(t => t.type === 'Expense').length} expense transactions</span>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Donations Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 border-b border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Target className="w-5 h-5 text-purple-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Monthly Donations</h2>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                <span className="text-gray-700">Target (20%)</span>
                                <span className="font-semibold text-gray-900">${donationTarget.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                <span className="text-gray-700">Actual Donated</span>
                                <span className="font-semibold text-gray-900">
                                    ${donationActual.toFixed(2)}
                                    <span className="text-sm text-gray-600 ml-2">({percentDonated.toFixed(1)}%)</span>
                                </span>
                            </div>
                            <div className={`flex justify-between items-center p-3 mt-3 rounded-lg ${donationDiff < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                <span className="font-semibold">Status</span>
                                <div className="flex items-center gap-2">
                                    {donationDiff >= 0 ? (
                                        <>
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            <span className="font-bold text-green-700">
                                                Ahead ${donationDiff.toFixed(2)}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                            <span className="font-bold text-red-700">
                                                Behind ${Math.abs(donationDiff).toFixed(2)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Profit Card - UPDATED WITH BOTH CALCULATIONS */}
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Net Profit Breakdown</h2>
                        </div>

                        <div className="space-y-4 py-2">
                            {/* Profit Before Donations */}
                            <div className="bg-white/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-gray-900">Profit (Before Donations)</span>
                                    </div>
                                    <div className="text-xl font-bold text-blue-700">
                                        ${netProfitBeforeDonations.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 pl-6">
                                    Income (${totalIncome.toFixed(2)}) - Expenses (${expenses.toFixed(2)})
                                </div>
                            </div>

                            {/* Donations */}
                            <div className="bg-white/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Minus className="w-4 h-4 text-purple-600" />
                                        <span className="font-semibold text-gray-900">Donations</span>
                                    </div>
                                    <div className="text-lg font-bold text-purple-700">
                                        ${donationActual.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 pl-6">
                                    {percentDonated.toFixed(1)}% of income
                                </div>
                            </div>

                            {/* Final Net Profit */}
                            <div className="pt-3 border-t border-emerald-200">
                                <div className="flex items-center justify-between">
                                    <div className="font-bold text-gray-900">Final Net Profit</div>
                                    <div className="text-2xl md:text-3xl font-bold text-emerald-700">
                                        ${netProfitAfterDonations.toFixed(2)}
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mt-1">After expenses & donations</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Year-to-Date Section */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Year-to-Date Summary ({year})</h2>

                    <div className="space-y-0 rounded-xl overflow-hidden shadow-sm">
                        {/* YTD Income & Expenses */}
                        <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 border-b border-amber-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Total Income</div>
                                    <div className="text-2xl font-bold text-amber-700">${incomeYTD.toFixed(2)}</div>
                                </div>
                                <div className="bg-white/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Expenses</div>
                                    <div className="text-2xl font-bold text-red-600">${expensesYTD.toFixed(2)}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {incomeYTD > 0 ? ((expensesYTD / incomeYTD) * 100).toFixed(1) : '0'}% of income
                                    </div>
                                </div>
                                <div className="bg-white/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Donations</div>
                                    <div className="text-2xl font-bold text-purple-700">${donationsYTD.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        {/* YTD Donations */}
                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-5 border-b border-indigo-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Donation Target</div>
                                    <div className="text-2xl font-bold text-indigo-700">${donationTargetYTD.toFixed(2)}</div>
                                </div>
                                <div className="bg-white/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Actual Donated</div>
                                    <div className="text-2xl font-bold text-purple-700">${donationsYTD.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className={`mt-4 p-3 rounded-lg flex justify-between items-center ${donationsYTD < donationTargetYTD ? 'bg-red-50' : 'bg-green-50'}`}>
                                <span className="font-semibold">Yearly Status</span>
                                <div className="flex items-center gap-2">
                                    {donationsYTD >= donationTargetYTD ? (
                                        <>
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            <span className="font-bold text-green-700">On Track</span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                            <span className="font-bold text-red-700">Behind Target</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* YTD Net Profit - UPDATED */}
                        <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-5">
                            <div className="space-y-4">
                                <div className="bg-white/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-900">Profit (Before Donations)</span>
                                        <span className="text-xl font-bold text-blue-700">
                                            ${netProfitBeforeDonationsYTD.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Income - Expenses only
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-teal-200">
                                    <div>
                                        <div className="font-bold text-gray-900">Final Net Profit</div>
                                        <div className="text-sm text-gray-600">After expenses & donations</div>
                                    </div>
                                    <div className="text-2xl md:text-3xl font-bold text-teal-700">
                                        ${netProfitYTD.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Legend */}
                <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Understanding Your Numbers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3"> {/* Change to 4 columns */}
                        <div className="flex items-start gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                            <div>
                                <div className="font-medium text-sm text-gray-900">Profit Before Donations</div>
                                <div className="text-xs text-gray-600">Income - Expenses (operational profit)</div>
                            </div>
                        </div>

                        {/* ADD THIS EXPENSES LEGEND */}
                        <div className="flex items-start gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                            <div>
                                <div className="font-medium text-sm text-gray-900">Expenses</div>
                                <div className="text-xs text-gray-600">Business costs & operational expenses</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mt-1"></div>
                            <div>
                                <div className="font-medium text-sm text-gray-900">Donations</div>
                                <div className="text-xs text-gray-600">20% target of total income</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full mt-1"></div>
                            <div>
                                <div className="font-medium text-sm text-gray-900">Final Net Profit</div>
                                <div className="text-xs text-gray-600">What remains after all deductions</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CSV Export Section */}
                <div className="mt-8">
                    <CSVExports year={year} />
                </div>
            </div>

        </div>
    );
}