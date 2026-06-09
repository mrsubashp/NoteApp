// All Gemini calls go through the local Express proxy (/api/gemini/*).
// The API key is never loaded in the browser — it lives only in server.ts.

async function post<T>(endpoint: string, body: Record<string, string>): Promise<T> {
  const res = await fetch(`/api/gemini/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'AI request failed');
  }
  return res.json() as Promise<T>;
}

export const summarizeNote = async (content: string): Promise<string | undefined> => {
  const { text } = await post<{ text: string }>('summarize', { content });
  return text;
};

export const improveNote = async (content: string): Promise<string | undefined> => {
  const { text } = await post<{ text: string }>('improve', { content });
  return text;
};

export const suggestTags = async (title: string, content: string): Promise<string[]> => {
  const { tags } = await post<{ tags: string[] }>('suggest-tags', { title, content });
  return tags ?? [];
};

export const suggestTitle = async (content: string): Promise<string> => {
  const { text } = await post<{ text: string }>('suggest-title', { content });
  return text ?? '';
};

export const generateNoteContent = async (topic: string): Promise<{ title: string; content: string }> => {
  return post<{ title: string; content: string }>('generate', { topic });
};
