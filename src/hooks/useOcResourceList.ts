import axios, { AxiosRequestConfig } from 'axios'
import {
  UseMutationOptions,
  UseQueryOptions,
  UseQueryResult,
  useMutation,
  useQuery
} from '@tanstack/react-query'
import { RequiredDeep, ListPage, OrderCloudError } from 'ordercloud-javascript-sdk'
import { getRoutingUrl, makeQueryString } from '../utils'
import { useColumns, useOrderCloudContext } from '.'
import useOperations from './useOperations'
import { queryClient } from '..'

export type ServiceListOptions = { [key: string]: ServiceListOptions | string }

export type ServiceOptions = {
  parameters?: string[]
  listOptions?: ServiceListOptions
}

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
      mutationOptions?: UseMutationOptions
      ) => {
      const { saveOperation, getOperation, listOperation } = useOperations(resource)
      const { baseApiUrl, token } = useOrderCloudContext()
      const url = saveOperation?.path ? getRoutingUrl(saveOperation, parameters): ''
    
      const axiosRequest: AxiosRequestConfig = {
            method: saveOperation? saveOperation.verb.toLocaleLowerCase() : '',
            baseURL: baseApiUrl + '/v1',
            headers: { Authorization: `Bearer ${token}` },
          }
    
      return useMutation({
          mutationKey: [saveOperation?.operationId],
          mutationFn: async (resourceData) => await axios.put<unknown>(
            url, resourceData, axiosRequest),
          onSuccess: (item: any) => {
            // set GET cache to response of PUT operation
            queryClient.setQueryData([getOperation?.operationId], item.data)
            // update list page results for any cache key that matches list operation
            queryClient.setQueriesData({ queryKey: [listOperation?.operationId]}, (oldData: any) => oldData?.data?.Items
                ? {...oldData, data: {...oldData.data, Items: oldData.data.Items.map((d: any) => d.ID === item.data?.ID ? item.data : d)}}
                : oldData)
            },
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
