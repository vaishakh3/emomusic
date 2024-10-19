import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

interface WebcamMoodDetectorProps {
  setCurrentMood: (mood: string) => void;
  onMoodDetected: () => void;
}

const WebcamMoodDetector: React.FC<WebcamMoodDetectorProps> = ({ setCurrentMood, onMoodDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
        await faceapi.loadFaceLandmarkModel(MODEL_URL);
        await faceapi.loadFaceRecognitionModel(MODEL_URL);
        await faceapi.loadFaceExpressionModel(MODEL_URL);
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (isModelLoaded) {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isModelLoaded]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleVideoPlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    const detectFaces = async () => {
      if (!video || video.paused || video.ended) return;

      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      if (detections.length > 0) {
        const mood = getMoodFromExpressions(detections[0].expressions);
        setCurrentMood(mood);
        stopWebcam();
        onMoodDetected();
      } else {
        requestAnimationFrame(detectFaces);
      }
    };

    detectFaces();
  };

  const getMoodFromExpressions = (expressions: faceapi.FaceExpressions): string => {
    const sortedExpressions = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
    const topExpression = sortedExpressions[0][0];

    switch (topExpression) {
      case 'happy':
        return 'happy';
      case 'sad':
        return 'sad';
      case 'angry':
      case 'disgusted':
        return 'energetic';
      case 'fearful':
      case 'surprised':
      case 'neutral':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        width="640"
        height="480"
        onPlay={handleVideoPlay}
        className="rounded-lg"
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
    </div>
  );
};

export default WebcamMoodDetector;