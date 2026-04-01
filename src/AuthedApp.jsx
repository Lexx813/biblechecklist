import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSession, useLogout } from "./hooks/useAuth";
import { useFullProfile } from "./hooks/useAdmin";
import { profileApi } from "./api/profile";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { useSubscription } from "./hooks/useSubscription";
import { supabase } from "./lib/supabase";
import { parsePath, buildPath } from "./lib/router";
import { toast } from "./lib/toast";
import { getStoredReferralCode, clearStoredReferralCode, trackSignup } from "./lib/analytics";
import LoadingSpinner from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import UpgradeModal from "./components/UpgradeModal";
import UpgradePrompt, { isDismissed, dismissPrompt } from "./components/UpgradePrompt";
import WelcomePremiumModal from "./components/WelcomePremiumModal";
import ConsentGate from "./components/ConsentGate";

const AuthPage          = lazy(() => import("./views/auth/AuthPage"));
const ResetPasswordPage = lazy(() => import("./views/auth/ResetPasswordPage"));
const HomePage          = lazy(() => import("./views/HomePage"));
const ChecklistPage     = lazy(() => import("./views/ChecklistPage"));
const OfflineBanner     = lazy(() => import("./components/OfflineBanner"));
const Toast             = lazy(() => import("./components/Toast"));
const InstallPrompt     = lazy(() => import("./components/InstallPrompt"));
const PageFooter        = lazy(() => import("./components/PageFooter"));
const AdminPage         = lazy(() => import("./views/admin/AdminPage"));
const ProfilePage       = lazy(() => import("./views/profile/ProfilePage"));
const BlogPage          = lazy(() => import("./views/blog/BlogPage"));
const BlogDashboard     = lazy(() => import("./views/blog/BlogDashboard"));
const ForumPage         = lazy(() => import("./views/forum/ForumPage"));
const QuizPage          = lazy(() => import("./views/quiz/QuizPage"));
const QuizLevel         = lazy(() => import("./views/quiz/QuizPage").then(m => ({ default: m.QuizLevel })));
const SettingsPage      = lazy(() => import("./views/profile/SettingsPage"));
const SearchPage        = lazy(() => import("./views/search/SearchPage"));
const BookmarksPage     = lazy(() => import("./views/bookmarks/BookmarksPage"));
const ReadingHistory    = lazy(() => import("./views/reading/ReadingHistory"));
const ActivityFeed      = lazy(() => import("./views/social/ActivityFeed"));
const LeaderboardPage   = lazy(() => import("./views/LeaderboardPage"));
const AboutPage         = lazy(() => import("./views/AboutPage"));
const TermsPage         = lazy(() => import("./views/TermsPage"));
const PrivacyPage       = lazy(() => import("./views/PrivacyPage"));
const ReadingPlansPage  = lazy(() => import("./views/readingplans/ReadingPlansPage"));
const StudyNotesPage    = lazy(() => import("./views/studynotes/StudyNotesPage"));
const MessagesPage      = lazy(() => import("./views/messages/MessagesPage"));
const FloatingChat      = lazy(() => import("./components/messages/FloatingChat"));
const GroupsPage        = lazy(() => import("./views/groups/GroupsPage"));
const GroupDetail       = lazy(() => import("./views/groups/GroupDetail"));
const NotFoundPage      = lazy(() => import("./views/NotFoundPage"));
const AIToolsPage       = lazy(() => import("./views/aitools/AIToolsPage"));
const StudyTopicsPage   = lazy(() => import("./views/studytopics/StudyTopicsPage"));
const StudyTopicDetail  = lazy(() => import("./views/studytopics/StudyTopicDetail"));
const FamilyQuizPage    = lazy(() => import("./views/familyquiz/FamilyQuizPage"));
const MeetingPrepPage   = lazy(() => import("./views/meetingprep/MeetingPrepPage"));

// ── Lazy-page wrapper with error boundary ─────────────────────────────────────

const pageFallback = <LoadingSpinner />;

function Page({ children, noFooter = false }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={pageFallback}>
        <main id="main-content">
          {children}
        </main>
        {!noFooter && <PageFooter />}
      </Suspense>
    </ErrorBoundary>
  );
}

// ── Authenticated app with routing ────────────────────────────────────────────

