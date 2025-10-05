import React from 'react';
import { View } from '../types.js';

const ShuttlecockIcon = ({ className }) => (
    React.createElement('svg', { className: className, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
        React.createElement('path', { d: "M13 3.939V2h-2v1.939A9.503 9.503 0 0 0 6.643 7.4L5 6.4V5H3v1.4l1.643 1L3 8.8v1.2l1.643-1L3 10.4V11.6l1.643-1L3 12v1h2v-.4l1.643-1A9.503 9.503 0 0 0 11 15.061V22h2v-6.939a9.503 9.503 0 0 0 4.357-3.462L19 12v-1h-2v.4l-1.643 1A9.503 9.503 0 0 0 13 3.939z" })
    )
);


export const Header = ({ currentView, onNavigate, memberCount, currentUser, onLogout }) => {
  const navItems = [
    { view: View.ADD_MEMBER, label: 'Cadastrar Membro', requiresMembers: false },
    { view: View.MEMBERS, label: 'Lista de Membros', requiresMembers: true },
    { view: View.DUES, label: 'Controle de Mensalidades', requiresMembers: true },
    { view: View.TOURNAMENT, label: 'Gerar Chaves', requiresMembers: true },
  ];

  return (
    React.createElement('header', { className: "bg-brand-blue shadow-md" },
      React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
        React.createElement('div', { className: "flex items-center justify-between h-20" },
          React.createElement('div', { className: "flex items-center" },
            React.createElement(ShuttlecockIcon, { className: "h-8 w-8 text-shuttle-yellow" }),
            React.createElement('h1', { className: "text-2xl font-bold text-white ml-3" }, "Gerenciador do Clube de Badminton BR")
          ),
          currentUser && (
            React.createElement('div', { className: "flex items-center space-x-4" },
                React.createElement('div', { className: "text-right text-white" },
                    React.createElement('p', { className: "font-semibold" }, currentUser.name),
                    React.createElement('p', { className: "text-xs opacity-80" }, currentUser.role === 'ADMIN' ? 'Admin' : 'Membro')
                ),
                React.createElement('button', { onClick: onLogout, className: "text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded" },
                  "Sair"
                )
            )
          )
        ),
        React.createElement('nav', { className: "flex justify-around p-2 bg-brand-secondary rounded-b-lg" },
             navItems.map(item => {
               const isDisabled = item.requiresMembers && memberCount === 0;
               return (
              React.createElement('button',
                {
                  key: item.view,
                  onClick: () => onNavigate(item.view),
                  disabled: isDisabled,
                  className: `px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors w-1/4 ${
                    currentView === item.view
                      ? 'bg-shuttle-yellow text-brand-blue'
                      : 'text-white hover:bg-brand-blue'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`,
                  title: isDisabled ? 'Cadastre um membro primeiro.' : ''
                },
                item.label
              )
            )
          })
        )
      )
    )
  );
};