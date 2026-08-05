import { useQuery } from "@tanstack/react-query";
import { fetchOpportunityRows } from "../api/opportunities";

export function useOpportunities() {
  return useQuery({
    queryKey: ["crm", "opportunities"],
    queryFn: fetchOpportunityRows,
    staleTime: 30_000,
  });
}
