import React from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Platform,
  ScrollView,
  Dimensions,
  NativeModules,
  StatusBar,
  ToastAndroid,
  BackHandler,
  Image,
  Pressable,
} from 'react-native';
import {Button, Text, Portal, Modal, Card} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import RNRestart from 'react-native-restart';
import ConsoleCard from '../anomaly/ConsoleCard';
import LaunchAnimation from '../anomaly/LaunchAnimation';
import {AnomalyScreen, SectionHeader, SurfaceCard} from '../anomaly/ui';
import {useAnomalyTheme} from '../anomaly/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GamepadFooterHints, {
  GamepadHintItem,
} from '../components/GamepadFooterHints';
import {enableSystemRotationSuggestions} from '../utils/orientation';
import {getSettings, saveSettings} from '../store/settingStore';

import Authentication from '../Authentication';
import MsalAuthentication from '../MsalAuthentication';
import WebApi from '../web';
import {
  useGamepadNavigation,
  useGamepadActiveState,
} from '../utils/useGamepadNavigation';

import {useSelector, useDispatch} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import {useTranslation} from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import {debugFactory} from '../utils/debug';
import XcloudApi from '../xCloud';
import {
  saveConsolesData,
  getConsolesData,
  isConsolesDataValid,
} from '../store/consolesStore';
import MsalAuth from '../components/MsalAuth';
import SessionReportModal from '../components/SessionReportModal';
import Spinner from '../components/Spinner';

const log = debugFactory('HomeScreen');

const {UsbRumbleManager, FullScreenManager} = NativeModules;

const MSAL = 'msal';

