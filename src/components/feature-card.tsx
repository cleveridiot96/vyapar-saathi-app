"use client";
import React from 'react';
import Link from 'next/link';
import { features } from '@/lib/features';
import { DashboardTile } from './DashboardTile';

type FeatureCardProps = {
  featureTitle: string;
};

export function FeatureCard({ featureTitle }: FeatureCardProps) {
  const feature = features.find(f => f.title === featureTitle);

  if (!feature) {
    return null; 
  }
  
  return (
    <DashboardTile
        title={feature.title}
        iconName={feature.iconName}
        href={feature.href}
        style={{
            '--shadow-color': feature.shadow,
            backgroundImage: `linear-gradient(to bottom right, ${feature.gradientFrom}, ${feature.gradientTo})`,
            color: feature.textColor,
        } as React.CSSProperties}
    />
  );
}
