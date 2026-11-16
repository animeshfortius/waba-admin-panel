"use client";

import { useState, useEffect } from "react";

export default function LiveAgentPage() {
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  const [view, setView] = useState<"menu" | "live" | "history">("menu");

  useEffect(() => {
    const ag = localStorage.getItem("currentAgent");
    if (ag) {
      setCurrentAgent(JSON.parse(ag));
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-6 font-sans text-xs space-y-6">
      <div className="bg-white p-5 rounded-2xl border shadow-xs flex justify-between items-center">
        <div>
          <div className="text-gray-400 font-medium">Live Agents Configuration</div>
          <h1 className="text-xl font-bold text-gray-800">
            {currentAgent ? `Agent Workspace: ${currentAgent.name}` : "Live Agent Panel"}
          </h1>
        </div>
        <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl font-bold">
          Active Session
        </span>
      </div>

      {view === "menu" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
          <div
            onClick={() => setView("live")}
            className="bg-white p-8 rounded-3xl border shadow-md hover:shadow-xl transition cursor-pointer text-center space-y-4 group border-t-4 border-t-emerald-500"
          >
            <div className="text-5xl group-hover:scale-110 transition">🧑‍💼</div>
            <h3 className="font-extrabold text-base text-gray-800">Live Agents</h3>
            <p className="text-gray-400 text-xs">Manage your active live chats.</p>
          </div>

          <div
            onClick={() => setView("history")}
            className="bg-white p-8 rounded-3xl border shadow-md hover:shadow-xl transition cursor-pointer text-center space-y-4 group border-t-4 border-t-blue-500"
          >
            <div className="text-5xl group-hover:scale-110 transition">📑</div>
            <h3 className="font-extrabold text-base text-gray-800">Live Agents History</h3>
            <p className="text-gray-400 text-xs">View and search agent chat history.</p>
          </div>
        </div>
      )}

      {view === "live" && (
        <div className="bg-white rounded-3xl border shadow-xs p-6 space-y-4">
          <button onClick={() => setView("menu")} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl cursor-pointer">
            ⬅ Back to Menu
          </button>
          <div className="border rounded-2xl p-12 text-center text-gray-400 font-medium">
            💬 Active Live Customer Chats Interface
          </div>
        </div>
      )}

      {view === "history" && (
        <div className="bg-white rounded-3xl border shadow-xs p-6 space-y-4">
          <button onClick={() => setView("menu")} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl cursor-pointer">
            ⬅ Back to Menu
          </button>
          <div className="border rounded-2xl p-12 text-center text-gray-400 font-medium">
            📑 Historical Chat Logs & Audit
          </div>
        </div>
      )}
    </div>
  );
}