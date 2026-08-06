export const playNotificationSound = () => {
    try {
        const audio = new Audio('/sound/ringtone.mp3?v=2');
        audio.play().catch(e => console.error("Could not play notification sound:", e));
    } catch (e) {
        console.error("Audio playback error:", e);
    }
};
