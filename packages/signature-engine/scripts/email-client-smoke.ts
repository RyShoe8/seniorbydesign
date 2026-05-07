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
