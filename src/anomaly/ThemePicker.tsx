import React from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {PALETTES, accentAlpha, readableOn} from './palette';
import {useAnomalyTheme} from './theme';

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

/**
 * Palette picker in the style of an iOS colour list: a grid of round swatches
 * with a ring and check mark on the current choice. Tapping applies the palette
 * immediately, with a short accent wash as the transition.
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
      duration: 340,
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
          {
            backgroundColor: palette.primary,
            opacity: wash.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.14],
            }),
          },
        ]}
      />

      <View style={styles.grid}>
        {PALETTES.map(item => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              onPress={() => choose(item.id)}
              style={({pressed}) => [
                styles.item,
                pressed && {opacity: 0.7},
              ]}>
              <View
                style={[
                  styles.ring,
                  {borderColor: selected ? item.primary : 'transparent'},
                ]}>
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: item.primary,
                      shadowColor: item.primary,
                    },
                  ]}>
                  {selected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={readableOn(item.primary)}
                    />
                  )}
                </View>
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: selected ? palette.text : palette.textMuted,
                    fontWeight: selected ? '600' : '400',
                  },
                ]}
                numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
              {backgroundColor: accentAlpha(palette, 0.14)},
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
    marginHorizontal: 20,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
  },
  item: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  ring: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    marginTop: 7,
    fontSize: 11.5,
    letterSpacing: 0.1,
  },
  preview: {
    marginTop: 8,
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 8,
  },
  previewTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  previewPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewPillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  previewButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default ThemePicker;
