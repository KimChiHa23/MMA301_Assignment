import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types/task';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string, title: string) => void;
  onToggleStatus?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const statusConfig = COLORS.status[task.status] || COLORS.status.todo;
  const priorityConfig = COLORS.priority[task.priority] || COLORS.priority.medium;

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to permanently delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(task.id, task.title),
        },
      ]
    );
  };

  const isCompleted = task.status === 'done';

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.badges}>
          {/* Status Badge */}
          <View
            style={[
              styles.badge,
              { backgroundColor: statusConfig.bg, borderColor: statusConfig.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>

          {/* Priority Badge */}
          <View style={[styles.badge, { backgroundColor: priorityConfig.bg }]}>
            <Ionicons
              name={task.priority === 'high' ? 'alert-circle' : 'flag-outline'}
              size={12}
              color={priorityConfig.text}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.badgeText, { color: priorityConfig.text }]}>
              {priorityConfig.label}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(task)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Edit task ${task.title}`}
          >
            <Ionicons name="create-outline" size={19} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeletePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Delete task ${task.title}`}
          >
            <Ionicons name="trash-outline" size={19} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Row */}
      <View style={styles.mainContent}>
        <TouchableOpacity
          style={styles.checkCircle}
          onPress={() => onToggleStatus && onToggleStatus(task)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={isCompleted ? COLORS.success : COLORS.textMuted}
          />
        </TouchableOpacity>

        <View style={styles.textWrapper}>
          <Text
            style={[styles.title, isCompleted && styles.completedTitle]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {task.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Footer Info Row */}
      <View style={styles.footerRow}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.dateText}>
            Due: {task.dueDate ? task.dueDate : 'No due date'}
          </Text>
        </View>

        <Text style={styles.createdText}>
          ID: {task.id.slice(0, 8)}...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  completedCard: {
    opacity: 0.85,
    backgroundColor: '#F8FAFC',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
  },
  deleteButton: {
    backgroundColor: COLORS.dangerLight,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkCircle: {
    marginTop: 2,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 22,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  description: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm + 2,
    paddingTop: SPACING.xs + 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  createdText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
});
