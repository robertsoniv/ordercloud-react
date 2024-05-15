import { useCallback, useMemo } from 'react'
import useApiSpec from './useApiSpec';
import Case from 'case';
import { OpenAPIV3 } from 'openapi-types';
import { useOrderCloudContext } from '.';
import { sortBy } from 'lodash';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { RequiredDeep } from 'ordercloud-javascript-sdk';

const columnHelper = createColumnHelper<RequiredDeep<unknown>>();

const useColumns = (resourceId: string, sortOrder?: string[], cellCallback?: (cellValue: unknown, properties: OpenAPIV3.SchemaObject) => JSX.Element) => {
  const { xpSchemas } = useOrderCloudContext()
  const { operationsById } = useApiSpec()
  const operationId = `${resourceId.charAt(0).toUpperCase() + Case.camel(resourceId.slice(1))}.List`

  const operation = useMemo(() => operationsById[operationId], [operationId, operationsById])

  const sortable = useMemo(() => {
    const params = operation?.parameters as OpenAPIV3.ParameterObject[]
    const schema = params?.find((p: OpenAPIV3.ParameterObject) => p?.name === 'sortBy')?.schema as OpenAPIV3.ArraySchemaObject
    const schemaItems = schema?.items as OpenAPIV3.SchemaObject
    return schemaItems?.enum
  }, [operation?.parameters])

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

  const buildColumns = useCallback((obj: unknown, accessor?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cols = [] as any
    if (!obj || !cellCallback) return cols;
    Object.entries(obj).forEach(([key, value]) => {
      // eslint-disable-next-line no-prototype-builtins
      const type = value.hasOwnProperty("allOf")
        ? value["allOf"][0]["type"]
        : value["type"];
      const accessorString = accessor ? `${accessor}.${key}` : key;
  
      if (type === "object") {
        // eslint-disable-next-line no-prototype-builtins
        const properties = value.hasOwnProperty("allOf")
          ? value["allOf"][0]["properties"]
          : value["properties"];
        const nestedColumns = buildColumns(properties, accessorString);
        if (key === "xp") {
          cols = [...cols, ...nestedColumns] as ColumnDef<
            RequiredDeep<unknown>,
            unknown
          >[];
        } else {
          const groupHeader = accessorString.includes("xp.")
            ? accessorString
            : key;
          if (nestedColumns?.length  && nestedColumns.length > 0) {
            cols.push(
              columnHelper.group({
                header: groupHeader,
                columns: nestedColumns,
              })
            );
          }
        }
      } else {
        const header =
          accessorString.includes("xp.") && accessorString.split(".").length === 2
            ? accessorString
            : key;
        cols.push(
          columnHelper.accessor(accessorString, {
            id: accessorString,
            header,
            enableResizing: true,
            enableSorting: sortable?.includes(accessorString),
            cell: (info) => {
              const cellValue = info.getValue();
              return cellCallback(cellValue, value)
            }
          }) as ColumnDef<unknown, unknown>
        );
      }
    });
  
    if(sortOrder){
      return sortBy(cols, (col) => {
        const sortIndex = sortOrder.indexOf(col?.header as string);
        if (sortIndex > -1) {
          return sortIndex;
        }
        return sortOrder.length + 1;
      });
    } else {
    return cols}
  },[cellCallback, sortOrder, sortable]);

  const dynamicColumns = useMemo(()=> {
   return buildColumns(properties)
  },[properties, buildColumns])

  const result = useMemo(() => {
    
    return {
      properties,
      columnHeaders,
      dynamicColumns
    }
  }, [columnHeaders, dynamicColumns, properties])

  return result
}

export default useColumns
