import React from 'react';
import {Animated, Easing, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {Menu} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAnomalyTheme} from './theme';
import {IconBadge, Pill, SurfaceCard} from './ui';

type ConsoleItemProps = {
  consoleItem: {
    serverId: string;
    deviceName?: string;
    consoleType?: string;
    powerState?: string;
  };
  index?: number;
  isFocused?: boolean;
  onStream: () => void;
  onPowerOn: () => void;
  onPowerOff: () => void;
};

const consoleLabel = (type?: string) => {
  switch (type) {
    case 'XboxSeriesX':
      return 'Xbox Series X';
    case 'XboxSeriesS':
      return 'Xbox Series S';
    case 'XboxOneX':
      return 'Xbox One X';
    case 'XboxOneS':
      return 'Xbox One S';
    default:
      return 'Xbox';
  }
};

const stateTone = (powerState?: string) => {
  if (powerState === 'On') {
    return {label: 'On', tone: 'accent' as const};
  }
  if (powerState === 'ConnectedStandby') {
    return {label: 'Standby', tone: 'muted' as const};
  }
  return {label: powerState || 'Offline', tone: 'muted' as const};
};

const ConsoleArt: React.FC<{type?: string; size?: number}> = ({
  type,
  size = 26,
}) => {
  const palette = useAnomalyTheme();
  if (type === 'XboxSeriesX') {
    return (
      <Image
        source={require('../assets/console/series-x.png')}
        style={{width: size, height: size}}
        resizeMode="contain"
      />
    );
  }
  if (type === 'XboxSeriesS') {
    return (
      <Image
        source={require('../assets/console/series-s.png')}
        style={{width: size, height: size}}
        resizeMode="contain"
      />
    );
  }
  return (
    <MaterialCommunityIcons
      name="microsoft-xbox"
      size={size}
      color={palette.primary}
    />
  );
};

const ConsoleCard: React.FC<ConsoleItemProps> = ({
  consoleItem,
  index = 0,
  isFocused,
  onStream,
  onPowerOn,
  onPowerOff,
}) => {
  const palette = useAnomalyTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const state = stateTone(consoleItem.powerState);

  // Cards settle in with a short spring. The effect runs once per mount, so a
  // refresh does not replay the animation for cards that stay on screen.
  const appear = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(Math.min(index, 6) * 45),
      Animated.spring(appear, {
        toValue: 1,
        damping: 18,
        stiffness: 220,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [appear, index]);

  const springTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      damping: 20,
      stiffness: 320,
      mass: 0.5,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            translateY: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
          {scale},
        ],
      }}>
      <SurfaceCard
        accentBorder={isFocused}
        style={[styles.card, isFocused && styles.cardFocused]}>
        <View style={styles.row}>
          <Pressable
            onPress={onStream}
            onPressIn={() => springTo(0.985)}
            onPressOut={() => springTo(1)}
            style={styles.infoPress}>
            <IconBadge size={50}>
              <ConsoleArt type={consoleItem.consoleType} />
            </IconBadge>

            <View style={styles.info}>
              <Text
                style={[styles.name, {color: palette.text}]}
                numberOfLines={1}>
                {consoleItem.deviceName ||
                  consoleLabel(consoleItem.consoleType)}
              </Text>
              <Text style={[styles.meta, {color: palette.textMuted}]}>
                {consoleLabel(consoleItem.consoleType)}
              </Text>
              <View style={styles.pillRow}>
                <Pill label={state.label} tone={state.tone} />
              </View>
            </View>
          </Pressable>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Pressable
                hitSlop={10}
                onPress={() => setMenuVisible(true)}
                style={styles.iconButton}>
                <MaterialCommunityIcons
                  name="power"
                  size={20}
                  color={palette.textMuted}
                />
              </Pressable>
            }>
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onPowerOn();
              }}
              title="Turn on"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onPowerOff();
              }}
              title="Turn off"
            />
          </Menu>

          <Pressable
            hitSlop={8}
            onPress={onStream}
            onPressIn={() => springTo(0.985)}
            onPressOut={() => springTo(1)}
            style={styles.iconButton}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={palette.textMuted}
            />
          </Pressable>
        </View>
      </SurfaceCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  cardFocused: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 6,
  },
  infoPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 14,
    marginRight: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  meta: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  pillRow: {
    marginTop: 7,
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
});

export default ConsoleCard;
