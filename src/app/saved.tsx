import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Bookmark, Trash2, Clock, Star, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { useGloStore, useSavedMovies, useCountry, useHapticEnabled } from '@/lib/store';
import { getMovieById } from '@/lib/movies';
import { Movie } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface SavedMovieCardProps {
  movie: Movie;
  onRemove: () => void;
  index: number;
}

function SavedMovieCard({ movie, onRemove, index }: SavedMovieCardProps) {
  const hapticEnabled = useHapticEnabled();

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleRemove = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onRemove();
  };

  const streamingService = movie.availability.find((a) => a.type === 'stream');

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify()}
      className="mb-4"
      style={{ width: CARD_WIDTH }}
    >
      <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.backgroundCard }}>
        {/* Poster */}
        <View style={{ height: CARD_WIDTH * 1.5 }}>
          <Image
            source={{ uri: movie.posterUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' }}
          />

          {/* Remove Button */}
          <Pressable
            onPress={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center active:scale-90"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <Trash2 size={16} color={COLORS.like} />
          </Pressable>

          {/* Rating */}
          <View className="absolute bottom-2 left-2 flex-row items-center">
            <Star size={12} color={COLORS.primary} fill={COLORS.primary} />
            <Text className="text-xs font-medium ml-1" style={{ color: COLORS.textPrimary }}>
              {movie.rating.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View className="p-3">
          <Text
            className="text-sm font-semibold mb-1"
            style={{ color: COLORS.textPrimary }}
            numberOfLines={2}
          >
            {movie.title}
          </Text>

          <View className="flex-row items-center mb-2">
            <Text className="text-xs" style={{ color: COLORS.textMuted }}>
              {movie.year}
            </Text>
            <View className="w-1 h-1 rounded-full mx-2" style={{ backgroundColor: COLORS.textMuted }} />
            <Clock size={10} color={COLORS.textMuted} />
            <Text className="text-xs ml-1" style={{ color: COLORS.textMuted }}>
              {formatRuntime(movie.runtime)}
            </Text>
          </View>

          {streamingService && (
            <View
              className="flex-row items-center px-2 py-1 rounded-lg self-start"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
            >
              <View
                className="w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: COLORS.available }}
              />
              <Text className="text-xs" style={{ color: COLORS.available }}>
                {streamingService.service.name}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const savedMovieIds = useSavedMovies();
  const country = useCountry();
  const unsaveMovie = useGloStore((s) => s.unsaveMovie);

  const savedMovies = useMemo(() => {
    if (!country) return [];
    return savedMovieIds
      .map((id) => getMovieById(id, country.code))
      .filter((movie): movie is Movie => movie !== null);
  }, [savedMovieIds, country]);

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4 border-b"
        style={{ paddingTop: insets.top + 12, borderBottomColor: 'rgba(255,255,255,0.1)' }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: COLORS.backgroundCard }}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
            Saved for Later
          </Text>
          <Text className="text-sm" style={{ color: COLORS.textMuted }}>
            {savedMovies.length} movie{savedMovies.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {savedMovies.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View entering={FadeInDown.springify()}>
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: COLORS.saveBg }}
            >
              <Bookmark size={36} color={COLORS.save} />
            </View>
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.delay(100).springify()}
            className="text-2xl font-bold text-center mb-2"
            style={{ color: COLORS.textPrimary }}
          >
            Nothing saved yet
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(200).springify()}
            className="text-base text-center"
            style={{ color: COLORS.textSecondary }}
          >
            Swipe up on movies to save them for later
          </Animated.Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          {savedMovies.map((movie, index) => (
            <SavedMovieCard
              key={movie.id}
              movie={movie}
              onRemove={() => unsaveMovie(movie.id)}
              index={index}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
