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

  const createOperation = useMemo(() => {
    const listOperationId = `${resource.charAt(0).toUpperCase() + Case.camel(resource.slice(1))}.Create`
   return operationsById[listOperationId]
  }, [operationsById, resource])

  const deleteOperation = useMemo(() => {
    const listOperationId = `${resource.charAt(0).toUpperCase() + Case.camel(resource.slice(1))}.Delete`
   return operationsById[listOperationId]
  }, [operationsById, resource])

  const result = useMemo(() => {    
    return {
      listOperation,
      getOperation,
      saveOperation,
      deleteOperation,
      createOperation
    }
  }, [listOperation, getOperation, saveOperation, deleteOperation, createOperation])

  return result
}

export default useOperations
