import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api.js";
export const useData = (path) =>
  useQuery({
    queryKey: [path],
    queryFn: () => api(path),
  });
export function useAction() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({ path, method = "POST", body }) =>
      api(path, {
        method,
        body,
      }),
    onSuccess: () => q.invalidateQueries(),
  });
}
