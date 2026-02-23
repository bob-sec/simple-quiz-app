import type { Choice } from "../types";

interface ChoiceCardProps {
  choice: Choice;
  selected: boolean;
  disabled: boolean;
  onSelect: (choiceId: string) => void;
}

export default function ChoiceCard({
  choice,
  selected,
  disabled,
  onSelect,
}: ChoiceCardProps) {
  return (
    <button
      onClick={() => !disabled && onSelect(choice.id)}
      disabled={disabled}
      className={[
        "choice-card relative flex flex-col rounded-xl overflow-hidden text-left w-full",
        "border-2 transition-all duration-200",
        selected
          ? "border-[var(--color-primary)] shadow-[0_0_16px_var(--color-primary-dark)] scale-[1.02]"
          : "border-border hover:border-white/20",
        disabled && !selected ? "opacity-60 cursor-not-allowed" : "",
        !disabled ? "cursor-pointer" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-card overflow-hidden">
        {choice.image ? (
          <img
            src={choice.image}
            alt={choice.label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-surface">
            <span className="text-4xl font-black text-white/20">{choice.id}</span>
          </div>
        )}

        {/* Selected overlay */}
        {selected && (
          <div className="absolute inset-0 bg-[var(--color-primary)]/20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Choice ID badge */}
        <div
          className={[
            "absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
            selected ? "bg-[var(--color-primary)] text-white" : "bg-black/50 text-white",
          ].join(" ")}
        >
          {choice.id}
        </div>
      </div>

      {/* Label */}
      <div
        className={[
          "px-2 py-2 text-center text-sm font-bold truncate",
          selected ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]" : "bg-card text-white/80",
        ].join(" ")}
      >
        {choice.label}
      </div>
    </button>
  );
}
