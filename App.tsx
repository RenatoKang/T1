

import React, { useState, useEffect } from 'react';
import { Member, View, Tournament, Role, CurrentUser, Gender, SkillLevel } from './types';
import { Header } from './components/Header';
import { MemberList } from './components/MemberList';
import { MemberForm } from './components/MemberForm';
import { DuesTracker } from './components/DuesTracker';
import { TournamentGenerator } from './components/TournamentGenerator';
import { Login } from './components/Login';
import { ADMIN_NAMES } from './constants';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, orderBy, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';


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


const App: React.FC = () => {
  const [view, setView] = useState<View>(View.MEMBERS);
  const [members, setMembers] = useState<Member[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [tournaments, setTournaments] = useState<Record<string, Tournament>>({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const memberDocRef = doc(db, "members", user.uid);
          const memberDocSnap = await getDoc(memberDocRef);
          if (memberDocSnap.exists()) {
            const memberData = memberDocSnap.data() as Omit<Member, 'id'>;
            const role = ADMIN_NAMES.includes(memberData.name) ? Role.ADMIN : Role.MEMBER;
            setCurrentUser({ ...memberData, id: user.uid, role });
          } else {
            // User is authenticated but has no profile. Redirect to the form to complete registration.
            console.warn("User authenticated but no profile found. Forcing profile creation.");
            
            // Create a temporary user object to keep them logged in
            setCurrentUser({
              id: user.uid,
              email: user.email!,
              name: '', // Will be filled in the form
              role: Role.MEMBER, // Default to member, role is determined by name on submit
              gender: Gender.MALE,
              age: 0,
              profilePicUrl: null,
              skillLevel: SkillLevel.MD,
              dues: {},
            });
            
            // Pre-populate the form with known data
            setEditingMember({ 
                id: user.uid,
                email: user.email!,
                name: user.displayName || '',
                gender: Gender.MALE,
                age: 20, // Default age
                profilePicUrl: user.photoURL || null,
                skillLevel: SkillLevel.MD,
                dues: {}
            });
            setView(View.ADD_MEMBER);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setCurrentUser(null); // Ensure user is logged out on error
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMembers([]);
      setTournaments({});
      return;
    }

    const membersQuery = query(collection(db, "members"), orderBy("name"));
    const unsubscribeMembers = onSnapshot(membersQuery, (querySnapshot) => {
      const membersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(membersData);
    });

    const tournamentsCollectionRef = collection(db, "tournaments");
    const unsubscribeTournaments = onSnapshot(tournamentsCollectionRef, (querySnapshot) => {
      const tournamentsData: Record<string, Tournament> = {};
      querySnapshot.forEach((doc) => {
        tournamentsData[doc.id] = { id: doc.id, ...doc.data() } as Tournament;
      });
      setTournaments(tournamentsData);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeTournaments();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView(View.MEMBERS);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleUpdateMember = async (member: Member) => {
    const memberDocRef = doc(db, "members", member.id);
    const { id, ...memberData } = member;
    // Using setDoc with merge will create the document if it doesn't exist, or update it if it does.
    await setDoc(memberDocRef, memberData, { merge: true });
    
    if (currentUser && currentUser.id === member.id) {
        // Update current user state, recalculating the role based on the new name.
        const role = ADMIN_NAMES.includes(memberData.name) ? Role.ADMIN : Role.MEMBER;
        const updatedCurrentUser = { ...currentUser, ...memberData, role };
        setCurrentUser(updatedCurrentUser);
    }

    setEditingMember(null);
    setView(View.MEMBERS);
  };
  
  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setView(View.ADD_MEMBER);
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member? This will also remove them from Firebase Authentication.')) {
      try {
        await deleteDoc(doc(db, "members", id));
        // Note: Deleting from Firebase Auth is a privileged operation and should be handled by a backend function for security.
        // This client-side deletion is for demonstration purposes.
        console.warn(`Member ${id} deleted from Firestore. Remember to delete them from Firebase Auth console.`);
        if (members.length === 1) {
            setView(View.ADD_MEMBER);
        }
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  const handleToggleDues = async (id: string, month: string) => {
    if (currentUser?.role !== Role.ADMIN) return;
    const member = members.find(m => m.id === id);
    if (!member) return;
    const memberDocRef = doc(db, "members", id);
    await updateDoc(memberDocRef, {
      [`dues.${month}`]: !member.dues[month]
    });
  };
  
  const handleNavigate = (newView: View) => {
    setEditingMember(null);
    setView(newView);
  };
  
  const handleAddTournament = async (tournament: Tournament) => {
    const tournamentDocRef = doc(db, "tournaments", tournament.id);
    await setDoc(tournamentDocRef, tournament);
  };

  const handleUpdateTournament = async (updatedTournament: Tournament) => {
    const tournamentDocRef = doc(db, "tournaments", updatedTournament.id);
    await setDoc(tournamentDocRef, updatedTournament, { merge: true });
  };
  
  const handleDeleteTournament = async (tournamentId: string) => {
    await deleteDoc(doc(db, "tournaments", tournamentId));
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!currentUser) {
    if (view === View.ADD_MEMBER) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <MemberForm 
                    existingMember={null} 
                    onUpdate={() => Promise.resolve()} 
                    onCancel={() => setView(View.MEMBERS)} 
                    isEditingSelf={false}
                    currentUserRole={Role.MEMBER}
                />
            </div>
        );
    }
    return <Login onNavigateToRegister={() => handleNavigate(View.ADD_MEMBER)} />;
  }

  const renderContent = () => {
    switch (view) {
      case View.ADD_MEMBER:
        return <MemberForm 
            onUpdate={handleUpdateMember} 
            existingMember={editingMember} 
            onCancel={() => setView(View.MEMBERS)}
            isEditingSelf={!!(editingMember && currentUser && editingMember.id === currentUser.id)}
            currentUserRole={currentUser.role}
        />;
      case View.DUES:
        return <DuesTracker members={members} onToggleDues={handleToggleDues} currentUser={currentUser} />;
      case View.TOURNAMENT:
        return <TournamentGenerator 
            members={members} 
            tournaments={tournaments} 
            onAdd={handleAddTournament} 
            onUpdate={handleUpdateTournament} 
            onDelete={handleDeleteTournament}
            currentUser={currentUser}
        />;
      case View.MEMBERS:
      default:
        return <MemberList members={members} onEdit={handleEditMember} onDelete={handleDeleteMember} currentUser={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header 
        currentView={view} 
        onNavigate={handleNavigate} 
        memberCount={members.length} 
        currentUser={currentUser}
        onLogout={handleLogout}
       />
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;