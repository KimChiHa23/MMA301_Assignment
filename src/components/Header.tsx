import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { isFirebaseConfigured } from '../services/firebase';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  subtitle = 'Quản lý task thông minh & cộng tác realtime',
}) => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          <LinearGradient
            colors={COLORS.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <View style={styles.logoInnerBorder}>
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
            </View>
          </LinearGradient>

          <View style={styles.brandContent}>
            <View style={styles.nameRow}>
              <Text style={styles.brandName}>
                Task<Text style={styles.brandHighlight}>Aura</Text>
              </Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isFirebaseConfigured ? '#10B981' : '#F59E0B' },
                ]}
              />
              <Text style={styles.badgeText}>
                {isFirebaseConfigured ? 'Live Cloud: mma301-1cae2' : 'Offline Mode'}
              </Text>
            </View>
          </View>
        </View>

        {/* User Mini Avatar / Name on Right */}
        {user ? (
          <View style={styles.userBadge}>
            <View style={styles.userAvatarCircle}>
              <Text style={styles.userAvatarText}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.userNameText} numberOfLines={1}>
              {user.name.split(' ').slice(-1)[0]}
            </Text>
          </View>
        ) : null}
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  logoInnerBorder: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandContent: {
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandHighlight: {
    color: '#6366F1',
    fontWeight: '900',
  },
  proBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.sm,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    maxWidth: 120,
  },
  userAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs + 2,
    lineHeight: 17,
  },
});
