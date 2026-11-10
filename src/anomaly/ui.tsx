import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {useAnomalyTheme} from './theme';

export const AnomalyScreen: React.FC<{
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}> = ({style, children}) => {
  const palette = useAnomalyTheme();
  return (
    <View style={[styles.screen, {backgroundColor: palette.background}, style]}>
      <View
        pointerEvents="none"
        style={[styles.glow, {backgroundColor: palette.glow}]}
      />
      {children}
    </View>
  );
};

export const SectionHeader: React.FC<{
  title: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}> = ({title, hint, style}) => {
  const palette = useAnomalyTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionTitleRow}>
        <View
          style={[styles.sectionBar, {backgroundColor: palette.primary}]}
        />
        <Text style={[styles.sectionTitle, {color: palette.text}]}>
          {title}
        </Text>
      </View>
      {!!hint && (
        <Text style={[styles.sectionHint, {color: palette.textMuted}]}>
          {hint}
        </Text>
      )}
    </View>
  );
};

export const SurfaceCard: React.FC<{
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  onPress?: () => void;
  accentBorder?: boolean;
}> = ({style, children, onPress, accentBorder}) => {
  const palette = useAnomalyTheme();
  const cardStyle: ViewStyle = {
    backgroundColor: palette.surface,
    borderColor: accentBorder ? palette.primary : palette.border,
  };
  if (!onPress) {
    return <View style={[styles.card, cardStyle, style]}>{children}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.card,
        cardStyle,
        pressed && {opacity: 0.82, transform: [{scale: 0.995}]},
        style,
      ]}>
      {children}
    </Pressable>
  );
};

export const Pill: React.FC<{
  label: string;
  tone?: 'accent' | 'muted';
  style?: StyleProp<ViewStyle>;
}> = ({label, tone = 'accent', style}) => {
  const palette = useAnomalyTheme();
  const color = tone === 'accent' ? palette.primary : palette.textMuted;
  return (
    <View
      style={[
        styles.pill,
        {borderColor: color, backgroundColor: `${color}1F`},
        style,
      ]}>
      <Text style={[styles.pillText, {color}]}>{label}</Text>
    </View>
  );
};

export const IconBadge: React.FC<{
  children: React.ReactNode;
  size?: number;
}> = ({children, size = 46}) => {
  const palette = useAnomalyTheme();
  return (
    <View
      style={[
        styles.iconBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${palette.primary}1A`,
          borderColor: `${palette.primary}66`,
        },
      ]}>
      {children}
    </View>
  );
};

export const Divider: React.FC = () => {
  const palette = useAnomalyTheme();
  return (
    <View style={[styles.divider, {backgroundColor: palette.border}]} />
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: -180,
    left: '50%',
    marginLeft: -230,
    width: 460,
    height: 460,
    borderRadius: 230,
    opacity: 0.55,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sectionHint: {
    marginTop: 6,
    marginLeft: 13,
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
