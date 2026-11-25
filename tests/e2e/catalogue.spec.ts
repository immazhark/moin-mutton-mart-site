import {test,expect} from '@playwright/test';
for(const width of [320,360,390,430,1280]){
 test(`request journey and no horizontal overflow at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:850});await page.goto('/');
  await expect(page.getByRole('heading',{name:'Your neighbourhood meat counter.'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Chicken',exact:true}).click();await expect(page.getByRole('heading',{name:'Mutton with bone',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'All',exact:true}).click();await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await page.getByRole('button',{name:'Increase Mutton with bone',exact:true}).click();
  await page.getByRole('button',{name:'Review request'}).click();
  const review=page.getByRole('dialog');await expect(review).toBeVisible();await expect(review.getByText('1 kg',{exact:true})).toBeVisible();
  await review.getByLabel('Cut preference').fill('Medium curry pieces');
  const url=await review.getByRole('link',{name:'Continue on WhatsApp'}).getAttribute('href');
  expect(new URL(url!).pathname).toBe('/918143730054');expect(new URL(url!).searchParams.get('text')).toContain('Medium curry pieces');
  await page.keyboard.press('Escape');await expect(review).not.toBeVisible();await expect(page.getByRole('button',{name:'Review request'})).toBeFocused();
  await page.getByRole('button',{name:'Review request'}).click();await review.getByRole('button',{name:'Remove Mutton with bone'}).click();await expect(review.getByText('Your list is empty.')).toBeVisible();
 });
}
