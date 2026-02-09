import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2 } from 'lucide-react';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-[#cce9ff]">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-neutral-100 h-16 flex items-center justify-between px-4 md:px-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        N
                    </div>
                    <span className="font-semibold text-lg tracking-tight">Notion Clone</span>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        to="/login"
                        className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors hidden md:block"
                    >
                        Log in
                    </Link>
                    <Link
                        to="/signup"
                        className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-2"
                    >
                        Get Notion free
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl">
                    Your wiki, docs, & projects. Together.
                </h1>
                <p className="text-xl md:text-2xl text-neutral-500 mb-8 max-w-2xl leading-relaxed">
                    Notion is the connected workspace where better, faster work happens.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
                    <Link
                        to="/signup"
                        className="px-6 py-3 bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors text-lg flex items-center gap-2"
                    >
                        Get Notion free
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    {/* <Link
                        to="/login"
                        className="px-6 py-3 bg-neutral-100 text-neutral-900 font-medium rounded-lg hover:bg-neutral-200 transition-colors text-lg"
                    >
                        Log in
                    </Link> */}
                </div>

                {/* Hero Image / Illustration Placeholder */}
                <div className="w-full max-w-5xl aspect-[16/9] bg-neutral-50 rounded-xl shadow-2xl border border-neutral-200 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center text-neutral-300">
                        {/* Abstract UI representation */}
                        <div className="w-3/4 h-3/4 bg-white shadow-xl rounded-lg p-8 flex flex-col gap-4">
                            <div className="w-1/3 h-8 bg-neutral-100 rounded mb-4"></div>
                            <div className="w-full h-4 bg-neutral-100 rounded"></div>
                            <div className="w-full h-4 bg-neutral-100 rounded"></div>
                            <div className="w-2/3 h-4 bg-neutral-100 rounded"></div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="h-32 bg-neutral-50 rounded border border-neutral-100 p-4">
                                    <div className="w-8 h-8 bg-blue-100 rounded mb-2"></div>
                                    <div className="w-1/2 h-4 bg-neutral-200 rounded"></div>
                                </div>
                                <div className="h-32 bg-neutral-50 rounded border border-neutral-100 p-4">
                                    <div className="w-8 h-8 bg-purple-100 rounded mb-2"></div>
                                    <div className="w-1/2 h-4 bg-neutral-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
                    <div className="p-6">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 text-yellow-700">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Docs</h3>
                        <p className="text-neutral-500">Simple, powerful, and beautiful. Next-generation documents.</p>
                    </div>
                    <div className="p-6">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4 text-red-700">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Wikis</h3>
                        <p className="text-neutral-500">Centralize your knowledge. No more hunting for answers.</p>
                    </div>
                    <div className="p-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-700">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Projects</h3>
                        <p className="text-neutral-500">Manage any project. Track tasks, timelines, and more.</p>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-32 py-12 border-t border-neutral-100 w-full text-center text-sm text-neutral-400">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-neutral-200 rounded-md"></div>
                            <span>Notion Clone © 2024</span>
                        </div>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-neutral-600">Privacy</a>
                            <a href="#" className="hover:text-neutral-600">Terms</a>
                            <a href="#" className="hover:text-neutral-600">Twitter</a>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
