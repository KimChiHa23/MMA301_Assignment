import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Team, TeamMember, CreateTeamInput } from '../types/team';
import { UserProfile } from '../types/auth';

const TEAMS_COLLECTION = 'teams';
const TEAM_MEMBERS_COLLECTION = 'teamMembers';

const parseTimestamp = (val: any): string => {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
};

/**
 * Create a new team and add the creator as owner in teamMembers
 */
export const createTeam = async (input: CreateTeamInput, owner: UserProfile): Promise<string> => {
  const teamsRef = collection(db, TEAMS_COLLECTION);
  const newTeamDoc = await addDoc(teamsRef, {
    name: input.name.trim(),
    description: input.description?.trim() || '',
    ownerId: owner.id,
    createdAt: serverTimestamp(),
  });

  const teamId = newTeamDoc.id;

  // Add owner to teamMembers collection
  const memberDocId = `${teamId}_${owner.id}`;
  const memberRef = doc(db, TEAM_MEMBERS_COLLECTION, memberDocId);
  await setDoc(memberRef, {
    teamId,
    userId: owner.id,
    userName: owner.name,
    userEmail: owner.email,
    role: 'owner',
    joinedAt: serverTimestamp(),
  });

  return teamId;
};

/**
 * Join an existing team by teamId
 */
export const joinTeam = async (teamId: string, user: UserProfile): Promise<Team> => {
  const cleanTeamId = teamId.trim();
  const teamRef = doc(db, TEAMS_COLLECTION, cleanTeamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) {
    throw new Error('Không tìm thấy nhóm với mã này. Vui lòng kiểm tra lại.');
  }

  const memberDocId = `${cleanTeamId}_${user.id}`;
  const memberRef = doc(db, TEAM_MEMBERS_COLLECTION, memberDocId);
  const memberSnap = await getDoc(memberRef);

  if (memberSnap.exists()) {
    throw new Error('Bạn đã là thành viên của nhóm này rồi.');
  }

  await setDoc(memberRef, {
    teamId: cleanTeamId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: 'member',
    joinedAt: serverTimestamp(),
  });

  const data = teamSnap.data();
  return {
    id: teamSnap.id,
    name: data.name || '',
    description: data.description || '',
    ownerId: data.ownerId || '',
    createdAt: parseTimestamp(data.createdAt),
  };
};

/**
 * Subscribe to the list of teams the current user is a member of
 */
export const subscribeToUserTeams = (
  userId: string,
  onNext: (teams: Team[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!userId) {
    onNext([]);
    return () => {};
  }

  const membersRef = collection(db, TEAM_MEMBERS_COLLECTION);
  const q = query(membersRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const teamIds = snapshot.docs.map((d) => d.data().teamId as string);
        if (teamIds.length === 0) {
          onNext([]);
          return;
        }

        // Fetch team documents
        const teamsList: Team[] = [];
        for (const tid of teamIds) {
          const tDoc = await getDoc(doc(db, TEAMS_COLLECTION, tid));
          if (tDoc.exists()) {
            const data = tDoc.data();
            teamsList.push({
              id: tDoc.id,
              name: data.name || '',
              description: data.description || '',
              ownerId: data.ownerId || '',
              createdAt: parseTimestamp(data.createdAt),
            });
          }
        }

        // Sort by newest
        teamsList.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        onNext(teamsList);
      } catch (err: any) {
        console.error('Error fetching user teams:', err);
        if (onError) onError(err);
      }
    },
    (err) => {
      console.error('onSnapshot user teams error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Fetch discoverable teams that the user has not yet joined
 */
export const getDiscoverableTeams = async (userId: string): Promise<Team[]> => {
  const teamsRef = collection(db, TEAMS_COLLECTION);
  const teamsSnap = await getDocs(teamsRef);

  // Get user's current memberships
  const membersRef = collection(db, TEAM_MEMBERS_COLLECTION);
  const userMembershipsQuery = query(membersRef, where('userId', '==', userId));
  const userMembershipsSnap = await getDocs(userMembershipsQuery);
  const joinedTeamIds = new Set(userMembershipsSnap.docs.map((d) => d.data().teamId));

  const discoverable: Team[] = [];
  teamsSnap.docs.forEach((docSnap) => {
    if (!joinedTeamIds.has(docSnap.id)) {
      const data = docSnap.data();
      discoverable.push({
        id: docSnap.id,
        name: data.name || '',
        description: data.description || '',
        ownerId: data.ownerId || '',
        createdAt: parseTimestamp(data.createdAt),
      });
    }
  });

  return discoverable;
};

/**
 * Get team by ID
 */
export const getTeamById = async (teamId: string): Promise<Team | null> => {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) return null;
  const data = teamSnap.data();
  return {
    id: teamSnap.id,
    name: data.name || '',
    description: data.description || '',
    ownerId: data.ownerId || '',
    createdAt: parseTimestamp(data.createdAt),
  };
};

/**
 * Subscribe to members of a specific team
 */
export const subscribeToTeamMembers = (
  teamId: string,
  onNext: (members: TeamMember[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const membersRef = collection(db, TEAM_MEMBERS_COLLECTION);
  const q = query(membersRef, where('teamId', '==', teamId));

  return onSnapshot(
    q,
    (snapshot) => {
      const members: TeamMember[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          teamId: data.teamId,
          userId: data.userId,
          userName: data.userName || 'Member',
          userEmail: data.userEmail || '',
          role: data.role || 'member',
          joinedAt: parseTimestamp(data.joinedAt),
        };
      });

      // Owners first, then alphabetical by name
      members.sort((a, b) => {
        if (a.role === 'owner' && b.role !== 'owner') return -1;
        if (b.role === 'owner' && a.role !== 'owner') return 1;
        return a.userName.localeCompare(b.userName);
      });

      onNext(members);
    },
    (err) => {
      console.error('onSnapshot team members error:', err);
      if (onError) onError(err);
    }
  );
};
