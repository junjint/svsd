import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { color, fonts, type } from '../tokens';

type BaseProps = TextProps & {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
};

export function Display({ children, style, ...rest }: BaseProps) {
  return (
    <RNText style={[styles.display, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Title({ children, style, ...rest }: BaseProps) {
  return (
    <RNText style={[styles.title, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Subtitle({ children, style, ...rest }: BaseProps) {
  return (
    <RNText style={[styles.subtitle, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Body({ children, style, ...rest }: BaseProps) {
  return (
    <RNText style={[styles.body, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Muted({ children, style, ...rest }: BaseProps) {
  return (
    <RNText style={[styles.muted, style]} {...rest}>
      {children}
    </RNText>
  );
}

/** ALL-CAPS mono / technical label */
export function Label({ children, style, ...rest }: BaseProps) {
  return (
    <RNText style={[styles.label, style]} {...rest}>
      {children}
    </RNText>
  );
}

export function Mono({ children, style, ...rest }: BaseProps) {
  return (
    <RNText style={[styles.mono, style]} {...rest}>
      {children}
    </RNText>
  );
}

/** Script accent — one word inside a headline, sparingly */
export function Script({ children, style, ...rest }: BaseProps) {
  return (
    <RNText style={[styles.script, style]} {...rest}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  display: {
    ...type.display,
    fontFamily: fonts.sansBold,
    color: color.ink,
  },
  title: {
    ...type.title,
    fontFamily: fonts.sansBold,
    color: color.ink,
  },
  subtitle: {
    ...type.subtitle,
    fontFamily: fonts.sansSemiBold,
    color: color.ink,
  },
  body: {
    ...type.body,
    fontFamily: fonts.sans,
    color: color.inkSecondary,
  },
  muted: {
    ...type.caption,
    fontFamily: fonts.sans,
    color: color.inkTertiary,
  },
  label: {
    ...type.label,
    fontFamily: fonts.monoMedium,
    color: color.inkTertiary,
  },
  mono: {
    ...type.mono,
    fontFamily: fonts.mono,
    color: color.inkSecondary,
  },
  script: {
    ...type.script,
    fontFamily: fonts.scriptBold,
    color: color.ink,
  },
});
