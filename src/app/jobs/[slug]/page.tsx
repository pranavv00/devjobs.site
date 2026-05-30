import { Job } from "@/lib/data";
import { getJobsServer } from "@/lib/data-server";
import { generateJobSlug } from "@/lib/utils";
import JobDetailsClient from "./JobDetailsClient";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const jobs = await getJobsServer();
  const job = jobs.find(j => generateJobSlug(j) === params.slug || j.id === params.slug);

  if (!job) return { title: "Job Not Found | DevJobs" };

  const title = `${job.title} at ${job.company} | DevJobs`;
  const description = `Apply for the ${job.title} role at ${job.company}. Remote tech job updated daily on DevJobs.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    alternates: {
      canonical: `/jobs/${params.slug}`,
    },
  };
}

export default async function JobDetailsPage({ params }: { params: { slug: string } }) {
  const jobs = await getJobsServer();
  const job = jobs.find(j => generateJobSlug(j) === params.slug || j.id === params.slug);

  if (!job) {
    notFound();
  }

  // Generate JSON-LD JobPosting Schema
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.posted_at,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Remote",
        "addressCountry": "Remote"
      }
    },
    "baseSalary": job.salary ? {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salary,
        "unitText": "YEAR"
      }
    } : undefined
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobDetailsClient job={job} />
    </>
  );
}
