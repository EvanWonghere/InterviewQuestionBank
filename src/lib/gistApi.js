const GIST_DESCRIPTION = 'interview-quiz-progress';
const GIST_FILENAME = 'quiz-progress.json';

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };
}

/** Find an existing progress Gist, or create a new one. Returns gistId. */
export async function findOrCreateGist(token) {
  // Search through existing gists (up to 100)
  const listRes = await fetch('https://api.github.com/gists?per_page=100', {
    headers: headers(token),
  });
  if (!listRes.ok) {
    const msg = listRes.status === 401 ? 'Token 无效或已过期' : `GitHub API 错误 ${listRes.status}`;
    throw new Error(msg);
  }
  const gists = await listRes.json();
  const existing = gists.find(
    (g) => g.description === GIST_DESCRIPTION && g.files[GIST_FILENAME]
  );
  if (existing) return existing.id;

  // Not found — create a new private Gist
  const createRes = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify({ progress: {} }) } },
    }),
  });
  if (!createRes.ok) throw new Error(`创建 Gist 失败 ${createRes.status}`);
  const created = await createRes.json();
  return created.id;
}

/** Pull progress data from Gist. Returns { progress: Record<string, string> } */
export async function pullGist(token, gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`拉取 Gist 失败 ${res.status}`);
  const data = await res.json();
  const content = data.files[GIST_FILENAME]?.content ?? '{"progress":{}}';
  try {
    return JSON.parse(content);
  } catch {
    return { progress: {} };
  }
}

/** Push progress data to Gist. */
export async function pushGist(token, gistId, progress) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify({ progress }) } },
    }),
  });
  if (!res.ok) throw new Error(`推送 Gist 失败 ${res.status}`);
}
