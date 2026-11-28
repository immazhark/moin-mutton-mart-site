import {SHOP_WHATSAPP} from '../lib/order/order';
import type {HoursSchedule} from '../lib/shop/hours';

interface ShopFacts {
  name:string;origin:string;neighbourhood:string;city:string;region:string;country:string;
  phone:string;phoneDisplay:string;instagram:string;
  streetAddress:string|null;mapPin:string|null;hours:HoursSchedule|null;
}
/** Public-safe facts already supplied in docs/ARCHITECTURE.md.
 * The street spelling, verified business pin and hours remain owner-confirmation gates. */
export const shop:Readonly<ShopFacts>=Object.freeze({
  name:'Moin Mutton Mart',origin:'https://moinmuttonmart.in',
  neighbourhood:'Mallepally',city:'Hyderabad',region:'Telangana',country:'IN',
  phone:'+'+SHOP_WHATSAPP,phoneDisplay:'+91 81437 30054',
  instagram:'https://www.instagram.com/moin_mutton_mart/',
  streetAddress:null,mapPin:null,hours:null,
});
export const locality=shop.neighbourhood+', '+shop.city;
export const callUrl='tel:'+shop.phone;
export const whatsappUrl='https://wa.me/'+SHOP_WHATSAPP;
export const localityMapUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(locality+', India');
export const homeTitle=shop.name+' | Mutton & Chicken in '+locality;
export const homeDescription='Browse the mutton, chicken and speciality cuts at Moin Mutton Mart in Mallepally, Hyderabad. Prepare a WhatsApp request and confirm rates and availability with the shop.';
export const canonicalUrl=(path:'/'|'/privacy/')=>shop.origin+path;
export const socialLogo=shop.origin+'/images/logo.png';
type GraphNode=Record<string,unknown>&{address?:Record<string,string>};
/** Deliberately partial LocalBusiness entity, not a claim of rich-result eligibility.
 * No product offers, reviews, exact street/pin, delivery area or hours until verified.
 * Update visible facts and schema together at the launch gate. */
export function shopGraph():{'@context':string;'@graph':GraphNode[]}{
  const home=canonicalUrl('/');
  const business=home+'#shop',site=home+'#website',page=home+'#webpage';
  return {'@context':'https://schema.org','@graph':[
    {'@type':'Store','@id':business,name:shop.name,url:home,telephone:shop.phone,
      description:homeDescription,logo:socialLogo,
      address:{'@type':'PostalAddress',addressLocality:shop.city,addressRegion:shop.region,addressCountry:shop.country},
      sameAs:[shop.instagram]},
    {'@type':'WebSite','@id':site,name:shop.name,url:home,publisher:{'@id':business},inLanguage:'en-IN'},
    {'@type':'WebPage','@id':page,name:homeTitle,url:home,description:homeDescription,isPartOf:{'@id':site},about:{'@id':business},inLanguage:'en-IN'},
  ]};
}
export const questions=[
  {question:'How do I know today’s rate?',answer:'The counter shows a rate when current information and the charging unit are confirmed. Otherwise, ask the shop for today’s rate. The final price and weight are confirmed by the shop.'},
  {question:'How do I request my preferred cut?',answer:'Choose an item and quantity, review your request, then write your preparation preference next to the item. The shop confirms whether that cut is available.'},
  {question:'Can I collect my request or ask for delivery?',answer:'Choose pickup, delivery or Not sure yet when reviewing your request. Confirm the collection time or delivery area, charges and timing directly with the shop.'},
  {question:'Is my order confirmed when I open WhatsApp?',answer:'No. You review and send the message yourself. The shop confirms availability, final weight, price and timing. There is no payment on this website.'},
] as const;
