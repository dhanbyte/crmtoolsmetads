"use client";

export function StatsCardSkeleton() {
  return (
    <div className="flex items-center gap-3 md:gap-4 rounded-2xl bg-white p-4 md:p-6 shadow-sm border border-slate-100 min-w-[160px] md:min-w-0 animate-pulse">
      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-200 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-slate-200 rounded w-16 mb-2" />
        <div className="h-6 bg-slate-200 rounded w-8" />
      </div>
    </div>
  );
}

export function LeadCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-3 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-24" />
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-4 bg-slate-200 rounded w-36 mb-3" />
      <div className="flex gap-2">
        <div className="flex-1 h-12 bg-slate-200 rounded-xl" />
        <div className="flex-1 h-12 bg-slate-200 rounded-xl" />
        <div className="h-12 w-12 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}