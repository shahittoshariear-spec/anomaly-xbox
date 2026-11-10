import React from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  View,
  ToastAndroid,
  Platform,
} from 'react-native';
import {Text} from 'react-native-paper';
import Spinner from '../components/Spinner';
import {getSettings, resetSettings, saveSettings} from '../store/settingStore';
import SettingRow from '../anomaly/SettingRow';
import ThemePicker from '../anomaly/ThemePicker';
import {AnomalyScreen, SectionHeader, SurfaceCard} from '../anomaly/ui';
import {useAnomalyTheme} from '../anomaly/theme';
import {useSelector} from 'react-redux';
import RNRestart from 'react-native-restart';
import CookieManager from '@react-native-cookies/cookies';
import {useTranslation} from 'react-i18next';
import {
  useGamepadNavigation,
  useGamepadActiveState,
} from '../utils/useGamepadNavigation';
import GamepadFooterHints from '../components/GamepadFooterHints';
import {debugFactory} from '../utils/debug';
import {clearStreamToken} from '../store/streamTokenStore';
import {clearWebToken} from '../store/webTokenStore';
import {clearXcloudData} from '../store/xcloudStore';
import {clearConsolesData} from '../store/consolesStore';
import {clearServerData} from '../store/serverStore';
import {storage} from '../store/mmkv';

import bases from '../common/settings/bases';
import display from '../common/settings/display';
import gamepad from '../common/settings/gamepad';
import vgamepad from '../common/settings/vgamepad';
import audio from '../common/settings/audio';
import xhome from '../common/settings/xhome';
import others from '../common/settings/others';

import pkg from '../../package.json';

const log = debugFactory('SettingsScreen');

const pick = (group: any[], names: string[]) =>
  names
    .map(name => group.find(meta => meta.name === name))
    .filter(Boolean) as any[];

const STREAMING_NAMES = [
  'resolution',
  'video_format',
  'codec',
  'native_low_latency_decoder',
  'fsr',
];
const CONTROL_NAMES = [
  'dead_zone',
  'vibration',
  'rumble_intensity',
  'short_trigger',
  'auto_sprint',
];
const VIRTUAL_NAMES = ['show_virtual_gamead', 'virtual_gamepad_opacity'];
const AUDIO_NAMES = ['audio_bitrate_mode', 'enable_stereo_audio'];
const CONSOLE_NAMES = ['power_on', 'ipv6'];
const APP_NAMES = ['locale', 'native_touch', 'check_update', 'show_session_report'];

