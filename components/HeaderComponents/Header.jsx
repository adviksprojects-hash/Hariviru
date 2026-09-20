import Link from 'next/link';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import HeaderClient from './HeaderClient';
import { checkUser } from '@/lib/checkUser';

export default async function Header() {
    const user = await checkUser();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">

                {/* Brand Logo & Text */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white p-0.5 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                        <img
                            src="/logo.jpg"
                            alt="HaruViru Logo"
                            className="h-20 w-20 max-w-none object-contain scale-135 group-hover:scale-145 transition-transform duration-300"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-gray-900 dark:text-white">
                            Haru<span className="text-transparent bg-clip-text bg-linear-to-r from-rose-600 via-amber-600 to-rose-500">Viru</span>
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-rose-600 dark:text-rose-400 mt-0.5">
                            Celebration House
                        </span>
                    </div>
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