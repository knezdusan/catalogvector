/**
 * U-5 SEED — create a product with distinctive metafields on the dev store.
 *
 * WHY THIS EXISTS
 * U-5 asks: "Do Catalog results reflect merchant metafields at all?" The only
 * way to answer is to seed a product with distinctive structured metafields,
 * wait out the §2.6 catalog freshness delay (days, not minutes), then query
 * the Global Catalog and check whether the metafield values appear.
 *
 * This script does the seeding. The check happens later, separately, after
 * the catalog has had time to index the product.
 *
 * WHAT IT CREATES
 * A single product with a distinctive title and three metafields:
 *   - custom.u5_test_token: a unique string that won't appear anywhere else
 *   - custom.u5_spec_value: a numeric spec value (e.g., "4.2V")
 *   - custom.u5_fitment_note: a fitment string (e.g., "U5-TEST-VERTICAL-ONLY")
 *
 * If any of these values later appear in metadata.tech_specs or any other
 * Catalog response field, metafields are reaching the Catalog. If they don't,
 * metafields are invisible to the Catalog (confirming TDD §2.3's blind spot).
 *
 * USAGE
 *   npx tsx scripts/seed-u5-metafields.ts
 *
 * OUTPUT
 *   Console output with the product ID and metafield IDs.
 *   scripts/output/u5-seed-<timestamp>.json — full transcript.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(import.meta.dirname, '..', '.env') });

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'catalogvector';

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error(
    'SHOPIFY_ACCESS_TOKEN must be set in .env.\n' +
      'Get it from the dev store Admin → Apps → Develop apps → Create an app →\n' +
      'Configure Admin API scopes (write_products, write_metafields) → Install →\n' +
      'Get Admin API access token.',
  );
  process.exit(1);
}

const ADMIN_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2026-04/graphql.json`;

/** Unique token that won't appear anywhere else in any catalog. */
const U5_TOKEN = `U5SEED-${Date.now()}-CATALOGVECTOR`;

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ADMIN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`GraphQL error: ${res.status} ${res.statusText}\n${JSON.stringify(json, null, 2)}`);
  }
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors, null, 2)}`);
  }
  return json.data as T;
}

async function main() {
  console.log('\nU-5 SEED — creating product with distinctive metafields');
  console.log('═'.repeat(64));
  console.log(`Store: ${SHOPIFY_STORE}.myshopify.com`);
  console.log(`Token: ${U5_TOKEN}`);

  // ── 1. Create the product ──────────────────────────────────────────────
  console.log('\n── 1. Creating product ──────────────────────────────\n');

  const createMutation = `
    mutation CreateProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          handle
          title
          status
          onlineStoreUrl
        }
        userErrors { field message }
      }
    }
  `;

  const productInput = {
    title: `U5 Test Product ${U5_TOKEN}`,
    descriptionHtml: `<p>This is a U5 test product for CatalogVector. Unique token: ${U5_TOKEN}. Voltage: 4.2V. Fitment: U5-TEST-VERTICAL-ONLY.</p>`,
    vendor: 'CatalogVector Test',
    productType: 'Test Component',
    status: 'ACTIVE',
    tags: ['u5-test', 'catalogvector-probe'],
    variants: [
      {
        price: '99.99',
        sku: `U5-${Date.now()}`,
        inventoryManagement: 'SHOPIFY',
        inventoryQuantities: [{ availableQuantity: 1, locationId: null }],
      },
    ],
  };

  const createResult = await gql<{
    productCreate: { product: { id: string; handle: string; title: string; status: string; onlineStoreUrl: string | null }; userErrors: unknown[] };
  }>(createMutation, { input: productInput });

  if (createResult.productCreate.userErrors.length > 0) {
    console.error('Product creation errors:', JSON.stringify(createResult.productCreate.userErrors, null, 2));
    process.exit(1);
  }

  const product = createResult.productCreate.product;
  console.log(`  Product ID: ${product.id}`);
  console.log(`  Handle: ${product.handle}`);
  console.log(`  Status: ${product.status}`);
  console.log(`  URL: ${product.onlineStoreUrl ?? '(not published yet)'}`);

  // ── 2. Add metafields ──────────────────────────────────────────────────
  console.log('\n── 2. Adding metafields ─────────────────────────────\n');

  const metafields = [
    {
      namespace: 'custom',
      key: 'u5_test_token',
      value: U5_TOKEN,
      type: 'single_line_text_field',
    },
    {
      namespace: 'custom',
      key: 'u5_spec_value',
      value: '4.2V',
      type: 'single_line_text_field',
    },
    {
      namespace: 'custom',
      key: 'u5_fitment_note',
      value: 'U5-TEST-VERTICAL-ONLY',
      type: 'single_line_text_field',
    },
  ];

  const metafieldMutation = `
    mutation UpdateMetafields($metafields: [MetafieldInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors { field message }
      }
    }
  `;

  // metafieldsSet requires ownerId — we need to use the product-specific mutation
  const productMetafieldMutation = `
    mutation UpdateProductMetafields($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          metafields(first: 10) {
            edges {
              node {
                id
                namespace
                key
                value
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;

  // Use metafieldsSet with ownerId
  const metafieldsSetMutation = `
    mutation MetafieldsSet($metafields: [MetafieldSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key value }
        userErrors { field message }
      }
    }
  `;

  const metafieldInputs = metafields.map((m) => ({
    ...m,
    ownerId: product.id,
  }));

  const metafieldResult = await gql<{
    metafieldsSet: { metafields: Array<{ id: string; namespace: string; key: string; value: string }>; userErrors: unknown[] };
  }>(metafieldsSetMutation, { metafields: metafieldInputs });

  if (metafieldResult.metafieldsSet.userErrors.length > 0) {
    console.error('Metafield errors:', JSON.stringify(metafieldResult.metafieldsSet.userErrors, null, 2));
    process.exit(1);
  }

  for (const mf of metafieldResult.metafieldsSet.metafields) {
    console.log(`  ${mf.namespace}.${mf.key} = "${mf.value}" (ID: ${mf.id})`);
  }

  // ── 3. Summary ─────────────────────────────────────────────────────────
  console.log('\n── 3. Summary ────────────────────────────────────────\n');
  console.log(`  Product created with 3 distinctive metafields.`);
  console.log(`  Unique token: ${U5_TOKEN}`);
  console.log(`  Wait at least 24-48 hours for catalog indexing (TDD §2.6).`);
  console.log(`  Then run: npx tsx scripts/check-u5-metafields.ts`);
  console.log(`  (or query the Global Catalog for "${U5_TOKEN}")`);

  // ── 4. Persist ──────────────────────────────────────────────────────────
  const dir = join(process.cwd(), 'scripts', 'output');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = join(dir, `u5-seed-${stamp}.json`);
  await writeFile(
    path,
    JSON.stringify(
      {
        seededAt: new Date().toISOString(),
        store: SHOPIFY_STORE,
        product,
        metafields: metafieldResult.metafieldsSet.metafields,
        u5Token: U5_TOKEN,
        note: 'Wait 24-48h for catalog indexing, then query Global Catalog for the U5 token.',
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`\n  Transcript → ${path}\n`);
}

main().catch((err) => {
  console.error('\nSeed crashed:', err);
  process.exit(1);
});
