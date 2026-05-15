export function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+251${digits.slice(1)}`;
  if (digits.startsWith("251")) return `+${digits}`;
  return digits.startsWith("9") ? `+251${digits}` : digits;
}
