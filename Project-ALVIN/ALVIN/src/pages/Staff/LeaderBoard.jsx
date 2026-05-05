import React, { useMemo } from 'react';
import { cn } from "../../lib/utils";
import { Trophy, Award, Zap } from 'lucide-react';

const Table = ({ className, ...props }) => (
  <div className="relative w-full overflow-x-auto">
    <table className={cn("w-full caption-bottom text-sm border-collapse", className)} {...props} />
  </div>
);

const TableHeader = ({ className, ...props }) => (
  <thead className={cn("[&_tr]:border-b bg-[#f9f9f9]", className)} {...props} />
);

const TableBody = ({ className, ...props }) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

const TableRow = ({ className, ...props }) => (
  <tr className={cn("border-b border-[#e5e5e5] transition-colors hover:bg-[#f9f9f9]/50", className)} {...props} />
);

const TableHead = ({ className, ...props }) => (
  <th className={cn("h-12 px-4 text-left align-middle font-geist font-bold text-[#4a4a4a] uppercase text-xs tracking-widest", className)} {...props} />
);

const TableCell = ({ className, ...props }) => (
  <td className={cn("p-4 align-middle", className)} {...props} />
);

const RankBadge = ({ rank, variant = "default" }) => {
  const badgeStyles = {
    gold: "bg-[#ffb003] text-black",
    silver: "bg-[#c0c0c0] text-black",
    bronze: "bg-[#cd7f32] text-white",
    default: "bg-[#e5e5e5] text-[#4a4a4a]",
  };

  const getIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy size={16} strokeWidth={2.5} />;
      case 2:
        return <Award size={16} strokeWidth={2.5} />;
      case 3:
        return <Zap size={16} strokeWidth={2.5} />;
      default:
        return null;
    }
  };

  const getRankLabel = (rank) => {
    switch (rank) {
      case 1:
        return "1st";
      case 2:
        return "2nd";
      case 3:
        return "3rd";
      default:
        return `${rank}th`;
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold", badgeStyles[variant])}>
      {getIcon(rank)}
      {getRankLabel(rank)}
    </div>
  );
};

const Avatar = ({ className, children, ...props }) => (
  <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props}>
    {children}
  </div>
);

const AvatarFallback = ({ className, children, ...props }) => (
  <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-[#862334]/10 text-[#862334] font-bold text-sm", className)} {...props}>
    {children}
  </div>
);

const Leaderboard = ({ players = [] }) => {
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  const getRankVariant = (rank) => {
    switch (rank) {
      case 1:
        return "gold";
      case 2:
        return "silver";
      case 3:
        return "bronze";
      default:
        return "default";
    }
  };

  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Rank</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            return (
              <TableRow
                key={player.id}
                className={rank <= 3 ? "bg-[#862334]/2 hover:bg-[#862334]/5" : ""}
              >
                <TableCell className="font-geist">
                  <RankBadge rank={rank} variant={getRankVariant(rank)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {player.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-inter font-medium text-black">{player.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-geist font-bold text-[#862334] text-base">
                    {player.score}%
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default Leaderboard;
