export default function SourcePage() {
	const techStack = [
		['React', 'UI framework', 'https://react.dev'],
		['TypeScript', 'Type safety', 'https://www.typescriptlang.org'],
		['Parcel', 'Build tool', 'https://parceljs.org'],
		['Tailwind CSS', 'Styling', 'https://tailwindcss.com'],
		['JSZip', 'ZIP creation', 'https://stuk.github.io/jszip/'],
		['list-github-dir-content', 'GitHub directory listing', 'https://github.com/Esri/list-github-dir-content'],
		['p-map', 'Concurrent mapping', 'https://github.com/sindresorhus/p-map'],
	] as const;

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
					<a href="activity.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Activity</a>
					<a href="about.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">About</a>
					<a href="source.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-primary bg-primary/10">Source</a>
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
						<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Source</h2>
						<p className="text-on-surface-variant font-body-lg opacity-80">Open source code, tech stack, and contribution info.</p>
					</section>

					<div className="glass-panel p-4 md:p-6 rounded-2xl">
						<div className="flex items-center gap-3 mb-4">
							<span className="material-symbols-outlined text-primary text-[22px]">code</span>
							<h2 className="font-headline-md text-headline-md text-on-surface">Repository</h2>
						</div>
						<div className="space-y-4">
							<p className="text-sm text-on-surface-variant/80 leading-relaxed">
								GitFetch is open source under the MIT license. All source code is available on GitHub.
							</p>
							<a
								href="https://github.com/Eliahhango/GitFetch"
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2.5 px-5 py-3.5 md:py-3 btn-primary-gradient text-on-primary rounded-xl font-bold hover:opacity-95 transition-all active:scale-[0.98] shadow-sm min-h-[44px] flex items-center"
							>
								<span className="material-symbols-outlined text-[20px]">open_in_new</span>
								View on GitHub
							</a>
						</div>
					</div>

					<div className="glass-panel p-4 md:p-6 rounded-2xl mt-6">
						<div className="flex items-center gap-3 mb-4">
							<span className="material-symbols-outlined text-primary text-[22px]">layers</span>
							<h2 className="font-headline-md text-headline-md text-on-surface">Tech Stack</h2>
						</div>
						<div className="grid sm:grid-cols-2 gap-3">
							{techStack.map(([name, description, url]) => (
								<a
									key={name}
									href={url}
									target="_blank"
									rel="noreferrer"
									className="flex items-center gap-3 p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.03] hover:bg-primary/5 hover:border-primary/10 transition-all group"
								>
									<div className="w-9 h-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
										<span className="material-symbols-outlined text-[18px]">widgets</span>
									</div>
									<div className="flex-1 min-w-0">
										<h4 className="font-bold text-sm text-on-surface">{name}</h4>
										<p className="text-[12px] text-on-surface-variant/60">{description}</p>
									</div>
									<span className="material-symbols-outlined text-[16px] text-on-surface-variant/30 group-hover:text-primary/60 transition-colors">open_in_new</span>
								</a>
							))}
						</div>
					</div>

					<div className="glass-panel p-4 md:p-6 rounded-2xl mt-6">
						<div className="flex items-center gap-3 mb-4">
							<span className="material-symbols-outlined text-primary text-[22px]">description</span>
							<h2 className="font-headline-md text-headline-md text-on-surface">License</h2>
						</div>
						<p className="text-sm text-on-surface-variant/80 leading-relaxed">
							GitFetch is released under the <strong>MIT License</strong>. You are free to use, modify, and distribute
							this software subject to the terms of the license.
						</p>
						<div className="mt-4 bg-black/[0.02] border border-black/[0.03] rounded-xl p-4 font-label-mono text-[12px] text-on-surface-variant/70 leading-relaxed whitespace-pre-line">
							{`MIT License

Copyright (c) 2024 EliTechWiz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
						</div>
					</div>
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
				<a href="activity.html" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60">
					<span className="material-symbols-outlined text-[22px]">list_alt</span>
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
