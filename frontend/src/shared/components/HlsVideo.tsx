import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HlsVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src?: string; // Expecting the original mp4 url like .../play_1080p.mp4 or a direct m3u8 url
  lazyLoad?: boolean; // Defaults to true
}

export const HlsVideo: React.FC<HlsVideoProps> = ({ src, lazyLoad = true, ...props }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(!lazyLoad);
  
  // Transform mp4 URL to Bunny Stream HLS URL if applicable
  const getHlsUrl = (url: string) => {
    if (!url) return "";
    // If it's already an m3u8, just return it
    if (url.includes(".m3u8")) return url;
    
    // Bunny Stream URLs usually end with /play_1080p.mp4, /play_720p.mp4, etc.
    const match = url.match(/^(.*)\/play_[0-9]+p\.mp4(.*)$/);
    if (match) {
      return `${match[1]}/playlist.m3u8${match[2]}`;
    }
    return url;
  };

  const hlsUrl = src ? getHlsUrl(src) : "";
  const isMp4Fallback = hlsUrl.endsWith(".mp4");

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad) {
      setShouldLoad(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" } // Load slightly before coming into view
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl || isMp4Fallback || !shouldLoad) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        // Tweak to start at higher quality to prevent initial blurriness
        abrEwmaDefaultEstimate: 2500000, 
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (props.autoPlay) {
          video.play().catch(e => console.error("Auto-play failed:", e));
        }
      });
      
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        if (props.autoPlay) {
          video.play().catch(e => console.error("Auto-play failed:", e));
        }
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, props.autoPlay, shouldLoad, isMp4Fallback]);

  return (
    <video
      ref={videoRef}
      {...(isMp4Fallback && shouldLoad ? { src: hlsUrl } : {})}
      {...props}
    />
  );
};
