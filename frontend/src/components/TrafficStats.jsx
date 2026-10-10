import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function TrafficStats() {
  const { authToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!authToken) return;
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (document.visibilityState === 'hidden' || pending) return;
      pending = true;
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/traffic`, {
          headers: { Authorization: `Bearer ${authToken}` }, signal: controller.signal, timeout: 10000,
        });
        if (!controller.signal.aborted) { setStats(response.data.data); setError(false); }
      } catch (_) { if (!controller.signal.aborted) setError(true); }
      finally { pending = false; }
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); clearInterval(interval); document.removeEventListener('visibilitychange', refresh); };
  }, [authToken]);
  const value = number => error ? 'Unavailable' : stats ? number.toLocaleString() : 'Loading…';
  return (
    <section className="mb-8" aria-label="Website traffic">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="admin-stat-card"><h2 className="stat-title">Visitors online</h2><p className="stat-value">{value(stats?.onlineVisitors)}</p><p>Customer browsers active in the last 2 minutes, including guests.</p></div>
        <div className="admin-stat-card"><h2 className="stat-title">Total site visits</h2><p className="stat-value">{value(stats?.totalVisits)}</p><p>{stats?.trackingSince ? `Recorded since ${new Date(stats.trackingSince).toLocaleDateString()}.` : 'Counting starts when tracking is enabled.'} A new visit starts after 30 minutes away.</p></div>
      </div>
      <p className="mt-3 text-sm text-gray-400">Refreshes every 30 seconds. Page refreshes and shared browser tabs count as one visit. Staff visits are excluded.{error && ' Unable to refresh; retrying automatically.'}</p>
    </section>
  );
}
