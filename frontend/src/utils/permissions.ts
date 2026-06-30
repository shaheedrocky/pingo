import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Checks and requests gallery read permissions.
 * Android uses fully native PermissionsAndroid.
 * iOS handles dialogs implicitly on CameraRoll API invocation; we catch errors if denied.
 * @returns Promise<boolean> indicating whether access can proceed.
 */
export const requestGalleryPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const sdkVersion = Platform.Version;
      // Android 13+ (API 33+) uses READ_MEDIA_IMAGES
      if (Number(sdkVersion) >= 33) {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        if (hasPermission) return true;

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Gallery Access Required',
            message: 'This app needs access to your photos to let you choose images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        if (hasPermission) return true;

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Gallery Access Required',
            message: 'This app needs access to your photos to let you choose images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } else if (Platform.OS === 'ios') {
      // Return true to proceed with call. The iOS system handles the permission popup
      // implicitly when CameraRoll.getPhotos is executed.
      return true;
    }
  } catch (error) {
    console.error('Error checking gallery permission:', error);
  }
  return false;
};
