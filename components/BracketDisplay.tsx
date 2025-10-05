import React from 'react';
import { Tournament, Match, GameType, CurrentUser, Role } from '../types';

interface BracketDisplayProps {
    tournament: Tournament;
    onUpdate: (updatedTournament: Tournament) => void;
    currentUser: CurrentUser;
}

const getRounds = (matches: Match[]): Match[][] => {
    if (matches.length === 0) return [];
    const rounds: Match[][] = [];
    const maxRound = Math.max(...matches.map(m => m.round));
    for (let i = 1; i <= maxRound; i++) {
        const roundMatches = matches.filter(m => m.round === i).sort((a,b) => a.id.localeCompare(b.id));
        if (roundMatches.length > 0) {
            rounds.push(roundMatches);
        }
    }
    return rounds;
};

const handleAdvanceWinner = (match: Match, winner: string | string[], tournament: Tournament, onUpdate: (ut: Tournament) => void) => {
    const updatedMatches = tournament.matches.map(m =>
        m.id === match.id ? { ...m, winner: winner } : m
    );

    const currentRound = match.round;
    // Find all matches in the current round and sort them to have a consistent order for pairing
    const roundMatches = updatedMatches.filter(m => m.round === currentRound).sort((a,b) => a.id.localeCompare(b.id));
    const roundWinners = roundMatches.map(m => m.winner).filter((w): w is string | string[] => !!w);

    // Check if all matches in the current round have winners and there's more than one winner to advance
    if (roundWinners.length === roundMatches.length && roundWinners.length > 1) {
        // Remove matches from future rounds to regenerate them based on the new winners
        let cleanMatches = updatedMatches.filter(m => m.round <= currentRound);

        // Create matches for the next round
        const nextRoundMatches: Match[] = [];
        for (let i = 0; i < roundWinners.length; i += 2) {
            const nextRoundId = `${tournament.id}-R${currentRound + 1}-${i/2}`;
            if (roundWinners[i+1]) {
                nextRoundMatches.push({
                    id: nextRoundId,
                    round: currentRound + 1,
                    player1: roundWinners[i],
                    player2: roundWinners[i+1],
                    winner: null
                });
            } else { // Handle a bye in the next round
                 nextRoundMatches.push({ 
                    id: nextRoundId,
                    round: currentRound + 1,
                    player1: roundWinners[i],
                    player2: null,
                    winner: roundWinners[i]
                });
            }
        }
        cleanMatches.push(...nextRoundMatches);
        onUpdate({ ...tournament, matches: cleanMatches });
    } else {
         onUpdate({ ...tournament, matches: updatedMatches });
    }
};

const formatPlayerName = (player: string | string[] | { bye: true } | null): string => {
    if (!player) return 'BYE';
    if (typeof player === 'object' && 'bye' in player) return 'BYE';
    if (Array.isArray(player)) return player.join(' / ');
    return player;
};


export const BracketDisplay: React.FC<BracketDisplayProps> = ({ tournament, onUpdate, currentUser }) => {
    const rounds = getRounds(tournament.matches);
    
    if (!tournament) return null;

    return (
        <div>
            <h3 className="text-xl font-bold text-center mb-6 text-brand-blue">{tournament.name}</h3>
            <div className="flex space-x-4 overflow-x-auto p-4 bg-gray-50 rounded-lg">
                {rounds.map((round, roundIndex) => (
                    <div key={roundIndex} className="flex flex-col space-y-4 min-w-[280px]">
                        <h4 className="font-semibold text-center text-gray-700">
                             {round.length === 1 ? '결승' : round.length === 2 ? '준결승' : `${round.length * 2}강`}
                        </h4>
                        {round.map(match => (
                            <div key={match.id} className="bg-white p-3 rounded-md shadow">
                                <MatchCard match={match} tournament={tournament} onUpdate={onUpdate} currentUser={currentUser} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface MatchCardProps {
    match: Match;
    tournament: Tournament;
    onUpdate: (ut: Tournament) => void;
    currentUser: CurrentUser;
}

// FIX: Add type guard to ensure player1 is a real player (string or string[]) and not a bye object before allowing win selection.
const isRealPlayer = (player: Match['player1']): player is string | string[] => {
    return typeof player === 'string' || Array.isArray(player);
};

const MatchCard: React.FC<MatchCardProps> = ({ match, tournament, onUpdate, currentUser }) => {
    const player1 = match.player1;
    const player2 = match.player2;
    const winner = match.winner;
    
    const isP1Winner = JSON.stringify(winner) === JSON.stringify(player1);
    const isP2Winner = JSON.stringify(winner) === JSON.stringify(player2);
    
    const finalRoundNumber = Math.max(...tournament.matches.map(m => m.round));
    const isFinalMatch = match.round === finalRoundNumber;
    const isAdmin = currentUser.role === Role.ADMIN;

    return (
        <div>
            <div className={`flex justify-between items-center p-2 rounded-t-md ${isP1Winner ? 'bg-green-200 font-bold' : ''}`}>
                <span className="truncate">{formatPlayerName(player1)}</span>
                {isAdmin && !winner && player2 && isRealPlayer(player1) && (
                    <button onClick={() => handleAdvanceWinner(match, player1, tournament, onUpdate)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded ml-2">Win</button>
                )}
            </div>
            <div className="border-b-2 border-dashed border-gray-300 my-1 text-center text-xs text-gray-500">VS</div>
            <div className={`flex justify-between items-center p-2 rounded-b-md ${isP2Winner ? 'bg-green-200 font-bold' : ''}`}>
                 <span className="truncate">{formatPlayerName(player2)}</span>
                {isAdmin && !winner && player1 && player2 && (
                    <button onClick={() => handleAdvanceWinner(match, player2, tournament, onUpdate)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded ml-2">Win</button>
                )}
            </div>
            {winner && isFinalMatch && (
                <div className="mt-2 text-center font-bold text-shuttle-yellow bg-brand-blue p-2 rounded">
                    🏆 우승: {formatPlayerName(winner)} 🏆
                </div>
            )}
        </div>
    );
};