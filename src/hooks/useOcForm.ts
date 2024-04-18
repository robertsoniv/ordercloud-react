import useOperations from './useOperations'
import { useCallback, useMemo } from 'react'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import _, { cloneDeep } from 'lodash'
import { generateFormSchema, generateParameterSchema, shallowNestedProperties, shapeXpSchema } from '../formSchemaGenerator.utils'
import { useOrderCloudContext } from '.'

// For specific fields/values we do not want to take the example from Open API spec
const normalizeExampleValue = (val: any) => {
  switch (typeof val) {
    case 'string':
      if (val === '2018-01-01T00:00:00-06:00') {
        return null
      }
      break
    case 'object':
      if (Array.isArray(val)) {
        return val.join('').length ? val : []
      }
      break
    default:
      return val
  }
  return val
}

const getExampleValue = (row: any, key: string) => {
  key.split('.').forEach((k) => (row ? (row = row[k]) : undefined))
  return row
}

export const useOcForm = (
  resource: string,
  parameters: any,
  initialValues: any
) => {
  const { saveOperation } = useOperations(resource) as any
  const { xpSchemas } = useOrderCloudContext()

  const requestSchema = useMemo(() => {
    return saveOperation?.requestBody?.content['application/json'].schema
  }, [saveOperation])
  
  const operationParameters = useMemo(()=> generateParameterSchema(saveOperation),[saveOperation])

    /**
   * If xp schema has been passed into the provider, use the custom schema.
   * else, infer types from initial values if they exist
   */
  const xpSchema = useMemo(()=> {
    if(xpSchemas?.properties && xpSchemas.properties[resource]){
      return xpSchemas.properties[resource]
    } else if (initialValues?.body?.xp && Object.keys(initialValues?.body?.xp).length) {
      return shapeXpSchema([initialValues?.body])
    }
    },[initialValues?.body, resource, xpSchemas])
  /**
   * "Shallow up" the requestSchema (removes the 'allOf' layer and puts sub
   * object properties in the right place).
   */
  const resourceSchema = useMemo(() => {
    const requiredProps = requestSchema?.required
    const nativeProperties = cloneDeep(requestSchema?.allOf[0].properties)

    if (nativeProperties && nativeProperties.xp && xpSchema) {
      nativeProperties.xp = xpSchema
    }

    requiredProps?.forEach((propKey: any) => {
      nativeProperties[propKey].required = true
    })

    return shallowNestedProperties(nativeProperties)
  }, [xpSchema, requestSchema?.allOf, requestSchema?.required])

  const getDefaultSchemaValues = useCallback(
    (schema: any, parentPath?: string) => {
      let obj = {} as any
      Object.entries(schema).forEach(([key, value]: [string, any]) => {
        if (value.readOnly) return
        if (value?.properties) {
          obj[key] = getDefaultSchemaValues(value.properties, key)
          return
        }
        const path = parentPath ? `${parentPath}.${key}` : key
        obj[key] = normalizeExampleValue(getExampleValue(requestSchema?.allOf[0].example, path))
      })
      return obj
    },
    [requestSchema?.allOf]
  )

  // Generate the form schema using Yup
  const formSchema = useMemo(() => {
    if (!resourceSchema) return
    const generatedSchema = generateFormSchema(resourceSchema, requestSchema?.required)

    let generatedParamSchema = {}

    if (parameters) {
      generatedParamSchema = generateFormSchema(operationParameters?.schema, operationParameters?.required)
    }

    return yup.object().shape({
      parameters: yup.object(generatedParamSchema),
      body: yup.object(generatedSchema),
    })
  }, [resourceSchema, requestSchema?.required, parameters, operationParameters?.schema, operationParameters?.required])

  // Initiate the react-hook-form
  const methods = useForm({
    defaultValues: {} as any,
    values: {
      parameters,
      body: {
        ...initialValues?.body,
      },
    },
    resolver: yupResolver(formSchema!),
    mode: 'onBlur',
  })

  return {
    methods,
    resourceSchema
  }
  };
