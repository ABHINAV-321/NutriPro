import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { CoachMessage } from "@shared/schema";
import { Chatbot, Message } from "@/components/ui/chatbot";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CoachPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Fetch previous messages
  const { data: coachMessages, isLoading } = useQuery<CoachMessage[]>({
    queryKey: [`/api/users/${user?.id}/coach-messages`],
    enabled: !!user?.id
  });
  
  // Transform coach messages to local format when data loads
  useEffect(() => {
    if (coachMessages && coachMessages.length > 0) {
      const transformedMessages = coachMessages.map(msg => ({
        id: msg.id,
        content: msg.message,
        isUser: msg.isUser,
        timestamp: new Date(msg.date)
      }));
      setMessages(transformedMessages);
    } else if (coachMessages && coachMessages.length === 0 && user) {
      // Add welcome message if no previous messages
      setMessages([
        {
          id: 0,
          content: `Hi ${user.name || 'there'}! I'm your NutriCoach. How can I help you today with your nutrition or fitness goals?`,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  }, [coachMessages, user]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Add optimistic user message to UI
      const tempId = -Date.now();
      setMessages(prev => [
        ...prev,
        {
          id: tempId,
          content: message,
          isUser: true,
          timestamp: new Date()
        }
      ]);
      
      // Send message to API
      const response = await apiRequest("POST", "/api/coach-messages", {
        userId: user.id,
        message
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response
      const { coachMessage } = data;
      
      setMessages(prev => [
        ...prev,
        {
          id: coachMessage.id,
          content: coachMessage.message,
          isUser: false,
          timestamp: new Date(coachMessage.date)
        }
      ]);
      
      // Invalidate coach messages query
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user?.id}/coach-messages`]
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  const handleSendMessage = async (message: string) => {
    await sendMessageMutation.mutateAsync(message);
  };
  
  // Sample coach topics
  const coachTopics = [
    {
      title: "Nutrition Advice",
      description: "Ask about balanced meals and macros",
      icon: "fa-carrot"
    },
    {
      title: "Weight Loss",
      description: "Tips for healthy weight loss",
      icon: "fa-weight-scale"
    },
    {
      title: "Workout Plans",
      description: "Get exercise recommendations",
      icon: "fa-dumbbell"
    },
    {
      title: "Meal Planning",
      description: "Plan your weekly meals",
      icon: "fa-utensils"
    }
  ];
  
  return (
    <div className="pt-4 px-5 flex flex-col h-full max-h-[calc(100vh-144px)]">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Health Coach</h2>
        <p className="text-neutral-500">Your AI-powered nutrition and fitness assistant</p>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {messages.length <= 1 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {coachTopics.map((topic, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => handleSendMessage(`Tell me about ${topic.title.toLowerCase()}`)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center my-2">
                      <i className={`fas ${topic.icon} text-lg`}></i>
                    </div>
                    <h3 className="font-medium text-sm">{topic.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{topic.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              <Chatbot 
                messages={messages} 
                onSendMessage={handleSendMessage}
                isLoading={sendMessageMutation.isPending}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
