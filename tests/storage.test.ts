import {it,expect} from 'vitest';
import {encodeDraft,decodeDraft} from '../src/lib/order/storage';
import {products} from '../src/data/products';
it('round trips only product quantities and expires after 24 hours',()=>{const selections=[{productId:'mutton-bone',quantity:500,note:'private note'}];const raw=encodeDraft(selections,1000);expect(raw).not.toContain('private note');expect(decodeDraft(raw,products,1001)).toEqual([{productId:'mutton-bone',quantity:500,note:''}]);expect(decodeDraft(raw,products,1000+86400001)).toEqual([])});
it('rejects corrupted, future and invalid drafts',()=>{for(const raw of ['{','null','{}','{"version":1,"savedAt":9000,"items":[]}','{"version":1,"savedAt":1000,"items":[{"productId":"mutton-bone","quantity":-1}]}'])expect(decodeDraft(raw,products,2000)).toEqual([])});
