import {useEffect, useState} from 'react';

type QueueItem = {
	url: string;
	filename?: string;
	filter?: string;
};

export default function QueuePage() {
	const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
	const [processingUrl, setProcessingUrl] = useState<string | null>(() => localStorage.getItem('download-processing'));

	useEffect(() => {
		const stored = localStorage.getItem('download-queue');
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as unknown;
				if (Array.isArray(parsed)) {
					setQueueItems(parsed);
				}
			} catch {
				// ignore
			}
		}

		const handleStorage = (event: StorageEvent) => {
			if (event.key === 'download-queue') {
				if (event.newValue) {
					try {
						const parsed = JSON.parse(event.newValue) as unknown;
						if (Array.isArray(parsed)) {
							setQueueItems(parsed);
						}
					} catch {
						// ignore
					}
				} else {
					setQueueItems([]);
				}
			}

			if (event.key === 'download-processing') {
				setProcessingUrl(event.newValue);
			}
		};

		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, []);

	const removeItem = (index: number) => {
		const updated = queueItems.filter((_, i) => i !== index);
		setQueueItems(updated);
		localStorage.setItem('download-queue', JSON.stringify(updated));
	};

	const clearAll = () => {
		setQueueItems([]);
		localStorage.removeItem('download-queue');
	};

	const isItemActive = (url: string) => processingUrl === url;

	return (
		<>
			{/* Fixed Header */}
			<header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-outline-variant/20 dark:border-zinc-800 flex justify-between items-center px-4 md:px-8 py-3 md:py-4">
				<a href="index.html" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
					<span className="material-symbols-outlined text-primary text-lg md:text-2xl" style={{fontVariationSettings: '\'FILL\' 1'}}>folder_zip</span>
					<h1 className="text-headline-md font-bold tracking-tight text-primary">GitFetch</h1>
				</a>
				<nav className="hidden lg:flex items-center gap-1">
					<a href="index.html" className="px-3 py-2 lg:py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">Download</a>
					<a href="queue.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-primary bg-primary/10">Queue</a>
					<a href="session.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 dark:text-zinc-400 dark:hover:text-white hover:text-primary hover:bg-black/5 dark:hover:bg-white/10">Session</a>
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

			{/* Main */}
			<main className="flex-grow pt-24 md:pt-28 pb-32 md:pb-20 px-4 md:px-8 max-w-container-max mx-auto w-full relative dark:bg-zinc-950">
				<div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20 dark:opacity-10 overflow-hidden">
					<div className="absolute top-[-10%] right-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] bg-primary/20 rounded-full blur-[80px] md:blur-[120px] animate-float"></div>
					<div className="absolute bottom-[10%] left-[5%] w-[200px] h-[200px] md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px] bg-tertiary/15 rounded-full blur-[60px] md:blur-[100px]" style={{animationDelay: '3s'}}></div>
				</div>

				<div className="max-w-4xl mx-auto">
					<section className="space-y-2 md:space-y-3 mb-8">
						<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface dark:text-zinc-100">Queue</h2>
						<p className="text-on-surface-variant dark:text-zinc-400 font-body-lg opacity-80">Manage your batch download queue.</p>
					</section>

					<div className="glass-panel p-4 md:p-6 rounded-2xl">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-primary text-[22px]">queue</span>
								<div>
									<h2 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">Download Queue</h2>
									{queueItems.length > 0 && (
										<p className="text-[12px] text-on-surface-variant/60 dark:text-zinc-400">{queueItems.length} item{queueItems.length === 1 ? '' : 's'} queued</p>
									)}
								</div>
							</div>
							{queueItems.length > 0 && (
								<button
									type="button"
									className="text-[12px] font-semibold text-on-surface-variant/60 dark:text-zinc-400 hover:text-error transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-error/5 dark:hover:bg-red-900/20 min-h-[44px]"
									onClick={clearAll}
								>
									<span className="material-symbols-outlined text-[16px]">delete_sweep</span>
									Clear all
								</button>
							)}
						</div>

						{queueItems.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 text-center">
								<span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 dark:text-zinc-700">playlist_add</span>
								<p className="text-base text-on-surface-variant/50 dark:text-zinc-400 mt-4">Queue is empty</p>
								<p className="text-sm text-on-surface-variant/30 dark:text-zinc-500 mt-2 max-w-md">
									Go to the <a href="index.html" className="text-primary font-semibold hover:underline">Download</a> page and use <strong>Add to queue</strong> to batch multiple folders for sequential processing.
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{queueItems.map((item, index) => (
									<div
										key={`${item.url}-${index}`}
										className="flex items-center gap-3 p-3.5 rounded-xl bg-black/[0.02] dark:bg-zinc-900/30 border border-black/[0.03] dark:border-zinc-800 hover:bg-black/[0.04] dark:hover:bg-zinc-800/50 transition-colors"
									>
										<div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/90 flex items-center justify-center font-bold text-xs">
											{index + 1}
										</div>
										<span className={`w-2 h-2 rounded-full shrink-0 ${isItemActive(item.url) ? 'bg-primary dark:bg-primary/90 animate-pulse' : 'bg-on-surface/20 dark:bg-zinc-600'}`}></span>
										<div className="flex-1 min-w-0">
											<span className="block text-[13px] font-label-mono text-on-surface-variant/80 dark:text-zinc-300 truncate" title={item.url}>
												{item.url}
											</span>
											{item.filename && (
												<span className="text-[11px] text-on-surface-variant/50 dark:text-zinc-500">Filename: {item.filename}</span>
											)}
										</div>
										<button
											type="button"
											className="p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-on-surface-variant/40 dark:text-zinc-500 hover:text-error transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
											title="Remove from queue"
											onClick={() => removeItem(index)}
										>
											<span className="material-symbols-outlined text-[18px]">close</span>
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{queueItems.length > 0 && (
						<div className="bg-primary/[0.03] dark:bg-primary/[0.05] border border-primary/10 dark:border-primary/20 rounded-2xl p-4 md:p-5 flex items-start gap-3 mt-6">
							<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
							<p className="text-sm text-on-surface-variant/80 dark:text-zinc-400 leading-relaxed">
								Queue processes items sequentially on the <a href="index.html" className="text-primary font-semibold hover:underline">Download</a> page.
								Items are shared across tabs via localStorage.
							</p>
						</div>
					)}
				</div>
			</main>

			{/* Footer */}
			<footer className="w-full py-8 md:py-10 mt-auto bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-t border-outline-variant/10 dark:border-zinc-800">
				<div className="px-4 md:px-8 max-w-container-max mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
						<div className="space-y-2 text-center md:text-left">
							<div className="flex items-center justify-center md:justify-start gap-2">
								<span className="font-bold text-on-surface dark:text-zinc-100 tracking-tight">GitFetch</span>
								<span className="w-1 h-1 rounded-full bg-on-surface/20 dark:bg-zinc-600"></span>
								<span className="text-on-surface-variant/60 dark:text-zinc-400 text-sm">by EliTechWiz</span>
							</div>
							<p className="text-[12px] text-on-surface-variant/50 dark:text-zinc-500">Open source browser-based repository downloader.</p>
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

			{/* Bottom Mobile Nav */}
			<nav className="lg:hidden fixed bottom-4 left-4 right-4 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border-t border-white/30 dark:border-zinc-800 !rounded-full flex justify-between items-center py-3 px-2 sm:px-4 z-50 shadow-xl gap-1">
				<a href="index.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 dark:text-zinc-400">
					<span className="material-symbols-outlined text-[22px]">download</span>
					<span className="text-[10px] font-bold">Download</span>
				</a>
				<a href="queue.html" className="flex flex-col items-center gap-0.5 text-primary">
					<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>queue</span>
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
				<a href="about.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 dark:text-zinc-400">
					<span className="material-symbols-outlined text-[22px]">info</span>
					<span className="text-[10px] font-bold">About</span>
				</a>
			</nav>
		</>
	);
}
