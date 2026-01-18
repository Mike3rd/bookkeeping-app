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
    X,
    ChevronDown,
    Package,
    TrendingUp
} from 'lucide-react';

export default function AdminHeader() {
    const user = useSupabaseUser();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

    const handleLogout = async () => {
        setMenuOpen(false);
        setDesktopDropdownOpen(false);
        await supabase.auth.signOut();
        router.replace('/login');
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close mobile menu
            if (
                menuOpen &&
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }

            // Close desktop dropdown
            if (
                desktopDropdownOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDesktopDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen, desktopDropdownOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (menuOpen) {
                    setMenuOpen(false);
                    buttonRef.current?.focus();
                }
                if (desktopDropdownOpen) {
                    setDesktopDropdownOpen(false);
                }
            }
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [menuOpen, desktopDropdownOpen]);

    if (!user) return null;

    // Primary desktop links (shown always)
    const primaryDesktopLinks = [
        { href: "/admin/add-transaction", icon: <PlusCircle className="w-5 h-5" />, label: "Add" },
        { href: "/admin/summary", icon: <BarChart3 className="w-5 h-5" />, label: "Summary" },
        { href: "/admin/transactions", icon: <FileText className="w-5 h-5" />, label: "Transactions" },
    ];

    // All menu items (for dropdown/mobile)
    const allMenuItems = [
        { href: "/admin/add-transaction", icon: <PlusCircle className="w-5 h-5" />, label: "Add Transaction" },
        { href: "/admin/transactions", icon: <FileText className="w-5 h-5" />, label: "Transactions" },
        { href: "/admin/inventory", icon: <Package className="w-5 h-5" />, label: "Inventory" },
        { href: "/admin/inventory/report", icon: <TrendingUp className="w-5 h-5" />, label: "Sales Report" },
        { href: "/admin/donations", icon: <Heart className="w-5 h-5" />, label: "Add Donation" },
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
                        <span className="text-xl font-bold tracking-tight">WCU Bookkeeper</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Primary Links */}
                        <nav className="flex items-center gap-1">
                            {primaryDesktopLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Desktop Dropdown (Hamburger) */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                                aria-expanded={desktopDropdownOpen}
                                aria-label="More menu options"
                            >
                                <Menu className="w-5 h-5" />
                                <ChevronDown className={`w-4 h-4 transition-transform ${desktopDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Desktop Dropdown Menu */}
                            {desktopDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden z-50 border border-white/20">
                                    {/* User Info */}
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                <span className="font-bold text-white text-sm">
                                                    {user?.email?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dropdown Items */}
                                    <div className="py-2">
                                        {allMenuItems
                                            .filter(item => !primaryDesktopLinks.some(primary => primary.href === item.href))
                                            .map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setDesktopDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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

                                        {/* Logout in Dropdown */}
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <div className="text-red-600">
                                                <LogOut className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="relative md:hidden" ref={menuRef}>
                        <button
                            ref={buttonRef}
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={menuOpen}
                        >
                            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>

                        {/* Mobile Menu */}
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setMenuOpen(false)} />
                                <div className="fixed right-4 top-20 w-[calc(100%-2rem)] max-w-sm bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden z-50">
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

                                    <div className="py-2">
                                        {allMenuItems.map((item, index) => (
                                            <Link
                                                key={item.href}
                                                ref={index === 0 ? firstMenuItemRef : null}
                                                href={item.href}
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <div className="text-blue-600">{item.icon}</div>
                                                <span className="font-medium">{item.label}</span>
                                            </Link>
                                        ))}

                                        <div className="px-4 py-2">
                                            <div className="border-t border-gray-200"></div>
                                        </div>

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <div className="text-red-600">
                                                <LogOut className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}