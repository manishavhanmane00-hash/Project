// =============================================
// India geography reference data for the Add Employee form.
// Used to default the country to India and offer the correct
// state / union-territory options.
// =============================================

export const DEFAULT_COUNTRY = 'India';

// Country list — India first (the default), then a few common others so the
// field still works for non-Indian hires.
export const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Canada',
  'Australia',
  'Singapore',
  'Germany',
];

// Indian States (28) + Union Territories (8), alphabetically ordered.
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// Common Indian work-location cities for the Work Location dropdown.
export const INDIAN_WORK_LOCATIONS = [
  'HQ - Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Remote',
  'Hybrid',
];

// ── Validators ───────────────────────────────────────────────────────────────

// Valid Indian mobile: exactly 10 digits, first digit 6-9.
export const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(onlyDigits(value));

// Valid Indian PIN code: exactly 6 digits, cannot start with 0.
export const isValidPinCode = (value) => /^[1-9]\d{5}$/.test(onlyDigits(value));

export const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

// Keep only the 10-digit local part if a user pastes a number with +91 / 0 prefix.
export const normalizeIndianMobile = (value = '') => {
  let digits = onlyDigits(value);
  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1);
  return digits.slice(0, 10);
};

// Format a 10-digit number as "+91 XXXXX XXXXX" for display.
export const formatIndianMobile = (value = '') => {
  const digits = normalizeIndianMobile(value);
  if (!digits) return '';
  const first = digits.slice(0, 5);
  const second = digits.slice(5, 10);
  return second ? `+91 ${first} ${second}` : `+91 ${first}`;
};
