"use client";
import React from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useSettings } from '@/contexts/SettingsContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LowStockWarning() {
  const { allAggregatedInventory } = useInventory();
  const { lowStockThreshold } = useSettings();
  const router = useRouter();
  const [showWarning, setShowWarning] = React.useState(false);

  React.useEffect(() => {
    const warehouseStock: Record<string, number> = {};
    allAggregatedInventory.forEach(item => {
      warehouseStock[item.locationId] = (warehouseStock[item.locationId] || 0) + item.currentBags;
    });

    const isAnyWarehouseLow = Object.values(warehouseStock).some(
      (bagCount) => bagCount < lowStockThreshold
    );
    
    if (isAnyWarehouseLow) {
        setShowWarning(true);
    }
  }, [allAggregatedInventory, lowStockThreshold]);

  const handleNavigate = () => {
    setShowWarning(false);
    router.push('/inventory');
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Low Stock Warning
          </AlertDialogTitle>
          <AlertDialogDescription>
            One or more of your warehouses has fallen below the stock threshold of {lowStockThreshold} bags.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleNavigate}>
            Go to Inventory
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
