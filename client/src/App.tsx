import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import FoodDiaryPage from "@/pages/FoodDiaryPage";
import ProgressPage from "@/pages/ProgressPage";
import CoachPage from "@/pages/CoachPage";
import ProfilePage from "@/pages/ProfilePage";
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
import { useUser } from "./contexts/UserContext";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useEffect, useState } from "react";

function Router() {
  const [location] = useLocation();
  const { user } = useUser();
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    // Check if user has completed profile setup
    if (user && (!user.height || !user.age || !user.goalWeight)) {
      setShowProfileSetup(true);
    }
  }, [user]);

  return (
    <>
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-16" id="mainContent">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/diary" component={FoodDiaryPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route path="/coach" component={CoachPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <BottomNavigation />
      
      {showProfileSetup && (
        <ProfileSetupModal onClose={() => setShowProfileSetup(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col relative pb-16">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
