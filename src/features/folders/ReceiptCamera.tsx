import { useEffect, useRef, useState } from 'react';
import { AppState, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text, color, fonts } from '@/theme';
import { Photo } from './Photo';
import { PhotoLibrary } from './icons';
import { preparePhoto, type PickedPhoto } from './pickPhotos';

export function ReceiptCamera({ onClose, onLibrary, onSave }: {
  onClose: () => void;
  onLibrary: () => void;
  onSave: (photo: PickedPhoto) => Promise<void>;
}) {
  const { height } = useWindowDimensions();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions({ request: true });
  const [started, setStarted] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [ready, setReady] = useState(false);
  const [shot, setShot] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => { setActive(state === 'active'); setReady(false); });
    return () => sub.remove();
  }, []);
  const cameraActive = started && permission?.granted;
  async function start() {
    setError('');
    try {
      const result = permission?.granted ? permission : await requestPermission();
      if (result.granted) { setReady(false); setStarted(true); }
      else setError('Camera access is off. Allow it in your browser or device settings, or choose a photo below.');
    } catch { setError('No camera available. You can still choose a photo from your library.'); }
  }
  async function capture() {
    if (!ready || busy) return;
    setBusy(true); setError('');
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.86, exif: false, ...(Platform.OS === 'web' ? { isImageMirror: facing === 'front' } : {}) });
      if (!photo) throw new Error('No photo');
      setShot(photo.uri);
    } catch { setError('Could not take the photo. Please try again.'); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!shot || busy) return;
    setBusy(true); setError('');
    try {
      const photo = await preparePhoto(shot);
      if (!photo) throw new Error('Could not prepare photo');
      await onSave(photo);
      onClose();
    } catch { setError('Could not save the photo. Please try again.'); }
    finally { setBusy(false); }
  }
  const libraryButton = <Pressable accessibilityRole="button" accessibilityLabel="Choose photos from library" disabled={busy} onPress={onLibrary} style={[styles.libraryButton, busy && { opacity: 0.4 }]}><PhotoLibrary size={22} /></Pressable>;
  const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={[styles.button, disabled && {opacity:0.4}]}><Text style={styles.label}>{label}</Text></Pressable>;
  return <Modal visible animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.top}><Text style={styles.brand}>SIDEQUEST</Text>{button('Close', onClose, busy)}</View>
      <Text style={styles.caption}>PHOTO BOOTH / A MOMENT TO KEEP</Text>
      <View style={styles.rule} />
      <View style={[styles.frame, { height: Math.min(360, height * 0.4) }]}>
        {shot ? <Photo uri={shot} radius={0} contentFit="contain" style={styles.feed} /> : cameraActive && active ?
          <CameraView ref={camera} style={styles.feed} facing={facing} mirror={facing === 'front'} mode="picture" onCameraReady={() => setReady(true)} onMountError={() => { setStarted(false); setError('Camera unavailable. Check access or choose a library photo.'); }} /> :
          <View style={styles.placeholder}><Text style={styles.cross}>＋</Text><Text style={styles.light}>ONE LITTLE MOMENT.</Text><Text style={styles.light}>YOURS TO KEEP.</Text></View>}
        <View pointerEvents="none" style={styles.guide} />
      </View>
      <Text style={styles.caption}>{shot ? 'YOUR PRINT / READY TO KEEP' : 'FRAME A LITTLE ADVENTURE'}</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {shot ? <View style={styles.controls}>{button('Retake', () => { setShot(undefined); setReady(false); }, busy)}{button(busy ? 'Saving…' : 'Keep photo', () => void save(), busy)}</View> : cameraActive ?
        <View style={styles.controls}>{button('Flip', () => { setReady(false); setFacing(facing === 'back' ? 'front' : 'back'); }, busy)}<Pressable accessibilityRole="button" accessibilityLabel="Take photo" disabled={!ready || busy} onPress={() => void capture()} style={[styles.shutter, (!ready || busy) && {opacity:0.4}]}><View style={styles.shutterInner} /></Pressable>{libraryButton}</View> : <View style={styles.controls}>{button('Open camera', () => void start())}{libraryButton}</View>}
      <View style={styles.rule} />
      <Text style={styles.caption}>KEEP THIS ONE FOR THE STORY.</Text>
    </ScrollView>
  </Modal>;
}
const styles = StyleSheet.create({
  page:{flexGrow:1,backgroundColor:'#f6f3ed',padding:24,paddingTop:32,paddingBottom:28,gap:12,maxWidth:480,width:'100%',alignSelf:'center'},
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  brand:{fontFamily:fonts.monoBold,fontSize:24,letterSpacing:-1},
  caption:{fontFamily:fonts.mono,fontSize:10,textAlign:'center',color:color.ink},
  rule:{borderTopWidth:1,borderStyle:'dashed',borderColor:color.ink3},
  frame:{backgroundColor:'#191715',borderWidth:9,borderColor:color.ink,position:'relative',overflow:'hidden'},
  feed:{width:'100%',height:'100%'},
  placeholder:{flex:1,alignItems:'center',justifyContent:'center',gap:10},
  cross:{fontFamily:fonts.mono,fontSize:48,color:'#f6f3ed',marginBottom:16},
  light:{fontFamily:fonts.mono,fontSize:11,color:'#f6f3ed'},
  guide:{position:'absolute',inset:15,borderWidth:1,borderColor:'#ffffff77'},
  button:{borderWidth:1,borderColor:color.ink,paddingHorizontal:16,paddingVertical:14,alignItems:'center'},
  label:{fontFamily:fonts.monoBold,fontSize:12,color:color.ink},
  controls:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',gap:12},
  libraryButton:{width:48,height:48,borderRadius:24,borderWidth:1,borderColor:color.ink3,alignItems:'center',justifyContent:'center'},
  shutter:{width:76,height:76,borderRadius:38,borderWidth:2,borderColor:color.ink,padding:5},
  shutterInner:{flex:1,borderRadius:35,backgroundColor:color.ink},
  error:{fontFamily:fonts.mono,fontSize:12,lineHeight:18,textAlign:'center'},
});
