export const formatTimestamp = (date = new Date()) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const getStateLabel = (state) => {
  const labels = {
    'no source': 'Waiting...',
    inactive: 'Camera off',
    muted: 'Muted',
    avatar: 'Camera off',
    live: '',
  };
  return labels[state] || state;
};

export const getDeviceLabel = (device) => {
  return device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`;
};

export const normaliseStatusText = (status) => {
  if (!status) {
    return '';
  }

  return String(status).replace(/_/g, ' ').toLowerCase();
};
