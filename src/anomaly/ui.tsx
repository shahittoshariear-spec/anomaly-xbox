import React from 'react';
import {
  Animated,
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
      <Text style={[styles.sectionTitle, {color: palette.textMuted}]}>
        {title.toUpperCase()}
      </Text>
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
  const scale = React.useRef(new Animated.Value(1)).current;

  const springTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
      mass: 0.6,
    }).start();
  };

  const cardStyle: ViewStyle = {
    backgroundColor: palette.surface,
    borderColor: accentBorder ? palette.primary : palette.border,
  };

  if (!onPress) {
    return (
      <View style={[styles.card, cardStyle, style]}>{children}</View>
    );
  }

  return (
    <Animated.View style={[{transform: [{scale}]}, style]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => springTo(0.975)}
        onPressOut={() => springTo(1)}
        style={[styles.card, cardStyle]}>
        {children}
      </Pressable>
    </Animated.View>
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
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.3,
    opacity: 0.85,
  },
  sectionHint: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.8,
  },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
    opacity: 0.7,
  },
});
