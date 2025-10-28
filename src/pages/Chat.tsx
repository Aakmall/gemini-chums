import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  chat_mode: string;
  updated_at: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMode, setChatMode] = useState("friendly");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const { sendMessage, isLoading } = useChat(currentConversationId || "", chatMode);

  useEffect(() => {
    checkAuth();
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
      subscribeToMessages(currentConversationId);
    }
  }, [currentConversationId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }

    setConversations(data || []);
    if (data && data.length > 0 && !currentConversationId) {
      setCurrentConversationId(data[0].id);
      setChatMode(data[0].chat_mode);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      setIsLoadingMessages(false);
      return;
    }

    setMessages((data || []) as Message[]);
    setIsLoadingMessages(false);
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: "New Chat",
        chat_mode: chatMode,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
      return;
    }

    setCurrentConversationId(data.id);
    setMessages([]);
    loadConversations();
  };

  const handleSelectConversation = (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (conversation) {
      setCurrentConversationId(id);
      setChatMode(conversation.chat_mode);
    }
  };

  const handleModeChange = async (mode: string) => {
    setChatMode(mode);
    if (currentConversationId) {
      await supabase
        .from("conversations")
        .update({ chat_mode: mode })
        .eq("id", currentConversationId);
      loadConversations();
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) {
      await handleNewChat();
      return;
    }

    // Save user message to database
    const { error: userMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: currentConversationId,
        role: "user",
        content,
      });

    if (userMsgError) {
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
      return;
    }

    // Update conversation title if it's the first message
    const conversation = conversations.find((c) => c.id === currentConversationId);
    if (conversation && conversation.title === "New Chat") {
      const newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await supabase
        .from("conversations")
        .update({ title: newTitle })
        .eq("id", currentConversationId);
      loadConversations();
    }

    // Stream AI response
    let assistantMessage = "";
    const upsertAssistant = (chunk: string) => {
      assistantMessage += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.id) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantMessage } : m
          );
        }
        return [
          ...prev,
          { id: "", role: "assistant", content: assistantMessage, created_at: new Date().toISOString() },
        ];
      });
    };

    try {
      const chatMessages = messages
        .filter((m) => m.id) // Only include saved messages
        .map((m) => ({ role: m.role, content: m.content }));

      chatMessages.push({ role: "user", content });

      await sendMessage(
        chatMessages,
        (chunk) => upsertAssistant(chunk),
        async () => {
          // Save assistant message to database
          if (assistantMessage) {
            await supabase
              .from("messages")
              .insert({
                conversation_id: currentConversationId,
                role: "assistant",
                content: assistantMessage,
              });
          }
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onModeChange={handleModeChange}
          currentMode={chatMode}
        />

        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Animated ocean bubbles background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <div className="absolute w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full blur-3xl animate-pulse" style={{ top: '10%', left: '20%', animationDuration: '4s' }} />
            <div className="absolute w-40 h-40 bg-gradient-to-br from-secondary to-accent rounded-full blur-3xl animate-pulse" style={{ top: '60%', right: '15%', animationDuration: '6s', animationDelay: '1s' }} />
            <div className="absolute w-24 h-24 bg-gradient-to-br from-accent to-primary rounded-full blur-3xl animate-pulse" style={{ bottom: '20%', left: '40%', animationDuration: '5s', animationDelay: '2s' }} />
          </div>

          <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center px-4 relative z-10">
            <SidebarTrigger>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {conversations.find((c) => c.id === currentConversationId)?.title || "ChatFren"}
              </h1>
            </div>
            <Button
              variant="ghost"
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login");
              }}
            >
              Logout
            </Button>
          </header>

          <ScrollArea className="flex-1 p-4 relative z-10">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 p-8 rounded-3xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border/50 shadow-xl">
                  <div className="text-6xl mb-4 animate-bounce-in">🐬</div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Selamat datang Indonesia
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Dive into a conversation! I'm here to help you with anything you need.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {["Ask me anything", "Tell me a joke", "Help me learn"].map((suggestion) => (
                      <button
                        key={suggestion}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id || `temp-${index}`}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 max-w-fit animate-bounce-in">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-medium">Thinking...</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-border/50 bg-background/80 backdrop-blur-md p-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
