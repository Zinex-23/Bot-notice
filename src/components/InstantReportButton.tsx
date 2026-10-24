"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, FileText, Sparkles } from "lucide-react";

interface InstantReportButtonProps {
  variant?: "primary" | "topbar" | "outline" | "compact";
  className?: string;
  onSuccess?: () => void;
}

export function InstantReportButton({
  variant = "primary",
  className = "",
  onSuccess,
}: InstantReportButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSendReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading") return;

    setStatus("loading");
    setToastMessage(null);

    try {
      const res = await fetch("/api/reports/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setToastMessage(
          data.message || "✓ Đã gửi báo cáo tổng kết tới Telegram của bạn thành công!"
        );
        onSuccess?.();
        setTimeout(() => {
          setStatus("idle");
          setToastMessage(null);
        }, 5000);
      } else {
        setStatus("error");
        setToastMessage(data.error || "Gửi báo cáo thất bại.");
        setTimeout(() => {
          setStatus("idle");
          setToastMessage(null);
        }, 6000);
      }
    } catch (err: unknown) {
      setStatus("error");
      setToastMessage(
        err instanceof Error ? err.message : "Lỗi kết nối máy chủ khi gửi báo cáo."
      );
      setTimeout(() => {
        setStatus("idle");
        setToastMessage(null);
      }, 6000);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Toast popup */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-start space-x-3 transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            status === "success"
              ? "bg-emerald-500/95 text-white border-emerald-400 shadow-emerald-500/20"
              : "bg-rose-600/95 text-white border-rose-500 shadow-rose-600/20"
          }`}
        >
          {status === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" />
          )}
          <div className="text-xs font-medium leading-relaxed pr-2">
            <p className="font-bold mb-0.5">
              {status === "success" ? "Báo cáo Telegram" : "Thông báo lỗi"}
            </p>
            <p>{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white text-xs font-bold ml-auto px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Button Render according to variant */}
      {variant === "topbar" ? (
        <button
          type="button"
          onClick={handleSendReport}
          disabled={status === "loading"}
          title="Gửi báo cáo tức thì qua Telegram"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            status === "loading"
              ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 opacity-80"
              : status === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
              : status === "error"
              ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400"
              : "bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-slate-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
          } ${className}`}
        >
          {status === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : status === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Send className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span className="hidden sm:inline">
            {status === "loading"
              ? "Đang gửi..."
              : status === "success"
              ? "Đã gửi!"
              : "Gửi báo cáo ngay"}
          </span>
        </button>
      ) : variant === "primary" ? (
        <button
          type="button"
          onClick={handleSendReport}
          disabled={status === "loading"}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 shadow-md ${
            status === "loading"
              ? "bg-white/80 text-blue-800 opacity-90 cursor-not-allowed"
              : status === "success"
              ? "bg-emerald-500 text-white shadow-emerald-500/25 hover:bg-emerald-600"
              : "bg-white text-blue-700 hover:bg-blue-50 shadow-blue-900/10 active:scale-95"
          } ${className}`}
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
          ) : status === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : (
            <Send className="w-4 h-4 text-blue-600" />
          )}
          <span>
            {status === "loading"
              ? "Đang gửi báo cáo..."
              : status === "success"
              ? "Đã gửi thành công!"
              : "Gửi báo cáo ngay qua Telegram"}
          </span>
        </button>
      ) : variant === "outline" ? (
        <button
          type="button"
          onClick={handleSendReport}
          disabled={status === "loading"}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-2 ${
            status === "loading"
              ? "bg-blue-50 text-blue-600 border-blue-200 opacity-70"
              : status === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:border-blue-400"
          } ${className}`}
        >
          {status === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : status === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Send className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span>
            {status === "loading"
              ? "Đang gửi báo cáo..."
              : status === "success"
              ? "Đã gửi tới Telegram!"
              : "Gửi báo cáo ngay"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSendReport}
          disabled={status === "loading"}
          className={`p-2 rounded-xl border transition-colors ${className}`}
          title="Gửi báo cáo ngay"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : status === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <Send className="w-4 h-4 text-blue-500" />
          )}
        </button>
      )}
    </div>
  );
}
