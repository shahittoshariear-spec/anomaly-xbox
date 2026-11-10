import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
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
  isFocused,
  onStream,
  onPowerOn,
  onPowerOff,
}) => {
  const palette = useAnomalyTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const state = stateTone(consoleItem.powerState);

  return (
    <SurfaceCard
      accentBorder={isFocused}
      style={[styles.card, isFocused && styles.cardFocused]}>
      <View style={styles.row}>
        <Pressable
          onPress={onStream}
          style={({pressed}) => [styles.infoPress, pressed && {opacity: 0.75}]}>
          <IconBadge size={48}>
            <ConsoleArt type={consoleItem.consoleType} />
          </IconBadge>

          <View style={styles.info}>
            <Text
              style={[styles.name, {color: palette.text}]}
              numberOfLines={1}>
              {consoleItem.deviceName || consoleLabel(consoleItem.consoleType)}
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
              style={styles.powerButton}>
              <MaterialCommunityIcons
                name="power"
                size={22}
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
      </View>

      <Pressable
        onPress={onStream}
        style={({pressed}) => [
          styles.streamBar,
          {
            backgroundColor: `${palette.primary}14`,
            borderColor: palette.border,
          },
          pressed && {opacity: 0.75},
        ]}>
        <MaterialCommunityIcons
          name="play-circle-outline"
          size={20}
          color={palette.primary}
        />
        <Text style={[styles.streamText, {color: palette.primary}]}>
          Remote play
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={palette.primary}
        />
      </Pressable>
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardFocused: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 8,
  },
  infoPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  meta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
  },
  pillRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  powerButton: {
    padding: 10,
  },
  streamBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  streamText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ConsoleCard;
