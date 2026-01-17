// app/admin/components/Footer.tsx 
import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-footer-bg py-6 mt-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <div className="text-center text-sm  mt-2">
                <p className="mt-0 text-sm  italic pl-8 pr-8">
                    “Beware of little expenses; a small leak will sink a great ship.”
                    <span className="not-italic "> — Benjamin Franklin</span>
                </p>
                <p className=" mt-2">WCU Bookkeeper • {new Date().getFullYear()}</p>

            </div>
        </footer>
    );
}