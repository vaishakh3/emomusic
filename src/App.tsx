import React, { useState, useEffect } from 'react';
import MoodSelector from './components/MoodSelector';
import Player from './components/Player';
import WebcamMoodDetector from './components/WebcamMoodDetector';
import { Music, Camera, CameraOff } from 'lucide-react';

const SPOTIFY_CLIENT_ID = '301d7c3a7c934ebcabf356746d93dc50';
const SPOTIFY_REDIRECT_URI = 'http://localhost:5173/callback';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<string>('');
  const [useWebcam, setUseWebcam] = useState<boolean>(false);

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

  const toggleWebcam = () => {
    setUseWebcam(!useWebcam);
  };

  const handleMoodDetected = () => {
    setUseWebcam(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-4xl font-bold mb-8 flex items-center">
        <Music className="mr-2" /> EmoMusic
      </h1>
      <p className="text-xl font-semibold mb-4">
              Emotion Based Music Player for Music Therapy
              <br />
      </p>
      {!token ? (
        <button
          onClick={handleLogin}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Login with Spotify
        </button>
      ) : (
        <>
          <div className="mb-4">
            <button
              onClick={toggleWebcam}
              className={`${
                useWebcam ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-bold py-2 px-4 rounded flex items-center`}
            >
              {useWebcam ? <CameraOff className="mr-2" /> : <Camera className="mr-2" />}
              {useWebcam ? 'Disable Webcam' : 'Enable Webcam'}
            </button>
          </div>
          {useWebcam ? (
            <WebcamMoodDetector setCurrentMood={setCurrentMood} onMoodDetected={handleMoodDetected} />
          ) : (
            <MoodSelector setCurrentMood={setCurrentMood} currentMood={currentMood} />
          )}
          {currentMood && useWebcam && (
            <p className="text-xl font-semibold mb-4">
              Detected Mood: {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
            </p>
          )}
          <Player token={token} currentMood={currentMood} />
        </>
      )}
      <footer className="mt-4 text-center">
        <p className="text-l text-white-400">
          <br /><br /><br />
          Built with ❤️ by Vaishakh.
        </p>
      </footer>
      <div className="mt-8">
        <p className="text-sm text-gray-400">
          &copy; 2024 EmoMusic. All rights reserved.
        </p>
      </div>
    </div>
    
  );
}

export default App;