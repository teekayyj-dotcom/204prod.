export const ensureUTC = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  // If the date string already has timezone info ('Z', '+07:00', '-0500'), leave it alone
  if (dateStr.endsWith("Z") || dateStr.includes("+") || dateStr.match(/-\d{2}:?\d{2}$/)) {
    return dateStr;
  }
  // Otherwise, it's a naive UTC time from the database, append 'Z' so JS parses it as UTC
  return dateStr + "Z";
};
