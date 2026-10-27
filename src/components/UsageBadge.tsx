import { Link } from 'react-router-dom';
import { useUsage } from '@/lib/usage';

/** Small counter showing the plan and what's left this month. kind picks which counter to show. */
export function UsageBadge({ kind }: { kind: 'image' | '3d' }) {
  const { usage } = useUsage();
  if (!usage) {
    return (
      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
        Sign in to generate
      </span>
    );
  }
  if (usage.isOwner) {
    return (
      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Owner &bull; unlimited
      </span>
    );
  }
  const noImages = usage.imagesLimit <= 0 && usage.imagesHighLimit <= 0;
  const noModels = usage.modelsLimit <= 0 && usage.bonus3d <= 0;
  if (kind === 'image' ? noImages : noModels) {
    return (
      <Link
        to="/pricing"
        className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
      >
        Free &bull; browse only &bull; choose a plan
      </Link>
    );
  }
  const chip =
    'text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (kind === '3d') {
    const left = Math.max(0, usage.modelsLimit - usage.modelsUsed);
    return (
      <span className={chip}>
        {usage.plan} &bull; {left} of {usage.modelsLimit} 3D credits left
        {usage.bonus3d > 0 ? ` (+${usage.bonus3d} extra)` : ''}
      </span>
    );
  }
  const stdLeft = Math.max(0, usage.imagesLimit - usage.imagesUsed);
  const highLeft = Math.max(0, usage.imagesHighLimit - usage.imagesHighUsed);
  return (
    <span className={chip}>
      {usage.plan} &bull; Standard {stdLeft}/{usage.imagesLimit}
      {usage.imagesHighLimit > 0 ? ` • High ${highLeft}/${usage.imagesHighLimit}` : ''}
    </span>
  );
}
