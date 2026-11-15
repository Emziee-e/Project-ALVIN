import React, { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Loading from "./Loading.jsx";
import { supabase } from "../lib/supabaseClient";

/*
 * Layout route for every student page.
 *
 * It asks the backend for the student's course enrollments ONCE when it
 * mounts. Because it is a layout route, it stays mounted while the student
 * moves between /user/* pages, so it never re-checks (or flashes a loader)
 * in the middle of a live interview.
 *
 * Statuses:
 *   checking     -> waiting for the enrollment check
 *   enrolled     -> render the requested student page
 *   not_enrolled -> show the "enrollment required" page
 *   error        -> the check itself failed (network / server); never
 *                   treated as "enrolled", never shown as "not enrolled"
 */

function StatusScreen({
  kicker,
  title,
  description,
  email,
  primaryLabel,
  onPrimary,
  onSignOut,
  busy,
}) {
  return (
    <main className="min-h-screen w-full bg-[#F7F7F8] text-slate-950 font-[Inter,sans-serif] flex flex-col justify-between selection:bg-[#862334]/15 selection:text-[#862334]">
      {/* Minimal Top Bar */}
      <header className="w-full max-w-5xl mx-auto px-6 sm:px-12 py-8 flex items-center justify-end">
        {email && (
          <span className="text-xs text-slate-400 truncate max-w-[240px] sm:max-w-none">
            {email}
          </span>
        )}
      </header>

      {/* Center Editorial Viewport */}
      <section className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12">
        <div className="w-full max-w-lg text-center">
          <p className="font-[Geist,sans-serif] text-xs font-bold uppercase tracking-[0.22em] text-[#862334]">
            {kicker}
          </p>

          <div className="w-8 h-[2px] bg-[#862334]/30 mx-auto mt-4 mb-6 rounded-full" />

          <h1 className="font-[Geist,sans-serif] text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-slate-950 leading-[1.12]">
            {title}
          </h1>

          <p className="mt-5 text-base sm:text-[17px] leading-relaxed text-slate-500 max-w-md mx-auto">
            {description}
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onPrimary}
              disabled={busy}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#862334] text-white font-[Geist,sans-serif] text-sm font-semibold hover:bg-[#6e1c2a] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#862334]"
            >
              {primaryLabel}
            </button>

            <button
              type="button"
              onClick={onSignOut}
              disabled={busy}
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-[Geist,sans-serif] text-sm font-medium hover:border-slate-300 hover:text-slate-950 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 sm:px-12 py-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <span>ALVIN: AI-Powered Learning</span>
        <span>Need help? Contact your Career Advisor.</span>
      </footer>
    </main>
  );
}

export default function EnrollmentGate() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("checking");
  const [email, setEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const checkEnrollment = useCallback(async ({ showLoader }) => {
    if (showLoader) setStatus("checking");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setStatus("error");
        return;
      }

      setEmail(session.user?.email || "");

      const base =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      const response = await fetch(`${base}/api/student/enrollments`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "X-API-Key": import.meta.env.VITE_APP_API_KEY || "",
        },
      });

      if (!response.ok) {
        throw new Error(`Enrollment request failed (${response.status})`);
      }

      const rows = await response.json();
      const enrolled = Array.isArray(rows) && rows.length > 0;

      setStatus(enrolled ? "enrolled" : "not_enrolled");
    } catch (error) {
      console.error("Unable to verify student enrollment:", error);
      setStatus("error");
    }
  }, []);

  // The initial state is already "checking", so the first run does not need
  // to set it again.
  useEffect(() => {
    checkEnrollment({ showLoader: false });
  }, [checkEnrollment]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      navigate("/login/student", { replace: true });
    }
  };

  if (status === "checking") return <Loading />;

  if (status === "enrolled") return <Outlet />;

  if (status === "not_enrolled") {
    return (
      <StatusScreen
        kicker="Enrollment Required"
        title="You're Not Enrolled in a Course Yet."
        description="Access is currently open to students assigned to an active course section. Ask your Career Advisor to enroll your account, then check again."
        email={email}
        primaryLabel="Check again"
        onPrimary={() => checkEnrollment({ showLoader: true })}
        onSignOut={handleSignOut}
        busy={signingOut}
      />
    );
  }

  return (
    <StatusScreen
      kicker="Connection Error"
      title="We couldn't verify your Enrollment."
      description="A network or server issue interrupted your course check. Make sure you're connected to the internet and try again."
      email={email}
      primaryLabel="Try again"
      onPrimary={() => checkEnrollment({ showLoader: true })}
      onSignOut={handleSignOut}
      busy={signingOut}
    />
  );
}