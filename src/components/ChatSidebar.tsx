import { useState } from "react";
import { MessageSquarePlus, Search, Sparkles, Smile, Briefcase, GraduationCap, Heart, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "./ui/sidebar";
import dolphinLogo from "@/assets/dolphin-logo.png";

interface ChatSidebarProps {
  conversations: Array<{
    id: string;
    title: string;
    chat_mode: string;
    updated_at: string;
  }>;
  currentConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onModeChange: (mode: string) => void;
  currentMode: string;
}

const chatModes = [
  { id: "friendly", label: "Friendly", icon: Smile, color: "text-primary" },
  { id: "funny", label: "Funny", icon: Sparkles, color: "text-secondary" },
  { id: "formal", label: "Formal", icon: Briefcase, color: "text-accent" },
  { id: "motivator", label: "Motivator", icon: Zap, color: "text-orange-500" },
  { id: "studybuddy", label: "Study Buddy", icon: GraduationCap, color: "text-purple-500" },
];

export function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onModeChange,
  currentMode,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <img src={dolphinLogo} alt="ChatFren" className="w-10 h-10" />
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ChatFren
            </h2>
            <p className="text-xs text-muted-foreground">AI Chat Assistant</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2">
            <Button onClick={onNewChat} className="w-full" size="lg">
              <MessageSquarePlus className="mr-2 h-5 w-5" />
              New Chat
            </Button>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Chat Modes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <SidebarMenuItem key={mode.id}>
                    <SidebarMenuButton
                      onClick={() => onModeChange(mode.id)}
                      isActive={currentMode === mode.id}
                      className="w-full"
                    >
                      <Icon className={`h-4 w-4 ${mode.color}`} />
                      <span>{mode.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <SidebarGroupContent>
            <ScrollArea className="h-[400px]">
              <SidebarMenu>
                {filteredConversations.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {searchQuery ? "No chats found" : "No chat history yet"}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton
                        onClick={() => onSelectConversation(conv.id)}
                        isActive={currentConversationId === conv.id}
                        className="w-full justify-start truncate"
                      >
                        <MessageSquarePlus className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{conv.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Heart className="h-3 w-3 text-primary" />
          <span>Made with Lovable Cloud</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
