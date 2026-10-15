export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Analytics</h1>
        <div className="text-sm bg-white border px-3 py-2 rounded-lg shadow-sm text-gray-600 font-medium">
          📅 Oct 4, 2026 - Oct 10, 2026
        </div>
      </div>

      {/* Top Metrics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Sent</p>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-gray-800">2</span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">↑ 100.00%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Delivered</p>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-gray-800">2</span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">↑ 100.00%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Delivered & Read</p>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-gray-800">2 / 2</span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Failed Messages</p>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-gray-800">0</span>
            <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">0.00%</span>
          </div>
        </div>
      </div>

      {/* Category breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
            <span>📢</span><span>MARKETING</span>
          </h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total: 0</span>
            <span>Delivered: 0</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
            <span>📦</span><span>UTILITY</span>
          </h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total: 1</span>
            <span>Delivered: 1</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
            <span>🔐</span><span>AUTHENTICATION</span>
          </h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total: 1</span>
            <span>Delivered: 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}