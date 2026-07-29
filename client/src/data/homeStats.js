export const getStats = (t, modules) => [
  {
    label: t("home.stats.threatModules"),
    value: modules.length,
    suffix: "",
    color: "#00bfff",
  },
  {
    label: t("home.stats.intelSources"),
    value: 35,
    suffix: "+",
    color: "#00ff88",
  },
  {
    label: t("home.stats.riskTiers"),
    value: 5,
    suffix: "",
    color: "#ff2244",
  },
  {
    label: t("home.stats.responseTime"),
    value: 15,
    suffix: "s",
    color: "#e0e6ff",
  },
];