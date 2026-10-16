import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../types/team';
import { sendTeamMessage, subscribeToTeamMessages } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface TeamChatScreenProps {
  route: {
    params: {
      teamId: string;
      teamName: string;
    };
  };
  navigation: any;
}

export const TeamChatScreen: React.FC<TeamChatScreenProps> = ({ route, navigation }) => {
  const { teamId, teamName } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTeamMessages(
      teamId,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      },
      (err) => {
        console.error('Chat subscription error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [teamId]);

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || !user || sending) return;

    try {
      setSending(true);
      setInputText('');
      await sendTeamMessage(teamId, user, textToSend);

      // Auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = item.senderId === user?.id;
    const timeFormatted = formatMessageTime(item.createdAt);

    if (isCurrentUser) {
      return (
        <View style={styles.currentUserMessageRow}>
          <View style={styles.currentUserBubbleWrapper}>
            <LinearGradient
              colors={COLORS.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.currentUserBubble}
            >
              <Text style={styles.currentUserText}>{item.text}</Text>
              <Text style={styles.currentUserTime}>{timeFormatted}</Text>
            </LinearGradient>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherUserMessageRow}>
        <View style={styles.otherAvatar}>
          <Text style={styles.otherAvatarText}>
            {item.senderName ? item.senderName[0].toUpperCase() : 'U'}
          </Text>
        </View>

        <View style={styles.otherBubbleWrapper}>
          <Text style={styles.otherSenderName}>{item.senderName}</Text>
          <View style={styles.otherBubble}>
            <Text style={styles.otherUserText}>{item.text}</Text>
            <Text style={styles.otherUserTime}>{timeFormatted}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTeamName} numberOfLines={1}>
            {teamName}
          </Text>
          <View style={styles.onlineStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineStatusText}>Kênh chat thời gian thực</Text>
          </View>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Chat Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>Đang kết nối phòng chat realtime...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChatBox}>
                <View style={styles.emptyChatIconCircle}>
                  <Ionicons name="chatbubbles-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyChatTitle}>Bắt đầu cuộc trò chuyện!</Text>
                <Text style={styles.emptyChatSubtitle}>
                  Đây là kênh trò chuyện trực tiếp giữa các thành viên trong nhóm {teamName}.
                </Text>
              </View>
            }
          />
        )}

        {/* Fixed Bottom Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.inputField}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTeamName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
  },
  onlineStatusText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: 10,
  },
  currentUserMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  currentUserBubbleWrapper: {
    maxWidth: '78%',
  },
  currentUserBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderBottomRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  otherUserMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
    maxWidth: '82%',
  },
  otherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  otherAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  otherBubbleWrapper: {
    flex: 1,
  },
  otherSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 3,
    marginLeft: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  otherUserText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  otherUserTime: {
    color: COLORS.textMuted,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyChatBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: SPACING.lg,
  },
  emptyChatIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyChatTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyChatSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
    gap: 10,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
});
