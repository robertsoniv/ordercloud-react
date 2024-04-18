import axios, { AxiosRequestConfig } from 'axios'
import {
  UseQueryResult,
  keepPreviousData,
  useMutation,
  useQuery
} from '@tanstack/react-query'
import { RequiredDeep, ListPage, OrderCloudError } from 'ordercloud-javascript-sdk'
import { getRoutingUrl, makeQueryString } from '../utils'
import { useOrderCloudContext } from '.'
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
  parameters?: { [key: string]: string }
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
      placeholderData: keepPreviousData,
    }) as UseQueryResult<RequiredDeep<ListPage<unknown>>, OrderCloudError>;
  };

  export const useOcResourceGet = (
    resource: string,
    parameters?: { [key: string]: string }
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
      }) as UseQueryResult<RequiredDeep<unknown>, OrderCloudError>;
    };

    export const useMutateOcResource = (
      resource: string,
      parameters?: { [key: string]: string }
      ) => {
      const { saveOperation } = useOperations(resource)
      const { baseApiUrl, token } = useOrderCloudContext()
      const url = saveOperation?.path ? getRoutingUrl(saveOperation, parameters): ''
    
      const axiosRequest: AxiosRequestConfig = {
            method: saveOperation? saveOperation.verb.toLocaleLowerCase() : '',
            baseURL: baseApiUrl + '/v1',
            headers: { Authorization: `Bearer ${token}` },
          }
    
      return useMutation({
          mutationKey: [saveOperation?.operationId],
          mutationFn: async (resourceData: Partial<unknown>) => await axios.put<unknown>(
            url, resourceData, axiosRequest),
          onSuccess: () => {
            queryClient.resetQueries({queryKey: [saveOperation?.operationId] })
          },
      })
  }

  export const useDeleteOcResource = (
    resource: string,
    parameters?: { [key: string]: string }
    ) => {
    const { deleteOperation } = useOperations(resource)
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
          queryClient.resetQueries({queryKey: [deleteOperation?.operationId] })
        },
    })
}
