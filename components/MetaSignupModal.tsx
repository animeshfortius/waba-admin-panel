import React, { useState, useEffect } from "react";

// Declare global FB object for TypeScript
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

interface MetaSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueWithFacebook?: (companyWebsite: string, companyName: string) => void;
}

export default function MetaSignupModal({
  isOpen,
  onClose,
}: MetaSignupModalProps) {
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1405995811146008',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    // Load Facebook SDK Script safely
    const loadFBSdk = () => {
      if (document.getElementById('facebook-jssdk')) return;
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      const fjs = document.getElementsByTagName('script')[0];
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    };
    loadFBSdk();
  }, []);

  // Official Meta Embedded Signup SDK Handler for Solution Partners
  const handleFacebookSignup = () => {
    if (!window.FB) {
      alert("Facebook SDK is still loading. Please try again in a moment.");
      return;
    }

    onClose();

    window.FB.login(function (response: any) {
      if (response.authResponse) {
        const code = response.authResponse.code || response.authResponse.accessToken;
        const sessionInfo = response.authResponse.sessionInfo || {};
        
        // Extract real WABA ID and Phone ID from SDK sessionInfo
        const wabaId = sessionInfo.waba_id || sessionInfo.whatsapp_business_account_id;
        const phoneNumberId = sessionInfo.phone_number_id;
        const displayPhone = sessionInfo.display_phone_number;
        const metaDisplayName = sessionInfo.display_name || sessionInfo.name;

        // Automatically send real IDs and data to backend register API
        fetch("/api/configuration/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            code, 
            wabaId,
            phoneNumberId,
            displayPhone,
            website: companyWebsite, 
            name: metaDisplayName || companyName 
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("WhatsApp channel and credit line connected successfully!");
            window.location.reload();
          } else {
            alert("Error: " + (data.error || "Failed to register channel"));
          }
        })
        .catch(err => {
          console.error(err);
          alert("Error registering channel details.");
        });

      } else {
        alert("User cancelled login or did not fully authorize.");
      }
    }, {
      config_id: '891599173270116',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {
          solutionID: '891846553340614'
        },
        featureType: 'whatsapp_business_app_onboarding',
        sessionInfoVersion: 3
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-base font-bold text-gray-800">
            Get started with WhatsApp's Business API
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 leading-relaxed">
          WhatsApp is one of the most popular communication applications in the world. WhatsApp is a Facebook company and requires a Facebook account and Facebook Business Manager to set up.
        </p>

        <div className="space-y-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
            👈 What you will need
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 pl-1">
            <li>Access to Facebook Business Manager</li>
            <li>A viable Phone Number for WhatsApp</li>
            <li>Your business's legal address and details</li>
            <li>Verify your Facebook Business</li>
            <li>Full access to the WhatsApp Business account</li>
            <li>The ID should belong to the business you manage</li>
            <li>FB user ID must manage templates, phone numbers, QR codes</li>
          </ul>
        </div>

        <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-bold text-gray-700 w-36">
              Company Website:
            </label>
            <input
              type="text"
              placeholder="Company Website"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full sm:w-80 bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-bold text-gray-700 w-36">
              Company Name:
            </label>
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full sm:w-80 bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
            👈 To continue you need access to your Facebook business account, including:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 pl-1">
            <li>Your company's <span className="text-emerald-600">legal name and address</span></li>
            <li>A display name and short description</li>
            <li>A valid email address</li>
            <li>A valid mobile number</li>
            <li>A business-owned phone number</li>
          </ul>
        </div>

        <div className="flex justify-start items-center space-x-3 pt-3 border-t">
          <button
            type="button"
            onClick={handleFacebookSignup}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs flex items-center gap-2"
          >
            <span>👤</span> Continue with Facebook
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}