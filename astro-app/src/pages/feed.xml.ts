import type { APIRoute } from 'astro';
import { getJobs } from '@/lib/data';
import { generateJobSlug } from '@/lib/utils';


export const GET: APIRoute = async () => {
  const jobs = getJobs();
  const baseUrl = "https://www.devjobs.site";

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
        <title>DevJobs.site | Remote Developer Jobs</title>
        <link>${baseUrl}</link>
        <description>The latest remote developer, engineering, and tech jobs updated daily.</description>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${jobs.slice(0, 100).map((job) => {
          const jobUrl = `${baseUrl}/jobs/${generateJobSlug(job)}`;
          return `
            <item>
              <title><![CDATA[${job.title} at ${job.company}]]></title>
              <link>${jobUrl}</link>
              <guid isPermaLink="true">${jobUrl}</guid>
              <pubDate>${new Date(job.posted_at || new Date()).toUTCString()}</pubDate>
              <description><![CDATA[${job.description || "View full job description on our site."}]]></description>
            </item>
          `;
        }).join("")}
    </channel>
  </rss>`;

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
};
