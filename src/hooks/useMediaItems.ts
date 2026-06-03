import { useQuery } from "@tanstack/react-query";
import { mediaItems as localMediaItems } from "@/data/media";
import { fetchSheetMediaItems } from "@/data/sheetMedia";

export function useMediaItems() {
  return useQuery({
    queryKey: ["media-items"],
    queryFn: fetchSheetMediaItems,
    initialData: localMediaItems,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
