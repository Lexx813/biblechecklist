import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { friendsApi } from "../../api/friends";
import "../../styles/friends.css";

interface Inviter {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  token: string;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function InviteLandingPage({ token, navigate }: Props) {
  const { t } = useTranslation();
  const [inviter, setInviter] = useState<Inviter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    friendsApi.getInviterByToken(token).then(profile => {
      setInviter(profile as Inviter | null);
      setLoading(false);
    });
    sessionStorage.setItem("invite_token", token);
  }, [token]);

  if (loading) return null;

  if (!inviter) {
    return (
      <div className="invite-landing">
        <div className="invite-card">
          <div className="invite-card-heading">{t("invite.invalidTitle")}</div>
          <div className="invite-card-sub">{t("invite.invalidBody")}</div>
          <button className="invite-card-cta" onClick={() => navigate("home")}>{t("invite.goToApp")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-landing">
      <div className="invite-card">
        {inviter.avatar_url
          ? <img className="invite-card-avatar" src={inviter.avatar_url} alt={inviter.display_name ?? "User"} />
          : <div className="invite-card-avatar-placeholder">{(inviter.display_name ?? "?")[0].toUpperCase()}</div>
        }
        <div className="invite-card-heading">
          {t("invite.invitedYou", { name: inviter.display_name ?? t("invite.someone") })}
        </div>
        <div className="invite-card-sub">
          {t("invite.joinBlurb")}
        </div>
        <button className="invite-card-cta" onClick={() => navigate("signup")}>
          {t("invite.createAccount")}
        </button>
        <div className="invite-card-login">
          {t("invite.haveAccount")}{" "}
          <a href="#" onClick={e => { e.preventDefault(); navigate("login"); }}>{t("invite.signIn")}</a>
        </div>
      </div>
    </div>
  );
}
