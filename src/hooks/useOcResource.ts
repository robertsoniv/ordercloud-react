import axios, { AxiosRequestConfig } from "axios";
import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import {
  RequiredDeep,
  ListPage,
  OrderCloudError,
  ListPageWithFacets,
} from "ordercloud-javascript-sdk";
import { getRoutingUrl, isRouteParam, makeQueryString } from "../utils";
import {
  useAuthMutation,
  useAuthQuery,
  useColumns,
  useOrderCloudContext,
} from ".";
import useOperations from "./useOperations";
import { queryClient } from "..";
import { UseOcQueryOptions } from "./useAuthQuery";
import { UseOcMutationOptions } from "./useAuthMutation";

export type ServiceListOptions = {
  [key: string]: ServiceListOptions | string | undefined;
};

export function useOcResourceList<TData>(
  resource: string,
  listOptions?: ServiceListOptions,
  parameters?: { [key: string]: string },
  queryOptions?: Omit<UseOcQueryOptions, "queryKey">,
  isMeEndpoint?: boolean
) {
  const { listOperation } = useOperations(resource, undefined, isMeEndpoint);
  if(!listOperation) console.error(`List${isMeEndpoint ? 'Me': ''} ${resource} is not a valid OrderCloud operation.`);

  const queryString = makeQueryString(listOptions);
  const { baseApiUrl, token } = useOrderCloudContext();

  const url =
    getRoutingUrl(listOperation, parameters) +
    (queryString ? `?${queryString}` : "");

  const axiosRequest: AxiosRequestConfig = {
    method: listOperation ? listOperation?.verb.toLocaleLowerCase() : "",
    baseURL: baseApiUrl + "/v1",
    headers: { Authorization: `Bearer ${token}` },
  };

  return useAuthQuery({
    queryKey: [listOperation?.operationId, listOptions, parameters],
    queryFn: async () => {
      const resp = await axios.get<TData>(url, axiosRequest);
      return resp.data;
    },
    disabled: queryOptions?.disabled || !url,
    ...queryOptions,
  }) as UseQueryResult<RequiredDeep<ListPage<TData>>, OrderCloudError>;
}

export function useOcResourceListWithFacets<TData>(
  resource: string,
  listOptions?: ServiceListOptions,
  parameters?: { [key: string]: string },
  queryOptions?: Omit<UseOcQueryOptions, "queryKey">,
  isMeEndpoint?: boolean
) {
  const { listOperation } = useOperations(resource, undefined, isMeEndpoint);
  if(!listOperation) console.error(`List${isMeEndpoint ? 'Me': ''} ${resource} is not a valid OrderCloud operation.`);
  const queryString = makeQueryString(listOptions);
  const { baseApiUrl, token } = useOrderCloudContext();

  const url =
    getRoutingUrl(listOperation, parameters) +
    (queryString ? `?${queryString}` : "");

  const axiosRequest: AxiosRequestConfig = {
    method: listOperation ? listOperation?.verb.toLocaleLowerCase() : "",
    baseURL: baseApiUrl + "/v1",
    headers: { Authorization: `Bearer ${token}` },
  };

  return useAuthQuery({
    queryKey: [listOperation?.operationId, listOptions, parameters],
    queryFn: async () => {
      const resp = await axios.get<TData>(url, axiosRequest);
      return resp.data;
    },
    disabled: queryOptions?.disabled || !url,
    ...queryOptions,
  }) as UseQueryResult<
    RequiredDeep<ListPageWithFacets<TData>>,
    OrderCloudError
  >;
}

export function useOcResourceGet<TData>(
  resource: string,
  parameters?: { [key: string]: string },
  queryOptions?: Omit<UseOcQueryOptions, "queryKey">,
  isMeEndpoint?: boolean
) {
  const { getOperation } = useOperations(resource, undefined, isMeEndpoint);
  if(!getOperation) console.error(`Get${isMeEndpoint ? 'Me': ''} ${resource} is not a valid OrderCloud operation.`);
  const { baseApiUrl, token } = useOrderCloudContext();
  const url = getRoutingUrl(getOperation, parameters);

  const axiosRequest: AxiosRequestConfig = {
    method: getOperation ? getOperation?.verb.toLocaleLowerCase() : "",
    baseURL: baseApiUrl + "/v1",
    headers: { Authorization: `Bearer ${token}` },
  };

  return useAuthQuery({
    queryKey: [getOperation?.operationId, parameters],
    queryFn: async () => {
      const resp = await axios.get<TData>(url, axiosRequest);
      return resp.data;
    },
    disabled: queryOptions?.disabled || !url,
    ...queryOptions,
  }) as UseQueryResult<RequiredDeep<TData>, OrderCloudError>;
}

