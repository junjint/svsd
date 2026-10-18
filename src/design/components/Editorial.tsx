import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Sticker } from './Sticker';
import { Body, Display, Label, Script, Title } from './Text';
import { border, color, space } from '../tokens';
import type { StickerId, StickerSize } from '../stickers';

type Placement = 'leading' | 'trailing' | 'between';

/**
 * Headline with optional script word + sticker punctuation.
 * Example: Sidequest ✨   or   Life's better with [script]sidequests[/script] 🌿
 */
export function EditorialHeadline({
  before,
  script,
  after,
  sticker,
  stickerPlacement = 'trailing',
  stickerSize = 'lg',
  tilt = -8,
  level = 'display',
}: {
  before?: string;
  script?: string;
  after?: string;
  sticker?: StickerId;
  stickerPlacement?: Placement;
  stickerSize?: StickerSize;
  tilt?: number;
  level?: 'display' | 'title';
}) {
  const Heading = level === 'display' ? Display : Title;
  const mark = sticker ? (
    <Sticker id={sticker} size={stickerSize} tilt={tilt} />
  ) : null;

  return (
    <View style={styles.headlineRow}>
      {stickerPlacement === 'leading' ? mark : null}
      <View style={styles.headlineText}>
        <Heading>
          {before}
          {script ? <Script>{script}</Script> : null}
          {after}
        </Heading>
      </View>
      {stickerPlacement === 'trailing' || stickerPlacement === 'between'
        ? mark
        : null}
    </View>
  );
}

/** Thin blueprint frame around content — monochrome only */
export function Frame({
  children,
  label,
  style,
}: {
  children: React.ReactNode;
  label?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.frame, style]}>
      {label ? (
        <View style={styles.frameLabel}>
          <Label>{label}</Label>
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Status / name capsule — BeReal-like thin pill, no fill color */
export function Capsule({
  children,
  selected,
}: {
  children: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <View style={[styles.capsule, selected && styles.capsuleSelected]}>
      {typeof children === 'string' ? (
        <Label style={selected ? styles.capsuleTextSelected : undefined}>
          {children}
        </Label>
      ) : (
        children
      )}
    </View>
  );
}

/**
 * Body line with a sticker nestled between clauses.
 * "A little sidequest just appeared ✨ 4 minutes away."
 */
export function InlineStickerLine({
  leading,
  sticker,
  trailing,
  size = 'sm',
}: {
  leading: string;
  sticker: StickerId;
  trailing?: string;
  size?: StickerSize;
}) {
  return (
    <View style={styles.inlineRow}>
      <Body style={styles.inlineFlex}>{leading}</Body>
      <Sticker id={sticker} size={size} tilt={-6} />
      {trailing ? <Body style={styles.inlineFlex}>{trailing}</Body> : null}
    </View>
  );
}

/** Section with mono label + optional trailing sticker */
export function SectionHeader({
  label,
  sticker,
}: {
  label: string;
  sticker?: StickerId;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Label>{label}</Label>
      {sticker ? <Sticker id={sticker} size="sm" tilt={6} /> : null}
      <View style={styles.sectionRule} />
    </View>
  );
}

/** Tiny crosshair corner — blueprint detail, optional */
export function Crosshair({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.crosshair, style]}>
      <View style={styles.crossH} />
      <View style={styles.crossV} />
    </View>
  );
}

const styles = StyleSheet.create({
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[3],
  },
  headlineText: {
    flexShrink: 1,
  },
  frame: {
    borderWidth: border.hairline,
    borderColor: color.line,
    padding: space[4],
    backgroundColor: color.bg,
    marginVertical: space[3],
  },
  frameLabel: {
    position: 'absolute',
    top: -8,
    left: space[3],
    backgroundColor: color.bg,
    paddingHorizontal: space[1],
  },
  capsule: {
    borderWidth: border.hairline,
    borderColor: color.line,
    borderRadius: 999,
    paddingHorizontal: space[3],
    paddingVertical: space[1] + 2,
    alignSelf: 'flex-start',
  },
  capsuleSelected: {
    backgroundColor: color.fillInverse,
  },
  capsuleTextSelected: {
    color: color.fillInverseText,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[1],
    marginBottom: space[2],
  },
  inlineFlex: {
    flexShrink: 1,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[6],
    marginBottom: space[3],
  },
  sectionRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.lineSubtle,
  },
  crosshair: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossH: {
    position: 'absolute',
    width: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.inkTertiary,
  },
  crossV: {
    position: 'absolute',
    width: StyleSheet.hairlineWidth,
    height: 12,
    backgroundColor: color.inkTertiary,
  },
});
