export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-5 h-5" : size === "lg" ? "w-12 h-12" : "w-8 h-8";
  return (
    <div className={`${sizeClass} border-2 border-white/10 border-t-[var(--color-primary)] rounded-full animate-spin`} />
  );
}