function SettingsScreen({navigation}) {
  const {t} = useTranslation();
  const palette = useAnomalyTheme();
  const authentication = useSelector((state: any) => state.authentication);

  const [isGamepadActive, setIsGamepadActive] = useGamepadActiveState();
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const [loading, setLoading] = React.useState(false);
  const [themeId, setThemeId] = React.useState(
    () => getSettings().anomaly_theme,
  );

  const sisuToken = authentication._tokenStore.getSisuToken();
  const userToken = authentication._tokenStore.getUserToken();

  let isAuthed = false;
  let user = '';

  if (sisuToken && sisuToken.data && sisuToken.data.AuthorizationToken) {
    isAuthed = true;
    if (sisuToken.data.AuthorizationToken.DisplayClaims) {
      try {
        user = sisuToken.data.AuthorizationToken.DisplayClaims.xui[0].mgt;
      } catch (e) {}
    }
  }

  if (userToken && userToken.data && userToken.data.access_token) {
    isAuthed = true;
  }

  const handleClearCache = () => {
    clearXcloudData();
    clearConsolesData();
    clearServerData();
    resetSettings();
    ToastAndroid.show(t('Success'), ToastAndroid.SHORT);
    setTimeout(() => {
      RNRestart.restart();
    }, 1000);
  };

  const handleItemPress = async (id: any) => {
    if (id === 'logout') {
      Alert.alert(t('Warning'), t('Do you want to logout?'), [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: t('Confirm'),
          style: 'default',
          onPress: () => {
            setLoading(true);
            clearStreamToken();
            clearWebToken();
            clearXcloudData();
            clearConsolesData();
            clearServerData();
            authentication._tokenStore.clear();
            CookieManager.clearAll();
            try {
              storage.delete('user.account_tier');
              storage.delete('user.account_tier_owner');
              storage.delete('user.gamertag');
              storage.delete('user.gamerpic');
            } catch {}
            setTimeout(() => {
              RNRestart.restart();
            }, 1000);
          },
        },
      ]);
    } else {
      navigation.navigate('SettingDetail', {id});
    }
  };

  const handleSelectTheme = (id: string) => {
    setThemeId(id);
    const settings = getSettings();
    saveSettings({...settings, anomaly_theme: id});
  };

  const streaming = React.useMemo(() => pick(display, STREAMING_NAMES), []);
  const controls = React.useMemo(() => pick(gamepad, CONTROL_NAMES), []);
  const virtualControls = React.useMemo(
    () => pick(vgamepad, VIRTUAL_NAMES),
    [],
  );
  const audioSettings = React.useMemo(() => pick(audio, AUDIO_NAMES), []);
  const consoleSettings = React.useMemo(() => pick(xhome, CONSOLE_NAMES), []);
  const appSettings = React.useMemo(() => pick(others, APP_NAMES), []);
  const localeSetting = React.useMemo(() => pick(bases, ['locale']), []);

  const settingActions = React.useMemo(() => {
    const list: (() => void)[] = [];
    [...localeSetting, ...streaming, ...controls].forEach(meta =>
      list.push(() => handleItemPress(meta.name)),
    );
    list.push(() => navigation.navigate('GamepadTest'));
    [...virtualControls, ...audioSettings, ...consoleSettings].forEach(meta =>
      list.push(() => handleItemPress(meta.name)),
    );
    [...appSettings].forEach(meta => list.push(() => handleItemPress(meta.name)));
    list.push(() => navigation.navigate('About'));
    list.push(() => handleClearCache());
    if (isAuthed) {
      list.push(() => handleItemPress('logout'));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isAuthed, t]);

  useGamepadNavigation({
    onUp: () => setFocusedIndex(prev => Math.max(0, prev - 1)),
    onDown: () =>
      setFocusedIndex(prev => Math.min(settingActions.length - 1, prev + 1)),
    onSelect: () => {
      if (settingActions[focusedIndex]) {
        settingActions[focusedIndex]();
      }
    },
    onBack: () => {
      navigation.goBack();
    },
  });

  const itemLayouts = React.useRef<
    Record<number, {y: number; height: number}>
  >({});
  const scrollViewHeight = React.useRef<number>(0);

  const scrollToFocused = React.useCallback((index: number) => {
    const layout = itemLayouts.current[index];
    if (layout && scrollViewRef.current) {
      const viewH = scrollViewHeight.current || 600;
      const targetY = Math.max(0, layout.y - (viewH - layout.height) / 2);
      scrollViewRef.current.scrollTo({y: targetY, animated: true});
    }
  }, []);

  React.useEffect(() => {
    if (isGamepadActive || Platform.isTV) {
      scrollToFocused(focusedIndex);
    }
  }, [focusedIndex, isGamepadActive, scrollToFocused]);

  React.useEffect(() => {
    log.info('settings page show');
  }, [navigation]);

  let itemIndexCounter = 0;
  const renderItem = (
    title: string,
    description: string | undefined,
    onPress: () => void,
    key?: any,
    last?: boolean,
  ) => {
    const index = itemIndexCounter++;
    const isFocused =
      (isGamepadActive || Platform.isTV) && focusedIndex === index;
    return (
      <View
        key={key ?? index}
        onLayout={e => {
          const l = e.nativeEvent.layout;
          itemLayouts.current[index] = {y: l.y, height: l.height};
          if (focusedIndex === index && (isGamepadActive || Platform.isTV)) {
            scrollToFocused(index);
          }
        }}>
        <SettingRow
          title={title}
          description={description}
          isFocused={isFocused}
          last={last}
          onPress={onPress}
        />
      </View>
    );
  };

  const renderGroup = (items: any[], lastIsLast = true) =>
    items.map((meta, idx) =>
      renderItem(
        meta.title,
        meta.description,
        () => handleItemPress(meta.name),
        meta.name || idx,
        lastIsLast && idx === items.length - 1,
      ),
    );

  const renderCard = (children: React.ReactNode) => (
    <SurfaceCard style={styles.group}>{children}</SurfaceCard>
  );

  return (
    <AnomalyScreen>
      <Spinner loading={loading} text={t('Loading...')} />

      <ScrollView
        ref={scrollViewRef}
        removeClippedSubviews={false}
        onLayout={e => {
          scrollViewHeight.current = e.nativeEvent.layout.height;
        }}
        contentContainerStyle={{
          paddingBottom: isGamepadActive || Platform.isTV ? 160 : 40,
        }}>
        <SectionHeader
          title="Appearance"
          hint="Pick an accent. The app switches immediately."
        />
        <ThemePicker selectedId={themeId} onSelect={handleSelectTheme} />

        <SectionHeader title="Language" />
        {renderCard(renderGroup(localeSetting))}

        <SectionHeader title="Streaming" hint="Video quality and decoding." />
        {renderCard(renderGroup(streaming))}

        <SectionHeader title="Controls" hint="Physical controller behaviour." />
        {renderCard(
          <>
            {renderGroup(controls)}
            {renderItem(
              t('GamepadTestTitle'),
              t('GamepadTestDescription'),
              () => navigation.navigate('GamepadTest'),
              'gamepad_test',
              true,
            )}
          </>,
        )}

        <SectionHeader
          title="On-screen controls"
          hint="Virtual gamepad shown over the stream."
        />
        {renderCard(renderGroup(virtualControls))}

        <SectionHeader title="Audio" />
        {renderCard(renderGroup(audioSettings))}

        <SectionHeader title="Console" />
        {renderCard(renderGroup(consoleSettings))}

        <SectionHeader title="App" />
        {renderCard(
          <>
            {renderGroup(appSettings, false)}
            {renderItem(
              t('About'),
              'Version, credits and licenses',
              () => navigation.navigate('About'),
              'about',
              true,
            )}
          </>,
        )}

        <SectionHeader title="Data and account" />
        {renderCard(
          <>
            {renderItem(
              t('Clear Cache'),
              t('Clear cache data but keep your sign-in'),
              () => handleClearCache(),
              'clear_cache',
              !isAuthed,
            )}
            {isAuthed &&
              renderItem(
                t('Logout'),
                user ? `${t('Current user')}: ${user}` : undefined,
                () => handleItemPress('logout'),
                'logout',
                true,
              )}
          </>,
        )}

        <View style={styles.version}>
          <Text style={[styles.versionText, {color: palette.textMuted}]}>
            Anomaly Xbox {pkg.version}
          </Text>
          <Text style={[styles.versionText, {color: palette.textMuted}]}>
            Based on XStreaming · AGPL-3.0
          </Text>
        </View>
      </ScrollView>

      <GamepadFooterHints
        visible={isGamepadActive || Platform.isTV}
        hints={[
          {button: 'A', label: t('Select')},
          {button: 'B', label: t('Back')},
        ]}
      />
    </AnomalyScreen>
  );
}

const styles = StyleSheet.create({
  group: {
    marginHorizontal: 16,
    paddingVertical: 4,
  },
  version: {
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    paddingTop: 4,
  },
});

export default SettingsScreen;
