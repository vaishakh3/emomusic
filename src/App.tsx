import React, { useState, useEffect } from 'react';
import MoodSelector from './components/MoodSelector';
import Player from './components/Player';
import { Music, Frown, Meh, Smile, Heart } from 'lucide-react';

const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const SPOTIFY_REDIRECT_URI = 'http://localhost:5173/callback';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<string>('');

  useEffect(() => {
    const hash = window.location.hash
      .substring(1)
      .split('&')
      .reduce((initial: { [key: string]: string }, item) => {
        const parts = item.split('=');
        initial[parts[0]] = decodeURIComponent(parts[1]);
        return initial;
      }, {});

    if (hash.access_token) {
      setToken(hash.access_token);
    }
  }, []);

  const handleLogin = () => {
    const scopes = 'streaming user-read-email user-read-private';
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${SPOTIFY_REDIRECT_URI}&scope=${encodeURIComponent(scopes)}&response_type=token&show_dialog=true`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-8 flex items-center">
        <Music className="mr-2" /> Mood Music Player
      </h1>
      {!token ? (
        <button
          onClick={handleLogin}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Login with Spotify
        </button>
      ) : (
        <>
          <MoodSelector setCurrentMood={setCurrentMood} />
          <Player token={token} currentMood={currentMood} />
        </>
      )}
    </div>
  );
}

export default App;