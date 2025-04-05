import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Chatbot, Message } from "@/components/ui/chatbot";
import { useUser } from "@/contexts/UserContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CoachMessage } from "@shared/schema";

interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoachModal({ isOpen, onClose }: CoachModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Fetch previous messages
  const { data: coachMessages, isLoading } = useQuery<CoachMessage[]>({
    queryKey: [`/api/users/${user?.id}/coach-messages`],
    enabled: isOpen && !!user?.id
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
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-t-2xl sm:rounded-t-lg w-full max-w-lg p-0 h-[85vh]">
        <DialogHeader className="flex flex-row justify-between items-center p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
              <i className="fas fa-robot text-white"></i>
            </div>
            <DialogTitle className="font-semibold">NutriCoach AI</DialogTitle>
          </div>
          <button className="text-neutral-400" onClick={onClose}>
            <i className="fas fa-xmark text-xl"></i>
          </button>
        </DialogHeader>
        
        <div className="flex-1 h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Chatbot 
              messages={messages} 
              onSendMessage={handleSendMessage}
              isLoading={sendMessageMutation.isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
