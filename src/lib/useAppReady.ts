
import { useSettings } from "@/contexts/SettingsContext";
import { useMasters } from "@/hooks/useTransactions";

export function useAppReady() {
  const { isAppHydrating } = useSettings();
  const { isMastersLoaded } = useMasters();

  return isMastersLoaded && !isAppHydrating;
}
