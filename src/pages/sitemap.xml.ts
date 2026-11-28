import type {APIRoute} from 'astro';
import {canonicalUrl} from '../data/shop';
/** Launch candidate only. All previews retain HTTP noindex; not advertised or submitted. */
export const GET:APIRoute=()=>new Response(
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+canonicalUrl('/')+'</loc></url></urlset>\n',
  {headers:{'Content-Type':'application/xml; charset=utf-8'}},
);
