import { useRef, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { VideoChapter } from '@/lib/supabase';
import { formatTime } from '@/lib/time';

interface VideoSeekBarProps {
  currentTime: number;
  duration: number;
  chapters: VideoChapter[];
  onSeek: (time: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}

function chapterAt(chapters: VideoChapter[], time: number): VideoChapter | undefined {
  let active: VideoChapter | undefined;
  for (const c of chapters) {
    if (c.start_time_seconds <= time) active = c;
    else break;
  }
  return active;
}

export function VideoSeekBar({
  currentTime,
  duration,
  chapters,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: VideoSeekBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; time: number; chapter?: VideoChapter } | null>(null);

  const safeDuration = duration > 0 ? duration : 0;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || safeDuration <= 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const time = ratio * safeDuration;
    setHover({ x: ratio * 100, time, chapter: chapterAt(chapters, time) });
  };

  return (
    <div
      ref={trackRef}
      className="relative w-full py-2 group/seek"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHover(null)}
    >
      {hover && (
        <div
          className="absolute bottom-full mb-2 -translate-x-1/2 pointer-events-none whitespace-nowrap bg-black/90 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-lg z-10"
          style={{ left: `${Math.min(96, Math.max(4, hover.x))}%` }}
        >
          {hover.chapter && (
            <div className="text-xs font-semibold text-white">{hover.chapter.title}</div>
          )}
          <div className={hover.chapter ? 'text-[10px] text-white/50' : 'text-xs text-white'}>
            {formatTime(hover.time)}
          </div>
        </div>
      )}

      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center cursor-pointer"
        min={0}
        max={safeDuration}
        step={0.1}
        value={[Math.min(currentTime, safeDuration)]}
        onValueChange={([v]) => onSeek(v)}
        onPointerDown={onScrubStart}
        onPointerUp={onScrubEnd}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/20 group-hover/seek:h-1.5 transition-all">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
          {safeDuration > 0 &&
            chapters.map((c) => (
              <span
                key={c.id}
                className="absolute top-0 bottom-0 w-[2px] bg-black/50"
                style={{ left: `${(c.start_time_seconds / safeDuration) * 100}%` }}
              />
            ))}
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-3.5 w-3.5 rounded-full bg-primary shadow focus-visible:outline-none scale-0 group-hover/seek:scale-100 transition-transform"
          aria-label="Progresso do vídeo"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
