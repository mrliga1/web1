export function getAssignedEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().match(/[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] || '';
}

export function isLeadAssignedTo(assignee: unknown, email: unknown): boolean {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  return Boolean(normalizedEmail) && getAssignedEmail(assignee) === normalizedEmail;
}
