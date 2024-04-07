import type { Product, User, WishlistItems } from '../../../payload/payload-types'

export type WishlistItem = WishlistItems[0]

type WishlistType = User['wishlist']

type WishlistAction =
  | {
      type: 'SET_WISHLIST'
      payload: WishlistType
    }
  | {
      type: 'MERGE_WISHLIST'
      payload: WishlistType
    }
  | {
      type: 'ADD_ITEM'
      payload: WishlistItem
    }
  | {
      type: 'DELETE_ITEM'
      payload: Product
    }
  | {
      type: 'CLEAR_WISHLIST'
    }

export const wishlistReducer = (wishlist: WishlistType, action: WishlistAction): WishlistType => {
  switch (action.type) {
    case 'SET_WISHLIST': {
      return action.payload
    }

    case 'MERGE_WISHLIST': {
      const { payload: incomingWishlist } = action

      const syncedItems: WishlistItem[] = [
        ...(wishlist?.items || []),
        ...(incomingWishlist?.items || []),
      ].reduce((acc: WishlistItem[], item) => {
        // remove duplicates
        const productId = typeof item.product === 'string' ? item.product : item?.product?.id

        const indexInAcc = acc.findIndex(({ product }) =>
          typeof product === 'string' ? product === productId : product?.id === productId,
        ) // eslint-disable-line function-paren-newline

        if (indexInAcc > -1) {
          acc[indexInAcc] = {
            ...acc[indexInAcc],
            // customize the merge logic here, e.g.:
          }
        } else {
          acc.push(item)
        }
        return acc
      }, [])

      return {
        ...wishlist,
        items: syncedItems,
      }
    }

    case 'ADD_ITEM': {
      const { payload: incomingItem } = action
      const productId =
        typeof incomingItem.product === 'string' ? incomingItem.product : incomingItem?.product?.id

      const indexInWishlist = wishlist?.items?.findIndex(({ product }) =>
        typeof product === 'string' ? product === productId : product?.id === productId,
      ) // eslint-disable-line function-paren-newline

      let withAddedItem = [...(wishlist?.items || [])]

      if (indexInWishlist === -1) {
        withAddedItem.push(incomingItem)
      }

      return {
        ...wishlist,
        items: withAddedItem,
      }
    }

    case 'DELETE_ITEM': {
      const { payload: incomingProduct } = action
      const withDeletedItem = { ...wishlist }

      const indexInWishlist = wishlist?.items?.findIndex(({ product }) =>
        typeof product === 'string'
          ? product === incomingProduct.id
          : product?.id === incomingProduct.id,
      ) // eslint-disable-line function-paren-newline

      if (typeof indexInWishlist === 'number' && withDeletedItem.items && indexInWishlist > -1)
        withDeletedItem.items.splice(indexInWishlist, 1)

      return withDeletedItem
    }

    case 'CLEAR_WISHLIST': {
      return {
        ...wishlist,
        items: [],
      }
    }

    default: {
      return wishlist
    }
  }
}
