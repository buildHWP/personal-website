/**
 * Vercel Serverless Function — RSS Feed Proxy
 * Fetches X/Twitter RSS feed from RSS.app, parses it, returns clean JSON.
 * This avoids CORS issues and gives us server-side caching.
 */

// ============================================
// CONFIGURATION — Update this with your RSS.app feed URL
// Sign up free at https://rss.app and create a feed for your X profile
// ============================================
const RSS_FEED_URL = process.env.RSS_FEED_URL || 'https://rss.app/feeds/x89cEuJBaiwXU0lH.xml';

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

    if (!RSS_FEED_URL) {
        // Return demo data if no RSS feed URL configured
        return res.status(200).json({
            posts: getDemoPosts(),
            source: 'demo',
            message: 'Set RSS_FEED_URL env var in Vercel to enable live feed'
        });
    }

    try {
        const response = await fetch(RSS_FEED_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PersonalSite/1.0)' }
        });

        if (!response.ok) {
            throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const xml = await response.text();
        const posts = parseRSS(xml);
        const profileImage = extractChannelImage(xml);

        return res.status(200).json({
            posts,
            profileImage,
            source: 'rss',
            updatedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Feed error:', err.message);
        return res.status(200).json({
            posts: getDemoPosts(),
            source: 'fallback',
            error: err.message
        });
    }
}

/**
 * Lightweight RSS XML parser (no dependencies)
 */
function parseRSS(xml) {
    const posts = [];
    const items = xml.split('<item>').slice(1);

    for (const item of items) {
        const title = extractTag(item, 'title');
        const link = extractTag(item, 'link');
        const pubDate = extractTag(item, 'pubDate');
        const description = extractTag(item, 'description');
        const creator = extractTag(item, 'dc:creator') || extractTag(item, 'author');

        // Clean HTML from description
        const cleanText = description
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .trim();

        // Extract images — check media:content first (RSS.app uses this), then <img> fallback
        const mediaMatch = item.match(/<media:content[^>]+url="([^"]+)"/);
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/);
        const image = mediaMatch ? mediaMatch[1] : (imgMatch ? imgMatch[1] : null);

        // Detect post type from RSS.app format
        // RTs: title starts with "RT by @handle:"
        // Replies: original text starts with @someone (not an RT)
        let type = 'post';
        let displayText = cleanText;
        let rtAuthor = null;

        if (title.startsWith('RT by @')) {
            type = 'repost';
            // Extract the original author from the title: "RT by @h_woopark: actual content by @someone"
            // The description contains the original tweet text
            rtAuthor = null;
            // Try to find original author from description HTML
            const authorMatch = description.match(/— ([^(@]+)\(@([^)]+)\)/);
            if (authorMatch) {
                rtAuthor = { name: authorMatch[1].trim(), handle: authorMatch[2].trim() };
            }
        } else if (cleanText.startsWith('@') || (link && link.includes('/status/') && description.includes('replying to'))) {
            type = 'reply';
        }

        posts.push({
            text: displayText,
            link,
            date: pubDate,
            image,
            type,
            author: creator || 'h_woopark',
            rtAuthor
        });
    }

    return posts; // Return all posts from the feed
}

/**
 * Extracts the channel-level profile image URL from RSS <image><url> tag
 */
function extractChannelImage(xml) {
    // Get everything before the first <item> (the channel header)
    const channelHeader = xml.split('<item>')[0] || '';
    // Look for <image><url>...</url></image> in the channel header
    const imageBlock = channelHeader.match(/<image>[\s\S]*?<\/image>/i);
    if (imageBlock) {
        const urlMatch = imageBlock[0].match(/<url>([^<]+)<\/url>/i);
        if (urlMatch) return urlMatch[1].trim();
    }
    return null;
}

function extractTag(xml, tag) {
    // Handle CDATA sections
    const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

/**
 * Demo posts shown when RSS feed isn't configured yet
 */
function getDemoPosts() {
    return [
        {
            text: "Excited to share what we've been building at NationGraph. The future of data infrastructure is here.",
            link: "https://x.com/h_woopark",
            date: new Date().toISOString(),
            image: null,
            type: "post",
            author: "h_woopark"
        },
        {
            text: "The intersection of AI and early-stage investing is where the most interesting opportunities live right now.",
            link: "https://x.com/h_woopark",
            date: new Date(Date.now() - 86400000).toISOString(),
            image: null,
            type: "post",
            author: "h_woopark"
        },
        {
            text: "Great conversation about frontier technology and its implications for how we work. The next decade will look nothing like the last.",
            link: "https://x.com/h_woopark",
            date: new Date(Date.now() - 172800000).toISOString(),
            image: null,
            type: "post",
            author: "h_woopark"
        },
        {
            text: "Building things that create tangible, lasting value for society — that's what gets me out of bed every morning.",
            link: "https://x.com/h_woopark",
            date: new Date(Date.now() - 259200000).toISOString(),
            image: null,
            type: "post",
            author: "h_woopark"
        },
        {
            text: "If you're working on something at the frontier of AI or data infrastructure, I'd love to hear about it. DMs open.",
            link: "https://x.com/h_woopark",
            date: new Date(Date.now() - 345600000).toISOString(),
            image: null,
            type: "post",
            author: "h_woopark"
        }
    ];
}
