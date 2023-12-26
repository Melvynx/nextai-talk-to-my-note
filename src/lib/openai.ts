// Optional, but recommended: run on the edge runtime.

import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
