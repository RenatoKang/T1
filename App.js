

import React, { useState, useEffect } from 'react';
import { View, Role, Gender, SkillLevel } from './types.js';
import { Header } from './components/Header.js';
import { MemberList } from './components/MemberList.js';
import { MemberForm } from './components/MemberForm.js';
import { DuesTracker } from './components/DuesTracker.js';
import { TournamentGenerator } from './components/TournamentGenerator.js';
import { Login } from './components/Login.js';
import { ADMIN_NAMES } from './constants.js';
import { auth, db } from './services/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, orderBy, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';


const App = () => {
  const [view, setView] = useState(View.MEMBERS);
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [tournaments, setTournaments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const memberDocRef = doc(db, "members", user.uid);
        const memberDocSnap = await getDoc(memberDocRef);
        if (memberDocSnap.exists()) {
          const memberData = memberDocSnap.data();
          const role = ADMIN_NAMES.includes(memberData.name) ? Role.ADMIN : Role.MEMBER;
          setCurrentUser({ ...memberData, id: user.uid, role });
        } else {
          // User is authenticated but has no profile. Redirect to the form to complete registration.
          console.warn("User authenticated but no profile found. Forcing profile creation.");
          
          setCurrentUser({
            id: user.uid,
            email: user.email,
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
              email: user.email,
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
      setIsLoading(false);
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
      const membersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersData);
    });

    const tournamentsCollectionRef = collection(db, "tournaments");
    const unsubscribeTournaments = onSnapshot(tournamentsCollectionRef, (querySnapshot) => {
      const tournamentsData = {};
      querySnapshot.forEach((doc) => {
        tournamentsData[doc.id] = { id: doc.id, ...doc.data() };
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

  const handleUpdateMember = async (member) => {
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
  
  const handleEditMember = (member) => {
    setEditingMember(member);
    setView(View.ADD_MEMBER);
  };

  const handleDeleteMember = async (id) => {
    if (window.confirm('Are you sure you want to delete this member? This will also remove them from Firebase Authentication.')) {
      try {
        await deleteDoc(doc(db, "members", id));
        console.warn(`Member ${id} deleted from Firestore. Remember to delete them from Firebase Auth console.`);
        if (members.length === 1) {
            setView(View.ADD_MEMBER);
        }
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  const handleToggleDues = async (id, month) => {
    if (currentUser?.role !== Role.ADMIN) return;
    const member = members.find(m => m.id === id);
    if (!member) return;
    const memberDocRef = doc(db, "members", id);
    await updateDoc(memberDocRef, {
      [`dues.${month}`]: !member.dues[month]
    });
  };
  
  const handleNavigate = (newView) => {
    setEditingMember(null);
    setView(newView);
  };
  
  const handleAddTournament = async (tournament) => {
    const tournamentDocRef = doc(db, "tournaments", tournament.id);
    await setDoc(tournamentDocRef, tournament);
  };

  const handleUpdateTournament = async (updatedTournament) => {
    const tournamentDocRef = doc(db, "tournaments", updatedTournament.id);
    await setDoc(tournamentDocRef, updatedTournament, { merge: true });
  };
  
  const handleDeleteTournament = async (tournamentId) => {
    await deleteDoc(doc(db, "tournaments", tournamentId));
  }

  if (isLoading) {
    return React.createElement('div', { className: "flex items-center justify-center min-h-screen" }, "Loading...");
  }

  if (!currentUser) {
    if (view === View.ADD_MEMBER) {
        return (
            React.createElement('div', { className: "flex items-center justify-center min-h-screen bg-gray-100" },
                React.createElement(MemberForm, { 
                    existingMember: null, 
                    onUpdate: () => Promise.resolve(), 
                    onCancel: () => setView(View.MEMBERS),
                    isEditingSelf: false,
                    currentUserRole: Role.MEMBER
                })
            )
        );
    }
    return React.createElement(Login, { onNavigateToRegister: () => handleNavigate(View.ADD_MEMBER) });
  }

  const renderContent = () => {
    switch (view) {
      case View.ADD_MEMBER:
        return React.createElement(MemberForm, { 
            onUpdate: handleUpdateMember, 
            existingMember: editingMember, 
            onCancel: () => setView(View.MEMBERS),
            isEditingSelf: !!(editingMember && currentUser && editingMember.id === currentUser.id),
            currentUserRole: currentUser.role
        });
      case View.DUES:
        return React.createElement(DuesTracker, { members: members, onToggleDues: handleToggleDues, currentUser: currentUser });
      case View.TOURNAMENT:
        return React.createElement(TournamentGenerator, { 
            members: members, 
            tournaments: tournaments, 
            onAdd: handleAddTournament, 
            onUpdate: handleUpdateTournament, 
            onDelete: handleDeleteTournament,
            currentUser: currentUser
        });
      case View.MEMBERS:
      default:
        return React.createElement(MemberList, { members: members, onEdit: handleEditMember, onDelete: handleDeleteMember, currentUser: currentUser });
    }
  };

  return (
    React.createElement('div', { className: "min-h-screen bg-gray-50 font-sans text-gray-800" },
      React.createElement(Header, { 
        currentView: view, 
        onNavigate: handleNavigate, 
        memberCount: members.length, 
        currentUser: currentUser,
        onLogout: handleLogout
       }),
      React.createElement('main', { className: "p-4 sm:p-6 md:p-8" },
        React.createElement('div', { className: "max-w-7xl mx-auto" },
          renderContent()
        )
      )
    )
  );
};

export default App;