import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      if (window.matchMedia("(display-mode: standalone)").matches) return;
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;

  const install = async () => {
    setInstalling(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      console.warn("No se pudo abrir la instalación:", error);
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  };

  return (
    <button
      type="button"
      onClick={install}
      disabled={installing}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg disabled:opacity-60"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {installing ? "Instalando…" : "Instalar app"}
    </button>
  );
}
