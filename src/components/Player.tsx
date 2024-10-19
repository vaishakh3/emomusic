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
  const [queue, setQueue] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

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
      getMoodBasedTracks();
    }
  }, [currentMood, deviceId]);

  const getMoodBasedTracks = async () => {
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
          limit: 10
        }
      });

      const tracks = response.data.tracks;

      if (tracks && tracks.length > 0) {
        setQueue(tracks.map((track: any) => track.uri));
        setCurrentTrackIndex(0);
        playTrack(tracks[0].uri);
      } else {
        setError("No tracks found for the current mood.");
      }
    } catch (error) {
      console.error('Error getting mood-based tracks:', error);
      setError("Error getting mood-based tracks. Please try again.");
    }
  };

  const playTrack = async (uri: string) => {
    if (!token || !deviceId) {
      setError("No Spotify token or device ID available. Please try again.");
      return;
    }

    try {
      await axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        uris: [uri]
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setError(null);
    } catch (error) {
      console.error('Error playing track:', error);
      setError("Error playing track. Please try again.");
    }
  };

  const handlePlayPause = async () => {
    if (!player) {
      console.error('Player not initialized');
      setError("Player not initialized. Please try again.");
      return;
    }
    
    try {
      // Toggling play/pause; the player_state_changed listener will update the `is_paused` state.
      await player.togglePlay();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setError("Error controlling playback. Please try again.");
    }
  };

  const handlePreviousTrack = async () => {
    if (currentTrackIndex > 0) {
      const newIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(newIndex);
      await playTrack(queue[newIndex]);
    }
  };

  const handleNextTrack = async () => {
    if (currentTrackIndex < queue.length - 1) {
      const newIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(newIndex);
      await playTrack(queue[newIndex]);
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
