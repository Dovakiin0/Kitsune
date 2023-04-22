import React from "react";
import LoadingGIF from "@/assets/genkai.gif";
import Image from "next/image";

function LoadingSingle() {
  return <Image src={LoadingGIF} alt="loading..." width={100} height={100} />;
}

export default LoadingSingle;
