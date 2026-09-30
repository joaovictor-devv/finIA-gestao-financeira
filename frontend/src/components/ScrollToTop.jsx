import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const frame = requestAnimationFrame(() => {
        const alvo = document.getElementById(hash.slice(1));
        if (alvo) {
          alvo.scrollIntoView({ behavior: "auto", block: "start" });
          alvo.querySelector("input, button, textarea")?.focus({ preventScroll: true });
        }
      });
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;
