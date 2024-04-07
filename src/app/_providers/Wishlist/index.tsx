'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'

import { Product, User } from '../../../payload/payload-types'
import { useAuth } from '../Auth'
import { WishlistItem, wishlistReducer } from './reducer'

export type WishlistContext = {
  wishlist: User['wishlist']
  addItemToWishlist: (item: WishlistItem) => void
  deleteItemFromWishlist: (product: Product) => void
  wishlistIsEmpty: boolean | undefined
  clearWishlist: () => void
  isProductInWishlist: (product: Product) => boolean
  hasInitializedWishlist: boolean
}

const Context = createContext({} as WishlistContext)

export const useWishlist = () => useContext(Context)

const arrayHasItems = array => Array.isArray(array) && array.length > 0

// Step 1: Check local storage for a wishlist
// Step 2: If there is a wishlist, fetch the products and hydrate the wishlist
// Step 3: Authenticate the user
// Step 4: If the user is authenticated, merge the user's wishlist with the local wishlist
// Step 4B: Sync the wishlist to Payload and clear local storage
// Step 5: If the user is logged out, sync the wishlist to local storage only

export const WishlistProvider = props => {
  // const { setTimedNotification } = useNotifications();
  const { children } = props
  const { user, status: authStatus } = useAuth()

  const [wishlist, dispatchWishlist] = useReducer(wishlistReducer, {
    items: [],
  })

  const hasInitialized = useRef(false)
  const [hasInitializedWishlist, setHasInitialized] = useState(false)

  // Check local storage for a wishlist
  // If there is a wishlist, fetch the products and hydrate the wishlist
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true

      const syncWishlistFromLocalStorage = async () => {
        const localWishlist = localStorage.getItem('wishlist')

        const parsedWishlist = JSON.parse(localWishlist || '{}')

        if (parsedWishlist?.items && parsedWishlist?.items?.length > 0) {
          const initialWishlist = await Promise.all(
            parsedWishlist.items.map(async ({ product, quantity }) => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/api/products/${product}`,
              )
              const data = await res.json()
              return {
                product: data,
                quantity,
              }
            }),
          )

          dispatchWishlist({
            type: 'SET_WISHLIST',
            payload: {
              items: initialWishlist,
            },
          })
        } else {
          dispatchWishlist({
            type: 'SET_WISHLIST',
            payload: {
              items: [],
            },
          })
        }
      }

      syncWishlistFromLocalStorage()
    }
  }, [])

  // authenticate the user and if logged in, merge the user's wishlist with local state
  // only do this after we have initialized the wishlist to ensure we don't lose any items
  useEffect(() => {
    if (!hasInitialized.current) return

    if (authStatus === 'loggedIn') {
      // merge the user's wishlist with the local state upon logging in
      dispatchWishlist({
        type: 'MERGE_WISHLIST',
        payload: user?.wishlist,
      })
    }

    if (authStatus === 'loggedOut') {
      // clear the wishlist from local state after logging out
      dispatchWishlist({
        type: 'CLEAR_WISHLIST',
      })
    }
  }, [user, authStatus])

  // every time the wishlist changes, determine whether to save to local storage or Payload based on authentication status
  // upon logging in, merge and sync the existing local wishlist to Payload
  useEffect(() => {
    // wait until we have attempted authentication (the user is either an object or `null`)
    if (!hasInitialized.current || user === undefined) return

    // ensure that wishlist items are fully populated, filter out any items that are not
    // this will prevent discontinued products from appearing in the wishlist
    const flattenedWishlist = {
      ...wishlist,
      items: wishlist?.items
        ?.map(item => {
          if (!item?.product || typeof item?.product !== 'object') {
            return null
          }

          return {
            ...item,
            // flatten relationship to product
            product: item?.product?.id,
          }
        })
        .filter(Boolean) as WishlistItem[],
    }

    if (user) {
      try {
        const syncWishlistToPayload = async () => {
          const req = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
            // Make sure to include cookies with fetch
            credentials: 'include',
            method: 'PATCH',
            body: JSON.stringify({
              wishlist: flattenedWishlist,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (req.ok) {
            localStorage.setItem('wishlist', '[]')
          }
        }

        syncWishlistToPayload()
      } catch (e) {
        console.error('Error while syncing wishlist to Payload.') // eslint-disable-line no-console
      }
    } else {
      localStorage.setItem('wishlist', JSON.stringify(flattenedWishlist))
    }

    setHasInitialized(true)
  }, [user, wishlist])

  const isProductInWishlist = useCallback(
    (incomingProduct: Product): boolean => {
      let isInWishlist = false
      const { items: itemsInWishlist } = wishlist || {}
      if (Array.isArray(itemsInWishlist) && itemsInWishlist.length > 0) {
        isInWishlist = Boolean(
          itemsInWishlist.find(({ product }) =>
            typeof product === 'string'
              ? product === incomingProduct.id
              : product?.id === incomingProduct.id,
          ), // eslint-disable-line function-paren-newline
        )
      }
      return isInWishlist
    },
    [wishlist],
  )

  // this method can be used to add new items AND update existing ones
  const addItemToWishlist = useCallback(incomingItem => {
    dispatchWishlist({
      type: 'ADD_ITEM',
      payload: incomingItem,
    })
  }, [])

  const deleteItemFromWishlist = useCallback((incomingProduct: Product) => {
    dispatchWishlist({
      type: 'DELETE_ITEM',
      payload: incomingProduct,
    })
  }, [])

  const clearWishlist = useCallback(() => {
    dispatchWishlist({
      type: 'CLEAR_WISHLIST',
    })
  }, [])

  return (
    <Context.Provider
      value={{
        wishlist,
        addItemToWishlist,
        deleteItemFromWishlist,
        wishlistIsEmpty: hasInitializedWishlist && !arrayHasItems(wishlist?.items),
        clearWishlist,
        isProductInWishlist,
        hasInitializedWishlist,
      }}
    >
      {children && children}
    </Context.Provider>
  )
}
