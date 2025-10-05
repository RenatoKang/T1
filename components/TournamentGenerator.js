
import React, { useState, useMemo } from 'react';
import { SkillLevel, GameType, Gender, Role } from '../types.js';
import { SKILL_LEVELS } from '../constants.js';
import { generateBracket } from '../services/geminiService.js';
import { BracketDisplay } from './BracketDisplay.js';

export const TournamentGenerator = ({ members, tournaments, onAdd, onUpdate, onDelete, currentUser }) => {
    const [mode, setMode] = useState('level');
    const [selectedLevel, setSelectedLevel] = useState(SkillLevel.MA);
    const [selectedGender, setSelectedGender] = useState(Gender.MALE);
    const [mixedLevels, setMixedLevels] = useState(
        () => SKILL_LEVELS.reduce((acc, level) => ({...acc, [level.value]: false}), {})
    );
    const [gameType, setGameType] = useState(GameType.SINGLES);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTournamentId, setActiveTournamentId] = useState(null);

    const tournamentList = useMemo(() => Object.values(tournaments), [tournaments]);
    const activeTournament = activeTournamentId ? tournaments[activeTournamentId] : null;

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);

        let filteredPlayers = [];
        let tournamentName = '';

        switch(mode) {
            case 'level':
                filteredPlayers = members.filter(m => m.skillLevel === selectedLevel);
                tournamentName = SKILL_LEVELS.find(l => l.value === selectedLevel)?.label || selectedLevel;
                break;
            case 'combined':
                filteredPlayers = members;
                tournamentName = '통합';
                break;
            case 'gender':
                filteredPlayers = members.filter(m => m.gender === selectedGender);
                tournamentName = selectedGender === Gender.MALE ? '남자' : '여자';
                break;
            case 'mixed':
                const activeMixedLevels = Object.keys(mixedLevels).filter(k => mixedLevels[k]);
                if (activeMixedLevels.length === 0) {
                    setError('혼합할 등급을 하나 이상 선택해주세요.');
                    setIsLoading(false);
                    return;
                }
                filteredPlayers = members.filter(m => activeMixedLevels.includes(m.skillLevel));
                tournamentName = `${activeMixedLevels.map(l => l.replace('M','').replace('W','')).join('+')}급 혼합`;
                break;
        }

        tournamentName += gameType === GameType.DOUBLES ? ' 복식' : ' 단식';

        let participants = [];
        if (gameType === GameType.SINGLES) {
            participants = filteredPlayers.map(p => p.name);
        } else {
            const shuffled = [...filteredPlayers].sort(() => Math.random() - 0.5);
            if (shuffled.length < 2) {
                 setError('복식 경기를 생성하려면 최소 2명의 선수가 필요합니다.');
                 setIsLoading(false);
                 return;
            }
            for (let i = 0; i < Math.floor(shuffled.length / 2) * 2; i += 2) {
                participants.push(`${shuffled[i].name} / ${shuffled[i+1].name}`);
            }
        }
        
        if (participants.length < 2) {
            setError('대진표를 생성하려면 최소 2명의 참가자(팀)가 필요합니다.');
            setIsLoading(false);
            return;
        }

        try {
            const matchesData = await generateBracket(participants);
            const newTournament = {
                id: `${tournamentName.replace(' ', '-')}-${new Date().toISOString()}`,
                name: tournamentName,
                type: gameType,
                matches: matchesData.map((match, index) => {
                    const parsePlayer = (p) => {
                        if (!p) return null;
                        return gameType === GameType.DOUBLES ? p.split(' / ') : p;
                    };
                    const p1 = parsePlayer(match.player1);
                    const p2 = parsePlayer(match.player2);
                    return {
                        id: `${tournamentName}-R1-${index}`,
                        player1: p1,
                        player2: p2,
                        winner: p2 === null ? p1 : null,
                        round: 1,
                    }
                }),
            };
            onAdd(newTournament);
            setActiveTournamentId(newTournament.id);
        } catch (e) {
            setError('대진표 생성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdateTournament = (updatedTournament) => {
        onUpdate(updatedTournament);
    }

    const handleDelete = () => {
        if (activeTournamentId && window.confirm(`'${activeTournament?.name}' 대진표를 삭제하시겠습니까?`)) {
            onDelete(activeTournamentId);
            setActiveTournamentId(null);
        }
    }
    
    const renderModeOptions = () => {
        switch(mode) {
            case 'level':
                return React.createElement('select', { value: selectedLevel, onChange: e => setSelectedLevel(e.target.value), className: "p-2 border-gray-300 rounded-md bg-brand-blue text-white focus:ring-brand-secondary" },
                    SKILL_LEVELS.map(l => React.createElement('option', { key: l.value, value: l.value, style: { backgroundColor: '#0077b6', color: 'white' } }, l.label))
                );
            case 'gender':
                return React.createElement('select', { value: selectedGender, onChange: e => setSelectedGender(e.target.value), className: "p-2 border-gray-300 rounded-md bg-brand-blue text-white focus:ring-brand-secondary" },
                    React.createElement('option', { value: Gender.MALE, style: { backgroundColor: '#0077b6', color: 'white' } }, "남자"),
                    React.createElement('option', { value: Gender.FEMALE, style: { backgroundColor: '#0077b6', color: 'white' } }, "여자")
                );
            case 'mixed':
                return React.createElement('div', { className: "flex flex-wrap gap-x-4 gap-y-2" },
                    SKILL_LEVELS.map(l => (
                        React.createElement('label', { key: l.value, className: "flex items-center space-x-2" },
                            React.createElement('input', { type: "checkbox", checked: mixedLevels[l.value], onChange: e => setMixedLevels({...mixedLevels, [l.value]: e.target.checked}), className: "h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" }),
                            React.createElement('span', null, l.label)
                        )
                    ))
                );
            default:
                return null;
        }
    }

    const isAdmin = currentUser.role === Role.ADMIN;

    return (
        React.createElement('div', { className: "bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto space-y-8" },
            isAdmin && (
                React.createElement('div', null,
                    React.createElement('h2', { className: "text-2xl font-bold mb-4 text-brand-blue" }, "대회 대진표 생성기"),
                    React.createElement('div', { className: "space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200" },
                        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                            React.createElement('div', { className: "space-y-3" },
                                React.createElement('h3', { className: "font-semibold text-gray-700" }, "1. 참가자 선택"),
                                React.createElement('div', { className: "flex flex-col space-y-2" },
                                    React.createElement('label', null, React.createElement('input', { type: "radio", name: "mode", value: "level", checked: mode === 'level', onChange: () => setMode('level'), className: "mr-2" }), " 등급별"),
                                    React.createElement('label', null, React.createElement('input', { type: "radio", name: "mode", value: "combined", checked: mode === 'combined', onChange: () => setMode('combined'), className: "mr-2" }), " 통합"),
                                    React.createElement('label', null, React.createElement('input', { type: "radio", name: "mode", value: "gender", checked: mode === 'gender', onChange: () => setMode('gender'), className: "mr-2" }), " 성별"),
                                    React.createElement('label', null, React.createElement('input', { type: "radio", name: "mode", value: "mixed", checked: mode === 'mixed', onChange: () => setMode('mixed'), className: "mr-2" }), " 등급 혼합")
                                ),
                                React.createElement('div', { className: "pl-6" }, renderModeOptions())
                            ),

                            React.createElement('div', { className: "space-y-3" },
                                React.createElement('h3', { className: "font-semibold text-gray-700" }, "2. 게임 종류 선택"),
                                React.createElement('div', { className: "flex flex-col space-y-2" },
                                    React.createElement('label', null, React.createElement('input', { type: "radio", name: "gameType", value: GameType.SINGLES, checked: gameType === GameType.SINGLES, onChange: () => setGameType(GameType.SINGLES), className: "mr-2" }), " 단식"),
                                    React.createElement('label', null, React.createElement('input', { type: "radio", name: "gameType", value: GameType.DOUBLES, checked: gameType === GameType.DOUBLES, onChange: () => setGameType(GameType.DOUBLES), className: "mr-2" }), " 복식")
                                )
                            )
                        ),

                        React.createElement('div', { className: "pt-4 text-center" },
                            React.createElement('button',
                                {
                                    onClick: handleGenerate,
                                    disabled: isLoading,
                                    className: "w-full md:w-auto bg-shuttle-yellow text-brand-blue font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                                },
                                isLoading ? '생성 중...' : '대진표 생성'
                            )
                        )
                    )
                )
            ),

            error && React.createElement('p', { className: "text-red-500 text-center mb-4" }, error),
            
            isAdmin && React.createElement('hr', null),

            React.createElement('div', null,
                 React.createElement('h2', { className: "text-2xl font-bold mb-4 text-brand-blue" }, "생성된 대진표"),
                 tournamentList.length > 0 ? (
                    React.createElement('div', { className: "space-y-4" },
                        React.createElement('div', { className: "flex items-center gap-4" },
                             React.createElement('select', 
                                { 
                                    value: activeTournamentId ?? '', 
                                    onChange: e => setActiveTournamentId(e.target.value),
                                    className: "flex-grow p-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                                },
                                React.createElement('option', { value: "", disabled: true }, "-- 대진표 선택 --"),
                                tournamentList.map(t => React.createElement('option', { key: t.id, value: t.id }, t.name))
                            ),
                            isAdmin && (
                                React.createElement('button', { onClick: handleDelete, disabled: !activeTournamentId, className: "bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 disabled:bg-gray-300" },
                                    "삭제"
                                )
                            )
                        ),
                        activeTournament && React.createElement(BracketDisplay, { tournament: activeTournament, onUpdate: handleUpdateTournament, currentUser: currentUser })
                    )
                 ) : (
                    React.createElement('div', { className: "text-center py-10" },
                        React.createElement('p', { className: "text-gray-500" }, isAdmin ? '위 옵션을 선택하여 대진표를 생성해주세요.' : '운영진이 대진표를 생성할 때까지 기다려주세요.')
                    )
                 )
            )
        )
    );
};
