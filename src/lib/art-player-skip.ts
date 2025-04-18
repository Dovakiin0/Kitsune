import Artplayer from "artplayer"; // Import the core Artplayer type

// Define the structure of a single time range
// Using number | typeof Infinity makes it explicit that Infinity is allowed
type TimeRange = [number, number | typeof Infinity];

// Define the structure of the option array
type SkipOption = TimeRange[];

// Define the structure of the object returned by the plugin factory
interface SkipPluginReturn {
  name: string;
  // The update function takes the same option structure, optionally
  update: (newOption?: SkipOption) => void;
}

// Define the type for the plugin factory function itself
// It takes an Artplayer instance and returns our defined plugin object structure
type SkipPluginFactory = (art: Artplayer) => SkipPluginReturn;

/**
 * ArtPlayer plugin to automatically skip specified time ranges.
 * @param option An array of time ranges to skip. Each range is [start, end]. 'end' can be Infinity.
 * @returns An ArtPlayer plugin factory function.
 */
function artplayerPluginSkip(option: SkipOption = []): SkipPluginFactory {
  /**
   * Validates the structure and logic of the time ranges array.
   * @param ranges The array of time ranges to validate.
   * @throws {TypeError|RangeError} If validation fails.
   */
  function validateRanges(ranges: SkipOption): void {
    if (!Array.isArray(ranges)) {
      // Technically redundant with TS typing, but good runtime safety
      throw new TypeError("Option must be an array of time ranges");
    }

    ranges.forEach((range: TimeRange, index: number) => {
      if (!Array.isArray(range) || range.length !== 2) {
        // Redundant check
        throw new TypeError(
          `Range at index ${index} must be an array of two numbers`,
        );
      }

      const [start, end] = range; // TypeScript infers types here

      // Explicit type check for runtime safety (JS consumers)
      if (
        typeof start !== "number" ||
        (typeof end !== "number" && end !== Infinity)
      ) {
        throw new TypeError(
          `Range at index ${index} must contain valid numbers or Infinity`,
        );
      }

      // Logical check
      if (end !== Infinity && start >= end) {
        throw new RangeError(
          `In range at index ${index}, start time must be less than end time`,
        );
      }

      // Overlap check
      if (index > 0) {
        // Explicitly type prevEnd for clarity, though TS can infer it
        const prevEnd: number | typeof Infinity = ranges[index - 1][1];
        // Check only if previous end is not Infinity
        if (prevEnd !== Infinity && start < prevEnd) {
          // Use '<' instead of '<=' to allow ranges like [5, 10], [10, 15]
          throw new RangeError(
            `Range at index ${index} [${start},${end}] starts before or overlaps with the previous range end [${prevEnd}]`,
          );
        }
      }
    });
  }

  // Validate initial options
  validateRanges(option);

  // --- Plugin Factory ---
  // This function is returned and called by ArtPlayer with its instance
  return (art: Artplayer): SkipPluginReturn => {
    // Store the processed ranges internally
    // Initialize with the input option, will be updated later
    let skipRanges: TimeRange[] = [...option]; // Use spread to avoid modifying the original option

    // Internal function to replace Infinity with actual duration
    function updateRangesWithDuration(): void {
      const duration = art.duration;
      // We only update if duration is a valid number > 0
      if (typeof duration === "number" && duration > 0) {
        skipRanges = skipRanges.map(
          ([start, end]): TimeRange => [
            start,
            // Only replace Infinity, keep existing numbers
            end === Infinity ? duration : end,
          ],
        );
        // Optional: Re-sort ranges after potentially changing Infinity?
        // skipRanges.sort((a, b) => a[0] - b[0]);
      }
      // Handle cases where duration might not be immediately available or is 0
      else {
        // Keep Infinity as is for now, might get updated on next loadedmetadata
        console.warn(
          "ArtPlayer duration not available or invalid during range update.",
        );
      }
    }

    // Internal function to check current time and skip if needed
    function checkAndSkip(): void {
      const currentTime = art.currentTime;
      // Ensure currentTime and duration are valid numbers before proceeding
      if (
        typeof currentTime !== "number" ||
        typeof art.duration !== "number" ||
        art.duration <= 0
      ) {
        return;
      }

      for (const [start, end] of skipRanges) {
        // Check if end is Infinity - if so, skip calculation relies on updateRangesWithDuration having run
        if (end === Infinity) continue; // Should ideally be replaced by duration

        // Check if current time falls within the range (inclusive start, exclusive end)
        if (currentTime >= start && currentTime < end) {
          // Seek to the end of the skip range
          // Check if end is beyond duration - seek to duration instead
          art.seek = Math.min(end, art.duration);
          // console.log(`Skipped from ${currentTime.toFixed(2)} to ${end}`);
          break; // Exit loop after skipping one range
        }
      }
    }

    // --- Event Listeners ---
    // Update ranges when video metadata (like duration) is loaded
    art.on("video:loadedmetadata", updateRangesWithDuration);
    // Check for skipping on every time update
    art.on("video:timeupdate", checkAndSkip);
    // Also update ranges if duration changes later (e.g., live stream manifest update)
    art.on("video:durationchange", updateRangesWithDuration);

    // Initial update in case metadata is already loaded
    updateRangesWithDuration();

    // --- Plugin Object ---
    // Return the object conforming to ArtPlayer's plugin structure
    return {
      name: "artplayerPluginSkip",
      // Method to update the skip ranges dynamically after initialization
      update(newOption: SkipOption = []): void {
        // Validate the new options first
        validateRanges(newOption);
        // Update the internal ranges, use spread to create a new array
        skipRanges = [...newOption];
        // Re-process ranges with the current duration
        updateRangesWithDuration();
      },
    };
  };
}

export default artplayerPluginSkip; // Export if used as a module
