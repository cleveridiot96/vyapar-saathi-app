import { useSettings } from "@/contexts/SettingsContext";
import { useMasters } from "@/hooks/useTransactions";
import { useTransactions } from "@/hooks/useTransactions";

export function useAppReady() {
  const { isAppHydrating } = useSettings();
  const { isMastersLoaded } = useMasters();
  const { isTransactionsLoaded } = useTransactions();

  return isMastersLoaded && isTransactionsLoaded && !isAppHydrating;
}
