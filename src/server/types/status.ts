export type HealthStatus = { status: 'ok'; service: 'HostelWatt API' };

export type FirebaseConnectivityStatus = {
  status: 'ok' | 'not_configured' | 'unavailable';
  service: 'Firebase Realtime Database';
};

export type FirebaseServerCredentials = {
  email: string;
  privateKey: string;
};