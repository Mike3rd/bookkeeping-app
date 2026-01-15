'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    RefreshCw,
    Zap,
    Sparkles,
    ArrowRight
} from 'lucide-react';

export default function AddTransactionLanding() {
    const user = useSupabaseUser();
    const [todayStats, setTodayStats] = useState({
        income: 0,
        expenses: 0,
        loading: true
    });
    const [quickActions, setQuickActions] = useState([
        { id: 1, label: 'Coffee', amount: 4.50, type: 'expense', emoji: '☕' },
        { id: 2, label: 'Lunch', amount: 15.00, type: 'expense', emoji: '🍱' },
        { id: 3, label: 'Subscription', amount: 29.99, type: 'expense', emoji: '📱' },
        { id: 4, label: 'Book Sale', amount: 9.99, type: 'income', emoji: '📚' },
    ]);

    useEffect(() => {
        if (!user) return;

        const fetchTodayStats = async () => {
            setTodayStats(prev => ({ ...prev, loading: true }));

            try {
                const today = new Date().toISOString().split('T')[0];
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];

                // Fetch today's income
                const { data: incomeData } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('user_id', user.id)
                    .eq('type', 'Income')
                    .gte('date', today)
                    .lt('date', tomorrowStr);

                // Fetch today's expenses
                const { data: expenseData } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('user_id', user.id)
                    .eq('type', 'Expense')
                    .gte('date', today)
                    .lt('date', tomorrowStr);

                const income = incomeData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
                const expenses = expenseData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

                setTodayStats({
                    income,
                    expenses,
                    loading: false
                });

            } catch (error) {
                console.error('Error fetching today stats:', error);
                setTodayStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchTodayStats();
    }, [user]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2
        }).format(amount);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getTodayDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleQuickAction = (action: typeof quickActions[0]) => {
        // In a real app, this would navigate with pre-filled form data
        const url = action.type === 'income'
            ? `/admin/add-income?quick=${encodeURIComponent(action.label)}&amount=${action.amount}`
            : `/admin/add-expense?quick=${encodeURIComponent(action.label)}&amount=${action.amount}`;

        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Link
                            href="/admin"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Back to dashboard"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Transaction</h1>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">{getTodayDate()}</p>
                                <p className="font-medium text-gray-900">{getGreeting()}!</p>
                            </div>
                        </div>

                        {todayStats.loading ? (
                            <div className="space-y-3">
                                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        <span className="text-xs text-gray-600">Today's Income</span>
                                    </div>
                                    <div className="text-lg font-bold text-green-700">
                                        {formatCurrency(todayStats.income)}
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <TrendingDown className="w-4 h-4 text-red-600" />
                                        <span className="text-xs text-gray-600">Today's Expenses</span>
                                    </div>
                                    <div className="text-lg font-bold text-red-700">
                                        {formatCurrency(todayStats.expenses)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Action Cards */}
                <div className="space-y-4 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Choose Transaction Type
                    </h2>

                    {/* Add Income Card */}
                    <Link
                        href="/admin/add-transaction/income"
                        className="block bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Add Income</h3>
                                        <p className="text-green-100 opacity-90">Record revenue & earnings</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-lg">
                                <Sparkles className="w-4 h-4" />
                                <span>Track subscriptions, book sales, and other income</span>
                            </div>
                        </div>
                    </Link>

                    {/* Add Expense Card */}
                    <Link
                        href="/admin/add-transaction/expense"
                        className="block bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <TrendingDown className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Add Expense</h3>
                                        <p className="text-blue-100 opacity-90">Track business costs</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-lg">
                                <Sparkles className="w-4 h-4" />
                                <span>Record purchases, bills, and deductible expenses</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Tips */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Quick Tips
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                            <span>Upload receipts for expenses over $75 for tax records</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                            <span>Categorize income by source (Subscriptions, Book Sales)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                            <span>Regular expenses can be saved as templates for faster entry</span>
                        </li>
                    </ul>
                </div>

                {/* Advanced Options */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Link
                        href="/admin/donations"
                        className="block p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:border-purple-300 transition-colors text-center group"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-medium text-gray-900">Record a donation instead?</span>
                            <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}