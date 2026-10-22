import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { MemberPageDTO } from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";
import { queryKeys } from "../../../api/queryKeys.js";

export function useMembersList(guildId: string, search: string) {
  const normalizedSearch = search.trim();
  const query = useInfiniteQuery({
    queryKey: queryKeys.members(guildId, normalizedSearch),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (normalizedSearch) params.set("query", normalizedSearch);
      else if (pageParam) params.set("after", pageParam);
      return apiRequest<MemberPageDTO>(
        `/api/guilds/${guildId}/members?${params.toString()}`,
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextAfter ?? undefined,
    enabled: normalizedSearch.length === 0 || normalizedSearch.length >= 2,
  });
  const results = useMemo(
    () => query.data?.pages.flatMap((page) => page.members) ?? [],
    [query.data],
  );
  return { ...query, normalizedSearch, results };
}
