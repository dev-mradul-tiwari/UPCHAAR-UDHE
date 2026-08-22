"use client";

import * as React from "react";
import { HeartHandshake, Send, Sparkles, Square, Trash2 } from "lucide-react";
import type { ChatMessage } from "@upchaar/types";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@upchaar/ui/card";
import { Label } from "@upchaar/ui/label";
import { PageHeader } from "@upchaar/ui/page-header";
import { Textarea } from "@upchaar/ui/textarea";
import { UserAvatar } from "@upchaar/ui/avatar";
import { cn } from "@upchaar/ui/lib/utils";
import { toast } from "@upchaar/ui/sonner";

import { usePatient } from "@/components/session-provider";
import { errorMessage, isApiError, streamChatReply } from "@/lib/api";

const OPENERS: readonly string[] = [
  "I am nervous about my surgery next week. What can I do?",
  "What should I expect on the day of a cardiac angiography?",
  "How do I care for my stitches after a small operation?",
  "I keep waking up anxious before hospital visits. Any advice?",
];

const MAX_MESSAGE = 4000;

function Bubble({
  message,
  patientName,
  streaming,
}: {
  message: ChatMessage;
  patientName: string;
  streaming: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <li
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      aria-label={isUser ? "You said" : "Dr. Positive said"}
    >
      {isUser ? (
        <UserAvatar name={patientName} className="size-8 shrink-0" />
      ) : (
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-subtle-foreground"
        >
          <HeartHandshake className="size-4" />
        </span>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-primary-subtle text-primary-subtle-foreground"
            : "border border-border bg-card text-card-foreground",
        )}
      >
        {message.content.length === 0 && streaming ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
            Dr. Positive is thinking
          </span>
        ) : (
          <>
            {message.content}
            {streaming && !isUser ? (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-xs bg-primary"
              />
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}

export function AssistantChat() {
  const { data: patient } = usePatient();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const send = React.useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (trimmed.length === 0 || streaming) return;

      const outgoing: ChatMessage[] = [
        ...messages.filter((message) => message.content.trim().length > 0),
        { role: "user", content: trimmed },
      ];

      setMessages([...outgoing, { role: "assistant", content: "" }]);
      setDraft("");
      setStreaming(true);
      setUnavailable(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        for await (const chunk of streamChatReply(outgoing, controller.signal)) {
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last === undefined || last.role !== "assistant") return current;
            next[next.length - 1] = { role: "assistant", content: last.content + chunk };
            return next;
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // The patient stopped the reply — keep whatever arrived.
        } else if (isApiError(error) && error.isUnavailable) {
          setUnavailable(error.message);
          setMessages(outgoing);
        } else {
          toast.error("Dr. Positive could not reply", {
            description: errorMessage(error),
          });
          setMessages(outgoing);
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
        setMessages((current) =>
          current.filter(
            (message, index) =>
              message.content.trim().length > 0 || index !== current.length - 1,
          ),
        );
      }
    },
    [messages, streaming],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Dr. Positive"
        title="A calm second opinion, any time"
        description="Ask about a procedure, recovery or the worries that keep you up. Dr. Positive explains things plainly — it never replaces your doctor."
        actions={
          messages.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                abortRef.current?.abort();
                setMessages([]);
                setUnavailable(null);
              }}
            >
              <Trash2 aria-hidden />
              Clear chat
            </Button>
          ) : null
        }
      />

      {unavailable !== null ? (
        <Alert variant="warning">
          <Sparkles aria-hidden />
          <AlertTitle>Dr. Positive is offline right now</AlertTitle>
          <AlertDescription>
            <p>{unavailable}</p>
            <p>
              The AI companion needs a Gemini API key on the server. Every other part of
              Upchaar keeps working without it.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-0 py-0">
        <CardHeader className="gap-1 border-b border-border py-5">
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake aria-hidden className="size-4.5 text-primary" />
            Dr. Positive
          </CardTitle>
          <CardDescription>
            Pre and post-operative counsellor · replies stream in as they are written
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-[22rem] py-6">
          {messages.length === 0 ? (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                Not sure where to start? Try one of these.
              </p>
              <ul className="grid gap-2">
                {OPENERS.map((opener) => (
                  <li key={opener}>
                    <button
                      type="button"
                      onClick={() => void send(opener)}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:outline-none"
                    >
                      {opener}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="grid gap-5">
              {messages.map((message, index) => (
                <Bubble
                  key={`${message.role}-${index}`}
                  message={message}
                  patientName={patient?.name ?? "You"}
                  streaming={streaming && index === messages.length - 1}
                />
              ))}
            </ul>
          )}
          <div ref={endRef} />
        </CardContent>

        <CardFooter className="border-t border-border py-5">
          <form
            className="grid w-full gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <Label htmlFor="assistant-input">Your message</Label>
            <Textarea
              id="assistant-input"
              rows={3}
              maxLength={MAX_MESSAGE}
              value={draft}
              placeholder="Type your question… (Enter to send, Shift + Enter for a new line)"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey) return;
                event.preventDefault();
                void send(draft);
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Guidance only — call your hospital for anything urgent.
              </span>
              <div className="flex items-center gap-2">
                {streaming ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => abortRef.current?.abort()}
                  >
                    <Square aria-hidden />
                    Stop
                  </Button>
                ) : null}
                <Button type="submit" disabled={draft.trim().length === 0 || streaming}>
                  <Send aria-hidden />
                  Send
                </Button>
              </div>
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
