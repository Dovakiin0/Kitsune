import { hianime } from "@/lib/hianime";
import { SearchAnimeParams } from "@/types/anime";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = parseSearchParams(searchParams);
    const data = await hianime.search(params.q, params.page, {
      type: params.type,
      status: params.status,
      rated: params.rated,
      season: params.season,
      language: params.language,
      sort: params.sort,
      genres: params.genres,
    });
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}

const parseSearchParams = (
  searchParams: URLSearchParams,
): SearchAnimeParams => {
  const getString = (key: string) => {
    const val = searchParams.get(key);
    return val === null ? undefined : val;
  };

  const getNumber = (key: string) => {
    const val = searchParams.get(key);
    const num = val ? parseInt(val, 10) : undefined;
    return num === undefined || isNaN(num) ? undefined : num;
  };

  return {
    q: getString("q") || "",
    page: getNumber("page") || 1,
    type: getString("type"),
    status: getString("status"),
    rated: getString("rated"),
    season: getString("season"),
    language: getString("language"),
    sort: getString("sort"),
    genres: getString("genres"),
  };
};
