import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequestJson } from "@/lib/queryClient";
import { Send, Bot, User, Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: number;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function ChatBot() {
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get user's active chat session
  const { data: activeSession } = useQuery({
    queryKey: ["/api/chat/active-session"],
  });

  // Get chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/chat/sessions"],
  });

  // Get messages for current session
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: [`/api/chat/messages/${currentSessionId}`],
    enabled: !!currentSessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: number; message: string }) => {
      return apiRequestJson(`/api/chat/sessions/${sessionId}/messages`, "POST", { content: message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages/${currentSessionId}`] });
      setInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut enviar el missatge. Comprova que l'API key d'OpenAI estigui configurada.",
        variant: "destructive",
      });
    },
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequestJson("/api/chat/sessions", "POST", {});
    },
    onSuccess: (newSession: any) => {
      setCurrentSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return apiRequestJson(`/api/chat/sessions/${sessionId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      if (currentSessionId && sessions.length > 1) {
        const otherSession = sessions.find((s: ChatSession) => s.id !== currentSessionId);
        setCurrentSessionId(otherSession?.id || null);
      } else {
        setCurrentSessionId(null);
      }
    },
  });

  useEffect(() => {
    if (activeSession && !currentSessionId) {
      setCurrentSessionId(activeSession.id);
    }
  }, [activeSession, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    let sessionId = currentSessionId;
    
    // Create new session if none exists
    if (!sessionId) {
      const newSession = await createSessionMutation.mutateAsync();
      sessionId = newSession.id;
    }

    sendMessageMutation.mutate({ sessionId, message: input });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Assistent IA</h1>
          <p className="text-text-secondary mt-2">
            Parla amb l'assistent per obtenir ajuda amb la gestió de guàrdies
          </p>
        </div>
        <Button 
          onClick={() => createSessionMutation.mutate()}
          disabled={createSessionMutation.isPending}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-8rem)]">
        {/* Sessions Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Converses</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100%-2rem)]">
                <div className="space-y-2">
                  {sessions.map((session: ChatSession) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentSessionId === session.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => setCurrentSessionId(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.title || "Nova conversa"}
                          </p>
                          <p className="text-xs opacity-70">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSessionMutation.mutate(session.id);
                          }}
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Assistent de Guàrdies
                <Badge variant="secondary">IA</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-center">
                    <div>
                      <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">
                        Inicia una conversa amb l'assistent IA per obtenir ajuda
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Pots preguntar sobre assignacions, horaris, professors, etc.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex gap-3 max-w-[80%] ${
                            message.role === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-gray-100"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-gray-100"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                message.role === "user"
                                  ? "text-primary-foreground/70"
                                  : "text-gray-500"
                              }`}
                            >
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escriu el teu missatge..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || sendMessageMutation.isPending}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pressiona Enter per enviar el missatge
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}