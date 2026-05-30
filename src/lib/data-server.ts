import staticJobs from "./jobs.json";
import { Job } from "./data";

export async function getJobsServer(): Promise<Job[]> {
  try {
    // Direct consumption of bundled data for SSR
    const rawJobs = staticJobs;

    if (!Array.isArray(rawJobs)) {
      console.warn("getJobsServer: Bundled data is not an array");
      return [];
    }

    return rawJobs.map((job: any) => {
      const url = job.url || "";
      let hash = 0;
      for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      const stableId = (hash >>> 0).toString(16).padStart(8, '0');

      return {
        ...job,
        id: job.id || stableId,
        title: job.title || "Untitled Role",
        company: job.company || "Unknown Company",
        description: job.description || "",
        url: job.url || "#",
        source: job.source || "Aggregator",
        posted_at: job.posted_at || new Date().toISOString(),
        salary: job.salary || ""
      };
    });
  } catch (error) {
    console.error("Error in getJobsServer:", error);
    return [];
  }
}
