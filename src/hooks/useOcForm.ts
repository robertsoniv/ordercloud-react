import useOperations from './useOperations'
import { useCallback, useMemo } from 'react'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import _, { cloneDeep } from 'lodash'
import { generateFormSchema, generateParameterSchema, shallowNestedProperties, shapeXpSchema } from '../formSchemaGenerator.utils'

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
  initialValues: any
) => {
  const { saveOperation, createOperation } = useOperations(resource) as any

  const isNew = useMemo(()=> !!initialValues?.body && !Object.keys(initialValues.body).length ,[initialValues.body])

  const requestSchema = useMemo(() => {
    return isNew
    ? createOperation?.requestBody?.content['application/json'].schema 
    : saveOperation?.requestBody?.content['application/json'].schema
  }, [createOperation?.requestBody?.content, isNew, saveOperation?.requestBody?.content])

  
  const operationParameters = useMemo(()=> generateParameterSchema(isNew ? createOperation : saveOperation),[createOperation, isNew, saveOperation])

  const inferredXpSchema = useMemo(()=> {
    if (initialValues?.body?.xp && Object.keys(initialValues?.body?.xp).length) {
      return shapeXpSchema([initialValues?.body])
    }
    },[initialValues])
  /**
   * "Shallow up" the requestSchema (removes the 'allOf' layer and puts sub
   * object properties in the right place).
   */
  const resourceSchema = useMemo(() => {
    const requiredProps = requestSchema?.required
    const nativeProperties = cloneDeep(requestSchema?.allOf[0].properties)

    if (nativeProperties && nativeProperties.xp && inferredXpSchema) {
      nativeProperties.xp = inferredXpSchema
    }

    requiredProps?.forEach((propKey: any) => {
      nativeProperties[propKey].required = true
    })

    return shallowNestedProperties(nativeProperties)
  }, [inferredXpSchema, requestSchema?.allOf, requestSchema?.required])

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

    if (operationParameters) {
      generatedParamSchema = generateFormSchema(operationParameters?.schema, operationParameters?.required)
    }

    return yup.object().shape({
      parameters: yup.object(generatedParamSchema),
      body: yup.object(generatedSchema),
    })
  }, [resourceSchema, requestSchema?.required, operationParameters])

  // Initiate the react-hook-form
  const methods = useForm({
    defaultValues: {} as any,
    values: {
      parameters: {
        ...initialValues?.parameters,
      },
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
