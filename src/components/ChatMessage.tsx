import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-2xl animate-fade-in backdrop-blur-sm transition-all hover:scale-[1.01]",
        isUser
          ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground ml-auto max-w-[80%] shadow-lg shadow-primary/20"
          : "bg-gradient-to-br from-card to-card/80 max-w-[80%] border border-border/50 shadow-md"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
          isUser 
            ? "bg-primary-foreground/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
            : "bg-gradient-to-br from-primary/20 to-secondary/20 shadow-[0_0_10px_rgba(30,180,200,0.2)]"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="p-3 rounded-lg bg-muted overflow-x-auto my-2">
                    {children}
                  </pre>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="ml-2">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-2">
                    {children}
                  </blockquote>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
