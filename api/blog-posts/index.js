/**
 * Vercel serverless: fetch published posts from Notion database and return as JSON.
 * Requires env: NOTION_API_KEY, NOTION_DATABASE_ID
 * Database properties: Title (title), Published (date with time), Status (select: draft | published), Tags (multi-select).
 */

const NOTION_VERSION = '2022-06-28';

function richTextToHtml(richText) {
  if (!Array.isArray(richText) || richText.length === 0) return '';
  return richText
    .map((seg) => {
      let text = seg.plain_text || '';
      if (seg.type === 'text' && seg.text?.link?.url) {
        return `<a href="${escapeHtml(seg.text.link.url)}">${escapeHtml(text)}</a>`;
      }
      if (seg.annotations?.code) return `<code>${escapeHtml(text)}</code>`;
      if (seg.annotations?.bold) text = `<strong>${text}</strong>`;
      if (seg.annotations?.italic) text = `<em>${text}</em>`;
      if (seg.annotations?.strikethrough) text = `<s>${text}</s>`;
      if (seg.annotations?.underline) text = `<u>${text}</u>`;
      return escapeHtml(text).replace(/\n/g, '<br>');
    })
    .join('');
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function blockToHtml(block) {
  const type = block.type;
  if (!type || block.archived) return '';

  switch (type) {
    case 'paragraph': {
      const rt = block.paragraph?.rich_text;
      if (!rt?.length) return '';
      const inner = richTextToHtml(rt);
      if (!inner.trim()) return '';
      return '<p>' + inner + '</p>';
    }
    case 'heading_1': {
      const h1 = block.heading_1?.rich_text;
      return h1?.length ? '<h2>' + richTextToHtml(h1) + '</h2>' : '';
    }
    case 'heading_2': {
      const h2 = block.heading_2?.rich_text;
      return h2?.length ? '<h3>' + richTextToHtml(h2) + '</h3>' : '';
    }
    case 'heading_3': {
      const h3 = block.heading_3?.rich_text;
      return h3?.length ? '<h4>' + richTextToHtml(h3) + '</h4>' : '';
    }
    case 'bulleted_list_item': {
      const li = block.bulleted_list_item?.rich_text;
      return li?.length ? '<li>' + richTextToHtml(li) + '</li>' : '';
    }
    case 'numbered_list_item': {
      const nli = block.numbered_list_item?.rich_text;
      return nli?.length ? '<li>' + richTextToHtml(nli) + '</li>' : '';
    }
    case 'quote': {
      const q = block.quote?.rich_text;
      return q?.length ? '<blockquote>' + richTextToHtml(q) + '</blockquote>' : '';
    }
    case 'code': {
      const code = block.code?.rich_text;
      return code?.length ? '<pre><code>' + richTextToHtml(code) + '</code></pre>' : '';
    }
    case 'divider':
      return '<hr>';
    case 'image': {
      const img = block.image;
      const url = img?.file?.url || img?.external?.url;
      if (!url) return '';
      const cap = img?.caption?.length ? richTextToHtml(img.caption) : '';
      const figcap = cap ? `<figcaption>${cap}</figcaption>` : '';
      return `<figure><img src="${escapeHtml(url)}" alt="" loading="lazy" />${figcap}</figure>`;
    }
    case 'callout': {
      const callout = block.callout?.rich_text;
      return callout?.length ? '<div class="callout">' + richTextToHtml(callout) + '</div>' : '';
    }
    default:
      return '';
  }
}

async function fetchAllBlockChildren(notion, blockId) {
  const blocks = [];
  let cursor = undefined;
  do {
    const url = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100${cursor ? '&start_cursor=' + encodeURIComponent(cursor) : ''}`;
    const res = await notion.get(url);
    const data = await res.json();
    blocks.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return blocks;
}

async function blocksToHtml(notion, blocks) {
  const parts = [];
  let inList = null; // 'ul' | 'ol'

  for (const block of blocks) {
    const html = blockToHtml(block);
    if (!html) continue;

    if (block.type === 'bulleted_list_item') {
      if (inList !== 'ul') {
        if (inList) parts.push(`</${inList}>`);
        parts.push('<ul>');
        inList = 'ul';
      }
      parts.push(html);
    } else if (block.type === 'numbered_list_item') {
      if (inList !== 'ol') {
        if (inList) parts.push(`</${inList}>`);
        parts.push('<ol>');
        inList = 'ol';
      }
      parts.push(html);
    } else {
      if (inList) {
        parts.push(`</${inList}>`);
        inList = null;
      }
      parts.push(html);
    }
  }
  if (inList) parts.push(`</${inList}>`);

  return parts.join('\n');
}

function getPropTitle(properties) {
  const p = properties?.Title || properties?.title;
  if (p?.title?.length) return p.title.map((t) => t.plain_text).join('');
  const entry = properties && Object.values(properties).find((v) => v?.title);
  if (entry?.title?.length) return entry.title.map((t) => t.plain_text).join('');
  return 'Untitled';
}

function getPropPublished(properties) {
  const p = properties?.Published || properties?.published;
  const d = p?.date;
  if (d?.start) return d.start;
  const entry = properties && Object.values(properties).find((v) => v?.date);
  return entry?.date?.start || null;
}

function getPropTags(properties) {
  const p = properties?.Tags || properties?.tags;
  if (p?.multi_select?.length) return p.multi_select.map((s) => s.name);
  const entry = properties && Object.values(properties).find((v) => v?.multi_select);
  return entry?.multi_select?.map((s) => s.name) || [];
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  const token = process.env.NOTION_API_KEY;
  const databaseId = (process.env.NOTION_DATABASE_ID || '').replace(/[&\?].*$/, '').trim();

  if (!token || !databaseId) {
    res.status(500).json({
      error: 'Missing NOTION_API_KEY or NOTION_DATABASE_ID',
    });
    return;
  }

  const notion = {
    get: (url, opts = {}) =>
      fetch(url, {
        ...opts,
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
          ...opts.headers,
        },
      }),
    post: (url, body, opts = {}) =>
      fetch(url, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
        ...opts,
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
          ...opts.headers,
        },
      }),
  };

  try {
    // Try with Status filter first, fall back to unfiltered if Status property doesn't exist
    let queryRes = await notion.post(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        filter: {
          property: 'Status',
          select: { equals: 'published' },
        },
        sorts: [{ property: 'Published', direction: 'descending' }],
        page_size: 50,
      }
    );

    // If filter fails (Status property may not exist), retry without filter
    if (!queryRes.ok) {
      const err = await queryRes.json().catch(() => ({}));
      if (err.code === 'validation_error') {
        // Property doesn't exist — try without filter, sort by created_time
        queryRes = await notion.post(
          `https://api.notion.com/v1/databases/${databaseId}/query`,
          {
            sorts: [{ timestamp: 'created_time', direction: 'descending' }],
            page_size: 50,
          }
        );
      }
      if (!queryRes.ok) {
        const retryErr = await queryRes.json().catch(() => err);
        res.status(queryRes.status).json({
          error: retryErr.message || 'Notion query failed',
          code: retryErr.code,
        });
        return;
      }
    }

    const queryData = await queryRes.json();
    const pages = queryData.results || [];
    const posts = [];

    for (const page of pages) {
      const id = page.id;
      const props = page.properties || {};
      const title = getPropTitle(props);
      const publishedAt = getPropPublished(props);
      const tags = getPropTags(props);

      const blockChildren = await fetchAllBlockChildren(notion, id);
      const body = await blocksToHtml(notion, blockChildren);

      posts.push({
        id,
        title,
        publishedAt,
        tags,
        body: body || '',
      });
    }

    if (!Array.isArray(posts)) {
      console.error('posts is not array:', typeof posts, posts);
      return res.status(500).json({ error: 'Invalid response' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify(posts));
  } catch (e) {
    console.error('blog-posts API error:', e);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};
