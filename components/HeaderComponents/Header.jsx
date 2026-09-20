import Link from 'next/link';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import HeaderClient from './HeaderClient';
import { checkUser } from '@/lib/checkUser';

export default async function Header() {
    const user = await checkUser();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-gray-950/85 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">

                {/* Brand / Logo */}
                <Link href="/" className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="p-2 rounded-xl bg-linear-to-tr from-rose-500 to-amber-500 text-white font-black text-xl shadow-md">HV</span>
                    <span>Haru<span className="text-transparent bg-clip-text bg-linear-to-r from-rose-600 to-amber-600">Viru</span></span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Celebrations</span>
                </Link>

                {/* Navigation (Client-Side for Active States & Mobile Menu) */}
                <HeaderClient user={user} />

                {/* Clerk Authentication UI */}
                <div className="flex items-center gap-3">
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <button className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-rose-600 transition-colors">
                                Sign in
                            </button>
                        </SignInButton>

                        <SignUpButton mode="modal">
                            <button className="text-sm font-semibold bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-rose-500/25 transform hover:-translate-y-0.5">
                                Book Celebration
                            </button>
                        </SignUpButton>
                    </Show>

                    <Show when="signed-in">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10 ring-2 ring-rose-500/50 shadow-md transition-transform hover:scale-105"
                                }
                            }}
                        />
                    </Show>
                </div>

            </div>
        </header>
    );
}