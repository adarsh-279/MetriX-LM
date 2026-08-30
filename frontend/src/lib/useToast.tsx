import React, { useState, useCallback } from 'react';

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3200);
  }, []);
  const node = msg ? <div className="toast">{msg}</div> : null;
  return { show, node };
}
