import axios, { AxiosRequestConfig } from 'axios'
import {
  UseMutationOptions,
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

export type ServiceListOptions = { [key: string]: ServiceListOptions | string }

export const useOcResourceList = (
  resource: string,
  listOptions?: ServiceListOptions,
  parameters?: { [key: string]: string },
  queryOptions?: UseQueryOptions 
) => {
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
        return await axios.get<unknown>(
          url, axiosRequest)
      },
      ...queryOptions
    }) as UseQueryResult<RequiredDeep<ListPage<unknown>>, OrderCloudError>;
  };

  export const useOcResourceGet = (
    resource: string,
    parameters?: { [key: string]: string },
    queryOptions?: UseQueryOptions 
  ) => {
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
          return await axios.get<unknown>(
            url, axiosRequest)
        },
        ...queryOptions
      }) as UseQueryResult<RequiredDeep<unknown>, OrderCloudError>;
    };

    export const useMutateOcResource = (
      resource: string,
      parameters?: { [key: string]: string },
      mutationOptions?: UseMutationOptions,
      isNew?: boolean
      ) => {
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
          mutationFn: async (resourceData) => isNew ? await axios.post<unknown>(
            url, resourceData, axiosRequest): await axios.put<unknown>(
            url, resourceData, axiosRequest),
          onSuccess: (item: any) => {
            // set GET cache to response of PUT operation
            queryClient.setQueryData([getOperation?.operationId, parameters], (oldData: any)=> {
            return oldData?.data
                ? {...oldData, data: item.data }
                : oldData
            }),

            // update list page results for any cache key that matches list operation
            queryClient.setQueriesData({ queryKey: [listOperation?.operationId]}, (oldData: any) => {
              const newItems = isNew 
                ? [...oldData.data.Items, item.data] 
                : oldData.data.Items.map((d: any) => d.ID === item.data?.ID ? item.data : d)
                
              return oldData?.data?.Items
                  ? {...oldData, data: {...oldData.data, Items: newItems }}
                  : oldData 
            })},
            ...mutationOptions
      })
  }

  export const useDeleteOcResource = (
    resource: string,
    parameters?: { [key: string]: string },
    mutationOptions?: UseMutationOptions
    ) => {
    const { deleteOperation, listOperation } = useOperations(resource)
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
        mutationFn: async () => await axios.delete<unknown>(
          url, axiosRequest),
        onSuccess: () => {
          if(columnHeaders?.includes('ID')){
            const resourceID = url.split('/').pop()
            // remove item from list page results for any cache key that matches list operation
            queryClient.setQueriesData({ queryKey: [listOperation?.operationId]}, (oldData: any) => {
              return oldData?.data?.Items
                ? {...oldData, data: {...oldData.data, Items: oldData.data.Items.filter((d: any) => d.ID !== resourceID)}}
                : oldData
            })
          }
        },
        ...mutationOptions
    })
}

export const useListAssignments = (
  resource: string,
  inclusion?: string,
  listOptions?: ServiceListOptions,
  parameters?: { [key: string]: string },
  queryOptions?: UseQueryOptions 
  ) => {
   const { assignmentListOperation } = useOperations(resource, inclusion)
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
        return await axios.get<unknown>(
          url, axiosRequest)
      },
      ...queryOptions
    }) as UseQueryResult<RequiredDeep<ListPage<unknown>>, OrderCloudError>;
}

export const useMutateAssignment = (
  resource: string,
  inclusion?: string,
  parameters?: { [key: string]: string },
  mutationOptions?: UseMutationOptions
  ) => {
  const { assignmentSaveOperation, assignmentListOperation } = useOperations(resource, inclusion)
  console.log(assignmentListOperation, assignmentSaveOperation)
  const { baseApiUrl, token } = useOrderCloudContext()
  const url = assignmentSaveOperation?.path ? getRoutingUrl(assignmentSaveOperation, parameters): ''
  const axiosRequest: AxiosRequestConfig = {
        method: assignmentSaveOperation ? assignmentSaveOperation.verb.toLocaleLowerCase() : '',
        baseURL: baseApiUrl + '/v1',
        headers: { Authorization: `Bearer ${token}` },
      }

  return useMutation({
      mutationKey: [assignmentSaveOperation?.operationId],
      mutationFn: async (resourceData) => await axios.post<unknown>(
        url, resourceData, axiosRequest),
      onSuccess: () => {
        // invalidate cache for list assignment operations that match query key
        queryClient.invalidateQueries({ queryKey: [assignmentListOperation?.operationId]})}, 
        ...mutationOptions
  })
}

export const useDeleteAssignment = (
  resource: string,
  inclusion?: string,
  parameters?: { [key: string]: string },
  mutationOptions?: UseMutationOptions
  ) => {
  const { assignmentDeleteOperation, assignmentListOperation } = useOperations(resource, inclusion)
  const { baseApiUrl, token } = useOrderCloudContext()
  let queryString
  if(parameters){
    const queryParams = {} as any
    Object.entries(parameters).forEach(([key, value]: [string, any]) => {
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
      mutationFn: async () => await axios.delete<unknown>(
        url, axiosRequest),
      onSuccess: () => {
        // invalidate cache for list assignment operations that match query key
        queryClient.invalidateQueries({ queryKey: [assignmentListOperation?.operationId]})
      },
      ...mutationOptions
  })
}
