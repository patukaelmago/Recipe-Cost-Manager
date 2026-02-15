import { Sidebar } from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center border-b p-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="rounded-md p-2 hover:bg-secondary">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <span className="ml-4 text-lg font-bold font-display">RecipeCost</span>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1">
          <main className="container mx-auto max-w-7xl p-6 lg:p-8">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
