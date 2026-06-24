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

  // Calculate validThrough (60 days from posted_at)
  const postedDate = new Date(job.posted_at || new Date());
  const validThroughDate = new Date(postedDate.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Dynamic Location Detection for Google Jobs Geo-Targeting
  const descLower = (job.description || "").toLowerCase() + " " + job.title.toLowerCase();
  const applicantLocationRequirements: any[] = [];
  
  if (descLower.includes("us ") || descLower.includes("united states") || descLower.includes("usa ") || descLower.includes("america")) {
    applicantLocationRequirements.push({ "@type": "Country", "name": "US" });
  }
  if (descLower.includes("uk ") || descLower.includes("united kingdom") || descLower.includes("london") || descLower.includes("britain")) {
    applicantLocationRequirements.push({ "@type": "Country", "name": "GB" });
  }
  if (descLower.includes("canada") || descLower.includes("toronto") || descLower.includes("vancouver")) {
    applicantLocationRequirements.push({ "@type": "Country", "name": "CA" });
  }
  if (descLower.includes("europe") || descLower.includes("eu ")) {
    applicantLocationRequirements.push({ "@type": "Place", "name": "Europe" });
  }
  if (descLower.includes("latam") || descLower.includes("latin america")) {
    applicantLocationRequirements.push({ "@type": "Place", "name": "Latin America" });
  }

  // If no specific regions detected, default to broad global reach
  if (applicantLocationRequirements.length === 0) {
    applicantLocationRequirements.push({ "@type": "Country", "name": "US" });
    applicantLocationRequirements.push({ "@type": "Country", "name": "GB" });
    applicantLocationRequirements.push({ "@type": "Country", "name": "CA" });
  }

  // Generate JSON-LD JobPosting Schema
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description || "View full job description on our site.",
    "datePosted": job.posted_at || new Date().toISOString(),
    "validThrough": validThroughDate.toISOString(),
    "employmentType": ["FULL_TIME"],
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Remote",
        "addressLocality": "Remote",
        "addressRegion": "Remote",
        "postalCode": "00000",
        "addressCountry": "US"
      }
    },
    "jobLocationType": "TELECOMMUTE",
    "applicantLocationRequirements": applicantLocationRequirements,
    ...(job.salary ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": job.salary.replace(/[^0-9.]/g, '') || "0",
          "unitText": "YEAR"
        }
      }
    } : {})
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
