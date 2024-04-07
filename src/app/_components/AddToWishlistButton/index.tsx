'use client'

import React, { useEffect, useState } from 'react'

import { Product } from '../../../payload/payload-types'
import { useWishlist } from '../../_providers/Wishlist'
import { Button, Props } from '../Button'

import classes from './index.module.scss'

export const AddToWishlistButton: React.FC<{
  product: Product
  className?: string
  appearance?: Props['appearance']
}> = props => {
  const { product, className, appearance = 'primary' } = props

  const {
    wishlist,
    addItemToWishlist,
    deleteItemFromWishlist,
    isProductInWishlist,
    hasInitializedWishlist,
  } = useWishlist()

  const [isInWishlist, setIsInWishlist] = useState<boolean>()

  useEffect(() => {
    setIsInWishlist(isProductInWishlist(product))
  }, [isProductInWishlist, product, wishlist])

  return (
    <Button
      type={!isInWishlist ? 'button' : undefined}
      label={isInWishlist ? `Remove from wishlist` : `Add to wishlist`}
      el={isInWishlist ? 'link' : undefined}
      appearance={appearance}
      className={[
        className,
        classes.addToWishlistButton,
        appearance === 'default' && isInWishlist && classes.green,
        !hasInitializedWishlist && classes.hidden,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={
        !isInWishlist
          ? () => {
              addItemToWishlist({
                product,
              })
            }
          : () => {
              deleteItemFromWishlist(product)
            }
      }
    />
  )
}
