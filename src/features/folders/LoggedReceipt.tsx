import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TornPaper, color, fonts, space } from '@/theme';
import type { DrawnSidequest, QuestFolder } from '@/types';
import { Photo } from './Photo';
import { partyLabel, shortDate } from './format';
import { moodLabel } from './viewer/NoteSheet';

/** A saved log, rendered from its persisted content without changing original photos. */
export function LoggedReceipt({ folder, quest, onPhoto }: { folder: QuestFolder; quest?: DrawnSidequest; onPhoto: (index: number) => void }) {
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
  return <TornPaper seed={folder.id} contentStyle={styles.paper}>
    <Text style={styles.brand}>SIDEQUEST</Text>
    <Text style={styles.center}>A LITTLE ADVENTURE, KEPT.</Text>
    <View style={styles.band}>
      <View style={styles.row}>
        <Text style={styles.bandText}>{shortDate(date)}</Text>
        <Text style={styles.bandText}>{new Date(date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text>
      </View>
      <Text style={styles.bandText}>NO. {ref}</Text>
    </View>
    <View style={styles.rule} />
    {quest?.storyHook && <Text style={styles.copy}>{quest.storyHook}</Text>}
    <Text accessibilityRole="header" style={styles.title}>{folder.title}</Text>
    <View style={styles.rule} />
    {rows.map(([key, value]) => <View key={key} style={styles.row}><Text style={styles.small}>{key}</Text><Text style={[styles.small, styles.value]}>{value}</Text></View>)}
    {folder.photos.map((photo, i) => <View key={photo.id} style={styles.photoBlock}>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Open original photo ${i + 1}`} onPress={() => onPhoto(i)}>
        <Photo uri={photo.uri} radius={0} contentFit="contain" style={{width:'100%',aspectRatio: photo.width && photo.height ? photo.width / photo.height : 1, filter:'grayscale(1) contrast(1.25)'}} />
      </Pressable>
      <Text style={styles.photoLabel}>MOMENT {String(i + 1).padStart(2,'0')} / {String(folder.photos.length).padStart(2,'0')}</Text>
    </View>)}
    {folder.note && <><View style={styles.rule} /><Text style={styles.small}>A NOTE TO REMEMBER</Text><Text style={styles.copy}>{folder.note}</Text></>}
    <View style={styles.rule} />
    <View style={styles.row}><Text style={styles.total}>MEMORIES KEPT</Text><Text style={styles.total}>{String(folder.photos.length).padStart(2,'0')}</Text></View>
    <View style={styles.row}><Text style={styles.small}>STATUS</Text><Text style={styles.small}>{quest?.status === 'completed' ? 'COMPLETED' : 'SAVED'}</Text></View>
    <View style={styles.footer}><Text style={styles.thanks}>Thanks for taking the detour.</Text><Text style={styles.center}>KEEP THIS ONE FOR THE STORY.</Text></View>
    <View accessible={false} accessibilityElementsHidden style={styles.barcode}>{Array.from(ref + ref).map((c,i)=><View key={i} style={{width:1+c.charCodeAt(0)%3,height:36,backgroundColor:color.ink,marginRight:1+i%3}} />)}</View>
    <Text style={[styles.center,{fontSize:9}]}>{ref} · YOUR COPY</Text>
  </TornPaper>;
}
const styles = StyleSheet.create({
 paper:{paddingHorizontal:22,paddingVertical:28,gap:8},
 brand:{fontFamily:fonts.monoBold,fontSize:30,letterSpacing:-1.5,textAlign:'center'},
 center:{fontFamily:fonts.mono,fontSize:10,lineHeight:16,textAlign:'center'},
 band:{backgroundColor:color.ink,paddingVertical:12,paddingHorizontal:12,marginVertical:12,gap:6},
 bandText:{fontFamily:fonts.mono,fontSize:10,lineHeight:17,color:color.white},
 row:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},
 small:{fontFamily:fonts.mono,fontSize:10,lineHeight:17},
 value:{flex:1,textAlign:'right',textTransform:'uppercase'},
 rule:{borderTopWidth:1,borderStyle:'dashed',borderColor:color.ink3,marginVertical:12},
 title:{fontFamily:fonts.monoBold,fontSize:19,lineHeight:26,textAlign:'left',marginBottom:8},
 copy:{fontFamily:fonts.mono,fontSize:12,lineHeight:20},
 photoBlock:{marginTop:18,gap:6},photoLabel:{fontFamily:fonts.mono,fontSize:9,textAlign:'center'},
 total:{fontFamily:fonts.monoBold,fontSize:14,lineHeight:22},
 footer:{alignItems:'center',gap:8,paddingVertical:space.xl},thanks:{fontFamily:fonts.serifItalic,fontSize:20,textAlign:'center'},
 barcode:{flexDirection:'row',justifyContent:'center',overflow:'hidden',marginBottom:4},
});
