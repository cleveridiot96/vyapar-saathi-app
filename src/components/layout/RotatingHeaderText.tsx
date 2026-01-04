"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';

const names = [
  "શ્રી ગણેશાય નમઃ",
  "શ્રી સુરાપુરા બાપ્પા",
  "જય જલારામ બાપા",
  "માતૃપિતૃ નમઃ"
];

export function RotatingHeaderText() {
  const [index, setIndex] = useState(0);
  const { state: sidebarState } = useSidebar();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % names.length);
    }, 3000); // Change text every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.h2
          key={index}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "text-lg font-semibold tracking-tight text-sidebar-foreground text-center whitespace-nowrap",
            sidebarState === 'collapsed' && "sr-only" // Hide when collapsed to avoid visual clutter
          )}
        >
          {names[index]}
        </motion.h2>
      </AnimatePresence>
       {sidebarState === 'collapsed' && (
         <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0 transition-colors bg-sidebar-primary/20 text-sidebar-foreground">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
         </div>
       )}
    </div>
  );
}
