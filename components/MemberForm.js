
import React, { useState, useEffect } from 'react';
import { Gender, SkillLevel, Role } from '../types.js';
import { SKILL_LEVELS } from '../constants.js';
import { auth, db } from '../services/firebase.js';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const UserIcon = ({ className }) => (
    React.createElement('svg', { className, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" })
    )
);

const getRelevantMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= -3; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${year}-${month}`);
    }
    return months;
};

const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round(width * (maxHeight / height));
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(img.src);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(img.src);
            reject(error);
        };
    });
};

export const MemberForm = ({ onUpdate, onCancel, existingMember, isEditingSelf, currentUserRole }) => {
  const [member, setMember] = useState({
    name: '',
    gender: Gender.MALE,
    age: 20,
    profilePicUrl: null,
    skillLevel: SkillLevel.MD,
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    if (existingMember) {
      const { name, gender, age, profilePicUrl, skillLevel, email } = existingMember;
      setMember({ name, gender, age, profilePicUrl, skillLevel });
      setEmail(email);
      setPreview(existingMember.profilePicUrl);
    } else {
      setMember({
        name: '', gender: Gender.MALE, age: 20, profilePicUrl: null, skillLevel: SkillLevel.MD,
      });
      setEmail('');
      setPreview(null);
    }
  }, [existingMember]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'gender') {
        const newGender = value;
        const skillSuffix = member.skillLevel.slice(1);
        setMember(prev => ({
            ...prev,
            gender: newGender,
            skillLevel: (newGender === Gender.MALE ? `M${skillSuffix}` : `W${skillSuffix}`)
        }));
    } else if (name === 'skillLevel') {
        const newSkillLevel = value;
        setMember(prev => ({
            ...prev,
            skillLevel: newSkillLevel,
            gender: newSkillLevel.startsWith('M') ? Gender.MALE : Gender.FEMALE
        }));
    } else {
        setMember(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value) : value }));
    }
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      try {
        const resizedDataUrl = await resizeImage(file, 300, 300);
        setMember({ ...member, profilePicUrl: resizedDataUrl });
        setPreview(resizedDataUrl);
      } catch (error) {
        console.error("Image processing failed:", error);
        alert("There was an error processing your image.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPasswordMessage(null);

    if (existingMember) {
        if (isEditingSelf && newPassword) {
            if (newPassword !== confirmPassword) {
                setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
                return;
            }
            if (newPassword.length < 6) {
                setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
                return;
            }
            try {
                const user = auth.currentUser;
                if (user) {
                    await updatePassword(user, newPassword);
                    setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
                    setNewPassword('');
                    setConfirmPassword('');
                } else {
                    throw new Error("No authenticated user found.");
                }
            } catch (error) {
                console.error("Password update failed:", error);
                setPasswordMessage({ type: 'error', text: `Failed to update password: ${error.message}` });
                return;
            }
        }
        await onUpdate({
            ...existingMember,
            ...member,
            email,
        });
    } else {
        if (!member.name || !member.age || !email || !password) {
          alert('Please fill in all fields.');
          return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const months = getRelevantMonths();
            const newDues = {};
            months.forEach(m => { newDues[m] = false; });

            const newMemberProfile = { ...member, email, dues: newDues };
            
            await setDoc(doc(db, "members", user.uid), newMemberProfile);
        } catch (error) {
            console.error("Registration failed:", error);
            setError(error.message);
        }
    }
  };

  const isSkillLevelDisabled = isEditingSelf && currentUserRole !== Role.ADMIN;
  
  const formFields = [
    React.createElement('div', { key: 'name', },
      React.createElement('label', { htmlFor: "name", className: "block text-sm font-medium text-gray-700" }, "이름"),
      React.createElement('input', { type: "text", name: "name", id: "name", value: member.name, onChange: handleChange, className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue", required: true })
    ),
  ];

  if (existingMember) {
      formFields.push(
          React.createElement('div', { key: 'email-readonly' },
              React.createElement('label', { htmlFor: "email", className: "block text-sm font-medium text-gray-700" }, "이메일 (변경 불가)"),
              React.createElement('input', { type: "email", name: "email", id: "email", value: email, readOnly: true, className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" })
          )
      );
  } else {
      formFields.push(
        React.createElement(React.Fragment, { key: 'auth-fields' },
            React.createElement('div', null,
              React.createElement('label', { htmlFor: "email", className: "block text-sm font-medium text-gray-700" }, "이메일"),
              React.createElement('input', { type: "email", name: "email", id: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue", required: true })
            ),
            React.createElement('div', null,
              React.createElement('label', { htmlFor: "password", className: "block text-sm font-medium text-gray-700" }, "비밀번호"),
              React.createElement('input', { type: "password", name: "password", id: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue", required: true })
            )
        )
      );
  }

  formFields.push(
    React.createElement('div', { key: 'age-gender', className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
      React.createElement('div', null,
        React.createElement('label', { htmlFor: "age", className: "block text-sm font-medium text-gray-700" }, "나이"),
        React.createElement('input', { type: "number", name: "age", id: "age", value: member.age, onChange: handleChange, className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue", required: true })
      ),
      React.createElement('div', null,
        React.createElement('label', { htmlFor: "gender", className: "block text-sm font-medium text-gray-700" }, "성별"),
        React.createElement('select', { name: "gender", id: "gender", value: member.gender, onChange: handleChange, className: "mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue rounded-md shadow-sm" },
          React.createElement('option', { value: Gender.MALE }, "남자"),
          React.createElement('option', { value: Gender.FEMALE }, "여자")
        )
      )
    ),
    React.createElement('div', { key: 'skill' },
      React.createElement('label', { htmlFor: "skillLevel", className: "block text-sm font-medium text-gray-700" },
        "등급 ",
        isSkillLevelDisabled && React.createElement('span', { className: "text-xs text-gray-500" }, "(운영진만 변경 가능)")
      ),
      React.createElement('select', {
        name: "skillLevel", id: "skillLevel", value: member.skillLevel, onChange: handleChange, disabled: isSkillLevelDisabled,
        className: `mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue rounded-md shadow-sm ${isSkillLevelDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`
      },
        SKILL_LEVELS.map(level => (
          React.createElement('option', { key: level.value, value: level.value }, level.label)
        ))
      )
    )
  );

  return (
    React.createElement('div', { className: "bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto" },
      React.createElement('h2', { className: "text-2xl font-bold mb-6 text-brand-blue" }, existingMember ? '회원 정보 수정' : '신규 회원 등록'),
      React.createElement('form', { onSubmit: handleSubmit, className: "space-y-6" },
        React.createElement('div', { className: "flex flex-col items-center space-y-4" },
          React.createElement('div', { className: "w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden" },
            preview ? React.createElement('img', { src: preview, alt: "Profile Preview", className: "w-full h-full object-cover" }) : React.createElement(UserIcon, { className: "w-16 h-16 text-gray-400" })
          ),
          React.createElement('label', { className: "cursor-pointer bg-brand-secondary text-white px-4 py-2 rounded-md hover:bg-brand-blue transition-colors" },
            "Upload Photo",
            React.createElement('input', { type: "file", className: "hidden", accept: "image/*", onChange: handleFileChange })
          )
        ),
        ...formFields,
        error && React.createElement('p', { className: "text-red-500 text-sm text-center" }, error),
        isEditingSelf && React.createElement('div', { className: "pt-6 border-t space-y-4" },
            React.createElement('h3', { className: "text-lg font-semibold text-gray-800" }, "비밀번호 변경"),
            React.createElement('div', null,
                React.createElement('label', { htmlFor: "newPassword", className: "block text-sm font-medium text-gray-700" }, "새 비밀번호 (6자 이상)"),
                React.createElement('input', { type: "password", name: "newPassword", id: "newPassword", value: newPassword, onChange: (e) => setNewPassword(e.target.value), className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" })
            ),
            React.createElement('div', null,
                React.createElement('label', { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700" }, "새 비밀번호 확인"),
                React.createElement('input', { type: "password", name: "confirmPassword", id: "confirmPassword", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" })
            ),
            passwordMessage && React.createElement('p', { className: `text-sm text-center ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}` }, passwordMessage.text)
        ),
        React.createElement('div', { className: "flex justify-end space-x-4 pt-4" },
          React.createElement('button', { type: "button", onClick: onCancel, className: "bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300" }, "Cancel"),
          React.createElement('button', { type: "submit", className: "bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90" },
            existingMember ? '정보 수정' : '회원 등록'
          )
        )
      )
    )
  );
};
