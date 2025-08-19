import { getPosts } from "@/lib/api";

export default async function Home() {
  const posts = await getPosts();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Últimas noticias</h1>
      {posts.map((post: any) => (
        <article key={post.id} className="mb-8">
          <h2
            className="text-xl font-semibold"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />
          <div dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
        </article>
      ))}
    </main>
  );
}
