import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAllAnnouncements, useCreateAnnouncement, useToggleAnnouncement, useDeleteAnnouncement } from "../../../hooks/useAnnouncements";
import { formatDate } from "../../../utils/formatters";
import { AdminSkeleton } from "./UsersTab";

interface Props {
  currentUser: { id: string };
}

export function AnnouncementsTab({ currentUser }: Props) {
  const { t } = useTranslation();
  const { data: announcements = [], isLoading } = useAllAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const toggleAnnouncement = useToggleAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [message, setMessage] = useState("");
  const [type, setType]       = useState("info");

  function handlePost() {
    if (!message.trim()) return;
    createAnnouncement.mutate(
      { authorId: currentUser.id, message: message.trim(), type },
      { onSuccess: () => setMessage("") }
    );
  }

  return (
    <div>
      <div className="admin-announcement-form">
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{t("adminAnnouncements.newTitle")}</h3>
        <textarea
          id="admin-announcement-message"
          name="message"
          className="admin-textarea"
          rows={3}
          placeholder={t("adminAnnouncements.messagePlaceholder")}
          value={message}
          onChange={e => setMessage(e.target.value)}
          aria-label="Announcement message"
        />
        <div className="admin-type-row">
          {["info", "warning", "success"].map(tp => (
            <button
              key={tp}
              className={`admin-type-btn${type === tp ? ` admin-type-btn--active ${tp}` : ""}`}
              onClick={() => setType(tp)}
            >
              {t(`adminAnnouncements.type${tp.charAt(0).toUpperCase() + tp.slice(1)}`)}
            </button>
          ))}
        </div>
        <button
          className="admin-submit-btn"
          onClick={handlePost}
          disabled={createAnnouncement.isPending || !message.trim()}
        >
          {t("adminAnnouncements.post")}
        </button>
      </div>

      {isLoading ? (
        <AdminSkeleton />
      ) : announcements.length === 0 ? (
        <div className="admin-loading">{t("adminAnnouncements.noAnnouncements")}</div>
      ) : (
        <div className="admin-announcement-list">
          {announcements.map(a => (
            <div key={a.id} className="admin-announcement-item">
              <div>
                <div className="admin-announcement-msg">{a.message}</div>
                <div className="admin-announcement-meta">
                  <span className={`admin-report-type admin-report-type--${a.type === "info" ? "thread" : a.type === "warning" ? "reply" : "comment"}`} style={{ marginRight: 6 }}>
                    {a.type}
                  </span>
                  {formatDate(a.created_at)} · {a.active ? t("adminAnnouncements.active") : t("adminAnnouncements.inactive")}
                </div>
              </div>
              <div className="admin-announcement-actions">
                <button
                  className={`admin-toggle-btn${a.active ? " admin-toggle-btn--active" : " admin-toggle-btn--inactive"}`}
                  onClick={() => toggleAnnouncement.mutate({ id: a.id, active: !a.active })}
                  disabled={toggleAnnouncement.isPending}
                >
                  {a.active ? t("adminAnnouncements.deactivate") : t("adminAnnouncements.activate")}
                </button>
                <button
                  className="admin-action-btn admin-action-btn--danger"
                  onClick={() => deleteAnnouncement.mutate(a.id)}
                  disabled={deleteAnnouncement.isPending}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
