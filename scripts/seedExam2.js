const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDr2bDIQ7MI-bYK_pbBcYTt4VARweVbbTg',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mma301-1cae2.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'mma301-1cae2',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mma301-1cae2.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '652163214878',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:652163214878:web:a09e3e21afdb570116080f',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  console.log('--- Đang khởi tạo dữ liệu mẫu chuẩn đề bài Exam 2 lên Firestore ---');

  // 1. Seed Users (collection: users)
  console.log('1. Đang tạo dữ liệu mẫu collection users...');
  const users = [
    {
      id: 'demo_user_student',
      name: 'Nguyễn Văn A',
      email: 'student@fpt.edu.vn',
      avatarUrl: null,
    },
    {
      id: 'demo_user_leader',
      name: 'Trần Thị Mai',
      email: 'mai.tran@fpt.edu.vn',
      avatarUrl: null,
    },
    {
      id: 'demo_user_member',
      name: 'Lê Hoàng Nam',
      email: 'nam.le@fpt.edu.vn',
      avatarUrl: null,
    },
  ];

  for (const u of users) {
    await setDoc(doc(db, 'users', u.id), {
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      createdAt: serverTimestamp(),
    });
    console.log(`   + Đã tạo user: ${u.name} (${u.email})`);
  }

  // 2. Seed Teams (collection: teams)
  console.log('2. Đang tạo dữ liệu mẫu collection teams...');
  const teamId = 'team_mobile_aura_pro';
  await setDoc(doc(db, 'teams', teamId), {
    id: teamId,
    name: 'TaskAura Pro Dev Team',
    description: 'Nhóm phát triển dự án ứng dụng di động MMA301 với React Native và Cloud Firestore',
    ownerId: 'demo_user_leader',
    createdAt: serverTimestamp(),
  });
  console.log(`   + Đã tạo team: TaskAura Pro Dev Team (ID: ${teamId})`);

  // 3. Seed Team Members (collection: teamMembers)
  console.log('3. Đang tạo dữ liệu mẫu collection teamMembers...');
  const members = [
    {
      userId: 'demo_user_leader',
      userName: 'Trần Thị Mai',
      userEmail: 'mai.tran@fpt.edu.vn',
      role: 'owner',
    },
    {
      userId: 'demo_user_student',
      userName: 'Nguyễn Văn A',
      userEmail: 'student@fpt.edu.vn',
      role: 'member',
    },
    {
      userId: 'demo_user_member',
      userName: 'Lê Hoàng Nam',
      userEmail: 'nam.le@fpt.edu.vn',
      role: 'member',
    },
  ];

  for (const m of members) {
    const memberDocId = `${teamId}_${m.userId}`;
    await setDoc(doc(db, 'teamMembers', memberDocId), {
      teamId,
      userId: m.userId,
      userName: m.userName,
      userEmail: m.userEmail,
      role: m.role,
      joinedAt: serverTimestamp(),
    });
    console.log(`   + Đã gán thành viên ${m.userName} vào nhóm (${m.role})`);
  }

  // 4. Seed Tasks with teamId and assigneeId (collection: tasks)
  console.log('4. Đang tạo dữ liệu mẫu collection tasks liên kết team và assignee...');
  const tasks = [
    {
      title: 'Tích hợp Firebase Authentication & User Collection',
      description: 'Hoàn thiện luồng đăng ký, đăng nhập và lưu profile vào collection users.',
      status: 'done',
      priority: 'high',
      dueDate: '2026-10-18',
      teamId,
      teamName: 'TaskAura Pro Dev Team',
      assigneeId: 'demo_user_leader',
      assigneeName: 'Trần Thị Mai',
      creatorId: 'demo_user_leader',
    },
    {
      title: 'Xây dựng Team Management & Real-time Chat',
      description: 'Phát triển màn hình TeamsScreen, TeamDetailScreen và TeamChatScreen với onSnapshot.',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-10-22',
      teamId,
      teamName: 'TaskAura Pro Dev Team',
      assigneeId: 'demo_user_student',
      assigneeName: 'Nguyễn Văn A',
      creatorId: 'demo_user_leader',
    },
    {
      title: 'Viết báo cáo và chụp ảnh minh chứng Practical Exam 2',
      description: 'Chuẩn bị ảnh chụp Firebase Console và chạy thử nghiệm đầy đủ các chức năng.',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-10-26',
      teamId,
      teamName: 'TaskAura Pro Dev Team',
      assigneeId: 'demo_user_member',
      assigneeName: 'Lê Hoàng Nam',
      creatorId: 'demo_user_student',
    },
  ];

  for (const t of tasks) {
    const taskRef = await addDoc(collection(db, 'tasks'), {
      ...t,
      createdAt: serverTimestamp(),
    });
    console.log(`   + Đã tạo task: "${t.title}" (Assignee: ${t.assigneeName})`);
  }

  // 5. Seed Real-time Chat Messages (subcollection: teams/{teamId}/messages)
  console.log('5. Đang tạo dữ liệu mẫu subcollection teams/{teamId}/messages...');
  const messages = [
    {
      senderId: 'demo_user_leader',
      senderName: 'Trần Thị Mai',
      text: 'Chào cả nhóm! Chúng ta bắt đầu tiến hành kiểm tra dự án Practical Exam 2 nhé.',
    },
    {
      senderId: 'demo_user_student',
      senderName: 'Nguyễn Văn A',
      text: 'Em đã cập nhật xong TaskFormModal có bộ chọn Team và chọn Assignee động rồi ạ!',
    },
    {
      senderId: 'demo_user_member',
      senderName: 'Lê Hoàng Nam',
      text: 'Giao diện Chat realtime bằng onSnapshot chạy rất mượt và đồng bộ tức thì luôn.',
    },
  ];

  const messagesRef = collection(db, 'teams', teamId, 'messages');
  for (const msg of messages) {
    await addDoc(messagesRef, {
      ...msg,
      createdAt: serverTimestamp(),
    });
    console.log(`   + Đã gửi tin nhắn mẫu từ ${msg.senderName}: "${msg.text}"`);
  }

  console.log('--- KHỞI TẠO DỮ LIỆU THÀNH CÔNG 100%! ---');
}

seedData().then(() => process.exit(0)).catch((err) => {
  console.error('Lỗi khi khởi tạo dữ liệu:', err);
  process.exit(1);
});
