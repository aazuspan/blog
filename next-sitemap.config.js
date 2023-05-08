/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://www.aazuspan.dev",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
};
