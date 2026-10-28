'use client';
import { useState } from 'react';

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState('balance');
  
  const [bearerToken, setBearerToken] = useState('');
  const [tokenApplied, setTokenApplied] = useState(false);
  const [version, setVersion] = useState('v1');
  const [wabaId, setWabaId] = useState('123456789');
  const [phoneNumberId, setPhoneNumberId] = useState('987654321');
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const handleTryApi = async (url: string, method: string, body?: any) => {
    setLoading(true);
    setApiResponse(null);

    try {
      const headers: Record<string, string> = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
      }

      const res = await fetch(url, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json().catch(() => ({ status: res.status, message: res.statusText }));
      setApiResponse({ status: res.status, data });
    } catch (err: any) {
      setApiResponse({ status: 'ERROR', error: err.message || 'Failed to connect' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 text-sm">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-white border-r overflow-y-auto p-4 space-y-5">
        <div className="font-bold text-lg text-gray-900 border-b pb-3">WhatsApp API Console</div>

        <div>
          <button 
            onClick={() => { setActiveTab('auth'); setApiResponse(null); }} 
            className={`w-full text-left px-3 py-2 rounded font-medium ${activeTab === 'auth' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            🔐 Authentication
          </button>
        </div>

        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Balance</div>
          <button onClick={() => { setActiveTab('balance'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium ${activeTab === 'balance' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">GET</span> Get Wallet Balance
          </button>
        </div>

        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">CleverTap API's - Whatsapp</div>
          <button onClick={() => { setActiveTab('clevertap'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium ${activeTab === 'clevertap' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">POST</span> /api/v1/meta/clevertap
          </button>
        </div>

        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Moengage API's - Whatsapp</div>
          <button onClick={() => { setActiveTab('moengage'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium ${activeTab === 'moengage' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">POST</span> /api/v1/meta/moengage
          </button>
          <button onClick={() => { setActiveTab('webengage'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium mt-1 ${activeTab === 'webengage' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">POST</span> /api/v1/meta/webengage
          </button>
        </div>

        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Moengage/Meta API's Templates</div>
          <button onClick={() => { setActiveTab('get-templates'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium ${activeTab === 'get-templates' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">GET</span> Get templates
          </button>
          <button onClick={() => { setActiveTab('template-by-id'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium mt-1 ${activeTab === 'template-by-id' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">GET</span> /api/v1/meta/templates/&#123;id&#125;
          </button>
          <button onClick={() => { setActiveTab('sync-templates'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium mt-1 ${activeTab === 'sync-templates' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">POST</span> /api/v1/meta/templates/sync
          </button>
        </div>

        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">WhatsApp API</div>
          <button onClick={() => { setActiveTab('webhook'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium ${activeTab === 'webhook' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">POST</span> Webhook
          </button>
          <button onClick={() => { setActiveTab('create-template'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium mt-1 ${activeTab === 'create-template' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">POST</span> Create Template
          </button>
          <button onClick={() => { setActiveTab('send-message'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium mt-1 ${activeTab === 'send-message' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">POST</span> Send WhatsApp Message
          </button>
        </div>

        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">WhatsApp Media API</div>
          <button onClick={() => { setActiveTab('upload-media'); setApiResponse(null); }} className={`w-full text-left px-3 py-1.5 rounded font-medium ${activeTab === 'upload-media' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 font-mono">POST</span> Upload WhatsApp Media
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl bg-white border rounded-lg shadow-sm p-6 space-y-6">

          {activeTab === 'auth' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800">AUTHENTICATION</h2>
              <p className="text-xs text-red-500 font-medium mt-1">{tokenApplied ? '✓ Token Applied' : 'No API key applied'}</p>
              
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-1">HTTP Bearer</h4>
                <p className="text-xs text-gray-500 mb-3">Enter Bearer token in the format: <b>Bearer &lt;token&gt;</b></p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="api-token" 
                    value={bearerToken} 
                    onChange={(e) => setBearerToken(e.target.value)}
                    className="flex-1 border px-3 py-1.5 rounded text-xs"
                  />
                  <button 
                    onClick={() => { setTokenApplied(true); alert('Bearer Token Set!'); }}
                    className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-green-700"
                  >
                    SET
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'balance' && (
            <div>
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Get Wallet Balance</h2>
                  <p className="text-xs font-mono text-gray-500 mt-1"><span className="text-blue-600 font-bold">GET</span> /api/v1/user/balance</p>
                </div>
                <button 
                  onClick={() => handleTryApi('/api/v1/user/balance', 'GET')}
                  className="bg-green-600 text-white font-bold px-5 py-2 rounded text-xs hover:bg-green-700 shadow"
                >
                  {loading ? 'RUNNING...' : 'TRY'}
                </button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase">REQUEST</span>
                  <button onClick={() => copyToClipboard(`curl -X GET "http://localhost:3000/api/v1/user/balance" -H "Authorization: Bearer ${bearerToken || '<token>'}"`)} className="text-xs text-gray-500 hover:text-black">
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                  curl -X GET "http://localhost:3000/api/v1/user/balance" \<br/>
                  &nbsp;&nbsp;-H "Authorization: Bearer {bearerToken || '<token>'}"
                </div>
              </div>
            </div>
          )}

          {activeTab === 'send-message' && (
            <div>
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Send WhatsApp Message</h2>
                  <p className="text-xs font-mono text-gray-500 mt-1"><span className="text-green-600 font-bold">POST</span> /{version}/{phoneNumberId}/messages</p>
                </div>
                <button 
                  onClick={() => handleTryApi(`/api/${version}/${phoneNumberId}/messages`, 'POST', { messaging_product: "whatsapp", to: "919999999999", type: "text", text: { body: "Hello World" } })}
                  className="bg-green-600 text-white font-bold px-5 py-2 rounded text-xs hover:bg-green-700 shadow"
                >
                  {loading ? 'SENDING...' : 'TRY'}
                </button>
              </div>

              <div className="mt-4 p-3 bg-gray-50 border rounded space-y-3">
                <span className="text-xs font-bold text-gray-500 uppercase">PATH PARAMETERS</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600">version *</label>
                    <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} className="w-full border px-2.5 py-1 rounded text-xs"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600">phoneNumberId *</label>
                    <input type="text" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="w-full border px-2.5 py-1 rounded text-xs"/>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs font-bold text-gray-500 uppercase">REQUEST</span>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs mt-1">
                  curl -X POST "http://localhost:3000/api/{version}/{phoneNumberId}/messages" \<br/>
                  &nbsp;&nbsp;-H "Authorization: Bearer {bearerToken || '<token>'}" \<br/>
                  &nbsp;&nbsp;-H "Content-Type: application/json"
                </div>
              </div>
            </div>
          )}

          {!['auth', 'balance', 'send-message'].includes(activeTab) && (
            <div>
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 uppercase">{activeTab.replace('-', ' ')}</h2>
                  <p className="text-xs font-mono text-gray-500 mt-1">Endpoint Documentation & Testing</p>
                </div>
                <button 
                  onClick={() => handleTryApi(`/api/v1/${activeTab}`, 'POST', { test: true })}
                  className="bg-green-600 text-white font-bold px-5 py-2 rounded text-xs hover:bg-green-700 shadow"
                >
                  {loading ? 'RUNNING...' : 'TRY'}
                </button>
              </div>

              <div className="mt-4">
                <span className="text-xs font-bold text-gray-500 uppercase">REQUEST</span>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs mt-1">
                  curl -X POST "http://localhost:3000/api/v1/meta/{activeTab}" \<br/>
                  &nbsp;&nbsp;-H "Authorization: Bearer {bearerToken || '<token>'}"
                </div>
              </div>
            </div>
          )}

          {apiResponse && (
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-700 uppercase">RESPONSE</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${apiResponse.status === 200 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  STATUS: {apiResponse.status}
                </span>
              </div>
              <pre className="bg-gray-900 text-blue-300 p-4 rounded text-xs font-mono overflow-x-auto max-h-60">
                {JSON.stringify(apiResponse.data || apiResponse, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}