import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Crawler from "@/components/widgets/Crawler";
import JobTerminal from "@/components/widgets/JobTerminal";
import Navbar from "@/components/widgets/Navbar";
import { getPayrollSession } from "@/features/payroll/api/payroll-api";
import type { PayrollSessionSnapshot } from "@/features/payroll/api/payroll-types";
import {
  useCreatePayrollSession,
  useDeletePayrollSession,
} from "@/features/payroll/query/payroll-hooks";
import { baseURL, cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "@/components/ui/card";

const SESSION_STORAGE_KEY = "nursind-payroll-session-id";

function BustePaga() {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [snapshot, setSnapshot] = useState<PayrollSessionSnapshot>();
  const [restoring, setRestoring] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [validationError, setValidationError] = useState<string>();
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const createSession = useCreatePayrollSession();
  const deleteSession = useDeletePayrollSession();

  const refresh = useCallback(async () => {
    const sessionId =
      snapshot?.session.id ?? localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      return;
    }
    const next = await getPayrollSession(sessionId);
    setSnapshot(next);
  }, [snapshot?.session.id]);

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      setRestoring(false);
      return;
    }
    getPayrollSession(sessionId)
      .then(setSnapshot)
      .catch(() => localStorage.removeItem(SESSION_STORAGE_KEY))
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    const sessionId = snapshot?.session.id;
    if (!sessionId) {
      setConnectionState("disconnected");
      return;
    }
    setConnectionState("connecting");
    const source = new EventSource(
      `${baseURL}/crawl-sessions/${sessionId}/events`
    );
    source.addEventListener("snapshot", (event) => {
      setSnapshot(JSON.parse((event as MessageEvent).data));
      setConnectionState("connected");
    });
    source.addEventListener("heartbeat", () => {
      setConnectionState("connected");
    });
    source.addEventListener("deleted", () => {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSnapshot(undefined);
      source.close();
    });
    source.onerror = () => setConnectionState("disconnected");
    return () => source.close();
  }, [snapshot?.session.id]);

  const login = async () => {
    const username = usernameRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    if (!username || !password) {
      setValidationError("Inserisci username e password.");
      return;
    }

    setValidationError(undefined);
    try {
      const created = await createSession.mutateAsync({ username, password });
      localStorage.setItem(SESSION_STORAGE_KEY, created.session.id);
      setSnapshot(created);
      setShowLoginForm(false);
      if (passwordRef.current) {
        passwordRef.current.value = "";
      }
    } catch {
      // The normalized mutation error is rendered below.
    }
  };

  const removeSession = async () => {
    if (
      !snapshot ||
      !window.confirm(
        "Eliminare definitivamente la sessione, tutti i batch e tutti i PDF?"
      )
    ) {
      return;
    }
    const deleting = await deleteSession.mutateAsync(snapshot.session.id);
    if (deleting) {
      setSnapshot(deleting);
      return;
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSnapshot(undefined);
  };

  const errorMessage =
    validationError ??
    (createSession.error
      ? "Autenticazione al portale non riuscita."
      : undefined);

  return (
    <div className=" bg-stone-50 ">
      <Navbar />
      <main className="mx-auto   max-w-6xl    ">
        <h1 className="text-2xl font-semibold text-slate-900">
          Analisi Buste Paga
        </h1>
        <div className="grid gap-5 
         grid-cols-5">
          <Card
            className={cn(
              "",
              " bg-card row-span-4 ",
              "rounded-lg    border-stone-200   p-6 shadow",
              errorMessage && "border-red-300 bg-red-50"
            )}
          >
            {snapshot && !showLoginForm ? (
              <CardHeader className=" px-0">
                <CardTitle className="font-medium">{snapshot.session.username}</CardTitle>
                <p className="text-sm text-slate-600">
                  Sessione permanente attiva
                </p>
                <Button
                  variant="outline"
                  disabled={createSession.isPending || restoring}
                  onClick={() => setShowLoginForm(true)}
                >
                  Cambia sessione
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteSession.isPending}
                  onClick={() => void removeSession()}
                >
                  Elimina sessione
                </Button>
              </CardHeader>
            ) : (
              <div className="flex flex-col gap-3">
                <Label htmlFor="payroll-username">Username</Label>
                <Input id="payroll-username" name="username" ref={usernameRef} />

                <Label htmlFor="payroll-password">Password</Label>
                <Input
                  id="payroll-password"
                  name="password"
                  type="password"
                  ref={passwordRef}
                />

                <Button
                  className="mt-3"
                  onClick={() => void login()}
                  disabled={createSession.isPending || restoring}
                >
                  {createSession.isPending ? "Accesso in corso..." : "Accedi"}
                </Button>
                {snapshot ? (
                  <Button
                    variant="ghost"
                    onClick={() => setShowLoginForm(false)}
                  >
                    Annulla
                  </Button>
                ) : null}
              </div>
            )}
          </Card>

          <section className="
        col-span-4
        rounded-lg border p-6 bg-card">
            <h2 className="text-xl font-semibold text-slate-900">
              Sessione e batch
            </h2>
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
              {restoring ? (
                <LoadingSpinner />
              ) : snapshot ? (
                <>
                  Sessione caricata
                  <CheckCheckIcon className="text-green-600" />
                </>
              ) : errorMessage ? (
                <span className="text-red-700">{errorMessage}</span>
              ) : (
                <span>Accedi per gestire i batch.</span>
              )}
            </div>

            {snapshot ? (
              <Crawler
                snapshot={snapshot}
                connectionState={connectionState}
                refresh={refresh}
              />
            ) : null}
          </section>
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Active Job Troubleshooting</CardTitle>
              <CardDescription>
                Live crawler logs for the active or most recent job
              </CardDescription>
              <CardAction>
                <span
                  className={cn(
                    "inline-flex size-2 rounded-full",
                    connectionState === "connected"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  )}
                  title={`SSE ${connectionState}`}
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <JobTerminal snapshot={snapshot} />
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Credentials and request payloads are never included in these logs.
            </CardFooter>
          </Card>
           
        </div>
      </main>
    </div>
  );
}

export default BustePaga;
