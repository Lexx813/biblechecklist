import { useCategories } from "../../hooks/useForum";
import "../../styles/forum.css";
import "../../styles/social.css";
import "../../styles/share-buttons.css";
import { ForumThreadDetail } from "./ForumThreadDetail";
import { ForumThreadList, ForumCategoryList } from "./ForumThreadList";

export default function ForumPage({ user, profile, onBack, categoryId, threadId, onNavigate, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const activeCategory = categoryId ? categories.find(c => c.id === categoryId) ?? null : null;

  const navProps = { navigate, darkMode, setDarkMode, i18n, user, onLogout };

  if (threadId && categoryId) {
    return (
      <ForumThreadDetail
        threadId={threadId}
        user={user}
        profile={profile}
        categoryId={categoryId}
        categoryName={activeCategory?.name ?? ""}
        onBack={() => onNavigate(categoryId, null)}
        onUpgrade={onUpgrade}
        navigate={navigate}
      />
    );
  }

  if (categoryId) {
    if (catsLoading && !activeCategory) return (
      <div className="forum-rows">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="forum-row" style={{ pointerEvents: "none" }}>
            <div className="forum-row-left">
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%" }} />
            </div>
            <div className="forum-row-mid" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="skeleton" style={{ height: 14, width: "55%", borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 11, width: "35%", borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    );
    if (activeCategory) return (
      <ForumThreadList
        category={activeCategory}
        user={user}
        onSelectThread={(id) => onNavigate(categoryId, id)}
        onBack={() => onNavigate(null, null)}
        onUpgrade={onUpgrade}
        {...navProps}
      />
    );
  }

  return (
    <ForumCategoryList
      onSelectCategory={(cat) => onNavigate(cat.id, null)}
      onSelectThread={(catId, tid) => onNavigate(catId, tid)}
      onBack={onBack}
      onUpgrade={onUpgrade}
      {...navProps}
    />
  );
}
