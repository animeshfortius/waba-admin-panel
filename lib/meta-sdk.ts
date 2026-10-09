// Meta Embedded Signup SDK Loader & Trigger Helper

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

export const loadFacebookSDK = () => {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") return;

    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID || "123456789012345",
        cookie: true,
        xfbml: true,
        version: "v20.0",
      });
      resolve();
    };

    (function (d, s, id) {
      let js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  });
};

export const launchEmbeddedSignup = (onSuccess: (data: any) => void) => {
  if (typeof window === "undefined" || !window.FB) {
    alert("Facebook SDK loading... Please try again in a moment.");
    return;
  }

  window.FB.login(
    (response: any) => {
      if (response.authResponse) {
        onSuccess({
          code: response.authResponse.code,
          authResponse: response.authResponse,
        });
      } else {
        console.log("User cancelled login or did not fully authorize.");
      }
    },
    {
      config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID || "YOUR_CONFIG_ID",
      response_type: "code",
      override_default_response_type: true,
      extras: {
        setup: {},
      },
    }
  );
};