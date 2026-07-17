// Retry delay in ms for transient errors (network blips, 5xx)
const RETRY_DELAYS = [1_000, 2_000, 4_000];

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function authenticatedFetch(
	url: string,
	{signal, method}: {signal?: AbortSignal; method?: 'HEAD'} = {},
): Promise<Response> {
	const token = globalThis.localStorage?.getItem('token');

	for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
		if (signal?.aborted) {
			throw new DOMException('The operation was aborted', 'AbortError');
		}

		try {
			const response = await fetch(url, {
				method,
				signal,
				...(token
					? {
						headers: {
							// eslint-disable-next-line @typescript-eslint/naming-convention
							Authorization: `Bearer ${token}`,
						},
					}
					: {}),
			});

			switch (response.status) {
				case 401: {
					throw new Error('Invalid token');
				}

				case 403:
				case 429: {
					const remaining = response.headers.get('X-RateLimit-Remaining');
					const resetEpoch = response.headers.get('X-RateLimit-Reset');
					const retryAfter = response.headers.get('Retry-After');

					// Only retry if we have a Retry-After header (short-term secondary rate limit)
					// For primary rate limit (X-RateLimit-Remaining === '0'), fail fast
					if (remaining === '0' || response.status === 429) {
						if (retryAfter) {
							// Secondary rate limit — short wait usually helps
							if (attempt < RETRY_DELAYS.length) {
								const delay = Number.parseInt(retryAfter, 10) * 1000;
								await sleep(delay);
								continue;
							}
						}

						// Primary rate limit — build a helpful error message
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

					// Non-rate-limit 403 — don't retry
					break;
				}

				default:
			}

			return response;
		} catch (error) {
			// Don't retry abort errors
			if (error instanceof DOMException && error.name === 'AbortError') {
				throw error;
			}

			// Don't retry rate limit errors — we already built a good message
			if (error instanceof Error && error.message.startsWith('GitHub API rate limit')) {
				throw error;
			}

			// Retry network errors (Failed to fetch) and 5xx server errors
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
