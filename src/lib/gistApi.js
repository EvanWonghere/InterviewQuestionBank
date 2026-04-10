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
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify({ progress: {}, notes: {} }),
        },
      },
    }),
  });
  if (!createRes.ok) throw new Error(`创建 Gist 失败 ${createRes.status}`);
  const created = await createRes.json();
  return created.id;
}

/**
 * Pull synced data from Gist.
 * Returns `{ progress, notes }`. Backwards-compatible with older gists that
 * only contain a `progress` field — missing fields default to `{}`.
 */
export async function pullGist(token, gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`拉取 Gist 失败 ${res.status}`);
  const data = await res.json();
  const content = data.files[GIST_FILENAME]?.content ?? '{}';
  try {
    const parsed = JSON.parse(content);
    return {
      progress: parsed?.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
      notes: parsed?.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    };
  } catch {
    return { progress: {}, notes: {} };
  }
}

/**
 * Push synced data to Gist.
 * @param {string} token
 * @param {string} gistId
 * @param {{ progress: Record<string, string>, notes: Record<string, string> }} payload
 */
export async function pushGist(token, gistId, payload) {
  const body = {
    progress: payload?.progress ?? {},
    notes: payload?.notes ?? {},
  };
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(body) } },
    }),
  });
  if (!res.ok) throw new Error(`推送 Gist 失败 ${res.status}`);
}
