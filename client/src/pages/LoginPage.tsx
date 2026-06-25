import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Username and password required");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      navigate("/builder");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <aside className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-white/15 text-sm font-bold">
            A
          </span>
          Assessment
        </span>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Build assessments that actually measure something.
          </h1>
          <p className="mt-3 text-primary-foreground/75">
            Structure your work as categories, factors, and questions, then launch and read the
            results in one place.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/65">Assessment Builder</p>
      </aside>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="animate-enter w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Log in to continue.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
