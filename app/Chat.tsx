'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from 'ai/react';
import { RefreshCcw, Square } from 'lucide-react';
import Markdown from 'react-markdown';

export const Chat = () => {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    reload,
    stop,
    isLoading,
  } = useChat({
    api: '/api/askme',
    initialMessages: [],
  });

  return (
    <div className="h-full flex flex-col max-w-2xl m-auto px-4 gap-4 py-4">
      <h2 className="text-3xl font-bold">Chat with your notes</h2>
      <div className="flex-1 overflow-auto flex flex-col gap-2">
        {messages.map((m) => (
          <Card key={m.id} className="flex flex-row gap-4">
            <CardHeader className="p-2 pr-0">
              <Avatar>
                <AvatarFallback>
                  {m.role === 'assistant' ? 'AI' : 'U'}
                </AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent className="p-2 pl-0">
              <Markdown className="prose dark:prose-invert">{m.content}</Markdown>
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 ? (
          <Card>
            <CardHeader className="p-2">
              <CardTitle>No messages yet</CardTitle>
              <CardDescription>Start typing to chat with the AI</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>

      <div className="relative">
        <div className="absolute top-[-75%] flex gap-2">
          <Button
            onClick={() => reload()}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCcw size={16} className="mr-2" />
            Reload
          </Button>
          {isLoading ? (
            <Button onClick={() => stop()} size="sm">
              <Square size={16} className="mr-2" />
              Stop
            </Button>
          ) : null}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <fieldset className="flex gap-4" disabled={isLoading}>
            <Textarea value={input} onChange={handleInputChange} />
            <Button type="submit">Send</Button>
          </fieldset>
        </form>
      </div>
    </div>
  );
};
