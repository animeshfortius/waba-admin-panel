"use client";

import { useState } from "react";

export default function AgentChatConfigModal({ agent, onClose }: { agent: any; onClose: () => void }) {
  const [welcomeActive, setWelcomeActive] = useState(true);
  const [offHoursActive, setOffHoursActive] = useState(false);
  const [workingDays, setWorkingDays] = useState<any>({
    Sunday: { active: false, start: "09:00", end: "18:00" },
    Monday: { active: true, start: "09:30", end: "19:00" },
    Tuesday: { active: true, start: "09:30", end: "19:00" },
    Wednesday: { active: true, start: "09:30", end: "19:00" },
    Thursday: { active: true, start: "09:30", end: "19:00" },
    Friday: { active: true, start: "09:30", end: "19:00" },
    Saturday: { active: false, start: "09:00", end: "14:00" },
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto font-sans text-xs">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Chat Configuration & Working Hours — <span className="text-emerald-600">{agent.name}</span>
            </h2>
            <p className="text-slate-400 text-[11px]">Configure automated WhatsApp welcome/off-hour replies and shift timings</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Welcome & Off Hours */}
          <div className="lg:col-span-7 space-y-5">
            {/* Welcome Message Card */}
            <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 text-sm">Welcome Message</span>
                <button
                  onClick={() => alert("Configure welcome message template")}
                  className="px-3 py-1 bg-white border rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  ✏️ Configure
                </button>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={welcomeActive}
                  onChange={(e) => setWelcomeActive(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="text-slate-600 font-medium">Configure automated reply for user's first query during working hours</span>
              </label>

              {/* WhatsApp Message Preview Bubble */}
              <div className="bg-emerald-900/10 border border-emerald-900/20 p-3.5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold">
                  <span>WhatsApp Live Preview</span>
                  <span>8:10 AM</span>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-2xs border text-slate-800">
                  Welcome!, thanks for visiting. How can our support team assist you today?
                </div>
              </div>
            </div>

            {/* Off Hours Message Card */}
            <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 text-sm">Off Hours Message</span>
                <button
                  onClick={() => alert("Configure off-hours message template")}
                  className="px-3 py-1 bg-white border rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  ✏️ Configure
                </button>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offHoursActive}
                  onChange={(e) => setOffHoursActive(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="text-slate-600 font-medium">Configure automated reply for user's first query during off hours</span>
              </label>

              {/* WhatsApp Preview Bubble */}
              <div className="bg-slate-100 border p-3.5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span>WhatsApp Live Preview</span>
                  <span>9:10 PM</span>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-2xs border text-slate-800">
                  We're currently offline. We will respond during our next working shift!
                </div>
              </div>
            </div>
          </div>

          {/* Right: Working Operational Hours */}
          <div className="lg:col-span-5">
            <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Working / Operational Hours</h3>
                  <p className="text-[10px] text-slate-400">Day-wise shift timings for automated replies</p>
                </div>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">🕒 SLA</span>
              </div>

              <div className="divide-y divide-slate-200/60">
                {Object.keys(workingDays).map((day) => {
                  const dayObj = workingDays[day];
                  return (
                    <div key={day} className="py-2.5 flex items-center justify-between">
                      <span className="font-bold text-slate-700 w-20">{day}</span>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={dayObj.active}
                          onChange={(e) =>
                            setWorkingDays({
                              ...workingDays,
                              [day]: { ...dayObj, active: e.target.checked },
                            })
                          }
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                        <span className={`text-[11px] font-bold ${dayObj.active ? "text-emerald-700" : "text-slate-400"}`}>
                          {dayObj.active ? `${dayObj.start} - ${dayObj.end}` : "Closed"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  alert("Operational hours saved successfully!");
                  onClose();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer transition mt-2"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}