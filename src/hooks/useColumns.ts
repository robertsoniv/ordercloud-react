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
    return operation?.responses['200']?.content['application/json']?.schema?.properties.Items.items
      .properties
  }, [operation])

  const columnHeaders = useMemo(() => {
    if(!properties) return
    const headers = Object.keys(properties)?.filter((p) => p !== 'Password')
    return headers
  }, [properties])

  const result = useMemo(() => {
    const sortable = operation?.parameters?.find((p: OpenAPIV3.ParameterObject) => p.name === 'sortBy')?.schema.items.enum
    
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
