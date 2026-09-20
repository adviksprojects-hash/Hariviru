import Link from 'next/link';
// Notice the use of the new <Show> component instead of <SignedIn>/<SignedOut>
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import HeaderClient from './HeaderClient';
import { checkUser } from '@/lib/checkUser';

export default async function Header() {
    await checkUser();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/30 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">

                {/* Brand / Logo */}
                <Link href="/" className="text-2xl font-extrabold tracking-tighter text-gray-900 drop-shadow-sm flex items-center gap-1">
                    Brand<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500">Logo</span>
                </Link>

                {/* Navigation (Client-Side for Active States & Mobile Menu) */}
                <HeaderClient />

                {/* Clerk Authentication UI with the latest <Show> pattern */}
                <div className="flex items-center gap-4">

                    {/* Renders only when the user is NOT authenticated */}
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <button className="hidden sm:block text-sm font-semibold dark:text-gray-200 hover:text-blue-600 transition-colors">
                                Sign in
                            </button>
                        </SignInButton>

                        <SignUpButton mode="modal">
                            <button className="text-sm font-semibold bg-linear-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-full transition-all shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5">
                                Get Started
                            </button>
                        </SignUpButton>
                    </Show>

                    {/* Renders only when the user IS authenticated */}
                    <Show when="signed-in">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10 ring-2 ring-blue-500/50 shadow-md transition-transform hover:scale-105"
                                }
                            }}
                        />
                    </Show>

                </div>

            </div>
        </header>
    );
}