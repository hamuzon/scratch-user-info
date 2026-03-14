export const formatJoinedDate = (joined) => {
  if (!joined) {
    return { short: '不明', detail: '不明' };
  }

  const date = new Date(joined);
  return {
    short: date.toLocaleDateString('ja-JP'),
    detail: date.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
};

const normalizeMembershipValue = (value) => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return '';
    }

    const lowered = normalized.toLowerCase();
    if (['0', 'false', 'none', 'null', 'undefined', 'new scratcher'].includes(lowered)) {
      return '';
    }

    return normalized;
  }

  if (typeof value === 'number') {
    if (value <= 0) {
      return '';
    }
    return value === 1 ? 'Scratcher' : `Membership ${value}`;
  }

  if (typeof value === 'boolean') {
    return value ? 'Scratcher' : '';
  }

  if (value && typeof value === 'object') {
    return (
      normalizeMembershipValue(value.label) ||
      normalizeMembershipValue(value.name) ||
      normalizeMembershipValue(value.text) ||
      ''
    );
  }

  return '';
};

export const getMembershipText = (user) => {
  const candidates = [
    user?.membership_label,
    user?.membership_avatar_badge,
    user?.profile?.membership_label,
    user?.profile?.membership_avatar_badge,
  ];

  for (const candidate of candidates) {
    const parsed = normalizeMembershipValue(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return '';
};

export const shouldShowMembership = (user) => Boolean(getMembershipText(user));
