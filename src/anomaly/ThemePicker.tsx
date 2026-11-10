import React from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {PALETTES, accentAlpha} from './palette';
import {useAnomalyTheme} from './theme';

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

/**
 * Horizontal palette picker. Tapping a swatch applies the palette immediately;
 * the short accent wash gives the change a visible transition rather than an
 * abrupt swap.
 */
const ThemePicker: React.FC<Props> = ({selectedId, onSelect}) => {
  const palette = useAnomalyTheme();
  const wash = React.useRef(new Animated.Value(0)).current;

  const choose = (id: string) => {
    if (id === selectedId) {
      return;
    }
    onSelect(id);
    wash.setValue(1);
    Animated.timing(wash, {
      toValue: 0,
      duration: 320,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: palette.surface, borderColor: palette.border},
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {backgroundColor: palette.primary, opacity: wash.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.16],
          })},
        ]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {PALETTES.map(item => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              onPress={() => choose(item.id)}
              style={({pressed}) => [
                styles.chip,
                {
                  borderColor: selected ? item.primary : palette.border,
                  backgroundColor: selected
                    ? accentAlpha(item, 0.14)
                    : palette.surfaceRaised,
                },
                pressed && {opacity: 0.8},
              ]}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: item.primary,
                    shadowColor: item.primary,
                  },
                ]}
              />
              <Text
                style={[
                  styles.chipLabel,
                  {color: selected ? item.primary : palette.textMuted},
                ]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.preview, {borderColor: palette.border}]}>
        <View style={styles.previewHeader}>
          <View
            style={[styles.previewDot, {backgroundColor: palette.primary}]}
          />
          <Text style={[styles.previewTitle, {color: palette.text}]}>
            Living room Xbox
          </Text>
          <View
            style={[
              styles.previewPill,
              {
                borderColor: palette.primary,
                backgroundColor: accentAlpha(palette, 0.16),
              },
            ]}>
            <Text style={[styles.previewPillText, {color: palette.primary}]}>
              Standby
            </Text>
          </View>
        </View>
        <View style={[styles.previewButton, {backgroundColor: palette.primary}]}>
          <Text style={styles.previewButtonText}>Remote play</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  chips: {
    paddingHorizontal: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  preview: {
    marginTop: 14,
    marginHorizontal: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  previewTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  previewPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  previewButton: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default ThemePicker;
