import { pb } from "@/lib/pocketbase";
import { useQuery } from "@tanstack/react-query";

export const GET_SOURCE_AVAILABLE_KEY = "GET_SOURCE_AVAILABLE";

export const useGetSourceAvailable = () => {
  return useQuery({
    queryKey: [GET_SOURCE_AVAILABLE_KEY],
    queryFn: async () => {
      try {
        const records = await pb.collection("sys_source_available").getList(1, 1, {
          requestKey: null,
        });
        if (records.items && records.items.length > 0) {
          return Boolean(records.items[0].available);
        }
        return true; // Default to true if table record is empty
      } catch (error) {
        console.error("Error fetching sys_source_available:", error);
        return true; // Default to true on error so stream is attempted
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
