/**
 * Automated structural checks for Gmail / Outlook / Apple Mail friendly markup.
 * Still paste-test in real clients after deploy (images load, compose quirks).
 */
import assert from 'node:assert/strict';
import { renderSignature } from '../src/index';
import { mockSignatureBrand, mockSignatureTemplate } from '../src/fixtures';

const profile = {
  firstName: 'Test',
  lastName: 'User',
  title: 'COO',
  email: 'test@example.com',
  officePhone: '833-779-3744',
};

const origin = 'https://seniorbydesign.com';

const htmlStandard = renderSignature({
  profile,
  brand: mockSignatureBrand,
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});

assert.match(
  htmlStandard,
  /height="134"/,
  'standard: static logo gets explicit height from measured SBD asset when logoHeightPx unset'
);
assert.doesNotMatch(
  htmlStandard,
  /height:auto/,
  'standard: static logo avoids height:auto so Gmail keeps proportion'
);
assert.match(
  htmlStandard,
  /src="https:\/\/seniorbydesign\.com\/images\/sbd-logo-no-tagline\.png"/,
  'standard: default SBD logo uses canonical direct host (no redirect-prone alias)'
);
assert.match(
  htmlStandard,
  /src="https:\/\/seniorbydesign\.com\/images\/signature\/icon-linkedin\.png\?v=20260510"/,
  'standard: LinkedIn icon uses versioned canonical URL'
);
assert.match(
  htmlStandard,
  /src="https:\/\/seniorbydesign\.com\/images\/signature\/icon-facebook\.png\?v=20260510"/,
  'standard: Facebook icon uses versioned canonical URL'
);
assert.match(
  htmlStandard,
  /src="https:\/\/seniorbydesign\.com\/images\/signature\/icon-instagram\.png\?v=20260510"/,
  'standard: Instagram icon uses versioned canonical URL'
);
assert.doesNotMatch(htmlStandard, /\/api\/image-proxy/i, 'standard: no image proxy URLs in img src');
assert.doesNotMatch(htmlStandard, /src="http:\/\//i, 'standard: no non-HTTPS image URLs');
assert.ok(
  htmlStandard.includes('border-collapse:collapse;margin-top:10px'),
  'standard: social row uses nested table'
);
assert.ok(
  htmlStandard.includes('bgcolor="#e5e5e5"') && htmlStandard.includes('height="1"'),
  'standard: divider uses 1px td (Gmail-safe)'
);

const htmlExplicit = renderSignature({
  profile,
  brand: { ...mockSignatureBrand, logoHeightPx: 72 },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.match(htmlExplicit, /height="72"/, 'standard: explicit logoHeightPx in img attributes');

const htmlStacked = renderSignature({
  profile,
  brand: mockSignatureBrand,
  template: mockSignatureTemplate('stacked'),
  publicSiteOrigin: origin,
});
assert.match(
  htmlStacked,
  /height="134"/,
  'stacked: static logo gets explicit height when logoHeightPx unset'
);
assert.doesNotMatch(htmlStacked, /height:auto/, 'stacked: static logo avoids height:auto');
assert.match(
  htmlStacked,
  /src="https:\/\/seniorbydesign\.com\/images\/sbd-logo-no-tagline\.png"/,
  'stacked: default SBD logo keeps canonical host'
);

const htmlAnimatedLogo = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    logoHeightPx: undefined,
    animation: { enabled: true, gifUrl: 'https://seniorbydesign.com/images/sample.gif' },
  },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.match(
  htmlAnimatedLogo,
  /height:auto/,
  'standard: animated GIF logo without logoHeightPx still uses height:auto'
);

process.stdout.write('email-client-smoke: all checks passed.\n');
