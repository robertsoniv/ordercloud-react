# OrderCloud React
This is a developer library for OrderCloud developers utilizing React for their frontend development. It is essentially a wrapper for Tanstack query, which provides a lot of good functionality out of the box for background refreshes, request de-duplication, and caching. You configure your API client settings on the `OrderCloudProvider` which will provide you with a global context accessible though the `useOrderCloudContext()` hook. In addition to this context hook, it provides "authenticated" versions of `useQuery` and `useMutation` for reading and manipulating OrderCloud data in an efficient manner.

# Peer Dependencies
To keep this package small, there are some required peer dependencies that are typical of an OrderCloud React application that utilizies tanstack libraries:

- @tanstack/react-query@^5.20.1
- @tanstack/react-table@^8.11.8
- ordercloud-javascript-sdk@^5.3.0
- react@^18.2.0
- react-dom@^18.2.0

# Usage

## `OrderCloudProvider`
It is recommended that the `OrderCloudProvider` be configured as close to the root of your application as possible. At the very least it needs to wrap any part of your application that will need to communicate with the OrderCloud API.

### Options

#### **baseApiUrl**: `string`
The OrderCloud base API URL for your marketplace. Usually found in the OrderCloud Portal.

#### **clientId**: `string`
The OrderCloud API Client ID that will be used for authentication

#### **scope**: `string[]`
An array of OrderCloud API Roles that will be requested upon authentication

#### **customScope**: `string[]`
An **optional** array of Custom Roles (strings) that will be requested upon authentication. Generally only needed if you are using Custom Roles in your marketplace's Security Profiles.

#### **allowAnonymous**: `boolean`
True will enable anonymous authentication (when the API client is properly configured). False will remain unauthenticated until the `login()` method is called by your application.

#### **defaultErrorHandler** `(error:OrderCloudError) => void`
An **optional** callback function for globally handling OrderCloud errors in your application. Useful for wiring up toast-like feedback.

## `useOrderCloudContext()` hook
This hook returns the OrderCloud context that the OrderCloudProvider sets up based on your provided options. If anonymous authentication is allowed the OrderCloud context will automatically be in an authenticated state on first page load (shortly after the first React lifecycle).

### Additional Properties
The OrderCloud context returns all of the information you configure on the OrderCloudProvider (`baseApiUrl`, `clientId`, etc.), along with some additional properties listed below.

#### **isAuthenticated**: `boolean`
When false, there is no valid OrderCloud access token available. Not to be confused with `isLoggedIn`.

#### **isLoggedIn**: `boolean`
When true, the currently active OrderCloud access token is a _registered_ user (not anonymous).

#### **login**: `(username:string, password:string, rememberMe:boolean) => Promise<AccessToken>`
An asyncrhonous callback method for building a login form for your application. When **rememberMe** is set to `true`, the `OrderCloudProvider` will attempt to store and use the `refresh_token` as long as it is valid. It is not necessary to do anything with the `AccessToken` response as this method will take care of managing the active token and authentication state for you.

#### **logout**: `() => void`
A callback for logging out a registered user from your application. This will also clear the Tanstack query client cache for OrderCloud API calls, forcing any actively used queries to refetch once anonymous auth takes over again or the user logs back in.

## `useAuthQuery()` hook
This is a wrapper for the `useQuery` Tanstack hook that utilizes the OrderCloud context to set `enabled` equal to `isAuthenticated`. It also checks for the presence of `query.error` and calls out to the supplied `defaultErrorHandler` if it was configured on the provider.

This hook supports all of the normal `UseQueryOptions` documented by Tanstack. In addition to these options, you can override the default error handler by passing a modified error handler as the second argument. Ultimately this hook will return the same `UseQueryResult` that is documented on Tanstack query.

### Usage
Here is an example of using the `useAuthQuery` hook to create a hook that returns the current user. 
```tsx
import { Me, MeUser, OrderCloudError, RequiredDeep } from "ordercloud-javascript-sdk";
import { useAuthQuery } from "@rwatt451/ordercloud-react";
import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

export function useCurrentUser():UseQueryResult<RequiredDeep<MeUser>, OrderCloudError> {
  return useAuthQuery({
    queryKey: ["currentUser"],
    queryFn: async () => await Me.Get(),
    retry: false,
    refetchOnMount:false,
  });
}
```
Specifying the `queryKey` is important here as it is what controls the query client caching and de-deuplication. This allows you to use the `useCurrentUser` hook anywhere in your application and it will only ever be called once.

## `useAuthMutation()` hook
This is a wrapper for the `useMutation` Tanstack hook that utilizes the OrderCloud context to set `enabled` equal to `isAuthenticated` - just like `useAuthQuery`.

This hook supports all of the normal `UseMutationOptions` documented by Tanstack. Because `useMutation` already has an option for `onError`, the wrapped `useAuthMutation` will utilize the `defaultErrorHandler` if configured at the provider level and a more specific `onError` callback hasn't been provided. This ultimately returns the same `UseMutationRestult` as Tanstack query.

### Usage
Here is an example of using the `useAuthMutation` hook to create a `UseMutationResult` for modifying the current user. 
```tsx
import { Me, MeUser, OrderCloudError, RequiredDeep } from "ordercloud-javascript-sdk";
import { queryClient, useAuthMutation } from "@rwatt451/ordercloud-react";
import { UseMutationResult } from "@tanstack/react-query";

export function useMutateCurrentUser():UseMutationResult<RequiredDeep<MeUser>, unknown, Partial<MeUser>, unknown> {
    return useAuthMutation({
        mutationKey: ["currentUser"],
        mutationFn: async (userData:Partial<MeUser>) => await Me.Patch(userData),
        onSuccess: (data) => {
            queryClient.setQueryData(["currentUser"], data)
        },
    })
}
```
Specifying the `mutationKey` is important here as it is what controls the query client caching and de-deuplication. The `onSuccess` option provides an avenue for updating the queryClient qury data cache. That way, any componenent that had used `useCurrentUser` will automatically get the updated value no matter where/when `mutate()` is called.

## Important Notes
While it is not necessary to use the actual OrderCloud SDK to communicate with the OrderCloud API, it definitely makes things easier. The `isAuthenticated` state is based on the returned value of SDKs `Tokens.GetValidToken()` method and the OrderCloud SDK `Configuration` object is set up using the values passed into the `OrderCloudProvider`. Additonally, the SDK provides typed responses which make working with `useAuthQuery` and `useMutationQuery` generics easier.

On the flip side, it is also not entirely necessary to use the wrapped Tanstack hooks. If you want to just use the normal OrderCloud SDK, just be certain that you aren't making any calls when `isAuthenticated` is false. Though, in doing so you will miss out on all of the benefits that Tanstack provides.