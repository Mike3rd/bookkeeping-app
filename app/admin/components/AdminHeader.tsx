'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
    Home,
    PlusCircle,
    FileText,
    DollarSign,
    Heart,
    BarChart3,
    LogOut,
    Menu,
    X
} from 'lucide-react';

export default function AdminHeader() {
    const user = useSupabaseUser();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

    const handleLogout = async () => {
        setMenuOpen(false);
        await supabase.auth.signOut();
        router.replace('/login');
    };

    // Focus management when menu opens/closes
    useEffect(() => {
        if (menuOpen && firstMenuItemRef.current) {
            setTimeout(() => {
                firstMenuItemRef.current?.focus();
            }, 100);
        }
    }, [menuOpen]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuOpen &&
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        };

        // Close menu when scrolling
        const handleScroll = () => {
            if (menuOpen) {
                setMenuOpen(false);
            }
        };

        // Close menu with Escape key
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (menuOpen && event.key === 'Escape') {
                setMenuOpen(false);
                buttonRef.current?.focus();
            }
        };

        // Trap focus inside menu when open
        const handleTabKey = (event: KeyboardEvent) => {
            if (!menuOpen) return;

            if (event.key === 'Tab') {
                const focusableElements = menuRef.current?.querySelectorAll(
                    'a, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('keydown', handleEscapeKey);
        document.addEventListener('keydown', handleTabKey);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll);
            document.removeEventListener('keydown', handleEscapeKey);
            document.removeEventListener('keydown', handleTabKey);
        };
    }, [menuOpen]);

    // Prevent body scroll when menu is open on mobile
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [menuOpen]);

    if (!user) return null;

    const handleMenuLinkClick = () => {
        setMenuOpen(false);
    };

    const handleMenuButtonClick = () => {
        const newMenuState = !menuOpen;
        setMenuOpen(newMenuState);
        if (!newMenuState) {
            setTimeout(() => buttonRef.current?.focus(), 0);
        }
    };

    const menuItems = [
        { href: "/admin", icon: <Home className="w-5 h-5" />, label: "Dashboard" },
        { href: "/admin/add-transaction", icon: <PlusCircle className="w-5 h-5" />, label: "Add Transaction" },
        { href: "/admin/donations", icon: <Heart className="w-5 h-5" />, label: "Add Donation" },
        { href: "/admin/transactions", icon: <FileText className="w-5 h-5" />, label: "Transactions" },
        { href: "/admin/donations/list", icon: <FileText className="w-5 h-5" />, label: "Donations List" },
        { href: "/admin/summary", icon: <BarChart3 className="w-5 h-5" />, label: "Monthly Summary" },
    ];

    return (
        <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Bookkeeping Admin</span>
                    </Link>

                    {/* Desktop Navigation (hidden on mobile) */}
                    <nav className="hidden md:flex items-center gap-2">
                        {menuItems.slice(0, -1).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-600 bg-red-500 transition-colors ml-2"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout2</span>
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="relative md:hidden" ref={menuRef}>
                        <button
                            ref={buttonRef}
                            onClick={handleMenuButtonClick}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={menuOpen}
                            aria-controls="admin-menu"
                        >
                            {menuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>

                        {/* Mobile Menu Backdrop */}
                        {menuOpen && (
                            <div
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                                onClick={() => setMenuOpen(false)}
                                aria-hidden="true"
                            />
                        )}

                        {/* Mobile Menu Dropdown */}
                        <nav
                            id="admin-menu"
                            className={`fixed right-4 top-20 w-[calc(100%-2rem)] max-w-sm bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 z-50 ${menuOpen
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 -translate-y-4 pointer-events-none'
                                }`}
                            role="menu"
                            hidden={!menuOpen}
                        >
                            {/* User Info */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="font-bold text-white">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{user?.email}</p>
                                        <p className="text-sm text-gray-600">Active Account</p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="py-2">
                                {menuItems.map((item, index) => (
                                    <Link
                                        key={item.href}
                                        ref={index === 0 ? firstMenuItemRef : null}
                                        href={item.href}
                                        onClick={handleMenuLinkClick}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:bg-blue-50"
                                        role="menuitem"
                                        tabIndex={menuOpen ? 0 : -1}
                                    >
                                        <div className="text-blue-600">
                                            {item.icon}
                                        </div>
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                ))}

                                {/* Divider */}
                                <div className="px-4 py-2">
                                    <div className="border-t border-gray-200"></div>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:bg-red-50"
                                    role="menuitem"
                                    tabIndex={menuOpen ? 0 : -1}
                                >
                                    <div className="text-red-600">
                                        <LogOut className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                <p className="text-xs text-gray-500 text-center">
                                    Bookkeeping Admin • {new Date().getFullYear()}
                                </p>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
}