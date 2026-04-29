import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Leaderboard = ({ players }) => {
  // 1. Front-end sorting logic
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  // Helper for Rank Styling
  const getRankBadge = (rank) => {
    switch (rank) {
      case 1: return <Badge className="bg-yellow-500 hover:bg-yellow-500">1st 🥇</Badge>;
      case 2: return <Badge className="bg-slate-400 hover:bg-slate-400">2nd 🥈</Badge>;
      case 3: return <Badge className="bg-amber-600 hover:bg-amber-600">3rd 🥉</Badge>;
      default: return <span className="font-medium text-muted-foreground ml-3">{rank}th</span>;
    }
  };

  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-sm w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-25">Rank</TableHead>
            <TableHead className="text-center">Student</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            return (
              <TableRow key={player.id} className={rank <= 3 ? "bg-muted/50" : ""}>
                <TableCell>{getRankBadge(rank)}</TableCell>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-200 text-slate-500">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6 w-6"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{player.name}</span>
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {player.score}%
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