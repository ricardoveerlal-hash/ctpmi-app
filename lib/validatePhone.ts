/**
 * Validates and normalizes South African mobile numbers.
 * Accepts: 06xxxxxxxx / 07xxxxxxxx / 08xxxxxxxx (10 digits, local format)
 *          or +27 6/7/8 xxxxxxxx / 27 6/7/8 xxxxxxxx (international format)
 *
 * Returns the number normalized to wa_id format (27XXXXXXXXX, no leading 0,
 * no +) to match how numbers are stored against Church Members / wa_id,
 * or null if the input isn't a valid SA mobile number.
 */
export function normalizeSaMobile(raw: string): string | null {
  const digitsOnly = raw.replace(/[^\d]/g, "");

  // Local format: 0[6-8]XXXXXXXX (10 digits total)
  if (/^0[678]\d{8}$/.test(digitsOnly)) {
    return "27" + digitsOnly.slice(1);
  }

  // International format: 27[6-8]XXXXXXXX (11 digits total)
  if (/^27[678]\d{8}$/.test(digitsOnly)) {
    return digitsOnly;
  }

  return null;
}

export function isValidSaMobile(raw: string): boolean {
  return normalizeSaMobile(raw) !== null;
}
