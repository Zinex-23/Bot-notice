"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Sparkles, KeyRound, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Mã PIN không đúng");
      }

      router.push("/overview");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Daily<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-xs text-slate-400">
            Trung tâm điều khiển cá nhân an toàn & bảo mật
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2 text-center">
              Nhập mã PIN bảo mật
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={10}
                required
                autoFocus
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Mã PIN mặc định: <code className="font-mono font-semibold">123456</code> (cấu hình qua biến môi trường ADMIN_PIN)
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !pin}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? "Đang xác thực..." : "Mở khóa Dashboard"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
