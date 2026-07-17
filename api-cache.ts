// In-memory cache with TTL for GitHub API responses
// Reduces redundant API calls and avoids rate limit exhaustion

const cache = new Map<string, {data: unknown; expiresAt: number}>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const BRANCH_TTL = 10 * 60 * 1000; // 10 minutes — branches change infrequently
const REPO_INFO_TTL = 10 * 60 * 1000; // 10 minutes
const DIRECTORY_TTL = 2 * 60 * 1000; // 2 minutes — files can change

export function getCached<T>(key: string): T | undefined {
	const entry = cache.get(key);
	if (!entry) {
		return undefined;
	}

	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return undefined;
	}

	return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
	// Limit cache size to 200 entries to avoid memory leaks
	if (cache.size > 200) {
		const oldestKey = cache.keys().next().value;
		if (oldestKey) {
			cache.delete(oldestKey);
		}
	}

	cache.set(key, {data, expiresAt: Date.now() + ttl});
}

export function clearCache(): void {
	cache.clear();
}

// Cache key builders
export function repoInfoKey(user: string, repo: string): string {
	return `repo-info:${user}/${repo}`;
}

export function branchCheckKey(user: string, repo: string, ref: string): string {
	return `branch-check:${user}/${repo}/${ref}`;
}

export function directoryListKey(user: string, repo: string, ref: string, dir: string): string {
	return `dir-list:${user}/${repo}/${ref}/${dir}`;
}

export {BRANCH_TTL, REPO_INFO_TTL, DIRECTORY_TTL};
