import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { color, fonts, type } from '../tokens';

type Props = TextProps & { children: React.ReactNode; style?: TextStyle | TextStyle[] };

export function Hero({ children, style, ...rest }: Props) {
  return (
    <RNText style={[styles.hero, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Floor({ children, style, ...rest }: Props) {
  return (
    <RNText style={[styles.floor, style]} {...rest} numberOfLines={1}>
      {children}
    </RNText>
  );
}

export function Display({ children, style, ...rest }: Props) {
  return (
    <RNText style={[styles.display, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Title({ children, style, ...rest }: Props) {
  return (
    <RNText style={[styles.title, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Body({ children, style, ...rest }: Props) {
  return (
    <RNText style={[styles.body, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Muted({ children, style, ...rest }: Props) {
  return (
    <RNText style={[styles.muted, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Label({ children, style, ...rest }: Props) {
  return (
    <RNText style={[styles.label, style]} {...rest}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...type.hero,
    fontFamily: fonts.sansBold,
    color: color.bulma,
    textAlign: 'left',
  },
  floor: {
    ...type.floor,
    fontFamily: fonts.sansBold,
    color: color.beerus,
  },
  display: {
    ...type.display,
    fontFamily: fonts.sansBold,
    color: color.bulma,
    textAlign: 'left',
  },
  title: {
    ...type.title,
    fontFamily: fonts.sansSemiBold,
    color: color.bulma,
    textAlign: 'left',
  },
  body: {
    ...type.body,
    fontFamily: fonts.sans,
    color: color.bulma,
    textAlign: 'left',
  },
  muted: {
    ...type.muted,
    fontFamily: fonts.sans,
    color: color.trunks,
    textAlign: 'left',
  },
  label: {
    ...type.label,
    fontFamily: fonts.sansMedium,
    color: color.trunks,
    textAlign: 'left',
  },
});
