const boardSubs = {
    'Bed & Breakfast': 'Breakfast Included',
    'Half Board': 'Breakfast & Dinner',
    'Full Board': 'All Meals Included',
    'All Inclusive': 'All Meals & Drinks',
    'Room Only': ''
};

function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dateFromStr(str) {
    return str ? new Date(str + 'T00:00:00') : null;
}

function toInputDate(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function diffNights(ci, co) {
    if (!ci || !co) return null;
    const diff = (new Date(co + 'T00:00:00') - new Date(ci + 'T00:00:00')) / 86400000;
    return diff > 0 ? diff : null;
}

// ── SYNC: Check-In changed → recalculate checkout if nights set ──
function onCheckInChange() {
    clearError('checkIn');
    clearError('checkOut');
    const ci = document.getElementById('checkIn').value;
    const nights = parseInt(document.getElementById('nights').value);
    if (ci && nights > 0) {
        const coDate = new Date(ci + 'T00:00:00');
        coDate.setDate(coDate.getDate() + nights);
        document.getElementById('checkOut').value = toInputDate(coDate);
        clearError('nights');
    } else {
        // try to recalc nights from existing checkout
        const co = document.getElementById('checkOut').value;
        const n = diffNights(ci, co);
        if (n) {
            document.getElementById('nights').value = n;
            updateNightsBadge(n);
        }
    }
    update();
}

// ── SYNC: Nights changed → update checkout ──
function onNightsChange() {
    clearError('nights');
    clearError('checkOut');
    const ci = document.getElementById('checkIn').value;
    const nights = parseInt(document.getElementById('nights').value);
    if (!ci) {
        showError('checkIn', 'Please enter check-in date first.');
        document.getElementById('nights').value = '';
        return;
    }
    if (isNaN(nights) || nights < 1) {
        document.getElementById('checkOut').value = '';
        updateNightsBadge(null);
        update();
        return;
    }
    const coDate = new Date(ci + 'T00:00:00');
    coDate.setDate(coDate.getDate() + nights);
    document.getElementById('checkOut').value = toInputDate(coDate);
    updateNightsBadge(nights);
    update();
}

// ── SYNC: Check-Out changed → recalculate nights ──
function onCheckOutChange() {
    clearError('checkOut');
    clearError('nights');
    const ci = document.getElementById('checkIn').value;
    const co = document.getElementById('checkOut').value;
    if (!ci) {
        showError('checkIn', 'Please enter check-in date first.');
        document.getElementById('checkOut').value = '';
        return;
    }
    const n = diffNights(ci, co);
    if (!n) {
        showError('checkOut', 'Check-out must be after check-in.');
        document.getElementById('nights').value = '';
        updateNightsBadge(null);
    } else {
        document.getElementById('nights').value = n;
        updateNightsBadge(n);
        clearError('checkOut');
    }
    update();
}

function updateNightsBadge(n) {
    const badge = document.getElementById('nightsBadge');
    badge.innerHTML = n ? `${n}<span>night${n !== 1 ? 's' : ''}</span>` : `—<span>nights</span>`;
}

// ── ERROR HELPERS ──
function showError(field, msg) {
    const input = document.getElementById(field);
    const errEl = document.getElementById('err-' + field);
    if (input) input.classList.add('error');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
}

function clearError(field) {
    const input = document.getElementById(field);
    const errEl = document.getElementById('err-' + field);
    if (input) input.classList.remove('error');
    if (errEl) errEl.classList.remove('visible');
}

function validateAll() {
    let valid = true;

    const guestName = document.getElementById('guestName').value.trim();
    if (!guestName) { showError('guestName', 'Guest name is required.'); valid = false; } else clearError('guestName');

    const adults = parseInt(document.getElementById('adults').value);
    if (!adults || adults < 1) { showError('adults', 'At least 1 adult is required.'); valid = false; } else clearError('adults');

    const children = parseInt(document.getElementById('children').value);
    if (isNaN(children) || children < 0) { showError('children', 'Invalid number of children.'); valid = false; } else clearError('children');

    const hotelName = document.getElementById('hotelName').value.trim();
    if (!hotelName) { showError('hotelName', 'Hotel name is required.'); valid = false; } else clearError('hotelName');

    const hotelLoc = document.getElementById('hotelLoc').value.trim();
    if (!hotelLoc) { showError('hotelLoc', 'Location is required.'); valid = false; } else clearError('hotelLoc');

    const checkIn = document.getElementById('checkIn').value;
    if (!checkIn) { showError('checkIn', 'Check-in date is required.'); valid = false; } else clearError('checkIn');

    const checkOut = document.getElementById('checkOut').value;
    if (!checkOut) { showError('checkOut', 'Check-out date is required.'); valid = false; }
    else if (checkIn && diffNights(checkIn, checkOut) === null) { showError('checkOut', 'Check-out must be after check-in.'); valid = false; }
    else clearError('checkOut');

    const nights = parseInt(document.getElementById('nights').value);
    if (!nights || nights < 1) { showError('nights', 'Please enter a valid number of nights.'); valid = false; } else clearError('nights');

    const roomType = document.getElementById('roomType').value.trim();
    if (!roomType) { showError('roomType', 'Room type is required.'); valid = false; } else clearError('roomType');

    return valid;
}

// ── UPDATE VOUCHER ──
function update() {
    const guestName = document.getElementById('guestName').value.trim();
    const adults = parseInt(document.getElementById('adults').value) || 0;
    const children = parseInt(document.getElementById('children').value) || 0;
    const childAge = document.getElementById('childAge').value.trim();
    const hotelName = document.getElementById('hotelName').value.trim();
    const hotelLoc = document.getElementById('hotelLoc').value.trim();
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const board = document.getElementById('boardBasis').value;
    const roomType = document.getElementById('roomType').value.trim();
    const nights = diffNights(checkIn, checkOut);

    document.getElementById('v-guest-name').textContent = guestName || '—';

    let occ = adults + ' Adult' + (adults !== 1 ? 's' : '');
    if (children > 0) occ += ', ' + children + ' Child' + (children !== 1 ? 'ren' : '');
    document.getElementById('v-occupancy').textContent = occ;

    const childAgeField = document.getElementById('v-child-age-field');
    if (children > 0) {
        childAgeField.style.display = '';
        document.getElementById('v-child-age').textContent = childAge || '—';
    } else {
        childAgeField.style.display = 'none';
    }

    document.getElementById('v-hotel-name').textContent = hotelName || '—';
    document.getElementById('v-hotel-loc').textContent = hotelLoc || '—';
    document.getElementById('v-checkin').textContent = formatDate(checkIn);
    document.getElementById('v-checkout').textContent = formatDate(checkOut);
    document.getElementById('v-duration').textContent = nights ? nights + (nights === 1 ? ' Night' : ' Nights') : '—';
    document.getElementById('v-board').textContent = board;
    document.getElementById('v-board-sub').textContent = boardSubs[board] || '';

    document.getElementById('v-room-name').textContent = roomType || '—';
    const tagsEl = document.getElementById('v-tags');
    tagsEl.innerHTML = '';
    if (roomType) addTag(tagsEl, roomType);
    addTag(tagsEl, adults + ' Adult' + (adults !== 1 ? 's' : '') + (children > 0 ? ' + ' + children + ' Kid' + (children !== 1 ? 's' : '') : ''));
    if (boardSubs[board]) addTag(tagsEl, boardSubs[board]);

    renderInclusions();
}

function addTag(container, text) {
    const t = document.createElement('span');
    t.className = 'v-tag';
    t.textContent = text;
    container.appendChild(t);
}

// ── INCLUSIONS ──
let inclusions = [];

function addInclusion(val = '') {
    inclusions.push(val);
    renderInclusionForm();
    renderInclusions();
}

function removeInclusion(i) {
    inclusions.splice(i, 1);
    renderInclusionForm();
    renderInclusions();
}

function renderInclusionForm() {
    const rows = document.getElementById('incRows');
    rows.innerHTML = '';
    inclusions.forEach((inc, i) => {
        const row = document.createElement('div');
        row.className = 'inc-row';
        row.innerHTML = `
        <input type="text" placeholder="If any inclusions type here" value="${inc.replace(/"/g, '&quot;')}" oninput="inclusions[${i}]=this.value; renderInclusions()">
        <button class="inc-remove" onclick="removeInclusion(${i})">×</button>
      `;
        rows.appendChild(row);
    });
}

function renderInclusions() {
    const list = document.getElementById('v-inc-list');
    const section = document.getElementById('v-inc-section');
    const active = inclusions.filter(i => i.trim());
    if (active.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';
    list.innerHTML = '';
    active.forEach(inc => {
        const item = document.createElement('div');
        item.className = 'v-inc-item';
        item.innerHTML = `<div class="v-inc-dot"></div><span>${inc}</span>`;
        list.appendChild(item);
    });
}

// ── PRINT ──
function printVoucher() {
    if (!validateAll()) {
        alert('Please fill in all required fields before printing.');
        return;
    }
    const clone = document.getElementById('voucher').cloneNode(true);
    const printDiv = document.getElementById('print-clone');
    printDiv.innerHTML = '';
    printDiv.appendChild(clone);
    window.print();
}

// ── INIT ──
window.onload = function () {
    addInclusion('');
    update();
};