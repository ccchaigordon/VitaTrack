import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";

type Props = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

type GlobModule = { default: string };

const SLIDE_MS = 8000;

const carouselStore: {
  pos: number;
  lastAdvanceAt: number;
} = {
  pos: 0,
  lastAdvanceAt: Date.now(),
};

function useAuthImages() {
  return useMemo(() => {
    const mods = import.meta.glob<GlobModule>(
      "../assets/auth_*.{png,jpg,jpeg,webp}",
      {
        eager: true,
      }
    );

    return Object.entries(mods)
      .map(([path, mod]) => ({ path, src: mod.default }))
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((e) => e.src);
  }, []);
}

export function AuthLayout({ title, subtitle, children }: Props) {
  const images = useAuthImages();
  const [pos, setPos] = useState(() => carouselStore.pos);
  const [disableAnim, setDisableAnim] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;

    let intervalId: number | undefined;

    const advance = () => {
      carouselStore.lastAdvanceAt = Date.now();
      setPos((p) => p + 1);
    };

    const elapsed = Date.now() - carouselStore.lastAdvanceAt;
    const remaining = SLIDE_MS - (elapsed % SLIDE_MS);

    const timeoutId = window.setTimeout(() => {
      advance();
      intervalId = window.setInterval(advance, SLIDE_MS);
    }, Math.max(0, remaining));

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [images.length]);

  const slides = images.length > 0 ? [...images, images[0]] : images;
  const visibleIdx = images.length === 0 ? 0 : pos % images.length;

  useEffect(() => {
    carouselStore.pos = pos;
  }, [pos]);

  useEffect(() => {
    if (images.length <= 1) return;
    if (pos === images.length) {
      const id = window.setTimeout(() => {
        setDisableAnim(true);
        setPos(0);
        requestAnimationFrame(() => setDisableAnim(false));
      }, 750);
      return () => window.clearTimeout(id);
    }
    return;
  }, [images.length, pos]);

  return (
    <div className="min-h-screen bg-white flex items-center lg:items-start">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-10 p-6 items-center lg:grid-cols-2">
        <div className="flex flex-col">
          <div className="mb-10 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-700">
            <span className="inline-block h-6 w-6 rounded-full bg-slate-900" />
            <span>VitaTrack</span>
          </div>

          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-8 max-w-sm">{children}</div>
        </div>

        <div className="hidden lg:block">
          {images.length === 0 ? (
            <div className="aspect-4/5 w-full overflow-hidden rounded-3xl bg-linear-to-br from-emerald-900/30 via-emerald-700/20 to-slate-900/30" />
          ) : (
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl">
              <div
                className={[
                  "flex h-full w-full",
                  disableAnim
                    ? ""
                    : "transition-transform duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]",
                ].join(" ")}
                style={{ transform: `translateX(-${pos * 100}%)` }}
              >
                {slides.map((src, i) => {
                  const isActive =
                    images.length > 0 && i % images.length === visibleIdx;
                  return (
                    <div key={src} className="h-full w-full shrink-0">
                      <img
                        src={src}
                        alt=""
                        className={[
                          "h-full w-full object-cover",
                          "transition-[transform,filter] duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          isActive
                            ? "scale-[1.02] blur-0"
                            : "scale-100 blur-[0.2px]",
                        ].join(" ")}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
