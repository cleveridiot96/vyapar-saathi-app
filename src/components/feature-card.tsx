import Link from 'next/link';
import type { Feature } from '@/lib/features';

type FeatureCardProps = {
  feature: Feature;
};

export function FeatureCard({ feature }: FeatureCardProps) {
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
          <feature.icon className="h-8 w-8" />
          <h3 className="font-semibold">{feature.title}</h3>
        </div>
      </div>
    </Link>
  );
}
