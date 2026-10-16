import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Team, TeamMember } from '../types/team';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '../types/task';
import { getTeamById, subscribeToTeamMembers } from '../services/teamService';
import { subscribeToTeamTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';
import { TaskCard } from '../components/TaskCard';
import { TaskFormModal } from '../components/TaskFormModal';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface TeamDetailScreenProps {
  route: {
    params: {
      teamId: string;
      teamName?: string;
    };
  };
  navigation: any;
}

export const TeamDetailScreen: React.FC<TeamDetailScreenProps> = ({ route, navigation }) => {
  const { teamId, teamName: initialTeamName } = route.params;
  const { user } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');

  // Modal create/edit task
  const [modalVisible, setModalVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Load team info
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingTeam(true);
        const fetchedTeam = await getTeamById(teamId);
        if (isMounted) {
          setTeam(fetchedTeam);
        }
      } catch (err) {
        console.error('Error fetching team info:', err);
      } finally {
        if (isMounted) setLoadingTeam(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  // Subscribe to team members
  useEffect(() => {
    const unsubscribe = subscribeToTeamMembers(
      teamId,
      (teamMembers) => setMembers(teamMembers),
      (err) => console.error('Error loading team members:', err)
    );
    return () => unsubscribe();
  }, [teamId]);

  // Subscribe to team tasks
  useEffect(() => {
    const unsubscribe = subscribeToTeamTasks(
      teamId,
      (teamTasks) => setTasks(teamTasks),
      (err) => console.error('Error loading team tasks:', err)
    );
    return () => unsubscribe();
  }, [teamId]);

  const handleOpenCreateTask = () => {
    setTaskToEdit(null);
    setModalVisible(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskToEdit(task);
    setModalVisible(true);
  };

  const handleFormSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, data as UpdateTaskInput);
    } else {
      await createTask({
        ...data,
        teamId,
        teamName: team?.name || initialTeamName || 'Nhóm',
      } as CreateTaskInput);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(task.id, { status: nextStatus });
  };

  const displayName = team?.name || initialTeamName || 'Chi Tiết Nhóm';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        {/* Real-time Team Chat Header Button */}
        <TouchableOpacity
          style={styles.chatNavButton}
          onPress={() =>
            navigation.navigate('TeamChat', {
              teamId,
              teamName: displayName,
            })
          }
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
          <Text style={styles.chatNavButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {loadingTeam ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Đang tải thông tin nhóm...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Team Overview Banner Card */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewTop}>
              <LinearGradient
                colors={COLORS.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.teamAvatar}
              >
                <Ionicons name="people" size={28} color="#FFFFFF" />
              </LinearGradient>

              <View style={styles.overviewDetails}>
                <Text style={styles.teamTitle}>{displayName}</Text>
                {team?.description ? (
                  <Text style={styles.teamDescription}>{team.description}</Text>
                ) : null}

                <View style={styles.codeRow}>
                  <Ionicons name="key-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.codeLabel}>Mã nhóm:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Mã Nhóm',
                        `Mã nhóm của bạn là:\n\n${teamId}\n\nBạn có thể chia sẻ mã này để người khác cùng tham gia!`
                      );
                    }}
                  >
                    <Text style={styles.codeValue}>{teamId}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Entry button to Team Chat Screen */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.enterChatBanner}
              onPress={() =>
                navigation.navigate('TeamChat', {
                  teamId,
                  teamName: displayName,
                })
              }
            >
              <LinearGradient
                colors={COLORS.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.enterChatGradient}
              >
                <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
                <Text style={styles.enterChatText}>Mở Kênh Chat Real-time Của Nhóm</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Tab Selector: Tasks vs Members */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'tasks' && styles.tabItemActive]}
              onPress={() => setActiveTab('tasks')}
            >
              <Ionicons
                name="checkbox-outline"
                size={16}
                color={activeTab === 'tasks' ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
                Công Việc ({tasks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'members' && styles.tabItemActive]}
              onPress={() => setActiveTab('members')}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={activeTab === 'members' ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
                Thành Viên ({members.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'tasks' ? (
            <View style={styles.tabContent}>
              <View style={styles.taskHeaderRow}>
                <Text style={styles.sectionTitle}>Công Việc Được Giao Cho Nhóm</Text>
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={handleOpenCreateTask}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addTaskButtonText}>Thêm Task</Text>
                </TouchableOpacity>
              </View>

              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleOpenEditTask}
                    onDelete={handleDeleteTask}
                    onToggleStatus={handleToggleStatus}
                    canEditDelete={true}
                  />
                ))
              ) : (
                <View style={styles.emptyTabBox}>
                  <Ionicons name="clipboard-outline" size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptyTabTitle}>Chưa có công việc nào cho nhóm này</Text>
                  <Text style={styles.emptyTabSubtitle}>
                    Bấm "Thêm Task" để tạo công việc và chỉ định thành viên phụ trách!
                  </Text>
                  <TouchableOpacity style={styles.emptyAddButton} onPress={handleOpenCreateTask}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyAddButtonText}>Tạo Task Mới</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Danh Sách Thành Viên ({members.length})</Text>
              {members.map((m) => {
                const isOwner = m.role === 'owner';
                const isSelf = m.userId === user?.id;
                return (
                  <View key={m.userId} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {m.userName ? m.userName[0].toUpperCase() : 'U'}
                      </Text>
                    </View>

                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>
                          {m.userName} {isSelf ? '(Bạn)' : ''}
                        </Text>
                        <View
                          style={[
                            styles.memberRoleBadge,
                            isOwner ? styles.ownerBadge : styles.normalMemberBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.memberRoleText,
                              isOwner ? styles.ownerBadgeText : styles.normalMemberText,
                            ]}
                          >
                            {isOwner ? 'Trưởng nhóm' : 'Thành viên'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.memberEmail}>{m.userEmail}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Task Modal for creating / editing task under this team */}
      <TaskFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleFormSubmit}
        taskToEdit={taskToEdit}
        userTeams={team ? [team] : []}
        defaultTeamId={teamId}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
    backgroundColor: COLORS.card,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBarCenter: {
    flex: 1,
    marginHorizontal: 10,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  chatNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  chatNavButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  overviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  overviewTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  teamAvatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewDetails: {
    flex: 1,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  teamDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  codeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  codeValue: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontFamily: 'monospace',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  enterChatBanner: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  enterChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  enterChatText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabContent: {
    paddingBottom: SPACING.xl,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyTabBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginTop: SPACING.sm,
  },
  emptyTabTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
  },
  emptyTabSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 260,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    marginTop: 16,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  memberRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  ownerBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  memberRoleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ownerBadgeText: {
    color: COLORS.primaryDark,
  },
  normalMemberBadge: {
    backgroundColor: '#F1F5F9',
  },
  normalMemberText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
