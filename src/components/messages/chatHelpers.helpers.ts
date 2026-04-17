// Pure (non-JSX) helper functions for chat messages
// Re-exported from chatHelpers.tsx for testability

export type BubblePosition = "solo" | "first" | "middle" | "last";

interface GroupableMessage {
  id: string;
  sender_id: string;
  created_at: string;
}

export function computePosition(messages: GroupableMessage[], index: number): BubblePosition {
  const msg = messages[index];
  const prev = messages[index - 1];
  const next = messages[index + 1];
  const GAP = 5 * 60 * 1000;
  const sameAsPrev = !!prev
    && prev.sender_id === msg.sender_id
    && (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < GAP;
  const sameAsNext = !!next
    && next.sender_id === msg.sender_id
    && (new Date(next.created_at).getTime() - new Date(msg.created_at).getTime()) < GAP;
  if (!sameAsPrev && !sameAsNext) return "solo";
  if (!sameAsPrev && sameAsNext) return "first";
  if (sameAsPrev && sameAsNext) return "middle";
  return "last";
}
