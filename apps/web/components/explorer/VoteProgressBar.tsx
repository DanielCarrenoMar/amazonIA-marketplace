import React from 'react';

interface VoteProgressBarProps {
  votesFor: number;
  votesAgainst: number;
}

export function VoteProgressBar({ votesFor, votesAgainst }: VoteProgressBarProps) {
  const totalVotes = votesFor + votesAgainst;
  const percentFor = totalVotes === 0 ? 0 : (votesFor / totalVotes) * 100;
  const percentAgainst = totalVotes === 0 ? 0 : (votesAgainst / totalVotes) * 100;

  return (
    <div className="w-full flex flex-col gap-1.5 max-w-[200px]">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-green-600">{votesFor} Favor</span>
        <span className="text-red-600">{votesAgainst} Contra</span>
      </div>
      <div className="w-full h-2.5 rounded-full flex overflow-hidden bg-gray-200 shadow-inner">
        <div style={{ width: `${percentFor}%` }} className="bg-green-500 transition-all duration-500 h-full" />
        <div style={{ width: `${percentAgainst}%` }} className="bg-red-500 transition-all duration-500 h-full" />
      </div>
    </div>
  );
}
