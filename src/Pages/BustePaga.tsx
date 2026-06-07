import { useEffect, useRef, useState } from "react";
import { CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Crawler from "@/components/widgets/Crawler";
import Navbar from "@/components/widgets/Navbar";
import {
  useCreatePayrollSession,
  useDeletePayrollSession,
} from "@/features/payroll/query/payroll-hooks";
import { cn } from "@/lib/utils";

function BustePaga() {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string>();
  const createSession = useCreatePayrollSession();
  const deleteSession = useDeletePayrollSession();
  const deleteSessionMutate = deleteSession.mutate;
  const session = createSession.data;

  useEffect(() => {
    const sessionId = session?.id;
    return () => {
      if (sessionId) {
        deleteSessionMutate(sessionId);
      }
    };
  }, [deleteSessionMutate, session?.id]);

  const login = async () => {
    const username = usernameRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    if (!username || !password) {
      setValidationError("Inserisci username e password.");
      return;
    }

    setValidationError(undefined);
    if (session) {
      await deleteSession.mutateAsync(session.id);
      createSession.reset();
    }

    try {
      await createSession.mutateAsync({ username, password });
      if (passwordRef.current) {
        passwordRef.current.value = "";
      }
    } catch {
      // React Query exposes the normalized error through createSession.error.
    }
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
              disabled={createSession.isPending || deleteSession.isPending}
            >
              {createSession.isPending ? "Accesso in corso..." : "Accedi"}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Stato operazione
          </h2>
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
            {session ? (
              <>
                Login effettuato con successo
                <CheckCheckIcon className="text-green-600" />
              </>
            ) : createSession.isPending ? (
              <LoadingSpinner />
            ) : errorMessage ? (
              <span className="text-red-700">{errorMessage}</span>
            ) : (
              <span>Accedi al portale per iniziare.</span>
            )}
          </div>

          {session ? <Crawler sessionId={session.id} /> : null}
        </section>
      </main>
    </div>
  );
}

export default BustePaga;
