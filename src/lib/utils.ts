import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts total seconds into a MM:SS formatted string.
 * Handles invalid inputs by returning '00:00'.
 *
 * @param totalSeconds The number of seconds to format.
 * @returns A string in MM:SS format (e.g., "05:30", "30:00").
 */
export function formatSecondsToMMSS(
  totalSeconds: number | null | undefined,
): string {
  // 1. Validate Input
  if (
    typeof totalSeconds !== "number" ||
    totalSeconds < 0 ||
    isNaN(totalSeconds)
  ) {
    return "00:00"; // Return default for invalid input
  }

  // 2. Calculate Minutes and Seconds
  // Get whole minutes by dividing by 60 and flooring
  const minutes = Math.floor(totalSeconds / 60);

  // Get remaining seconds using the modulo operator
  // Use Math.round or Math.floor depending on desired precision if input could have decimals
  const seconds = Math.round(totalSeconds % 60);

  // 3. Format with Padding (Add leading zeros if needed)
  // Convert minutes/seconds to strings and pad with '0' if they are single digit
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  // 4. Combine and Return
  return `${formattedMinutes}:${formattedSeconds}`;
}
