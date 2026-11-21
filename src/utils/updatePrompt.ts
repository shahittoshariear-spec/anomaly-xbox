import {Alert, DeviceEventEmitter, Linking, NativeModules} from 'react-native';
import updater from './updater';

export const SHOW_UPDATE_PROGRESS_EVENT = 'SHOW_UPDATE_PROGRESS';

/** Check GitHub for a newer release and offer to download and install it. */
export const checkForUpdates = async (t: (key: string) => string) => {
  const infos: any = await updater();

  if (!infos) {
    Alert.alert(
      t('Software update'),
      t('Could not check for updates. Check your connection.'),
    );
    return;
  }

  const {latestVer, version, updateText, apkUrl, apkName, pageUrl, url} = infos;
  const updateUrl = pageUrl || url;
  const buttons: any[] = [
    {text: t('Cancel'), style: 'cancel'},
    {
      text: t('Manual download'),
      onPress: () => {
        Linking.openURL(updateUrl).catch(() => {});
      },
    },
  ];

  if (apkUrl) {
    buttons.push({
      text: t('Auto install'),
      onPress: () => {
        if (!NativeModules.UpdateManager?.downloadAndInstall) {
          Alert.alert(t('Warning'), t('AutoInstallFailed'));
          return;
        }
        DeviceEventEmitter.emit(SHOW_UPDATE_PROGRESS_EVENT);
        NativeModules.UpdateManager.downloadAndInstall(apkUrl, apkName).catch(
          (e: any) => {
            Alert.alert(
              t('Warning'),
              e?.code === 'INSTALL_PERMISSION_REQUIRED'
                ? t('InstallPermissionRequired')
                : t('AutoInstallFailed'),
              [
                {
                  text: t('Manual download'),
                  onPress: () => {
                    Linking.openURL(updateUrl).catch(() => {});
                  },
                },
                {text: t('Confirm'), style: 'cancel'},
              ],
            );
          },
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
};
