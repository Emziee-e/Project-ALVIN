import React, { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AlertTriangle, GraduationCap } from "lucide-react";

import Logo from "/images/Alvin-logo.png";

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

function GatePage({ icon: Icon, title, children, email, primaryLabel, onPrimary, onSignOut, busy }) {
  return (
    <main className="min-h-screen bg-white flex flex-col font-Geist text-[#111111]">
      <header className="px-6 sm:px-10 py-6">
        <img src={Logo} alt="ALVIN" className="h-12 sm:h-14 w-auto" />
      </header>

      <section className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-16">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#862334]/10
                       flex items-center justify-center"
            aria-hidden="true"
          >
            <Icon className="w-12 h-12 sm:w-14 sm:h-14 text-[#862334]" strokeWidth={1.5} />
          </div>

          <h1 className="mt-8 text-2xl sm:text-3xl font-semibold leading-tight">
            {title}
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
            {children}
          </p>

          {email && (
            <p className="mt-6 text-sm text-gray-500">
              Signed in as <span className="text-[#111111]">{email}</span>
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onPrimary}
              disabled={busy}
              className="px-5 py-2.5 rounded-md bg-[#862334] text-white text-sm font-semibold
                         hover:bg-[#6e1c2a] transition-colors cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus-visible:outline focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-[#862334]"
            >
              {primaryLabel}
            </button>

            <button
              type="button"
              onClick={onSignOut}
              disabled={busy}
              className="px-5 py-2.5 rounded-md border border-[#e5e5e5] bg-white text-sm font-medium
                         text-[#111111] hover:bg-gray-50 transition-colors cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus-visible:outline focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-[#862334]"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>
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
      <GatePage
        icon={GraduationCap}
        title="You need to be enrolled in a course first"
        email={email}
        primaryLabel="Check again"
        onPrimary={() => checkEnrollment({ showLoader: true })}
        onSignOut={handleSignOut}
        busy={signingOut}
      >
        ALVIN is open to students who are enrolled in a course. Ask your Career
        Advisor to enroll you, then select Check again.
      </GatePage>
    );
  }

  return (
    <GatePage
      icon={AlertTriangle}
      title="Enrollment could not be verified"
      email={email}
      primaryLabel="Try again"
      onPrimary={() => checkEnrollment({ showLoader: true })}
      onSignOut={handleSignOut}
      busy={signingOut}
    >
      Something went wrong while checking your course enrollment. Check your
      connection and try again.
    </GatePage>
  );
}