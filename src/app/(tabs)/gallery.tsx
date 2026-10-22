import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { PanResponder, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Decor, Paper, Text, TornPaper, color, fonts, space } from '@/theme';
import { useScreen, useTabBarSpace } from '@/ui';

const RECEIPTS = [
  { image: 'photo-1472396961693-142e6e269027', imageLabel: 'Mountain forest', avatar: 'photo-1494790108377-be9c29b29330', name: 'Maya', city: 'ANN ARBOR', date: 'OCT 18 / 04:32 PM', title: 'Take the long way home.', place: 'A riverside trail', type: 'NATURE', time: '18 MIN', task: 'Find a quiet spot by the water. Stay for five minutes without checking your phone.', note: 'I nearly took my usual shortcut home. Instead, I sat by the water and watched a heron stand perfectly still while I kept reaching for my phone. A cyclist stopped to ask what I was looking at. We waited together until it finally caught something. My five minutes became eighteen.' },
  { image: 'photo-1507842217343-583bb7270b66', imageLabel: 'Shelves of books', avatar: 'photo-1500648767791-00dcc994a43e', name: 'Theo', city: 'CHICAGO', date: 'OCT 19 / 11:08 AM', title: 'Judge a book by its first page.', place: 'A neighborhood bookshop', type: 'FOCUS', time: '12 MIN', task: 'Pick a book you would normally walk past. Read the first page before looking at the cover.', note: 'The first sentence made me laugh out loud in a very quiet bookshop. The person shelving books looked over and said, “Wait until page twelve.” I read it standing in the aisle, coat still on. Bought the book, missed my train, started chapter two on the platform.' },
  { image: 'photo-1509440159596-0249088772ff', imageLabel: 'Fresh bakery bread', avatar: 'photo-1534528741775-53994a69daeb', name: 'Jules', city: 'PORTLAND', date: 'OCT 20 / 09:16 AM', title: 'Order the unfamiliar.', place: 'A corner bakery', type: 'SNACK', time: '22 MIN', task: 'Ask for the pastry the staff would choose. Take it somewhere with a view.', note: 'Asked the baker what she would pick. She handed me the last cardamom bun and an extra napkin: “You’ll need it.” Ate it on a sunny bench, dropping sugar all over my coat. She was right about the napkin.' },
  { image: 'photo-1547592180-85f173990554', imageLabel: 'A colorful lunch', avatar: 'photo-1506794778202-cad84cf45f1d', name: 'Sam', city: 'NEW YORK', date: 'OCT 21 / 12:45 PM', title: 'Make lunch a little adventure.', place: 'A neighborhood lunch counter', type: 'MEAL', time: '35 MIN', task: 'Try a dish you have never ordered. Write down three words that describe it.', note: 'Crispy. Tangy. Gone. Asked what the sauce was and left with the name scribbled on my receipt. Coming back next week.' },
];

