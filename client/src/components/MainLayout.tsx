import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, ListChecks, History, DollarSign, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/diario", label: "Diário", icon: FileText },
    { path: "/propostas", label: "Propostas", icon: ListChecks },
    { path: "/historico", label: "Histórico", icon: History },
    { path: "/recebiveis", label: "Recebíveis", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
                Grupo Rugido
              </h1>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "gap-2",
                        isActive && "glow-purple"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full glow-purple-hover">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Minha Conta</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
