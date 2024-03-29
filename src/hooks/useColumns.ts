import { useMemo } from 'react'
import useOrderCloudContext from './useOrderCloudContext';
import useApiSpec from './useApiSpec';
import Case from 'case';
import { OpenAPIV3 } from 'openapi-types';

const useColumns = (resourceId: string) => {
  const { baseApiUrl } = useOrderCloudContext();

  const { operationsById } = useApiSpec(baseApiUrl)
  const operationId = `${resourceId.charAt(0).toUpperCase() + Case.camel(resourceId.slice(1))}.List`

  const operation = useMemo(() => operationsById[operationId], [operationId, operationsById])

  const properties = useMemo(() => {
    const response = operation?.responses['200'] as OpenAPIV3.ResponseObject
    const schema = response?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject
    const schemaItemArray = schema?.properties?.Items as OpenAPIV3.ArraySchemaObject
    const schemaObj = schemaItemArray?.items as OpenAPIV3.SchemaObject
    return schemaObj?.properties
  }, [operation])

  const columnHeaders = useMemo(() => {
    if(!properties) return
    const headers = Object.keys(properties)?.filter((p) => p !== 'Password')
    return headers
  }, [properties])

  const result = useMemo(() => {
    const params = operation?.parameters as OpenAPIV3.ParameterObject[]
    const schema = params?.find((p: OpenAPIV3.ParameterObject) => p?.name === 'sortBy')?.schema as OpenAPIV3.ArraySchemaObject
    const schemaItems = schema?.items as OpenAPIV3.SchemaObject
    const sortable = schemaItems?.enum
    
    return {
      operation,
      properties,
      columnHeaders,
      sortable
    }
  }, [columnHeaders, operation, properties])

  return result
}

export default useColumns
