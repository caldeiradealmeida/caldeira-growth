import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Em SPA o scroll do window não reseta ao trocar de rota; volta ao topo a cada navegação.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
