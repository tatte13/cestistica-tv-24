import { useEffect } from 'react';
import VideoPlayer from './VideoPlayer';

export default function EmbedView() {
  useEffect(() => {
    document.body.classList.add('embed-mode');
    return () => document.body.classList.remove('embed-mode');
  }, []);

  return (
    <div className="w-screen h-screen bg-black">
      <VideoPlayer embed />
    </div>
  );
}
