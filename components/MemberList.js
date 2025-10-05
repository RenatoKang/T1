
import React, { useState } from 'react';
import { Role } from '../types.js';
import { SKILL_LEVELS } from '../constants.js';

const UserIcon = ({ className }) => (
    React.createElement('svg', { className: className, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" })
    )
);

const GridIcon = ({ className }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: className },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25v2.25A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" })
    )
);

const ListIcon = ({ className }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: className },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" })
    )
);

const getCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

export const MemberList = ({ members, onEdit, onDelete, currentUser }) => {
    const [viewMode, setViewMode] = useState('list');
    
    if (members.length === 0) {
        return (
            React.createElement('div', { className: "text-center py-12" },
                React.createElement('h2', { className: "text-xl font-semibold text-gray-600" }, "Nenhum membro cadastrado ainda."),
                React.createElement('p', { className: "text-gray-500 mt-2" }, "Vá para a aba 'Cadastrar Membro' para adicionar o primeiro membro.")
            )
        )
    }

    const currentMonth = getCurrentMonth();
    const sortedMembers = [...members].sort((a,b) => a.name.localeCompare(b.name));

    const renderGridView = () => (
        React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" },
            sortedMembers.map(member => {
                const duesPaidThisMonth = member.dues?.[currentMonth] ?? false;
                const skillLabel = SKILL_LEVELS.find(l => l.value === member.skillLevel)?.label || member.skillLevel;
                return (
                    React.createElement('div', { key: member.id, className: "bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col" },
                        React.createElement('div', { className: "h-40 bg-gray-200 flex items-center justify-center" },
                            member.profilePicUrl ? (
                                React.createElement('img', { src: member.profilePicUrl, alt: member.name, className: "w-full h-full object-cover" })
                            ) : (
                                React.createElement(UserIcon, { className: "w-20 h-20 text-gray-400" })
                            )
                        ),
                        React.createElement('div', { className: "p-4 flex-grow" },
                            React.createElement('h3', { className: "text-xl font-bold text-brand-blue" }, member.name),
                            React.createElement('p', { className: "text-gray-600 text-sm truncate", title: member.email }, member.email),
                            React.createElement('p', { className: "text-gray-600 text-sm" }, `${member.age} anos, ${member.gender}`),
                            React.createElement('div', { className: "mt-2" },
                                React.createElement('span', { className: "inline-block bg-brand-light text-brand-blue text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full" },
                                    `Nível: ${skillLabel}`
                                ),
                                React.createElement('span', { className: `inline-block text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${duesPaidThisMonth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}` },
                                    `Mensalidade: ${duesPaidThisMonth ? 'Pago' : 'Pendente'}`
                                )
                            )
                        ),
                        React.createElement('div', { className: "px-4 py-2 bg-gray-50 flex justify-end space-x-2 h-12 items-center" },
                           currentUser.role === Role.ADMIN ? (
                                React.createElement(React.Fragment, null,
                                    React.createElement('button', { onClick: () => onEdit(member), className: "text-sm text-blue-600 hover:text-blue-800 font-medium" }, "Editar"),
                                    React.createElement('button', { onClick: () => onDelete(member.id), className: "text-sm text-red-600 hover:text-red-800 font-medium" }, "Excluir")
                                )
                            ) : currentUser.id === member.id ? (
                                React.createElement('button', { onClick: () => onEdit(member), className: "text-sm text-blue-600 hover:text-blue-800 font-medium" }, "Editar")
                            ) : null
                        )
                    )
                );
            })
        )
    );

    const renderListView = () => (
        React.createElement('div', { className: "bg-white rounded-lg shadow-lg overflow-hidden" },
            React.createElement('div', { className: "overflow-x-auto" },
                React.createElement('table', { className: "min-w-full divide-y divide-gray-200" },
                    React.createElement('thead', { className: "bg-gray-50" },
                        React.createElement('tr', null,
                            React.createElement('th', { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Nome"),
                            React.createElement('th', { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "E-mail"),
                            React.createElement('th', { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Nível"),
                            React.createElement('th', { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Idade"),
                            React.createElement('th', { scope: "col", className: "px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Mensalidade do Mês"),
                            React.createElement('th', { scope: "col", className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Ações")
                        )
                    ),
                    React.createElement('tbody', { className: "bg-white divide-y divide-gray-200" },
                        sortedMembers.map(member => {
                            const duesPaidThisMonth = member.dues?.[currentMonth] ?? false;
                            const skillLabel = SKILL_LEVELS.find(l => l.value === member.skillLevel)?.label || member.skillLevel;
                            return (
                                React.createElement('tr', { key: member.id, className: "hover:bg-gray-50" },
                                    React.createElement('td', { className: "px-6 py-4 whitespace-nowrap" },
                                        React.createElement('div', { className: "flex items-center" },
                                            React.createElement('div', { className: "flex-shrink-0 h-10 w-10" },
                                                member.profilePicUrl ? (
                                                    React.createElement('img', { className: "h-10 w-10 rounded-full object-cover", src: member.profilePicUrl, alt: member.name })
                                                ) : (
                                                    React.createElement('div', { className: "h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center" },
                                                        React.createElement(UserIcon, { className: "h-6 w-6 text-gray-400" })
                                                    )
                                                )
                                            ),
                                            React.createElement('div', { className: "ml-4" },
                                                React.createElement('div', { className: "text-sm font-medium text-gray-900" }, member.name),
                                                React.createElement('div', { className: "text-sm text-gray-500" }, member.gender)
                                            )
                                        )
                                    ),
                                    React.createElement('td', { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate", title: member.email }, member.email),
                                    React.createElement('td', { className: "px-6 py-4 whitespace-nowrap" },
                                        React.createElement('span', { className: "inline-block bg-brand-light text-brand-blue text-xs font-semibold px-2.5 py-0.5 rounded-full" },
                                            skillLabel
                                        )
                                    ),
                                    React.createElement('td', { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500" }, `${member.age} anos`),
                                    React.createElement('td', { className: "px-6 py-4 whitespace-nowrap text-center" },
                                         React.createElement('span', { className: `inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${duesPaidThisMonth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}` },
                                            duesPaidThisMonth ? 'Pago' : 'Pendente'
                                        )
                                    ),
                                    React.createElement('td', { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4" },
                                        currentUser.role === Role.ADMIN ? (
                                            React.createElement(React.Fragment, null,
                                                React.createElement('button', { onClick: () => onEdit(member), className: "text-blue-600 hover:text-blue-900" }, "Editar"),
                                                React.createElement('button', { onClick: () => onDelete(member.id), className: "text-red-600 hover:text-red-900" }, "Excluir")
                                            )
                                        ) : currentUser.id === member.id ? (
                                            React.createElement('button', { onClick: () => onEdit(member), className: "text-blue-600 hover:text-blue-900" }, "Editar")
                                        ) : null
                                    )
                                )
                            );
                        })
                    )
                )
            )
        )
    );

    return (
        React.createElement('div', null,
            React.createElement('div', { className: "flex justify-between items-center mb-6" },
                React.createElement('h2', { className: "text-xl font-bold text-gray-700" }, `Total de Membros: ${members.length}`),
                React.createElement('div', { className: "flex items-center space-x-2" },
                    React.createElement('button',
                        {
                            onClick: () => setViewMode('grid'),
                            className: `p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`,
                            'aria-label': "Grid View",
                            title: "Grid View"
                        },
                        React.createElement(GridIcon, { className: "w-5 h-5" })
                    ),
                    React.createElement('button',
                        {
                            onClick: () => setViewMode('list'),
                            className: `p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`,
                            'aria-label': "List View",
                            title: "List View"
                        },
                        React.createElement(ListIcon, { className: "w-5 h-5" })
                    )
                )
            ),
            viewMode === 'grid' ? renderGridView() : renderListView()
        )
    );
};