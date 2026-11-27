import {describe,expect,it} from 'vitest';
import {validatePublicConfig} from '../src/lib/catalogue/firebase-browser';

const config={apiKey:'fixture',authDomain:'moin-mutton-mart.firebaseapp.com',projectId:'moin-mutton-mart',appId:'fixture',allowedHost:'moinmuttonmart.in'};
describe('Firebase environment boundary',()=>{
  it('rejects missing values and production config on preview hosts',()=>{
    expect(validatePublicConfig({},'moinmuttonmart.in')).toBeNull();
    expect(validatePublicConfig(config,'moin-mutton-mart-site.pages.dev')).toBeNull();
    expect(validatePublicConfig({...config,allowedHost:'preview.pages.dev'},'preview.pages.dev')).toBeNull();
    expect(validatePublicConfig({...config,authDomain:'https://bad.example'},'moinmuttonmart.in')).toBeNull();
    expect(validatePublicConfig({...config,projectId:'demo-moin-test'},'moinmuttonmart.in')).toBeNull();
  });
  it('accepts exact approved host and independent preview project',()=>{
    expect(validatePublicConfig(config,'moinmuttonmart.in')).toEqual(config);
    const preview={...config,projectId:'demo-moin-test',allowedHost:'preview.pages.dev',authDomain:'demo-moin-test.firebaseapp.com'};
    expect(validatePublicConfig(preview,'preview.pages.dev')).toEqual(preview);
    expect(validatePublicConfig(preview,'other.pages.dev')).toBeNull();
  });
});
