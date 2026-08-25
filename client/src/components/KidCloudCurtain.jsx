import { useEffect, useState } from "react";

export default function KidCloudCurtain({ stage, skyState }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const stops = skyState?.stops || [];
  const style = {
    "--curtain-s1": stops[0] || "#0b1b3a",
    "--curtain-s2": stops[1] || "#1aaee8",
    "--curtain-s3": stops[2] || "#12a8e0",
    "--curtain-s4": stops[3] || "#6fd3f2",
    "--curtain-s5": stops[4] || "#eaf8ff",
    "--curtain-s6": stops[5] || "#f5fbff",
  };

  return (
    <div
      className={`kid-curtain${stage === "leave" ? " is-leaving" : ""}${
        mounted ? " is-mounted" : ""
      }`}
      style={style}
      aria-hidden="true"
    >
      <div className="kid-curtain-backdrop" />

      <div className="kid-curtain-puff kid-curtain-puff-a" />
      <div className="kid-curtain-puff kid-curtain-puff-b" />
      <div className="kid-curtain-puff kid-curtain-puff-c" />
      <div className="kid-curtain-puff kid-curtain-puff-d" />
      <div className="kid-curtain-puff kid-curtain-puff-e" />
      <div className="kid-curtain-puff kid-curtain-puff-f" />
      <div className="kid-curtain-puff kid-curtain-puff-core" />

      <div className="kid-curtain-mist" />

      <div className="kid-curtain-center">
        <span className="kid-curtain-badge">
          <span className="kid-curtain-ring kid-curtain-ring-1" />
          <span className="kid-curtain-ring kid-curtain-ring-2" />
          <img
            src="/logo/logo-mau/lg-m-kid-studio.png"
            alt=""
            className="kid-curtain-logo"
          />
        </span>
        <p className="kid-curtain-text">Bé chờ một chút xíu nhé…</p>
        <span className="kid-curtain-dots">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}