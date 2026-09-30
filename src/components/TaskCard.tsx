import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  // 2-3 blended gradient colors for left accent bar
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (task.status === 'done') {
      return COLORS.gradients.taskStatus.done;
    }
    if (task.priority === 'high') {
      return COLORS.gradients.taskPriority.high;
    }
    if (task.priority === 'medium') {
      return COLORS.gradients.taskPriority.medium;
    }
    return COLORS.gradients.taskPriority.low;
  };

  const gradientColors = getGradientColors();

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
      {/* 2-3 Color Blended Accent Bar on the Left Edge */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.leftAccentBar}
      />

      <View style={styles.cardContent}>
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
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeletePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Delete task ${task.title}`}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
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
              color={isCompleted ? COLORS.success : '#94A3B8'}
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
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: '#E0F2FE', // Soft light blue border
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  leftAccentBar: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
    paddingLeft: SPACING.sm + 4,
  },
  completedCard: {
    opacity: 0.82,
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
    padding: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  deleteButton: {
    backgroundColor: COLORS.dangerLight,
    borderColor: '#FECDD3',
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
