import React, { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
    src: string;
    className?: string;
    controls?: boolean;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    children?: React.ReactNode;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    src, 
    className = "", 
    controls = true, 
    autoPlay = false, 
    loop = false, 
    muted = false,
    children 
}) => {
    const [isVertical, setIsVertical] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const bgVideoRef = useRef<HTMLVideoElement>(null);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const { videoWidth, videoHeight } = videoRef.current;
            if (videoHeight > videoWidth) {
                setIsVertical(true);
            }
        }
    };

    // Sync play/pause state with background video
    useEffect(() => {
        const video = videoRef.current;
        const bgVideo = bgVideoRef.current;
        
        if (!video || !bgVideo) return;

        const onPlay = () => bgVideo.play().catch(() => {});
        const onPause = () => bgVideo.pause();
        const onSeek = () => { bgVideo.currentTime = video.currentTime; };

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('seeked', onSeek);

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('seeked', onSeek);
        };
    }, [isVertical]);

    return (
        <div className={`relative flex items-center justify-center overflow-hidden bg-black ${className}`}>
            {isVertical && (
                <video 
                    ref={bgVideoRef}
                    src={src} 
                    className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-60 scale-125 z-0" 
                    muted 
                    playsInline
                    loop={loop}
                />
            )}
            <video 
                ref={videoRef}
                src={src} 
                controls={controls}
                autoPlay={autoPlay}
                loop={loop}
                muted={muted}
                onLoadedMetadata={handleLoadedMetadata}
                className={`relative z-10 max-h-full ${isVertical ? 'h-full w-auto object-contain' : 'w-full h-full object-contain'}`}
            />
            {children}
        </div>
    );
};
