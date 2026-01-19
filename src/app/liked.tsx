import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark, X } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { getMovie, getStreamingOffers } from '@/lib/movies';
import { StreamingRow } from '@/components/StreamingIcon';
import { Movie } from '@/lib/types';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2;

export default function LikedScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const likedIds = useStore((s) => s.likedMovies);
  const saveMovie = useStore((s) => s.saveMovie);
  const lang = country.language;

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const movies = useMemo(() => {
    return likedIds
      .map((id) => getMovie(id, country.code))
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [likedIds, country.code]);

  const selectedProviderIds = selectedMovie
    ? getStreamingOffers(selectedMovie.id, country.code)
        .slice(0, 4)
        .map(offer => offer.providerId)
    : [];

  const handleSave = (movieId: string) => {
    saveMovie(movieId);
    if (haptic) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

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
          {lang === 'sv' ? 'Gillade' : 'Liked'}
        </Text>
      </View>

      {movies.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-center" style={{ color: COLORS.textMuted }}>
            {lang === 'sv' ? 'Inga gillade filmer' : 'No liked movies'}
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
            <Pressable
              key={movie.id}
              onPress={() => setSelectedMovie(movie)}
              style={({ pressed }) => [
                { width: CARD_SIZE, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Image
                source={{ uri: movie.posterUrl }}
                style={{ width: CARD_SIZE, height: CARD_SIZE * 1.5, borderRadius: 8 }}
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
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSave(movie.id);
                  }}
                  hitSlop={8}
                >
                  <Bookmark size={14} color={COLORS.textMuted} />
                </Pressable>
              </View>
              <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                {movie.year}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Movie detail modal */}
      <Modal
        visible={!!selectedMovie}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedMovie(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          {selectedMovie && (
            <>
              {/* Close button */}
              <Pressable
                onPress={() => setSelectedMovie(null)}
                style={{
                  position: 'absolute',
                  top: insets.top + 16,
                  right: 16,
                }}
                hitSlop={12}
              >
                <X size={28} color={COLORS.text} />
              </Pressable>

              {/* Movie poster */}
              <Image
                source={{ uri: selectedMovie.posterUrl }}
                style={{
                  width: width * 0.7,
                  height: width * 0.7 * 1.5,
                  borderRadius: 12,
                }}
                contentFit="cover"
              />

              {/* Movie info */}
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 22,
                  fontWeight: '600',
                  marginTop: 20,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {selectedMovie.title}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 16, marginTop: 4 }}>
                {selectedMovie.year}
              </Text>

              {/* Streaming providers */}
              {selectedProviderIds.length > 0 && (
                <View style={{ marginTop: 24 }}>
                  <StreamingRow
                    providerIds={selectedProviderIds}
                    maxVisible={4}
                  />
                </View>
              )}

              {/* Save button */}
              <Pressable
                onPress={() => {
                  handleSave(selectedMovie.id);
                  setSelectedMovie(null);
                }}
                style={{
                  marginTop: 32,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: 'rgba(234, 179, 8, 0.2)',
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Bookmark size={18} color="rgb(234, 179, 8)" />
                <Text style={{ color: 'rgb(234, 179, 8)' }}>
                  {lang === 'sv' ? 'Spara' : 'Save'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
