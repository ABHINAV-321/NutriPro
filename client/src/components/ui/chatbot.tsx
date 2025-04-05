import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";

export interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export function Chatbot({ messages, onSendMessage, isLoading = false }: ChatbotProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    await onSendMessage(input);
    setInput("");
    
    // Focus back on input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-neutral-50">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.isUser ? "justify-end" : ""}`}
            >
              {!message.isUser && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
                  <i className="fas fa-robot text-white text-xs"></i>
                </div>
              )}
              <div 
                className={`p-3 rounded-xl max-w-[80%] shadow-sm ${
                  message.isUser 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white rounded-tl-none"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
                <i className="fas fa-robot text-white text-xs"></i>
              </div>
              <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-neutral-200 flex items-center gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your nutrition coach..."
          disabled={isLoading}
          className="flex-1 bg-neutral-100 rounded-full py-3 px-4"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="rounded-full bg-primary text-white flex items-center justify-center w-10 h-10"
        >
          <i className="fas fa-paper-plane"></i>
        </Button>
      </div>
    </div>
  );
}