export function useMutateOcResource<TData>(
  resource: string,
  parameters?: { [key: string]: string },
  mutationOptions?: Omit<UseOcMutationOptions<TData>, "mutationKey">,
  isNew?: boolean,
  isMeEndpoint?: boolean
) {
  const { createOperation, saveOperation, getOperation, listOperation } =
    useOperations(resource, undefined, isMeEndpoint);
  const { baseApiUrl, token } = useOrderCloudContext();
  const operation = isNew && createOperation ? createOperation : saveOperation;
  if(!operation) console.error(`${isNew ? 'Create' : 'Save'} ${isMeEndpoint ? 'Me': ''} ${resource} is not a valid OrderCloud operation.`); 

  const url = getRoutingUrl(operation, parameters);
  const axiosRequest: AxiosRequestConfig = {
    method: operation ? operation?.verb.toLocaleLowerCase() : "",
    baseURL: baseApiUrl + "/v1",
    headers: { Authorization: `Bearer ${token}` },
  };

  return useAuthMutation({
    mutationKey: [operation?.operationId],
    mutationFn: async (resourceData) => {
      const resp = isNew
        ? await axios.post<TData>(url, resourceData, axiosRequest)
        : await axios.put<TData>(url, resourceData, axiosRequest);
      return resp.data;
    },
    onSuccess: (item: any) => {
      // set GET cache to response of PUT operation
      queryClient.setQueryData(
        [getOperation?.operationId, parameters],
        (oldData: TData) => {
          return oldData ? item : oldData;
        }
      ),
        // update list page results for any cache key that matches list operation
        queryClient.setQueriesData(
          { queryKey: [listOperation?.operationId] },
          (oldData: RequiredDeep<ListPage<TData>> | undefined) => {
            if (!oldData?.Items) return oldData;

            const newItems = isNew
              ? [...oldData.Items, item]
              : oldData.Items.map((d: any) => (d.ID === item?.ID ? item : d));

            return { ...oldData, Items: newItems };
          }
        );
    },
    disabled: mutationOptions?.disabled || !url,
    ...mutationOptions,
  }) as UseMutationResult<RequiredDeep<TData>, OrderCloudError>;
}

export function useDeleteOcResource<TData>(
  resource: string,
  parameters?: { [key: string]: string },
  mutationOptions?: Omit<UseOcMutationOptions<TData>, "mutationKey">,
  isMeEndpoint?: boolean
) {
  const { deleteOperation, listOperation, getOperation } = useOperations(
    resource,
    undefined,
    isMeEndpoint
  );
  if(!deleteOperation) console.error(`Delete${isMeEndpoint ? 'Me': ''} ${resource} is not a valid OrderCloud operation.`);

  const { columnHeaders } = useColumns(resource);
  const { baseApiUrl, token } = useOrderCloudContext();

  const url = getRoutingUrl(deleteOperation, parameters);

  const axiosRequest: AxiosRequestConfig = {
    method: deleteOperation?.verb.toLocaleLowerCase() || "",
    baseURL: baseApiUrl + "/v1",
    headers: { Authorization: `Bearer ${token}` },
  };

  return useAuthMutation({
    mutationKey: [deleteOperation?.operationId],
    mutationFn: async () => {
      const resp = await axios.delete<TData>(url, axiosRequest);
      return resp.data;
    },
    onSuccess: () => {
      // remove cached GET response for item
      queryClient.removeQueries({
        queryKey: [getOperation?.operationId, parameters],
      });

      if (columnHeaders?.includes("ID")) {
        const resourceID = url.split("/").pop();

        // remove item from list page results for any cache key that matches list operation
        queryClient.setQueriesData(
          { queryKey: [listOperation?.operationId] },
          (oldData: RequiredDeep<ListPage<TData>> | undefined) => {
            return oldData?.Items
              ? {
                  ...oldData,
                  Items: oldData.Items.filter((d: any) => d.ID !== resourceID),
                }
              : oldData;
          }
        );
      } else {
        // we don't have an ID to remove from the cache, invalidate list cache for this operation
        queryClient.invalidateQueries({
          queryKey: [listOperation?.operationId],
        });
      }
    },
    disabled: mutationOptions?.disabled || !url,
    ...mutationOptions,
  }) as UseMutationResult<void, OrderCloudError>;
}

