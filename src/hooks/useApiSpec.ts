import { useCallback, useEffect, useMemo, useState } from 'react'
import SwaggerParser from '@apidevtools/swagger-parser'
import { OpenAPIV3 } from 'openapi-types'
import { keyBy, mapValues, values, flatten } from 'lodash'
import Case from 'case'
import { IOrderCloudOperationObject, useOrderCloudContext } from '..'

/**
 * PsuedoResources are meant for grouping together a set of duplicate operations for a given path array
 * under a new "resource" (psuedo resource) of your own making. We are currently using it for cloning
 * Specs.ListOptions, GetOption, DeleteOption, etc. under new operation IDs that mimic a SpecOptions
 * resource (i.e. SpecOptions.List, Get, Delete, etc.) - see line 53 for the full list of psuedo resources.
 *
 * TODO: we will likely need to do this for ProductVariants as well.
 */
interface IPsuedoResource {
  name: string
  paths: string[]
  /**
   *
   * @param resourceId The ID form of your "resource" for manipulating operation.operationId
   * @param operation The operation that will be duplicated (as long as operation.operationId is modified)
   * @returns A new operation ID to be used for this operation clone
   */
  getOperationId: (resourceId: string, operation: OpenAPIV3.OperationObject) => string
}

export interface ApiSection extends OpenAPIV3.TagObject {
  'x-id': string
}

export interface ApiResource extends OpenAPIV3.TagObject {
  'x-section-id': string
}

const psuedoResources: IPsuedoResource[] = [
  {
    name: 'Spec Options',
    paths: ['/specs/{specID}/options', '/specs/{specID}/options/{optionID}'],
    getOperationId: (resourceId, o) => {
      return resourceId + '.' + o?.operationId?.split('.')[1].split('Option')[0]
    },
  },
  {
    name: 'Shipment Items',
    paths: ['/shipments/{shipmentID}/items'],
    getOperationId: (resourceId, o) => {
      return resourceId + '.' + o?.operationId?.split('.')[1].split('Item')[0]
    },
  },
  {
    name: 'Order Shipments',
    paths: ['/orders/{direction}/{orderID}/shipments'],
    getOperationId: (resourceId, o) => {
      return resourceId + '.' + o?.operationId?.split('.')[1].split('Shipment')[0]
    },
  },
  {
    name: 'Order Promotions',
    paths: ['/orders/{direction}/{orderID}/promotions'],
    getOperationId: (resourceId, o) => {
      return resourceId + '.' + o?.operationId?.split('.')[1].split('Promotion')[0]
    },
  },
  {
    name: 'Order Approvers',
    paths: ['/orders/{direction}/{orderID}/eligibleapprovers'],
    getOperationId: (resourceId, o) => {
      return resourceId + '.' + o?.operationId?.split('.')[1].split('EligibleApprover')[0]
    },
  },
  {
    name: 'Order Approvals',
    paths: ['/orders/{direction}/{orderID}/approvals'],
    getOperationId: (resourceId, o) => {
      return resourceId + '.' + o?.operationId?.split('.')[1].split('Approval')[0]
    },
  },
]

const buildOperationsForResource = (spec: OpenAPIV3.Document, psuedoResource: IPsuedoResource) => {
  return flatten(
    psuedoResource.paths.map((path) => {
      const ops = spec?.paths ? spec?.paths[path] : {}
      return values(
        mapValues(ops, (o: any, verb: string) => {
          return {
            ...o,
            operationId: psuedoResource.getOperationId(Case.pascal(psuedoResource.name), o),
            verb,
            path,
            tags: [psuedoResource.name],
          }
        })
      )
    })
  )
}

const buildOperations = (spec?: OpenAPIV3.Document) => {
  if (!spec) return []
  const defaultOperations = flatten(
    values(
      mapValues(spec.paths, (ops, path: string) => {
        return values(
          mapValues(ops, (o: any, verb: string) => {
            const tags = o?.tags
            return { ...o, verb, path, tags }
          })
        )
      })
    )
  )

  const additionalOperations = flatten(
    psuedoResources.map((pr) => buildOperationsForResource(spec, pr))
  )

  return [...defaultOperations, ...additionalOperations] as IOrderCloudOperationObject[]
}

const useApiSpec = () => {
  const [spec, setSpec] = useState<OpenAPIV3.Document | undefined>()
  const { baseApiUrl } = useOrderCloudContext();

  const retrieveSpec = useCallback(async (url: string) => {
    const result = await SwaggerParser.dereference(`${url}/v1/openapi/v3`)
    const v3doc = result as OpenAPIV3.Document
    if (v3doc.servers) {
      v3doc.servers[0].url = `${url}/v1`
    }
    setSpec(v3doc)
  }, [])

  const validateSpecVersion = useCallback(
    async (url: string, version: string) => {
      const result = await fetch(`${url}/env`)
      const resultJson = await result.json()
      if (resultJson.BuildNumber && resultJson.BuildNumber !== version) {
        console.log(`Current spec (v${version}) is outdated, updating to ${resultJson.BuildNumber}`)
        retrieveSpec(url)
      }
    },
    [retrieveSpec]
  )

  useEffect(() => {
    if (
      baseApiUrl &&
      spec &&
      spec.info &&
      spec.info.version &&
      spec.info.version.split('.').length === 4 &&
      spec.servers &&
      spec.servers[0].url === `${baseApiUrl}/v1`
    ) {
      validateSpecVersion(baseApiUrl, spec.info.version)
    }
  }, [spec, baseApiUrl, validateSpecVersion])

  useEffect(() => {
    if (!baseApiUrl) return
      retrieveSpec(baseApiUrl)
  }, [baseApiUrl, retrieveSpec])

  const result = useMemo(() => {
    const operations = buildOperations(spec)
    const operationsById = keyBy(operations, 'operationId')

    //transformations
    return {
      operationsById,
    }
  }, [spec])

  return result
}

export type OpenAPIResult = ReturnType<typeof useApiSpec>

export default useApiSpec
