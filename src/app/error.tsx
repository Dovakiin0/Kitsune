"use client"; // Error components must be Client Components

import Image from "next/image";
import { useEffect } from "react";
import ErrorImage from "@/assets/error.gif";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/common/button-link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="w-[100dvw] h-[100dvh]">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col space-y-5 items-center justify-center">
        <Image
          src={ErrorImage.src}
          alt="error"
          width={300}
          height={300}
          className=""
        />
        <p className="font-bold text-2xl">Something went wrong!</p>
        <div className="flex gap-3 items-center">
          <ButtonLink href={ROUTES.HOME}>Back to Home</ButtonLink>
          <Button onClick={() => reset()} className="" variant={"secondary"}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
}

