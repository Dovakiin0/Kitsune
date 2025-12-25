import React from "react";
import Image from "next/image";

const Loading = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="h-[10.25rem] w-auto">
        <Image
          src="/loader.gif"
          height={100}
          width={100}
          unoptimized
          alt="loader"
          className="h-full w-full object-cover"
          suppressHydrationWarning
        />
      </div>
    </div>
  );
};

export default Loading;

