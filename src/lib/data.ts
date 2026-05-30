import staticJobs from "./jobs.json";

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  url: string;
  source: string;
  posted_at: string;
  salary?: string;
  ai_processed?: boolean;
  ai_data?: {
    role?: string;
    summary?: string;
    highlights?: string[];
    responsibilities?: string[];
    requirements?: string[];
    nice_to_have?: string[];
    tags?: string[];
  };
}

export async function getJobs(): Promise<Job[]> {
  try {
    // 1. Direct consumption of the bundled database
    const rawJobs = staticJobs;
    
    if (!Array.isArray(rawJobs)) {
      console.warn("getJobs: Bundled data is not an array");
      return [];
    }

    return rawJobs.map((job: any) => {
      const url = job.url || "";
      
      // Stable 32-bit hash function (Java-style hashCode)
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
    console.error("Error in getJobs:", error);
    return [];
  }
}
