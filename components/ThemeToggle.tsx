"use client";

const KEY = "theme";

// Runs before paint; ivory is the default unless the reader has chosen otherwise.
export const themeScript = `(function(){var t="light";try{var saved=localStorage.getItem("${KEY}");if(saved==="light"||saved==="dark")t=saved}catch(e){}document.documentElement.dataset.theme=t})()`;

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // storage blocked: the choice just won't persist
    }
  }

  // Both icons render; CSS shows the one matching data-theme, so server and client markup agree.
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      <svg className="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
      <svg className="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
    </button>
  );
}
