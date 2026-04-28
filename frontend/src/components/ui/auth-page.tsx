'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, GithubIcon, AtSignIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';

export function AuthPage() {
	const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<div className="text-center">
					<Spinner size="large" className="mx-auto mb-4" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (isAuthenticated) {
		return <Navigate to="/app" replace />;
	}

	const handleGoogleLogin = () => {
		loginWithRedirect({ authorizationParams: { connection: 'google-oauth2' } });
	};

	const handleGithubLogin = () => {
		loginWithRedirect({ authorizationParams: { connection: 'github' } });
	};

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			{/* Left side - Quote/Testimonial */}
			<div className="bg-background relative hidden h-full flex-col border-r p-10 lg:flex overflow-hidden">
				<div className="z-10 flex items-center gap-2">
					<img
						src="/reconcile-logo.png"
						alt="Reconcile"
						className="h-14 w-auto"
					/>
				</div>
				<div className="z-10 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-lg leading-relaxed" style={{ fontFamily: 'var(--font-heading)' }}>
							&ldquo;This platform has transformed how I manage my business finances.
							AI-powered insights save me hours every week.&rdquo;
						</p>
						<footer className="font-mono text-xs text-muted-foreground">
							~ Reconcile User
						</footer>
					</blockquote>
				</div>
				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>

			{/* Right side - Auth Form */}
			<div className="relative flex min-h-screen flex-col justify-center p-4">
				<div
					aria-hidden
					className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
				>
					<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
				</div>

				<Button variant="ghost" className="absolute top-7 left-5" asChild>
					<a href="#">
						<ChevronLeftIcon className="size-4 me-2" />
						Home
					</a>
				</Button>

				<div className="mx-auto w-full max-w-xs space-y-4">
					{/* Mobile Brand */}
					<div className="flex items-center gap-2 lg:hidden">
						<img
							src="/reconcile-logo.png"
							alt="Reconcile"
							className="h-10 w-auto"
						/>
					</div>

					{/* Headline */}
					<div className="flex flex-col space-y-1">
						<h1 className="text-xl font-semibold tracking-tight">
							Sign In or Join Now!
						</h1>
						<p className="text-muted-foreground text-xs">
							Login or create your Reconcile account.
						</p>
					</div>

					{error && (
						<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive text-xs">
							{error.message}
						</div>
					)}

					{/* Auth Buttons */}
					<div className="space-y-2">
						<Button
							type="button"
							size="sm"
							className="w-full text-xs"
							onClick={handleGoogleLogin}
						>
							<GoogleIcon className="size-3.5 me-2" />
							Continue with Google
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="w-full text-xs"
							onClick={handleGithubLogin}
						>
							<GithubIcon className="size-3.5 me-2" />
							Continue with GitHub
						</Button>
					</div>

					<AuthSeparator />

					{/* Email Form (decorative for now) */}
					<form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
						<p className="text-muted-foreground text-start text-[10px]">
							Enter your email address to sign in or create an account
						</p>
						<div className="relative">
							<Input
								placeholder="your.email@example.com"
								className="peer ps-9 text-xs h-9"
								type="email"
							/>
							<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
								<AtSignIcon className="size-4" aria-hidden="true" />
							</div>
						</div>

						<Button type="button" size="sm" className="w-full text-xs">
							<span>Continue With Email</span>
						</Button>
					</form>

					<p className="text-muted-foreground text-center text-[10px]">
						By clicking continue, you agree to our{' '}
						<a
							href="#"
							className="hover:text-primary underline underline-offset-2 transition-colors"
						>
							Terms
						</a>{' '}
						and{' '}
						<a
							href="#"
							className="hover:text-primary underline underline-offset-2 transition-colors"
						>
							Privacy
						</a>
					</p>
				</div>
			</div>
		</main>
	);
}

function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position
			} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position
			} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position
			} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		color: `rgba(0,0,0,${0.05 + i * 0.02})`,
		width: 0.5 + i * 0.03,
	}));

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg
				className="h-full w-full"
				viewBox="0 0 696 316"
				fill="none"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="black"
						strokeWidth={path.width}
						strokeOpacity={0.05 + path.id * 0.02}
						initial={{ pathLength: 0.3, opacity: 0.4 }}
						animate={{
							pathLength: 1,
							opacity: [0.2, 0.4, 0.2],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + Math.random() * 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'linear',
						}}
					/>
				))}
			</svg>
		</div>
	);
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		{...props}
	>
		<g>
			<path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
		</g>
	</svg>
);

const AuthSeparator = () => {
	return (
		<div className="flex w-full items-center justify-center">
			<div className="bg-border h-px w-full" />
			<span className="text-muted-foreground px-2 text-[10px]">OR</span>
			<div className="bg-border h-px w-full" />
		</div>
	);
};
