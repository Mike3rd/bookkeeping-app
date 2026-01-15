'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

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
        <div className="max-w-md mx-auto p-4 mt-20">
            <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
            <input
                type="email"
                placeholder="Your email"
                className="p-2 border rounded w-full mb-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button
                onClick={async () => {
                    setMessage('');
                    const { error } = await supabase.auth.signInWithOtp({
                        email,
                        options: { emailRedirectTo: `${window.location.origin}/admin` },
                    });
                    if (error) setMessage('Error sending magic link: ' + error.message);
                    else setMessage('✅ Magic link sent! Check your email. After clicking the link in your email, you can close this tab.');
                }}
                className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Send Magic Link
            </button>
            {message && <p className="mt-3 text-center">{message}</p>}
        </div>
    );
}
