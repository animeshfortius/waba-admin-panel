"use client";

import { Save, Key, Globe, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 text-sm">Configure Meta API Credentials, System Webhooks, and SaaS Platform Defaults.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-600" /> Meta Developer API Keys
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Meta App ID</label>
            <input 
              type="text" 
              defaultValue="102938475610293" 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Meta App Secret</label>
            <input 
              type="password" 
              defaultValue="************************" 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Embedded Signup Config ID</label>
            <input 
              type="text" 
              defaultValue="CONFIG_9988776655" 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" /> Webhook Configuration
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Inbound Webhook Endpoint</label>
          <input 
            type="text" 
            readOnly 
            value="https://your-domain.com/api/webhooks/whatsapp" 
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>
    </div>
  );
}