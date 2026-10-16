export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName?: string;
  createdAt?: string;
  memberCount?: number;
}

export type TeamMemberRole = 'owner' | 'member';

export interface TeamMember {
  id?: string;
  teamId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: TeamMemberRole;
  joinedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface CreateTeamInput {
  name: string;
  description: string;
}
