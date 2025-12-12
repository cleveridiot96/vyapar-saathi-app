import Link from 'next/link';
import { features, type Feature } from '@/lib/features';

type FeatureCardProps = {
  featureTitle: string;
};

export function FeatureCard({ featureTitle }: FeatureCardProps) {
  const feature = features.find(f => f.title === featureTitle);

  if (!feature) {
    return null; // or a placeholder/error component
  }
  
  const Icon = feature.icon;

  return (
    <Link href={feature.href} className="group block">
      <div
        className="relative flex h-40 flex-col items-center justify-center rounded-xl p-4 text-center shadow-lg transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:shadow-2xl"
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${feature.gradientFrom}, ${feature.gradientTo})`,
          boxShadow: feature.shadow,
          color: feature.textColor,
        }}
      >
        <div className="absolute inset-0 rounded-xl bg-white/[.08] backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
          <Icon className="h-8 w-8" />
          <h3 className="font-semibold">{feature.title}</h3>
        </div>
      </div>
    </Link>
  );
}
