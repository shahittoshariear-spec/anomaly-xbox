import React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useAnomalyTheme} from './theme';

type Props = {
  visible: boolean;
  label?: string;
  onFinished: () => void;
};

const LOGO = require('../assets/anomaly-logo.png');

const STREAKS = [-3, -2, -1, 0, 1, 2, 3];

/**
 * Full-screen launch transition: streaks converge on the Anomaly mark, the mark
 * flashes, then the whole overlay expands away to reveal the stream.
 * Tapping anywhere skips straight to the stream.
 */
const LaunchAnimation: React.FC<Props> = ({visible, label, onFinished}) => {
  const palette = useAnomalyTheme();
  const {width} = Dimensions.get('window');
  const progress = React.useRef(new Animated.Value(0)).current;
  const skipped = React.useRef(false);
  const onFinishedRef = React.useRef(onFinished);
  onFinishedRef.current = onFinished;

  const finish = React.useCallback(() => {
    if (skipped.current) {
      return;
    }
    skipped.current = true;
    Animated.timing(progress, {
      toValue: 1.2,
      duration: 160,
      useNativeDriver: true,
    }).start(() => onFinishedRef.current());
  }, [progress]);

  React.useEffect(() => {
    if (!visible) {
      skipped.current = false;
      progress.setValue(0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1500,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: true,
    });
    animation.start(({finished}) => {
      if (finished && !skipped.current) {
        onFinishedRef.current();
      }
    });
    return () => animation.stop();
  }, [visible, progress]);

  if (!visible) {
    return null;
  }

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 0.82, 1, 1.2],
    outputRange: [1, 1, 0, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.55, 1, 1.2],
    outputRange: [1, 1, 1.08, 1.12],
  });
  const logoOpacity = progress.interpolate({
    inputRange: [0, 0.18, 0.85, 1, 1.2],
    outputRange: [0, 1, 1, 1, 0],
  });
  const logoScale = progress.interpolate({
    inputRange: [0, 0.35, 1, 1.2],
    outputRange: [0.72, 1.04, 1, 1.3],
  });
  const haloScale = progress.interpolate({
    inputRange: [0, 0.4, 0.85, 1.2],
    outputRange: [0.2, 1, 1.9, 2.6],
  });
  const haloOpacity = progress.interpolate({
    inputRange: [0, 0.25, 0.75, 1.2],
    outputRange: [0, 0.5, 0.18, 0],
  });
  const labelOpacity = progress.interpolate({
    inputRange: [0, 0.25, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={finish}
      accessibilityRole="button"
      accessibilityLabel="Skip launch animation">
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: palette.background,
            opacity: overlayOpacity,
            transform: [{scale}],
          },
        ]}>
        {STREAKS.map(index => {
          const direction = index % 2 === 0 ? 1 : -1;
          const distance = width * (0.55 + Math.abs(index) * 0.08);
          const translateX = progress.interpolate({
            inputRange: [0, 0.45, 0.75, 1],
            outputRange: [distance * direction, 0, 0, -distance * direction * 0.6],
          });
          const streakOpacity = progress.interpolate({
            inputRange: [0, 0.12, 0.6, 0.82],
            outputRange: [0, 0.85 - Math.abs(index) * 0.16, 0.1, 0],
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.streak,
                {
                  top: '50%',
                  marginTop: index * 12,
                  backgroundColor: palette.primary,
                  opacity: streakOpacity,
                  transform: [{translateX}],
                },
              ]}
            />
          );
        })}

        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              borderColor: palette.primary,
              opacity: haloOpacity,
              transform: [{scale: haloScale}],
            },
          ]}
        />

        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{scale: logoScale}],
          }}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.Text
          style={[styles.label, {color: palette.textMuted, opacity: labelOpacity}]}>
          {label || 'Anomaly Xbox'}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  streak: {
    position: 'absolute',
    height: 2,
    width: 220,
    borderRadius: 1,
  },
  halo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
  },
  logo: {
    width: 132,
    height: 132,
  },
  label: {
    marginTop: 22,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

export default LaunchAnimation;
