export type GoalStatus = 'on_track' | 'slightly_behind' | 'off_track';

export function GoalBadge ({ status }: { status: GoalStatus }) {
  if (!status) return <span className="text-xs text-gray-400">Set Goal</span>;

  const styles = {
    on_track: 'bg-green-100 text-green-700 border-green-200',
    slightly_behind: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    off_track: 'bg-red-100 text-red-700 border-red-200',
  };

  const labels = {
    on_track: 'On Track',
    slightly_behind: 'Slightly Behind',
    off_track: 'Off Track',
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${styles[status]} font-medium uppercase tracking-wide`}>
      {labels[status]}
    </span>
  );
};