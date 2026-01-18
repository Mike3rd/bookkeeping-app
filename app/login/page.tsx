'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { DollarSign } from 'lucide-react'; // Optional: Add an icon
import Image from 'next/image';


export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const user = useSupabaseUser();
    const router = useRouter();

    // Redirect if logged in (after user state is known)
    useEffect(() => {
        if (user) router.replace('/admin');
    }, [user, router]);

    // Loading state while user is undefined
    if (user === undefined) return <p className="text-center mt-20">Loading...</p>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-100 px-4">
            <div className="w-full max-w-md">
                {/* Image/Logo Placeholder */}
                <div className="flex justify-center mb-8">
                    {/* Fixed size container for consistent layout */}
                    <div className="relative w-24 h-24"> {/* Fixed: 96x96px */}

                        {/* CURRENT: Icon placeholder (comment out when adding image) */}
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <DollarSign className="w-12 h-12 text-white" />
                        </div>

                        {/* FUTURE: Image implementation (commented out) */}
                        {/* 
        <Image
            src="/logo.png" // Add your logo to public/logo.png
            alt="WCU Bookkeeper Logo"
            width={96}  // Fixed: matches container (w-24 = 96px)
            height={96} // Fixed: matches container (h-24 = 96px)
            className="rounded-2xl object-contain"
            priority // Important for above-the-fold images
        />
        */}

                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                        WCU Bookkeeper
                    </h1>
                    <p className="text-gray-600 text-center mb-6">
                        Secure admin portal for WCU bookkeeping
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>

                        <button
                            onClick={async () => {
                                setMessage('');
                                const { error } = await supabase.auth.signInWithOtp({
                                    email,
                                    options: {
                                        emailRedirectTo: `${window.location.origin}/admin`,
                                        shouldCreateUser: false
                                    },
                                });
                                if (error) {
                                    setMessage('Error sending magic link: ' + error.message);
                                } else {
                                    setMessage('✅ Magic link sent! Check your email. After clicking the link in your email, you can close this tab.');
                                }
                            }}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!email.includes('@')}
                        >
                            Send Magic Link
                        </button>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message}
                            </div>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            You'll receive a secure magic link to sign in. No password needed.
                        </p>
                    </div>
                </div>

                {/* Optional: Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        WCU bookkeeping app • {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}