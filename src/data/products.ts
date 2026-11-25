import type { Product, Unit } from '../lib/order/order';

// Quantity steps are proposed request preferences; the owner must approve them before launch.
// `cuts` stays empty until the shop supplies approved cut names. `pricingBasis` stays null
// until the shop confirms how each product is charged (including chicken weight basis).
const row = (
  id: string,
  name: string,
  category: string,
  unit: Unit,
  step: number,
  max: number,
  setContents?: string,
): Product => ({ id, name, category, unit, step, max, pricingBasis: null, ...(setContents ? { setContents } : {}) });

export const categories = ['All', 'Mutton', 'Chicken', 'Speciality cuts'] as const;

export const products: Product[] = [
  row('mutton-bone', 'Mutton with bone', 'Mutton', 'g', 500, 10000),
  row('boneless', 'Boneless mutton', 'Mutton', 'g', 500, 10000),
  row('leg', 'Mutton leg piece', 'Mutton', 'piece', 1, 10),
  row('liver', 'Liver only', 'Speciality cuts', 'g', 250, 2000),
  row('liver-set', 'Liver set', 'Speciality cuts', 'set', 1, 10),
  row('kidney', 'Kidney', 'Speciality cuts', 'piece', 1, 20),
  row('boti', 'Boti set', 'Speciality cuts', 'set', 1, 10),
  row('brain', 'Brain', 'Speciality cuts', 'piece', 1, 10),
  row('head', 'Head', 'Speciality cuts', 'piece', 1, 5),
  row('paya', 'Paya', 'Speciality cuts', 'set', 1, 10, '4 pieces'),
  row('live-chicken', 'Live chicken', 'Chicken', 'piece', 1, 10),
  row('skinless', 'Skinless chicken', 'Chicken', 'g', 500, 10000),
  row('desi', 'Desi chicken', 'Chicken', 'piece', 1, 10),
];
