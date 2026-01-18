// app/admin/inventory/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Package, PlusCircle, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';

interface InventoryPurchase {
    id: string;
    item_name: string;
    purchase_date: string;
    quantity: number;
    unit_cost: number;
    shipping_cost: number;
    total_cost: number;
    notes: string | null;
    created_at: string;
    sold_count?: number;
    remaining_stock?: number;
    total_value?: number;
    inventory_sales?: Array<{ quantity_sold: number }>;
}

export default function InventoryDashboard() {
    const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get purchases WITH their sales data
            const { data, error } = await supabase
                .from('inventory_purchases')
                .select(`
        *,
        inventory_sales(
          quantity_sold
        )
      `)
                .eq('user_id', user.id)
                .order('purchase_date', { ascending: false });

            if (error) throw error;

            // Calculate stock for each purchase
            const purchasesWithStock = (data || []).map(purchase => {
                const soldCount = purchase.inventory_sales?.reduce(
                    (sum: number, sale: { quantity_sold: number }) => sum + sale.quantity_sold, 0
                ) || 0;

                const unitCost = purchase.total_cost / purchase.quantity;

                return {
                    ...purchase,
                    sold_count: soldCount,
                    remaining_stock: purchase.quantity - soldCount,
                    total_value: (purchase.quantity - soldCount) * unitCost
                };
            });

            setPurchases(purchasesWithStock);

        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalInventoryValue = purchases.reduce((sum, p) => sum + p.total_cost, 0);
    const totalUnits = purchases.reduce((sum, p) => sum + p.quantity, 0);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
                    <Package className="w-6 h-6" /> Inventory Management
                </h1>
                <p className="text-gray-600">Track books purchased for resale</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Purchases</p>
                            <p className="text-xl font-bold">{purchases.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Units</p>
                            <p className="text-xl font-bold">{purchases.reduce((sum, p) => sum + p.quantity, 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Remaining Stock</p>
                            <p className="text-xl font-bold">{purchases.reduce((sum, p) => sum + (p.remaining_stock || 0), 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Value</p>
                            <p className="text-xl font-bold">
                                ${purchases.reduce((sum, p) => sum + (p.total_value || 0), 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
                <Link
                    href="/admin/inventory/purchase"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <PlusCircle className="w-5 h-5" /> Record Purchase
                </Link>
                <Link
                    href="/admin/inventory/sale"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <DollarSign className="w-5 h-5" /> Record Sale
                </Link>
            </div>

            {/* Inventory List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">Recent Inventory Purchases</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">Loading...</div>
                ) : purchases.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No inventory purchases yet.</p>
                        <p className="text-sm mt-1">Record your first book purchase to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                                    <th className="px6 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Unit Cost</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Total Cost</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {purchases.map((purchase) => (
                                    <tr key={purchase.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(purchase.purchase_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{purchase.item_name}</td>
                                        <td className="px-6 py-4">{purchase.quantity}</td>
                                        <td className="px-6 py-4">${purchase.unit_cost.toFixed(2)}</td>
                                        <td className="px-6 py-4 font-semibold">${purchase.total_cost.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {purchase.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}