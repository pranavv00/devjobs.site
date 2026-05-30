"use client";

import { useState, useEffect } from "react";
import { Job } from "@/lib/data";

export function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    setSavedJobs(saved);
  }, []);

  const refresh = () => {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    setSavedJobs(saved);
  };

  return { savedJobs, refresh };
}
