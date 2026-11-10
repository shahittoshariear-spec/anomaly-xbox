import React from 'react';
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  Linking,
  NativeModules,
  StyleSheet,
  View,
  Easing,
} from 'react-native';
import {
  Button,
  Dialog,
  PaperProvider,
  MD3DarkTheme,
  Portal,
  ProgressBar,
  Text,
  adaptNavigationTheme,
} from 'react-native-paper';

import {
  createStackNavigator,
  HeaderStyleInterpolators,
} from '@react-navigation/stack';
import {
  createNavigationContainerRef,
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

import merge from 'deepmerge';
import {Provider} from 'react-redux';
import store from './store';
import {
  getSettings,
  saveSettings,
  SETTINGS_CHANGED_EVENT,
  Settings,
} from './store/settingStore';
import {saveServerData} from './store/serverStore';

import customDarkTheme from './theme/index.dark';
import {AnomalyThemeProvider, useAnomalyTheme} from './anomaly/theme';
import {resolvePalette} from './anomaly/palette';

import HomeScreen from './pages/Home';
import LoginScreen from './pages/Login';
import StreamScreen from './pages/Stream';
import NativeStreamScreen from './pages/NativeStream';
import NativePortraitStreamScreen from './pages/NativePortraitStream';
import NanoStreamScreen from './pages/NanoStream';
import SettingsScreen from './pages/Settings';
import SettingDetailScreen from './pages/SettingDetail';
import AboutScreen from './pages/About';
import VirtualGamepadSettingsScreen from './pages/VirtualGamepadSettings';
import CustomGamepadScreen from './pages/CustomGamepad';
import GamepadTestScreen from './pages/GamepadTest';
import updater from './utils/updater';
import getServer from './utils/get-server';
import {
  applyPrimaryColorToPaperTheme,
} from './utils/themeColor';

import {useTranslation} from 'react-i18next';

import {SystemBars} from 'react-native-edge-to-edge';

import './i18n';

const RootStack = createStackNavigator();
const navigationRef = createNavigationContainerRef<any>();

const {UsbRumbleManager, FullScreenManager, UpdateManager} = NativeModules;
const UPDATE_PROGRESS_EVENT = 'UpdateManagerProgress';

const formatUpdateBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) {
    return '0 MB';
  }

  const mb = bytes / 1024 / 1024;
  return `${mb >= 10 ? mb.toFixed(1) : mb.toFixed(2)} MB`;
};

const {DarkTheme} = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const withPageBackground = (ScreenComponent: any) => {
  const WrappedScreen = (props: any) => {
    const palette = useAnomalyTheme();

    return (
      <View
        style={[styles.backgroundScreen, {backgroundColor: palette.background}]}>
        <View style={styles.backgroundContent}>
          <ScreenComponent {...props} />
        </View>
      </View>
    );
  };

  WrappedScreen.displayName = `WithPageBackground(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;
  return WrappedScreen;
};

const withSolidPageBackground = (ScreenComponent: any) => {
  const WrappedScreen = (props: any) => {
    const palette = useAnomalyTheme();

    return (
      <View
        style={[styles.backgroundScreen, {backgroundColor: palette.background}]}>
        <View style={styles.backgroundContent}>
          <ScreenComponent {...props} />
        </View>
      </View>
    );
  };

  WrappedScreen.displayName = `WithSolidPageBackground(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;
  return WrappedScreen;
};

const forSettingsSlide = ({
  current,
  inverted,
  layouts: {screen},
}: any) => ({
  cardStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 0.25, 1],
      outputRange: [0, 0.85, 1],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateX: Animated.multiply(
          current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [screen.width, 0],
            extrapolate: 'clamp',
          }),
          inverted,
        ),
      },
    ],
  },
});

const settingsTransitionSpec = {
  open: {
    animation: 'timing' as const,
    config: {
      duration: 280,
      easing: Easing.bezier(0.2, 0, 0, 1),
    },
  },
  close: {
    animation: 'timing' as const,
    config: {
      duration: 240,
      easing: Easing.bezier(0.4, 0, 1, 1),
    },
  },
};

const HomeBackgroundScreen = withPageBackground(HomeScreen);
const LoginBackgroundScreen = withPageBackground(LoginScreen);
const SettingsBackgroundScreen = withSolidPageBackground(SettingsScreen);
const SettingDetailBackgroundScreen = withPageBackground(SettingDetailScreen);
const AboutBackgroundScreen = withPageBackground(AboutScreen);
const VirtualGamepadSettingsBackgroundScreen = withPageBackground(
  VirtualGamepadSettingsScreen,
);
const GamepadTestBackgroundScreen = withPageBackground(GamepadTestScreen);