function HomeScreen({navigation, route}) {
  const {t} = useTranslation();
  const palette = useAnomalyTheme();
  const [loading, setLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('');
  const [_, setXalUrl] = React.useState('');
  const [consoles, setConsoles] = React.useState<any[]>(() => {
    const cacheData = getConsolesData();
    if (
      cacheData &&
      isConsolesDataValid(cacheData) &&
      Array.isArray(cacheData.consoles)
    ) {
      return cacheData.consoles;
    }
    return [];
  });
  const [isConnected, setIsConnected] = React.useState(true);
  const [currentConsoleId, setCurrentConsoleId] = React.useState('');
  const [showUsbWarnModal, setShowUsbWarnShowModal] = React.useState(false);
  const [showLogin, setShowLogin] = React.useState(false);
  const [showMsalLogin, setShowMsalLogin] = React.useState(false);
  const [showMsal, setShowMsal] = React.useState(false);
  const [msalBtnLoading, setMsalBtnLoading] = React.useState(false);
  const [msalData, setMsalData] = React.useState(null);
  const [launch, setLaunch] = React.useState<{
    visible: boolean;
    routeName?: string;
    params?: any;
    label?: string;
  }>({visible: false});

  // Session report modal state
  const [sessionReport, setSessionReport] = React.useState<any>(null);

  React.useEffect(() => {
    if (route?.params?.sessionReport) {
      const currentSettings = getSettings();
      const isShowReport =
        String(currentSettings.show_session_report) === 'true';
      if (isShowReport) {
        setSessionReport(route.params.sessionReport);
      }
    }
  }, [route?.params?.sessionReport]);

  const handleDismissReport = React.useCallback(() => {
    setSessionReport(null);
    navigation.setParams({sessionReport: undefined});
  }, [navigation]);

  const handleDoneReport = React.useCallback(
    (dontShowAgain: boolean) => {
      if (dontShowAgain) {
        const currentSettings = getSettings();
        saveSettings({...currentSettings, show_session_report: false});
      }
      setSessionReport(null);
      navigation.setParams({sessionReport: undefined});
    },
    [navigation],
  );

  const authentication = useSelector((state: any) => state.authentication);
  const _authentication = React.useRef(authentication);

  const redirect = useSelector((state: any) => state.redirect);
  const _redirect = React.useRef(redirect);

  const isLogined = useSelector((state: any) => state.isLogined);
  const _isLogined = React.useRef(isLogined);

  const webToken = useSelector((state: any) => state.webToken);
  const webTokenRef = React.useRef(null);

  const _xHomeApiRef = React.useRef<any>(null);

  const dispatch = useDispatch();

  const isFocused = useIsFocused();
  const _isFocused = React.useRef(isFocused);
  React.useEffect(() => {
    _isFocused.current = isFocused;
    if (isFocused) {
      enableSystemRotationSuggestions();
    }
  }, [isFocused]);



  // 1. One-time mount initialization (listeners, non-blocking checks)
  React.useEffect(() => {
    log.info('Page loaded.');
    SplashScreen.hide();

    const updateLayout = () => {
      // Layout is a single column now; nothing to recompute.
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);

    const unsubscribeNet = NetInfo.addEventListener((state: any) => {
      setIsConnected(state.isConnected);
    });

    // Defer heavy synchronous native calls so they don't block the initial render frame
    const timer = setTimeout(() => {
      try {
        const _settings = getSettings();
        const webviewVersion = FullScreenManager?.getWebViewVersion?.();
        const deviceInfos = FullScreenManager?.getDeviceInfos?.();
        if (webviewVersion && deviceInfos) {
          const verArr = webviewVersion.split('.');
          const mainVer = parseInt(verArr[0], 10);
          if (deviceInfos.androidVer < 12 && mainVer < 91) {
            _settings.render_engine = 'native';
            saveSettings(_settings);
          }
        }
      } catch (err) {
        log.warn('Device info check error:', err);
      }
    }, 500);

    return () => {
      subscription?.remove();
      unsubscribeNet();
      clearTimeout(timer);
    };
  }, []);

  // 2. Authentication & Consoles Synchronization
  React.useEffect(() => {
    if (!isConnected) {
      Alert.alert(
        t('Warning'),
        t('Currently no network connection, please connect and try again'),
        [
          {
            text: t('Confirm'),
            style: 'default',
            onPress: () => {},
          },
        ],
      );
      return;
    }

    const _settings = getSettings();

    const authenticationProgress = (stage: string) => {
      setLoadingText(t(stage));
      if (stage === 'Completing login...') {
        setLoading(true);
        setShowLogin(false);
        setShowMsalLogin(false);
        setShowMsal(false);
      }
    };

    // Auth completed callback
    const authenticationCompleted = async (
      _streamingTokens: any,
      _webToken: any,
    ) => {
      log.info('Authentication completed');
      webTokenRef.current = _webToken;
      dispatch({
        type: 'SET_STREAMING_TOKEN',
        payload: _streamingTokens,
      });
      dispatch({
        type: 'SET_WEB_TOKEN',
        payload: _webToken,
      });
      dispatch({
        type: 'SET_LOGIN',
        payload: true,
      });
      _isLogined.current = true;
      setShowLogin(false);
      setShowMsalLogin(false);
      setShowMsal(false);

      const webApi = new WebApi(_webToken);

      try {
        authenticationProgress('Fetching consoles...');
        const _xHomeApi = new XcloudApi(
          _streamingTokens.xHomeToken.getDefaultRegion().baseUri,
          _streamingTokens.xHomeToken.data.gsToken,
          'home',
          () => {},
        );
        _xHomeApiRef.current = _xHomeApi;

        let _consoles: any = await _xHomeApi.getConsoles();

        if (!_consoles || !_consoles.length) {
          _consoles = await webApi.getConsoles();
        }

        if (_consoles && _consoles.length > 0) {
          setConsoles(_consoles);
          saveConsolesData({
            consoles: _consoles,
          });
        }
      } catch (e: any) {
        log.error('Fetch consoles error:', e);
      } finally {
        setLoading(false);
      }
    };

    // Auth failed callback
    const authenticationFailed = (msg: any, rollback = false) => {
      setLoading(false);
      if (rollback) {
        Alert.alert(t('Error'), t('XalAuthFailDesc') + msg, [
          {
            text: t('Confirm'),
            style: 'default',
            onPress: () => {
              _authentication.current = new MsalAuthentication(
                authenticationCompleted,
                authenticationFailed,
                authenticationProgress,
              );
              dispatch({
                type: 'SET_AUTHENTICATION',
                payload: _authentication.current,
              });
              setShowLogin(false);
              setShowMsalLogin(true);
              setShowMsal(false);
            },
          },
        ]);
      } else {
        Alert.alert(t('Error'), t('AuthFailDesc') + msg, [
          {
            text: t('Confirm'),
            style: 'default',
            onPress: () => {
              RNRestart.restart();
            },
          },
        ]);
      }
    };

    if (!_authentication.current) {
      log.info('Authentication initial.');

      _authentication.current = new Authentication(
        authenticationCompleted,
        authenticationFailed,
        authenticationProgress,
      );
      _authentication.current._tokenStore.load();

      if (
        _settings.use_msal_login ||
        _authentication.current._tokenStore.getAuthenticationMethod() === MSAL
      ) {
        log.info('Using MSAL authentication method.');
        _authentication.current = new MsalAuthentication(
          authenticationCompleted,
          authenticationFailed,
          authenticationProgress,
        );
      }
      dispatch({
        type: 'SET_AUTHENTICATION',
        payload: _authentication.current,
      });
    }

    if (route.params?.xalUrl) {
      if (!_isLogined.current) {
        log.info('HomeScreen receive xalUrl:', route.params?.xalUrl);
        setXalUrl(route.params.xalUrl);
        setLoading(true);
        setLoadingText(t('Completing login...'));
        _authentication.current.startAuthflow(
          _redirect.current,
          route.params.xalUrl,
        );
      }
    } else if (route.params?.needRefresh && webTokenRef.current) {
      if (_xHomeApiRef.current) {
        const webApi = new WebApi(webTokenRef.current);
        _xHomeApiRef.current.getConsoles().then((_consoles: any) => {
          if (!_consoles.length) {
            webApi.getConsoles().then((_consolesV1: any) => {
              if (_consolesV1.length) {
                setConsoles(_consolesV1);
                saveConsolesData({consoles: _consolesV1});
              }
            });
          } else {
            setConsoles(_consoles);
            saveConsolesData({consoles: _consoles});
          }
        });
      }
    } else if (!_isLogined.current && _isFocused.current) {
      // If we already have cached consoles displayed, refresh silently without freezing UI
      const hasCachedConsoles = consoles.length > 0;
      if (!hasCachedConsoles) {
        setLoading(true);
        setLoadingText(t('Checking login status...'));
      }

      _authentication.current
        .checkAuthentication()
        .then((isAuth: boolean) => {
          if (!isAuth) {
            if (_settings.use_msal_login) {
              setLoading(false);
              setShowLogin(false);
              setShowMsalLogin(true);
              setShowMsal(false);
            } else {
              _authentication.current._xal
                .getRedirectUri()
                .then((redirectObj: any) => {
                  setLoading(false);
                  log.info('Redirect:', redirectObj);
                  _redirect.current = redirectObj;
                  dispatch({
                    type: 'SET_REDIRECT',
                    payload: redirectObj,
                  });
                  setShowLogin(true);
                  setShowMsalLogin(false);
                  setShowMsal(false);
                })
                .catch(error => {
                  authenticationFailed(
                    '[getRedirectUri()] Failed to prepare login:' +
                      (error?.message || String(error)),
                    true,
                  );
                });
            }
          }
        })
        .catch((e: any) => {
          authenticationFailed(
            '[checkAuthentication()] Login check failed:' +
              (e?.message || String(e)),
            true,
          );
        });
    }
  }, [route.params?.xalUrl, route.params?.needRefresh, isConnected, isFocused]);

  const handlePoweronAndStream = async sessionId => {
    setLoading(true);
    setLoadingText(t('Loading...'));
    const webApi = new WebApi(webToken);
    try {
      const powerOnRes = await webApi.powerOn(sessionId);
      log.info('powerOn:', powerOnRes);

      let _consoles = await _xHomeApiRef.current.getConsoles();

      if (!_consoles.length) {
        _consoles = await webApi.getConsoles();
      }

      if (_consoles.length > 0) {
        setConsoles(_consoles);
      }

      setLoading(false);

      handleStartStream(sessionId);
    } catch (e) {
      setLoading(false);

      handleStartStream(sessionId);
    }
  };

  const handlePower = async (sessionId, off = false) => {
    setLoading(true);
    setLoadingText(t('Loading...'));
    const webApi = new WebApi(webToken);
    try {
      if (off) {
        const powerOnRes = await webApi.powerOff(sessionId);
        log.info('powerOff:', powerOnRes);
        ToastAndroid.show(t('PoweredOffSentText'), ToastAndroid.SHORT);
      } else {
        const powerOnRes = await webApi.powerOn(sessionId);
        log.info('powerOn:', powerOnRes);
        ToastAndroid.show(t('PoweredOnSentText'), ToastAndroid.SHORT);
      }

      let _consoles = await _xHomeApiRef.current.getConsoles();

      if (!_consoles.length) {
        _consoles = await webApi.getConsoles();
      }

      if (_consoles.length > 0) {
        setConsoles(_consoles);
      }

      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const handleRefreshConsoles = async () => {
    setLoading(true);
    setLoadingText(t('Loading...'));

    try {
      const webApi = new WebApi(webToken);
      let _consoles: any = [];

      if (_xHomeApiRef.current) {
        _consoles = await _xHomeApiRef.current.getConsoles();
      }

      if (!_consoles.length) {
        _consoles = await webApi.getConsoles();
      }

      if (_consoles.length > 0) {
        setConsoles(_consoles);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartStream = async sessionId => {
    const settings = getSettings();
    const hasValidUsbDevice = await UsbRumbleManager.getHasValidUsbDevice();
    const isUsbMode = settings.bind_usb_device && hasValidUsbDevice;

    setCurrentConsoleId(sessionId);
    if (isUsbMode && !Platform.isTV) {
      setShowUsbWarnShowModal(true);
    } else {
      handleNavigateStream(sessionId);
    }
  };

  const handleNavigateStream = async sessionId => {
    const settings = getSettings();
    const hasValidUsbDevice = await UsbRumbleManager.getHasValidUsbDevice();
    const usbController = await UsbRumbleManager.getUsbController();
    const isUsbMode = settings.bind_usb_device && hasValidUsbDevice;

    const webviewVersion = FullScreenManager.getWebViewVersion();
    const deviceInfos = FullScreenManager.getDeviceInfos();

    let isLagecy = false;
    if (webviewVersion) {
      const verArr = webviewVersion.split('.');
      const mainVer = verArr[0];

      // webview version is below 91
      if (deviceInfos.androidVer < 12 && mainVer < 91) {
        isLagecy = true;
      }
    }

    let routeName = 'Stream';
    if (settings.render_engine === 'native') {
      routeName = settings.native_portrait_mode
        ? 'NativePortraitStream'
        : 'NativeStream';
    } else if (settings.render_engine === 'nano') {
      routeName = 'NanoStream';
    }

    // Lagecy user force to native stream
    if (isLagecy && routeName === 'Stream') {
      routeName = settings.native_portrait_mode
        ? 'NativePortraitStream'
        : 'NativeStream';
    }

    setLaunch({
      visible: true,
      routeName,
      label: t('Connecting to your Xbox'),
      params: {
        sessionId,
        settings,
        isUsbMode,
        usbController,
      },
    });
  };

  // Focus navigation state for gamepad / TV remote
  const [isGamepadActive, setIsGamepadActive] = useGamepadActiveState();
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);

  useGamepadNavigation({
    enabled:
      isFocused &&
      !loading &&
      !showLogin &&
      !showMsalLogin &&
      !showMsal &&
      !showUsbWarnModal &&
      !sessionReport,
    onDown: () => {
      if (focusedIndex < consoles.length - 1) {
        setFocusedIndex(prev => prev + 1);
      }
    },
    onUp: () => {
      if (focusedIndex > 0) {
        setFocusedIndex(prev => prev - 1);
      }
    },
    onSelect: () => {
      const item: any = consoles[focusedIndex];
      if (item) {
        handleStartStream(item.serverId);
      }
    },
    onActionX: () => {
      const item: any = consoles[focusedIndex];
      if (item) {
        handlePoweronAndStream(item.serverId);
      }
    },
    onBack: () => {
      BackHandler.exitApp();
    },
  });

  // Focus navigation state for login buttons (when not logged in)
  const [focusedLoginBtn, setFocusedLoginBtn] = React.useState<
    'login' | 'settings'
  >('login');

  useGamepadNavigation({
    enabled:
      isFocused &&
      !loading &&
      (showLogin || showMsalLogin) &&
      !showMsal &&
      !showUsbWarnModal &&
      !sessionReport,
    priority: 5,
    onUp: () => {
      setFocusedLoginBtn('login');
    },
    onDown: () => {
      setFocusedLoginBtn('settings');
    },
    onSelect: () => {
      if (focusedLoginBtn === 'login') {
        if (showLogin) {
          handleLogin();
        } else if (showMsalLogin) {
          handleMsalLogin();
        }
      } else {
        navigation.navigate('Settings');
      }
    },
    onBack: () => {
      BackHandler.exitApp();
    },
  });

  useGamepadNavigation({
    enabled: isFocused && showUsbWarnModal,
    priority: 10,
    onSelect: () => {
      setShowUsbWarnShowModal(false);
      handleNavigateStream(currentConsoleId);
    },
    onBack: () => {
      setShowUsbWarnShowModal(false);
    },
  });

  const gamepadHints: GamepadHintItem[] = React.useMemo(() => {
    return [
      {button: 'A', label: t('Select')},
      {button: 'B', label: t('Exit')},
    ];
  }, [t]);

  // Warn: xboxOne controller must press Nexus button first to active button
  const renderUsbWarningModal = () => {
    if (!showUsbWarnModal) {
      return null;
    }
    return (
      <Portal>
        <Modal
          visible={showUsbWarnModal}
          onDismiss={() => {
            setShowUsbWarnShowModal(false);
          }}
          contentContainerStyle={{marginLeft: '4%', marginRight: '4%'}}>
          <Card>
            <Card.Content>
              <Text>
                TIPS1:{' '}
                {t(
                  'It has been detected that you are using the wired connection mode with the Overwrite Android driver. If the USB connection is disconnected during the game, please exit the game and reconnect the controller; otherwise, the controller buttons will become unresponsive',
                )}
              </Text>
              <Text>
                TIPS2:{' '}
                {t(
                  'If you are using an Xbox One/S/X controller and encounter unresponsive buttons when entering the game, please press the home button on the controller first',
                )}
              </Text>

              <Button
                mode="contained"
                style={styles.actionButtonFocused}
                onPress={() => {
                  setShowUsbWarnShowModal(false);
                  handleNavigateStream(currentConsoleId);
                }}>
                {t('Confirm')}
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  };

  const handleLogin = () => {
    if (_redirect.current && _redirect.current.sisuAuth) {
      navigation.navigate('Login', {
        authUrl: _redirect.current.sisuAuth.MsaOauthRedirect,
      });
    }
  };

  const handleMsalLogin = () => {
    setMsalBtnLoading(true);
    _authentication.current
      .getMsalDeviceCode()
      .then(data => {
        log.info('MSAL device code response:', data);
        _authentication.current.doPollForDeviceCodeAuth(data.device_code);
        setMsalData(data);
        setShowMsalLogin(false);
        setShowMsal(true);
        setMsalBtnLoading(false);
      })
      .catch(e => {
        log.error('MSAL device code error:', e);
        setMsalBtnLoading(false);
        Alert.alert(
          t('Error'),
          'MSAL device code error: ' + (e?.message || String(e)),
          [
            {
              text: t('Confirm'),
              style: 'default',
            },
          ],
        );
      });
  };

  const renderSignIn = (isMsal: boolean) => {
    const isLoginFocused =
      (isGamepadActive || Platform.isTV) && focusedLoginBtn === 'login';

    return (
      <SurfaceCard style={styles.signInCard} accentBorder={isLoginFocused}>
        <Image
          source={require('../assets/anomaly-logo.png')}
          style={styles.signInLogo}
          resizeMode="contain"
        />
        <Text style={[styles.signInTitle, {color: palette.text}]}>
          Sign in to Xbox
        </Text>
        <Text style={[styles.signInText, {color: palette.textMuted}]}>
          Use the Microsoft account that owns your console. Credentials go to
          Microsoft, never to this app.
        </Text>
        <Pressable
          onPress={isMsal ? handleMsalLogin : handleLogin}
          disabled={isMsal && msalBtnLoading}
          style={({pressed}) => [
            styles.primaryButton,
            {backgroundColor: palette.primary},
            pressed && {opacity: 0.85},
          ]}>
          <Text style={styles.primaryButtonText}>
            {isMsal && msalBtnLoading
              ? t('Loading...')
              : isMsal
              ? t('AuthLogin')
              : t('Login')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={({pressed}) => [
            styles.secondaryButton,
            pressed && {opacity: 0.7},
          ]}>
          <Text style={[styles.secondaryButtonText, {color: palette.textMuted}]}>
            {t('Settings')}
          </Text>
        </Pressable>
      </SurfaceCard>
    );
  };

  const renderContent = () => {
    if (
      loading &&
      consoles.length === 0 &&
      !showLogin &&
      !showMsalLogin &&
      !showMsal
    ) {
      return null;
    }
    if (showLogin) {
      return <View style={styles.centerContainer}>{renderSignIn(false)}</View>;
    } else if (showMsalLogin) {
      return <View style={styles.centerContainer}>{renderSignIn(true)}</View>;
    } else if (showMsal) {
      return (
        <View style={styles.centerContainer}>
          <MsalAuth
            data={msalData}
            onCancel={() => {
              setShowMsal(false);
              setShowMsalLogin(true);
            }}
          />
        </View>
      );
    } else {
      return (
        <View
          style={[
            styles.container,
            {paddingTop: (StatusBar.currentHeight || 24) + 6},
          ]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              (isGamepadActive || Platform.isTV) && {paddingBottom: 64},
            ]}
            onTouchStart={() => {
              if (!Platform.isTV) setIsGamepadActive(false);
            }}>
            <View style={styles.hero}>
              <Image
                source={require('../assets/anomaly-logo.png')}
                style={styles.heroLogo}
                resizeMode="contain"
              />
              <View style={styles.heroText}>
                <Text style={[styles.heroTitle, {color: palette.text}]}>
                  Anomaly
                </Text>
                <Text style={[styles.heroSubtitle, {color: palette.textMuted}]}>
                  Xbox remote play
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                onPress={() => navigation.navigate('Settings')}
                style={styles.settingsButton}>
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={24}
                  color={palette.text}
                />
              </Pressable>
            </View>

            <SectionHeader
              title={t('Consoles')}
              hint={
                consoles.length > 0
                  ? 'Tap a console to start remote play.'
                  : undefined
              }
            />

            {consoles.length > 0 ? (
              <View style={styles.consoleList}>
                {consoles.map((item: any, index: number) => (
                  <ConsoleCard
                    key={item.serverId || index}
                    consoleItem={item}
                    isFocused={
                      (isGamepadActive || Platform.isTV) &&
                      focusedIndex === index
                    }
                    onStream={() => handleStartStream(item.serverId)}
                    onPowerOn={() => handlePower(item.serverId)}
                    onPowerOff={() => handlePower(item.serverId, true)}
                  />
                ))}

                <Pressable
                  onPress={handleRefreshConsoles}
                  style={({pressed}) => [
                    styles.refreshRow,
                    pressed && {opacity: 0.7},
                  ]}>
                  <MaterialCommunityIcons
                    name="refresh"
                    size={18}
                    color={palette.primary}
                  />
                  <Text style={[styles.refreshText, {color: palette.primary}]}>
                    {t('Refresh')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <SurfaceCard style={styles.emptyCard}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: `${palette.primary}1A`,
                      borderColor: `${palette.primary}66`,
                    },
                  ]}>
                  <MaterialCommunityIcons
                    name="microsoft-xbox"
                    size={30}
                    color={palette.primary}
                  />
                </View>
                <Text style={[styles.emptyTitle, {color: palette.text}]}>
                  No consoles found
                </Text>
                <Text style={[styles.emptyText, {color: palette.textMuted}]}>
                  {t('NoConsoles')}
                </Text>
                <Pressable
                  onPress={handleRefreshConsoles}
                  style={({pressed}) => [
                    styles.primaryButton,
                    {backgroundColor: palette.primary},
                    pressed && {opacity: 0.85},
                  ]}>
                  <Text style={styles.primaryButtonText}>{t('Refresh')}</Text>
                </Pressable>
              </SurfaceCard>
            )}

            {!isConnected && (
              <Text style={[styles.offlineText, {color: palette.textMuted}]}>
                No network connection.
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }
  };

  return (
    <AnomalyScreen>
      <View
        style={styles.root}
        onTouchStart={() => {
          if (!Platform.isTV) setIsGamepadActive(false);
        }}>
        <Spinner loading={loading} text={loadingText} />

        {showUsbWarnModal && renderUsbWarningModal()}

        {renderContent()}

        {sessionReport && (
          <SessionReportModal
            visible={true}
            report={sessionReport}
            onDismiss={handleDismissReport}
            onDone={handleDoneReport}
          />
        )}

        <GamepadFooterHints
          visible={isGamepadActive || Platform.isTV}
          hints={gamepadHints}
        />
      </View>

      <LaunchAnimation
        visible={launch.visible}
        label={launch.label}
        onFinished={() => {
          const pending = launch;
          setLaunch({visible: false});
          if (pending.routeName) {
            navigation.navigate({
              name: pending.routeName,
              params: pending.params,
            });
          }
        }}
      />
    </AnomalyScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  signInCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 24,
  },
  signInLogo: {
    width: 72,
    height: 72,
    marginBottom: 16,
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  signInText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
    minWidth: 190,
  },
  primaryButtonText: {
    color: '#0A0A0F',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  heroLogo: {
    width: 42,
    height: 42,
  },
  heroText: {
    flex: 1,
    marginLeft: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  consoleList: {
    paddingHorizontal: 16,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  refreshText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    marginHorizontal: 16,
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  offlineText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
  },
  actionButtonFocused: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
  },
  spinnerTextStyle: {
    textAlign: 'center',
  },
});

export default HomeScreen;
