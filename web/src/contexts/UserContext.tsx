import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type PropsWithChildren,
} from "react";
import { apiFetch } from "../services/api";

type UserProfile = {
  age: number | null;
  gender: string | null;
  country_region: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  workout_days_per_week: number | null;
  diet_type: string | null;
  allergies: string | null;
  goals: string | null;
};

type Plan = {
  plan_id: string;
  plan_name: string;
  plan_description: string | null;
  plan_price: number;
};

type User = {
  user_id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type MeResponse = {
  user: User | null;
  profile: UserProfile | null;
  plan: Plan | null;
  profileComplete: boolean;
};

type UserContextType = {
  me: MeResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: PropsWithChildren) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<MeResponse>("/me");
      setMe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ me, loading, error, refetch: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
