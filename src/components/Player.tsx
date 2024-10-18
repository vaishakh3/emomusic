import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, SkipForward, SkipBack, AlertCircle } from 'lucide-react';

interface PlayerProps {
  token: string;
  currentMood: string;
}

const Player: React.FC<PlayerProps> = ({ token, currentMood }) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState<Spotify.Track | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No Spotify token available. Please log in.");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Mood Music Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('player_state_changed', (state) => {
        if (!state) {
          return;
        }

        setTrack(state.track_window.current_track);
        setPaused(state.paused);

        player.getCurrentState().then(state => {
          (!state) ? setActive(false) : setActive(true)
        });
      });

      player.connect().then(success => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
        }
      });
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [token]);

  useEffect(() => {
    if (deviceId && currentMood) {
      playMoodBasedTrack();
    }
  }, [currentMood, deviceId]);

  const playMoodBasedTrack = async () => {
    if (!token || !deviceId) {
      setError("No Spotify token or device ID available. Please try again.");
      return;
    }

    const moodToGenre: { [key: string]: string } = {
      sad: 'acoustic,piano',
      neutral: 'pop,indie',
      happy: 'happy,feel-good',
      energetic: 'dance,electronic'
    };

    try {
      const response = await axios.get(`https://api.spotify.com/v1/recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          seed_genres: moodToGenre[currentMood] || 'pop',
          limit: 1
        }
      });

      const track = response.data.tracks[0];

      if (track) {
        await axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          uris: [track.uri]
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setError(null);
      } else {
        setError("No tracks found for the current mood.");
      }
    } catch (error) {
      console.error('Error playing mood-based track:', error);
      setError("Error playing mood-based track. Please try again.");
    }
  };

  const handlePlayPause = async () => {
    if (!player) {
      console.error('Player not initialized');
      setError("Player not initialized. Please try again.");
      return;
    }
    
    try {
      const currentState = await player.getCurrentState();
      console.log('Current player state:', currentState);
      
      if (currentState) {
        if (currentState.paused) {
          await player.resume();
          console.log('Resuming playback');
        } else {
          await player.pause();
          console.log('Pausing playback');
        }
        setPaused(!currentState.paused);
      } else {
        console.log('No current state. Starting new playback.');
        await playMoodBasedTrack();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setError("Error controlling playback. Please try again.");
    }
  };

  const handlePreviousTrack = async () => {
    if (!player) {
      setError("Player not initialized. Please try again.");
      return;
    }
    
    try {
      await player.previousTrack();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      setError("Error skipping to previous track. Please try again.");
    }
  };

  const handleNextTrack = async () => {
    if (!player) {
      setError("Player not initialized. Please try again.");
      return;
    }
    
    try {
      await player.nextTrack();
    } catch (error) {
      console.error('Error skipping to next track:', error);
      setError("Error skipping to next track. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="text-center bg-red-500 bg-opacity-20 p-4 rounded-lg">
        <AlertCircle className="mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (!is_active) {
    return (
      <div className="text-center">
        <p>Transfer your playback using your Spotify app</p>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-10 p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <img
          src={current_track?.album.images[0].url}
          className="h-20 w-20 rounded-md mr-4"
          alt="Album cover"
        />
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{current_track?.name}</h3>
          <p className="text-sm opacity-75">{current_track?.artists[0].name}</p>
        </div>
      </div>
      <div className="flex justify-center space-x-4">
        <button onClick={handlePreviousTrack} className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
          <SkipBack />
        </button>
        <button onClick={handlePlayPause} className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
          {is_paused ? <Play /> : <Pause />}
        </button>
        <button onClick={handleNextTrack} className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
          <SkipForward />
        </button>
      </div>
    </div>
  );
};

export default Player;
