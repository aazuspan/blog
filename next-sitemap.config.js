/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://aazuspan.dev",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
};
