import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTasks } from '../hooks/useTasks';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { Team } from '../types/team';
import { subscribeToUserTeams } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { TaskCard } from '../components/TaskCard';
import { TaskFormModal } from '../components/TaskFormModal';
import { Header } from '../components/Header';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

type FilterType = 'all' | TaskStatus;

export const HomeScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { user } = useAuth();

  const {
    tasks,
    loading,
    refreshing,
    error,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    seedInitialTasks,
  } = useTasks();

  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Subscribe to user's teams to filter tasks by membership
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeToUserTeams(
      user.id,
      (teams) => setUserTeams(teams),
      (err) => console.error('Error fetching teams in HomeScreen:', err)
    );
    return () => unsubscribe();
  }, [user?.id]);

  const userTeamIds = useMemo(() => new Set(userTeams.map((t) => t.id)), [userTeams]);

  // Filter tasks: permission filter (tasks in user's teams or personal/unassigned) + status + search
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Task permissions: display if personal/no team OR user is a member of the team
      const hasPermission = !t.teamId || userTeamIds.has(t.teamId);
      if (!hasPermission) return false;

      const matchesFilter = activeFilter === 'all' ? true : t.status === activeFilter;
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.teamName && t.teamName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assigneeName && t.assigneeName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [tasks, userTeamIds, activeFilter, searchQuery]);

  // Status counts for filter chips
  const counts = useMemo(() => {
    const accessible = tasks.filter((t) => !t.teamId || userTeamIds.has(t.teamId));
    return {
      all: accessible.length,
      todo: accessible.filter((t) => t.status === 'todo').length,
      in_progress: accessible.filter((t) => t.status === 'in_progress').length,
      done: accessible.filter((t) => t.status === 'done').length,
    };
  }, [tasks, userTeamIds]);

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setTaskToEdit(task);
    setModalVisible(true);
  };

  const handleFormSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, data as UpdateTaskInput);
    } else {
      await createTask(data as CreateTaskInput);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(task.id, { status: nextStatus });
  };

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'todo', label: 'Cần làm', count: counts.todo },
    { key: 'in_progress', label: 'Đang làm', count: counts.in_progress },
    { key: 'done', label: 'Hoàn thành', count: counts.done },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />

      <View style={[styles.mainWrapper, isTablet && styles.tabletContainer]}>
        {/* Search & Add Bar */}
        <View style={styles.topControlSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm task, team, assignee..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleOpenCreateModal}
            activeOpacity={0.85}
            accessibilityLabel="Tạo Task Mới"
          >
            <LinearGradient
              colors={COLORS.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButton}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Thêm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterSection}>
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setActiveFilter(tab.key)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {tab.label}
                </Text>
                <View style={[styles.filterBadge, isSelected && styles.filterBadgeSelected]}>
                  <Text
                    style={[styles.filterBadgeText, isSelected && styles.filterBadgeTextSelected]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Error banner if any */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Task List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách công việc...</Text>
          </View>
        ) : (
          <FlatList
            data={visibleTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
                onToggleStatus={handleToggleStatus}
                canEditDelete={!item.teamId || userTeamIds.has(item.teamId)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="file-tray-outline" size={38} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Chưa có công việc nào</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || activeFilter !== 'all'
                    ? 'Không có task nào khớp với tiêu chí tìm kiếm hoặc bộ lọc.'
                    : 'Hãy bắt đầu tạo task mới hoặc chọn nhóm để cộng tác!'}
                </Text>
                <View style={styles.emptyActionRow}>
                  <TouchableOpacity onPress={handleOpenCreateModal} activeOpacity={0.85}>
                    <LinearGradient
                      colors={COLORS.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.emptyAddButton}
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                      <Text style={styles.emptyAddButtonText}>Tạo Task Ngay</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {!searchQuery && activeFilter === 'all' && (
                    <TouchableOpacity style={styles.seedButton} onPress={seedInitialTasks}>
                      <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.seedButtonText}>Seed Mẫu Task</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            }
          />
        )}
      </View>

      {/* Create / Edit Modal */}
      <TaskFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleFormSubmit}
        taskToEdit={taskToEdit}
        userTeams={userTeams}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  tabletContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  topControlSection: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: RADIUS.md,
    gap: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  filterSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm + 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  filterChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterChipTextSelected: {
    color: '#4F46E5',
  },
  filterBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterBadgeSelected: {
    backgroundColor: '#6366F1',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  filterBadgeTextSelected: {
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: SPACING.md,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  emptyActionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  seedButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