function BibleApp({ user, onLogout, i18n, aiEnabled }) {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useFullProfile(user.id);

  const { isPremium, subscribe } = useSubscription(user.id);

  // Apply referral code if present (runs once after profile loads)
  useEffect(() => {
    if (!profile || profile.referred_by) return;
    const refCode = getStoredReferralCode();
    if (!refCode) return;
    import("./api/referral").then(({ referralApi }) => {
      referralApi.applyReferral(user.id, refCode).then((applied) => {
        if (applied) clearStoredReferralCode();
      }).catch(() => {});
    });
  }, [profile, user.id]);

  // Update last_active_at for re-engagement email targeting
  useEffect(() => {
    supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id).then(() => {});
  }, [user.id]);

  const [nav, setNav] = useState(parsePath);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("nwt-theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [gatedFeature, setGatedFeature] = useState(null);

  const FEATURE_PROMPTS = {
    studyNotes: {
      icon: "📝",
      title: "Study Notes",
      message: "Write rich-text notes for any chapter, organise by folder, and export as Markdown or PDF.",
      ctaLabel: "Unlock Premium — $3/mo",
    },
    readingPlans: {
      icon: "📅",
      title: "Reading Plans",
      message: "Follow structured plans like NWT in 1 Year with daily assignments and progress tracking.",
      ctaLabel: "Unlock Premium — $3/mo",
    },
    aiTools: {
      icon: "✨",
      title: "AI Study Assistant",
      message: "Ask anything about any verse and get grounded, passage-linked answers from Scripture.",
      ctaLabel: "Unlock Premium — $3/mo",
    },
    messages: {
      icon: "💬",
      title: "Direct Messages",
      message: "Private conversations with other publishers in the community.",
      ctaLabel: "Unlock Premium — $3/mo",
    },
    groups: {
      icon: "👥",
      title: "Study Groups",
      message: "Group chat, shared progress tracking, and weekly leaderboards with your study group.",
      ctaLabel: "Unlock Premium — $3/mo",
    },
  };

  function openUpgrade() { setShowUpgradeModal(true); }

  // Handle Stripe redirect callbacks
  const pollingRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("subscribed")) {
      history.replaceState(null, "", window.location.pathname);
      let attempts = 0;
      pollingRef.current = setInterval(async () => {
        try {
          const data = await queryClient.fetchQuery({
            queryKey: ["fullProfile", user.id],
            queryFn: () => profileApi.get(user.id),
            staleTime: 0,
          });
          if (data?.subscription_status === "active" || data?.subscription_status === "trialing") {
            clearInterval(pollingRef.current);
            setShowWelcomeModal(true);
          } else if (++attempts >= 6) {
            clearInterval(pollingRef.current);
            toast("🎉 Subscription received! Refresh if features aren't unlocked yet.");
          }
        } catch {
          clearInterval(pollingRef.current);
        }
      }, 2000);
      return () => clearInterval(pollingRef.current);
    } else if (params.has("checkout_canceled")) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, [queryClient, user.id]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("nwt-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Follow OS theme changes in real time (user can still manually override via the toggle)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onOsChange(e) { setDarkMode(e.matches); }
    mq.addEventListener("change", onOsChange);
    return () => mq.removeEventListener("change", onOsChange);
  }, []);

  useEffect(() => {
    const handler = () => setNav(parsePath());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Handle push notification tap — service worker posts { type: "push-navigate", url }
  // instead of using client.navigate() which is unreliable on Android Chrome.
  useEffect(() => {
    function handler(e) {
      if (e.data?.type === "push-navigate" && typeof e.data.url === "string") {
        const path = e.data.url;
        history.pushState(null, "", path);
        setNav(parsePath());
      }
    }
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  // Clear the app icon badge when the user returns to the app
  useEffect(() => {
    function clearBadge() {
      if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    }
    clearBadge(); // clear on mount
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") clearBadge();
    });
  }, []);

  const navigate = (page, params = {}) => {
    const path = buildPath(page, params);
    history.pushState(null, "", path);
    setNav({ page, ...params });
  };

  const sharedNav = { navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage: nav.page, onUpgrade: openUpgrade };

  let pageContent = null;
  if (nav.page === "home") pageContent = <Page><HomePage user={user} navigate={navigate} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} isPremium={isPremium} onUpgrade={openUpgrade} /></Page>;
  else if (nav.page === "main") pageContent = <Page><ChecklistPage user={user} profile={profile} {...sharedNav} /></Page>;
  else if (nav.page === "admin") {
    if (!profileLoading && !profile?.is_admin && !profile?.is_moderator) navigate("home");
    else if (profile?.is_admin || profile?.is_moderator) pageContent = <Page><AdminPage currentUser={user} currentProfile={profile} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  }
  else if (nav.page === "profile")  pageContent = <Page><ProfilePage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "settings") pageContent = <Page><SettingsPage user={user} onBack={() => navigate("profile")} {...sharedNav} /></Page>;
  else if (nav.page === "publicProfile") pageContent = <Page><ProfilePage user={user} viewedUserId={nav.userId} isOwner={false} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "blog") pageContent = (
    <Page>
      <BlogPage
        user={user} profile={profile} slug={nav.slug ?? null}
        onSelectPost={(slug) => navigate("blog", { slug })}
        onBack={() => navigate("home")}
        onWriteClick={() => navigate("blogDash")}
        {...sharedNav}
      />
    </Page>
  );
  else if (nav.page === "blogDash") {
    if (!profileLoading && profile && !profile.can_blog && !profile.is_admin) navigate("blog");
    else if (!profile || profile.can_blog || profile.is_admin) pageContent = <Page><BlogDashboard user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  }
  else if (nav.page === "forum") pageContent = (
    <Page>
      <ForumPage
        user={user} profile={profile}
        categoryId={nav.categoryId ?? null} threadId={nav.threadId ?? null}
        onNavigate={(categoryId, threadId) => navigate("forum", { categoryId, threadId })}
        onBack={() => navigate("home")}
        {...sharedNav}
      />
    </Page>
  );
  else if (nav.page === "quiz")      pageContent = <Page><QuizPage user={user} {...sharedNav} /></Page>;
  else if (nav.page === "quizLevel") pageContent = <Page><QuizLevel level={nav.level} user={user} onBack={() => navigate("quiz")} onComplete={() => navigate("quiz")} {...sharedNav} /></Page>;
  else if (nav.page === "search")    pageContent = <Page><SearchPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "bookmarks") pageContent = <Page><BookmarksPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "history")   pageContent = <Page><ReadingHistory user={user} onBack={() => navigate("main")} {...sharedNav} /></Page>;
  else if (nav.page === "feed")      pageContent = <Page><ActivityFeed user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "readingPlans") pageContent = <Page><ReadingPlansPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "studyNotes")   pageContent = <Page><StudyNotesPage user={user} navigate={navigate} initialTab={nav.tab ?? "mine"} {...sharedNav} /></Page>;
  else if (nav.page === "aiTools" && (profile?.is_admin || (aiEnabled && isPremium))) pageContent = <Page><AIToolsPage user={user} {...sharedNav} /></Page>;
  else if (nav.page === "studyTopics")      pageContent = <Page><StudyTopicsPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (nav.page === "studyTopicDetail") pageContent = <Page><StudyTopicDetail user={user} navigate={navigate} slug={nav.slug} {...sharedNav} /></Page>;
  else if (nav.page === "familyQuiz") pageContent = (
    <Page>
      <FamilyQuizPage
        user={user}
        {...sharedNav}
        {...(nav.challengeId ? { initialChallengeId: nav.challengeId } : {})}
      />
    </Page>
  );
  else if (nav.page === "leaderboard") pageContent = <Page><LeaderboardPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "about")     pageContent = <Page><AboutPage {...sharedNav} /></Page>;
  else if (nav.page === "terms")     pageContent = <Page><TermsPage {...sharedNav} /></Page>;
  else if (nav.page === "privacy")   pageContent = <Page><PrivacyPage {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "messages")     pageContent = <Page noFooter><MessagesPage {...sharedNav} initialConv={nav.conversationId ? { conversation_id: nav.conversationId, other_display_name: nav.otherDisplayName ?? null, other_avatar_url: nav.otherAvatarUrl ?? null } : null} /></Page>;
  else if (isPremium && nav.page === "groups")       pageContent = <Page><GroupsPage {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "groupDetail")  pageContent = <Page><GroupDetail {...sharedNav} groupId={nav.groupId} /></Page>;
  else if (nav.page === "meetingPrep") pageContent = <Page><MeetingPrepPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  // Premium-gated pages for non-premium users → send home (with upgrade prompt)
  else if (!isPremium && ["messages", "groups", "groupDetail", "readingPlans", "studyNotes", "aiTools"].includes(nav.page)) {
    if (!profileLoading) {
      const feature = nav.page === "groupDetail" ? "groups" : nav.page;
      navigate("home");
      if (!isDismissed(`gate-${feature}`)) setGatedFeature(feature);
      else openUpgrade();
    }
  }
  // Truly unknown URL → 404
  else if (nav.page === "notFound") {
    pageContent = (
      <Page>
        <NotFoundPage navigate={navigate} />
      </Page>
    );
  }

  if (!pageContent) {
    if (profileLoading) return null;
    return null;
  }

  if (!profileLoading && profile && !profile.terms_accepted_at) {
    return <ConsentGate userId={user.id} />;
  }

  return (
    <>
      <div key={nav.page} className="page-fade-in">
        {pageContent}
      </div>
      {isPremium && nav.page !== "messages" && (
        <Suspense fallback={null}>
          <FloatingChat
            user={user}
            navigate={navigate}
            initialConvId={nav.conversationId ?? null}
            initialConvName={nav.otherDisplayName ?? null}
            initialConvAvatar={nav.otherAvatarUrl ?? null}
          />
        </Suspense>
      )}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onSubscribe={() => subscribe.mutate()}
          loading={subscribe.isPending}
        />
      )}
      {showWelcomeModal && (
        <WelcomePremiumModal
          onClose={() => setShowWelcomeModal(false)}
          navigate={navigate}
        />
      )}
      {gatedFeature && FEATURE_PROMPTS[gatedFeature] && (
        <UpgradePrompt
          icon={FEATURE_PROMPTS[gatedFeature].icon}
          title={FEATURE_PROMPTS[gatedFeature].title}
          message={FEATURE_PROMPTS[gatedFeature].message}
          ctaLabel={FEATURE_PROMPTS[gatedFeature].ctaLabel}
          onCta={() => {
            dismissPrompt(`gate-${gatedFeature}`);
            setGatedFeature(null);
            openUpgrade();
          }}
          onDismiss={() => {
            dismissPrompt(`gate-${gatedFeature}`);
            setGatedFeature(null);
          }}
        />
      )}
    </>
  );
}

