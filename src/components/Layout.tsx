import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { supabase } from "@/lib/supabase";
import { syncUserSession } from "./AuthModal";

// Layout 组件
function Layout() {
  // Keep the navbar's user info in step with the real Supabase session.
  useEffect(() => {
    void syncUserSession();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void syncUserSession();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export default Layout;
