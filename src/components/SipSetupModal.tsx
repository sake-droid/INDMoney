/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, ChevronRight, AlertCircle, Calendar, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Goal } from "../types";
import { formatIndianCurrency } from "../utils/finance";

interface SipSetupModalProps {
  goal: Goal;
  defaultAmount: number;
  onClose: () => void;
  onConfirmSip: (goalId: string, amount: number) => void;
}

const steps = ["amount", "mandate", "success"];

export default function SipSetupModal({
  goal,
  defaultAmount,
  onClose,
  onConfirmSip,
}: SipSetupModalProps) {
  const [currentStep, setCurrentStep] = useState<"amount" | "mandate" | "success">("amount");
  const [sipAmount, setSipAmount] = useState<number>(Math.max(500, Math.round(defaultAmount / 100) * 100));
  const [debitDay, setDebitDay] = useState<number>(5);
  const [selectedBank, setSelectedBank] = useState<string>("hdfc");
  const [mandateApproved, setMandateApproved] = useState<boolean>(false);

  const banks = [
    { id: "hdfc", name: "HDFC Bank AutoDebit", logo: "🏦" },
    { id: "icici", name: "ICICI Bank eMandate", logo: "💳" },
    { id: "sbi", name: "State Bank of India", logo: "🏦" },
    { id: "gpay", name: "UPI AutoPay (GPay/PhonePe)", logo: "📱" }
  ];

  const handleNextStep = () => {
    if (currentStep === "amount") {
      setCurrentStep("mandate");
    } else if (currentStep === "mandate") {
      setMandateApproved(true);
      setCurrentStep("success");
      onConfirmSip(goal.id, sipAmount);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="sip-setup-modal"
      >
        {/* Top Gradient Accent */}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500"></div>

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse"></span>
            <div className="flex flex-col">
              <span className="text-slate-900 font-extrabold text-xs tracking-tight">IND SIP COMPILER</span>
              <span className="text-[10px] text-slate-500 font-bold leading-none capitalize">
                Setup periodic systematic plan
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Stepper Wizard Indicator */}
        <div className="flex justify-between items-center border-b border-slate-100 bg-slate-50/50 px-6 py-2.5 text-[10px] font-bold text-slate-400">
          <div className={`flex items-center gap-1 ${currentStep === "amount" ? "text-violet-600" : "text-emerald-600"}`}>
            <span className="w-4 h-4 rounded-full bg-slate-200/80 flex items-center justify-center text-[9px] font-black">1</span>
            <span>Configure fresh SIP</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <div className={`flex items-center gap-1 ${currentStep === "mandate" ? "text-violet-600" : (currentStep === "success" ? "text-emerald-600" : "")}`}>
            <span className="w-4 h-4 rounded-full bg-slate-200/80 flex items-center justify-center text-[9px] font-black">2</span>
            <span>Approve Mandate</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={`text-[9px] font-black uppercase tracking-wider rounded-md px-1.5 py-0.5 ${currentStep === "success" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100"}`}>
            Live
          </span>
        </div>

        {/* Dynamic Wizard Steps content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {currentStep === "amount" && (
              <motion.div
                key="step-amount"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                {/* Shortfall Summary Pill */}
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 flex gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">
                      DEFICIT DETECTED IN "{goal.title.toUpperCase()}"
                    </span>
                    <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                      You are estimated to have a shortfall deficit of <b className="text-slate-900 font-extrabold">{formatIndianCurrency(goal.shortfall)}</b> over {goal.durationYears} years under inflation adjustments.
                    </p>
                  </div>
                </div>

                {/* Amount Slider / Input */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                      Proposed Monthly SIP size
                    </label>
                    <span className="text-xl font-bold font-sans text-brand flex items-baseline">
                      {formatIndianCurrency(sipAmount)}
                      <span className="text-[10px] text-slate-450 text-slate-500 font-bold ml-1">/mo</span>
                    </span>
                  </div>

                  <input
                    type="range"
                    min={500}
                    max={Math.max(50000, sipAmount * 2.5)}
                    step={250}
                    value={sipAmount}
                    onChange={(e) => setSipAmount(Number(e.target.value))}
                    className="w-full accent-brand h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-slate-400 text-[10px] font-semibold font-mono">
                    <span>Min ₹500</span>
                    <button 
                      type="button" 
                      onClick={() => setSipAmount(Math.round(defaultAmount / 100) * 100)}
                      className="text-violet-600 hover:underline cursor-pointer"
                    >
                      Recommended SIP: {formatIndianCurrency(defaultAmount, true)}
                    </button>
                    <span>Scale Max</span>
                  </div>
                </div>

                {/* Debit date configurations */}
                <div className="space-y-1 bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide flex items-center gap-1 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" />
                    Preferred Auto Debit Cycle Date
                  </label>
                  <p className="text-[10.5px] text-slate-500 font-medium pb-2">
                    Salary auto-pay works best between the 1st and 10th of every month.
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 5, 10, 15, 25].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDebitDay(d)}
                        className={`py-1.5 text-2xs font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                          debitDay === d
                            ? "bg-brand text-white border-brand shadow-3xs"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {d}th
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Proceed to Link Bank Mandate
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === "mandate" && (
              <motion.div
                key="step-mandate"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                    MONTHLY MANDATE VALUE
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-sans">
                    {formatIndianCurrency(sipAmount)} /mo
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Scheduled AutoDebit from bank partner setup cycle on the {debitDay}th of each month.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                    Choose AutoPay Bank partner
                  </span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {banks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBank(b.id)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all duration-150 ${
                          selectedBank === b.id
                            ? "bg-violet-50 border-violet-400 text-violet-950 font-black shadow-3xs"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{b.logo}</span>
                          <span className="text-xs font-bold leading-none">{b.name}</span>
                        </div>
                        <div className={`w-4-4 w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedBank === b.id ? "border-violet-500 bg-violet-600" : "border-slate-350"
                        }`}>
                          {selectedBank === b.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                    Secure 256-bit bank encrypted AutoPay. Cancel or adjust directly anytime with zero cost penalties inside the INDmoney app interface.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setCurrentStep("amount")}
                    className="flex-1 py-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer active:scale-95 transition-all text-center hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <CreditCard className="w-4 h-4" />
                    Approve Pay Mandate
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === "success" && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6 space-y-5"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10 shrink-0" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-emerald-950 font-black text-sm tracking-tight flex items-center justify-center gap-1.5">
                    SIP Setup Complete!
                    <Sparkles className="w-4 h-4 text-violet-500" />
                  </h4>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xs mx-auto">
                    A monthly SIP of <b>{formatIndianCurrency(sipAmount)}</b> has been active for <b>{goal.title}</b>.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-left max-w-sm mx-auto grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">Next Debit Day</span>
                    <span className="text-slate-850 font-sans text-2xs font-extrabold mt-0.5">{debitDay}th July 2026</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">Earmark Target</span>
                    <span className="text-slate-850 text-2xs font-extrabold mt-0.5 truncate">{goal.title}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">Compounding Yield</span>
                    <span className="text-emerald-700 text-2xs font-bold mt-0.5 font-sans">Compounding active</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">Bank Partner</span>
                    <span className="text-slate-850 text-2xs font-extrabold mt-0.5 capitalize">{selectedBank} AutoDebit</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-850 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
