import axios, { AxiosRequestConfig } from 'axios'
import {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  useMutation,
  useQuery
} from '@tanstack/react-query'
import { RequiredDeep, ListPage, OrderCloudError } from 'ordercloud-javascript-sdk'
import { getRoutingUrl, isRouteParam, makeQueryString } from '../utils'
import { useColumns, useOrderCloudContext } from '.'
import useOperations from './useOperations'
import { queryClient } from '..'

export type ServiceListOptions = { [key: string]: ServiceListOptions | string | undefined }

export function useOcResourceList<TData>(
  resource: string,
  listOptions?: ServiceListOptions,
  parameters?: { [key: string]: string },
  queryOptions?: Omit<UseQueryOptions, 'queryKey'>
) {
  const { listOperation } = useOperations(resource)
  const queryString = makeQueryString(listOptions)
  const { baseApiUrl, token } = useOrderCloudContext()
  const url = listOperation?.path ? getRoutingUrl(listOperation, parameters) + (queryString ? `?${queryString}` : '') : ''

  const axiosRequest: AxiosRequestConfig = {
        method: listOperation? listOperation.verb.toLocaleLowerCase() : '',
        baseURL: baseApiUrl + '/v1',
        headers: { Authorization: `Bearer ${token}` },
      }

    return useQuery({
      queryKey: [listOperation?.operationId, listOptions, parameters],
      queryFn: async () => {
        const resp = await axios.get<TData>(
          url, axiosRequest)
          return resp.data
      },
      ...queryOptions
    }) as UseQueryResult<RequiredDeep<ListPage<TData>>, OrderCloudError>;
  }

  export function useOcResourceGet<TData> (
    resource: string,
    parameters?: { [key: string]: string },
    queryOptions?: Omit<UseQueryOptions, 'queryKey'>
  ){
    const { getOperation } = useOperations(resource)
    const { baseApiUrl, token } = useOrderCloudContext()
    const url = getOperation?.path ? getRoutingUrl(getOperation, parameters): ''
  
    const axiosRequest: AxiosRequestConfig = {
          method: getOperation? getOperation.verb.toLocaleLowerCase() : '',
          baseURL: baseApiUrl + '/v1',
          headers: { Authorization: `Bearer ${token}` },
        }
  
      return useQuery({
        queryKey: [getOperation?.operationId, parameters],
        queryFn: async () => {
          const resp = await axios.get<TData>(
            url, axiosRequest)
            return resp.data
        },
        ...queryOptions
      }) as UseQueryResult<RequiredDeep<TData>, OrderCloudError>;
    }

    export function useMutateOcResource<TData>(
      resource: string,
      parameters?: { [key: string]: string },
      mutationOptions?: Omit<UseMutationOptions, 'mutationKey'>,
      isNew?: boolean
      ) {
      const { createOperation, saveOperation, getOperation, listOperation } = useOperations(resource)
      const { baseApiUrl, token } = useOrderCloudContext()
      const operation = isNew ? createOperation : saveOperation
      const url = operation?.path ? getRoutingUrl(operation, parameters): ''
      const axiosRequest: AxiosRequestConfig = {
            method: operation? operation.verb.toLocaleLowerCase() : '',
            baseURL: baseApiUrl + '/v1',
            headers: { Authorization: `Bearer ${token}` },
          }
    
      return useMutation({
          mutationKey: [operation?.operationId],
          mutationFn: async (resourceData) => {
            const resp = isNew 
            ? await axios.post<TData>(url, resourceData, axiosRequest)
            : await axios.put<TData>(url, resourceData, axiosRequest)
              return resp.data
            },
          onSuccess: (item: any) => {
            // set GET cache to response of PUT operation
            queryClient.setQueryData([getOperation?.operationId, parameters], (oldData: TData)=> {
            return oldData
                ? item
                : oldData
            }),

            // update list page results for any cache key that matches list operation
            queryClient.setQueriesData({ queryKey: [listOperation?.operationId]}, (oldData: RequiredDeep<ListPage<TData>> | undefined) => {
              if(!oldData?.Items) return oldData

              const newItems = isNew 
                ? [...oldData.Items, item] 
                : oldData.Items.map((d: any) => d.ID === item?.ID ? item : d)
                
              return { ...oldData, Items: newItems}
            })},
            ...mutationOptions
      }) as UseMutationResult<RequiredDeep<TData>, OrderCloudError>;
  }

  export function useDeleteOcResource<TData>(
    resource: string,
    parameters?: { [key: string]: string },
    mutationOptions?: Omit<UseMutationOptions, 'mutationKey'>
    ){
    const { deleteOperation, listOperation, getOperation } = useOperations(resource)
    const { columnHeaders } = useColumns(resource)
    const { baseApiUrl, token } = useOrderCloudContext()
    const url = deleteOperation?.path ? getRoutingUrl(deleteOperation, parameters): ''
  
    const axiosRequest: AxiosRequestConfig = {
          method: deleteOperation? deleteOperation.verb.toLocaleLowerCase() : '',
          baseURL: baseApiUrl + '/v1',
          headers: { Authorization: `Bearer ${token}` },
        }
  
    return useMutation({
        mutationKey: [deleteOperation?.operationId],
        mutationFn: async () => {
          const resp = await axios.delete<TData>(
          url, axiosRequest)
          return resp.data
        },
        onSuccess: () => {
          if(columnHeaders?.includes('ID')){
            const resourceID = url.split('/').pop()

            // remove cached GET response for item
            queryClient.removeQueries({ queryKey: [getOperation?.operationId]})

            // remove item from list page results for any cache key that matches list operation
            queryClient.setQueriesData({ queryKey: [listOperation?.operationId]}, (oldData: RequiredDeep<ListPage<TData>> | undefined) => {
              return oldData?.Items
                ? {...oldData, Items: oldData.Items.filter((d: any) => d.ID !== resourceID)}
                : oldData
            })
          }
        },
        ...mutationOptions
    }) as UseMutationResult<void, OrderCloudError>;
}

