import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Crawler from "@/components/widgets/Crawler";
import Navbar from "@/components/widgets/Navbar";
import { getPayrollSession } from "@/features/payroll/api/payroll-api";
import type { PayrollSessionSnapshot } from "@/features/payroll/api/payroll-types";
import {
  useCreatePayrollSession,
  useDeletePayrollSession,
} from "@/features/payroll/query/payroll-hooks";
import { baseURL, cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[20rem_1fr]">
        <section
          className={cn(
            "rounded-lg border border-slate-200 bg-white p-6 shadow-sm",
            errorMessage && "border-red-300 bg-red-50"
          )}
        >
          {snapshot && !showLoginForm ? (
            <div className="space-y-3">
              <p className="font-medium">{snapshot.session.username}</p>
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
            </div>
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
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
      </main>
    </div>
  );
}

export default BustePaga;
