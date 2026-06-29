import React from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "./theme-provider";
import { 
  Activity, BookOpen, BrainCircuit, Calendar, 
  CheckSquare, FileText, FlaskConical, LayoutDashboard, 
  Menu, Moon, Sun, Timer, TrendingUp, X
} from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/study", label: "Study", icon: Timer },
  { href: "/research", label: "Research", icon: FlaskConical },
  { href: "/projects", label: "Projects", icon: CheckSquare },
  { href: "/exams", label: "Exams", icon: BrainCircuit },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/history", label: "History", icon: Activity },
];

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  
  return (
    <div className={`flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground w-64 ${className}`}>
      <div className="flex items-center h-14 px-4 border-b">
        <div className="font-semibold text-lg tracking-tight flex items-center gap-2 text-primary">
          <BrainCircuit className="w-5 h-5" />
          <span>PAROS</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          Toggle Theme
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />
      
      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <Sidebar className="relative z-50 w-64 shadow-xl" />
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="ml-4 font-semibold text-primary flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" />
            PAROS
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
