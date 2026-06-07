import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/widgets/Navbar";
import { CheckCheckIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Crawler from "@/components/widgets/Crawler";
import { BustePagaContext } from "./Context";
import apiClient, { cn } from "@/lib/utils";

interface AuthState {
  type: "loading" | "success" | "error" | "undefined";
  message?: string;
}

function BustePaga() {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState<string>();
  const [username, setUsername] = useState<string>();
  const [userStatus, setUserStatus] = useState<AuthState>({
    type: "undefined",
  });

  useEffect(() => {
    return () => {
      if (sessionId) {
        void apiClient.delete(`/crawl-sessions/${sessionId}`);
      }
    };
  }, [sessionId]);

  const login = async () => {
    const nextUsername = usernameRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    if (!nextUsername || !password) {
      setUserStatus({ type: "error", message: "Inserisci username e password." });
      return;
    }

    setUserStatus({ type: "loading" });
    try {
      if (sessionId) {
        await apiClient.delete(`/crawl-sessions/${sessionId}`);
      }
      const response = await apiClient.post<{ id: string }>("/crawl-sessions", {
        username: nextUsername,
        password,
      });
      passwordRef.current!.value = "";
      setSessionId(response.data.id);
      setUsername(nextUsername);
      setUserStatus({ type: "success" });
    } catch {
      setSessionId(undefined);
      setUsername(undefined);
      setUserStatus({
        type: "error",
        message: "Autenticazione al portale non riuscita.",
      });
    }
  };

  return (
    <BustePagaContext.Provider value={{ sessionId, username }}>
      <div className="w-screen h-screen flex p-16 bg-slate-400">
        <div className="w-full h-full flex">
          <div
            className={cn(
              "min-w-80 h-full border-solid shadow-lg border border-gray-400 rounded-sm p-8 bg-gradient-to-b flex flex-col gap-3",
              userStatus.type === "error" ? "from-red-200" : "from-slate-200"
            )}
          >
            <Label className="text-sm">Username</Label>
            <Input name="username" ref={usernameRef} />

            <Label className="text-sm">Password</Label>
            <Input name="password" type="password" ref={passwordRef} />

            <Button
              className="flex items-center gap-2 m-3 my-6 hover:bg-slate-500 hover:text-slate-900"
              onClick={login}
              disabled={userStatus.type === "loading"}
            >
              Login
            </Button>
          </div>
          <div className="flex-1 flex flex-col h-full">
            <Navbar />
            <div className="p-10 flex-1 bg-slate-200">
              <h1 className="font-semibold text-xl">Stato operazione</h1>
              <div className="text-sm opacity-65">
                <span className="flex gap-3 items-center">
                  {userStatus.type === "success" ? (
                    <>
                      Login effettuato con successo
                      <CheckCheckIcon className="text-green-600" />
                    </>
                  ) : userStatus.type === "loading" ? (
                    <LoadingSpinner />
                  ) : userStatus.type === "error" ? (
                    <>{userStatus.message}</>
                  ) : (
                    <>Accedi al portale per iniziare.</>
                  )}
                </span>

                {userStatus.type === "success" ? <Crawler /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BustePagaContext.Provider>
  );
}

export default BustePaga;
