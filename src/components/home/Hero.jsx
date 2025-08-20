"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IoArrowForward } from "react-icons/io5";
import WordPressService from "@/lib/wordpressService";

const Hero = ({ tagSlug = "hero" }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagId, setTagId] = useState(null);

  useEffect(() => {
    const getTagId = async () => {
      try {
        if (!tagSlug) {
          setTagId(null);
          return;
        }
        const result = await WordPressService.getTags();
        const id = result.tagsMap[tagSlug];
        if (id) {
          setTagId(id);
        } else {
          console.warn(`Tag "${tagSlug}" no encontrado en WordPress`);
          setTagId(null);
        }
      } catch (error) {
        console.error("Error loading tags map:", error);
        setTagId(null);
      }
    };
    getTagId();
  }, [tagSlug]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        if (!tagId) {
          setPosts([]);
          return;
        }
        const result = await WordPressService.getPosts({
          page: 1,
          perPage: 4,
          tags: [tagId],
          orderBy: "date",
        });
        setPosts(result.posts);
      } catch (error) {
        console.error("Error loading posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    if (tagId !== undefined) fetchPosts();
  }, [tagId]);

  const getFeaturedImage = WordPressService.getFeaturedImage;
  const getCategory = WordPressService.getCategory;
  const formatDate = WordPressService.formatDate;
  const cleanHtml = WordPressService.cleanHtml;

  if (loading) {
    return (
      <section className="px-4 sm:px-6 py-8 sm:py-12 lg:py-16 bg-[#F8FBFF] mx-2 my-4 rounded-2xl">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="relative aspect-[4/3] bg-[#D4D5DD] rounded-2xl animate-pulse"></div>
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-[#D4D5DD] rounded w-40" />
              <div className="h-8 bg-[#D4D5DD] rounded w-3/4" />
              <div className="h-8 bg-[#D4D5DD] rounded w-2/3" />
              <div className="h-4 bg-[#D4D5DD] rounded w-full" />
              <div className="h-4 bg-[#D4D5DD] rounded w-5/6" />
              <div className="h-10 bg-[#D4D5DD] rounded w-32 mt-4" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-[16/11] bg-[#D4D5DD] rounded-2xl" />
                <div className="h-6 bg-[#D4D5DD] rounded-full w-24" />
                <div className="h-5 bg-[#D4D5DD] rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  const [featured, ...rest] = posts;
  const secondary = rest.slice(0, 3);

  return (
    <section className="px-4 sm:px-6 py-8 sm:py-12 lg:py-16 bg-[#F8FBFF] mx-2 my-4 rounded-2xl">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          <div className="relative h-48 sm:h-64 lg:h-full bg-[#D4D5DD] rounded-2xl overflow-hidden">
            <Image
              src={getFeaturedImage(featured)}
              alt={cleanHtml(featured.title.rendered)}
              fill
              className="object-cover rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-col justify-between py-3">
            <div>
              <p className="text-sm font-medium uppercase text-[#1B1B1B]/60 tracking-wide mb-2">
                {getCategory(featured)} | {formatDate(featured.date)}
              </p>
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[#1B1B1B] leading-snug my-5">
                {cleanHtml(featured.title.rendered)}
              </h2>
              {featured.excerpt?.rendered && (
                <p className="text-md md:text-lg text-[#000000]/60 leading-none">
                  {cleanHtml(featured.excerpt.rendered).slice(0, 320)}
                  {cleanHtml(featured.excerpt.rendered).length > 320 ? "…" : ""}
                </p>
              )}
              <Link
                href={`/news/${featured.slug}`}
                className="mt-5 inline-flex items-center gap-2 bg-[#01A299] text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors"
              >
                Leer noticia <IoArrowForward className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="h-0.5 w-full bg-[#D4D5DD] my-6" />

        {/* Secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {secondary.map((post) => (
            <Link key={post.id} href={`/news/${post.slug}`} className="group hover:scale-[1.02] transition-all duration-700 block">
              <article>
                <div className="relative aspect-[16/11] bg-[#D4D5DD] rounded-2xl overflow-hidden mb-1">
                  <Image
                    src={getFeaturedImage(post)}
                    alt={cleanHtml(post.title.rendered)}
                    fill
                    className="object-cover rounded-2xl"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="py-3">
                  <span className="text-[#1E305E] border-[1.4px] border-[#1E305E] px-4 py-[4px] rounded-full bg-transparent text-sm font-medium">
                    {getCategory(post)}
                  </span>

                  <h3 className="mt-3 text-md md:text-xl font-medium text-[#2F3037] line-clamp-2 group-hover:text-[#1E305F] transition-colors">
                    {cleanHtml(post.title.rendered)}
                  </h3>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;