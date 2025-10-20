import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Shift+Enter for new line)"
        disabled={disabled}
        className="min-h-[60px] max-h-[200px] resize-none bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-2xl"
        rows={2}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="lg"
        className="px-6 h-[60px] bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-[0_0_20px_rgba(30,180,200,0.4)] transition-all rounded-2xl"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