export function useListAssignments<TData>(
  resource: string,
  operationInclusion?: string,
  listOptions?: ServiceListOptions,
  parameters?: { [key: string]: string },
  queryOptions?: Omit<UseQueryOptions, 'queryKey'> 
  ){
   const { assignmentListOperation } = useOperations(resource, operationInclusion)
   const queryString = makeQueryString(listOptions)
   const { baseApiUrl, token } = useOrderCloudContext()
   const url = assignmentListOperation?.path ? getRoutingUrl(assignmentListOperation, parameters) + (queryString ? `?${queryString}` : '') : ''

   const axiosRequest: AxiosRequestConfig = {
        method: assignmentListOperation? assignmentListOperation.verb.toLocaleLowerCase() : '',
        baseURL: baseApiUrl + '/v1',
        headers: { Authorization: `Bearer ${token}` },
      }

    return useQuery({
      queryKey: [assignmentListOperation?.operationId, listOptions, parameters],
      queryFn: async () => {
        const resp = await axios.get<TData>(
          url, axiosRequest)
          return resp.data
      },
      ...queryOptions
    }) as UseQueryResult<RequiredDeep<ListPage<TData>>, OrderCloudError>;
}

export function useMutateAssignment<TData> (
  resource: string,
  operationInclusion?: string,
  parameters?: { [key: string]: string },
  mutationOptions?: Omit<UseMutationOptions, 'mutationKey'>
  ) {
  const { assignmentSaveOperation, assignmentListOperation } = useOperations(resource, operationInclusion)

  const { baseApiUrl, token } = useOrderCloudContext()
  const url = assignmentSaveOperation?.path ? getRoutingUrl(assignmentSaveOperation, parameters): ''
  const axiosRequest: AxiosRequestConfig = {
        method: assignmentSaveOperation ? assignmentSaveOperation.verb.toLocaleLowerCase() : '',
        baseURL: baseApiUrl + '/v1',
        headers: { Authorization: `Bearer ${token}` },
      }

  return useMutation({
      mutationKey: [assignmentSaveOperation?.operationId],
      mutationFn: async (resourceData: unknown) => {
        const resp = await axios.post<TData>(
        url, resourceData, axiosRequest)
        return resp.data
        },
      onSuccess: () => {
        // invalidate cache for list assignment operations that match query key
        queryClient.invalidateQueries({ queryKey: [assignmentListOperation?.operationId]})}, 
        ...mutationOptions
  }) as UseMutationResult<void, OrderCloudError>;
} 

export function useDeleteAssignment<TData = unknown> (
  resource: string,
  operationInclusion?: string,
  parameters?: { [key: string]: string },
  mutationOptions?: Omit<UseMutationOptions, 'mutationKey'>
  ) {
  const { assignmentDeleteOperation, assignmentListOperation } = useOperations(resource, operationInclusion)
  const { baseApiUrl, token } = useOrderCloudContext()
  let queryString
  if(parameters){
    const queryParams = {} as { [key: string]: string };
    Object.entries(parameters).forEach(([key, value]: [string, string]) => {
      if(!isRouteParam(assignmentDeleteOperation, key)){
        queryParams[key] = value
      }}
    )
    queryString = makeQueryString(queryParams)
  }
  const url = assignmentDeleteOperation?.path ? getRoutingUrl(assignmentDeleteOperation, parameters) + (queryString ? `?${queryString}` : ''): ''

  const axiosRequest: AxiosRequestConfig = {
        method: assignmentDeleteOperation? assignmentDeleteOperation.verb.toLocaleLowerCase() : '',
        baseURL: baseApiUrl + '/v1',
        headers: { Authorization: `Bearer ${token}` },
      }

  return useMutation({
      mutationKey: [assignmentDeleteOperation?.operationId],
      mutationFn: async () => {
        const resp = await axios.delete<TData>(
        url, axiosRequest)
        return resp.data
      },
      onSuccess: () => {
        // invalidate cache for list assignment operations that match query key
        queryClient.invalidateQueries({ queryKey: [assignmentListOperation?.operationId]})
      },
      ...mutationOptions
  }) as UseMutationResult<void, OrderCloudError>;
}
