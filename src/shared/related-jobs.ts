import { matchesTerm, SKILLS, type JobSummary } from './jobs';

const ROLE_TERMS = [
  'frontend',
  'backend',
  'full stack',
  'full-stack',
  'mobile',
  'devops',
  'data analyst',
  'data scientist',
  'machine learning',
  'security',
  'designer',
];

/** Rank a small on-site shortlist; this is relevance, not applicant eligibility. */
export function relatedJobs(job: JobSummary, candidates: JobSummary[]): JobSummary[] {
  const text = `${job.title} ${job.tags.join(' ')}`;
  const skills = SKILLS.filter((skill) => matchesTerm(text, skill));
  const roles = ROLE_TERMS.filter((term) => matchesTerm(job.title, term));
  const seen = new Set([`${job.company.toLowerCase()}|${job.title.toLowerCase()}`]);
  return candidates
    .filter((candidate) => !candidate.archived && candidate.id !== job.id)
    .map((candidate) => {
      const candidateText = `${candidate.title} ${candidate.tags.join(' ')}`;
      const score =
        skills.filter((skill) => matchesTerm(candidateText, skill)).length +
        roles.filter((role) => matchesTerm(candidate.title, role)).length * 2;
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || Date.parse(b.candidate.posted_at) - Date.parse(a.candidate.posted_at),
    )
    .filter(({ candidate }) => {
      const key = `${candidate.company.toLowerCase()}|${candidate.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}
