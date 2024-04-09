import { useMemo } from 'react'
import useApiSpec from './useApiSpec';
import Case from 'case';

const useOperations = (resource: string) => {
  const { operationsById } = useApiSpec()
  
  const listOperation = useMemo(() => {
    const listOperationId = `${resource.charAt(0).toUpperCase() + Case.camel(resource.slice(1))}.List`
    return operationsById[listOperationId]
  }, [operationsById, resource])

  const getOperation = useMemo(() => {
    const getOperationId = `${resource.charAt(0).toUpperCase() + Case.camel(resource.slice(1))}.Get`
    return operationsById[getOperationId]
  }, [operationsById, resource])

  const saveOperation = useMemo(() => {
    const listOperationId = `${resource.charAt(0).toUpperCase() + Case.camel(resource.slice(1))}.Save`
   return operationsById[listOperationId]
  }, [operationsById, resource])

  const result = useMemo(() => {    
    return {
      listOperation,
      getOperation,
      saveOperation
    }
  }, [getOperation, listOperation, saveOperation])

  return result
}

export default useOperations
