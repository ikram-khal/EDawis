interface VoteBarProps {
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
}

export function VoteBar({ votesFor, votesAgainst, votesAbstain }: VoteBarProps) {
  const total = votesFor + votesAgainst + votesAbstain;
  if (total === 0) return <div className="h-6 rounded bg-muted" />;
  
  const pFor = (votesFor / total) * 100;
  const pAgainst = (votesAgainst / total) * 100;
  const pAbstain = (votesAbstain / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex h-6 rounded-md overflow-hidden">
        {pFor > 0 && <div className="vote-bar-for transition-all" style={{ width: `${pFor}%` }} />}
        {pAgainst > 0 && <div className="vote-bar-against transition-all" style={{ width: `${pAgainst}%` }} />}
        {pAbstain > 0 && <div className="vote-bar-abstain transition-all" style={{ width: `${pAbstain}%` }} />}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm vote-bar-for inline-block" /> Қосыламан: {votesFor}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm vote-bar-against inline-block" /> Қарсыман: {votesAgainst}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm vote-bar-abstain inline-block" /> Бийтәреп: {votesAbstain}</span>
      </div>
    </div>
  );
}
