import React, { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { WatchHistory } from "@/hooks/use-get-bookmark";
import styles from "../heatmap.module.css";
import { useAuthStore } from "@/store/auth-store";
import { pb } from "@/lib/pocketbase";
import { toast } from "sonner";
import { Tooltip } from "react-tooltip";

type HeatmapValue = {
  date: string;
  count: number;
};

export type BookmarkData = {
  watchHistory: string[];
};

function AnimeHeatmap() {
  const { auth } = useAuthStore();
  const [heatmapData, setHeatmapData] = useState<HeatmapValue[]>([]);
  const [totalContributionCount, setTotalContributionCount] =
    useState<number>(0);

  const startDate = new Date(new Date().setMonth(0, 1));
  const endDate = new Date(new Date().setMonth(11, 31));

  // --- Data Fetching and Aggregation ---
  const fetchAndAggregateWatchHistory = async () => {
    if (!auth?.id) return; // Need authenticated user ID

    try {
      // 1. Get all bookmark records for the user
      const bookmarkRecords = await pb
        .collection<BookmarkData>("bookmarks")
        .getFullList({
          filter: `user = "${auth.id}"`,
          fields: "watchHistory", // Only fetch the relation IDs needed
        });

      if (!bookmarkRecords || bookmarkRecords.length === 0) {
        console.log("No bookmarks found for user.");
        setHeatmapData([]);
        setTotalContributionCount(0);
        return;
      }

      // 2. Collect all unique watched record IDs from all bookmarks
      const watchedRecordIds = bookmarkRecords.reduce(
        (acc: string[], bookmark) => {
          // Ensure watchHistory is an array and add its IDs to accumulator
          if (Array.isArray(bookmark.watchHistory)) {
            bookmark.watchHistory.forEach((id) => {
              if (!acc.includes(id)) {
                // Add only unique IDs
                acc.push(id);
              }
            });
          }
          return acc;
        },
        [],
      );

      if (watchedRecordIds.length === 0) {
        setHeatmapData([]);
        setTotalContributionCount(0);
        return;
      }

      const watchedFilter = watchedRecordIds
        .map((id) => `id = "${id}"`)
        .join(" || ");

      try {
        // 4. Fetch all corresponding 'watched' records
        const watchedRecords = await pb
          .collection<WatchHistory>("watched")
          .getFullList({
            filter: watchedFilter,
            fields: "created", // Only need the creation date
          });
        const dailyCounts: { [key: string]: number } = {};
        let totalCount = 0;

        watchedRecords.forEach((record) => {
          const dateStr = record.created.substring(0, 10); // Extracts "YYYY-MM-DD"

          if (dailyCounts[dateStr]) {
            dailyCounts[dateStr] += 1;
          } else {
            dailyCounts[dateStr] = 1;
          }
          totalCount += 1;
        });

        const formattedData = Object.entries(dailyCounts).map(
          ([date, count]) => ({
            date,
            count,
          }),
        );

        setHeatmapData(formattedData);
        setTotalContributionCount(totalCount);
      } catch (error) {
        console.error("Error fetching watched records:", error);
      }
    } catch (error) {
      console.error("Error fetching or aggregating watch history:", error);
      toast.error("Failed to load watch activity.");
      setHeatmapData([]); // Clear data on error
      setTotalContributionCount(0);
    }
  };

  useEffect(() => {
    if (!auth?.id) return; // Need authenticated user ID
    fetchAndAggregateWatchHistory();
  }, []);

  const getClassForValue = (value: HeatmapValue | null): string => {
    if (!value || value.count === 0) {
      return styles.colorEmpty;
    }
    if (value.count >= 10) {
      return styles.colorScale4;
    }
    if (value.count >= 5) {
      return styles.colorScale3;
    }
    if (value.count >= 2) {
      return styles.colorScale2;
    }
    if (value.count >= 1) {
      return styles.colorScale1;
    }
    return styles.colorEmpty;
  };

  const getTooltipContent = (
    value: HeatmapValue | null,
  ): Record<string, string> => {
    const val = value as HeatmapValue;
    if (!val.date) {
      return {
        "data-tooltip-id": "heatmap-tooltip",
        "data-tooltip-content": "No episodes watched",
      };
    }
    const formatedDate = new Date(val.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return {
      "data-tooltip-id": "heatmap-tooltip",
      "data-tooltip-content": `Watched ${val.count} episodes on ${formatedDate}`,
    } as Record<string, string>;
  };

  return (
    <>
      <p className="text-lg font-bold mb-4">
        Watched {totalContributionCount} episodes in the last year
      </p>
      <CalendarHeatmap
        weekdayLabels={["", "M", "", "W", "", "F", ""]}
        showWeekdayLabels={true}
        showOutOfRangeDays={true}
        startDate={startDate}
        endDate={endDate}
        classForValue={(value) =>
          getClassForValue(value as unknown as HeatmapValue)
        }
        values={heatmapData}
        gutterSize={2}
        tooltipDataAttrs={(value) => getTooltipContent(value as HeatmapValue)}
      />
      <Tooltip id="heatmap-tooltip" />
    </>
  );
}

export default AnimeHeatmap;
