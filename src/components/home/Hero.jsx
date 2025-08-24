"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { IoPlay, IoRadio } from "react-icons/io5";
import { MdVerified } from "react-icons/md";
import RSSService from "@/lib/rssService";
import { usePlayer } from "@/lib/PlayerContext";

const Hero = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const { playEpisode, playRadio, playerState } = usePlayer?.() || { playEpisode: () => { }, playRadio: () => { }, playerState: {} };

  const cleanHtml = (htmlString) => {
    if (typeof window !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = htmlString || "";
      return div.textContent || div.innerText || "";
    }
    return (htmlString || "").replace(/<[^>]*>/g, "");
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const shows = await RSSService.getAllPodcasts();
        const ordered = shows.sort((a, b) => cleanHtml(a.title).localeCompare(cleanHtml(b.title)));
        setPodcasts(ordered);
        if (ordered.length > 0) {
          setSelected(ordered[0]);
        }
      } catch (e) {
        setPodcasts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!selected) {
        setEpisodes([]);
        return;
      }
      try {
        setEpisodesLoading(true);
        const eps = await RSSService.getPodcastEpisodes(selected.rssUrl);
        setEpisodes(eps);
      } catch (e) {
        setEpisodes([]);
      } finally {
        setEpisodesLoading(false);
      }
    };
    loadEpisodes();
  }, [selected]);

  const handlePlayFirst = () => {
    if (!selected || episodes.length === 0) return;
    try {
      playEpisode?.(episodes[0], selected, episodes, 0);
    } catch { }
  };

  const handlePlayEpisode = (episode, index) => {
    try {
      playEpisode?.(episode, selected, episodes, index);
    } catch { }
  };

  if (loading) {
    return (
      <section className="h-[90vh] px-4 py-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="hidden lg:block space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-[#1A1B1F] rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="relative h-full bg-[#1A1B1F] rounded-2xl overflow-hidden animate-pulse" />
          </div>
          <div className="hidden lg:block space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#1A1B1F] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!selected) return null;

  return (
    <section className="min-h-screen lg:min-h-0 lg:h-[82vh] pt-4">
      <div className="h-full flex flex-col lg:flex-row">

        {/* Sidebar izquierda: Podcasts */}
        <aside className="w-full lg:w-[20%] order-2 lg:order-1 h-[52vh] lg:h-[82vh]">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {podcasts.map((p) => {
                const isActive = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`w-full flex items-center gap-3 p-3 lg:h-[20.5vh] min-h-[120px] transition-all border-[1px] border-[#141414] ${isActive ? "border-l-[4px] border-l-[#D51F2F] bg-[#050505]" : "hover:bg-[#050505]"
                      }`}
                  >
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden border-[2px] border-[#141414]">
                      <Image
                        src={p.imageUrl || "/placeholder-podcast.jpg"}
                        alt={cleanHtml(p.title)}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-sm xl:text-md font-medium line-clamp-1 ${isActive ? "text-white" : "text-white/80"}`}>{cleanHtml(p.title)}</p>
                      {p.author && (
                        <p className={`line-clamp-1 flex items-center gap-1 text-xs xl:text-sm ${isActive ? "text-white/40" : "text-white/40"}`}>{cleanHtml(p.author)} <MdVerified className="text-[#D51F2F] w-4 h-4" /></p>
                      )}
                    </div>
                    <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden border-[1px] border-[#505050] flex items-center justify-center">
                      <IoPlay className="text-[#505050] w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Centro: Detalle del podcast */}
        <main className="w-full lg:w-[65%] h-[82vh] order-1 lg:order-2">
          <div className="relative h-full border-[2px] border-[#141414] border-b-red-900 overflow-hidden">
            <Image
              src={selected.imageUrl || "/placeholder-podcast.jpg"}
              alt={cleanHtml(selected.title)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

            {/* Información del podcast en la parte superior */}
            <div className="absolute inset-x-0 top-0 p-6 sm:p-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 lg:w-24 lg:h-24 flex-shrink-0 rounded-full overflow-hidden border-[3px] border-white/20">
                    <Image
                      src={selected.imageUrl || "/placeholder-podcast.jpg"}
                      alt={cleanHtml(selected.title)}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                      {cleanHtml(selected.title)}
                    </h1>
                    {selected.author && (
                      <div className="flex items-center gap-2">
                        <p className="text-white/80 text-sm sm:text-lg font-medium">
                          {cleanHtml(selected.author)}
                        </p>
                        <MdVerified className="text-[#D51F2F] w-5 h-5 lg:w-6 lg:h-6" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Botón de ir en vivo */}
                <button
                  onClick={() => playRadio?.()}
                  className="bg-[#D51F2F] hover:bg-[#b71724] text-white px-4 py-2 lg:px-6 lg:py-3 rounded-md transition-colors flex items-center gap-2 font-medium"
                >
                  <IoRadio className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Escúchenos</span>
                  <span className="sm:hidden">En vivo</span>
                </button>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <div className="flex items-center gap-2 text-sm sm:text-lg text-white/80 uppercase tracking-wide mb-3 font-bebas">
                <span>{cleanHtml(selected.author || "Podcast")}</span>
                <span className="opacity-50">|</span>
                <span>{selected.schedule || "Horario no disponible"}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-semibold text-white leading-tight mb-3">
                {cleanHtml(selected.title)}
              </h2>
              {selected.description && (
                <p className="text-white/80 max-w-3xl text-sm sm:text-lg line-clamp-2 sm:line-clamp-4">
                  {cleanHtml(selected.description)}
                </p>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar derecha: Episodios del seleccionado */}
        <aside className="w-full lg:w-[15%] order-3 lg:order-3 h-[52vh] lg:h-[82vh]">
          <div className="h-full flex flex-col">
            {episodesLoading ? (
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#ff2d2d] animate-pulse h-16" />
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {episodes.map((ep, index) => {
                  const isPlaying =
                    playerState?.currentShow?.id === selected.id &&
                    playerState?.currentEpisode?.id === ep.id &&
                    playerState?.isPlaying;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => handlePlayEpisode(ep, index)}
                      className={`w-full text-left lg:h-[11.7vh] min-h-[80px] p-3 border-[1px] border-[#141414] transition-colors ${isPlaying ? "bg-[#D51F2F] text-white" : "hover:bg-[#050505] text-white/80"
                        }`}
                    >
                      <p className={`text-sm font-medium line-clamp-2 ${isPlaying ? "text-white" : "text-[#FFFFFF]/40"}`}>{cleanHtml(ep.title)}</p>
                      <div className={`flex items-center gap-2 text-xs mt-1 ${isPlaying ? "text-[#FFFFFF]/60" : "text-[#FFFFFF]/25"}`}>
                        <span>{formatDate(ep.pubDate)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Hero;