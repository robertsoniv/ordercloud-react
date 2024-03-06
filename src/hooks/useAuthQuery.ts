import {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { OrderCloudError } from "ordercloud-javascript-sdk";
import { useEffect, useMemo, useState } from "react";
import useOrderCloudContext from "./useOrderCloudContext";

export default function useAuthQuery<
  TQueryFnData = unknown,
  TError = OrderCloudError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  onError?: (error: OrderCloudError) => void
): UseQueryResult<TData, TError> {
  const { isAuthenticated, defaultErrorHandler, ...rest } = useOrderCloudContext();

  const [delayedIsAuthenticated, setDelayedIsAuthenticated] = useState<boolean>()

  useEffect(() => {
    setTimeout(() => {
      setDelayedIsAuthenticated(isAuthenticated)
    }, 300)
  }, [isAuthenticated])

  const authQueryOptions: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    "queryKey" | "queryFn"
  > = useMemo(() => {
    return {
      enabled: isAuthenticated,
      placeholderData: delayedIsAuthenticated ? keepPreviousData : undefined,
    };
  }, [isAuthenticated, delayedIsAuthenticated]);

  const query = useQuery({ ...options, ...authQueryOptions });

  if (query.error) {
    const error = query.error as unknown as OrderCloudError;
    if (typeof onError === "function") {
      onError(error);
    } else if (defaultErrorHandler) {
      defaultErrorHandler(error, {...rest, isAuthenticated});
    }
  }

  return query;
}
