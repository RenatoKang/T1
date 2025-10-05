import React from 'react';
import { Member, CurrentUser, Role } from '../types';
import { SKILL_LEVELS } from '../constants';

interface DuesTrackerProps {
    members: Member[];
    onToggleDues: (id: string, month: string) => void;
    currentUser: CurrentUser;
}

const getRelevantMonths = (): string[] => {
    const months: string[] = [];
    const today = new Date();
    // From 5 months ago to 3 months in the future.
    for (let i = 5; i >= -3; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${year}-${month}`);
    }
    return months;
};

export const DuesTracker: React.FC<DuesTrackerProps> = ({ members, onToggleDues, currentUser }) => {
    
    if (members.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-600">No members to track.</h2>
                <p className="text-gray-500 mt-2">Register members first to manage their dues.</p>
            </div>
        )
    }

    const months = getRelevantMonths();
    const isAdmin = currentUser.role === Role.ADMIN;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-full mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-brand-blue">회비 납부 현황</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">이름</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급</th>
                            {months.map(month => (
                               <th key={month} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{month}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.sort((a,b) => a.name.localeCompare(b.name)).map(member => {
                            const skillLabel = SKILL_LEVELS.find(l => l.value === member.skillLevel)?.label || member.skillLevel;
                            return (
                                <tr key={member.id}>
                                    <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white font-medium text-gray-900">{member.name}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{skillLabel}</td>
                                    {months.map(month => (
                                        <td key={month} className="px-4 py-4 whitespace-nowrap text-center">
                                            <span 
                                                onClick={isAdmin ? () => onToggleDues(member.id, month) : undefined}
                                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${member.dues?.[month] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                                            >
                                                {member.dues?.[month] ? '납부' : '미납'}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
