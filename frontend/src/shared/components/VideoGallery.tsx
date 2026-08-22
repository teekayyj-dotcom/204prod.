import React from 'react';
import { VideoPlayer } from './VideoPlayer';

interface VideoGalleryProps<T> {
    items: T[];
    getUrl: (item: T) => string;
    renderVideoContent?: (item: T, idx: number) => React.ReactNode;
}

export function VideoGallery<T>({ items, getUrl, renderVideoContent }: VideoGalleryProps<T>) {
    if (!items || items.length === 0) return null;

    if (items.length === 1) {
        return (
            <div className="w-full max-h-[70vh] rounded-xl overflow-hidden bg-black relative flex justify-center aspect-video md:aspect-auto">
                <VideoPlayer src={getUrl(items[0])} controls className="w-full h-full min-h-[300px]" />
                {renderVideoContent && renderVideoContent(items[0], 0)}
            </div>
        );
    }

    return (
        <div className="flex flex-row overflow-x-auto gap-4 snap-x py-2 w-full">
            {items.map((item, idx) => (
                <div key={idx} className="flex-shrink-0 w-[280px] sm:w-[400px] snap-center relative rounded-xl overflow-hidden bg-black aspect-[4/5] sm:aspect-video">
                    <VideoPlayer src={getUrl(item)} controls className="w-full h-full" />
                    {renderVideoContent && renderVideoContent(item, idx)}
                </div>
            ))}
        </div>
    );
}
