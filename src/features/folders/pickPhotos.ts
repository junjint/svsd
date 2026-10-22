import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { FolderPhoto } from '@/types';

export type PickedPhoto = Omit<FolderPhoto, 'id' | 'addedAt'>;

/**
 * Pick photos from the library and keep private, location-free copies.
 *
 * Location (SPEC §4.2): every photo is decoded and re-encoded to JPEG
 * through expo-image-manipulator before it's saved. A re-encode writes
 * pixels only, so no EXIF — and no GPS — survives, whatever the source
 * format. A photo that can't be re-encoded is dropped, never saved raw.
 */
export async function pickPhotos(): Promise<{ photos: PickedPhoto[]; dropped: number } | 'denied'> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && perm.accessPrivileges !== 'limited') return 'denied';
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 20,
    orderedSelection: true,
    quality: 0.86,
    exif: false,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (res.canceled) return { photos: [], dropped: 0 };
  const photos: PickedPhoto[] = [];
  let dropped = 0;
  for (const a of res.assets) {
    const clean = await stripLocation(a.uri);
    if (!clean) {
      dropped++;
      continue;
    }
    photos.push({ uri: await keep(clean.uri), width: clean.width || undefined, height: clean.height || undefined });
  }
  return { photos, dropped };
}

/** One square photo for the profile, cleaned and kept the same way */
export async function pickAvatar(): Promise<string | null | 'denied'> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && perm.accessPrivileges !== 'limited') return 'denied';
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.86,
    exif: false,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  const asset = res.canceled ? undefined : res.assets[0];
  if (!asset) return null;
  const clean = await stripLocation(asset.uri);
  return clean ? keep(clean.uri) : null;
}

/** Decode → re-encode as JPEG: the result carries pixels and nothing else */
async function stripLocation(uri: string): Promise<{ uri: string; width: number; height: number } | null> {
  try {
    const ref = await ImageManipulator.manipulate(uri).renderAsync();
    const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.86 });
    return { uri: out.uri, width: out.width, height: out.height };
  } catch {
    return null;
  }
}

/** The picker writes to the cache, which iOS may purge; move into documents */
async function keep(uri: string): Promise<string> {
  if (Platform.OS === 'web' || !uri.startsWith('file:')) return uri;
  try {
    const dir = new Directory(Paths.document, 'folder-photos');
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
    const src = new File(uri);
    const dest = new File(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
    await src.copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

/** Remove our private copy when a photo is deleted (best effort) */
export function forgetPhoto(uri: string) {
  if (Platform.OS === 'web' || !uri.includes('folder-photos')) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    /* already gone */
  }
}

/** Camera captures use the same location-free, persistent copies as library photos. */
export async function preparePhoto(uri: string): Promise<PickedPhoto | null> {
  const clean = await stripLocation(uri);
  if (!clean) return null;
  return { uri: await keep(clean.uri), width: clean.width, height: clean.height };
}
