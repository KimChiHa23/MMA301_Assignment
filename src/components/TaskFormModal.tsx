import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { Team, TeamMember } from '../types/team';
import { subscribeToTeamMembers } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  taskToEdit?: Task | null;
  userTeams?: Team[];
  defaultTeamId?: string | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  taskToEdit,
  userTeams = [],
  defaultTeamId = null,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (visible) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setStatus(taskToEdit.status);
        setPriority(taskToEdit.priority);
        setDueDate(taskToEdit.dueDate || '');
        setSelectedTeamId(taskToEdit.teamId || null);
        setSelectedAssigneeId(taskToEdit.assigneeId || null);
      } else {
        setTitle('');
        setDescription('');
        setStatus('todo');
        setPriority('medium');
        const today = new Date().toISOString().split('T')[0];
        setDueDate(today);
        setSelectedTeamId(defaultTeamId || (userTeams.length > 0 ? userTeams[0].id : null));
        setSelectedAssigneeId(user?.id || null);
      }
      setTitleError('');
    }
  }, [visible, taskToEdit, defaultTeamId, userTeams, user]);

  // Load team members whenever selectedTeamId changes
  useEffect(() => {
    if (!selectedTeamId) {
      setTeamMembers([]);
      setSelectedAssigneeId(null);
      return;
    }

    setLoadingMembers(true);
    const unsubscribe = subscribeToTeamMembers(
      selectedTeamId,
      (members) => {
        setTeamMembers(members);
        setLoadingMembers(false);

        // If previously selected assignee is not in this team, default to first or unassigned
        if (selectedAssigneeId && !members.some((m) => m.userId === selectedAssigneeId)) {
          setSelectedAssigneeId(null);
        }
      },
      (err) => {
        console.error('Failed to load team members for modal:', err);
        setLoadingMembers(false);
      }
    );

    return () => unsubscribe();
  }, [selectedTeamId]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError('Tiêu đề công việc không được để trống.');
      return;
    }

    try {
      setSubmitting(true);

      // Find team name
      const teamObj = userTeams.find((t) => t.id === selectedTeamId);
      const teamName = teamObj ? teamObj.name : null;

      // Find assignee name
      let assigneeName: string | null = null;
      if (selectedAssigneeId) {
        const memberObj = teamMembers.find((m) => m.userId === selectedAssigneeId);
        if (memberObj) {
          assigneeName = memberObj.userName;
        } else if (selectedAssigneeId === user?.id) {
          assigneeName = user.name;
        }
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate.trim() || new Date().toISOString().split('T')[0],
        teamId: selectedTeamId,
        teamName,
        assigneeId: selectedAssigneeId,
        assigneeName,
        creatorId: user?.id || null,
      });

      onClose();
    } catch (error) {
      console.error('Error submitting task form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions: {
    value: TaskStatus;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { value: 'todo', label: 'To Do', icon: 'list-outline' },
    { value: 'in_progress', label: 'In Progress', icon: 'timer-outline' },
    { value: 'done', label: 'Done', icon: 'checkmark-circle-outline' },
  ];

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#10B981' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'high', label: 'High', color: '#EF4444' },
  ];

  const isEditing = Boolean(taskToEdit);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.modalIcon}>
                <Ionicons
                  name={isEditing ? 'create-outline' : 'add-circle-outline'}
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.headerTitle}>{isEditing ? 'Cập Nhật Task' : 'Tạo Task Mới'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formBody} showsVerticalScrollIndicator={false}>
            {/* Title Field (Required) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Tiêu đề Task <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, titleError ? styles.inputError : null]}
                placeholder="Ví dụ: Thiết kế giao diện chi tiết nhóm"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (titleError) setTitleError('');
                }}
                maxLength={100}
              />
              {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
            </View>

            {/* Team Picker (Selecting from user's teams) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="people-outline" size={15} color={COLORS.primary} />
                <Text style={styles.label}>Nhóm Phụ Trách (Team)</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.selectionChip,
                    selectedTeamId === null && styles.selectionChipSelected,
                  ]}
                  onPress={() => setSelectedTeamId(null)}
                >
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={selectedTeamId === null ? '#FFFFFF' : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.selectionChipText,
                      selectedTeamId === null && styles.selectionChipTextSelected,
                    ]}
                  >
                    Cá nhân (Không có nhóm)
                  </Text>
                </TouchableOpacity>

                {userTeams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <TouchableOpacity
                      key={team.id}
                      style={[styles.selectionChip, isSelected && styles.selectionChipSelected]}
                      onPress={() => setSelectedTeamId(team.id)}
                    >
                      <Ionicons
                        name="people"
                        size={14}
                        color={isSelected ? '#FFFFFF' : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.selectionChipText,
                          isSelected && styles.selectionChipTextSelected,
                        ]}
                      >
                        {team.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Assignee Picker (Dynamically loaded from members of selected team) */}
            {selectedTeamId ? (
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="person-circle-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.label}>Người Thực Hiện (Assignee)</Text>
                </View>

                {loadingMembers ? (
                  <View style={styles.smallLoaderRow}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.smallLoaderText}>Đang tải thành viên nhóm...</Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipsScroll}
                  >
                    <TouchableOpacity
                      style={[
                        styles.selectionChip,
                        selectedAssigneeId === null && styles.selectionChipSelected,
                      ]}
                      onPress={() => setSelectedAssigneeId(null)}
                    >
                      <Text
                        style={[
                          styles.selectionChipText,
                          selectedAssigneeId === null && styles.selectionChipTextSelected,
                        ]}
                      >
                        Chưa chỉ định
                      </Text>
                    </TouchableOpacity>

                    {teamMembers.map((member) => {
                      const isSelected = selectedAssigneeId === member.userId;
                      return (
                        <TouchableOpacity
                          key={member.userId}
                          style={[styles.selectionChip, isSelected && styles.selectionChipSelected]}
                          onPress={() => setSelectedAssigneeId(member.userId)}
                        >
                          <Ionicons
                            name="person"
                            size={14}
                            color={isSelected ? '#FFFFFF' : COLORS.textMuted}
                          />
                          <Text
                            style={[
                              styles.selectionChipText,
                              isSelected && styles.selectionChipTextSelected,
                            ]}
                          >
                            {member.userName} {member.userId === user?.id ? '(Tôi)' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            ) : null}

            {/* Description Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mô Tả Chi Tiết (Tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ghi chú thêm thông tin hoặc yêu cầu công việc..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Status Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Trạng Thái</Text>
              <View style={styles.optionsRow}>
                {statusOptions.map((opt) => {
                  const selected = status === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() => setStatus(opt.value)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={16}
                        color={selected ? '#FFFFFF' : COLORS.textMuted}
                      />
                      <Text
                        style={[styles.optionChipText, selected && styles.optionChipTextSelected]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Priority Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Độ Ưu Tiên</Text>
              <View style={styles.optionsRow}>
                {priorityOptions.map((opt) => {
                  const selected = priority === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.priorityChip,
                        selected && { backgroundColor: opt.color, borderColor: opt.color },
                      ]}
                      onPress={() => setPriority(opt.value)}
                    >
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: selected ? '#FFFFFF' : opt.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.priorityChipText,
                          selected && styles.priorityChipTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Due Date Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Hạn Chót (YYYY-MM-DD)</Text>
              <View style={styles.dateInputContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={COLORS.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.dateInput}
                  placeholder="2026-10-15"
                  placeholderTextColor={COLORS.textMuted}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButtonWrapper}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={COLORS.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={isEditing ? 'save-outline' : 'checkmark-circle-outline'}
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.submitButtonText}>
                      {isEditing ? 'Lưu Thay Đổi' : 'Tạo Task'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  formBody: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: COLORS.danger,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginTop: 2,
  },
  selectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  selectionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectionChipTextSelected: {
    color: '#FFFFFF',
  },
  smallLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  smallLoaderText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 70,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: '#FAFAFA',
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: '#FAFAFA',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  priorityChipTextSelected: {
    color: '#FFFFFF',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
  },
  dateInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  submitButtonWrapper: {
    flex: 2,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButton: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
