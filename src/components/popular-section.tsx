// "use client";
//
// import React from "react";
// import Container from "./container";
// import AnimeCard from "./anime-card";
// import { useGetPopularAnime } from "@/query/get-popular-anime";
// import { LIMIT } from "@/constants/requests";
// import Button from "./common/custom-button";
// import { cn } from "@/lib/utils";
// import BlurFade from "./ui/blur-fade";
//
// const PopularSection = () => {
//   const { data, isLoading} =
//     useGetPopularAnime({
//       limit: LIMIT,
//       page: 1,
//     });
//   if (isLoading) return <LoadingSkeleton />;
//   return (
//     <Container className="flex flex-col gap-5 py-10 items-center lg:items-start ">
//       <h5 className="text-2xl font-bold">Most Popular</h5>
//       <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
//         {/* {data?.pages.map((anime, idx) => */}
//         {/*   anime.results.map((ani, index) => ( */}
//         {/*     <BlurFade key={index} delay={index * 0.05} inView> */}
//         {/*       <AnimeCard */}
//         {/*         key={idx} */}
//         {/*         anime={ani} */}
//         {/*         className="self-center justify-self-center" */}
//         {/*         showGenre={false} */}
//         {/*       /> */}
//         {/*     </BlurFade> */}
//         {/*   )) */}
//         {/* )} */}
//       </div>
//       <Button
//         className={cn(["w-full text-md py-6 font-semibold"])}
//         loading={isFetchingNextPage}
//         disabled={isFetchingNextPage}
//         onClick={() => fetchNextPage()}
//       >
//         Show More
//       </Button>
//     </Container>
//   );
// };
//
// const LoadingSkeleton = () => {
//   return (
//     <Container className="flex flex-col gap-5 py-10 items-center lg:items-start ">
//       <div className="h-10 w-[15.625rem] animate-pulse bg-slate-700"></div>
//       <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
//         {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, idx) => {
//           return (
//             <div
//               key={idx}
//               className="rounded-xl h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] md:h-[18.75rem] md:max-w-[12.5rem] animate-pulse bg-slate-700"
//             ></div>
//           );
//         })}
//       </div>
//       <div className="w-full h-16 animate-pulse bg-slate-700"></div>
//     </Container>
//   );
// };
//
// export default PopularSection;
