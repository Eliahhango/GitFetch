import {useEffect, useState} from 'react';

export default function SessionPage() {
	const [stats, setStats] = useState<{
		totalFiles: number;
		downloadedFiles: number;
		elapsed: string;
		estimatedBytes: number;
		failedFiles: number;
	} | null>(null);

	const [history, setHistory] = useState<{
		totalDownloads: number;
		totalFiles: number;
		totalBytes: number;
		totalFailed: number;
		sessions: number;
	} | null>(null);

	useEffect(() => {
		const load = () => {
			const stored = localStorage.getItem('download-stats');
			if (stored) {
				try {
					const parsed = JSON.parse(stored) as unknown;
					if (parsed && typeof parsed === 'object') {
						setStats(parsed as typeof stats);
					}
				} catch {
					// ignore
				}
			}

			const historyRaw = localStorage.getItem('download-history');
			if (historyRaw) {
				try {
					const parsed = JSON.parse(historyRaw) as unknown;
					if (parsed && typeof parsed === 'object') {
						setHistory(parsed as typeof history);
					}
				} catch {
					// ignore
				}
			}
		};

		load();
		window.addEventListener('storage', load);
		return () => window.removeEventListener('storage', load);
	}, []);

	const formatBytes = (bytes: number) => {
		if (!Number.isFinite(bytes) || bytes <= 0) {
			return '--';
		}

		const units = ['B', 'KB', 'MB', 'GB'];
		let value = bytes;
		let index = 0;
		while (value >= 1024 && index < units.length - 1) {
			value /= 1024;
			index++;
		}

		return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
	};

	const totalFiles = stats?.totalFiles ?? 0;
	const downloadedFiles = stats?.downloadedFiles ?? 0;
	const elapsed = stats?.elapsed ?? '00:00';
	const formattedEstimate = formatBytes(stats?.estimatedBytes ?? 0);
	const failedCount = stats?.failedFiles ?? 0;

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
					<a href="session.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-primary bg-primary/10">Session</a>
					<a href="activity.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">Activity</a>
					<a href="about.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">About</a>
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
						<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface dark:text-zinc-100">Session</h2>
						<p className="text-on-surface-variant font-body-lg opacity-80">Download statistics from your most recent session.</p>
					</section>

					<div className="glass-panel p-4 md:p-6 rounded-2xl">
						<div className="flex items-center gap-3 mb-6">
							<span className="material-symbols-outlined text-primary text-[22px]">analytics</span>
							<h2 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">Session Stats</h2>
						</div>

						{stats === null ? (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<span className="material-symbols-outlined text-[56px] text-on-surface-variant/20">analytics</span>
								<p className="text-base text-on-surface-variant/50 mt-4">No session data yet</p>
								<p className="text-sm text-on-surface-variant/30 mt-2">
									Go to the <a href="index.html" className="text-primary font-semibold hover:underline">Download</a> page to download a directory and see stats here.
								</p>
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
									<div className="p-4 md:p-5 rounded-xl bg-primary/5 border border-primary/10 text-center">
										<strong className="block text-xl md:text-2xl lg:text-3xl font-bold text-primary">{totalFiles}</strong>
										<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Files found</span>
									</div>
									<div className="p-4 md:p-5 rounded-xl bg-primary/5 border border-primary/10 text-center">
										<strong className="block text-xl md:text-2xl lg:text-3xl font-bold text-primary">{downloadedFiles}</strong>
										<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Downloaded</span>
									</div>
									<div className="p-4 md:p-5 rounded-xl bg-primary/5 border border-primary/10 text-center">
										<strong className="block text-xl md:text-2xl lg:text-3xl font-bold text-primary">{elapsed}</strong>
										<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Elapsed</span>
									</div>
									<div className="p-4 md:p-5 rounded-xl bg-primary/5 border border-primary/10 text-center">
										<strong className="block text-xl md:text-2xl lg:text-3xl font-bold text-primary">{formattedEstimate}</strong>
										<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Est. size</span>
									</div>
									<div className="p-4 md:p-5 rounded-xl bg-error/5 border border-error/10 text-center">
										<strong className="block text-lg md:text-xl font-bold text-error">{failedCount}</strong>
										<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Failed</span>
									</div>
								</div>

								{totalFiles > 0 && downloadedFiles > 0 && (
									<div className="mt-6">
										<div className="flex justify-between items-center mb-2">
											<span className="text-[13px] font-medium text-on-surface">Progress</span>
											<span className="text-[12px] text-on-surface-variant/60 dark:text-zinc-400">{Math.round((downloadedFiles / totalFiles) * 100)}%</span>
										</div>
										<div className="w-full bg-black/10 rounded-full h-3 overflow-hidden">
											<div
												className="h-full bg-primary rounded-full transition-all duration-300"
												style={{width: `${Math.round((downloadedFiles / totalFiles) * 100)}%`}}
											></div>
										</div>
									</div>
								)}
							</>
						)}
					</div>

					{history !== null && (
						<div className="glass-panel p-4 md:p-6 rounded-2xl mt-6">
							<div className="flex items-center gap-3 mb-6">
								<span className="material-symbols-outlined text-tertiary text-[22px]">database</span>
								<h2 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">All-Time History</h2>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
								<div className="p-4 md:p-5 rounded-xl bg-tertiary/5 border border-tertiary/10 text-center">
									<strong className="block text-xl md:text-2xl font-bold text-tertiary">{history.sessions}</strong>
									<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Sessions</span>
								</div>
								<div className="p-4 md:p-5 rounded-xl bg-tertiary/5 border border-tertiary/10 text-center">
									<strong className="block text-xl md:text-2xl font-bold text-tertiary">{history.totalDownloads}</strong>
									<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Downloads</span>
								</div>
								<div className="p-4 md:p-5 rounded-xl bg-tertiary/5 border border-tertiary/10 text-center">
									<strong className="block text-xl md:text-2xl font-bold text-tertiary">{history.totalFiles.toLocaleString()}</strong>
									<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Total files</span>
								</div>
								<div className="p-4 md:p-5 rounded-xl bg-tertiary/5 border border-tertiary/10 text-center">
									<strong className="block text-xl md:text-2xl font-bold text-tertiary">{formatBytes(history.totalBytes)}</strong>
									<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Total size</span>
								</div>
								<div className="p-4 md:p-5 rounded-xl bg-error/5 border border-error/10 text-center">
									<strong className="block text-lg md:text-xl font-bold text-error">{history.totalFailed}</strong>
									<span className="text-[11px] text-on-surface-variant/60 dark:text-zinc-400 uppercase tracking-wider font-medium">Failed</span>
								</div>
							</div>
						</div>
					)}
					{stats !== null && (
						<div className="glass-panel p-4 md:p-6 rounded-2xl mt-6">
							<div className="relative">
								<span className="absolute -left-2 -top-2 text-5xl text-primary/10 font-serif leading-none">&#8220;</span>
								<p className="italic text-on-surface-variant/80 text-[14px] leading-relaxed pl-4 border-l border-primary/20">
									The fastest way I've found to package a subfolder and move on with my workflow.
								</p>
								<p className="mt-3 pl-4 font-bold text-[13px] text-on-surface">&mdash; EliTechWiz</p>
							</div>
						</div>
					)}
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
				<a href="session.html" className="flex flex-col items-center gap-0.5 text-primary">
					<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>analytics</span>
					<span className="text-[10px] font-bold">Session</span>
				</a>
				<a href="activity.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 dark:text-zinc-400">
					<span className="material-symbols-outlined text-[22px]">list_alt</span>
					<span className="text-[10px] font-bold">Activity</span>
				</a>
				<a href="about.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 dark:text-zinc-400">
					<span className="material-symbols-outlined text-[22px]">info</span>
					<span className="text-[10px] font-bold">About</span>
				</a>
			</nav>
		</>
	);
}
