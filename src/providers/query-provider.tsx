"use client";

import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "react-query";

type Props = {
  children: ReactNode;
};

const QueryProvider = (props: Props) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
};

export default QueryProvider;