// ── Auth shell ────────────────────────────────────────────────────────────────

export default function AuthedApp({ onShowLanding, i18n }) {
  const queryClient = useQueryClient();
  const { data: session, isLoading: authLoading } = useSession();
  const logout = useLogout();
  const user = session?.user ?? null;
  const { t } = useTranslation();
  const { maintenanceMode, aiEnabled } = useFeatureFlags();
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);

  // Apply saved theme immediately so auth/sign-up pages respect dark mode
  useEffect(() => {
    const saved = localStorage.getItem("nwt-theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.dataset.theme = saved;
    } else {
      // Fall back to OS preference for new users
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
    }
  }, []);

  // Keep React Query cache in sync with Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      queryClient.setQueryData(["session"], newSession);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "USER_DELETED" || (event === "SIGNED_OUT" && !newSession)) {
        queryClient.removeQueries({ predicate: q => q.queryKey[0] !== "session" });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  if (authLoading) return <LoadingSpinner className="spinner-wrap--fullscreen" />;
  if (maintenanceMode) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:"1rem"}}><h1>🔧 Maintenance</h1><p>We'll be back shortly.</p></div>;

  // Allow unauthenticated read-only access to blog posts
  const publicNav = parsePath();
  if (!user && publicNav.page === "blog" && publicNav.slug) {
    document.documentElement.dataset.theme = "light";
    const publicNavigate = (page, params = {}) => {
      history.pushState(null, "", buildPath(page, params));
    };
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <BlogPage
            user={null} profile={null}
            slug={publicNav.slug}
            onSelectPost={(slug) => publicNavigate("blog", { slug })}
            onBack={() => { history.pushState(null, "", "/"); onShowLanding(); }}
            onWriteClick={null}
            navigate={publicNavigate}
            darkMode={false} setDarkMode={() => {}}
            i18n={i18n} onLogout={null}
          />
          <PageFooter />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (passwordRecovery) {
    return <main id="main-content"><Suspense fallback={null}><ResetPasswordPage onDone={() => setPasswordRecovery(false)} /></Suspense></main>;
  }

  // Show email confirmation screen after signup — rendered here so it
  // survives even if Supabase sets a session before the user confirms.
  if (registeredEmail) {
    return (
      <main id="main-content">
        <Suspense fallback={null}>
          <AuthPage
            onBack={onShowLanding}
            confirmedEmail={registeredEmail}
            onConfirmDismiss={() => setRegisteredEmail(null)}
          />
        </Suspense>
      </main>
    );
  }

  if (!user) {
    if (publicNav.page === "notFound") {
      return (
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <NotFoundPage navigate={() => { history.pushState(null, "", "/"); onShowLanding(); }} />
          </Suspense>
        </ErrorBoundary>
      );
    }
    return (
      <main id="main-content">
        <Suspense fallback={null}>
          <AuthPage onBack={onShowLanding} onRegisterSuccess={(email) => setRegisteredEmail(email)} />
        </Suspense>
      </main>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Suspense fallback={null}><OfflineBanner /></Suspense>
      <Suspense fallback={null}><Toast /></Suspense>
      <Suspense fallback={null}><InstallPrompt /></Suspense>
      <BibleApp
        user={user}
        onLogout={() => { logout.mutate(); onShowLanding(); }}
        i18n={i18n}
        t={t}
        aiEnabled={aiEnabled}
      />
    </>
  );
}
