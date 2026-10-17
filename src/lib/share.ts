import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Share, Alert } from 'react-native'

// Share image natively (opens WhatsApp, Instagram, etc.)
export async function shareImage(imageUrl: string, title?: string): Promise<void> {
  try {
    const fileName = imageUrl.split('/').pop() || 'image.jpg'
    const localUri = `${FileSystem.cacheDirectory}${fileName}`

    // Download to local cache first
    const { uri } = await FileSystem.downloadAsync(imageUrl, localUri)

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: title || 'Share this blessed image 🙏',
      })
    } else {
      Alert.alert('Sharing not available on this device')
    }
  } catch (error) {
    console.error('Share error:', error)
    Alert.alert('Error', 'Could not share image. Please try again.')
  }
}

// Share video natively
export async function shareVideo(videoUrl: string, title?: string): Promise<void> {
  try {
    const fileName = videoUrl.split('/').pop() || 'video.mp4'
    const localUri = `${FileSystem.cacheDirectory}${fileName}`

    const { uri } = await FileSystem.downloadAsync(videoUrl, localUri)

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'video/mp4',
        dialogTitle: title || 'Share this blessed video 🙏',
      })
    }
  } catch (error) {
    console.error('Share video error:', error)
    Alert.alert('Error', 'Could not share video. Please try again.')
  }
}

// Share just a text/link (lightweight)
export async function shareLink(url: string, message?: string): Promise<void> {
  await Share.share({ message: message || url, url })
}
