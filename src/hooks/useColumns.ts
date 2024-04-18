import { useMemo } from 'react'
import useApiSpec from './useApiSpec';
import Case from 'case';
import { OpenAPIV3 } from 'openapi-types';
import { useOrderCloudContext } from '.';

const useColumns = (resourceId: string) => {
  const { xpSchemas } = useOrderCloudContext()
  const { operationsById } = useApiSpec()
  const operationId = `${resourceId.charAt(0).toUpperCase() + Case.camel(resourceId.slice(1))}.List`

  const operation = useMemo(() => operationsById[operationId], [operationId, operationsById])

  const xpProperties = useMemo(() => {
    if(xpSchemas?.properties && xpSchemas.properties[resourceId]){
      return xpSchemas.properties[resourceId]
    } else {
      return null
    }
  },[resourceId, xpSchemas])

  const properties = useMemo(() => {
    const response = operation?.responses['200'] as OpenAPIV3.ResponseObject
    const schema = response?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject
    const schemaItemArray = schema?.properties?.Items as OpenAPIV3.ArraySchemaObject
    const schemaObj = schemaItemArray?.items as OpenAPIV3.SchemaObject
    
    if(xpProperties && schemaObj?.properties) 
      schemaObj.properties.xp = xpProperties
    
    return schemaObj?.properties
  }, [operation?.responses, xpProperties])

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
      properties,
      columnHeaders,
      sortable
    }
  }, [columnHeaders, operation, properties])

  return result
}

export default useColumns
