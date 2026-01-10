/**
 * Custom fetch mutator for Orval-generated API client.
 *
 * This is required to:
 * 1. Include credentials (cookies) with every request
 * 2. Handle JSON serialization/deserialization
 * 3. Provide consistent error handling
 * 4. Redirect to login on 401 (unauthorized) responses
 *
 * @see https://orval.dev/reference/configuration/output#mutator
 */

interface RequestConfig {
	url: string;
	method: string;
	headers?: Record<string, string>;
	data?: unknown;
}

export async function customFetch<T>(config: RequestConfig, _options?: RequestInit): Promise<T> {
	const response = await fetch(config.url, {
		method: config.method,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...config.headers,
		},
		body: config.data ? JSON.stringify(config.data) : undefined,
	});

	if (response.status === 401) {
		window.location.href = "/login";
		throw new Error("Unauthorized");
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	// Handle empty responses (204, etc)
	const text = await response.text();

	return text ? JSON.parse(text) : ({} as T);
}
