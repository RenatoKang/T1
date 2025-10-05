
import React, { useState } from 'react';
import { auth } from '../services/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

const ShuttlecockIcon = ({ className }) => (
    React.createElement('svg', { className, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
        React.createElement('path', { d: "M13 3.939V2h-2v1.939A9.503 9.503 0 0 0 6.643 7.4L5 6.4V5H3v1.4l1.643 1L3 8.8v1.2l1.643-1L3 10.4V11.6l1.643-1L3 12v1h2v-.4l1.643-1A9.503 9.503 0 0 0 11 15.061V22h2v-6.939a9.503 9.503 0 0 0 4.357-3.462L19 12v-1h-2v.4l-1.643 1A9.503 9.503 0 0 0 13 3.939z" })
    )
);

export const Login = ({ onNavigateToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLoginClick = async () => {
        if (!email || !password) {
            setError('이메일과 비밀번호를 입력해주세요.');
            return;
        }
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error(err);
            setError('로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.');
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        handleLoginClick();
    }

    return (
        React.createElement('div', { className: "flex items-center justify-center min-h-screen bg-gray-50" },
            React.createElement('div', { className: "w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg" },
                React.createElement('div', { className: "text-center" },
                    React.createElement(ShuttlecockIcon, { className: "w-16 h-16 mx-auto text-brand-blue" }),
                    React.createElement('h1', { className: "mt-4 text-3xl font-bold text-gray-900" },
                        "클럽 매니저 로그인"
                    ),
                    React.createElement('p', { className: "mt-2 text-sm text-gray-600" },
                        "이메일과 비밀번호를 입력하여 로그인하세요."
                    )
                ),
                
                React.createElement('form', { onSubmit: handleSubmit, className: "space-y-6" },
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "email", className: "block text-sm font-medium text-gray-700" }, "이메일"),
                        React.createElement('input', { 
                            id: "email",
                            type: "email",
                            value: email,
                            onChange: e => setEmail(e.target.value),
                            required: true,
                            className: "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-black"
                        })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "password", className: "block text-sm font-medium text-gray-700" }, "비밀번호"),
                        React.createElement('input', { 
                            id: "password",
                            type: "password",
                            value: password,
                            onChange: e => setPassword(e.target.value),
                            required: true,
                            className: "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-black"
                        })
                    ),
                    
                    error && React.createElement('p', { className: "text-red-500 text-center text-sm" }, error),

                    React.createElement('div', { className: "space-y-4 pt-2" },
                        React.createElement('button', {
                            type: "submit",
                            className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                        }, "로그인"),
                        React.createElement('div', { className: "text-center" },
                            React.createElement('button', {
                                type: "button",
                                onClick: onNavigateToRegister,
                                className: "font-medium text-sm text-brand-blue hover:text-brand-secondary"
                            }, "계정이 없으신가요? 회원 등록")
                        )
                    )
                )
            )
        )
    );
};
