import { useSetRsvp, useRemoveRsvp, useDeleteEvent } from "../../../hooks/useGroups";
import { GroupEvent } from "../../../api/groups";
import { toast } from "../../../lib/toast";
import { formatDate } from "./utils";

interface Props {
  event: GroupEvent;
  isAdmin: boolean;
  groupId: string;
}

export default function EventCard({ event, isAdmin, groupId }: Props) {
  const setRsvp = useSetRsvp(groupId);
  const removeRsvp = useRemoveRsvp(groupId);
  const deleteEvent = useDeleteEvent(groupId);
  const isPast = new Date(event.starts_at) < new Date();

  function handleRsvp(status: "going" | "maybe" | "not_going") {
    if (event.my_rsvp === status) {
      removeRsvp.mutate(event.id, { onError: () => toast.error("Failed to update RSVP.") });
    } else {
      setRsvp.mutate({ eventId: event.id, status }, { onError: () => toast.error("Failed to update RSVP.") });
    }
  }

  return (
    <div className={`grp-event${isPast ? " grp-event--past" : ""}`}>
      <div className="grp-event-date">
        <span className="grp-event-month">{new Date(event.starts_at).toLocaleDateString(undefined, { month: "short" })}</span>
        <span className="grp-event-day">{new Date(event.starts_at).getDate()}</span>
      </div>
      <div className="grp-event-info">
        <div className="grp-event-title-row">
          <h4 className="grp-event-title">{event.title}</h4>
          {isAdmin && (
            <button className="grp-post-delete" onClick={() => deleteEvent.mutate(event.id, { onError: () => toast.error("Failed to delete event.") })} aria-label="Delete event">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          )}
        </div>
        <div className="grp-event-meta">
          <span>{formatDate(event.starts_at)}</span>
          {event.location && <span>· {event.location}</span>}
        </div>
        {event.description && <p className="grp-event-desc">{event.description}</p>}
        <div className="grp-event-rsvp">
          <span className="grp-event-rsvp-count">{event.rsvp_count} going</span>
          {!isPast && (
            <div className="grp-rsvp-btns">
              {(["going", "maybe", "not_going"] as const).map(s => (
                <button
                  key={s}
                  className={`grp-rsvp-btn${event.my_rsvp === s ? " grp-rsvp-btn--active" : ""}`}
                  onClick={() => handleRsvp(s)}
                >
                  {s === "going" ? "Going" : s === "maybe" ? "Maybe" : "Can't go"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
