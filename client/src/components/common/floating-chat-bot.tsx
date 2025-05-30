import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  emissor: 'usuari' | 'bot';
  text: string;
  moment: string;
}

interface ChatSession {
  id: number;
  missatges: ChatMessage[];
  tancada: boolean;
}

export default function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get or create chat session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/chat/session'],
    enabled: isOpen,
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/chat/session');
      return response.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!session?.id) throw new Error("No session available");
      
      const response = await apiRequest('POST', `/api/chat/${session.id}/message`, {
        message: messageText,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh session to get updated messages
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session'] });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut enviar el missatge.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(message);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Chat Toggle Button */}
      <Button
        onClick={toggleChat}
        className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
      >
        <Bot className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 h-96 shadow-2xl border border-gray-200">
          <CardHeader className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-sm font-semibold">Assistent IA</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeChat}
              className="h-6 w-6 hover:bg-white hover:bg-opacity-20 text-white p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[320px]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {sessionLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Initial greeting */}
                  {(!session?.missatges || session.missatges.length === 0) && (
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="text-white text-xs h-4 w-4" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                        <p className="text-sm text-text-primary">
                          Hola! Com et puc ajudar amb la gestió de guardies avui?
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  {session?.missatges?.map((msg: ChatMessage, index: number) => (
                    <div
                      key={index}
                      className={`flex space-x-2 ${
                        msg.emissor === 'usuari' ? 'justify-end' : ''
                      }`}
                    >
                      {msg.emissor === 'bot' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="text-white text-xs h-4 w-4" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 max-w-xs ${
                          msg.emissor === 'usuari'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-text-primary'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {sendMessageMutation.isPending && (
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="text-white text-xs h-4 w-4" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escriu la teva pregunta..."
                  className="flex-1 text-sm"
                  disabled={sessionLoading || sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!message.trim() || sessionLoading || sendMessageMutation.isPending}
                  className="bg-primary hover:bg-blue-800"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
