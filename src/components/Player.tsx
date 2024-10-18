import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface PlayerProps {
  token: string;
  currentMood: string;
}

const Player: React.FC<PlayerProps> = ({ token, currentMood }) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState<Spotify.Track | null>(null);

  useEffect(() => {
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
        playMoodBasedTrack(device_id);
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

      player.connect();
    };
  }, [token]);

  useEffect(() => {
    if (player) {
      player.getCurrentState().then(state => {
        if (state) {
          playMoodBasedTrack(state.device.id);
        }
      });
    }
  }, [currentMood, player]);

  const playMoodBasedTrack = async (device_id: string) => {
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
          seed_genres: moodToGenre[currentMood],
          limit: 1
        }
      });

      const track = response.data.tracks[0];

      if (track) {
        await axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
          uris: [track.uri]
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error playing mood-based track:', error);
    }
  };

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
        <button onClick={() => player?.previousTrack()} className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
          <SkipBack />
        </button>
        <button onClick={() => player?.togglePlay()} className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
          {is_paused ? <Play /> : <Pause />}
        </button>
        <button onClick={() => player?.nextTrack()} className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
          <SkipForward />
        </button>
      </div>
    </div>
  );
};

export default Player;