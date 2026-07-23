interface AuthMessageProps {
  message?: string;
  tone?: "error" | "success" | "info";
}

export function AuthMessage({ message, tone = "info" }: AuthMessageProps) {
  if (!message) return null;

  const styles = {
    error: "border-red-400/30 bg-red-500/10 text-red-200",
    success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    info: "border-cosmic-purple/30 bg-cosmic-purple/10 text-foreground/90",
  } as const;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`mb-4 rounded-lg border px-3 py-2 text-sm ${styles[tone]}`}
    >
      {message}
    </p>
  );
}
