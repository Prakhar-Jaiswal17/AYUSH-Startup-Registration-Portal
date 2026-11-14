const http = require('http');
const express = require('express');
const assert = require('assert');
const resourceRoutes = require('./src/routes/resources');

const app = express();
app.use(express.json());
app.use('/api/resources', resourceRoutes);

let server;
let baseUrl;

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Starting Resources API Test Suite...\n');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  try {
    // Test 1: GET /api/resources returns 200 with paginated envelope
    console.log('Test 1: Default GET /api/resources');
    const res1 = await request('/api/resources');
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.success, true);
    assert.ok(Array.isArray(res1.body.data.items));
    assert.strictEqual(res1.body.data.items.length, 10);
    assert.strictEqual(res1.body.data.pagination.page, 1);
    assert.strictEqual(res1.body.data.pagination.limit, 10);
    assert.strictEqual(res1.body.data.pagination.total, 11);
    assert.strictEqual(res1.body.data.pagination.totalPages, 2);
    console.log('  ✓ Returns paginated list with page 1 limit 10, total 11, totalPages 2');

    // Test 2: Pagination page 2
    console.log('Test 2: Pagination page 2 limit 5');
    const res2 = await request('/api/resources?page=2&limit=5');
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.data.items.length, 5);
    assert.strictEqual(res2.body.data.pagination.page, 2);
    assert.strictEqual(res2.body.data.pagination.limit, 5);
    assert.strictEqual(res2.body.data.pagination.total, 11);
    assert.strictEqual(res2.body.data.pagination.totalPages, 3);
    console.log('  ✓ Correctly slices items for page 2 with limit 5');

    // Test 3: Category filtering
    console.log('Test 3: Category filter - Regulatory');
    const res3 = await request('/api/resources?category=Regulatory');
    assert.strictEqual(res3.status, 200);
    assert.ok(res3.body.data.items.length >= 2);
    res3.body.data.items.forEach((item) => {
      assert.strictEqual(item.category.toLowerCase(), 'regulatory');
    });
    console.log(`  ✓ Filtered ${res3.body.data.items.length} Regulatory items correctly`);

    // Test 4: Category filter case-insensitivity & "All" handling
    console.log('Test 4: Category "All" handling');
    const res4 = await request('/api/resources?category=All');
    assert.strictEqual(res4.status, 200);
    assert.strictEqual(res4.body.data.pagination.total, 11);
    console.log('  ✓ Category "All" returns all resources');

    // Test 5: Search filtering
    console.log('Test 5: Search filter - "Ayurveda"');
    const res5 = await request('/api/resources?search=Ayurveda');
    assert.strictEqual(res5.status, 200);
    assert.ok(res5.body.data.items.length > 0);
    res5.body.data.items.forEach((item) => {
      const match = `${item.title} ${item.category} ${item.summary} ${item.description || ''}`
        .toLowerCase()
        .includes('ayurveda');
      assert.ok(match, `Item ${item.id} should match search term`);
    });
    console.log(`  ✓ Search returned ${res5.body.data.items.length} matching items`);

    // Test 6: Combined category and search
    console.log('Test 6: Category + Search filter');
    const res6 = await request('/api/resources?category=Regulatory&search=FSSAI');
    assert.strictEqual(res6.status, 200);
    assert.strictEqual(res6.body.data.items.length, 1);
    assert.strictEqual(res6.body.data.items[0].id, 'res_008');
    console.log('  ✓ Combined category and search accurately found res_008');

    // Test 7: GET /api/resources/:id - Valid ID
    console.log('Test 7: Detail lookup GET /api/resources/:id');
    const res7 = await request('/api/resources/res_001');
    assert.strictEqual(res7.status, 200);
    assert.strictEqual(res7.body.success, true);
    assert.strictEqual(res7.body.data.id, 'res_001');
    assert.strictEqual(res7.body.data.title, 'Ministry of AYUSH — Official Portal');
    assert.strictEqual(res7.body.data.url, 'https://ayush.gov.in');
    assert.strictEqual(res7.body.data.isAvailable, true);
    console.log('  ✓ Found single resource detail with expected fields');

    // Test 8: GET /api/resources/:id - Invalid ID (404)
    console.log('Test 8: Detail lookup 404 for nonexistent ID');
    const res8 = await request('/api/resources/res_unknown_999');
    assert.strictEqual(res8.status, 404);
    assert.strictEqual(res8.body.success, false);
    assert.strictEqual(res8.body.error, 'Resource not found.');
    console.log('  ✓ 404 returned for unknown resource ID');

    // Test 9: Input validation - Invalid limit > 50
    console.log('Test 9: Invalid limit > 50');
    const res9 = await request('/api/resources?limit=100');
    assert.strictEqual(res9.status, 400);
    assert.strictEqual(res9.body.success, false);
    console.log('  ✓ 400 returned when limit exceeds maximum');

    // Test 10: Input validation - Negative/invalid page
    console.log('Test 10: Invalid page');
    const res10 = await request('/api/resources?page=0');
    assert.strictEqual(res10.status, 400);
    assert.strictEqual(res10.body.success, false);
    console.log('  ✓ 400 returned for page=0');

    // Test 11: Verify URL destinations and absence of "#" placeholders
    console.log('Test 11: Destination URLs verification');
    const res11 = await request('/api/resources?limit=50');
    const items = res11.body.data.items;
    items.forEach((item) => {
      assert.notStrictEqual(item.url, '#', `Resource ${item.id} still has placeholder '#' url!`);
      assert.ok('summary' in item, `Resource ${item.id} missing summary`);
      assert.ok('description' in item, `Resource ${item.id} missing description`);
      assert.ok('isAvailable' in item, `Resource ${item.id} missing isAvailable`);
      assert.ok('type' in item, `Resource ${item.id} missing type`);
    });

    const res003 = items.find((i) => i.id === 'res_003');
    assert.strictEqual(res003.url, 'https://ayushportal.nic.in');

    const res007 = items.find((i) => i.id === 'res_007');
    assert.strictEqual(res007.url, '/how-it-works');

    const res008 = items.find((i) => i.id === 'res_008');
    assert.strictEqual(res008.url, 'https://foscos.fssai.gov.in');

    const res009 = items.find((i) => i.id === 'res_009');
    assert.strictEqual(res009.url, 'https://e-aushadhi.gov.in');

    const res010 = items.find((i) => i.id === 'res_010');
    assert.strictEqual(res010.url, 'https://ayushexcil.in');

    const res011Item = items.find((i) => i.id === 'res_011');
    assert.strictEqual(res011Item.url, null);
    assert.strictEqual(res011Item.isAvailable, false);
    console.log('  ✓ All 11 resources verified: zero "#" placeholders, verified URLs, unavailable items labeled');

    // Test 12: Sorting by title asc and desc
    console.log('Test 12: Sorting by title (asc & desc)');
    const res12Asc = await request('/api/resources?limit=50&sortBy=title&order=asc');
    assert.strictEqual(res12Asc.status, 200);
    const titlesAsc = res12Asc.body.data.items.map((i) => i.title);
    const sortedTitlesAsc = [...titlesAsc].sort((a, b) => a.localeCompare(b));
    assert.deepStrictEqual(titlesAsc, sortedTitlesAsc);

    const res12Desc = await request('/api/resources?limit=50&sortBy=title&order=desc');
    assert.strictEqual(res12Desc.status, 200);
    const titlesDesc = res12Desc.body.data.items.map((i) => i.title);
    const sortedTitlesDesc = [...titlesDesc].sort((a, b) => b.localeCompare(a));
    assert.deepStrictEqual(titlesDesc, sortedTitlesDesc);
    console.log('  ✓ Sorting by title in both asc and desc order functions correctly');

    // Test 13: Invalid sortBy rejection
    console.log('Test 13: Invalid sortBy parameter');
    const res13 = await request('/api/resources?sortBy=unknownField');
    assert.strictEqual(res13.status, 400);
    assert.strictEqual(res13.body.success, false);
    console.log('  ✓ 400 returned when sortBy is invalid');

    console.log('\n🎉 ALL 13 TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  if (server) server.close();
  process.exit(1);
});
