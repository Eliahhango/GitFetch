import authenticatedFetch from './authenticated-fetch.js';
import {getCached, setCache, getEtag, setCacheWithEtag, branchCheckKey, repoInfoKey, BRANCH_TTL, REPO_INFO_TTL} from './api-cache.js';

function cleanUrl(url: string) {
	return url
		.replace(/[/]{2,}/, '/')
		.replace(/[/]$/, '');
}

async function parsePath(
	user: string,
	repo: string,
	parts: string[],
): Promise<{gitReference: string; directory: string} | void> {
	// Try the first segment first (most common: branch is the first path segment, e.g. "main")
	for (let i = 0; i < parts.length; i++) {
		const gitReference = parts.slice(0, i + 1).join('/');
		// eslint-disable-next-line no-await-in-loop -- Sequential checks are intentional
		if (await checkBranchExists(user, repo, gitReference)) {
			return {
				gitReference,
				directory: parts.slice(i + 1).join('/'),
			};
		}
	}
}

export default async function getRepositoryInfo(
	url: string,
): Promise<
	| {error: string}
	| {
		user: string;
		repository: string;
		gitReference?: string;
		directory: string;
		downloadUrl: string;
		isPrivate: boolean;
	}
	| {
		user: string;
		repository: string;
		gitReference: string;
		directory: string;
		isPrivate: boolean;
	}
> {
	const [, user, repository, type, ...parts] = cleanUrl(
		decodeURIComponent(new URL(url).pathname),
	).split('/');

	if (!user || !repository) {
		return {error: 'NOT_A_REPOSITORY'};
	}

	if (type && type !== 'tree') {
		return {error: 'NOT_A_DIRECTORY'};
	}

	// Check cache for repo info
	const cacheKey = repoInfoKey(user, repository);
	let isPrivate: boolean | undefined = getCached<boolean>(cacheKey);

	if (isPrivate === undefined) {
		const etag = getEtag(cacheKey);
		const {response, notModified} = await authenticatedFetch(
			`https://api.github.com/repos/${user}/${repository}`,
			{etag},
		);

		if (response.status === 404) {
			return {error: 'REPOSITORY_NOT_FOUND'};
		}

		if (notModified) {
			// 304 — use cached data, extend TTL
			isPrivate = getCached<boolean>(cacheKey);
			if (isPrivate === undefined) {
				// Shouldn't happen, but fallback
				return {error: 'REPOSITORY_NOT_FOUND'};
			}
		} else {
			const data = await response.json() as {private: boolean};
			isPrivate = data.private;

			const responseEtag = response.headers.get('ETag');
			if (responseEtag) {
				setCacheWithEtag(cacheKey, isPrivate, responseEtag, REPO_INFO_TTL);
			} else {
				setCache(cacheKey, isPrivate, REPO_INFO_TTL);
			}
		}
	}

	if (parts.length === 0) {
		return {
			user,
			repository,
			directory: '',
			isPrivate,
			downloadUrl: `https://api.github.com/repos/${user}/${repository}/zipball`,
		};
	}

	if (parts.length === 1) {
		return {
			user,
			repository,
			gitReference: parts[0],
			directory: '',
			isPrivate,
			downloadUrl: `https://api.github.com/repos/${user}/${repository}/zipball/${parts[0]}`,
		};
	}

	const parsedPath = await parsePath(user, repository, parts);
	if (!parsedPath) {
		return {error: 'BRANCH_NOT_FOUND'};
	}

	return {
		user,
		repository,
		isPrivate,
		...parsedPath,
	};
}

async function checkBranchExists(user: string, repo: string, gitReference: string): Promise<boolean> {
	const cacheKey = branchCheckKey(user, repo, gitReference);
	const cached = getCached<boolean>(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	// Use the commits API with ETag support — returns ETag headers reliably
	const apiUrl = `https://api.github.com/repos/${user}/${repo}/commits/${encodeURIComponent(gitReference)}?per_page=1`;
	const etag = getEtag(cacheKey);
	const {response, notModified} = await authenticatedFetch(apiUrl, {method: 'HEAD', etag});

	if (notModified) {
		// 304 — branch still exists, extend cache
		setCache(cacheKey, true, BRANCH_TTL);
		return true;
	}

	const exists = response.ok;
	if (exists) {
		const responseEtag = response.headers.get('ETag');
		if (responseEtag) {
			setCacheWithEtag(cacheKey, true, responseEtag, BRANCH_TTL);
		} else {
			setCache(cacheKey, true, BRANCH_TTL);
		}
	} else {
		setCache(cacheKey, false, BRANCH_TTL);
	}

	return exists;
}
