const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`PASS: ${name}`);
        passed++;
    } catch (error) {
        console.error(`FAIL: ${name}`);
        console.error(`       ${error.message}`);
        failed++;
    }
}

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function loadPanel() {
    const values = new Map();
    const context = {
        window: { SEED: seed },
        localStorage: {
            getItem: key => values.has(key) ? values.get(key) : null,
            setItem: (key, value) => values.set(key, value),
            removeItem: key => values.delete(key)
        },
        location: { reload() {} }
    };

    vm.createContext(context);
    vm.runInContext(read('js/panel.js'), context, {
        filename: 'js/panel.js'
    });

    return { panel: context.window.P, values };
}

console.log('');
console.log('========================================');
console.log('      StaySmart Automated Test Suite');
console.log('========================================');
console.log('');


// --------------------------------------------------
// 1. PROJECT STRUCTURE TESTS
// --------------------------------------------------

test('Student page exists', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'index.html')));
});

test('Owner dashboard exists', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'vendor.html')));
});

test('Admin panel exists', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'admin.html')));
});

test('Main stylesheet exists', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'css/style.css')));
});


// --------------------------------------------------
// 2. HTML ASSET INTEGRATION TESTS
// --------------------------------------------------

function checkHtmlAssets(htmlFile) {
    const html = read(htmlFile);

    const references = [
        ...html.matchAll(/(?:src|href)="([^"]+)"/g)
    ].map(match => match[1])
     .filter(ref =>
        !ref.startsWith('http') &&
        !ref.startsWith('#') &&
        !ref.startsWith('data:')
     );

    for (const ref of references) {
        const filePath = path.join(ROOT, ref);

        assert.ok(
            fs.existsSync(filePath),
            `${htmlFile} references missing file: ${ref}`
        );
    }
}

test('Student page assets are valid', () => {
    checkHtmlAssets('index.html');
});

test('Owner dashboard assets are valid', () => {
    checkHtmlAssets('vendor.html');
});

test('Admin panel assets are valid', () => {
    checkHtmlAssets('admin.html');
});


// --------------------------------------------------
// 3. JAVASCRIPT SYNTAX TESTS
// --------------------------------------------------

const jsFiles = [
    'js/data.js',
    'js/panel.js',
    'js/app.js',
    'js/vendor.js',
    'js/admin.js'
];

for (const file of jsFiles) {
    test(`${file} has valid JavaScript syntax`, () => {
        const source = read(file);

        new vm.Script(source, {
            filename: file
        });
    });
}


// --------------------------------------------------
// 4. LOAD REAL APPLICATION DATA
// --------------------------------------------------

let seed;

test('StaySmart data.js loads successfully', () => {
    const source = read('js/data.js');

    const context = {
        window: {}
    };

    vm.createContext(context);
    vm.runInContext(source, context);

    seed = context.window.SEED;

    assert.ok(seed, 'window.SEED was not created');
});


// --------------------------------------------------
// 5. DATA STRUCTURE TESTS
// --------------------------------------------------

test('Seed data contains required collections', () => {
    const required = [
        'owners',
        'students',
        'properties',
        'bookings',
        'earnings',
        'reviews',
        'feedback',
        'notifications',
        'favorites',
        'settings',
        'subareas',
        'accounts'
    ];

    for (const collection of required) {
        assert.ok(
            seed[collection],
            `Missing collection: ${collection}`
        );
    }
});

test('Seed data contains properties', () => {
    assert.ok(
        seed.properties.length > 0,
        'No properties found'
    );
});

test('Seed data contains bookings', () => {
    assert.ok(
        seed.bookings.length > 0,
        'No bookings found'
    );
});

test('Seed data contains reviews', () => {
    assert.ok(
        seed.reviews.length > 0,
        'No reviews found'
    );
});


// --------------------------------------------------
// 6. DEMO LOGIN TESTS
// --------------------------------------------------

test('All required demo accounts exist', () => {

    const requiredAccounts = [
        'student@demo.com',
        'owner@demo.com',
        'owner2@demo.com',
        'admin@demo.com'
    ];

    for (const email of requiredAccounts) {

        const account = seed.accounts.find(
            a => a.email === email
        );

        assert.ok(
            account,
            `Missing demo account: ${email}`
        );

        assert.ok(
            account.password,
            `Password missing for ${email}`
        );

        assert.ok(
            account.role,
            `Role missing for ${email}`
        );
    }
});


// --------------------------------------------------
// 7. PROPERTY DATA TESTS
// --------------------------------------------------

test('All properties have valid owners', () => {

    const ownerIds = new Set(
        seed.owners.map(owner => owner.id)
    );

    for (const property of seed.properties) {

        assert.ok(
            ownerIds.has(property.ownerId),
            `Property ${property.id} has invalid ownerId`
        );
    }
});

test('All properties have valid rent values', () => {

    for (const property of seed.properties) {

        assert.ok(
            Number(property.rent) > 0,
            `Property ${property.id} has invalid rent`
        );
    }
});

test('All properties have valid statuses', () => {

    const validStatuses = [
        'available',
        'occupied',
        'unavailable'
    ];

    for (const property of seed.properties) {

        assert.ok(
            validStatuses.includes(property.status),
            `Property ${property.id} has invalid status`
        );
    }
});

test('Every property image references an existing local asset', () => {

    for (const property of seed.properties) {
        assert.ok(
            Array.isArray(property.images) && property.images.length > 0,
            `Property ${property.id} has no images`
        );

        for (const image of property.images) {
            assert.ok(
                fs.existsSync(path.join(ROOT, image)),
                `Property ${property.id} references missing image: ${image}`
            );
        }
    }
});


