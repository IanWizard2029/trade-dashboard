import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export const runtime = 'nodejs';
// Cache the response on the server for 10 minutes (reduces RSS calls)
export const revalidate = 600;

type NewsItem = { title: string; link: string; pubDate: string; source: string };

const FEEDS = [
  // Google News RSS for Dungeons & Dragons — wide coverage from many outlets
  'https://news.google.com/rss/search?q=%22Dungeons%20%26%20Dragons%22&hl=en-US&gl=US&ceid=US:en',
  // You can add more RSS URLs here later if you like
];

async function fetchFeed(url: string): Promise<NewsItem[]> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`Feed fetch failed: ${url}`);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // be permissive; some feeds are quirky
    allowBooleanAttributes: true,
  });

  const data = parser.parse(xml);

  // Handle typical RSS shape: rss.channel.item[]
  const items: any[] =
    data?.rss?.channel?.item ??
    data?.feed?.entry ?? // Atom fallback
    [];

  const sourceName =
    data?.rss?.channel?.title ||
    data?.feed?.title ||
    'News';

  return items.slice(0, 30).map((it: any) => {
    const title = String(it?.title?._text ?? it?.title ?? '').trim();
    // Google News wraps <link> inside <link> or a URL string; normalize to string
    let link = '';
    if (typeof it?.link === 'string') link = it.link;
    else if (typeof it?.link?.href === 'string') link = it.link.href;
    else if (Array.isArray(it?.link) && it.link[0]?.href) link = it.link[0].href;
    else if (it?.guid && typeof it.guid === 'string') link = it.guid;
    const pub = String(it?.pubDate ?? it?.updated ?? it?.published ?? new Date().toISOString());
    return {
      title: title || '(untitled)',
      link: link || '#',
      pubDate: new Date(pub).toISOString(),
      source: sourceName,
    } as NewsItem;
  });
}

export async function GET() {
  try {
    const lists = await Promise.allSettled(FEEDS.map(fetchFeed));
    const merged = lists
      .flatMap(r => r.status === 'fulfilled' ? r.value : [])
      // de-dupe by title+link
      .filter((v, i, arr) =>
        arr.findIndex(x => x.title === v.title && x.link === v.link) === i
      )
      // sort desc by date
      .sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate))
      .slice(0, 20);

    return NextResponse.json({ items: merged });
  } catch (e: any) {
    console.error('news GET error', e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
