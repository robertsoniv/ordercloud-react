import {
  UseMutationOptions,
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import { OrderCloudError } from "ordercloud-javascript-sdk";
import { useMemo } from "react";
import useOrderCloudContext from "./useOrderCloudContext";

export default function useAuthMutation<
  TData = unknown,
  TError = unknown,
  TVariables = TData,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { defaultErrorHandler, ...rest } = useOrderCloudContext();

  const authMutationOptions: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
  > = useMemo(() => {
    return {
      onError: (error: TError) => {
        const e = error as OrderCloudError;
        return options.onError
        ? options.onError
        : defaultErrorHandler
        ? defaultErrorHandler(e, rest)
        : undefined
      }
    };
  }, [defaultErrorHandler, options.onError, rest]);

  return useMutation({ ...options, ...authMutationOptions });
}