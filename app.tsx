import {type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState} from 'react';
import {
	getDirectoryContentViaContentsApi,
	getDirectoryContentViaTreesApi,
	type ListGithubDirectoryOptions,
	type TreeResponseObject,
	type ContentsReponseObject,
} from 'list-github-dir-content';
import pMap from 'p-map';
import authenticatedFetch from './authenticated-fetch.js';
import {downloadFile} from './download.js';
import getRepositoryInfo from './repository-info.js';

type ApiOptions = ListGithubDirectoryOptions & {getFullData: true};
type RepoFile = TreeResponseObject | ContentsReponseObject;

type QueueItem = {
	url: string;
	filename?: string;
	filter?: string;
};

const blockedWords = /malware|virus|trojan/i;
const recentStorageKey = 'recent-directory-links';
const tokenStorageKey = 'token';
const queueStorageKey = 'download-queue';
const activityStorageKey = 'download-activity';

function isError(error: unknown): error is Error {
	return error instanceof Error;
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}

function sanitizeFilename(filename: string): string {
	return filename.replaceAll(/[<>:"/\\|?*]+/g, '-').replaceAll(/\s+/g, ' ').trim();
}

function ensureZipFilename(filename: string): string {
	const cleaned = sanitizeFilename(filename);
	const safe = cleaned.length > 0 ? cleaned : 'downloaded-directory';
	return safe.endsWith('.zip') ? safe : `${safe}.zip`;
}

function formatBytes(bytes: number): string {
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
}

function parseGithubUrl(rawUrl: string): string | undefined {
	const candidate = rawUrl.trim();
	if (candidate.length === 0) {
		return;
	}

	const withProtocol = candidate.startsWith('http://') || candidate.startsWith('https://')
		? candidate
		: `https://${candidate}`;

	let parsed: URL;
	try {
		parsed = new URL(withProtocol);
	} catch {
		return;
	}

	if (!/^(?:www\.)?github\.com$/i.test(parsed.hostname)) {
		return;
	}

	parsed.hash = '';
	return parsed.toString();
}

function parseUrlList(rawValue: string): string[] {
	return rawValue
		.split(/\r?\n|,|\s+/)
		.map(value => value.trim())
		.filter(value => value.length > 0)
		.map(value => parseGithubUrl(value))
		.filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function parseFilter(value: string): string[] {
	return value
		.split(',')
		.map(entry => entry.trim().toLowerCase())
		.filter(entry => entry.length > 0)
		.map(entry => (entry.startsWith('.') ? entry : `.${entry}`));
}

function filterFiles(files: RepoFile[], extensions: string[]): RepoFile[] {
	if (extensions.length === 0) {
		return files;
	}

	return files.filter(file => extensions.some(extension => file.path.toLowerCase().endsWith(extension)));
}

function estimateBytes(files: RepoFile[]): number {
	let total = 0;
	for (const file of files) {
		if (typeof file.size === 'number') {
			total += file.size;
		}
	}

	return total;
}

function buildDefaultFilename(data: {
	user: string;
	repository: string;
	gitReference?: string;
	directory: string;
}): string {
	const parts = [data.user, data.repository, data.gitReference, data.directory || 'root'].filter(Boolean);
	return sanitizeFilename(parts.join('-'));
}

function saveFile(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

async function getZip() {
	// @ts-expect-error Dynamic import default export typing
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/naming-convention
	const JSZip = await import('jszip') as typeof import('jszip');
	return new JSZip();
}

async function listFiles(repoListingConfig: ApiOptions): Promise<RepoFile[]> {
	const files = await getDirectoryContentViaTreesApi(repoListingConfig);
	if (!files.truncated) {
		return files;
	}

	return getDirectoryContentViaContentsApi(repoListingConfig);
}

function persistQueue(items: QueueItem[]) {
	localStorage.setItem(queueStorageKey, JSON.stringify(items));
}

function persistActivity(lines: string[]) {
	localStorage.setItem(activityStorageKey, JSON.stringify(lines.slice(0, 200)));
}

function persistStats(stats: {totalFiles: number; downloadedFiles: number; elapsed: string; estimatedBytes: number; failedFiles: number}) {
	localStorage.setItem('download-stats', JSON.stringify(stats));
}

function persistFailedFiles(files: string[]) {
	localStorage.setItem('download-failed', JSON.stringify(files.slice(0, 200)));
}

function parseErrorMessage(error: string): string {
	switch (error) {
		case 'NOT_A_REPOSITORY': {
			return 'Not a repository URL.';
		}

		case 'NOT_A_DIRECTORY': {
			return 'That URL points to a file, not a directory.';
		}

		case 'REPOSITORY_NOT_FOUND': {
			return 'Repository not found. If it is private, provide a valid token.';
		}

		case 'BRANCH_NOT_FOUND': {
			return 'Branch or tag could not be resolved.';
		}

		default: {
			return 'Unknown repository parsing error.';
		}
	}
}

export default function App() {
	const [urlText, setUrlText] = useState('');
	const [filename, setFilename] = useState('');
	const [filterText, setFilterText] = useState('');
	const [concurrency, setConcurrency] = useState('20');
	const [token, setToken] = useState('');
	const [tokenVisible, setTokenVisible] = useState(false);
	const [statusLines, setStatusLines] = useState<string[]>([]);
	const [recentUrls, setRecentUrls] = useState<string[]>([]);
	const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
	const [failedFiles, setFailedFiles] = useState<string[]>([]);
	const [totalFiles, setTotalFiles] = useState(0);
	const [downloadedFiles, setDownloadedFiles] = useState(0);
	const [estimatedBytes, setEstimatedBytes] = useState(0);
	const [elapsed, setElapsed] = useState('00:00');
	const [progressLabel, setProgressLabel] = useState('Idle');
	const [isBusy, setIsBusy] = useState(false);
	const [processingUrl, setProcessingUrl] = useState<string | null>(null);

	const controllerRef = useRef<AbortController | null>(null);
	const startedAtRef = useRef<number>(0);
	const elapsedTimerRef = useRef<number | null>(null);
	const queueRef = useRef<QueueItem[]>([]);
	const isProcessingQueueRef = useRef(false);

	useEffect(() => {
		queueRef.current = queueItems;
	}, [queueItems]);

	useEffect(() => {
		const storedToken = localStorage.getItem(tokenStorageKey);
		if (storedToken) {
			setToken(storedToken);
		}

		const storedRecent = localStorage.getItem(recentStorageKey);
		if (storedRecent) {
			try {
				const parsed = JSON.parse(storedRecent) as unknown;
				if (Array.isArray(parsed)) {
					setRecentUrls(parsed.filter(item => typeof item === 'string').slice(0, 7));
				}
			} catch {
				// Ignore malformed storage.
			}
		}
	}, []);

	useEffect(() => {
		if (token.length === 0) {
			localStorage.removeItem(tokenStorageKey);
		} else {
			localStorage.setItem(tokenStorageKey, token);
		}
	}, [token]);

	const formattedEstimate = useMemo(() => formatBytes(estimatedBytes), [estimatedBytes]);

	const addStatus = (message: string) => {
		const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
		setStatusLines(prev => {
			const next = [entry, ...prev];
			persistActivity(next);
			return next;
		});
	};

	const clearStatus = () => {
		setStatusLines([]);
		localStorage.removeItem(activityStorageKey);
	};

	const updateElapsed = () => {
		if (!startedAtRef.current) {
			setElapsed('00:00');
			return;
		}

		const ms = performance.now() - startedAtRef.current;
		const seconds = Math.floor(ms / 1000);
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor(seconds / 60) % 60;
		const remainingSeconds = seconds % 60;
		if (hours > 0) {
			setElapsed(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`);
			return;
		}

		setElapsed(`${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`);
	};

	const startElapsedTimer = () => {
		startedAtRef.current = performance.now();
		updateElapsed();
		if (elapsedTimerRef.current) {
			window.clearInterval(elapsedTimerRef.current);
		}

		elapsedTimerRef.current = window.setInterval(() => {
			updateElapsed();
		}, 1000);
	};

	const stopElapsedTimer = () => {
		if (elapsedTimerRef.current) {
			window.clearInterval(elapsedTimerRef.current);
			elapsedTimerRef.current = null;
		}
	};

	const pasteFromClipboard = async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (text) {
				setUrlText(text);
				addStatus('Clipboard content pasted into the URL box.');
			}
		} catch {
			addStatus('Clipboard access denied. Paste manually instead.');
		}
	};

	const handleDrop = (event: DragEvent<HTMLTextAreaElement>) => {
		event.preventDefault();
		const text = event.dataTransfer.getData('text/plain');
		if (text) {
			setUrlText(text);
			addStatus('Dropped content added to the URL box.');
		}
	};

	const downloadFullRepository = async (options: {
		signal: AbortSignal;
		user: string;
		repository: string;
		gitReference?: string;
		downloadUrl: string;
		isPrivate: boolean;
	}) => {
		const filenameFromInput = filename.trim();
		const defaultName = buildDefaultFilename({
			user: options.user,
			repository: options.repository,
			gitReference: options.gitReference,
			directory: '',
		});
		const zipName = ensureZipFilename(filenameFromInput || defaultName);

		if (options.isPrivate) {
			addStatus('Downloading private repository archive with token.');
			const response = await authenticatedFetch(options.downloadUrl, {signal: options.signal});
			if (!response.ok) {
				throw new Error(`HTTP ${response.status} while downloading archive`);
			}

			const blob = await response.blob();
			setTotalFiles(1);
			setDownloadedFiles(1);
			setProgressLabel('Archive downloaded');
			saveFile(blob, zipName);
			addStatus(`Saved ${zipName}`);
			return;
		}

		if (filenameFromInput.length > 0) {
			addStatus('Note: GitHub controls the filename for public repository archives.');
		}

		setTotalFiles(1);
		setDownloadedFiles(1);
		setProgressLabel('Starting archive download in browser...');
		window.location.assign(options.downloadUrl);
		addStatus('GitHub archive download started in a new request.');
	};

	const downloadDirectory = async (options: {
		signal: AbortSignal;
		user: string;
		repository: string;
		gitReference: string;
		directory: string;
		isPrivate: boolean;
		filter: string[];
	}) => {
		addStatus('Retrieving directory file list...');
		const files = await listFiles({
			user: options.user,
			repository: options.repository,
			ref: options.gitReference,
			directory: options.directory,
			token: token || undefined,
			getFullData: true,
		});

		if (files.length === 0) {
			setTotalFiles(0);
			setDownloadedFiles(0);
			setProgressLabel('No files in this directory');
			addStatus('No files found.');
			return;
		}

		const filteredFiles = filterFiles(files, options.filter);
		if (filteredFiles.length === 0) {
			addStatus('No files matched the selected filter.');
			return;
		}

		if (filteredFiles.some(file => blockedWords.test(file.path))) {
			throw new Error('Suspicious filename found. Download canceled.');
		}

		setTotalFiles(filteredFiles.length);
		setDownloadedFiles(0);
		setEstimatedBytes(estimateBytes(filteredFiles));
		setProgressLabel(`Found ${filteredFiles.length} files`);

		const zipPromise = getZip();
		const parsedConcurrency = Number.parseInt(concurrency, 10);
		const safeConcurrency = Number.isNaN(parsedConcurrency) ? 20 : Math.max(1, Math.min(40, parsedConcurrency));
		addStatus(`Downloading ${filteredFiles.length} files with concurrency ${safeConcurrency}...`);

		let failures: string[] = [];
		setFailedFiles([]);

		const downloadBatch = async (batch: RepoFile[], label: string) => {
			addStatus(label);
			await pMap(batch, async file => {
				try {
					const blob = await downloadFile({
						user: options.user,
						repository: options.repository,
						reference: options.gitReference,
						file,
						isPrivate: options.isPrivate,
						signal: options.signal,
					});

					const zip = await zipPromise;
					const relativePath = options.directory ? file.path.replace(`${options.directory}/`, '') : file.path;
					zip.file(relativePath, blob, {binary: true});

					setDownloadedFiles(current => {
						const next = current + 1;
						setProgressLabel(`Downloaded ${next}/${filteredFiles.length}`);
						return next;
					});
				} catch (error) {
					if (options.signal.aborted || isAbortError(error)) {
						throw error;
					}

					failures = [...failures, file.path];
					setFailedFiles([...failures]);
				}
			}, {concurrency: safeConcurrency});
		};

		try {
			await downloadBatch(filteredFiles, 'Downloading files...');
			if (failures.length > 0) {
				const retryTargets = filteredFiles.filter(file => failures.includes(file.path));
				failures = [];
				setFailedFiles([]);
				await downloadBatch(retryTargets, 'Retrying failed files...');
			}
		} catch (error) {
			if (options.signal.aborted || isAbortError(error)) {
				throw new DOMException('Canceled', 'AbortError');
			}

			if (!navigator.onLine) {
				throw new Error('Network connection was lost while downloading files.');
			}

			if (isError(error) && error.message.startsWith('HTTP ')) {
				throw new Error('One or more files could not be downloaded from GitHub.');
			}

			throw error;
		}

		addStatus('Creating zip archive...');
		const zip = await zipPromise;
		const zipBlob = await zip.generateAsync({type: 'blob'});
		const fallbackName = buildDefaultFilename({
			user: options.user,
			repository: options.repository,
			gitReference: options.gitReference,
			directory: options.directory,
		});
		const zipFilename = ensureZipFilename(filename.trim() || fallbackName);
		saveFile(zipBlob, zipFilename);
		setProgressLabel('Download complete');
		addStatus(`Saved ${zipFilename}`);
	};

	const pushRecentUrl = (url: string) => {
		setRecentUrls(prev => {
			const next = [url, ...prev.filter(item => item !== url)].slice(0, 7);
			localStorage.setItem(recentStorageKey, JSON.stringify(next));
			return next;
		});
	};

	const runDownload = async (rawUrl: string, filenameOverride?: string, filterOverride?: string) => {
		const normalizedUrl = parseGithubUrl(rawUrl);
		if (!normalizedUrl) {
			addStatus(`Invalid URL skipped: ${rawUrl}`);
			return;
		}

		if (blockedWords.test(normalizedUrl)) {
			addStatus('Blocked keywords detected in URL.');
			return;
		}

		if (!navigator.onLine) {
			addStatus('You are offline. Connect to the internet and retry.');
			return;
		}

		clearStatus();
		setIsBusy(true);
		startElapsedTimer();
		addStatus('Preparing download request...');
		setProgressLabel('Validating repository URL...');

		const controller = new AbortController();
		controllerRef.current = controller;

		try {
			const parsedPath = await getRepositoryInfo(normalizedUrl);
			if ('error' in parsedPath) {
				addStatus(parseErrorMessage(parsedPath.error));
				return;
			}

			const {user, repository, directory, isPrivate} = parsedPath;
			addStatus(`Repository: ${user}/${repository}`);
			addStatus(`Directory: /${directory || '(root)'}`);
			pushRecentUrl(normalizedUrl);

			if (isPrivate && !token) {
				addStatus('Private repository detected. Please add a token to continue.');
				return;
			}

			if ('downloadUrl' in parsedPath) {
				if (filenameOverride) {
					setFilename(filenameOverride);
				}

				await downloadFullRepository({
					signal: controller.signal,
					user,
					repository,
					gitReference: parsedPath.gitReference,
					downloadUrl: parsedPath.downloadUrl,
					isPrivate,
				});
				return;
			}

			if (filenameOverride) {
				setFilename(filenameOverride);
			}

			const filter = filterOverride ? parseFilter(filterOverride) : parseFilter(filterText);
			await downloadDirectory({
				signal: controller.signal,
				user,
				repository,
				gitReference: parsedPath.gitReference,
				directory,
				isPrivate,
				filter,
			});
		} catch (error) {
			if (controller.signal.aborted || isAbortError(error)) {
				addStatus('Download canceled by user.');
				setProgressLabel('Canceled');
				return;
			}

			if (isError(error)) {
				switch (error.message) {
					case 'Invalid token': {
						addStatus('The token is invalid or revoked.');
						break;
					}

					case 'Rate limit exceeded': {
						addStatus('GitHub rate limit exceeded. Add token or wait and retry.');
						break;
					}

					default: {
						addStatus(`Error: ${error.message}`);
						break;
					}
				}
			} else {
				addStatus('Unexpected error occurred. Please retry.');
			}
		} finally {
			stopElapsedTimer();
			updateElapsed();
			setIsBusy(false);
			controllerRef.current = null;

			// Persist stats to localStorage for cross-page sharing
			persistStats({
				totalFiles,
				downloadedFiles,
				elapsed,
				estimatedBytes,
				failedFiles: failedFiles.length,
			});
		}
	};

	const processQueue = async () => {
		if (isProcessingQueueRef.current) {
			return;
		}

		isProcessingQueueRef.current = true;
		while (queueRef.current.length > 0) {
			const item = queueRef.current[0];
			queueRef.current = queueRef.current.slice(1);
			setQueueItems(queueRef.current);
			persistQueue(queueRef.current);

			if (!item) {
				break;
			}

			setProcessingUrl(item.url);
			// eslint-disable-next-line no-await-in-loop -- Sequential queue processing is intentional
			await runDownload(item.url, item.filename, item.filter);
		}

		setProcessingUrl(null);
		isProcessingQueueRef.current = false;
	};

	const addToQueue = () => {
		const urls = parseUrlList(urlText);
		if (urls.length === 0) {
			addStatus('Enter at least one valid GitHub URL.');
			return;
		}

		const nextItems = urls.map(url => ({
			url,
			filename: filename.trim() || undefined,
			filter: filterText.trim() || undefined,
		}));

		setQueueItems(prev => {
			const merged = [...prev, ...nextItems];
			queueRef.current = merged;
			persistQueue(merged);
			return merged;
		});
		addStatus(`Added ${urls.length} URL(s) to the queue.`);
		processQueue().catch(error => {
			console.error(error);
		});
	};

	const handleCancel = () => {
		controllerRef.current?.abort();
		clearStatus();
	};

	const clearQueueItems = () => {
		queueRef.current = [];
		setQueueItems([]);
		localStorage.removeItem(queueStorageKey);
		addStatus('Queue cleared.');
	};

	const removeQueueItem = (index: number) => {
		const updated = queueItems.filter((_, i) => i !== index);
		queueRef.current = updated;
		setQueueItems(updated);
		persistQueue(updated);
	};

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const urls = parseUrlList(urlText);
		if (urls.length === 0) {
			addStatus('Enter at least one valid GitHub URL.');
			return;
		}

		// Download the first URL instantly — no queue detour
		const targetUrl = urls[0]!;
		pushRecentUrl(targetUrl);
		runDownload(
			targetUrl,
			filename.trim() || undefined,
			filterText.trim() || undefined,
		).catch(error => {
			console.error(error);
		});
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			const urls = parseUrlList(urlText);
			if (urls.length === 0) {
				addStatus('Enter at least one valid GitHub URL.');
				return;
			}

			const targetUrl = urls[0]!;
			pushRecentUrl(targetUrl);
			runDownload(
				targetUrl,
				filename.trim() || undefined,
				filterText.trim() || undefined,
			).catch(error => {
				console.error(error);
			});
		}
	};

	useEffect(() => {
		const query = new URLSearchParams(location.search);
		const url = query.get('url');
		const filenameParam = query.get('filename');
		if (url) {
			setUrlText(url);
			setFilename(filenameParam ?? '');
			addStatus('URL detected in query parameters. Auto-starting download...');
			runDownload(url, filenameParam ?? undefined, undefined).catch(error => {
				console.error(error);
			});
		}
	}, []);

	// Derived UI state for status panel
	const latestStatus = statusLines[0] ?? '';
	const statusIsError = !isBusy && (latestStatus.toLowerCase().includes('error') || latestStatus.toLowerCase().includes('invalid') || latestStatus.toLowerCase().includes('fail'));
	let statusIcon: string;
	let statusColor: string;
	let statusBgBorder: string;
	if (isBusy) {
		statusIcon = 'refresh';
		statusColor = 'primary';
		statusBgBorder = 'bg-primary/5 border-primary/10';
	} else if (statusIsError) {
		statusIcon = 'error';
		statusColor = 'error';
		statusBgBorder = 'bg-error/5 border-error/10';
	} else {
		statusIcon = 'check_circle';
		statusColor = 'tertiary';
		statusBgBorder = 'bg-tertiary/5 border-tertiary/10';
	}

	// Persist failed files for cross-page viewing
	useEffect(() => {
		persistFailedFiles(failedFiles);
	}, [failedFiles]);

	void statusLines;
	void recentUrls;
	void processingUrl;

	const queueItemsCount = queueItems.length;

	return (
		<>
			{/* Fixed Header */}
			<header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-surface-container-low/70 backdrop-blur-md border-b border-outline-variant/20 flex justify-between items-center px-4 md:px-8 py-3 md:py-4">
				<a href="index.html" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
					<span className="material-symbols-outlined text-primary text-lg md:text-2xl" style={{fontVariationSettings: '\'FILL\' 1'}}>folder_zip</span>
					<h1 className="text-headline-md font-bold tracking-tight text-primary">GitFetch</h1>
				</a>
				<nav className="hidden lg:flex items-center gap-1">
					<a href="index.html" className="px-3 py-2 lg:py-1.5 rounded-lg font-medium text-sm transition-all text-primary bg-primary/10">Download</a>
					<a href="queue.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Queue</a>
					<a href="session.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Session</a>
					<a href="activity.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Activity</a>
					<a href="about.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">About</a>
					<a href="source.html" className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all text-on-surface-variant/80 hover:text-primary hover:bg-black/5">Source</a>
				</nav>
				<div className="flex items-center gap-2">
					<a href="source.html" className="p-2.5 md:p-2 rounded-full hover:bg-black/5 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
						<span className="material-symbols-outlined text-[20px]">code</span>
					</a>
					<a href="source.html" className="p-2.5 md:p-2 rounded-full hover:bg-black/5 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
						<span className="material-symbols-outlined text-[20px]">account_circle</span>
					</a>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-grow pt-24 md:pt-28 pb-32 md:pb-20 px-4 md:px-8 max-w-container-max mx-auto w-full relative">
				{/* Ambient Background */}
				<div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20 overflow-hidden">
					<div className="absolute top-[-10%] right-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] bg-primary/20 rounded-full blur-[80px] md:blur-[120px] animate-float"></div>
					<div className="absolute bottom-[10%] left-[5%] w-[200px] h-[200px] md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px] bg-tertiary/15 rounded-full blur-[60px] md:blur-[100px]" style={{animationDelay: '3s'}}></div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start">
					{/* Left Column */}
					<div className="lg:col-span-8 space-y-5 md:space-y-8">
						{/* Hero Section */}
						<section className="space-y-2 md:space-y-3">
							<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Directory Downloader</h2>
							<p className="text-on-surface-variant font-body-lg opacity-80">Download subdirectories from GitHub as a ZIP archive instantly.</p>
						</section>

						{/* Input Area — Form */}
						<form onSubmit={onSubmit} onKeyDown={onKeyDown} className="glass-panel p-4 md:p-6 rounded-2xl space-y-4 md:space-y-6">
							<div className="space-y-2">
								<div className="flex justify-between items-center px-1">
									<label className="font-label-mono text-label-mono text-on-surface-variant/70 uppercase tracking-widest">Source URLs</label>
									<span className="text-[11px] text-primary/60 font-medium">Supports multiple lines</span>
								</div>
								<textarea
									className="w-full h-32 md:h-44 glass-input rounded-xl p-3 md:p-4 font-label-mono text-xs md:text-sm leading-relaxed resize-none shadow-inner"
									placeholder="https://github.com/owner/repo/tree/branch/folder"
									value={urlText}
									onChange={event => setUrlText(event.target.value)}
									onDrop={handleDrop}
									onDragOver={event => event.preventDefault()}
									disabled={isBusy}
								/>
							</div>
							<div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
								<button
									type="submit"
									className="px-4 md:px-6 py-3 btn-primary-gradient text-on-primary rounded-xl font-bold flex items-center gap-2 hover:opacity-95 transition-all active:scale-[0.98] shadow-sm w-full sm:w-auto min-w-0 md:min-w-[200px] justify-center min-h-[44px]"
									disabled={isBusy}
								>
									{isBusy ? (
										<span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
									) : (
										<span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: '\'FILL\' 1'}}>download</span>
									)}
									{isBusy ? 'Downloading...' : 'Download directory'}
								</button>
								<button
									type="button"
									className="px-4 md:px-5 py-3 glass-panel !bg-white/40 border-outline-variant/20 text-primary rounded-xl font-bold flex items-center gap-2 hover:bg-white/60 transition-all active:scale-[0.98] w-full sm:w-auto justify-center min-h-[44px]"
									onClick={addToQueue}
									disabled={isBusy}
								>
									<span className="material-symbols-outlined text-[20px]">add_to_queue</span>
									Add to queue
								</button>
								<div className="flex-grow"></div>
								<button
									type="button"
									className="px-3 md:px-4 py-2.5 text-on-surface-variant hover:text-primary rounded-lg font-semibold flex items-center gap-2 hover:bg-black/5 transition-all text-xs md:text-sm w-full sm:w-auto justify-center"
									onClick={() => {
										pasteFromClipboard().catch(error => {
											console.error(error);
										});
									}}
								>
									<span className="material-symbols-outlined text-[18px]">content_paste</span>
									Paste clipboard
								</button>
							</div>
						</form>

						{/* Live Status */}
						{(isBusy || statusLines.length > 0) && (
							<div className={`rounded-2xl p-4 flex items-start gap-3 transition-all border ${statusBgBorder}`}>
								<span className={`material-symbols-outlined text-[20px] mt-0.5 text-${statusColor}${isBusy ? ' animate-spin' : ''}`}>
									{statusIcon}
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-on-surface">
										{latestStatus || (isBusy ? 'Starting download...' : 'Ready')}
									</p>
									{isBusy && downloadedFiles > 0 && totalFiles > 0 && (
										<div className="mt-2 w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
											<div
												className="h-full bg-primary rounded-full transition-all duration-300"
												style={{width: `${Math.round((downloadedFiles / totalFiles) * 100)}%`}}
											/>
										</div>
									)}
									{isBusy && (
										<p className="text-[11px] text-on-surface-variant/60 mt-1">
											{downloadedFiles} / {totalFiles} files · {elapsed} elapsed
										</p>
									)}
								</div>
								{isBusy && (
									<button
										type="button"
										className="shrink-0 p-2.5 rounded-lg hover:bg-black/5 transition-colors text-on-surface-variant/60 hover:text-error"
										onClick={handleCancel}
										title="Cancel download"
									>
										<span className="material-symbols-outlined text-[18px]">close</span>
									</button>
								)}
							</div>
						)}

						{/* Compact Queue Panel */}
						{queueItems.length > 0 && (
							<div className="glass-panel p-4 md:p-5 rounded-2xl space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="material-symbols-outlined text-primary text-[20px]">queue</span>
										<h3 className="font-bold text-sm text-on-surface">Queue</h3>
										<span className="text-[11px] font-label-mono text-on-surface-variant/50 bg-on-surface/5 px-2 py-0.5 rounded-full">{queueItemsCount}</span>
									</div>
									<button
										type="button"
										className="text-[11px] font-semibold text-on-surface-variant/60 hover:text-error transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px]"
										onClick={clearQueueItems}
									>
										<span className="material-symbols-outlined text-[14px]">delete_sweep</span>
										Clear
									</button>
								</div>
								<div className="space-y-1.5 max-h-[260px] overflow-y-auto">
									{queueItems.map((item, index) => (
										<div
											key={`${item.url}-${index}`}
											className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.03] group/item"
										>
											<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${index === 0 && isBusy ? 'bg-primary animate-pulse' : 'bg-on-surface/20'}`}></span>
											<span className="flex-1 text-[12px] font-label-mono text-on-surface-variant/80 truncate" title={item.url}>
												{item.url}
											</span>
											{index === 0 && isBusy && (
												<span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider shrink-0">Active</span>
											)}
											<button
												type="button"
												className="p-2 rounded hover:bg-black/5 text-on-surface-variant/40 hover:text-error sm:opacity-0 sm:group-hover/item:opacity-100 sm:transition-opacity"
												title="Remove from queue"
												onClick={() => removeQueueItem(index)}
											>
												<span className="material-symbols-outlined text-[14px]">close</span>
											</button>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Workflow Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
							<div className="glass-panel p-4 md:p-5 rounded-2xl flex flex-col gap-3 group hover:border-primary/20 transition-all">
								<div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</div>
								<h4 className="font-bold text-on-surface">Paste URL</h4>
								<p className="text-body-sm text-on-surface-variant/80">Paste the GitHub folder link from your browser address bar.</p>
							</div>
							<div className="glass-panel p-4 md:p-5 rounded-2xl flex flex-col gap-3 group hover:border-primary/20 transition-all">
								<div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</div>
								<h4 className="font-bold text-on-surface">Set Filters</h4>
								<p className="text-body-sm text-on-surface-variant/80">Configure download speed and exclude unnecessary file patterns.</p>
							</div>
							<div className="glass-panel p-4 md:p-5 rounded-2xl flex flex-col gap-3 group hover:border-primary/20 transition-all">
								<div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">3</div>
								<h4 className="font-bold text-on-surface">Save ZIP</h4>
								<p className="text-body-sm text-on-surface-variant/80">Get a perfectly structured ZIP archive processed in-browser.</p>
							</div>
						</div>

						{/* Secondary Inputs Bento */}
						<div className="glass-panel p-4 md:p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-4 md:gap-y-5">
							<div className="space-y-2">
								<label className="font-label-mono text-label-mono text-on-surface-variant/70 uppercase">Output filename</label>
								<input
									className="w-full glass-input rounded-xl px-4 py-3 text-sm font-medium"
									placeholder="archive.zip"
									type="text"
									value={filename}
									onChange={event => setFilename(event.target.value)}
									disabled={isBusy}
								/>
							</div>
							<div className="space-y-2">
								<label className="font-label-mono text-label-mono text-on-surface-variant/70 uppercase">Download speed</label>
								<div className="relative">
									<select
										className="w-full glass-input rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm appearance-none cursor-pointer"
										value={concurrency}
										onChange={event => setConcurrency(event.target.value)}
										disabled={isBusy}
									>
										<option value="20">Fast (20 parallel requests)</option>
										<option value="10">Medium (10 parallel requests)</option>
										<option value="5">Slow (5 parallel requests)</option>
									</select>
									<span className="material-symbols-outlined absolute right-2 md:right-3 top-1.5 md:top-2.5 pointer-events-none text-on-surface-variant/50 text-[20px]">expand_more</span>
								</div>
							</div>
							<div className="space-y-2">
								<label className="font-label-mono text-label-mono text-on-surface-variant/70 uppercase">File type filter</label>
								<input
									className="w-full glass-input rounded-xl px-4 py-3 text-sm font-label-mono"
									placeholder="*.js, *.md, !*.log"
									type="text"
									value={filterText}
									onChange={event => setFilterText(event.target.value)}
									disabled={isBusy}
								/>
							</div>
							<div className="space-y-2">
								<label className="font-label-mono text-label-mono text-on-surface-variant/70 uppercase">GitHub Token (Private Repos)</label>
								<div className="relative">
									<input
										className="w-full glass-input rounded-xl px-4 py-3 pr-10 text-sm font-label-mono"
										placeholder="ghp_xxxxxxxxxxxx"
										type={tokenVisible ? 'text' : 'password'}
										value={token}
										onChange={event => setToken(event.target.value)}
										disabled={isBusy}
									/>
									<button
										type="button"
										className="absolute right-1 top-1 p-2 text-on-surface-variant/40 hover:text-primary cursor-pointer transition-colors"
										onClick={() => setTokenVisible(v => !v)}
									>
										<span className="material-symbols-outlined text-[20px]">{tokenVisible ? 'visibility_off' : 'visibility'}</span>
									</button>
								</div>
							</div>
						</div>

						{/* Features Horizontal */}
						<div className="flex flex-col sm:flex-row md:flex-row justify-between items-start gap-4 md:gap-8 px-1 sm:px-2">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
									<span className="material-symbols-outlined text-[20px]">checklist</span>
								</div>
								<div>
									<h4 className="font-bold text-sm">Batch Queue</h4>
									<p className="text-[12px] text-on-surface-variant/70">Sequential processing.</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-tertiary/5 text-tertiary flex items-center justify-center shrink-0">
									<span className="material-symbols-outlined text-[20px]">filter_alt</span>
								</div>
								<div>
									<h4 className="font-bold text-sm">Smart Filters</h4>
									<p className="text-[12px] text-on-surface-variant/70">Glob-style patterns.</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-on-surface/5 text-on-surface-variant flex items-center justify-center shrink-0">
									<span className="material-symbols-outlined text-[20px]">lock_person</span>
								</div>
								<div>
									<h4 className="font-bold text-sm">Privacy First</h4>
									<p className="text-[12px] text-on-surface-variant/70">Client-side execution.</p>
								</div>
							</div>
						</div>

						{/* Architecture Info */}
						<div className="bg-primary/[0.03] border border-primary/10 p-4 md:p-5 rounded-2xl flex gap-4">
							<span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
							<div>
								<h4 className="font-bold text-sm mb-1">Architecture</h4>
								<p className="text-sm text-on-surface-variant/80 leading-relaxed">Parallel file fetch, automatic retries, and streaming zip creation directly in your browser. No server-side storage or bottlenecks.</p>
							</div>
						</div>
					</div>

					{/* Right Column: Stats Sidebar */}
					<aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
						<div className="glass-panel p-4 md:p-6 rounded-2xl shadow-md border-white/40">
							<div className="flex justify-between items-center mb-6">
								<div>
									<h3 className="font-bold text-headline-md tracking-tight">Stats</h3>
									<p className="text-[12px] text-on-surface-variant/60 font-medium uppercase tracking-wider">Live Activity</p>
								</div>
								<div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border ${isBusy ? 'bg-primary/10 text-primary border-primary/10' : 'bg-tertiary/10 text-tertiary border-tertiary/10'}`}>
									<span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-primary animate-pulse' : 'bg-tertiary animate-pulse'}`}></span>
									{isBusy ? progressLabel : 'IDLE'}
								</div>
							</div>
							<div className="space-y-1">
								<div className="flex justify-between items-center p-3 rounded-xl hover:bg-black/[0.02] transition-colors">
									<span className="text-on-surface-variant text-sm flex items-center gap-3">
										<span className="material-symbols-outlined text-[18px] opacity-60">search_insights</span>
										Files found
									</span>
									<span className="font-label-mono font-bold text-sm">{totalFiles}</span>
								</div>
								<div className="flex justify-between items-center p-3 rounded-xl hover:bg-black/[0.02] transition-colors">
									<span className="text-on-surface-variant text-sm flex items-center gap-3">
										<span className="material-symbols-outlined text-[18px] opacity-60">cloud_download</span>
										Downloaded
									</span>
									<span className="font-label-mono font-bold text-sm">{downloadedFiles}</span>
								</div>
								<div className="flex justify-between items-center p-3 rounded-xl hover:bg-black/[0.02] transition-colors">
									<span className="text-on-surface-variant text-sm flex items-center gap-3">
										<span className="material-symbols-outlined text-[18px] opacity-60">schedule</span>
										Time elapsed
									</span>
									<span className="font-label-mono font-bold text-sm">{elapsed}</span>
								</div>
								<div className="flex justify-between items-center p-3 rounded-xl hover:bg-black/[0.02] transition-colors">
									<span className="text-on-surface-variant text-sm flex items-center gap-3">
										<span className="material-symbols-outlined text-[18px] opacity-60">data_usage</span>
										Est. Size
									</span>
									<span className="font-label-mono font-bold text-sm">{formattedEstimate}</span>
								</div>
								<div className="flex justify-between items-center p-3 rounded-xl hover:bg-black/[0.02] transition-colors">
									<span className="text-on-surface-variant text-sm flex items-center gap-3">
										<span className="material-symbols-outlined text-[18px] opacity-60 text-error">report_problem</span>
										Failed
									</span>
									<span className="font-label-mono font-bold text-sm text-error">{failedFiles.length}</span>
								</div>
							</div>
							<div className="mt-6 pt-6 border-t border-outline-variant/10 space-y-6">
								<div className="relative">
									<span className="absolute -left-2 -top-2 text-4xl text-primary/10 font-serif leading-none">&#8220;</span>
									<p className="italic text-on-surface-variant/80 text-[13px] leading-relaxed pl-3 border-l border-primary/20">
										The fastest way I've found to package a subfolder and move on with my workflow.
									</p>
									<p className="mt-2 pl-3 font-bold text-[12px] text-on-surface">&mdash; EliTechWiz</p>
								</div>
								<div className="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.02] border border-black/[0.03]">
									<img
										alt="EliTechWiz profile"
										className="w-10 h-10 rounded-xl border border-white/40 shadow-sm object-cover"
										src="https://lh3.googleusercontent.com/aida-public/AB6AXuCg9Nq-9FTls5jOT-MQPD5RTC5cg_7fAkeN-E3tO2gTWOvuhSaZIribIXIbA6tauR9P06Cm4c9ZR8y6vu2Hj54iSkdPschwvNXaMXxjlJJlWaXH1_0RWh0xlvUTVIwjA1FWdl4AaRN-QJx_voIdPqnJP6B9xJsMWUP-YVVNqZ3ZmgYmmKVDaxFuca0KyTixGxKCzo7uZ4qeAAJ3lWLt_t9A6aRtkO8B8RIfQgybXFRme7Gc4vevHDvgsL9Hoe0ISBChNCE3YyMR_ODc"
									/>
									<div className="flex flex-col">
										<h5 className="font-bold text-[13px]">EliTechWiz</h5>
										<p className="text-[11px] text-on-surface-variant/60">Software Architect</p>
									</div>
								</div>
							</div>
						</div>
					</aside>
				</div>
			</main>

			{/* Footer */}
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
						<div className="text-on-surface-variant/40 text-[12px] font-medium">
							&copy; 2024 EliTechWiz
						</div>
					</div>
				</div>
			</footer>

			{/* Bottom Mobile Nav */}
			<nav className="lg:hidden fixed bottom-4 left-4 right-4 backdrop-blur-xl bg-white/90 border-t border-white/30 !rounded-full flex justify-between items-center py-3 px-2 sm:px-4 z-50 shadow-xl gap-1">
				<a href="index.html" className="flex flex-col items-center gap-0.5 text-primary">
					<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>download</span>
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