export function useListAssignments<TData>(
  resource: string,
  operationInclusion?: string,
  listOptions?: ServiceListOptions,
  parameters?: { [key: string]: string },
  queryOptions?: Omit<UseOcQueryOptions, "queryKey">
) {
  const { assignmentListOperation } = useOperations(
    resource,
    operationInclusion
  );
  if(!assignmentListOperation) console.error(`List ${resource} Assignments is not a valid OrderCloud operation.`);

  const queryString = makeQueryString(listOptions);
  const { baseApiUrl, token } = useOrderCloudContext();
  const url =
    getRoutingUrl(assignmentListOperation, parameters) +
    (queryString ? `?${queryString}` : "");

  const axiosRequest: AxiosRequestConfig = {
    method: assignmentListOperation
      ? assignmentListOperation?.verb.toLocaleLowerCase()
      : "",
    baseURL: baseApiUrl + "/v1",
    headers: { Authorization: `Bearer ${token}` },
  };

  return useAuthQuery({
    queryKey: [assignmentListOperation?.operationId, listOptions, parameters],
    queryFn: async () => {
      const resp = await axios.get<TData>(url, axiosRequest);
      return resp.data;
    },
    disabled: queryOptions?.disabled || !url,
    ...queryOptions,
  }) as UseQueryResult<RequiredDeep<ListPage<TData>>, OrderCloudError>;
}

export function useMutateAssignment<TData>(
  resource: string,
  operationInclusion?: string,
  parameters?: { [key: string]: string },
  mutationOptions?: Omit<UseOcMutationOptions<TData>, "mutationKey">
) {
  const { assignmentSaveOperation, assignmentListOperation } = useOperations(
    resource,
    operationInclusion
  );
  if(!assignmentSaveOperation) console.error(`Save ${resource} Assignments is not a valid OrderCloud operation.`);

  const { baseApiUrl, token } = useOrderCloudContext();
  const url = getRoutingUrl(assignmentSaveOperation, parameters);
  const axiosRequest: AxiosRequestConfig = {
    method: assignmentSaveOperation
      ? assignmentSaveOperation?.verb.toLocaleLowerCase()
      : "",
    baseURL: baseApiUrl + "/v1",
    headers: { Authorization: `Bearer ${token}` },
  };

  return useAuthMutation({
    mutationKey: [assignmentSaveOperation?.operationId],
    mutationFn: async (resourceData: unknown) => {
      const resp = await axios.post<TData>(url, resourceData, axiosRequest);
      return resp.data;
    },
    onSuccess: () => {
      // invalidate cache for list assignment operations that match query key
      queryClient.invalidateQueries({
        queryKey: [assignmentListOperation?.operationId],
      });
    },
    disabled: mutationOptions?.disabled || !url,
    ...mutationOptions,
  }) as UseMutationResult<void, OrderCloudError>;
}

export function useDeleteAssignment<TData = unknown>(
  resource: string,
  operationInclusion?: string,
  parameters?: { [key: string]: string },
  mutationOptions?: Omit<UseOcMutationOptions<TData>, "mutationKey">
) {
  const { assignmentDeleteOperation, assignmentListOperation } = useOperations(
    resource,
    operationInclusion
  );
  if(!assignmentDeleteOperation) console.error(`Delete ${resource} Assignments is not a valid OrderCloud operation.`);
  const { baseApiUrl, token } = useOrderCloudContext();
  let queryString;
  if (parameters) {
    const queryParams = {} as { [key: string]: string };
    Object.entries(parameters).forEach(([key, value]: [string, string]) => {
      if (!isRouteParam(assignmentDeleteOperation, key)) {
        queryParams[key] = value;
      }
    });
    queryString = makeQueryString(queryParams);
  }
  const url =
    getRoutingUrl(assignmentDeleteOperation, parameters) +
    (queryString ? `?${queryString}` : "");

  const axiosRequest: AxiosRequestConfig = {
    method: assignmentDeleteOperation
      ? assignmentDeleteOperation?.verb.toLocaleLowerCase()
      : "",
    baseURL: baseApiUrl + "/v1",
    headers: { Authorization: `Bearer ${token}` },
  };

  return useAuthMutation({
    mutationKey: [assignmentDeleteOperation?.operationId],
    mutationFn: async () => {
      const resp = await axios.delete<TData>(url, axiosRequest);
      return resp.data;
    },
    onSuccess: () => {
      // invalidate cache for list assignment operations that match query key
      queryClient.invalidateQueries({
        queryKey: [assignmentListOperation?.operationId],
      });
    },
    disabled: mutationOptions?.disabled || !url,
    ...mutationOptions,
  }) as UseMutationResult<void, OrderCloudError>;
}
