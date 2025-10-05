
import React, { useState, useEffect } from 'react';
import { Member, Gender, SkillLevel, Role } from '../types';
import { SKILL_LEVELS } from '../constants';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';


interface MemberFormProps {
  onUpdate: (member: Member) => Promise<void>;
  onCancel: () => void;
  existingMember: Member | null;
  isEditingSelf: boolean;
  currentUserRole: Role;
}

const UserIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

const getRelevantMonths = (): string[] => {
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= -3; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${year}-${month}`);
    }
    return months;
};

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
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


export const MemberForm: React.FC<MemberFormProps> = ({ onUpdate, onCancel, existingMember, isEditingSelf, currentUserRole }) => {
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
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);


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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'gender') {
        const newGender = value as Gender;
        const skillSuffix = member.skillLevel.slice(1);
        setMember(prev => ({
            ...prev,
            gender: newGender,
            skillLevel: (newGender === Gender.MALE ? `M${skillSuffix}` : `W${skillSuffix}`) as SkillLevel
        }));
    } else if (name === 'skillLevel') {
        const newSkillLevel = value as SkillLevel;
        setMember(prev => ({
            ...prev,
            skillLevel: newSkillLevel,
            gender: newSkillLevel.startsWith('M') ? Gender.MALE : Gender.FEMALE
        }));
    } else {
        setMember(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value) : value }));
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, envie um arquivo de imagem.');
        return;
      }
      try {
        const resizedDataUrl = await resizeImage(file, 300, 300);
        setMember({ ...member, profilePicUrl: resizedDataUrl });
        setPreview(resizedDataUrl);
      } catch (error) {
        console.error("Image processing failed:", error);
        alert("Ocorreu um erro ao processar sua imagem.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordMessage(null);

    if (existingMember) {
        // Handle password update if editing self
        if (isEditingSelf && newPassword) {
            if (newPassword !== confirmPassword) {
                setPasswordMessage({ type: 'error', text: 'As senhas não coincidem.' });
                return;
            }
            if (newPassword.length < 6) {
                setPasswordMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
                return;
            }
            try {
                const user = auth.currentUser;
                if (user) {
                    await updatePassword(user, newPassword);
                    setPasswordMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
                    setNewPassword('');
                    setConfirmPassword('');
                } else {
                    throw new Error("No authenticated user found.");
                }
            } catch (error: any) {
                console.error("Password update failed:", error);
                setPasswordMessage({ type: 'error', text: `Falha ao atualizar a senha: ${error.message}` });
                return; // Stop if password update fails
            }
        }
        // Update existing member profile info
        await onUpdate({
            ...existingMember,
            ...member,
            email,
        });
    } else {
        // Register new member
        if (!member.name || !member.age || !email || !password) {
          alert('Por favor, preencha todos os campos.');
          return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const months = getRelevantMonths();
            const newDues: Record<string, boolean> = {};
            months.forEach(m => { newDues[m] = false; });

            const newMemberProfile: Omit<Member, 'id'> = { ...member, email, dues: newDues };
            
            await setDoc(doc(db, "members", user.uid), newMemberProfile);
            // onAuthStateChanged in App.tsx will handle login and redirect.
        } catch (error: any) {
            console.error("Registration failed:", error);
            setError(error.message);
        }
    }
  };

  const isSkillLevelDisabled = isEditingSelf && currentUserRole !== Role.ADMIN;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-brand-blue">{existingMember ? 'Editar Informações do Membro' : 'Cadastrar Novo Membro'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {preview ? <img src={preview} alt="Profile Preview" className="w-full h-full object-cover" /> : <UserIcon className="w-16 h-16 text-gray-400" />}
          </div>
          <label className="cursor-pointer bg-brand-secondary text-white px-4 py-2 rounded-md hover:bg-brand-blue transition-colors">
            Enviar Foto
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
          <input type="text" name="name" id="name" value={member.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
        </div>
        
        {existingMember ? (
             <div>
               <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail (não pode ser alterado)</label>
               <input type="email" name="email" id="email" value={email} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" />
             </div>
        ) : (
            <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
                </div>
                <div>
                  <label htmlFor="password"className="block text-sm font-medium text-gray-700">Senha</label>
                  <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
                </div>
            </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">Idade</label>
            <input type="number" name="age" id="age" value={member.age} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gênero</label>
            <select name="gender" id="gender" value={member.gender} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue rounded-md shadow-sm">
              <option value={Gender.MALE}>Masculino</option>
              <option value={Gender.FEMALE}>Feminino</option>
            </select>
          </div>
        </div>

        <div>
            <label htmlFor="skillLevel" className="block text-sm font-medium text-gray-700">
                Nível {isSkillLevelDisabled && <span className="text-xs text-gray-500">(Somente administradores podem alterar)</span>}
            </label>
            <select
                name="skillLevel"
                id="skillLevel"
                value={member.skillLevel}
                onChange={handleChange}
                disabled={isSkillLevelDisabled}
                className={`mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue rounded-md shadow-sm ${isSkillLevelDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
                {SKILL_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                ))}
            </select>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {isEditingSelf && (
          <div className="pt-6 border-t space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Alterar Senha</h3>
             <div>
                <label htmlFor="newPassword"className="block text-sm font-medium text-gray-700">Nova Senha (mínimo 6 caracteres)</label>
                <input type="password" name="newPassword" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
            </div>
             <div>
                <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
            </div>
            {passwordMessage && (
                <p className={`text-sm text-center ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordMessage.text}
                </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90">
            {existingMember ? 'Salvar Alterações' : 'Cadastrar Membro'}
          </button>
        </div>
      </form>
    </div>
  );
};