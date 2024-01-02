"use client";

import { NextAI } from "@/components/maker/NextAI";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "ai/react";
import { RefreshCcw, Square } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { ReactSVG } from "./ReactSVG";

export const Chat = () => {
  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    reload,
    stop,
    setMessages,
  } = useChat({
    api: "/api/askme",
    onError: () => {
      toast.error(
        "Usage limit reached. Please try again later. (max 5 messages every 10 minutes)"
      );
    },
    initialMessages: [],
  });

  const form = (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e);
      }}
    >
      <fieldset className="flex gap-4" disabled={isLoading}>
        <Textarea
          placeholder="Ask your React related question."
          value={input}
          onChange={handleInputChange}
        />
        <Button type="submit">Send</Button>
      </fieldset>
    </form>
  );

  if (messages.length === 0) {
    return (
      <div
        id="landing-page"
        className="flex items-center px-4 justify-center h-full flex-col gap-4 max-w-xl w-full m-auto"
      >
        <ReactSVG
          className="w-20 h-20 text-cyan-400 animate-spin"
          style={{ animationDuration: "10s" }}
        />
        <h2 className="text-3xl font-bold">
          Chat with{" "}
          <Link
            href="https://react.dev"
            className="text-cyan-400 hover:underline"
          >
            React.dev
          </Link>
        </h2>
        {form}
        <NextAI />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-2xl m-auto px-4 gap-4 py-4">
      <div className="flex items-center gap-2">
        <ReactSVG
          className="w-12 h-12 text-cyan-400 animate-spin"
          style={{ animationDuration: "10s" }}
        />
        <h2 className="text-3xl font-bold">
          Chat with{" "}
          <Link
            href="https://react.dev"
            className="text-cyan-400 hover:underline"
          >
            React.dev
          </Link>
        </h2>
      </div>
      <div className="flex-1 overflow-auto flex flex-col gap-2 pb-8">
        {messages.map((m) => (
          <Card key={m.id} className="flex flex-row gap-4">
            <CardHeader className="p-2 pr-0">
              <Avatar>
                <AvatarFallback>
                  {m.role === "assistant" ? "AI" : "U"}
                </AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent
              className="p-2 pl-0"
              style={{
                maxWidth: "calc(100% - 48px)",
              }}
            >
              <Markdown className="prose dark:prose-invert">
                {m.content}
              </Markdown>
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 ? (
          <Card>
            <CardHeader className="p-2">
              <CardTitle>No messages yet</CardTitle>
              <CardDescription>
                Start typing to chat with the AI
              </CardDescription>
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
          <Button
            size="sm"
            disabled={isLoading}
            onClick={() => {
              setMessages([]);
            }}
          >
            Reset
          </Button>
          {isLoading ? (
            <Button onClick={() => stop()} size="sm">
              <Square size={16} className="mr-2" />
              Stop
            </Button>
          ) : null}
        </div>
        {form}
      </div>
    </div>
  );
};
