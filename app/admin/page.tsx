'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import {
    PlusCircle,
    FileText,
    TrendingUp,
    Heart,
    DollarSign,
    TrendingDown,
    ArrowUpRight,
    Calendar,
    RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
    const user = useSupabaseUser();
    const [stats, setStats] = useState({
        incomeThisMonth: 0,
        expensesThisMonth: 0,
        donationsThisMonth: 0,
        netProfit: 0,
        loading: true
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!user) return;

        setStats(prev => ({ ...prev, loading: true }));

        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            // Fetch monthly income
            const { data: incomeData } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('type', 'Income')
                .gte('date', monthStart)
                .lte('date', monthEnd);

            // Fetch monthly expenses
            const { data: expenseData } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('type', 'Expense')
                .gte('date', monthStart)
                .lte('date', monthEnd);

            // Fetch monthly donations
            const { data: donationData } = await supabase
                .from('donations')
                .select('amount')
                .eq('user_id', user.id)
                .gte('date', monthStart)
                .lte('date', monthEnd);

            const income = incomeData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
            const expenses = expenseData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
            const donations = donationData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
            const netProfit = income - expenses - donations;

            setStats({
                incomeThisMonth: income,
                expensesThisMonth: expenses,
                donationsThisMonth: donations,
                netProfit,
                loading: false
            });

            // Fetch recent activity
            const { data: recentTransactions } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(3);

            const { data: recentDonations } = await supabase
                .from('donations')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(2);

            const activity = [
                ...(recentTransactions || []).map(t => ({
                    ...t,
                    _type: 'transaction',
                    icon: t.type === 'Income' ? TrendingUp : TrendingDown
                })),
                ...(recentDonations || []).map(d => ({
                    ...d,
                    _type: 'donation',
                    icon: Heart
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 4);

            setRecentActivity(activity);

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    }, [user]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStats();
        setTimeout(() => setRefreshing(false), 500);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const getMonthName = () => {
        return new Date().toLocaleDateString('en-US', { month: 'long' });
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bookkeeping Dashboard</h1>
                            <p className="text-gray-600 mt-1">Track your finances at a glance</p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            aria-label="Refresh dashboard"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Current Month Summary */}
                    <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">{getMonthName()} Overview</h2>
                        </div>

                        {stats.loading ? (
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Income</span>
                                    <span className="font-semibold text-green-600">
                                        {formatCurrency(stats.incomeThisMonth)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Expenses</span>
                                    <span className="font-semibold text-red-600">
                                        {formatCurrency(stats.expensesThisMonth)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Donations</span>
                                    <span className="font-semibold text-purple-600">
                                        {formatCurrency(stats.donationsThisMonth)}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-900">Net Profit</span>
                                        <span className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatCurrency(stats.netProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions - Your main buttons, enhanced */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Primary Action - Add Expense (emphasized) */}
                        <Link
                            href="/admin/add-transaction/expense"
                            className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-sm hover:shadow-md hover:from-red-600 hover:to-red-700 transition-all flex flex-col items-center justify-center group"
                        >
                            <div className="p-2 bg-white/20 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <span className="font-semibold">Add Expense</span>
                            <span className="text-sm opacity-90">Quick Entry</span>
                        </Link>

                        {/* Add Income */}
                        <Link
                            href="/admin/add-transaction/income"
                            className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-sm hover:shadow-md hover:from-green-600 hover:to-green-700 transition-all flex flex-col items-center justify-center group"
                        >
                            <div className="p-2 bg-white/20 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="font-semibold">Add Income</span>
                            <span className="text-sm opacity-90">Record Revenue</span>
                        </Link>

                        {/* All Transactions */}
                        <Link
                            href="/admin/transactions"
                            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 transition-all flex flex-col items-center justify-center group"
                        >
                            <div className="p-2 bg-white/20 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <span className="font-semibold">Transactions</span>
                            <span className="text-sm opacity-90">View & Edit</span>
                        </Link>

                        {/* Monthly Summary */}
                        <Link
                            href="/admin/summary"
                            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-sm hover:shadow-md hover:from-purple-600 hover:to-purple-700 transition-all flex flex-col items-center justify-center group"
                        >
                            <div className="p-2 bg-white/20 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="font-semibold">Summary</span>
                            <span className="text-sm opacity-90">Monthly Report</span>
                        </Link>
                    </div>
                </div>

                {/* Additional Actions */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">More Actions</h2>
                    <div className="space-y-3">
                        <Link
                            href="/admin/donations"
                            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-purple-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Heart className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <span className="font-medium text-gray-900">Record Donation</span>
                                    <p className="text-sm text-gray-500">Track charitable giving</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </Link>

                        <Link
                            href="/admin/add-transaction"
                            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-blue-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <PlusCircle className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <span className="font-medium text-gray-900">Advanced Transaction</span>
                                    <p className="text-sm text-gray-500">Full transaction form</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </Link>

                        <Link
                            href="/admin/donations/list"
                            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-purple-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <span className="font-medium text-gray-900">Donations List</span>
                                    <p className="text-sm text-gray-500">View all donations</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                {recentActivity.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <div className="space-y-3">
                                {recentActivity.map((item, index) => (
                                    <div key={`${item._type}-${item.id}-${index}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${item._type === 'donation' ? 'bg-purple-100' : item.type === 'Income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {item.icon && (
                                                    item._type === 'donation' ? (
                                                        <Heart className="w-4 h-4 text-purple-600" />
                                                    ) : item.type === 'Income' ? (
                                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4 text-red-600" />
                                                    )
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">
                                                    {item._type === 'donation' ? item.charity : item.description || (item.type === 'Income' ? 'Income' : 'Expense')}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(item.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                    {item._type === 'donation' ? ' • Donation' : ` • ${item.type}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`font-semibold ${item._type === 'donation' ? 'text-purple-600' : item.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(item.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/admin/transactions"
                                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium mt-4 pt-3 border-t border-gray-100"
                            >
                                View All Activity
                            </Link>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 mt-8">
                    <p>Bookkeeping Admin • {new Date().getFullYear()}</p>
                    <p className="mt-1">Track your finances with purpose</p>
                </div>
            </div>
        </div>
    );
}