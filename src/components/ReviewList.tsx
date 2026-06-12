import React from "react";
import { Star, History, Award, MessageSquare, Clock, CheckCircle } from "lucide-react";

export default function ReviewList({ reviews, realProfile, completedJobsCount }: { reviews: any[], realProfile: any, completedJobsCount: number }) {
  // Aggregate averages based on reviews if needed, or use realProfile stats
  const averageRating = realProfile?.rating_average || 5.0;

  return (
    <div className="space-y-6">
      {/* Star Ratings Summary (ratings summary, direct list, star averages) */}
      <div className="p-5 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 flex flex-col sm:flex-row gap-6">
        <div className="flex-1 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-white/5 pb-6 sm:pb-0">
          <span className="text-5xl font-black tracking-tighter text-white mb-2">
            {averageRating.toFixed(1)}
          </span>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className={
                  s <= Math.floor(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-white/5 text-white/10"
                }
              />
            ))}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
            {completedJobsCount} Verified Reviews
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-3 px-2">
            <CategoryAverage icon={<Award size={12} />} label="Quality" score={4.9} />
            <CategoryAverage icon={<MessageSquare size={12} />} label="Communication" score={4.8} />
            <CategoryAverage icon={<Clock size={12} />} label="Timeliness" score={4.9} />
            <CategoryAverage icon={<CheckCircle size={12} />} label="Professionalism" score={5.0} />
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
          <History
            size={24}
            className="mx-auto text-white/20 mb-3"
          />
          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
            No customer reviews yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-[2rem] bg-[#121215] border border-white/5 flex flex-col gap-4 shadow-sm group hover:border-white/10 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black text-white uppercase border border-white/10 shrink-0">
                    {rev.reviewer?.full_name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                      {rev.reviewer?.full_name || "Client"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                            key={s}
                            size={10}
                            className={
                                s <= rev.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-white/10 fill-white/5"
                            }
                            />
                        ))}
                        </div>
                        <span className="text-[9px] text-white/40 font-medium">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed font-medium">
                "{rev.content || rev.comment}"
              </p>

              {/* Media Preview (if exists in mock) */}
              {rev.media && rev.media.length > 0 && (
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2">
                    {rev.media.map((m: any, idx: number) => (
                       <div key={idx} className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden">
                          <img src={m} alt="Review media" className="w-full h-full object-cover" />
                       </div>
                    ))}
                 </div>
              )}

              {/* Categories block */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                 <span className="bg-white/5 px-2 py-1 rounded border border-white/5 text-[9px] font-bold text-white/50 tracking-wider">Quality 5.0</span>
                 <span className="bg-white/5 px-2 py-1 rounded border border-white/5 text-[9px] font-bold text-white/50 tracking-wider">Comm 5.0</span>
                 <span className="bg-white/5 px-2 py-1 rounded border border-white/5 text-[9px] font-bold text-white/50 tracking-wider">Timing 4.0</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryAverage({ icon, label, score }: { icon: React.ReactNode, label: string, score: number }) {
    return (
        <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-white/60">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">{score.toFixed(1)}</span>
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
            </div>
        </div>
    )
}
