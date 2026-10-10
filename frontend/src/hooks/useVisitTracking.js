import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'foodfreakyVisit';
const SESSION_GAP = 30 * 60 * 1000;
let fallbackVisit;

function visitSession() {
  let visit = fallbackVisit;
  try { visit = JSON.parse(localStorage.getItem(STORAGE_KEY)) || visit; } catch (_) { /* Storage may be unavailable. */ }
  const now = Date.now();
  if (!visit || !/^[a-f0-9]{32}$/.test(visit.id) || !Number.isFinite(visit.lastSeen) || now - visit.lastSeen >= SESSION_GAP) {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    visit = { id: Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('') };
  }
  visit.lastSeen = now;
  fallbackVisit = visit;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visit)); } catch (_) { /* Keep the in-memory session. */ }
  return visit.id;
}

export default function useVisitTracking() {
  const { user, authToken, loading } = useAuth();
  const { pathname } = useLocation();
  const staffPage = pathname.startsWith('/superadmin') || pathname.startsWith('/deliveryadmin');
  useEffect(() => {
    if (loading || staffPage || (user && user.role !== 'user')) return;
    let pending = false;
    const heartbeat = async () => {
      if (document.visibilityState === 'hidden' || pending) return;
      pending = true;
      try {
        const sessionId = navigator.locks
          ? await navigator.locks.request(STORAGE_KEY, visitSession)
          : visitSession();
        await axios.post(`${process.env.REACT_APP_API_URL}/api/traffic/heartbeat`, { sessionId }, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}, timeout: 10000,
        });
      } catch (_) { /* Analytics must never interrupt shopping. */ }
      finally { pending = false; }
    };
    heartbeat();
    const interval = setInterval(heartbeat, 30000);
    document.addEventListener('visibilitychange', heartbeat);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', heartbeat); };
  }, [loading, staffPage, user, authToken]);
}
