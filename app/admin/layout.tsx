'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import AdminHeader from './components/AdminHeader'; // correct relative path

export default function AdminLayout({ children }: { children: ReactNode }) {
    const user = useSupabaseUser();
    const router = useRouter();

    // Redirect if not logged in
    useEffect(() => {
        if (user === null) router.replace('/login');
    }, [user, router]);

    // Loading state
    if (user === undefined) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="min-h-screen flex flex-col">
            <AdminHeader /> {/* use the component now */}
            <main className="flex-1 p-4">{children}</main>
        </div>
    );
}
