import { useEffect, useState } from "react";
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
          <div className="invite-card-heading">Invalid Invite Link</div>
          <div className="invite-card-sub">This invite link is invalid or has expired.</div>
          <button className="invite-card-cta" onClick={() => navigate("home")}>Go to App</button>
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
          {inviter.display_name ?? "Someone"} invited you!
        </div>
        <div className="invite-card-sub">
          Join NWT Progress to track your Bible reading and connect with friends.
        </div>
        <button className="invite-card-cta" onClick={() => navigate("signup")}>
          Create Free Account
        </button>
        <div className="invite-card-login">
          Already have an account?{" "}
          <a href="#" onClick={e => { e.preventDefault(); navigate("login"); }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
