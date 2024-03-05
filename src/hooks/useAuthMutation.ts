import {
  UseMutationOptions,
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import { OrderCloudError } from "ordercloud-javascript-sdk";
import { useMemo } from "react";
import useOrderCloudContext from "./useOrderCloudContext";

export function useAuthMutation<
  TData = unknown,
  TError = unknown,
  TVariables = TData,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { defaultErrorHandler } = useOrderCloudContext();

  const authMutationOptions: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
  > = useMemo(() => {
    return {
      onError: (error: TError) =>
        options.onError
          ? options.onError
          : defaultErrorHandler
          ? defaultErrorHandler(error as OrderCloudError)
          : undefined,
    };
  }, [defaultErrorHandler, options.onError]);

  return useMutation({ ...options, ...authMutationOptions });
}