import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAnomalyTheme} from './theme';
import {Divider} from './ui';

type Props = {
  title: string;
  description?: string;
  value?: string;
  isFocused?: boolean;
  onPress: () => void;
  last?: boolean;
};

const SettingRow: React.FC<Props> = ({
  title,
  description,
  value,
  isFocused,
  onPress,
  last,
}) => {
  const palette = useAnomalyTheme();
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({pressed}) => [
          styles.row,
          isFocused && {
            backgroundColor: `${palette.primary}14`,
            borderColor: palette.primary,
          },
          pressed && {opacity: 0.75},
        ]}>
        <View style={styles.textWrap}>
          <Text
            style={[
              styles.title,
              {color: isFocused ? palette.primary : palette.text},
            ]}>
            {title}
          </Text>
          {!!description && (
            <Text
              style={[styles.description, {color: palette.textMuted}]}
              numberOfLines={3}>
              {description}
            </Text>
          )}
        </View>
        {!!value && (
          <Text
            style={[styles.value, {color: palette.textMuted}]}
            numberOfLines={1}>
            {value}
          </Text>
        )}
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={palette.textMuted}
        />
      </Pressable>
      {!last && <Divider />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  textWrap: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },
  value: {
    fontSize: 12,
    maxWidth: 120,
    textAlign: 'right',
  },
});

export default SettingRow;
