import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const { user, loading, refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      utils.auth.me.setData(undefined, data.user as any);
      await utils.auth.me.invalidate();
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "Login failed. Please try again.");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      utils.auth.me.setData(undefined, data.user as any);
      await utils.auth.me.invalidate();
      toast.success(`Welcome to Unstor AI, ${data.user.name}!`);
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  // Already logged in — redirect home
  if (!loading && user) {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      registerMutation.mutate({ name: name.trim(), email: email.trim(), password });
    } else {
      loginMutation.mutate({ email: email.trim(), password });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 mb-4 shadow-lg shadow-purple-900/40">
            <span className="text-2xl font-bold text-white">U</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Unstor AI</h1>
          <p className="text-muted-foreground mt-1 text-sm">Ancient wisdom. Modern intelligence.</p>
        </div>

        <Card className="border border-white/10 bg-card/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === "login"
                ? "Enter your email and password to continue"
                : "Join Unstor AI and begin your journey"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    disabled={isPending}
                    className="bg-background/60"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                  className="bg-background/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "register" ? 8 : 1}
                  disabled={isPending}
                  className="bg-background/60"
                />
              </div>

              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isPending}
                    className="bg-background/60"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-purple-900/30 mt-2"
                disabled={isPending}
              >
                {isPending
                  ? (mode === "login" ? "Signing in..." : "Creating account...")
                  : (mode === "login" ? "Sign In" : "Create Account")}
              </Button>
            </form>

            {/* Toggle mode */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setPassword(""); setConfirmPassword(""); }}
                    className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setPassword(""); setConfirmPassword(""); }}
                    className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>


          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to Unstor AI's terms of use.
        </p>
      </div>
    </div>
  );
}
