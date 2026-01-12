import Link from "next/link";

export default function HomePage() {
	return (
		<main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
			<h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
				Deploy your apps
				<br />
				<span className="text-fd-muted-foreground">with simplicity</span>
			</h1>
			<p className="mb-8 max-w-2xl text-lg text-fd-muted-foreground">
				Lancer is a self-hosted deployment platform. Deploy web services, databases, and caches on
				your own cloud provider.
			</p>
			<div className="flex flex-col gap-4 sm:flex-row">
				<Link
					href="/docs"
					className="rounded-lg bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
				>
					Get Started
				</Link>
				<Link
					href="https://github.com/lancer-systems/lancer"
					className="rounded-lg border border-fd-border px-6 py-3 font-medium transition-colors hover:bg-fd-accent"
				>
					View on GitHub
				</Link>
			</div>

			<section className="mt-24 grid max-w-4xl gap-8 sm:grid-cols-3">
				<div className="text-left">
					<h3 className="mb-2 font-semibold">Self-Hosted</h3>
					<p className="text-sm text-fd-muted-foreground">
						Your infrastructure, your data. No vendor lock-in. Full control over your stack.
					</p>
				</div>
				<div className="text-left">
					<h3 className="mb-2 font-semibold">Simple Deployment</h3>
					<p className="text-sm text-fd-muted-foreground">
						One command to install. Connect your repositories and deploy through a dashboard.
					</p>
				</div>
				<div className="text-left">
					<h3 className="mb-2 font-semibold">Cost Efficient</h3>
					<p className="text-sm text-fd-muted-foreground">
						Run on your own cloud provider. No platform markup. Pay only for the resources you use.
					</p>
				</div>
			</section>
		</main>
	);
}
