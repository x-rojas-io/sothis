import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-stone-900 text-stone-300">
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Navigation Links */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">Navigation</h3>
                        <Link href="/about" className="hover:text-white transition-colors">About</Link>
                        <Link href="/services" className="hover:text-white transition-colors">Services</Link>
                        <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                    </div>

                    {/* Location */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">Location</h3>
                        <p>Edgewater, NJ</p>
                    </div>

                    {/* Social Media */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">Connect</h3>
                        <a
                            href="https://instagram.com/sothistherapeutic"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors flex items-center gap-2"
                        >
                            <span>📷</span> @sothistherapeutic
                        </a>
                    </div>
                </div>

                <div className="mt-8 border-t border-stone-800 pt-8">
                    <p className="text-center text-xs leading-5">
                        &copy; {new Date().getFullYear()} Sothis Therapeutic Massage, All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
