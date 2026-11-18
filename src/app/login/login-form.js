"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { Button, Card, CardBody, ErrorText, Field, Input } from "@/components/ui";
import { loginAction, seedDemoAction } from "@/actions/auth";
export function LoginForm({ isDev }) {
    const router = useRouter();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState();
    const [info, setInfo] = React.useState();
    const [busy, setBusy] = React.useState(false);
    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(undefined);
        const r = await loginAction(email, password);
        setBusy(false);
        if (r.ok) {
            router.replace("/dashboard");
            router.refresh();
        }
        else
            setError(r.error);
    }
    async function seed() {
        setBusy(true);
        setError(undefined);
        const r = await seedDemoAction();
        setBusy(false);
        if (r.ok) {
            setEmail(r.data.email);
            setInfo(`Demo data ${r.data.demo}. Sign in with ${r.data.email} and your ADMIN_SEED_PASSWORD (default ChangeMe123!).`);
        }
        else
            setError(r.error);
    }
    return (<div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-xl font-bold text-primary"><Receipt className="h-6 w-6"/> Invoicify</div>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username"/></Field>
            <Field label="Password"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"/></Field>
            <ErrorText>{error}</ErrorText>
            {info ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : "Sign in"}</Button>
          </form>
          {isDev ? (<div className="border-t pt-3">
              <Button variant="outline" className="w-full" onClick={seed} disabled={busy}>Seed Demo Data (dev only)</Button>
            </div>) : null}
        </CardBody>
      </Card>
    </div>);
}
