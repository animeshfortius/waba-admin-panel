const handleFacebookSignup = () => {
    if (!window.FB) {
      alert("Facebook SDK is still loading. Please try again in a moment.");
      return;
    }

    onClose();

    window.FB.login(function (response: any) {
      console.log("Full FB Response:", response); // Debug ke liye
      
      if (response.authResponse) {
        const code = response.authResponse.code || response.authResponse.accessToken;
        const sessionInfo = response.authResponse.sessionInfo || {};
        
        // Saari possible keys check karo taaki ID miss na ho
        const wabaId = sessionInfo.waba_id || sessionInfo.whatsapp_business_account_id || sessionInfo.id;
        const phoneNumberId = sessionInfo.phone_number_id || sessionInfo.phone_id;
        const displayPhone = sessionInfo.display_phone_number;
        const metaDisplayName = sessionInfo.display_name || sessionInfo.name;

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