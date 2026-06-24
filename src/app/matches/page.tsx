import { getJobsServer } from "@/lib/data-server";
import MatchesClient from "./MatchesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "For You - AI Matched Jobs | DevJobs",
  description: "Your personalized feed of remote tech jobs dynamically matched to your specific skills and tech stack.",
};

export default async function MatchesPage() {
  const jobs = await getJobsServer();
  
  return (
    <main className="min-h-screen pt-12">
      <MatchesClient initialJobs={jobs} />
    </main>
  );
}
