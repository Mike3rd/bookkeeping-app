'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
    ArrowLeft,
    FileDown,
    DollarSign,
    TrendingUp,
    Package,
    Calendar,
    Filter
} from 'lucide-react';

interface InventorySale {
    id: string;
    sale_date: string;
    quantity_sold: number;
    sale_price: number;
    revenue: number;
    cogs: number;
    profit: number;
    notes: string | null;
    inventory_purchases: {
        item_name: string;
    };
}

export default function InventorySalesReport() {
    const [sales, setSales] = useState<InventorySale[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchSales();
    }, [dateRange]);

    const fetchSales = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('inventory_sales')
                .select(`
        *,
        inventory_purchases!inner(
          item_name,
          total_cost,
          quantity
        )
      `)
                .eq('user_id', user.id)
                .gte('sale_date', dateRange.start)
                .lte('sale_date', dateRange.end)
                .order('sale_date', { ascending: false });

            if (error) throw error;

            // Calculate profit for each sale if not already calculated
            const salesWithProfit = (data || []).map(sale => {
                const profit = sale.profit || (sale.revenue - sale.cogs);
                return {
                    ...sale,
                    profit,
                    cogs: sale.cogs || 0
                };
            });

            setSales(salesWithProfit);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const totals = sales.reduce((acc, sale) => ({
        revenue: acc.revenue + sale.revenue,
        cogs: acc.cogs + sale.cogs,
        profit: acc.profit + sale.profit,
        quantity: acc.quantity + sale.quantity_sold
    }), { revenue: 0, cogs: 0, profit: 0, quantity: 0 });

    const exportCSV = () => {
        const headers = ['Date', 'Item', 'Quantity', 'Sale Price', 'Revenue', 'COGS', 'Profit', 'Margin', 'Notes'];
        const rows = sales.map(sale => [
            sale.sale_date,
            sale.inventory_purchases.item_name,
            sale.quantity_sold,
            `$${sale.sale_price.toFixed(2)}`,
            `$${sale.revenue.toFixed(2)}`,
            `$${sale.cogs.toFixed(2)}`,
            `$${sale.profit.toFixed(2)}`,
            `${sale.revenue > 0 ? ((sale.profit / sale.revenue) * 100).toFixed(1) : 0}%`,
            sale.notes || ''
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-sales-${dateRange.start}-to-${dateRange.end}.csv`;
        a.click();
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Inventory
                        </Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <TrendingUp className="w-6 h-6" /> Inventory Sales Report
                        </h1>
                        <p className="text-gray-600">Track book sales with profit calculations</p>
                    </div>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <FileDown className="w-5 h-5" /> Export CSV
                    </button>
                </div>

                {/* Date Filter */}
                <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium">Date Range</h3>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">From</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">To</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="p-2 border rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-xl font-bold">${totals.revenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Package className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total COGS</p>
                                <p className="text-xl font-bold">${totals.cogs.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Gross Profit</p>
                                <p className="text-xl font-bold">${totals.profit.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Units Sold</p>
                                <p className="text-xl font-bold">{totals.quantity}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Sales Details</h2>
                        <span className="text-sm text-gray-600">{sales.length} sales</span>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">Loading sales...</div>
                    ) : sales.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No sales in this date range.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Qty</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Sale Price</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Revenue</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">COGS</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Profit</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Margin</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(sale.sale_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium">{sale.inventory_purchases.item_name}</td>
                                            <td className="px-6 py-4">{sale.quantity_sold}</td>
                                            <td className="px-6 py-4">${sale.sale_price.toFixed(2)}</td>
                                            <td className="px-6 py-4 font-semibold">${sale.revenue.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-red-600">${sale.cogs.toFixed(2)}</td>
                                            <td className={`px-6 py-4 font-bold ${sale.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                ${sale.profit.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {sale.revenue > 0 ? ((sale.profit / sale.revenue) * 100).toFixed(1) : 0}%
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                {sale.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}