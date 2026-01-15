'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { Download, FileText, TrendingUp, TrendingDown, Heart, DollarSign } from 'lucide-react';

interface CSVExportsProps {
    year: number;
}

export function CSVExports({ year }: CSVExportsProps) {
    const user = useSupabaseUser();
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const generateCSV = useCallback(async (type: 'expenses' | 'income' | 'donations' | 'summary') => {
        if (!user) return;

        setLoading(type);
        setMessage('');

        try {
            let csvContent = '';
            let filename = '';

            switch (type) {
                case 'expenses':
                    const { data: expensesData } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('type', 'Expense')
                        .gte('date', `${year}-01-01`)
                        .lte('date', `${year}-12-31`)
                        .order('date', { ascending: true });

                    // CSV header
                    csvContent = 'date,description,amount,category,payment_method,notes\n';

                    // CSV rows
                    expensesData?.forEach(transaction => {
                        const date = transaction.date.split('T')[0]; // YYYY-MM-DD format
                        const description = `"${(transaction.description || '').replace(/"/g, '""')}"`;
                        const amount = transaction.amount?.toFixed(2) || '0.00';
                        const category = `"${(transaction.category || '').replace(/"/g, '""')}"`;
                        const paymentMethod = '""'; // Not stored in current schema
                        const notes = '""'; // Not stored in current schema

                        csvContent += `${date},${description},${amount},${category},${paymentMethod},${notes}\n`;
                    });

                    filename = `expenses-${year}.csv`;
                    break;

                case 'income':
                    const { data: incomeData } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('type', 'Income')
                        .gte('date', `${year}-01-01`)
                        .lte('date', `${year}-12-31`)
                        .order('date', { ascending: true });

                    csvContent = 'date,source,amount,notes\n';

                    incomeData?.forEach(transaction => {
                        const date = transaction.date.split('T')[0];
                        const source = `"${(transaction.income_source || 'Income').replace(/"/g, '""')}"`;
                        const amount = transaction.amount?.toFixed(2) || '0.00';
                        const notes = `"${(transaction.description || '').replace(/"/g, '""')}"`;

                        csvContent += `${date},${source},${amount},${notes}\n`;
                    });

                    filename = `income-${year}.csv`;
                    break;

                case 'donations':
                    const { data: donationsData } = await supabase
                        .from('donations')
                        .select('*')
                        .eq('user_id', user.id)
                        .gte('date', `${year}-01-01`)
                        .lte('date', `${year}-12-31`)
                        .order('date', { ascending: true });

                    csvContent = 'date,charity,amount,donation_type,receipt_url\n';

                    donationsData?.forEach(donation => {
                        const date = donation.date.split('T')[0];
                        const charity = `"${donation.charity.replace(/"/g, '""')}"`;
                        const amount = donation.amount.toFixed(2);
                        const donationType = `"${donation.donation_type.replace(/"/g, '""')}"`;
                        const receiptUrl = `"${donation.receipt_url || ''}"`;

                        csvContent += `${date},${charity},${amount},${donationType},${receiptUrl}\n`;
                    });

                    filename = `donations-${year}.csv`;
                    break;

                case 'summary':
                    // Calculate totals
                    const { data: allTransactions } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('user_id', user.id)
                        .gte('date', `${year}-01-01`)
                        .lte('date', `${year}-12-31`);

                    const { data: allDonations } = await supabase
                        .from('donations')
                        .select('*')
                        .eq('user_id', user.id)
                        .gte('date', `${year}-01-01`)
                        .lte('date', `${year}-12-31`);

                    const totalIncome = allTransactions
                        ?.filter(t => t.type === 'Income')
                        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

                    const totalExpenses = allTransactions
                        ?.filter(t => t.type === 'Expense')
                        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

                    const totalDonations = allDonations
                        ?.reduce((sum, d) => sum + d.amount, 0) || 0;

                    const netProfit = totalIncome - totalExpenses - totalDonations;

                    csvContent = 'year,total_income,total_expenses,total_donations,net_profit_after_donations\n';
                    csvContent += `${year},${totalIncome.toFixed(2)},${totalExpenses.toFixed(2)},${totalDonations.toFixed(2)},${netProfit.toFixed(2)}\n`;

                    filename = `summary-${year}.csv`;
                    break;
            }

            // Create and download the CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setMessage(`✅ ${filename} downloaded successfully!`);
        } catch (err: any) {
            console.error(`Error generating ${type} CSV:`, err);
            setMessage(`❌ Error downloading ${type} CSV: ${err.message}`);
        } finally {
            setLoading(null);
        }
    }, [user, year]);

    if (!user) return null;

    const exportButtons = [
        {
            type: 'expenses' as const,
            label: 'Expenses CSV',
            description: 'Business expenses & deductions',
            icon: <TrendingDown className="w-5 h-5" />,
            color: 'from-red-500 to-red-600'
        },
        {
            type: 'income' as const,
            label: 'Income CSV',
            description: 'Revenue by source (Subscriptions, Book Sales, Partner Spots)',
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'from-green-500 to-green-600'
        },
        {
            type: 'donations' as const,
            label: 'Donations CSV',
            description: 'Charitable contributions',
            icon: <Heart className="w-5 h-5" />,
            color: 'from-purple-500 to-purple-600'
        },
        {
            type: 'summary' as const,
            label: 'Summary CSV',
            description: 'Year-end totals',
            icon: <DollarSign className="w-5 h-5" />,
            color: 'from-blue-500 to-blue-600'
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
            <div className="flex items-center gap-2 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Tax Export ({year})</h2>
            </div>

            <p className="text-gray-600 mb-6">
                Download CSV files formatted for tax preparation. Files follow standard accounting formats.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportButtons.map((button) => (
                    <button
                        key={button.type}
                        onClick={() => generateCSV(button.type)}
                        disabled={loading === button.type}
                        className={`p-4 rounded-xl bg-gradient-to-r ${button.color} text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-start`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {button.icon}
                            <span className="font-bold text-lg">{button.label}</span>
                        </div>
                        <span className="text-sm opacity-90">{button.description}</span>
                        {loading === button.type && (
                            <div className="mt-2 text-sm flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Export Notes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Dates are in ISO format (YYYY-MM-DD) for spreadsheet compatibility</li>
                    <li>• Amounts are positive numbers with 2 decimal places</li>
                    <li>• Special characters are properly escaped for CSV</li>
                    <li>• Files are ready for import into tax software</li>
                </ul>
            </div>
        </div>
    );
}