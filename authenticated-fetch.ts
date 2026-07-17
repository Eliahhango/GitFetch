// Retry delay in ms: 1s, 2s, 4s, 8s, 16s — max ~31s total wait
const RETRY_DELAYS = [1_000, 2_000, 4_000, 8_000, 16_000];

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function authenticatedFetch(
	url: string,
	{signal, method}: {signal?: AbortSignal; method?: 'HEAD'} = {},
): Promise<Response> {
	const token = globalThis.localStorage?.getItem('token');

	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
		// Check for abort before each attempt
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
					// Check if this is a rate limit response
					const remaining = response.headers.get('X-RateLimit-Remaining');
					const retryAfter = response.headers.get('Retry-After');

					if (remaining === '0' || response.status === 429) {
						// Rate limited — wait and retry
						if (attempt < RETRY_DELAYS.length) {
							const delay = retryAfter
								? Number.parseInt(retryAfter, 10) * 1000
								: RETRY_DELAYS[attempt]!;

							lastError = new Error('Rate limit exceeded');
							await sleep(delay);
							continue;
						}

						throw new Error('Rate limit exceeded');
					}

					// Non-rate-limit 403 (e.g., forbidden resource) — don't retry
					break;
				}

				default:
			}

			return response;
		} catch (error) {
			// Don't retry abort errors or non-rate-limit errors
			if (error instanceof DOMException && error.name === 'AbortError') {
				throw error;
			}

			if (error instanceof TypeError && error.message === 'Failed to fetch') {
				// Network error — retry
				if (attempt < RETRY_DELAYS.length) {
					lastError = error as Error;
					await sleep(RETRY_DELAYS[attempt]!);
					continue;
				}
			}

			throw error;
		}
	}

	throw lastError ?? new Error('Request failed after multiple retries');
}
