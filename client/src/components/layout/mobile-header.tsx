import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Botó menú hamburguesa */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="p-2"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Logo central */}
        <div className="flex-1 flex justify-center">
          <img 
            src="/src/assets/bitacola-logo.svg" 
            alt="Bitàcola" 
            className="h-8 w-auto"
          />
        </div>

        {/* Botó logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/api/logout'}
          className="p-2"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}