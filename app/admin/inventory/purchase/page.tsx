// app/admin/inventory/purchase/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function AddInventoryPurchase() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        item_name: 'Book: [Your Book Title]',
        purchase_date: new Date().toISOString().split('T')[0],
        quantity: 1,
        unit_cost: 0,
        shipping_cost: 0,
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('inventory_purchases')
                .insert([{
                    user_id: user.id,
                    ...formData,
                    quantity: Number(formData.quantity),
                    unit_cost: Number(formData.unit_cost),
                    shipping_cost: Number(formData.shipping_cost)
                }]);

            if (error) throw error;

            alert('Inventory purchase recorded!');
            router.push('/admin/inventory');
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('quantity') || name.includes('cost') ?
                (value === '' ? '' : Number(value)) : value
        }));
    };

    const totalCost = (Number(formData.quantity) * Number(formData.unit_cost)) + Number(formData.shipping_cost);
    const costPerUnit = formData.quantity > 0 ? totalCost / Number(formData.quantity) : 0;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="mb-6">
                <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Inventory
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="w-6 h-6" /> Add Inventory Purchase
                </h1>
                <p className="text-gray-600 mt-1">Record books purchased for resale</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Item Name *</label>
                        <input
                            type="text"
                            name="item_name"
                            value={formData.item_name}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Purchase Date *</label>
                        <input
                            type="date"
                            name="purchase_date"
                            value={formData.purchase_date}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Quantity *</label>
                        <input
                            type="number"
                            name="quantity"
                            min="1"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Cost Per Unit ($) *</label>
                        <input
                            type="number"
                            name="unit_cost"
                            min="0"
                            step="0.01"
                            value={formData.unit_cost}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Shipping Cost ($)</label>
                        <input
                            type="number"
                            name="shipping_cost"
                            min="0"
                            step="0.01"
                            value={formData.shipping_cost}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full p-3 border rounded-lg"
                            placeholder="e.g., 'Amazon KDP order for tradeshow'"
                        />
                    </div>
                </div>

                {/* Cost Summary */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Cost Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Subtotal:</span>
                            <div className="font-medium">${(Number(formData.quantity) * Number(formData.unit_cost)).toFixed(2)}</div>
                        </div>
                        <div>
                            <span className="text-gray-600">Shipping:</span>
                            <div className="font-medium">${Number(formData.shipping_cost).toFixed(2)}</div>
                        </div>
                        <div className="col-span-2 border-t pt-2">
                            <span className="text-gray-600">Total Cost:</span>
                            <div className="text-xl font-bold text-blue-700">${totalCost.toFixed(2)}</div>
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-600">Cost Per Unit:</span>
                            <div className="font-medium">${costPerUnit.toFixed(2)} each</div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Recording...' : 'Record Inventory Purchase'}
                </button>
            </form>
        </div>
    );
}