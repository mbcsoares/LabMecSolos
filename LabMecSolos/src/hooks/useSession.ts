import { useState, useEffect } from 'react';
import { SessionService } from '../services/SessionService';
import { SessionData } from '../models/types';

interface SessionState {
  session: SessionData | null;
  loading: boolean;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ session: null, loading: true });

  useEffect(() => {
    const load = async () => {
      const sess = await SessionService.validateSession();
      setState({ session: sess, loading: false });
    };
    load();
  }, []);

  return state;
}
