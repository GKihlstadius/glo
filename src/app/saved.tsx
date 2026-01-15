import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { getMovie } from '@/lib/movies';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2;

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const savedIds = useStore((s) => s.savedMovies);
  const unsave = useStore((s) => s.unsaveMovie);
  const lang = country.language;

  const movies = useMemo(() => {
    return savedIds
      .map((id) => getMovie(id, country.code))
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [savedIds, country.code]);

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={COLORS.text} />
        </Pressable>
        <Text className="text-lg font-medium ml-4" style={{ color: COLORS.text }}>
          {lang === 'sv' ? 'Sparade' : 'Saved'}
        </Text>
      </View>

      {movies.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-center" style={{ color: COLORS.textMuted }}>
            {lang === 'sv' ? 'Inga sparade filmer' : 'No saved movies'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 16,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {movies.map((movie) => (
            <View key={movie.id} style={{ width: CARD_SIZE }}>
              <Image
                source={{ uri: movie.posterUrl }}
                style={{ width: CARD_SIZE, height: CARD_SIZE * 1.5, borderRadius: 2 }}
                contentFit="cover"
              />
              <View className="flex-row items-center justify-between mt-2">
                <Text
                  className="text-sm flex-1"
                  style={{ color: COLORS.text }}
                  numberOfLines={1}
                >
                  {movie.title}
                </Text>
                <Pressable onPress={() => unsave(movie.id)} hitSlop={8}>
                  <Trash2 size={14} color={COLORS.textMuted} />
                </Pressable>
              </View>
              <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                {movie.year}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
