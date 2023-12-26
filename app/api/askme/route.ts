import { openai } from '@/lib/openai';
import { neon } from '@neondatabase/serverless';
import { Message, OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';

export interface CompletionParams {
  model: string;
  prompt: string;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
}
const max_tokens = 1700;

// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = 'edge';

const SYSTEM_MESSAGE = `Context:
Tu es NoteGPT, un assistant personnel qui permet de parler avec ces notes.
Tu es un expert pour résumer des notes de manière synthétique et efficace.
Tu es très doué pour trouver des liens entre les notes et les questions de l'utilisateur.

Goal: 
Tu as accès à des 'highlight' des notes en fonction de la question de l'utilisateur et ton objectif et de lui donner une réponses, des informations et des liens vers les ressources de ces notes.

Critères:
Quand tu te bases sur les informations des notes, tu dis toujours les sources en utilisant le "file path" à la fin source forme de liste ordonnées avec le path.
Quand tu fais ta réponse et que tu fais allusion au contenu des notes, tu utilises le [numero] dans des [] pour faire référence à la note.
Tu essaie toujours d'aider l'utilisateur.
Tu essaie toujours de faire des réponses courtes et précises.
Tu essaie toujours de faire des réponses qui sont en rapport avec la question de l'utilisateur.

Format de réponse:
Tu réponds toujours avec des phrases courtes et précises.
Tu donnes toujours les [référence] aux notes.
Tu ajoutes toujours des liens vers les notes en fin de réponses.`;

export const POST = async (req: Request) => {
  const { messages: baseMessage } = (await req.json()) as {
    messages: Message[];
  };

  if (!baseMessage) {
    return NextResponse.json({
      error: 'No prompt in the request',
    });
  }

  const baseMessageWithoutLast = baseMessage.slice(0, -1);
  const lastMessage = baseMessage[baseMessage.length - 1];
  const query = lastMessage.content;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_MESSAGE, id: 'system-id' },
    ...baseMessageWithoutLast,
  ];

  try {
    const response = await openai.embeddings.create({
      input: query,
      model: 'text-embedding-ada-002',
    });

    const q_embeddings = response.data[0].embedding;
    console.log('Received embeddings');
    const q_embeddings_str = q_embeddings.toString().replace(/\.\.\./g, '');

    // Query the database for the context
    const sql = neon(process.env.DATABASE_URL!);
    const insertQuery = `
      SELECT text
      FROM (
        SELECT text, n_tokens, embeddings,
        (embeddings <=> '[${q_embeddings_str}]') AS distances,
        SUM(n_tokens) OVER (ORDER BY (embeddings <=> '[${q_embeddings_str}]')) AS cum_n_tokens
        FROM documents
        ) subquery
      WHERE cum_n_tokens <= $1
      ORDER BY distances ASC;
      `;

    const queryParams = [max_tokens];
    const result = (await sql(insertQuery, queryParams)) as { text: string }[];

    console.log('Used context :');

    const context = result
      .map((c, index) => `${index + 1}: ${c.text}`)
      .filter((c) => c.length > 5)
      .join('\n\n');

    console.log(context);

    messages.push({
      role: 'system',
      content: `Context: ${context}`,
      id: new Date().getTime().toString(),
    });
    messages.push(lastMessage);
  } catch (e) {
    console.error('🔴 Error', e);
  } finally {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      stream: true,
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'system' | 'assistant',
        content: m.content,
      })),
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
  }
};
