import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock3, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || '';

export default function WaitingRoom() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const sessionId = state?.sessionData?.session_id;
  const [queue, setQueue] = useState({ state: 'waiting', position: null });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) { navigate('/user/resume-upload', { replace: true }); return; }
    let cancelled = false;
    let busy = false;
    const check = async () => {
      if (busy || cancelled) return;
      busy = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Please sign in again.');
        const response = await fetch(`${API_BASE_URL}/api/interview/queue/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': APP_API_KEY,
            Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!response.ok) throw new Error(`Queue check failed (${response.status})`);
        const result = await response.json();
        if (cancelled) return;
        setError(''); setQueue(result);
        if (result.state === 'reserved' || result.state === 'active') {
          navigate('/user/live-session', { state: { ...state, queueAdmitted: true }, replace: true });
        }
      } catch (err) { if (!cancelled) setError(err.message); }
      finally { busy = false; }
    };
    check();
    const timer = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [sessionId, navigate, state]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6 font-[Inter,sans-serif]">
      <section className="max-w-lg w-full border border-gray-200 rounded-lg p-8 text-center shadow-sm">
        <Clock3 size={44} className="mx-auto text-[#862334] mb-4" />
        <h1 className="text-2xl font-bold mb-3">ALVIN Waiting Room</h1>
        <p className="text-gray-600 mb-5">Your hardware check is complete. We'll start your interview when a NavTalk slot becomes available.</p>
        <Loader2 className="animate-spin mx-auto text-[#862334] mb-4" size={30} />
        {queue.position ? <p className="font-semibold">Queue position: {queue.position}</p> : <p>Checking availability…</p>}
        {error && <p className="mt-4 text-red-700 flex items-center justify-center gap-2"><AlertCircle size={16}/>{error}</p>}
        <p className="text-xs text-gray-500 mt-6">Keep this page open. Your position is checked every 5 seconds.</p>
      </section>
    </main>
  );
}