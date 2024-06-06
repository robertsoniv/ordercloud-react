import {useMemo} from "react"
import useOrderCloudContext from "./useOrderCloudContext"
import { getRoles } from "../utils"
import { IOrderCloudOperationObject } from "../models"
import useOperations from "./useOperations"

export type AccessQualifier = string | string[]

export const isAllowedAccess = (assignedRoles: string[] | string | undefined, hasAccess: AccessQualifier): boolean => {
if(!assignedRoles) return false
  switch (typeof hasAccess) {
    case "undefined":
      return false
    case "string":
      return (
        assignedRoles.includes(hasAccess) || assignedRoles.includes("FullAccess")
      )
    default:
      if (assignedRoles.includes("FullAccess")) {
        return true
      }
      else if (Array.isArray(hasAccess)) {
        if (hasAccess.length === 0) {
          return false
        }
        return (hasAccess as string[]).some((access) =>
          isAllowedAccess(assignedRoles, access)
        )
      }
      else {
        return false
      }
  }
}

export const isResourceAdmin = (assignedRoles: string[] | string | undefined, operation: IOrderCloudOperationObject): boolean => {
  if(!assignedRoles) return false
  if (assignedRoles.includes("FullAccess")) {
    return true
  }  
  const roles = operation?.security?.[0].OAuth2
  return roles ? roles.some(role => assignedRoles.includes(role) && role.includes('Admin')) : false
}

const useHasAccess = (accessQualifier: string | string[], resource?: string) => {
  const context = useOrderCloudContext()
  const roles = useMemo(() => getRoles(context.token || ""), [context.token])
  const { listOperation } = useOperations(resource || "")

  const allowed = useMemo(() => 
    isAllowedAccess(roles, accessQualifier)
  , [accessQualifier, roles])

  const isAdmin = useMemo(() => 
    isResourceAdmin(roles, listOperation)
  , [listOperation, roles])

  return useMemo(()=> {
    return {
      allowed,
      isAdmin
    }
  },[allowed, isAdmin])
}

export default useHasAccess
