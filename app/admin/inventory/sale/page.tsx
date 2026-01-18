// app/admin/inventory/sale/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Package, Calculator } from 'lucide-react';
import Link from 'next/link';

interface InventoryPurchase {
    id: string;
    item_name: string;
    quantity: number;
    unit_cost: number;
    shipping_cost: number;
    total_cost: number;
    sold_count?: number; // From subquery
}

export default function AddInventorySale() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingPurchases, setLoadingPurchases] = useState(true);
    const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
    const [formData, setFormData] = useState({
        sale_date: new Date().toISOString().split('T')[0],
        purchase_id: '',
        quantity_sold: 1,
        sale_price: 0,
        notes: ''
    });

    // Fetch available inventory purchases
    useEffect(() => {
        fetchAvailablePurchases();
    }, []);

    const fetchAvailablePurchases = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get purchases with their available quantity
            const { data, error } = await supabase
                .from('inventory_purchases')
                .select(`
                    *,
                    inventory_sales!left(
                        quantity_sold
                    )
                `)
                .eq('user_id', user.id)
                .order('purchase_date', { ascending: false });

            if (error) throw error;

            // Calculate available quantity for each purchase
            const purchasesWithAvailability = (data || []).map(purchase => {
                const soldCount = purchase.inventory_sales?.reduce(
                    (sum: number, sale: any) => sum + sale.quantity_sold, 0
                ) || 0;
                return {
                    ...purchase,
                    sold_count: soldCount,
                    available_quantity: purchase.quantity - soldCount
                };
            }).filter(p => p.available_quantity > 0); // Only show purchases with stock

            setPurchases(purchasesWithAvailability);

            // Auto-select first purchase if available
            if (purchasesWithAvailability.length > 0 && !formData.purchase_id) {
                setFormData(prev => ({ ...prev, purchase_id: purchasesWithAvailability[0].id }));
            }
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoadingPurchases(false);
        }
    };

    const selectedPurchase = purchases.find(p => p.id === formData.purchase_id);

    // Calculate derived values
    const revenue = Number(formData.quantity_sold) * Number(formData.sale_price);
    const costPerUnit = selectedPurchase ?
        (selectedPurchase.total_cost / selectedPurchase.quantity) : 0;
    const cogs = Number(formData.quantity_sold) * costPerUnit;
    const profit = revenue - cogs;
    const availableQuantity = selectedPurchase ?
        (selectedPurchase.quantity - (selectedPurchase.sold_count || 0)) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validate available quantity
        if (formData.quantity_sold > availableQuantity) {
            alert(`Cannot sell ${formData.quantity_sold} units. Only ${availableQuantity} available.`);
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            console.log('Recording sale with data:', {
                user_id: user.id,
                ...formData,
                quantity_sold: Number(formData.quantity_sold),
                sale_price: Number(formData.sale_price)
            });

            // Insert the sale - COGS will be auto-calculated by the database trigger
            const { error: saleError, data: saleData } = await supabase
                .from('inventory_sales')
                .insert([{
                    user_id: user.id,
                    ...formData,
                    quantity_sold: Number(formData.quantity_sold),
                    sale_price: Number(formData.sale_price)
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            console.log('Sale recorded successfully:', saleData);

            // Also create a regular income transaction for book sales
            // Also create a regular income transaction for book sales
            console.log('💰 Attempting to create income transaction for sale...', {
                sale_date: formData.sale_date,
                revenue: revenue,
                item_name: selectedPurchase?.item_name,
                quantity_sold: formData.quantity_sold
            });

            const { error: incomeError, data: incomeData } = await supabase
                .from('transactions')
                .insert([{
                    user_id: user.id,
                    date: formData.sale_date,
                    type: 'Income',
                    amount: revenue,
                    income_source: 'Book Sales',
                    category: null,
                    description: `Sold ${formData.quantity_sold} ${selectedPurchase?.item_name}`,
                    receipt_url: null,
                    notes: formData.notes || `Inventory sale ID: ${saleData.id}`
                }])
                .select();  // IMPORTANT: Add .select() to see the response

            if (incomeError) {
                console.error('❌ INCOME TRANSACTION FAILED - FULL ERROR:', incomeError);
                console.error('Error message:', incomeError.message);
                console.error('Error details:', incomeError.details);
                console.error('Error hint:', incomeError.hint);
                console.error('Error code:', incomeError.code);
                console.error('Full error object:', JSON.stringify(incomeError, null, 2));
            }

            alert('✅ Sale recorded! COGS calculated automatically.');
            router.push('/admin/inventory');
        } catch (error: any) {
            console.error('Full error details:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('quantity') || name.includes('price') ?
                (value === '' ? '' : Number(value)) : value
        }));
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="mb-6">
                <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Inventory
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <DollarSign className="w-6 h-6" /> Record Inventory Sale
                </h1>
                <p className="text-gray-600 mt-1">Sell books from your inventory. COGS calculated automatically.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                {loadingPurchases ? (
                    <div className="text-center py-8">Loading available inventory...</div>
                ) : purchases.length === 0 ? (
                    <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Package className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                        <p className="font-medium text-yellow-800">No inventory available for sale</p>
                        <p className="text-yellow-600 mt-1">Record an inventory purchase first.</p>
                        <Link
                            href="/admin/inventory/purchase"
                            className="inline-block mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            Add Inventory Purchase
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Sale Date *</label>
                                <input
                                    type="date"
                                    name="sale_date"
                                    value={formData.sale_date}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Inventory Batch *</label>
                                <select
                                    name="purchase_id"
                                    value={formData.purchase_id}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg"
                                    required
                                >
                                    {purchases.map(purchase => (
                                        <option key={purchase.id} value={purchase.id}>
                                            {purchase.item_name} ({availableQuantity} available)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Quantity Sold * (Max: {availableQuantity})
                                </label>
                                <input
                                    type="number"
                                    name="quantity_sold"
                                    min="1"
                                    max={availableQuantity}
                                    value={formData.quantity_sold}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    {availableQuantity} units available in this batch
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Sale Price Per Unit ($) *</label>
                                <input
                                    type="number"
                                    name="sale_price"
                                    min="0"
                                    step="0.01"
                                    value={formData.sale_price}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Sale Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="e.g., 'Sold at tradeshow', 'Online sale'"
                                />
                            </div>
                        </div>

                        {/* Sale Summary */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <Calculator className="w-4 h-4" /> Sale Summary (Auto-Calculated)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Revenue:</span>
                                    <div className="font-medium">${revenue.toFixed(2)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">COGS:</span>
                                    <div className="font-medium">${cogs.toFixed(2)}</div>
                                    <div className="text-xs text-gray-500">
                                        {formData.quantity_sold} × ${costPerUnit.toFixed(2)} each
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Gross Profit:</span>
                                    <div className={`text-lg font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        ${profit.toFixed(2)}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Profit Margin:</span>
                                    <div className={`font-medium ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'}%
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-green-700 mt-3">
                                ✅ COGS will be automatically recorded in your expenses. Tax-ready!
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || formData.quantity_sold > availableQuantity}
                            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Recording Sale...' : 'Record Sale & Auto-Calculate COGS'}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}