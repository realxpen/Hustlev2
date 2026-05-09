import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, Calendar, Clock, CreditCard, CheckCircle2, ShieldCheck, ChevronLeft, Wallet } from "lucide-react";
import { useState } from "react";

interface BookingFlowProps {
  hustler: any;
  onClose: () => void;
}

type BookingStep = "service" | "schedule" | "review" | "payment" | "success";

const MOCK_SERVICES = [
  { id: 1, name: "UI/UX Specialist Review", price: 99, time: "1 hour", description: "Deep dive into your product's usability and visual intent." },
  { id: 2, name: "Full Product Design", price: 499, time: "5-7 days", description: "End-to-end design from wireframes to high-fidelity prototypes." },
  { id: 3, name: "Brand Strategy Session", price: 150, time: "2 hours", description: "Defining your brand emotional arc and market positioning." }
];

export default function BookingFlow({ hustler, onClose }: BookingFlowProps) {
  const [step, setStep] = useState<BookingStep>("service");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const nextStep = (next: BookingStep) => setStep(next);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <div className="grain-overlay pointer-events-none" />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-[10px] font-black">
                {hustler.creator.name[0]}
             </div>
             <div>
                <h4 className="text-xs font-bold tracking-wider uppercase text-white/40">Booking with</h4>
                <p className="text-sm font-bold text-white leading-none">{hustler.creator.name}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          <AnimatePresence mode="wait">
            {/* STEP 1: SELECT SERVICE */}
            {step === "service" && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-display font-black tracking-tight">Select Service</h2>
                  <p className="text-white/40 text-sm font-light mt-1">Choose the workspace you want to enter.</p>
                </div>

                {MOCK_SERVICES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedService(item);
                      nextStep("schedule");
                    }}
                    className="w-full p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex justify-between items-center group hover:border-white/20 hover:bg-white/[0.05] transition-all text-left active:scale-[0.98]"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-xs text-white/40 font-light leading-relaxed line-clamp-1">{item.description}</p>
                      <div className="flex gap-4 mt-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">From ${item.price}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">• {item.time}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* STEP 2: SCHEDULE */}
            {step === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div>
                   <button onClick={() => setStep("service")} className="text-white/40 mb-4 flex items-center gap-1 hover:text-white">
                      <ChevronLeft size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
                   </button>
                  <h2 className="text-2xl font-display font-black tracking-tight">Set Schedule</h2>
                  <p className="text-white/40 text-sm font-light mt-1">When should work begin?</p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                   {["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17", "Sun 18", "Mon 19"].map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedDate === date ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white/60'}`}
                      >
                         <span className="text-[10px] font-bold uppercase">{date.split(' ')[0]}</span>
                         <span className="text-sm font-bold">{date.split(' ')[1]}</span>
                      </button>
                   ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                   {["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM", "08:30 PM"].map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`h-12 rounded-xl border flex items-center justify-center transition-all ${selectedTime === time ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white/60'}`}
                      >
                         <span className="text-xs font-bold">{time}</span>
                      </button>
                   ))}
                </div>

                <button 
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => nextStep("review")}
                  className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[11px] disabled:opacity-30 disabled:cursor-not-allowed mt-4 transition-all"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* STEP 3: REVIEW */}
            {step === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div>
                   <button onClick={() => setStep("schedule")} className="text-white/40 mb-4 flex items-center gap-1 hover:text-white">
                      <ChevronLeft size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
                   </button>
                  <h2 className="text-2xl font-display font-black tracking-tight">Review Trust</h2>
                  <p className="text-white/40 text-sm font-light mt-1">Verify details before commitment.</p>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="font-bold text-lg leading-none">{selectedService?.name}</h3>
                         <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
                            <Calendar size={12} /> {selectedDate} • <Clock size={12} /> {selectedTime}
                         </p>
                      </div>
                      <span className="text-xl font-display font-black">${selectedService?.price}</span>
                   </div>
                   
                   <div className="h-[1px] bg-white/5 w-full" />
                   
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                         <ShieldCheck size={14} className="text-blue-400" />
                         <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Platform Protected Booking</span>
                      </div>
                      <p className="text-[10px] text-white/30 font-light leading-relaxed">
                         You'll only pay after {hustler.creator.name} confirms the booking. Hustle keeps your funds secure until work is delivered.
                      </p>
                   </div>
                </div>

                <button 
                  onClick={() => nextStep("payment")}
                  className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[11px] mt-4 shadow-xl shadow-white/5"
                >
                  Pay Securely
                </button>
              </motion.div>
            )}

            {/* STEP 4: PAYMENT */}
            {step === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div>
                   <button onClick={() => setStep("review")} className="text-white/40 mb-4 flex items-center gap-1 hover:text-white">
                      <ChevronLeft size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
                   </button>
                  <h2 className="text-2xl font-display font-black tracking-tight">Financial Trust</h2>
                  <p className="text-white/40 text-sm font-light mt-1 text-balance">Your payment is held in a secure <span className="text-blue-400 font-bold">Escrow Account</span> until you approve the work.</p>
                </div>

                <div className="flex flex-col gap-3">
                   {/* Wallet Option */}
                   <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between cursor-pointer group hover:bg-blue-500/20 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                            <Wallet size={24} className="text-blue-400" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold">Hustle Wallet</span>
                            <span className="text-[10px] text-blue-400/60 font-black uppercase tracking-widest">Balance: $1,240.50</span>
                         </div>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-blue-400 flex items-center justify-center">
                         <div className="w-3 h-3 bg-blue-400 rounded-full" />
                      </div>
                   </div>

                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between cursor-pointer group hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/10">
                            <CreditCard size={24} className="text-white/40" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold">Apple Pay</span>
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Instant Activation</span>
                         </div>
                      </div>
                      <div className="w-6 h-6 rounded-full border border-white/10" />
                   </div>
                </div>

                <div className="mt-2 p-6 rounded-2xl bg-white/[0.01] border border-dashed border-white/10">
                   <div className="flex items-center gap-3 mb-3">
                      <ShieldCheck size={16} className="text-blue-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Escrow Guarantee</p>
                   </div>
                   <p className="text-[10px] text-white/20 font-light leading-relaxed">
                      Funds will be released only after you mark the milestone as complete. If the hustler doesn't deliver, your money is returned instantly.
                   </p>
                </div>

                <button 
                  onClick={() => nextStep("success")}
                  className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[11px] mt-2 active:scale-95 transition-transform"
                >
                  Pay & Lock into Escrow
                </button>
              </motion.div>
            )}

            {/* STEP 5: SUCCESS */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-8"
              >
                <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
                   className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-8"
                >
                   <CheckCircle2 size={40} className="text-white" />
                </motion.div>
                
                <h2 className="text-3xl font-display font-black tracking-tight mb-2">You're Booked.</h2>
                <p className="text-white/40 text-sm font-light max-w-[240px] leading-relaxed mb-12">
                   {hustler.creator.name} will confirm your request shortly. Keep an eye on your inbox.
                </p>

                <div className="w-full flex flex-col gap-3">
                   <button 
                      onClick={onClose}
                      className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[11px]"
                   >
                      Back to marketplace
                   </button>
                   <button 
                      onClick={onClose}
                      className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[11px]"
                   >
                      Message Hustler
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
