import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, logout } = useUser();
  const [showNotifications, setShowNotifications] = useState(false);

  // Get user's initials
  const getInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="bg-primary py-4 px-5 flex justify-between items-center text-white sticky top-0 z-20 shadow-sm">
      <div className="flex items-center">
        <Link to="/">
          <h1 className="text-xl font-semibold">NutriTrack</h1>
        </Link>
      </div>
      
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mr-3 relative">
              <i className="fas fa-bell text-xl"></i>
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="text-sm">Time to log your lunch!</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="text-sm">You're halfway to your water goal today</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="text-sm">New healthy recipe suggestions available</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 bg-white/20 cursor-pointer">
              <AvatarFallback className="text-sm font-medium text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link to="/profile">
              <DropdownMenuItem>
                <i className="fas fa-user mr-2 text-sm"></i>
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onSelect={logout}>
              <i className="fas fa-sign-out-alt mr-2 text-sm"></i>
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
