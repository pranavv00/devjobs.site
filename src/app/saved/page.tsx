"use client";

import { useSavedJobs } from "@/lib/hooks";
import JobCard from "@/components/JobCard";
import { ArrowLeft, Layout, Download } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";

const COLUMNS = [
  { id: "saved", title: "Saved", emoji: "🔖", color: "text-zinc-400" },
  { id: "applied", title: "Applied", emoji: "🚀", color: "text-blue-400" },
  { id: "interviewing", title: "Interviewing", emoji: "💬", color: "text-purple-400" },
  { id: "offer", title: "Offer", emoji: "🎉", color: "text-green-400" },
];

export default function SavedJobsPage() {
  const { savedJobs, jobStatuses, updateJobStatus } = useSavedJobs();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    updateJobStatus(draggableId, destination.droppableId);
  };

  const exportToCSV = () => {
    if (savedJobs.length === 0) return;

    const headers = ["Title", "Company", "Location", "Salary", "Status", "Link", "Tags"];
    const rows = savedJobs.map(job => {
      const statusId = jobStatuses[job.id] || "saved";
      const statusTitle = COLUMNS.find(c => c.id === statusId)?.title || "Saved";
      const tags = job.ai_data?.tags?.join(", ") || "";
      
      return [
        `"${job.title.replace(/"/g, '""')}"`,
        `"${job.company.replace(/"/g, '""')}"`,
        `"Remote"`,
        `"${(job.salary || "").replace(/"/g, '""')}"`,
        `"${statusTitle}"`,
        `"${job.url}"`,
        `"${tags.replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "job_pipeline_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen pb-32">
      <div className="container mx-auto px-4 pt-12 relative z-10 max-w-[1400px]">
        <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-purple-400 mb-8 transition-all font-bold uppercase tracking-widest text-xs">
          <ArrowLeft size={16} />
          <span>Back to Discovery</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-16">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/10">
              <Layout size={32} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter">Application Pipeline</h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Track {savedJobs.length} Opportunities</p>
            </div>
          </div>
          {savedJobs.length > 0 && (
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-zinc-300 hover:text-white"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>

        {savedJobs.length > 0 ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
              {COLUMNS.map((col) => {
                const columnJobs = savedJobs.filter(job => (jobStatuses[job.id] || "saved") === col.id);
                return (
                  <div key={col.id} className="w-[320px] sm:w-[380px] shrink-0 bg-white/[0.02] border border-white/5 rounded-[2rem] p-4 flex flex-col h-[75vh] snap-center">
                    <div className="flex items-center justify-between mb-6 px-2">
                      <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                        <span>{col.emoji}</span> {col.title}
                      </h2>
                      <span className={`px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold ${col.color}`}>
                        {columnJobs.length}
                      </span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-4 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-white/[0.02]' : ''}`}
                        >
                          {columnJobs.map((job, index) => (
                            <Draggable key={job.id} draggableId={job.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`transition-opacity ${snapshot.isDragging ? 'opacity-80 scale-[1.02] z-50' : ''}`}
                                  style={{ 
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  {/* Wrapping JobCard in a smaller container for Kanban view */}
                                  <div className="pointer-events-none sm:pointer-events-auto">
                                    <JobCard job={job} index={0} />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]"
          >
            <div className="text-6xl mb-6">💎</div>
            <h2 className="text-2xl font-black mb-2">No jobs tracked yet.</h2>
            <p className="text-zinc-500 max-w-sm mx-auto mb-10 font-medium">Start exploring the discovery engine to find roles worth saving to your pipeline.</p>
            <Link href="/" className="px-10 py-4 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all shadow-xl shadow-purple-500/20">
              Start Discovering
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  );
}
