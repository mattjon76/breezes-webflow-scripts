(() => {
// Email validation function with common typo detection
function validateEmail(email) {
if (!email) return { valid: false, error: '' };

// Basic email regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Check basic format
if (!emailRegex.test(email)) {
if (!email.includes('@')) {
return { valid: false, error: 'Email must include @ symbol' };
}
if (!email.includes('.')) {
return { valid: false, error: 'Email must include a domain (e.g., .com)' };
}
return { valid: false, error: 'Please enter a valid email address' };
}

// Extract domain and TLD
const parts = email.split('@')[1].toLowerCase().split('.');
const domain = parts[0];
const tld = parts[parts.length - 1];

// Check for specific TLD typos only
const tldTypos = {
'om': 'com',
'con': 'com',
'cm': 'com' // Cameroon exists but often a typo for .com
};

if (tldTypos[tld]) {
return { valid: false, error: `Did you mean .${tldTypos[tld]}?` };
}

// Common email domain typos
const fullDomain = email.split('@')[1].toLowerCase();
const commonTypos = {
'gmai.com': 'gmail.com',
'gmial.com': 'gmail.com',
'gmail.co': 'gmail.com',
'gmail.cm': 'gmail.com',
'gmail.con': 'gmail.com',
'gmail.om': 'gmail.com',
'gmal.com': 'gmail.com',
'gnail.com': 'gmail.com',
'yahooo.com': 'yahoo.com',
'yaho.com': 'yahoo.com',
'yahoo.co': 'yahoo.com',
'yahoo.con': 'yahoo.com',
'hotmai.com': 'hotmail.com',
'hotmal.com': 'hotmail.com',
'hotmial.com': 'hotmail.com',
'hotmail.con': 'hotmail.com',
'outlok.com': 'outlook.com',
'outloo.com': 'outlook.com',
'outlook.con': 'outlook.com',
'iclud.com': 'icloud.com',
'icloud.co': 'icloud.com',
'icloud.con': 'icloud.com',
'me.om': 'me.com',
'me.con': 'me.com'
};

// Check for common typos
if (commonTypos[fullDomain]) {
return { valid: false, error: `Did you mean @${commonTypos[fullDomain]}?` };
}

// Check for missing TLD
if (parts.length < 2) {
return { valid: false, error: 'Domain appears incomplete (e.g., gmail.com)' };
}

return { valid: true, error: '' };
}

// ADD TRACKING FUNCTION HERE
async function trackEvent(eventType, eventData) {
try {
const payload = {
api_token: 'brz_prod_2024_sK9mN2pQ8xL5vR7tY3wA',
email: eventData.email || memberData.email || 'anonymous',
event_type: eventType,
event_data: JSON.stringify(eventData),
timestamp: Date.now()
};
const response = await fetch('https://mybreezes.bubbleapps.io/version-test/api/1.1/wf/track-event', {
method: 'POST',
headers: {'Content-Type': 'application/json'},
body: JSON.stringify(payload)
});
console.log('Event tracked:', eventType, await response.json());
} catch(e) {
console.error('Failed to track event:', e);
}
}

// Function to trigger auth nav login modal
function triggerAuthNavLogin(email = '') {
// Set the email in auth nav modal if provided
if (email) {
const emailInput = document.getElementById('emailInput');
if (emailInput) {
emailInput.value = email;
}
}
// Trigger auth nav login modal
const emailModal = document.getElementById('emailModal');
if (emailModal) {
emailModal.classList.add('active');
} else {
console.warn('Auth nav email modal not found');
}
}

// Listen for auth state changes from auth nav
function checkAuthState() {
const verified = localStorage.getItem('memberVerified') === 'true';
const expiry = Number(localStorage.getItem('verificationExpiry') || '0');
const stillValid = verified && Date.now() < expiry;
const memberEmail = localStorage.getItem('memberEmail');

if (stillValid && memberEmail) {
// Auto-populate email field from successful auth nav login
els.email.value = memberEmail;
els.email.style.borderColor = '#00b4d1';
els.email.classList.add('valid');
return true;
}
return false;
}

// Check for auth state from auth nav on load
window.addEventListener('load', () => {
checkAuthState();
// TRACK WIDGET LOAD
trackEvent('widget_loaded', {
page: window.location.href,
timestamp: Date.now()
});
});

// Watch for auth changes from auth nav
setInterval(checkAuthState, 1000); // Check every second for auth changes

const API_BASE = 'https://mybreezes.bubbleapps.io/version-test/api/1.1/wf';
const API_TOKEN = 'brz_prod_2024_sK9mN2pQ8xL5vR7tY3wA';
const CLOUDBEDS_URL = 'https://us2.cloudbeds.com/reservation/oNZNW2';
const MEMBER_PROMO = 'BZMBR';

let memberVerified = false;
let memberData = {
email: '',
checkin: '',
checkout: '',
adults: ''
};

// Date picker with dynamic month display
let start = null, end = null;
let picker = flatpickr('#dateRange', {
mode: 'range',
dateFormat: 'd-M-Y',
rangeSeparator: ' to ',
minDate: 'today',
showMonths: 2,
allowInput: false,
clickOpens: true,
onChange: (sel) => {
if(sel.length === 2) {
start = sel[0];
end = sel[1];
// TRACK DATE SELECTION
trackEvent('dates_selected', {
checkin: flatpickr.formatDate(sel[0], 'd-M-Y'),
checkout: flatpickr.formatDate(sel[1], 'd-M-Y'),
timestamp: Date.now()
});
}
}
});

// Update months shown based on actual container width
function updateCalendarMonths() {
const widgetWidth = document.getElementById('breezesWidget').offsetWidth;
const monthsToShow = widgetWidth < 800 ? 1 : 2;

if (picker.config.showMonths !== monthsToShow) {
picker.set('showMonths', monthsToShow);
}
}

// Check on load and resize
updateCalendarMonths();
window.addEventListener('resize', updateCalendarMonths);

// Format date for Cloudbeds
function fmtCloudbeds(d) {
const months = {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06','Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'};
const s = flatpickr.formatDate(d,'d-M-Y').split('-');
return `${s[2]}-${months[s[1]]}-${s[0].padStart(2,'0')}`;
}

// UI elements
const els = {
adults: document.getElementById('adults'),
dateRange: document.getElementById('dateRange'),
btn: document.getElementById('searchBtn'),
hint: document.getElementById('hint'),
email: document.getElementById('memberEmail'),
promo: document.getElementById('promoCode'),
emailError: document.getElementById('emailError')
};

// Real-time email validation
els.email.addEventListener('input', (e) => {
const email = e.target.value.trim().toLowerCase();
const errorElement = document.getElementById('emailError');

if (email.length > 0) {
const validation = validateEmail(email);

if (!validation.valid) {
els.email.classList.add('invalid');
els.email.classList.remove('valid');
errorElement.textContent = validation.error;
errorElement.classList.add('show');
} else {
els.email.classList.remove('invalid');
els.email.classList.add('valid');
errorElement.textContent = '';
errorElement.classList.remove('show');
}
} else {
// Empty field - remove all validation states
els.email.classList.remove('invalid', 'valid');
errorElement.textContent = '';
errorElement.classList.remove('show');
}
});

// Clear validation on blur if empty
els.email.addEventListener('blur', (e) => {
const errorElement = document.getElementById('emailError');
if (!e.target.value.trim()) {
els.email.classList.remove('invalid', 'valid');
errorElement.textContent = '';
errorElement.classList.remove('show');
} else {
// TRACK EMAIL ENTRY
trackEvent('email_entered', {
email: e.target.value.trim(),
timestamp: Date.now()
});
}
});

// Loading state
function setLoading(on) {
els.btn.disabled = on;
els.hint.classList.toggle('bw-hidden', !on);
els.btn.querySelector('.txt').textContent = on ? 'Processing...' : 'RATES & AVAILABILITY';
els.btn.querySelector('.spin').style.display = on ? 'inline-block' : 'none';
}

// Main button click handler
els.btn.addEventListener('click', async () => {
if(!start || !end){
els.dateRange.focus();
return;
}

const checkin = fmtCloudbeds(start);
const checkout = fmtCloudbeds(end);
const adults = els.adults.value;
const promoIn = (els.promo.value||'').trim();
const email = (els.email.value||'').trim().toLowerCase();

// TRACK SEARCH INITIATION
trackEvent('search_initiated', {
email: email || 'anonymous',
checkin: checkin,
checkout: checkout,
adults: adults,
has_promo: !!promoIn,
timestamp: Date.now()
});

// Store booking details
memberData.checkin = checkin;
memberData.checkout = checkout;
memberData.adults = adults;

// Save potential abandoned booking
if (email) {
localStorage.setItem('abandonedBooking', JSON.stringify({
checkin: checkin,
checkout: checkout,
adults: adults,
email: email,
timestamp: Date.now()
}));
}

// If no email, proceed as regular booking
if(!email){
const params = new URLSearchParams({ checkin, checkout, adults });
if(promoIn) params.set('promo', promoIn);
// TRACK REDIRECT WITHOUT EMAIL
trackEvent('booking_redirect', {
email: 'anonymous',
checkin: checkin,
checkout: checkout,
adults: adults,
promo: promoIn || 'none',
destination: 'cloudbeds',
member: false
});
window.open(`${CLOUDBEDS_URL}#${params.toString()}`,'_blank');
// Clear abandoned booking since they proceeded
localStorage.removeItem('abandonedBooking');
return;
}

// Validate email before proceeding
const validation = validateEmail(email);
if (!validation.valid) {
const errorElement = document.getElementById('emailError');
els.email.classList.add('invalid');
errorElement.textContent = validation.error;
errorElement.classList.add('show');
els.email.focus();
return;
}

// Store email for member flow
memberData.email = email;

// Check if user is already verified
const verified = localStorage.getItem('memberVerified') === 'true';
const expiry = Number(localStorage.getItem('verificationExpiry') || '0');
const stillValid = verified && Date.now() < expiry;
const storedEmail = localStorage.getItem('memberEmail');

if (stillValid && storedEmail && storedEmail.toLowerCase() === email) {
// Already verified, proceed with member promo
const params = new URLSearchParams({ checkin, checkout, adults, promo: MEMBER_PROMO });
// TRACK VERIFIED MEMBER REDIRECT
trackEvent('booking_redirect', {
email: email,
checkin: checkin,
checkout: checkout,
adults: adults,
promo: MEMBER_PROMO,
destination: 'cloudbeds',
member: true,
verified: true
});
window.open(`${CLOUDBEDS_URL}#${params.toString()}`,'_blank');
// Clear abandoned booking since they're proceeding
localStorage.removeItem('abandonedBooking');
} else {
// Not verified - trigger auth nav login with the email pre-filled
triggerAuthNavLogin(email);
// TRACK TRIGGERING AUTH FLOW
trackEvent('auth_flow_triggered', {
email: email,
source: 'booking_widget',
timestamp: Date.now()
});
}
});

})();
