"use client";
import { useEffect, useRef } from "react";

export default function AdBlock() {
  const banner = useRef<HTMLDivElement>(null);

  const atOptions = {
    key: "5a8f69ac613772c8d1445a00d4ee12d5",
    format: "iframe",
    height: 250,
    width: 300,
    params: {},
  };
  useEffect(() => {
    if (banner.current && !banner.current.firstChild) {
      const conf = document.createElement("script");
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `//www.profitabledisplaynetwork.com/${atOptions.key}/invoke.js`;
      conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;

      banner.current.append(conf);
      banner.current.append(script);
    }
  }, [banner]);

  return (
    <div
      className="mx-2 my-5 border border-gray-200 justify-center items-center text-white text-center"
      ref={banner}
    ></div>
  );
}
