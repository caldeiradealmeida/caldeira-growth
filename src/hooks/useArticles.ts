import { useQuery } from "@tanstack/react-query";
import { articles as localArticles } from "@/data/articles";
import { fetchSheetArticles } from "@/data/sheetArticles";

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchSheetArticles,
    initialData: localArticles,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
