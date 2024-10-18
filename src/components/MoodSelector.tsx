import React from 'react';
import { Frown, Meh, Smile, Heart } from 'lucide-react';

interface MoodSelectorProps {
  setCurrentMood: (mood: string) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ setCurrentMood }) => {
  const moods = [
    { name: 'Sad', icon: Frown },
    { name: 'Neutral', icon: Meh },
    { name: 'Happy', icon: Smile },
    { name: 'Energetic', icon: Heart },
  ];

  return (
    <div className="flex space-x-4 mb-8">
      {moods.map((mood) => (
        <button
          key={mood.name}
          onClick={() => setCurrentMood(mood.name.toLowerCase())}
          className="flex flex-col items-center p-4 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
        >
          <mood.icon className="w-12 h-12 mb-2" />
          <span>{mood.name}</span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;