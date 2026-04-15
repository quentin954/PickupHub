export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<unknown> => {
  const response = await fetch(url, options);

  if (response.status === 429 && retries > 0) {
    console.log('Rate limited. Retrying after 30 seconds...');
    await sleep(30000);
    return fetchWithRetry(url, options, retries - 1);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  return response.json();
};