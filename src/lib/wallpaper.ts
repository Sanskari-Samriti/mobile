import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import { Alert, Linking } from 'react-native'

// Downloads image to gallery — user can then set as wallpaper from Gallery app
export async function setWallpaper(imageUrl: string): Promise<void> {
  try {
    // Request media library permission
    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to save the image.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      )
      return
    }

    // Download image to local cache
    const fileName = imageUrl.split('/').pop() || `wallpaper_${Date.now()}.jpg`
    const localUri = `${FileSystem.cacheDirectory}${fileName}`

    const { uri } = await FileSystem.downloadAsync(imageUrl, localUri)

    // Save to device gallery
    const asset = await MediaLibrary.createAssetAsync(uri)
    await MediaLibrary.createAlbumAsync('Sanskari Samriti', asset, false)

    Alert.alert(
      '🙏 Saved to Gallery!',
      'Image saved to "Sanskari Samriti" album.\n\nTo set as wallpaper:\n1. Open your Gallery app\n2. Find the image in "Sanskari Samriti" album\n3. Tap Menu (⋮) → Set as Wallpaper',
      [{ text: 'OK', style: 'default' }]
    )
  } catch (error) {
    console.error('Wallpaper error:', error)
    Alert.alert('Error', 'Could not save image. Please try again.')
  }
}