// --------------------------------------------------
// 8. BOOKING RELATIONSHIP TESTS
// --------------------------------------------------

test('All bookings reference valid students', () => {

    const studentIds = new Set(
        seed.students.map(student => student.id)
    );

    for (const booking of seed.bookings) {

        assert.ok(
            studentIds.has(booking.studentId),
            `Booking ${booking.id} has invalid studentId`
        );
    }
});

test('All bookings reference valid properties', () => {

    const propertyIds = new Set(
        seed.properties.map(property => property.id)
    );

    for (const booking of seed.bookings) {

        assert.ok(
            propertyIds.has(booking.propertyId),
            `Booking ${booking.id} has invalid propertyId`
        );
    }
});

test('Booking owners match property owners', () => {

    for (const booking of seed.bookings) {
        const property = seed.properties.find(
            item => item.id === booking.propertyId
        );

        assert.ok(
            seed.owners.some(owner => owner.id === booking.ownerId),
            `Booking ${booking.id} has invalid ownerId`
        );
        assert.strictEqual(
            booking.ownerId,
            property.ownerId,
            `Booking ${booking.id} owner does not own its property`
        );
    }
});

test('Bookings have valid statuses, dates, and totals', () => {

    const validStatuses = [
        'pending',
        'approved',
        'active',
        'completed',
        'rejected',
        'cancelled'
    ];

    for (const booking of seed.bookings) {
        assert.ok(
            validStatuses.includes(booking.status),
            `Booking ${booking.id} has invalid status: ${booking.status}`
        );
        assert.ok(
            Number.isInteger(booking.months) && booking.months > 0,
            `Booking ${booking.id} has invalid lease duration`
        );
        assert.match(
            booking.start,
            /^\d{4}-\d{2}-\d{2}$/,
            `Booking ${booking.id} has invalid start date`
        );
        assert.match(
            booking.end,
            /^\d{4}-\d{2}-\d{2}$/,
            `Booking ${booking.id} has invalid end date`
        );
        assert.ok(
            new Date(booking.end) > new Date(booking.start),
            `Booking ${booking.id} ends before it starts`
        );
        assert.strictEqual(
            booking.total,
            booking.rent * booking.months + booking.deposit,
            `Booking ${booking.id} has an incorrect total`
        );
    }
});


// --------------------------------------------------
// 9. REVIEW TESTS
// --------------------------------------------------

test('All reviews reference valid properties', () => {

    const propertyIds = new Set(
        seed.properties.map(property => property.id)
    );

    for (const review of seed.reviews) {

        assert.ok(
            propertyIds.has(review.propertyId),
            `Review ${review.id} has invalid propertyId`
        );
    }
});

test('All review ratings are between 1 and 5', () => {

    for (const review of seed.reviews) {

        assert.ok(
            review.rating >= 1 &&
            review.rating <= 5,
            `Review ${review.id} has invalid rating`
        );
    }
});

test('All reviews reference valid students', () => {

    const studentIds = new Set(
        seed.students.map(student => student.id)
    );

    for (const review of seed.reviews) {
        assert.ok(
            studentIds.has(review.studentId),
            `Review ${review.id} has invalid studentId`
        );
    }
});


// --------------------------------------------------
// 10. APPLICATION BUSINESS RULE TESTS
// --------------------------------------------------

test('Commission rate is configured', () => {

    const rate = Number(seed.settings.commission_rate);

    assert.ok(
        rate >= 0 && rate <= 100,
        `Invalid commission rate: ${rate}`
    );
});

test('All accounts use valid roles', () => {

    const validRoles = [
        'student',
        'owner',
        'admin'
    ];

    for (const account of seed.accounts) {

        assert.ok(
            validRoles.includes(account.role),
            `Invalid account role: ${account.role}`
        );
    }
});

test('Shared UI helpers render booking statuses and escape untrusted text', () => {

    const { panel } = loadPanel();
    const statuses = [
        'pending',
        'approved',
        'active',
        'completed',
        'rejected',
        'cancelled'
    ];

    for (const status of statuses) {
        assert.strictEqual(
            panel.statusCls(status),
            `status-${status}`,
            `Booking status ${status} has no matching CSS class`
        );
        assert.ok(
            panel.pill(status).includes(`>${status[0].toUpperCase()}${status.slice(1)}</span>`),
            `Booking status ${status} is not displayed correctly`
        );
    }

    assert.strictEqual(
        panel.esc('<script>alert("x")</script>'),
        '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
});

test('Shared UI helpers persist booking updates in local storage', () => {

    const { panel, values } = loadPanel();
    panel.db.bookings.push({
        id: 9999,
        propertyId: 1,
        studentId: 7,
        ownerId: 2,
        status: 'pending'
    });
    panel.save();

    const saved = JSON.parse(values.get('sh_db_v1'));
    const booking = saved.bookings.find(item => item.id === 9999);

    assert.ok(booking, 'Booking was not saved to local storage');
    assert.strictEqual(booking.status, 'pending');
});


// --------------------------------------------------
// RESULT
// --------------------------------------------------

console.log('');
console.log('========================================');
console.log(`Tests passed : ${passed}`);
console.log(`Tests failed : ${failed}`);
console.log('========================================');

if (failed > 0) {
    console.error('');
    console.error('StaySmart TEST SUITE FAILED');
    process.exit(1);
}

console.log('');
console.log('StaySmart TEST SUITE PASSED');
process.exit(0);