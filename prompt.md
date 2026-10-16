Role: Senior React Native & Firebase Engineer.
Context: We are continuing Practical Exam 1 (Expo React Native with TypeScript) to build Practical Exam 2.
Objective: Keep all existing Task CRUD operations intact while extending the project with Firebase Authentication, real Team management, Task-Team-Assignee linking, and Real-time Team Chat via Cloud Firestore.

Tech Stack Requirements:

- React Native with Expo (TypeScript).
- React Navigation (Auth Stack vs. Protected App Stack/Tabs driven by authentication state).
- State Management: React Context (or existing store) to expose user auth state globally.
- Backend/Database: Firebase Authentication (Email/Password) & Cloud Firestore.

Please implement the following modules step-by-step:

1. Authentication & Auth State Persistence:

- Integrate Firebase Auth with Email/Password.
- Build Sign Up screen: Collect name, email, password. On success, create the Firebase Auth user AND save a document in Firestore collection `users` with fields: { id, name, email, avatarUrl: null, createdAt: serverTimestamp() }.
- Build Login screen: Email/Password inputs with form validation and clear error message handling (e.g., auth/invalid-credential, auth/email-already-in-use).
- Profile screen: Display logged-in user name, email, and a working Logout button.
- Global Auth Listener: Use `onAuthStateChanged` to persist session across restarts. If logged in, route to App Stack; otherwise, redirect to Login.

2. Teams Feature (Replacing Exam 1 Placeholder):

- Firestore structure:
  - `teams` collection: { id, name, description, ownerId, createdAt }.
  - `teamMembers` collection (or subcollection/array): { teamId, userId, role: "owner" | "member", joinedAt }.
- Teams screen:
  - List teams the logged-in user belongs to.
  - Form/Modal to create a new team.
  - Mechanism to join an existing team (via teamId/code or selecting from public list).
- Team Detail screen:
  - Display team info and list of team members (name/email).
  - Display list of tasks assigned to this team.
  - Button/entry point navigating to the Team Chat screen.

3. Linking Tasks to Teams and Assignees:

- Update existing Task Create/Edit form/modal:
  - Add a Team Picker/Dropdown selecting from the user's teams.
  - Add an Assignee Picker/Dropdown dynamically loaded from members of the selected team.
  - Store `teamId` and `assigneeId` inside the task document.
- Home screen & Team Detail screen: Show the assignee's name on each task card.
- Task permissions: Ensure UI only displays and allows edit/delete for tasks belonging to teams the user is currently a member of.

4. Real-time Team Chat:

- Chat screen per team (route: `/teams/:teamId/chat`).
- Firestore path: Subcollection `teams/{teamId}/messages` with fields: { id, senderId, senderName, text, createdAt }.
- Real-time listener: Use Firestore `onSnapshot` ordered by `createdAt asc`.
- UI:
  - FlatList of messages showing senderName, text, and timestamp.
  - Visually distinguish current user's messages (right-aligned, different bubble color) from others (left-aligned).
  - Fixed bottom input bar with TextInput and Send button.

5. Firestore Security Rules:

- Provide a `firestore.rules` file ready to paste into Firebase Console requiring `request.auth != null` for read/write access to `users`, `teams`, `teamMembers`, `tasks`, and `messages`.

Please inspect the existing codebase first, explain the file changes you plan to make, and write clean, modular TypeScript code conforming to the current folder structure.
