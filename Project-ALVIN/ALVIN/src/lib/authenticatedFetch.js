
import { supabase } from "./supabaseClient";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://project-alvin-backend-production.up.railway.app"
).replace(/\/$/, "");

const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || "";

export async function authenticatedFetch(path, options = {}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  if (!session?.access_token) {
    throw new Error("Please sign in again.");
  }

  const makeRequest = (token) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "X-API-Key": APP_API_KEY,
      },
    });

  let response = await makeRequest(session.access_token);

  if (response.status === 401) {
    const body = await response.clone().json().catch(() => ({}));

    if (body.detail === "Invalid or expired Supabase session.") {
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) throw refreshError;

      if (!refreshedSession?.access_token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      response = await makeRequest(refreshedSession.access_token);
    }
  }

  return response;
}
