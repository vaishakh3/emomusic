import React from 'react';
import { Frown, Meh, Smile, Heart } from 'lucide-react';

interface MoodSelectorProps {
  setCurrentMood: (mood: string) => void;
  currentMood: string;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ setCurrentMood, currentMood }) => {
  const moods = [
    { name: 'Sad', icon: Frown },
    { name: 'Neutral', icon: Meh },
    { name: 'Happy', icon: Smile },
    { name: 'Energetic', icon: Heart },
  ];

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="flex space-x-4 mb-4">
        {moods.map((mood) => (
          <button
            key={mood.name}
            onClick={() => setCurrentMood(mood.name.toLowerCase())}
            className={`flex flex-col items-center p-4 rounded-lg transition-all ${
              currentMood === mood.name.toLowerCase()
                ? 'bg-white text-purple-700'
                : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
            }`}
          >
            <mood.icon className="w-12 h-12 mb-2" />
            <span>{mood.name}</span>
          </button>
        ))}
      </div>
      {currentMood && (
        <p className="text-xl font-semibold">
          Current Mood: {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
        </p>
      )}
    </div>
  );
};

export default MoodSelector;