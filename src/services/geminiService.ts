import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY is not defined. AI features will be unavailable.");
    return "dummy-key"; // Prevent crash on initialization
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const summarizeNote = async (content: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the following note content concisely. Maintain the tone but make it a short overview:\n\n${content}`,
  });
  return response.text;
};

export const improveNote = async (content: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Improve the clarity, grammar, and flow of the following note content. Keep it professional yet natural. Return ONLY the improved content:\n\n${content}`,
  });
  return response.text;
};

export const suggestTags = async (title: string, content: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the following note title and content, suggest 3-5 relevant tags as a comma-separated list. Return ONLY the tags:\n\nTitle: ${title}\nContent: ${content}`,
  });
  return response.text?.split(',').map(tag => tag.trim()) || [];
};

export const suggestTitle = async (content: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest a concise, catchy title for the following note content. Return ONLY the title:\n\n${content}`,
  });
  return response.text?.trim() || "";
};

export const generateNoteContent = async (topic: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a detailed, well-structured note about the following topic or prompt: "${topic}". 
    Use markdown formatting for structure (headings, bullet points). 
    Include a clear title at the very beginning starting with '# ' followed by the title.
    The response should be the full note content including the title line.`,
  });
  const text = response.text || "";
  
  let title = "Generated Note";
  let content = text;
  
  if (text.startsWith('# ')) {
    const lines = text.split('\n');
    title = lines[0].replace('# ', '').trim();
    content = lines.slice(1).join('\n').trim();
  }
  
  return { title, content };
};
