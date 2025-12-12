import { FeatureCard } from '@/components/feature-card';
import { features } from '@/lib/features';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {features.map((feature) => (
        <FeatureCard key={feature.href} feature={feature} />
      ))}
    </div>
  );
}
