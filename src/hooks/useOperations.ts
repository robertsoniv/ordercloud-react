import { useCallback, useMemo } from "react";
import useApiSpec from "./useApiSpec";
import Case from "case";

const useOperations = (
  resource: string,
  operationInclusion?: string,
  meEndpoint?: boolean
) => {
  const { operationsById } = useApiSpec();
  const resourceName = useMemo(
    () => resource.charAt(0).toUpperCase() + Case.camel(resource.slice(1)),
    [resource]
  );

  const tryGetOperation = useCallback(
    (operationId: string) => operationsById[operationId],
    [operationsById]
  );

  const listOperation = useMemo(() => {
    let listOperationId;
    if (meEndpoint) {
      listOperationId = `Me.List${resourceName}`;
    } else {
      listOperationId = `${resourceName}.List`;
    }

    return tryGetOperation(listOperationId);
  }, [meEndpoint, resourceName, tryGetOperation]);

  const getOperation = useMemo(() => {
    let getOperationId;
    if (meEndpoint) {
      getOperationId = `Me.Get${resource.slice(0, -1)}`;
    } else {
      getOperationId = `${resourceName}.Get`;
    }

    return tryGetOperation(getOperationId);
  }, [meEndpoint, resource, resourceName, tryGetOperation]);

  const saveOperation = useMemo(() => {
    let saveOperationId;
    if (meEndpoint) {
      saveOperationId = `Me.Save${resource.slice(0, -1)}`;
    } else {
      saveOperationId = `${resourceName}.Save`;
    }

    return tryGetOperation(saveOperationId);
  }, [meEndpoint, resource, resourceName, tryGetOperation]);

  const createOperation = useMemo(() => {
    let createOperationId;
    if (meEndpoint) {
      createOperationId = `Me.Create${resource.slice(0, -1)}`;
    } else {
      createOperationId = `${resourceName}.Create`;
    }

    return tryGetOperation(createOperationId);
  }, [meEndpoint, resource, resourceName, tryGetOperation]);

  const deleteOperation = useMemo(() => {
    let deleteOperationId;
    if (meEndpoint) {
      deleteOperationId = `Me.Delete${resource.slice(0, -1)}`;
    } else {
      deleteOperationId = `${resourceName}.Delete`;
    }

    return tryGetOperation(deleteOperationId);
  }, [meEndpoint, resource, resourceName, tryGetOperation]);

  const assignmentListOperation = useMemo(() => {
    const assignmentListOperationId = `${resourceName}.List${
      operationInclusion ?? ""
    }Assignments`;
    return tryGetOperation(assignmentListOperationId);
  }, [operationInclusion, resourceName, tryGetOperation]);

  const assignmentSaveOperation = useMemo(() => {
    const assignmentSaveOperationId = `${resourceName}.Save${
      operationInclusion ?? ""
    }Assignment`;
    return tryGetOperation(assignmentSaveOperationId);
  }, [operationInclusion, resourceName, tryGetOperation]);

  const assignmentDeleteOperation = useMemo(() => {
    const assignmentDeleteOperationId = `${resourceName}.Delete${
      operationInclusion ?? ""
    }Assignment`;
    return tryGetOperation(assignmentDeleteOperationId);
  }, [operationInclusion, resourceName, tryGetOperation]);

  const result = useMemo(() => {
    return {
      listOperation,
      getOperation,
      saveOperation,
      deleteOperation,
      createOperation,
      assignmentListOperation,
      assignmentSaveOperation,
      assignmentDeleteOperation,
    };
  }, [
    listOperation,
    getOperation,
    saveOperation,
    deleteOperation,
    createOperation,
    assignmentListOperation,
    assignmentSaveOperation,
    assignmentDeleteOperation,
  ]);

  return result;
};

export default useOperations;
