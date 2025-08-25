"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { IoPlay, IoRadio, IoMenu, IoClose } from "react-icons/io5";
import { MdVerified } from "react-icons/md";
import RSSService from "@/lib/rssService";
import { usePlayer } from "@/lib/PlayerContext";

const Hero = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [showPodcastsSidebar, setShowPodcastsSidebar] = useState(false);
  const [showEpisodesSidebar, setShowEpisodesSidebar] = useState(false);
  const [episodePage, setEpisodePage] = useState(1);
  const { playEpisode, playRadio, playerState } = usePlayer?.() || { playEpisode: () => { }, playRadio: () => { }, playerState: {} };

  const EPISODES_PER_PAGE = 10;

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
        setEpisodePage(1); // Reiniciar paginación cuando cambia el podcast
      } catch (e) {
        setEpisodes([]);
      } finally {
        setEpisodesLoading(false);
      }
    };
    loadEpisodes();
  }, [selected]);

  // Función para obtener episodios paginados
  const getPaginatedEpisodes = () => {
    const startIndex = (episodePage - 1) * EPISODES_PER_PAGE;
    const endIndex = startIndex + EPISODES_PER_PAGE;
    return episodes.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(episodes.length / EPISODES_PER_PAGE);

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
      <section className="h-[82vh] py-4 pb-10 bg-[#000000] relative">
        {/* Mobile controls skeleton */}
        <div className="lg:hidden flex justify-between items-center px-4 pb-4">
          <div className="w-24 h-10 bg-[#D51F2F]/20 rounded-lg animate-pulse"></div>
          <div className="w-24 h-10 bg-[#141414] rounded-lg animate-pulse"></div>
        </div>

        <div className="h-full flex flex-col lg:flex-row">
          {/* Sidebar izquierda: Podcasts skeleton - Desktop */}
          <aside className="hidden lg:block w-[20%] h-[82vh] order-1">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-full flex items-center gap-3 p-3 lg:h-[20.5vh] min-h-[120px] border-[1px] border-[#141414] bg-[#141414] animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-[#D51F2F]/20 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#D51F2F]/20 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-[#FFFFFF]/10 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#505050]/20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Centro: Detalle del podcast skeleton */}
          <main className="w-full lg:w-[65%] h-[82vh] order-2">
            <div className="relative h-full border-[2px] border-[#141414] overflow-hidden bg-[#141414] animate-pulse">
              {/* Skeleton content overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/80 via-[#000000]/40 to-[#000000]/10" />
              
              {/* Skeleton top section */}
              <div className="absolute inset-x-0 top-0 p-6 sm:p-10">
                <div className="flex items-center justify-between">
                  <div className="items-center gap-4 hidden lg:flex">
                    <div className="w-20 h-20 rounded-full bg-[#D51F2F]/20 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-[#D51F2F]/20 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-[#FFFFFF]/10 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Botón en vivo skeleton */}
                  <div className="w-24 h-8 bg-[#D51F2F]/20 rounded-md animate-pulse"></div>
                </div>
              </div>
              
              {/* Skeleton bottom section */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                <div className="">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-[#FFFFFF]/10 rounded w-20 animate-pulse"></div>
                    <div className="w-2 h-4 bg-[#FFFFFF]/10 rounded animate-pulse"></div>
                    <div className="h-4 bg-[#FFFFFF]/10 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="h-8 bg-[#D51F2F]/20 rounded w-2/3 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#FFFFFF]/10 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-[#FFFFFF]/10 rounded w-4/5 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar derecha: Episodios skeleton - Desktop */}
          <aside className="hidden lg:block w-[15%] h-[82vh] order-3">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="w-full lg:h-[11.7vh] min-h-[80px] p-3 border-[1px] border-[#141414] bg-[#141414] animate-pulse">
                    <div className="h-4 bg-[#D51F2F]/20 rounded w-full animate-pulse mb-2"></div>
                    <div className="h-3 bg-[#FFFFFF]/10 rounded w-1/2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
        
        {/* Loading text */}
        <div className="text-center mt-6">
          <p className="text-[#D51F2F] font-medium">Sintonizando Radio2...</p>
        </div>
      </section>
    );
  }

  if (!selected) return null;

  return (
    <section className="h-[82vh] py-4 pb-10 bg-[#000000] relative">
      {/* Mobile controls */}
      <div className="lg:hidden flex justify-between items-center px-4 pb-4">
        <button
          onClick={() => setShowPodcastsSidebar(true)}
          className="flex items-center gap-2 bg-[#D51F2F] text-white px-4 py-2 rounded-lg hover:bg-[#b71724] transition-colors"
        >
          <IoMenu className="w-5 h-5" />
          Podcasts
        </button>
        
        <button
          onClick={() => setShowEpisodesSidebar(true)}
          className="flex items-center gap-2 bg-[#141414] text-white px-4 py-2 rounded-lg hover:bg-[#FFFFFF]/10 transition-colors"
        >
          Episodios
          <IoMenu className="w-5 h-5" />
        </button>
      </div>

      <div className="h-full flex flex-col lg:flex-row">

        {/* Sidebar izquierda: Podcasts - Desktop */}
        <aside className="hidden lg:block w-[20%] h-[82vh] order-1">
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

        {/* Mobile Podcasts Sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          showPodcastsSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPodcastsSidebar(false)}></div>
          <div className="relative w-80 h-full bg-[#000000] border-r border-[#141414] shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-[#141414]">
              <h3 className="text-[#D51F2F] font-bold text-lg">Podcasts</h3>
              <button
                onClick={() => setShowPodcastsSidebar(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <IoClose className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {podcasts.map((p) => {
                const isActive = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setShowPodcastsSidebar(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 min-h-[100px] transition-all border-b border-[#141414] ${
                      isActive ? "bg-[#D51F2F]/20 border-l-[4px] border-l-[#D51F2F]" : "hover:bg-[#050505]"
                    }`}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden border-[2px] border-[#141414]">
                      <Image
                        src={p.imageUrl || "/placeholder-podcast.jpg"}
                        alt={cleanHtml(p.title)}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-medium line-clamp-2 ${isActive ? "text-white" : "text-white/80"}`}>{cleanHtml(p.title)}</p>
                      {p.author && (
                        <p className={`line-clamp-1 flex items-center gap-1 text-xs ${isActive ? "text-white/60" : "text-white/40"}`}>
                          {cleanHtml(p.author)} <MdVerified className="text-[#D51F2F] w-3 h-3" />
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Centro: Detalle del podcast */}
        <main className="w-full lg:w-[65%] h-[82vh] order-2">
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
                <div className="items-center gap-4 hidden lg:flex">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-full overflow-hidden border-[3px] border-white/20">
                    <Image
                      src={selected.imageUrl || "/placeholder-podcast.jpg"}
                      alt={cleanHtml(selected.title)}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-lg font-archivo font-medium text-white/80 leading-tight">
                      "{cleanHtml(selected.title)}"
                    </h1>
                    {selected.author && (
                      <div className="flex items-center gap-2">
                        <p className="text-white/40 text-sm font-archivo font-medium">
                          {cleanHtml(selected.author)}
                        </p>
                        <MdVerified className="text-[#D51F2F] w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Botón de ir en vivo */}
                <button
                  onClick={() => playRadio?.()}
                  className="bg-[#D51F2F] gap-2 hover:bg-[#b71724] text-white font-archivo px-4 py-1 rounded-md transition-colors flex items-center font-medium"
                >
                  En vivo <p className="text-4xl">•</p>
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

        {/* Sidebar derecha: Episodios del seleccionado - Desktop */}
        <aside className="hidden lg:block w-[15%] h-[82vh] order-3">
          <div className="h-full flex flex-col">
            {episodesLoading ? (
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#141414] animate-pulse h-16 border border-[#D51F2F]/20 mb-2" />
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

        {/* Mobile Episodes Sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out mb-16 ${
          showEpisodesSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEpisodesSidebar(false)}></div>
          <div className="absolute right-0 w-80 h-full bg-[#000000] border-l border-[#141414] shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#141414]">
              <h3 className="text-[#D51F2F] font-bold text-lg">Episodios</h3>
              <button
                onClick={() => setShowEpisodesSidebar(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <IoClose className="w-6 h-6" />
              </button>
            </div>
            
            {/* Contador de episodios */}
            <div className="px-4 py-2 border-b border-[#141414]">
              <p className="text-white/60 text-sm">
                {episodes.length > 0 ? (
                  <>
                    Mostrando {((episodePage - 1) * EPISODES_PER_PAGE) + 1} - {Math.min(episodePage * EPISODES_PER_PAGE, episodes.length)} de {episodes.length} episodios
                  </>
                ) : (
                  "No hay episodios disponibles"
                )}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {episodesLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-[#141414] rounded-lg animate-pulse border border-[#D51F2F]/20" />
                  ))}
                </div>
              ) : (
                getPaginatedEpisodes().map((ep, index) => {
                  const globalIndex = (episodePage - 1) * EPISODES_PER_PAGE + index;
                  const isPlaying =
                    playerState?.currentShow?.id === selected.id &&
                    playerState?.currentEpisode?.id === ep.id &&
                    playerState?.isPlaying;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => {
                        handlePlayEpisode(ep, globalIndex);
                        setShowEpisodesSidebar(false);
                      }}
                      className={`w-full text-left p-4 border-b border-[#141414] transition-colors ${
                        isPlaying ? "bg-[#D51F2F] text-white" : "hover:bg-[#050505] text-white/80"
                      }`}
                    >
                      <p className={`text-sm font-medium line-clamp-2 mb-1 ${isPlaying ? "text-white" : "text-[#FFFFFF]/80"}`}>
                        {cleanHtml(ep.title)}
                      </p>
                      <div className={`text-xs ${isPlaying ? "text-[#FFFFFF]/60" : "text-[#FFFFFF]/40"}`}>
                        <span>{formatDate(ep.pubDate)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Controles de paginación */}
            {!episodesLoading && episodes.length > EPISODES_PER_PAGE && (
              <div className="p-4 border-t border-[#141414] bg-[#000000]">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setEpisodePage(prev => Math.max(1, prev - 1))}
                    disabled={episodePage === 1}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      episodePage === 1 
                        ? "bg-[#141414] text-white/30 cursor-not-allowed" 
                        : "bg-[#D51F2F] text-white hover:bg-[#b71724]"
                    }`}
                  >
                    Anterior
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">
                      Página {episodePage} de {totalPages}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setEpisodePage(prev => Math.min(totalPages, prev + 1))}
                    disabled={episodePage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      episodePage === totalPages 
                        ? "bg-[#141414] text-white/30 cursor-not-allowed" 
                        : "bg-[#D51F2F] text-white hover:bg-[#b71724]"
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;