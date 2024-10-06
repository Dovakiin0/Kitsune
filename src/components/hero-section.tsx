import React from "react";
import Container from "./container";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <div className='w-full bg-[url("https://wallpapers.com/images/high/chainsaw-man-background-s09zo4emiqa1lcva.webp")] bg-cover bg-no-repeat bg-center h-[80vh]'>
      <div className="w-full h-[calc(100%-5.25rem)] mt-[5.25rem]">
        <Container className="w-full  h-full flex flex-col justify-end md:justify-center pb-10">
          <div className="space-y-2 lg:w-[20vw]">
            <h1 className="text-4xl font-black">Chainsaw Man</h1>
            <p className="text-lg">
              Denji has a simple dream - to live a happy and peaceful life,
              spending time with a girl
            </p>
            <div className="flex items-center gap-5">
              <Button className="h-10 text-md">Learn More</Button>
              <Button className="h-10 text-md" variant={"secondary"}>
                To Watch
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default HeroSection;

