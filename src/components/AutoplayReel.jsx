import { useEffect, useRef } from "react";

const visibleVideos = new Map();
let activeVideo = null;

const updateActiveVideo = (video, ratio) => {
    if (ratio >= 0.6) visibleVideos.set(video, ratio);
    else visibleVideos.delete(video);

    let nextVideo = null;
    let highestRatio = 0;
    visibleVideos.forEach((visibleRatio, candidate) => {
        if (visibleRatio > highestRatio) {
            highestRatio = visibleRatio;
            nextVideo = candidate;
        }
    });

    if (nextVideo === activeVideo) return;
    activeVideo?.pause();
    activeVideo = nextVideo;
    if (activeVideo) {
        activeVideo.play().catch((playError) => {
            if (playError.name !== "NotAllowedError" && playError.name !== "AbortError") {
                console.error("Reel playback failed.", playError);
            }
        });
    }
};

const AutoplayReel = ({ src, title, autoPlay = true }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!autoPlay || !video || typeof IntersectionObserver === "undefined") return undefined;

        const observer = new IntersectionObserver(([entry]) => {
            updateActiveVideo(video, entry.isIntersecting ? entry.intersectionRatio : 0);
        }, { threshold: [0, 0.6, 1] });

        observer.observe(video);
        return () => {
            observer.disconnect();
            updateActiveVideo(video, 0);
            video.pause();
        };
    }, [autoPlay]);

    return <video ref={videoRef} src={src} muted loop playsInline preload="metadata" controls aria-label={title || "Studio reel"} />;
};

export default AutoplayReel;
