/** Source attribution and redistribution rules also apply to older snapshots. */
export const JOB_SOURCES = [
  { name: 'WeWorkRemotely', label: 'We Work Remotely', url: 'https://weworkremotely.com' },
  { name: 'Remotive', label: 'Remotive', url: 'https://remotive.com' },
  { name: 'RemoteOK', label: 'Remote OK', url: 'https://remoteok.com' },
  { name: 'WorkingNomads', label: 'Working Nomads', url: 'https://www.workingnomads.com' },
  { name: 'Jobicy', label: 'Jobicy', url: 'https://jobicy.com' },
  { name: 'Himalayas', label: 'Himalayas', url: 'https://himalayas.app' },
  { name: 'Arbeitnow', label: 'Arbeitnow', url: 'https://www.arbeitnow.com' },
  { name: 'Arbeitnow UK', label: 'Arbeitnow UK', url: 'https://www.arbeitnow.co.uk' },
] as const;

export function canSyndicate(job: { source: string; allowSyndication?: boolean }): boolean {
  return (
    job.allowSyndication !== false &&
    !['remotive', 'himalayas'].includes(job.source.trim().toLowerCase())
  );
}
