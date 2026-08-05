import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLeadDetail } from "../api/leadDetail";
import { saveOpportunity } from "../api/updateOpportunity";
import { createPerson, linkPersonToLead, unlinkPersonFromLead, searchPeople } from "../api/people";
import { buildOpportunityUpdatePayload, type OpportunityUpdateInput } from "../logic/opportunityUpdate";

function detailKey(leadId: string) {
  return ["crm", "lead-detail", leadId] as const;
}

export function useLeadDetail(leadId: string | undefined) {
  return useQuery({
    queryKey: detailKey(leadId ?? ""),
    queryFn: () => fetchLeadDetail(leadId as string),
    enabled: Boolean(leadId),
  });
}

export function useSaveOpportunity(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OpportunityUpdateInput) => saveOpportunity(leadId, buildOpportunityUpdatePayload(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: ["crm", "opportunities"] });
    },
  });
}

export function usePeopleSearch(query: string) {
  return useQuery({
    queryKey: ["crm", "people-search", query],
    queryFn: () => searchPeople(query),
    staleTime: 10_000,
  });
}

export function useCreatePerson() {
  return useMutation({ mutationFn: createPerson });
}

export function useLinkPerson(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (personId: string) => linkPersonToLead(leadId, personId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: ["crm", "opportunities"] });
    },
  });
}

export function useUnlinkPerson(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlinkPersonFromLead(leadId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: ["crm", "opportunities"] });
    },
  });
}
