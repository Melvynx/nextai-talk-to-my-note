import { openai } from "@/lib/openai";
import { neon } from "@neondatabase/serverless";
import { Message, OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";

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
export const runtime = "edge";

const SYSTEM_MESSAGE = `Context:
You are ReactExpertGPT, a chatbot that know up to date information about React.
Your task is to create simple, easy to understand responses to questions about React.
You use examples (with code), metaphor and line breaks to make your responses easy to understand.
Your talking to react beginners, so you need to use simple language and avoid jargon.
Make your responses very short and to the point.

Goal:
Create a response to the user's question about React.


Criteria:
To answer the question, I will give you context about the question. You need to use this context to answer the question.
The context always context the URL from the React documentation.
When you use the context, please add your sources at the end of the conversations with the links to the documentation.
If the user asks for questions that is not about React, you should respond with "I am sorry, but I am here to help only with React".

Response format:
* Short
* To the point
* Use examples (with code)
`;

export const POST = async (req: Request) => {
  const { messages: baseMessage } = (await req.json()) as {
    messages: Message[];
  };

  if (!baseMessage) {
    return NextResponse.json({
      error: "No prompt in the request",
    });
  }

  const baseMessageWithoutLast = baseMessage.slice(0, -1);
  const lastMessage = baseMessage[baseMessage.length - 1];
  const query = lastMessage.content;

  const messages: Message[] = [
    { role: "system", content: SYSTEM_MESSAGE, id: "system-id" },
    ...baseMessageWithoutLast,
  ];

  try {
    const response = await openai.embeddings.create({
      input: query,
      model: "text-embedding-ada-002",
    });

    const q_embeddings = response.data[0].embedding;
    console.log("Received embeddings");
    const q_embeddings_str = q_embeddings.toString().replace(/\.\.\./g, "");

    // Query the database for the context
    const sql = neon(process.env.DATABASE_URL!);
    const insertQuery = `
      SELECT text, file_path
      FROM (
        SELECT text, n_tokens, embeddings, file_path,
        (embeddings <=> '[${q_embeddings_str}]') AS distances,
        SUM(n_tokens) OVER (ORDER BY (embeddings <=> '[${q_embeddings_str}]')) AS cum_n_tokens
        FROM documents
        ) subquery
      WHERE cum_n_tokens <= $1
      ORDER BY distances ASC;
      `;

    const queryParams = [max_tokens];
    const result = (await sql(insertQuery, queryParams)) as {
      text: string;
      file_path: string;
    }[];

    const context = result
      .map(
        (c, index) =>
          `${`https://react.dev/${c.file_path
            .replaceAll("-", "/")
            .replaceAll(".txt", "")}`}: ${c.text}`
      )
      .join("\n\n");

    console.log("=== CONTEXT ===");

    console.log(result.map((r) => `${r.file_path}`).join("\n\n"));

    console.log(context);

    console.log("=== END CONTEXT ===");

    messages.push({
      role: "system",
      content: `Context: ${context}`,
      id: new Date().getTime().toString(),
    });
    messages.push(lastMessage);
  } catch (e) {
    console.error("🔴 Error", e);
  } finally {
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      stream: true,
      messages: messages.map((m) => ({
        role: m.role as "user" | "system" | "assistant",
        content: m.content,
      })),
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
  }
};
