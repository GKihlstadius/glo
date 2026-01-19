import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// YouTube IFrame Player API implementation
// Fixes Error 153 by using official API with proper configuration

interface YouTubePlayerProps {
  videoId: string;
  autoplay?: boolean;
  muted?: boolean;
  startSeconds?: number;
  endSeconds?: number;
  loop?: boolean;
  onReady?: () => void;
  onError?: (error: number) => void;
  onStateChange?: (state: number) => void;
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

export function YouTubePlayer({
  videoId,
  autoplay = false,
  muted = true,
  startSeconds = 0,
  endSeconds,
  loop = false,
  onReady,
  onError,
  onStateChange,
}: YouTubePlayerProps) {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);

  // Generate the HTML with YouTube IFrame Player API
  const generateHTML = useCallback(() => {
    const playerVars = {
      autoplay: autoplay ? 1 : 0,
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
    // Load YouTube IFrame Player API
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var player;
    var playerReady = false;

    // Called by YouTube API when ready
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
      ${muted ? 'event.target.mute();' : ''}
      ${autoplay ? 'event.target.playVideo();' : ''}

      // Notify React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ready'
      }));
    }

    function onPlayerStateChange(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'stateChange',
        state: event.data
      }));

      // Handle loop manually if needed
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

    // Commands from React Native
    window.playVideo = function() {
      if (playerReady && player) player.playVideo();
    };

    window.pauseVideo = function() {
      if (playerReady && player) player.pauseVideo();
    };

    window.stopVideo = function() {
      if (playerReady && player) player.stopVideo();
    };

    window.seekTo = function(seconds) {
      if (playerReady && player) player.seekTo(seconds, true);
    };

    window.mute = function() {
      if (playerReady && player) player.mute();
    };

    window.unMute = function() {
      if (playerReady && player) player.unMute();
    };
  </script>
</body>
</html>
    `;
  }, [videoId, autoplay, muted, startSeconds, endSeconds, loop]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'ready':
          setIsReady(true);
          onReady?.();
          break;
        case 'stateChange':
          onStateChange?.(data.state);
          break;
        case 'error':
          onError?.(data.error);
          break;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [onReady, onStateChange, onError]);

  // Player control methods
  const play = useCallback(() => {
    webViewRef.current?.injectJavaScript('window.playVideo(); true;');
  }, []);

  const pause = useCallback(() => {
    webViewRef.current?.injectJavaScript('window.pauseVideo(); true;');
  }, []);

  const stop = useCallback(() => {
    webViewRef.current?.injectJavaScript('window.stopVideo(); true;');
  }, []);

  const seekTo = useCallback((seconds: number) => {
    webViewRef.current?.injectJavaScript(`window.seekTo(${seconds}); true;`);
  }, []);

  const mute = useCallback(() => {
    webViewRef.current?.injectJavaScript('window.mute(); true;');
  }, []);

  const unMute = useCallback(() => {
    webViewRef.current?.injectJavaScript('window.unMute(); true;');
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateHTML() }}
        style={styles.webView}
        onMessage={handleMessage}
        // CRITICAL: iOS WebView configuration to prevent Error 153
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        // Additional required settings
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        // Prevent navigation away
        onShouldStartLoadWithRequest={(request) => {
          // Only allow YouTube embeds
          return request.url.includes('youtube.com') ||
                 request.url.includes('about:blank') ||
                 request.url.startsWith('data:');
        }}
        // Performance optimizations
        cacheEnabled={true}
        incognito={false}
      />
    </View>
  );
}

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
