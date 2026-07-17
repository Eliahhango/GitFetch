// Retry delay in ms for transient errors (network blips, 5xx)
const RETRY_DELAYS = [1_000, 2_000, 4_000];

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export type FetchOptions = {
	signal?: AbortSignal;
	method?: 'HEAD';
	etag?: string;
};

export type FetchResult = {
	response: Response;
	notModified: boolean;
};

export default async function authenticatedFetch(
	url: string,
	{signal, method, etag}: FetchOptions = {},
): Promise<FetchResult> {
	const token = globalThis.localStorage?.getItem('token');

	for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
		if (signal?.aborted) {
			throw new DOMException('The operation was aborted', 'AbortError');
		}

		try {
			const headers: Record<string, string> = {};

			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}

			if (etag) {
				headers['If-None-Match'] = etag;
			}

			const response = await fetch(url, {
				method,
				signal,
				headers: Object.keys(headers).length > 0 ? headers : undefined,
			});

			// 304 Not Modified — data hasn't changed, doesn't count against rate limit
			if (response.status === 304) {
				return {response, notModified: true};
			}

			switch (response.status) {
				case 401: {
					throw new Error('Invalid token');
				}

				case 403:
				case 429: {
					const remaining = response.headers.get('X-RateLimit-Remaining');
					const resetEpoch = response.headers.get('X-RateLimit-Reset');
					const retryAfter = response.headers.get('Retry-After');

					if (remaining === '0' || response.status === 429) {
						if (retryAfter) {
							if (attempt < RETRY_DELAYS.length) {
								const delay = Number.parseInt(retryAfter, 10) * 1000;
								await sleep(delay);
								continue;
							}
						}

						let message = 'Rate limit exceeded';
						if (resetEpoch) {
							const resetDate = new Date(Number.parseInt(resetEpoch, 10) * 1000);
							const minutesUntilReset = Math.max(1, Math.round((resetDate.getTime() - Date.now()) / 60_000));
							message = `GitHub API rate limit reached. Resets in ~${minutesUntilReset} min. Add a token for 5,000 req/hr.`;
						}

						if (!token) {
							message += ' Unauthenticated: 60 req/hr. Add a GitHub token in the field below.';
						}

						throw new Error(message);
					}

					break;
				}

				default:
			}

			return {response, notModified: false};
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				throw error;
			}

			if (error instanceof Error && error.message.startsWith('GitHub API rate limit')) {
				throw error;
			}

			if (error instanceof TypeError && error.message === 'Failed to fetch') {
				if (attempt < RETRY_DELAYS.length) {
					await sleep(RETRY_DELAYS[attempt]!);
					continue;
				}
			}

			throw error;
		}
	}

	throw new Error('Request failed after multiple retries');
}
