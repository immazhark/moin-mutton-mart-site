import type {Product} from '../lib/order/order';
// Quantity steps are preview request preferences; shop validation is required before launch.
export const products:Product[]=[
 ['mutton-bone','Mutton with bone','Mutton','g',500,10000],['boneless','Boneless mutton','Mutton','g',500,10000],['leg','Mutton leg piece','Mutton','piece',1,10],['liver','Liver only','Speciality cuts','g',250,2000],['liver-set','Liver set','Speciality cuts','set',1,10],['kidney','Kidney','Speciality cuts','piece',1,20],['boti','Boti set','Speciality cuts','set',1,10],['brain','Brain','Speciality cuts','piece',1,10],['head','Head','Speciality cuts','piece',1,5],['paya','Paya · four-piece set','Speciality cuts','set',1,10],['live-chicken','Live chicken','Chicken','piece',1,10],['skinless','Skinless chicken','Chicken','g',500,10000],['desi','Desi chicken','Chicken','piece',1,10]
].map(([id,name,category,unit,step,max])=>({id,name,category,unit,step,max,pricingBasis:null} as Product));
