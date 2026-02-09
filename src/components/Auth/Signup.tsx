import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../services/auth';
import { Loader2 } from 'lucide-react';

export function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await auth.signUp(email, password, fullName);
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center pt-20 bg-white px-4 font-sans selection:bg-[#cce9ff]">
            <div className="w-full max-w-[320px] flex flex-col items-center">
                <div className="mb-8 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                        N
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-800">Sign up</h1>
                </div>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-neutral-500">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-1.5 border border-neutral-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter your full name..."
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-neutral-500">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-1.5 border border-neutral-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter your email address..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-neutral-500">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-1.5 border border-neutral-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Create a password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-1.5 px-4 rounded-md text-sm transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                    </button>
                </form>

                <div className="mt-8 text-neutral-500 text-xs">
                    Already have an account?{' '}
                    <Link to="/login" className="underline hover:text-neutral-800 transition-colors">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