function App() {
  const {t} = useTranslation();
  const [settings, setSettings] = React.useState<Settings>(() => getSettings());
  const deviceInfos = FullScreenManager.getDeviceInfos();
  const updateCheckedRef = React.useRef(false);
  const [updateProgressVisible, setUpdateProgressVisible] =
    React.useState(false);
  const [updateProgress, setUpdateProgress] = React.useState({
    downloadedBytes: 0,
    progress: 0,
    status: 'idle',
    totalBytes: 0,
  });

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      SETTINGS_CHANGED_EVENT,
      (nextSettings: Settings) => {
        if (nextSettings) {
          setSettings({...nextSettings});
        }
      },
    );
    return () => {
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      UPDATE_PROGRESS_EVENT,
      (event: any) => {
        setUpdateProgress({
          downloadedBytes: Number(event?.downloadedBytes) || 0,
          progress: Number(event?.progress) || 0,
          status: event?.status || 'downloading',
          totalBytes: Number(event?.totalBytes) || 0,
        });
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    if (!settings.check_update || updateCheckedRef.current) {
      return;
    }

    updateCheckedRef.current = true;
    updater().then((infos: any) => {
      if (infos) {
        const {latestVer, version, updateText, pageUrl, apkUrl, apkName, url} =
          infos;
        const updateUrl = pageUrl || url;
        const buttons: any[] = [
          {
            text: t('Cancel'),
            style: 'default',
            onPress: () => {},
          },
          {
            text: t('Manual download'),
            style: 'default',
            onPress: () => {
              Linking.openURL(updateUrl).catch(_ => {});
            },
          },
        ];

        if (apkUrl) {
          buttons.push({
            text: t('Auto install'),
            style: 'default',
            onPress: () => {
              const showAutoInstallError = (e?: any) => {
                setUpdateProgressVisible(false);
                const message =
                  e?.code === 'INSTALL_PERMISSION_REQUIRED'
                    ? t('InstallPermissionRequired')
                    : t('AutoInstallFailed');
                Alert.alert(t('Warning'), message, [
                  {
                    text: t('Manual download'),
                    style: 'default',
                    onPress: () => {
                      Linking.openURL(updateUrl).catch(_ => {});
                    },
                  },
                  {
                    text: t('Confirm'),
                    style: 'cancel',
                  },
                ]);
              };

              if (!UpdateManager?.downloadAndInstall) {
                showAutoInstallError();
                return;
              }

              setUpdateProgress({
                downloadedBytes: 0,
                progress: 0,
                status: 'downloading',
                totalBytes: 0,
              });
              setUpdateProgressVisible(true);
              UpdateManager.downloadAndInstall(apkUrl, apkName).catch(
                showAutoInstallError,
              );
            },
          });
        }

        Alert.alert(
          t('Update Warning'),
          t(
            `Check new version ${latestVer}, current version is ${version}. \n ${updateText}`,
          ),
          buttons,
        );
      }
    });
  }, [settings.check_update, t]);

  React.useEffect(() => {
    // Apply decoder/audio flags at startup as well as on change. Previously they
    // were only pushed when settings were saved, so the low-latency decoder did
    // not take effect until some unrelated setting was touched.
    try {
      NativeModules.AudioSettingModule?.setStereoEnabled?.(
        !!settings.enable_stereo_audio,
      );
      NativeModules.AudioSettingModule?.setLowLatencyDecoderEnabled?.(
        !!settings.native_low_latency_decoder,
      );
    } catch (error) {
      // Native module is optional during development.
    }
  }, [settings.enable_stereo_audio, settings.native_low_latency_decoder]);

  React.useEffect(() => {
    if (settings.bind_usb_device !== undefined) {
      UsbRumbleManager.setBindUsbDevice(settings.bind_usb_device);
    }
  }, [settings.bind_usb_device]);

  React.useEffect(() => {
    getServer().then((data: any) => {
      if (data && data.url && data.username && data.credential) {
        saveServerData(data);
      }
    });
  }, []);

  const palette = resolvePalette(settings.anomaly_theme);
  const paperDarkTheme = applyPrimaryColorToPaperTheme(
    {
      ...MD3DarkTheme,
      colors: {
        ...customDarkTheme.colors,
        background: palette.background,
        surface: palette.surface,
        onSurface: palette.text,
        onBackground: palette.text,
        outline: palette.border,
      },
    },
    'dark',
    palette.primary,
  );
  const CombinedDarkTheme = merge(paperDarkTheme, DarkTheme);
  CombinedDarkTheme.colors.background = palette.background;
  CombinedDarkTheme.colors.card = palette.background;
  CombinedDarkTheme.colors.primary = palette.primary;
  CombinedDarkTheme.colors.text = palette.text;
  CombinedDarkTheme.colors.border = palette.border;

  const paperTheme = paperDarkTheme;
  const navigationTheme = CombinedDarkTheme;

  if (
    deviceInfos.factor?.toLocaleUpperCase().indexOf('NINTENDO') > -1 &&
    deviceInfos.model?.toLocaleUpperCase().indexOf('SWITCHLITE') > -1
  ) {
    if (!settings.short_trigger) {
      settings.short_trigger = true;
      saveSettings(settings);
    }
  }

  const hasDownloadTotal = updateProgress.totalBytes > 0;
  const normalizedUpdateProgress = hasDownloadTotal
    ? Math.max(0, Math.min(updateProgress.progress, 1))
    : 0;
  const updateProgressPercent = Math.round(normalizedUpdateProgress * 100);
  const updateProgressText =
    updateProgress.status === 'installing' ||
    updateProgress.status === 'completed'
      ? t('Preparing installation')
      : hasDownloadTotal
      ? `${t('Downloaded')} ${updateProgressPercent}% (${formatUpdateBytes(
          updateProgress.downloadedBytes,
        )} / ${formatUpdateBytes(updateProgress.totalBytes)})`
      : `${t('Downloaded')} ${formatUpdateBytes(
          updateProgress.downloadedBytes,
        )}`;

  return (
    <AnomalyThemeProvider themeId={settings.anomaly_theme}>
      <Provider store={store}>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer ref={navigationRef} theme={navigationTheme}>
            <RootStack.Navigator
              screenOptions={{
                headerStyle: {backgroundColor: palette.background},
                headerTintColor: palette.text,
                headerTitleStyle: {fontWeight: '700'},
                headerShadowVisible: false,
                cardStyle: {backgroundColor: palette.background},
              }}>
              <RootStack.Group>
                <RootStack.Screen
                  name="Home"
                  component={HomeBackgroundScreen}
                  options={{
                    headerShown: false,
                    cardStyle: styles.transparentCard,
                  }}
                />
                <RootStack.Screen
                  name="Settings"
                  component={SettingsBackgroundScreen}
                  options={{
                    title: t('Settings'),
                    headerStyleInterpolator: HeaderStyleInterpolators.forFade,
                    cardStyleInterpolator: forSettingsSlide,
                    transitionSpec: settingsTransitionSpec,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                  }}
                />
                <RootStack.Screen
                  name="Login"
                  component={LoginBackgroundScreen}
                  options={{title: t('Login')}}
                />
                <RootStack.Screen
                  name="Stream"
                  component={StreamScreen}
                  options={{headerShown: false}}
                />
                <RootStack.Screen
                  name="NativeStream"
                  component={NativeStreamScreen}
                  options={{headerShown: false}}
                />
                <RootStack.Screen
                  name="NativePortraitStream"
                  component={NativePortraitStreamScreen}
                  options={{headerShown: false}}
                />
                <RootStack.Screen
                  name="NanoStream"
                  component={NanoStreamScreen}
                  options={{headerShown: false}}
                />
                <RootStack.Screen
                  name="CustomGamepad"
                  component={CustomGamepadScreen}
                  options={{headerShown: false}}
                />
                <RootStack.Screen
                  name="VirtualGamepadSettings"
                  component={VirtualGamepadSettingsBackgroundScreen}
                  options={{title: t('Custom')}}
                />
                <RootStack.Screen
                  name="About"
                  component={AboutBackgroundScreen}
                  options={{title: t('About')}}
                />
                <RootStack.Screen
                  name="SettingDetail"
                  component={SettingDetailBackgroundScreen}
                />
                <RootStack.Screen
                  name="GamepadTest"
                  component={GamepadTestBackgroundScreen}
                  options={{title: t('GamepadTestTitle')}}
                />
              </RootStack.Group>
            </RootStack.Navigator>
          </NavigationContainer>
          <Portal>
            <Dialog
              visible={updateProgressVisible}
              onDismiss={() => setUpdateProgressVisible(false)}>
              <Dialog.Title>{t('Update download')}</Dialog.Title>
              <Dialog.Content>
                <Text style={styles.updateProgressText}>
                  {updateProgressText}
                </Text>
                <ProgressBar
                  progress={normalizedUpdateProgress}
                  indeterminate={!hasDownloadTotal}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setUpdateProgressVisible(false)}>
                  {t('Hide')}
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </PaperProvider>
      </Provider>
      <SystemBars style="light" hidden={false} />
    </AnomalyThemeProvider>
  );
}

const styles = StyleSheet.create({
  backgroundScreen: {
    flex: 1,
  },
  backgroundContent: {
    flex: 1,
  },
  transparentCard: {
    backgroundColor: 'transparent',
  },
  updateProgressText: {
    marginBottom: 12,
  },
});

export default App;
