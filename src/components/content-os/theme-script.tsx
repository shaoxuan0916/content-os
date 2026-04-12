export function ThemeScript() {
  const code = `
    (() => {
      try {
        const storedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : prefersDark ? "dark" : "light";
        document.documentElement.classList.toggle("dark", theme === "dark");
      } catch {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
