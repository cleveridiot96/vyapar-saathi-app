"use client";

import React, { useEffect } from 'react';

export default function AppExitHandler() {
  useEffect(() => {
    // The beforeunload handler has been removed to improve user experience
    // for this offline-first application. Users can close the tab without a prompt.
  }, []);

  return null;
}
