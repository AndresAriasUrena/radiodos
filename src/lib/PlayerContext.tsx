'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PodcastEpisode, PodcastShow } from '@/types/podcast';

type PlayerType = 'radio' | 'podcast';

interface PlayerState {
  type: PlayerType;
  isPlaying: boolean;
  currentEpisode?: PodcastEpisode;
  currentShow?: PodcastShow;
  episodesList?: PodcastEpisode[];
  currentIndex?: number;
}

interface PlayerContextType {
  playerState: PlayerState;
  playRadio: () => void;
  playEpisode: (episode: PodcastEpisode, show: PodcastShow, episodes: PodcastEpisode[], index: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setIsPlaying: (playing: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    type: 'radio',
    isPlaying: false,
  });

  const playRadio = () => {
    setPlayerState({
      type: 'radio',
      isPlaying: true,
      currentEpisode: undefined,
      currentShow: undefined,
      episodesList: undefined,
      currentIndex: undefined,
    });
  };

  const playEpisode = (episode: PodcastEpisode, show: PodcastShow, episodes: PodcastEpisode[], index: number) => {
    setPlayerState({
      type: 'podcast',
      isPlaying: true,
      currentEpisode: episode,
      currentShow: show,
      episodesList: episodes,
      currentIndex: index,
    });
  };

  const togglePlay = () => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  const playNext = () => {
    if (playerState.type === 'podcast' && playerState.episodesList && playerState.currentIndex !== undefined) {
      const nextIndex = playerState.currentIndex + 1;
      if (nextIndex < playerState.episodesList.length) {
        const nextEpisode = playerState.episodesList[nextIndex];
        setPlayerState(prev => ({
          ...prev,
          currentEpisode: nextEpisode,
          currentIndex: nextIndex,
          isPlaying: true,
        }));
      }
    }
  };

  const playPrevious = () => {
    if (playerState.type === 'podcast' && playerState.episodesList && playerState.currentIndex !== undefined) {
      const prevIndex = playerState.currentIndex - 1;
      if (prevIndex >= 0) {
        const prevEpisode = playerState.episodesList[prevIndex];
        setPlayerState(prev => ({
          ...prev,
          currentEpisode: prevEpisode,
          currentIndex: prevIndex,
          isPlaying: true,
        }));
      }
    }
  };

  const setIsPlaying = (playing: boolean) => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: playing,
    }));
  };

  return (
    <PlayerContext.Provider
      value={{
        playerState,
        playRadio,
        playEpisode,
        togglePlay,
        playNext,
        playPrevious,
        setIsPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
} 