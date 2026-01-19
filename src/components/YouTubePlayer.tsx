import React, { useRef, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// ============================================================================
// YOUTUBE PLAYER — STRICT PLAYBACK RULES
// ============================================================================
// Playback may ONLY start as a direct, synchronous result of a user gesture.
//
// PLAYER INITIALIZATION RULE:
// - Player must be initialized once
// - Kept mounted
// - Reused across cards when possible
// - Never mounted and played in the same frame
// - Autoplay DISABLED at all times
// - Muted playback explicitly enabled
//
// PLAYBACK SEQUENCE (STRICT):
// 1. Player is mounted and idle
// 2. User performs gesture
// 3. Player receives play command synchronously
// 4. Trailer plays
//
// FAILURE HANDLING:
// - No retry loop
// - No error UI
// - No external redirect
// - Poster remains visible
// - Failure is silent
//
// GEO/EMBED BLOCK:
// - Trailer is skipped
// - Poster remains
// - No placeholder
// - Never attempt fallback
// ============================================================================

interface YouTubePlayerProps {
  videoId: string;
  startSeconds?: number;
  endSeconds?: number;
  loop?: boolean;
  onReady?: () => void;
  onError?: () => void;
  onStateChange?: (state: number) => void;
  onPlaybackBlocked?: () => void;
}

export interface YouTubePlayerRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  isReady: () => boolean;
}

// YouTube Player States
export const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

// YouTube Error Codes that indicate geo/embed blocks
const BLOCKED_ERROR_CODES = [
  2,    // Invalid video ID
  5,    // HTML5 player error
  100,  // Video not found (often means private/deleted)
  101,  // Embedding disabled
  150,  // Embedding disabled (same as 101)
];

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(function YouTubePlayer({
  videoId,
  startSeconds = 0,
  endSeconds,
  loop = false,
  onReady,
  onError,
  onStateChange,
  onPlaybackBlocked,
}, ref) {
  const webViewRef = useRef<WebView>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const hasErrored = useRef(false);

  // Expose control methods via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      if (isPlayerReady && !hasErrored.current) {
        webViewRef.current?.injectJavaScript('window.playVideo(); true;');
      }
    },
    pause: () => {
      if (isPlayerReady) {
        webViewRef.current?.injectJavaScript('window.pauseVideo(); true;');
      }
    },
    stop: () => {
      if (isPlayerReady) {
        webViewRef.current?.injectJavaScript('window.stopVideo(); true;');
      }
    },
    isReady: () => isPlayerReady && !hasErrored.current,
  }), [isPlayerReady]);

  // Generate HTML - AUTOPLAY IS ALWAYS DISABLED
  const generateHTML = useCallback(() => {
    const playerVars = {
      autoplay: 0, // NEVER autoplay
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      fs: 0,
      iv_load_policy: 3,
      loop: loop ? 1 : 0,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      showinfo: 0,
      start: startSeconds,
      mute: 1, // Always muted
      ...(endSeconds && { end: endSeconds }),
      ...(loop && { playlist: videoId }),
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    #player { width: 100%; height: 100%; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <div id="player"></div>

  <script>
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var player;
    var playerReady = false;

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: '${videoId}',
        playerVars: ${JSON.stringify(playerVars)},
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onError': onPlayerError
        }
      });
    }

    function onPlayerReady(event) {
      playerReady = true;
      event.target.mute(); // Ensure muted
      // DO NOT auto-play - wait for explicit command
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    }

    function onPlayerStateChange(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'stateChange',
        state: event.data
      }));

      // Handle loop manually
      ${loop ? `
      if (event.data === YT.PlayerState.ENDED) {
        player.seekTo(${startSeconds});
        player.playVideo();
      }
      ` : ''}
    }

    function onPlayerError(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'error',
        error: event.data
      }));
    }

    // Commands from React Native - synchronous
    window.playVideo = function() {
      if (playerReady && player) {
        player.mute(); // Ensure muted before play
        player.playVideo();
      }
    };

    window.pauseVideo = function() {
      if (playerReady && player) player.pauseVideo();
    };

    window.stopVideo = function() {
      if (playerReady && player) player.stopVideo();
    };
  </script>
</body>
</html>
    `;
  }, [videoId, startSeconds, endSeconds, loop]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'ready':
          setIsPlayerReady(true);
          onReady?.();
          break;
        case 'stateChange':
          onStateChange?.(data.state);
          break;
        case 'error':
          hasErrored.current = true;
          // Check if this is a geo/embed block
          if (BLOCKED_ERROR_CODES.includes(data.error)) {
            onPlaybackBlocked?.();
          }
          // Silent error - no UI, no retry
          onError?.();
          break;
      }
    } catch {
      // Ignore parse errors silently
    }
  }, [onReady, onStateChange, onError, onPlaybackBlocked]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateHTML() }}
        style={styles.webView}
        onMessage={handleMessage}
        // iOS WebView configuration for inline playback
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        // Required settings
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        // Prevent navigation away - silent fail
        onShouldStartLoadWithRequest={(request) => {
          return request.url.includes('youtube.com') ||
                 request.url.includes('about:blank') ||
                 request.url.startsWith('data:');
        }}
        // Silent error handling
        onError={() => {
          hasErrored.current = true;
          onError?.();
        }}
        onHttpError={() => {
          hasErrored.current = true;
          onError?.();
        }}
        cacheEnabled={true}
        incognito={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
});
