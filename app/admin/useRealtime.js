'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribes to Supabase Realtime postgres_changes for the given tables and
 * calls `onChange` (debounced) whenever any of them change. One channel for all.
 *
 * The migration 20260618_admin_dashboard.sql adds these tables to the
 * `supabase_realtime` publication so changes actually broadcast.
 *
 * @param {string[]} tables  — table names in the public schema to watch
 * @param {() => void} onChange — called after a short debounce on any change
 * @param {(connected: boolean) => void} [onStatus] — connection state callback
 */
export function useRealtime(tables, onChange, onStatus) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  const key = tables.join(',');

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('admin-dashboard');
    let timer = null;

    const fire = () => {
      clearTimeout(timer);
      timer = setTimeout(() => cbRef.current?.(), 400);
    };

    tables.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, fire);
    });

    channel.subscribe((status) => {
      statusRef.current?.(status === 'SUBSCRIBED');
    });

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
