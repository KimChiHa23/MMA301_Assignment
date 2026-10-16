import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Team } from '../types/team';
import {
  subscribeToUserTeams,
  createTeam,
  joinTeam,
  getDiscoverableTeams,
} from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface TeamsScreenProps {
  navigation: any;
}

export const TeamsScreen: React.FC<TeamsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Team Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join Team Modal State
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [teamCodeToJoin, setTeamCodeToJoin] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [discoverableTeams, setDiscoverableTeams] = useState<Team[]>([]);
  const [loadingDiscoverable, setLoadingDiscoverable] = useState(false);

  // Subscribe to user teams
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const unsubscribe = subscribeToUserTeams(
      user.id,
      (userTeams) => {
        setTeams(userTeams);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching teams:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Open Join Modal & fetch discoverable teams
  const handleOpenJoinModal = async () => {
    setTeamCodeToJoin('');
    setJoinError('');
    setJoinModalVisible(true);

    if (user?.id) {
      setLoadingDiscoverable(true);
      try {
        const publicTeams = await getDiscoverableTeams(user.id);
        setDiscoverableTeams(publicTeams);
      } catch (err) {
        console.error('Error loading discoverable teams:', err);
      } finally {
        setLoadingDiscoverable(false);
      }
    }
  };

  // Handle Create Team
  const handleCreateTeamSubmit = async () => {
    if (!newTeamName.trim()) {
      setCreateError('Vui lòng nhập tên nhóm.');
      return;
    }
    if (!user) return;

    try {
      setCreating(true);
      setCreateError('');
      const teamId = await createTeam(
        { name: newTeamName.trim(), description: newTeamDesc.trim() },
        user
      );
      setCreateModalVisible(false);
      setNewTeamName('');
      setNewTeamDesc('');

      // Navigate to created team detail
      navigation.navigate('TeamDetail', { teamId, teamName: newTeamName.trim() });
    } catch (err: any) {
      setCreateError(err?.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  // Handle Join Team
  const handleJoinTeamSubmit = async (teamIdToUse?: string) => {
    const targetId = teamIdToUse || teamCodeToJoin.trim();
    if (!targetId) {
      setJoinError('Vui lòng nhập mã nhóm.');
      return;
    }
    if (!user) return;

    try {
      setJoining(true);
      setJoinError('');
      const joinedTeam = await joinTeam(targetId, user);
      setJoinModalVisible(false);
      setTeamCodeToJoin('');

      Alert.alert('Thành Công', `Bạn đã tham gia nhóm "${joinedTeam.name}"!`);
      navigation.navigate('TeamDetail', { teamId: joinedTeam.id, teamName: joinedTeam.name });
    } catch (err: any) {
      setJoinError(err?.message || 'Không thể tham gia nhóm. Kiểm tra lại mã.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quản Lý Nhóm</Text>
          <Text style={styles.headerSubtitle}>Cộng tác, chia sẻ công việc và chat realtime</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.joinHeaderButton}
            onPress={handleOpenJoinModal}
            activeOpacity={0.8}
          >
            <Ionicons name="enter-outline" size={18} color={COLORS.primary} />
            <Text style={styles.joinHeaderButtonText}>Gia Nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setNewTeamName('');
              setNewTeamDesc('');
              setCreateError('');
              setCreateModalVisible(true);
            }}
          >
            <LinearGradient
              colors={COLORS.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createHeaderButton}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createHeaderButtonText}>Tạo Nhóm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách nhóm...</Text>
          </View>
        ) : (
          <FlatList
            data={teams}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isOwner = item.ownerId === user?.id;
              return (
                <TouchableOpacity
                  style={styles.teamCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('TeamDetail', {
                      teamId: item.id,
                      teamName: item.name,
                    })
                  }
                >
                  <View style={styles.cardHeader}>
                    <LinearGradient
                      colors={COLORS.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.teamAvatar}
                    >
                      <Ionicons name="people" size={22} color="#FFFFFF" />
                    </LinearGradient>

                    <View style={styles.cardTitleWrapper}>
                      <View style={styles.teamNameRow}>
                        <Text style={styles.teamName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View
                          style={[
                            styles.roleBadge,
                            isOwner ? styles.ownerBadge : styles.memberBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              isOwner ? styles.ownerBadgeText : styles.memberBadgeText,
                            ]}
                          >
                            {isOwner ? 'Trưởng nhóm' : 'Thành viên'}
                          </Text>
                        </View>
                      </View>

                      {item.description ? (
                        <Text style={styles.teamDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : (
                        <Text style={[styles.teamDesc, { fontStyle: 'italic' }]}>
                          Không có mô tả
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Card Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.teamCodeContainer}>
                      <Ionicons name="key-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.teamCodeText}>Mã: {item.id.slice(0, 8)}...</Text>
                    </View>

                    <View style={styles.enterTeamRow}>
                      <Text style={styles.enterTeamText}>Xem chi tiết & Chat</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="people-outline" size={42} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Bạn chưa tham gia nhóm nào</Text>
                <Text style={styles.emptySubtitle}>
                  Tạo một nhóm làm việc mới để phân công công việc hoặc gia nhập nhóm bằng mã nhóm!
                </Text>

                <View style={styles.emptyActionRow}>
                  <TouchableOpacity
                    onPress={() => setCreateModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={COLORS.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.emptyCreateButton}
                    >
                      <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.emptyCreateButtonText}>Tạo Nhóm Mới</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.emptyJoinButton} onPress={handleOpenJoinModal}>
                    <Ionicons name="enter-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.emptyJoinButtonText}>Gia Nhập Nhóm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        )}
      </View>

      {/* Modal: Create Team */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIcon}>
                  <Ionicons name="people" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.modalTitle}>Tạo Nhóm Làm Việc</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {createError ? (
              <View style={styles.modalErrorBanner}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.modalErrorText}>{createError}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>
                Tên Nhóm <Text style={styles.asterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Đội Dự Án Mobile"
                placeholderTextColor={COLORS.textMuted}
                value={newTeamName}
                onChangeText={(text) => {
                  setNewTeamName(text);
                  if (createError) setCreateError('');
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Mô Tả Nhóm</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Mô tả mục tiêu hoạt động của nhóm..."
                placeholderTextColor={COLORS.textMuted}
                value={newTeamDesc}
                onChangeText={setNewTeamDesc}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCreateModalVisible(false)}
                disabled={creating}
              >
                <Text style={styles.modalCancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButtonWrapper}
                onPress={handleCreateTeamSubmit}
                disabled={creating}
              >
                <LinearGradient
                  colors={COLORS.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSubmitButton}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.modalSubmitButtonText}>Tạo Nhóm</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Join Team */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIcon}>
                  <Ionicons name="enter" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.modalTitle}>Gia Nhập Nhóm</Text>
              </View>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ paddingHorizontal: SPACING.md }}
            >
              {joinError ? (
                <View style={styles.modalErrorBanner}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.modalErrorText}>{joinError}</Text>
                </View>
              ) : null}

              {/* Enter Team Code */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Nhập Mã Nhóm (Team ID / Code)</Text>
                <View style={styles.joinInputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Dán mã ID nhóm vào đây..."
                    placeholderTextColor={COLORS.textMuted}
                    value={teamCodeToJoin}
                    onChangeText={(text) => {
                      setTeamCodeToJoin(text);
                      if (joinError) setJoinError('');
                    }}
                  />
                  <TouchableOpacity
                    style={styles.directJoinButton}
                    onPress={() => handleJoinTeamSubmit()}
                    disabled={joining}
                  >
                    {joining ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.directJoinButtonText}>Gia Nhập</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Discoverable / Public Teams List */}
              <View style={styles.discoverSection}>
                <Text style={styles.discoverTitle}>Hoặc chọn nhóm có sẵn để tham gia:</Text>

                {loadingDiscoverable ? (
                  <View style={styles.discoverLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.discoverLoadingText}>Đang tìm kiếm nhóm...</Text>
                  </View>
                ) : discoverableTeams.length > 0 ? (
                  discoverableTeams.map((dTeam) => (
                    <View key={dTeam.id} style={styles.discoverCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.discoverTeamName}>{dTeam.name}</Text>
                        <Text style={styles.discoverTeamDesc} numberOfLines={1}>
                          {dTeam.description || 'Không có mô tả'}
                        </Text>
                        <Text style={styles.discoverTeamId}>ID: {dTeam.id}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.quickJoinButton}
                        onPress={() => handleJoinTeamSubmit(dTeam.id)}
                        disabled={joining}
                      >
                        <Text style={styles.quickJoinButtonText}>Vào Nhóm</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDiscoverText}>
                    Không có nhóm nào khác khả dụng để tham gia.
                  </Text>
                )}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setJoinModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
    backgroundColor: COLORS.card,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  joinHeaderButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  createHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: RADIUS.md,
  },
  createHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    paddingVertical: SPACING.md,
  },
  teamCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrapper: {
    flex: 1,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  ownerBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  memberBadge: {
    backgroundColor: '#F1F5F9',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ownerBadgeText: {
    color: COLORS.primaryDark,
  },
  memberBadgeText: {
    color: COLORS.textMuted,
  },
  teamDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm + 4,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  teamCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teamCodeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  enterTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enterTeamText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: SPACING.md,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
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
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 300,
  },
  emptyActionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  emptyCreateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  emptyJoinButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderLeft: {
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    padding: 10,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  modalErrorText: {
    color: COLORS.danger,
    fontSize: 12,
    flex: 1,
  },
  formGroup: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  asterisk: {
    color: COLORS.danger,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 70,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modalSubmitButtonWrapper: {
    flex: 2,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  modalSubmitButton: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  directJoinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directJoinButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  discoverSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  discoverTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  discoverLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  discoverLoadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  discoverTeamName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  discoverTeamDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  discoverTeamId: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  quickJoinButton: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  quickJoinButtonText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  noDiscoverText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
