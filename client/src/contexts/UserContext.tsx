import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => false,
  logout: () => {},
  setUser: () => {},
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for existing session on app load
  useEffect(() => {
    const attemptAutoLogin = async () => {
      try {
        // For demo purposes, we'll log in as the demo user automatically
        const response = await apiRequest("POST", "/api/login", {
          username: "demo",
          password: "password"
        });
        
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Auto-login failed:", error);
        // Don't display an error toast for auto-login failures
      } finally {
        setIsLoading(false);
      }
    };

    attemptAutoLogin();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/login", {
        username,
        password
      });
      
      const userData = await response.json();
      
      setUser(userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name || username}!`,
      });
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setError(message);
      
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    // Clear all queries from the cache
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        setUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
