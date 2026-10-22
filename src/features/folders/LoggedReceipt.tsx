import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TornPaper, color, fonts } from '@/theme';
import type { DrawnSidequest, QuestFolder } from '@/types';
import { Photo } from './Photo';
import { partyLabel } from './format';
import { Image } from 'expo-image';
import { useSidequestStore } from '@/stores/sidequestStore';
import { moodLabel } from './viewer/NoteSheet';

/** A saved log, rendered from its persisted content without changing original photos. */
export function LoggedReceipt({ folder, quest, onPhoto }: { folder: QuestFolder; quest?: DrawnSidequest; onPhoto: (index: number) => void }) {
  const profile = useSidequestStore(s => s.prefs);
  const ref = folder.id.replace(/[^a-z0-9]/gi, '').slice(-10).toUpperCase();
  const date = quest?.completedAt ?? folder.createdAt;
  const rows = [
    ['PLACE', quest?.placeName ?? folder.subtitle],
    ['CITY', quest?.cityLabel],
    ['PARTY', quest ? partyLabel(quest.partySize) : undefined],
    ['RARITY', quest?.rarity],
    ['MOOD', moodLabel(folder.mood)],
    ['RATING', folder.rating ? `${folder.rating} / 5` : undefined],
  ].filter((row) => row[1]);
  return <TornPaper dimensional seed={folder.id} contentStyle={styles.paper}>
    <Text style={styles.brand}>SIDEQUEST</Text>
    <Text style={styles.center}>A LITTLE ADVENTURE, KEPT.</Text>
    <View style={styles.rule} />
    <View style={styles.row}>
      <Text style={styles.small}>{new Date(date).toLocaleDateString('en-US', {month:'short',day:'2-digit'}).toUpperCase()} / {new Date(date).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}</Text>
      <Text style={styles.small}>NO. {ref}</Text>
    </View>
    <View style={styles.byline}>
      {profile.avatarUri && <Image source={{uri:profile.avatarUri}} contentFit="cover" style={{width:26,height:26,borderRadius:13,filter:'grayscale(100%)'}} />}
      <Text style={styles.author}>{(profile.displayName || 'You').toUpperCase()}{quest?.cityLabel ? ` / ${quest.cityLabel.toUpperCase()}` : ''}</Text>
    </View>
    <View style={styles.rule} />
    <Text accessibilityRole="header" style={styles.title}>{folder.title}</Text>
    {folder.photos.map((photo, i) => <View key={photo.id} style={styles.photoBlock}>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Open original photo ${i + 1}`} onPress={() => onPhoto(i)}>
        <Photo uri={photo.uri} radius={0} contentFit="contain" style={{width:'100%',aspectRatio: photo.width && photo.height ? photo.width / photo.height : 1, filter:'grayscale(100%)'}} />
      </Pressable>
      <Text style={styles.photoLabel}>MOMENT {String(i + 1).padStart(2,'0')} / {String(folder.photos.length).padStart(2,'0')}</Text>
    </View>)}
    {quest?.storyHook && <Text style={styles.copy}>{quest.storyHook}</Text>}
    <View style={styles.rule} />
    {rows.map(([key, value]) => <View key={key} style={styles.row}><Text style={styles.small}>{key}</Text><Text style={[styles.small, styles.value]}>{value}</Text></View>)}
    {folder.note && <Text style={styles.note}>“{folder.note}”</Text>}
    <View style={styles.rule} />
    <View style={styles.row}><Text style={styles.total}>MEMORIES KEPT</Text><Text style={styles.total}>{String(folder.photos.length).padStart(2,'0')}</Text></View>
    <View style={styles.row}><Text style={styles.small}>STATUS</Text><Text style={styles.small}>{quest?.status === 'completed' ? 'COMPLETED' : 'SAVED'}</Text></View>
    <Text style={styles.center}>THANKS FOR TAKING THE DETOUR.</Text>
    <View accessible={false} accessibilityElementsHidden style={styles.barcode}>{Array.from({length:44},(_,i)=><View key={i} style={{width:1+(i*7+ref.charCodeAt(i%ref.length))%3,height:26,backgroundColor:color.ink,marginRight:2}} />)}</View>
  </TornPaper>;
}
const styles = StyleSheet.create({
 paper:{paddingHorizontal:16,paddingTop:22,paddingBottom:14,gap:6},
 brand:{fontFamily:fonts.monoBold,fontSize:26,letterSpacing:-1,textAlign:'center'},
 center:{fontFamily:fonts.mono,fontSize:9,textAlign:'center',letterSpacing:0.4},
 byline:{flexDirection:'row',alignItems:'center',gap:8},author:{fontFamily:fonts.monoBold,fontSize:10,flex:1},
 row:{flexDirection:'row',justifyContent:'space-between',gap:12},
 small:{fontFamily:fonts.mono,fontSize:10,lineHeight:16},
 value:{flex:1,textAlign:'right',textTransform:'uppercase'},
 rule:{borderTopWidth:1,borderStyle:'dashed',borderColor:color.ink3,marginVertical:4},
 title:{fontFamily:fonts.monoBold,fontSize:20,lineHeight:25,marginVertical:4},
 copy:{fontFamily:fonts.mono,fontSize:11,lineHeight:18},
 note:{fontFamily:fonts.serifItalic,fontSize:18,lineHeight:22,marginTop:8,marginBottom:4},
 photoBlock:{marginVertical:6,gap:6},photoLabel:{fontFamily:fonts.mono,fontSize:9,textAlign:'center',letterSpacing:0.4},
 total:{fontFamily:fonts.monoBold,fontSize:13},
 barcode:{flexDirection:'row',justifyContent:'center',overflow:'hidden',marginTop:10},
});
