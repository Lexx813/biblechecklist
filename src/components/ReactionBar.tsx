import { REACTION_EMOJIS, type ReactionSummary } from "../api/reactions";
import { useToggleReaction } from "../hooks/useReactions";

interface Props {
  targetType: string;
  targetId: string;
  summary?: ReactionSummary;
  bulkKey: string;
  disabled?: boolean;
}

export function ReactionBar({ targetType, targetId, summary, bulkKey, disabled }: Props) {
  const toggle = useToggleReaction([bulkKey]);
  const counts = summary?.counts ?? {};
  const mine = new Set(summary?.mine ?? []);

  const visibleEmojis = REACTION_EMOJIS.filter(e => mine.has(e) || (counts[e] ?? 0) > 0);
  const remainingEmojis = REACTION_EMOJIS.filter(e => !visibleEmojis.includes(e));

  function handleClick(emoji: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (disabled) return;
    toggle.mutate({ targetType, targetId, emoji });
  }

  return (
    <div className="reaction-bar" onClick={e => e.stopPropagation()}>
      {visibleEmojis.map(emoji => {
        const count = counts[emoji] ?? 0;
        const isMine = mine.has(emoji);
        return (
          <button
            key={emoji}
            type="button"
            className={`reaction-pill${isMine ? " reaction-pill--active" : ""}`}
            onClick={e => handleClick(emoji, e)}
            disabled={disabled}
            aria-pressed={isMine}
            aria-label={`React with ${emoji}`}
          >
            <span className="reaction-pill-emoji">{emoji}</span>
            {count > 0 && <span className="reaction-pill-count">{count}</span>}
          </button>
        );
      })}
      {remainingEmojis.length > 0 && (
        <details className="reaction-add">
          <summary className="reaction-add-trigger" aria-label="Add reaction">+</summary>
          <div className="reaction-add-menu">
            {remainingEmojis.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="reaction-add-option"
                onClick={e => handleClick(emoji, e)}
                disabled={disabled}
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
