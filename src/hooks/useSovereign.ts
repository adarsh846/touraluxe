import { useState, useCallback, useRef } from 'react';

interface SovereignResponse {
  thought_process: string;
  tool_call: any;
  state: string;
  ui_message: string;
  results: any[];
}

export function useSovereign() {
  const [isThinking, setIsThinking] = useState(false);
  const [sovereignResponse, setSovereignResponse] = useState<SovereignResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const abortController = useRef<AbortController | null>(null);

  const askSovereign = useCallback(async (message: string, manifest: any[]) => {
    if (!message.trim()) return;

    // Cancel existing request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsThinking(true);
    setError(null);

    try {
      const response = await fetch('/api/sovereign/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, manifest }),
        signal: abortController.current.signal
      });

      if (!response.ok) throw new Error('Refining global inventory...');

      const data = await response.json();
      setSovereignResponse(data);
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      console.error('Sovereign Error:', err);
    } finally {
      setIsThinking(false);
    }
  }, []);

  const clearSovereign = useCallback(() => {
    setSovereignResponse(null);
    setError(null);
  }, []);

  return {
    askSovereign,
    clearSovereign,
    isThinking,
    sovereignResponse,
    error,
    state: sovereignResponse?.state || 'IDLE'
  };
}
