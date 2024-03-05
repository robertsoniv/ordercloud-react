import { jwtDecode } from "jwt-decode";
import { DecodedToken, OrderCloudError } from "ordercloud-javascript-sdk";

export const isAnonToken = (token: string) => {
  const parsed = jwtDecode<DecodedToken>(token);
  return !!parsed.orderid;
};

export const defaultRetryFn = (failureCount: number, error: unknown) => {
  const { status } = error as OrderCloudError;
  switch (status) {
    case 401:
    case 403:
      return false;
  }
  return failureCount < 3;
};
