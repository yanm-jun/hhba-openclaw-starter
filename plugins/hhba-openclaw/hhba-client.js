function normalizeBaseUrl(baseUrl) {
  const raw = String(baseUrl || process.env.HHBA_BASE_URL || "http://127.0.0.1:3218").trim();
  return raw.replace(/\/+$/, "");
}

function buildHeaders(apiToken) {
  return {
    "Content-Type": "application/json",
    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  return JSON.parse(text);
}

export function createHhbaApiClient(config = {}) {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const apiToken = String(config.apiToken || process.env.HHBA_API_TOKEN || "").trim();

  async function request(path, payload) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: payload ? "POST" : "GET",
      headers: buildHeaders(apiToken),
      body: payload ? JSON.stringify(payload) : undefined
    });
    const result = await parseJsonResponse(response);

    if (!response.ok || result.ok === false) {
      throw new Error(result.error || `HHBA request failed: ${response.status}`);
    }

    return result;
  }

  return {
    getTools: () => request("/api/openclaw/tools"),
    createTask: (payload) => request("/api/tasks/create", payload),
    searchCandidates: (payload) => request("/api/candidates/search", payload),
    lockCandidate: (payload) => request("/api/tasks/lock", payload),
    submitResult: (payload) => request("/api/tasks/submit-result", payload),
    updateScore: (payload) => request("/api/candidates/update-score", payload)
  };
}