export default function GalleryScreen() {
  const { width } = useScreen();
  const bottom = useTabBarSpace();
  const rail = useRef<ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(1);
  const receipts = useRef<(ComponentRef<typeof ScrollView> | null)[]>([]);
  useEffect(() => {
    receipts.current[index]?.scrollTo({ y: 0, animated: false });
  }, [index]);
  const [height, setHeight] = useState(460);
  const ticketWidth = Math.min(width * 0.74, 320);
  const step = ticketWidth + 14;
  const go = (next: number) => { setIndex(next); rail.current?.scrollTo({ x: next * step, animated: true }); };
  const positioned = useRef(false);
  const dragStart = useRef(0);
  /* eslint-disable react-hooks/refs -- PanResponder stores callbacks; refs are only read during gestures. */
  const drag = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => Platform.OS === 'web' && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => { dragStart.current = index; },
    onPanResponderMove: (_, g) => rail.current?.scrollTo({ x: dragStart.current * step - g.dx, animated: false }),
    onPanResponderRelease: (_, g) => go(Math.max(0, Math.min(RECEIPTS.length - 1, dragStart.current + (Math.abs(g.dx) > 35 ? (g.dx < 0 ? 1 : -1) : 0)))),
    onPanResponderTerminationRequest: () => false,
  });
  /* eslint-enable react-hooks/refs */
  return <Paper>
    {/* the same header as the Library: big title, an italic count, a line of specs, chrome in the corner */}
    <View style={styles.header}>
      <View style={{ flex: 1, gap: space.sm }}>
        <View style={styles.titleRow}>
          <Text variant="display" style={styles.bigTitle} accessibilityRole="header">Gallery</Text>
          <Text variant="accent" style={styles.titleCount}>({RECEIPTS.length})</Text>
        </View>
        <Text variant="label" numberOfLines={1} style={styles.specs}>Sidequest stories · Sample collection</Text>
      </View>
      <Decor name="swallow" width={78} style={styles.crest} />
    </View>
    <View style={styles.stage} onLayout={e => setHeight(e.nativeEvent.layout.height)}>
      <ScrollView {...drag.panHandlers} ref={rail} onContentSizeChange={() => { if (!positioned.current) { positioned.current = true; rail.current?.scrollTo({ x: step, animated: false }); } }} horizontal directionalLockEnabled snapToInterval={step} decelerationRate="fast" disableIntervalMomentum showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: (width - ticketWidth) / 2, gap: 14, paddingTop: 26 }} onScroll={e => setIndex(Math.max(0, Math.min(RECEIPTS.length - 1, Math.round(e.nativeEvent.contentOffset.x / step))))} scrollEventThrottle={32}>
        {RECEIPTS.map((q, i) => <View key={q.name} style={{ width: ticketWidth, height: Math.max(280, height - 26), opacity: index === i ? 1 : 0.65, transform: [{ scale: index === i ? 1 : 0.96 }] }}>
          <ScrollView ref={node => { receipts.current[i] = node; }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottom + 25, paddingHorizontal: 10 }}>
            <TornPaper dimensional seed={q.name} edges="both" contentStyle={[styles.ticket, { minHeight: Math.max(280, height - 48) }]}>
              <Text style={styles.brand}>SIDEQUEST</Text>
              <Text style={styles.micro}>A LITTLE ADVENTURE, KEPT.</Text>
              <View style={styles.rule} />
              <View style={styles.row}><Text style={styles.small}>{q.date}</Text><Text style={styles.small}>NO. 00{i + 1}</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Image source={{ uri: `https://images.unsplash.com/${q.avatar}?w=80&h=80&q=80&auto=format&fit=crop&crop=faces` }} accessibilityLabel={`${q.name}'s sample profile photo`} contentFit="cover" style={{ width: 26, height: 26, borderRadius: 13, filter: 'grayscale(100%)' }} />
                <Text style={[styles.byline, { flex: 1 }]}>{q.name.toUpperCase()} / {q.city}</Text>
              </View>
              <View style={styles.rule} />
              <Text style={styles.title}>{q.title}</Text>
              <Image source={{ uri: `https://images.unsplash.com/${q.image}?w=600&q=80&auto=format&fit=crop` }} accessibilityLabel={q.imageLabel} contentFit="cover" style={{ width: '100%', height: 150, filter: 'grayscale(100%)', marginVertical: 6 }} />
              <Text style={styles.micro}>MOMENT 01 / 01</Text>
              <Text style={styles.copy}>{q.task}</Text>
              <View style={styles.rule} />
              <View style={styles.row}><Text style={styles.small}>PLACE</Text><Text style={[styles.small, styles.value]}>{q.place}</Text></View>
              <View style={styles.row}><Text style={styles.small}>{q.type}</Text><Text style={styles.small}>{q.time}</Text></View>
              <Text style={styles.note}>“{q.note}”</Text>
              <View style={styles.rule} />
              <View style={styles.row}><Text style={styles.total}>MEMORIES KEPT</Text><Text style={styles.total}>01</Text></View>
              <Text style={styles.micro}>THANKS FOR TAKING THE DETOUR.</Text>
              <View style={styles.barcode} accessible={false}>{Array.from({length:44}, (_, n) => <View key={n} style={{height:26,width:1 + (n * 7 + i) % 3,marginRight:2,backgroundColor:color.ink}} />)}</View>
            </TornPaper>
          </ScrollView>
        </View>)}
      </ScrollView>
      <LinearGradient pointerEvents="none" colors={['#dededb','#a4a5a3','#e1e1de','#777975']} locations={[0,0.45,0.84,1]} style={styles.metal}>
        <Image source={require('../../../assets/printer/brushed.webp')} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.slot} />
        <View style={[styles.screw,{left:14}]} /><View style={[styles.screw,{right:14}]} />
      </LinearGradient>

    </View>
  </Paper>;
}
const styles = StyleSheet.create({
  header:{flexDirection:'row',alignItems:'flex-start',paddingHorizontal:space.xl,paddingTop:space.md,paddingBottom:space.xl},crest:{marginTop:2,marginRight:-6,transform:[{rotate:'-8deg'}]},titleRow:{flexDirection:'row',alignItems:'flex-start',gap:4},bigTitle:{fontSize:46,lineHeight:46,letterSpacing:-2.2},titleCount:{fontSize:26,lineHeight:28,marginTop:-2},specs:{marginTop:space.sm},
  stage:{flex:1},metal:{position:'absolute',top:0,left:0,right:0,height:36,borderTopWidth:1,borderColor:'#f4f4f0',boxShadow:'0 5px 8px rgba(0,0,0,0.24)',overflow:'hidden'},slot:{position:'absolute',bottom:1,height:3,left:0,right:0,backgroundColor:'#434440'},screw:{position:'absolute',top:12,width:8,height:8,borderRadius:4,borderWidth:1,borderColor:'#777',backgroundColor:'#c7c7c3'},
  ticket:{paddingHorizontal:16,paddingTop:22,paddingBottom:14,gap:6},brand:{fontFamily:fonts.monoBold,fontSize:26,textAlign:'center',letterSpacing:-1},micro:{fontFamily:fonts.mono,fontSize:9,textAlign:'center',letterSpacing:0.4},small:{fontFamily:fonts.mono,fontSize:10,lineHeight:16},byline:{fontFamily:fonts.monoBold,fontSize:10},rule:{borderTopWidth:1,borderStyle:'dashed',borderColor:color.ink3,marginVertical:4},row:{flexDirection:'row',justifyContent:'space-between',gap:12},value:{flex:1,textAlign:'right',textTransform:'uppercase'},title:{fontFamily:fonts.monoBold,fontSize:20,lineHeight:25,marginVertical:4},copy:{fontFamily:fonts.mono,fontSize:11,lineHeight:18},note:{fontFamily:fonts.serifItalic,fontSize:18,lineHeight:22,marginTop:8,marginBottom:4},total:{fontFamily:fonts.monoBold,fontSize:13},barcode:{flexDirection:'row',justifyContent:'center',overflow:'hidden',marginTop:10},
});
