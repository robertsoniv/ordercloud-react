import { useCallback, useMemo } from "react";
import useAuthQuery from "./useAuthQuery";
import {
  Auth,
  Cart,
  LineItem,
  OrderCloudError,
  OrderWorksheet,
  PartialDeep,
  RequiredDeep,
  Tokens,
} from "ordercloud-javascript-sdk";
import { UseQueryResult } from "@tanstack/react-query";
import useAuthMutation from "./useAuthMutation";
import { queryClient, useOrderCloudContext } from "..";
import { isAnonToken } from "../utils";

const useShopper = () => {
  const { autoApplyPromotions, clientId, scope, customScope } =
    useOrderCloudContext();

  const invalidateWorksheet = useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: ["worksheet"],
    });
  }, []);

  const {
    data: orderWorksheet,
    isLoading,
    isPending,
  } = useAuthQuery({
    queryKey: ["worksheet"],
    queryFn: async () => await Cart.GetOrderWorksheet(),
  }) as UseQueryResult<RequiredDeep<OrderWorksheet>, OrderCloudError>;

  const { mutateAsync: applyPromotions } = useAuthMutation({
    mutationKey: ["applyPromos"],
    mutationFn: async () => {
      await Cart.ApplyPromotions();
      return;
    },
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: addCartLineItem } = useAuthMutation({
    mutationKey: ["addCartLineItem"],
    mutationFn: async (lineItem: LineItem) =>
      await Cart.CreateLineItem(lineItem),
    onSuccess: () => {
      if (autoApplyPromotions) applyPromotions();
      invalidateWorksheet();
    },
  });

  const { mutateAsync: patchCartLineItem } = useAuthMutation({
    mutationKey: ["patchCartLineItem"],
    mutationFn: async ({
      ID,
      lineItem,
    }: {
      ID: string;
      lineItem: PartialDeep<LineItem>;
    }) => await Cart.PatchLineItem(ID, lineItem),
    onSuccess: () => {
      if (autoApplyPromotions) applyPromotions();
      invalidateWorksheet();
    },
  });

  const { mutateAsync: deleteCartLineItem } = useAuthMutation({
    mutationKey: ["deleteCartLineItem"],
    mutationFn: async (ID: string) => await Cart.DeleteLineItem(ID),
    onSuccess: () => {
      if (autoApplyPromotions) applyPromotions();
      invalidateWorksheet();
    },
  });

  const { mutateAsync: addCartPromo } = useAuthMutation({
    mutationKey: ["addCartPromo"],
    mutationFn: async (promoCode: string) => await Cart.AddPromotion(promoCode),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: removeCartPromo } = useAuthMutation({
    mutationKey: ["removeCartPromo"],
    mutationFn: async (promoCode: string) =>
      await Cart.DeletePromotion(promoCode),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: listEligiblePromotions } = useAuthMutation({
    mutationKey: ["listPromotions"],
    mutationFn: async () => await Cart.ListEligiblePromotions(),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: submitCart } = useAuthMutation({
    mutationKey: ["submitCart"],
    mutationFn: async () => {
      await Cart.Submit();
      return;
    },
    onSuccess: async () => {
      const token = await Tokens.GetValidToken();
      const isAnon = isAnonToken(token);
      if (isAnon) {
        try {
          const { access_token, refresh_token } = await Auth.Anonymous(
            clientId,
            scope,
            customScope
          );

          Tokens.SetAccessToken(access_token);
          Tokens.SetRefreshToken(refresh_token);
          invalidateWorksheet();
        } catch (error) {
          console.log(error);
        }
      } else {
        invalidateWorksheet();
      }
    },
  });

  const { mutateAsync: deleteCart } = useAuthMutation({
    mutationKey: ["deleteCart"],
    mutationFn: async () => await Cart.Delete(),
    onSuccess: () => invalidateWorksheet(),
  });

  return useMemo(() => {
    return {
      orderWorksheet,
      worksheetLoading: isPending || isLoading,
      addCartLineItem,
      patchCartLineItem,
      deleteCartLineItem,
      addCartPromo,
      submitCart,
      deleteCart,
      removeCartPromo,
      applyPromotions,
      listEligiblePromotions,
    };
  }, [
    orderWorksheet,
    isPending,
    isLoading,
    addCartLineItem,
    patchCartLineItem,
    deleteCartLineItem,
    addCartPromo,
    submitCart,
    deleteCart,
    removeCartPromo,
    applyPromotions,
    listEligiblePromotions,
  ]);
};

export default useShopper;
