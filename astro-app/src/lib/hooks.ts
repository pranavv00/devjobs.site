import { useState, useEffect } from "react";
import type { Job } from "@/lib/data";

export function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [jobStatuses, setJobStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    const statuses = JSON.parse(localStorage.getItem("jobStatuses") || "{}");
    setSavedJobs(saved);
    setJobStatuses(statuses);
  }, []);

  const refresh = () => {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    const statuses = JSON.parse(localStorage.getItem("jobStatuses") || "{}");
    setSavedJobs(saved);
    setJobStatuses(statuses);
  };

  const updateJobStatus = (jobId: string, status: string) => {
    const statuses = JSON.parse(localStorage.getItem("jobStatuses") || "{}");
    statuses[jobId] = status;
    localStorage.setItem("jobStatuses", JSON.stringify(statuses));
    setJobStatuses(statuses);
  };

  return { savedJobs, jobStatuses, refresh, updateJobStatus };
}
