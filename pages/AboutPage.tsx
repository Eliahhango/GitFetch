export default function AboutPage() {
	const features = [
		['checklist', 'Batch queue with sequential processing'],
		['filter_alt', 'Glob-style file type filters'],
		['lock_person', 'Privacy-first, client-side execution'],
		['speed', 'Parallel file fetching with configurable concurrency'],
		['autorenew', 'Automatic retries on failed files'],
		['token', 'Private repository support via GitHub token'],
	] as const;

	return (
		<>
			<header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-outline-variant/20 dark:border-zinc-800 flex justify-between items-center px-4 md:px-8 py-3 md:py-4">
				<a href="index.html" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
					<span className="material-symbols-outlined text-primary text-lg md:text-2xl" style={{fontVariationSettings: '\'FILL\' 1'}}>folder_zip</span>
					<h1 className="text-headline-md font-bold tracking-tight text-primary">GitFetch</h1>
				</a>
				<nav className="hidden lg:flex items-center gap-1">
					<a href="index.html" className="px-3 py-2 lg:py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">Download</a>
					<a href="queue.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">Queue</a>
					<a href="session.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">Session</a>
					<a href="activity.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">Activity</a>
					<a href="about.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-primary bg-primary/10">About</a>
					<a href="source.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">Source</a>
				</nav>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => {
							const isDark = document.documentElement.classList.toggle('dark');
							localStorage.setItem('gitfetch-theme', isDark ? 'dark' : 'light');
						}}
						className="p-2.5 md:p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
						aria-label="Toggle dark mode"
					>
						<span className="material-symbols-outlined text-[20px] dark:hidden">dark_mode</span>
						<span className="material-symbols-outlined text-[20px] hidden dark:block">light_mode</span>
					</button>
					<a href="source.html" className="p-2.5 md:p-2 rounded-full hover:bg-black/5 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
						<span className="material-symbols-outlined text-[20px]">code</span>
					</a>
				</div>
			</header>

			<main className="flex-grow pt-24 md:pt-28 pb-32 md:pb-20 px-4 md:px-8 max-w-container-max mx-auto w-full relative dark:bg-zinc-950">
				<div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20 dark:opacity-10 overflow-hidden">
					<div className="absolute top-[-10%] right-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] bg-primary/20 rounded-full blur-[80px] md:blur-[120px] animate-float"></div>
					<div className="absolute bottom-[10%] left-[5%] w-[200px] h-[200px] md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px] bg-tertiary/15 rounded-full blur-[60px] md:blur-[100px]" style={{animationDelay: '3s'}}></div>
				</div>

				<div className="max-w-4xl mx-auto">
					<section className="space-y-2 md:space-y-3 mb-8">
						<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface dark:text-zinc-100">About GitFetch</h2>
						<p className="text-on-surface-variant font-body-lg opacity-80">What GitFetch does and how it works.</p>
					</section>

					<div className="glass-panel p-4 md:p-6 rounded-2xl">
						<div className="flex items-center gap-3 mb-6">
							<span className="material-symbols-outlined text-primary text-[22px]">info</span>
							<h2 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">About</h2>
						</div>

						<div className="grid sm:grid-cols-2 gap-8">
							<div className="space-y-4">
								<p className="text-sm text-on-surface-variant/80 dark:text-zinc-400 leading-relaxed">
									GitFetch lets you download any GitHub subdirectory as a ZIP archive instantly &mdash; no cloning, no full-repo downloads. Built with privacy in mind: everything runs client-side in your browser.
								</p>
								<p className="text-sm text-on-surface-variant/80 dark:text-zinc-400 leading-relaxed">
									Simply paste the URL of the GitHub folder you want, configure optional filters, and download. No server-side storage, no data leaks, no sign-ups required.
								</p>
								<div className="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.06] w-fit">
									<img
										alt="EliTechWiz profile"
										className="w-10 h-10 rounded-xl border border-white/40 shadow-sm object-cover"
										src="elitechwiz-profile.png"
									/>
									<div className="flex flex-col">
										<h5 className="font-bold text-[13px]">EliTechWiz</h5>
										<p className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400">Software Architect &amp; Creator</p>
									</div>
								</div>
							</div>
							<div className="space-y-4">
								<h3 className="font-bold text-base text-on-surface">Features</h3>
								<ul className="space-y-3">
									{features.map(([icon, text]) => (
										<li key={text} className="flex items-center gap-3 text-sm text-on-surface-variant/80">
											<span className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
												<span className="material-symbols-outlined text-[18px]">{icon}</span>
											</span>
											{text}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>

					<div className="glass-panel p-4 md:p-6 rounded-2xl mt-6">
						<div className="flex items-center gap-3 mb-4">
							<span className="material-symbols-outlined text-primary text-[22px]">architecture</span>
							<h2 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">Architecture</h2>
						</div>
						<div className="space-y-3 text-sm text-on-surface-variant/80 dark:text-zinc-400 leading-relaxed">
							<p>
								GitFetch uses the GitHub Trees API to list directory contents, then fetches each file in parallel using the Contents API.
								Files are streamed directly into a ZIP archive using JSZip, all within your browser.
							</p>
							<p><strong>Key points:</strong></p>
							<ul className="list-disc list-inside space-y-1.5">
								<li>No server-side processing &mdash; everything runs in your browser</li>
								<li>Configurable concurrency (5&ndash;20 parallel requests)</li>
								<li>Automatic retry of failed files</li>
								<li>Private repository support via GitHub Personal Access Tokens</li>
								<li>Tokens stored only in localStorage, never sent to third parties</li>
							</ul>
						</div>
					</div>

					<div className="glass-panel p-4 md:p-6 rounded-2xl mt-6">
						<div className="flex items-center gap-3 mb-4">
							<span className="material-symbols-outlined text-primary text-[22px]">lock</span>
							<h2 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">GitHub Token Guide</h2>
						</div>
						<div className="space-y-4 text-sm text-on-surface-variant/80 dark:text-zinc-400 leading-relaxed">
							<p>
								To download files from <strong>private repositories</strong>, you need a GitHub Personal Access Token.
							</p>
							<div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.06] rounded-xl p-4 space-y-3">
								<h4 className="font-bold text-on-surface text-sm">Step-by-step</h4>
								<ol className="space-y-2 list-decimal list-inside">
									<li>Go to <a className="text-primary font-semibold hover:underline" href="https://github.com/settings/tokens/new?description=GitFetch&scopes=repo" target="_blank" rel="noreferrer">GitHub Token Settings</a></li>
									<li>Give it a name (e.g. &quot;GitFetch&quot;)</li>
									<li>Select the <strong>repo</strong> scope (full control of private repositories)</li>
									<li>Click <strong>Generate token</strong></li>
									<li>Copy the token and paste it into the <strong>GitHub Token</strong> field on the Download page</li>
								</ol>
							</div>
							<div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
								<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
								<p className="text-[13px]">Your token is stored only in your browser&rsquo;s local storage. It is never sent to any server other than the GitHub API.</p>
							</div>
						</div>
					</div>
				</div>
			</main>

			<footer className="w-full py-8 md:py-10 mt-auto bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-t border-outline-variant/10 dark:border-zinc-800">
				<div className="px-4 md:px-8 max-w-container-max mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
						<div className="space-y-2 text-center md:text-left">
							<div className="flex items-center justify-center md:justify-start gap-2">
								<span className="font-bold text-on-surface tracking-tight">GitFetch</span>
								<span className="w-1 h-1 rounded-full bg-on-surface/20"></span>
								<span className="text-on-surface-variant/60 dark:text-zinc-400 text-sm">by EliTechWiz</span>
							</div>
							<p className="text-[12px] text-on-surface-variant/50">Open source browser-based repository downloader.</p>
						</div>
						<div className="flex flex-wrap justify-center gap-x-6 md:gap-x-10 gap-y-3 md:gap-y-4">
							<a href="about.html" className="text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary transition-all text-[13px] font-medium">About</a>
							<a href="source.html" className="text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary transition-all text-[13px] font-medium">Source</a>
							<a href="activity.html" className="text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary transition-all text-[13px] font-medium">Activity</a>
						</div>
						<div className="text-on-surface-variant/40 dark:text-zinc-500 text-[12px] font-medium">&copy; {new Date().getFullYear()} EliTechWiz</div>
					</div>
				</div>
			</footer>

			<nav className="lg:hidden fixed bottom-4 left-4 right-4 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border-t border-white/30 dark:border-zinc-800 !rounded-full flex justify-between items-center py-3 px-2 sm:px-4 z-50 shadow-xl gap-1">
				<a href="index.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 dark:text-zinc-400">
					<span className="material-symbols-outlined text-[22px]">download</span>
					<span className="text-[10px] font-bold">Download</span>
				</a>
				<a href="queue.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 dark:text-zinc-400">
					<span className="material-symbols-outlined text-[22px]">queue</span>
					<span className="text-[10px] font-bold">Queue</span>
				</a>
				<a href="session.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 dark:text-zinc-400">
					<span className="material-symbols-outlined text-[22px]">analytics</span>
					<span className="text-[10px] font-bold">Session</span>
				</a>
				<a href="activity.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 dark:text-zinc-400">
					<span className="material-symbols-outlined text-[22px]">list_alt</span>
					<span className="text-[10px] font-bold">Activity</span>
				</a>
				<a href="about.html" className="flex flex-col items-center gap-0.5 text-primary">
					<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>info</span>
					<span className="text-[10px] font-bold">About</span>
				</a>
			</nav>
		</>
	);
}
