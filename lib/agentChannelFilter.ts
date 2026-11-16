export function getAgentPermittedChannels(allAccounts: any[]): any[] {
  if (typeof window === "undefined") return allAccounts;

  const rawAgent = localStorage.getItem("currentAgent");
  if (!rawAgent) return allAccounts; // Admin sees all channels

  try {
    const agent = JSON.parse(rawAgent);

    let permittedList: string[] = [];
    if (Array.isArray(agent.assignedChannelsList)) {
      permittedList = agent.assignedChannelsList;
    } else if (typeof agent.assignedChannels === "string") {
      try {
        permittedList = JSON.parse(agent.assignedChannels);
      } catch {
        permittedList = agent.assignedChannels.split(",").filter(Boolean);
      }
    }

    if (permittedList.length > 0) {
      const normalizedPermitted = permittedList.map((p) => p.replace(/\D/g, ""));
      return allAccounts.filter((acc) => {
        const accPhone = (acc.displayPhone || "").replace(/\D/g, "");
        return (
          permittedList.includes(acc.displayPhone) ||
          permittedList.includes(acc.phoneNumberId) ||
          permittedList.includes(acc.wabaId) ||
          (accPhone && normalizedPermitted.includes(accPhone))
        );
      });
    }

    return agent.allChannelAccess ? allAccounts : [];
  } catch (err) {
    console.error("Agent channel filter error:", err);
    return allAccounts;
  }
}

export function isAgentSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("currentAgent"));
}