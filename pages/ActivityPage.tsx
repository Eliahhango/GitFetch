import {useEffect, useState} from 'react';

export default function ActivityPage() {
	const [statusLines, setStatusLines] = useState<string[]>([]);
	const [failedFiles, setFailedFiles] = useState<string[]>([]);

	useEffect(() => {
		const load = () => {
			const stored = localStorage.getItem('download-activity');
			if (stored) {
				try {
					const parsed = JSON.parse(stored) as unknown;
					if (Array.isArray(parsed)) {
						setStatusLines(parsed);
					}
				} catch {
					// ignore
				}
			}

			const failedStored = localStorage.getItem('download-failed');
			if (failedStored) {
				try {
					const parsed = JSON.parse(failedStored) as unknown;
					if (Array.isArray(parsed)) {
						setFailedFiles(parsed);
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

	const clearLog = () => {
		setStatusLines([]);
		localStorage.removeItem('download-activity');
	};

	return (
		<>
			<header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-surface-container-low/70 backdrop-blur-md border-b border-outline-variant/20 flex justify-between items-center px-4 md:px-8 py-3 md:py-4">
				<a href="index.html" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
					<span className="material-symbols-outlined text-primary text-lg md:text-2xl" style={{fontVariationSettings: '\'FILL\' 1'}}>folder_zip</span>
					<h1 className="text-headline-md font-bold tracking-tight text-primary">GitFetch</h1>
				</a>
				<nav className="hidden lg:flex items-center gap-1">
					<a href="index.html" className="px-3 py-2 lg:py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Download</a>
					<a href="queue.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Queue</a>
					<a href="session.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Session</a>
					<a href="activity.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-primary bg-primary/10">Activity</a>
					<a href="about.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">About</a>
					<a href="source.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Source</a>
				</nav>
				<div className="flex items-center gap-2">
					<a href="source.html" className="p-2.5 md:p-2 rounded-full hover:bg-black/5 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
						<span className="material-symbols-outlined text-[20px]">code</span>
					</a>
				</div>
			</header>

			<main className="flex-grow pt-24 md:pt-28 pb-32 md:pb-20 px-4 md:px-8 max-w-container-max mx-auto w-full relative">
				<div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20 overflow-hidden">
					<div className="absolute top-[-10%] right-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] bg-primary/20 rounded-full blur-[80px] md:blur-[120px] animate-float"></div>
					<div className="absolute bottom-[10%] left-[5%] w-[200px] h-[200px] md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px] bg-tertiary/15 rounded-full blur-[60px] md:blur-[100px]" style={{animationDelay: '3s'}}></div>
				</div>

				<div className="max-w-4xl mx-auto">
					<section className="space-y-2 md:space-y-3 mb-8">
						<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Activity</h2>
						<p className="text-on-surface-variant font-body-lg opacity-80">Status log from your download sessions.</p>
					</section>

					<div className="glass-panel p-4 md:p-6 rounded-2xl">
						<div className="flex items-center gap-3 mb-4">
							<span className="material-symbols-outlined text-primary text-[22px]">list_alt</span>
							<div className="flex-1">
								<h2 className="font-headline-md text-headline-md text-on-surface">Activity Log</h2>
								{statusLines.length > 0 && (
									<p className="text-[12px] text-on-surface-variant/60">{statusLines.length} entr{statusLines.length === 1 ? 'y' : 'ies'}</p>
								)}
							</div>
							{statusLines.length > 0 && (
								<button
									type="button"
									className="text-[12px] font-semibold text-on-surface-variant/60 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-black/5 min-h-[44px]"
									onClick={clearLog}
								>
									Clear log
								</button>
							)}
						</div>

						{statusLines.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<span className="material-symbols-outlined text-[56px] text-on-surface-variant/20">notifications</span>
								<p className="text-base text-on-surface-variant/50 mt-4">No activity yet</p>
								<p className="text-sm text-on-surface-variant/30 mt-2">
									Go to the <a href="index.html" className="text-primary font-semibold hover:underline">Download</a> page to download a directory and see events here.
								</p>
							</div>
						) : (
							<div className="bg-black/[0.02] border border-black/[0.03] rounded-xl p-4 max-h-[250px] md:max-h-[500px] overflow-y-auto font-label-mono text-[12px] leading-relaxed space-y-1.5">
								{statusLines.map((line, index) => (
									<div key={`${line}-${index}`} className="text-on-surface-variant/80">{line}</div>
								))}
							</div>
						)}
					</div>

					{failedFiles.length > 0 && (
						<div className="glass-panel p-4 md:p-6 rounded-2xl mt-6 border-error/20">
							<div className="flex items-center gap-3 mb-4">
								<span className="material-symbols-outlined text-error text-[22px]">error</span>
								<div>
									<h2 className="font-headline-md text-headline-md text-error">Failed Files</h2>
									<p className="text-[12px] text-error/60">{failedFiles.length} file{failedFiles.length === 1 ? '' : 's'} could not be downloaded</p>
								</div>
							</div>
							<div className="bg-error/5 border border-error/10 rounded-xl p-3 md:p-4 max-h-[200px] md:max-h-[400px] overflow-y-auto font-label-mono text-[12px] space-y-1.5">
								{failedFiles.slice(0, 50).map(file => (
									<div key={file} className="text-error/80 truncate hover:text-clip" title={file}>{file}</div>
								))}
								{failedFiles.length > 50 && (
									<div className="text-on-surface-variant/50 text-[11px] pt-2 border-t border-error/10">...and {failedFiles.length - 50} more</div>
								)}
							</div>
							<p className="text-[12px] text-on-surface-variant/50 mt-3 flex items-center gap-1.5">
								<span className="material-symbols-outlined text-[14px]">info</span>
								Failed files are automatically retried once. Persistent failures are listed here.
							</p>
						</div>
					)}
				</div>
			</main>

			<footer className="w-full py-8 md:py-10 mt-auto bg-white/50 backdrop-blur-sm border-t border-outline-variant/10">
				<div className="px-4 md:px-8 max-w-container-max mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
						<div className="space-y-2 text-center md:text-left">
							<div className="flex items-center justify-center md:justify-start gap-2">
								<span className="font-bold text-on-surface tracking-tight">GitFetch</span>
								<span className="w-1 h-1 rounded-full bg-on-surface/20"></span>
								<span className="text-on-surface-variant/60 text-sm">by EliTechWiz</span>
							</div>
							<p className="text-[12px] text-on-surface-variant/50">Open source browser-based repository downloader.</p>
						</div>
						<div className="flex flex-wrap justify-center gap-x-6 md:gap-x-10 gap-y-3 md:gap-y-4">
							<a href="about.html" className="text-on-surface-variant/80 hover:text-primary transition-all text-[13px] font-medium">About</a>
							<a href="source.html" className="text-on-surface-variant/80 hover:text-primary transition-all text-[13px] font-medium">Source</a>
							<a href="activity.html" className="text-on-surface-variant/80 hover:text-primary transition-all text-[13px] font-medium">Activity</a>
						</div>
						<div className="text-on-surface-variant/40 text-[12px] font-medium">&copy; 2024 EliTechWiz</div>
					</div>
				</div>
			</footer>

			<nav className="lg:hidden fixed bottom-4 left-4 right-4 backdrop-blur-xl bg-white/90 border-t border-white/30 !rounded-full flex justify-between items-center py-3 px-2 sm:px-4 z-50 shadow-xl gap-1">
				<a href="index.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60">
					<span className="material-symbols-outlined text-[22px]">download</span>
					<span className="text-[10px] font-bold">Download</span>
				</a>
				<a href="queue.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60">
					<span className="material-symbols-outlined text-[22px]">queue</span>
					<span className="text-[10px] font-bold">Queue</span>
				</a>
				<a href="session.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60">
					<span className="material-symbols-outlined text-[22px]">analytics</span>
					<span className="text-[10px] font-bold">Session</span>
				</a>
				<a href="activity.html" className="flex flex-col items-center gap-0.5 text-primary">
					<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>list_alt</span>
					<span className="text-[10px] font-bold">Activity</span>
				</a>
				<a href="about.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60">
					<span className="material-symbols-outlined text-[22px]">info</span>
					<span className="text-[10px] font-bold">About</span>
				</a>
			</nav>
		</>
	);
}
