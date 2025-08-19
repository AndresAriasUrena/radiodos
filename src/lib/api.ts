import axios from "axios";

const WP_API_URL = "https://radiodos.aurigital.com/wp-json/wp/v2";

export async function getPosts() {
  const res = await axios.get(`${WP_API_URL}/posts?_embed`);
  return res.data;
}
