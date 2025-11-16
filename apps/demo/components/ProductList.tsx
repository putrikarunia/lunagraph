'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Product {
  id: number
  name: string
  price: number
  inStock: boolean
}

export default function ProductList() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Mock data - in real app would come from API
  const products: Product[] = [
    { id: 1, name: 'Laptop', price: 999, inStock: true },
    { id: 2, name: 'Mouse', price: 29, inStock: true },
    { id: 3, name: 'Keyboard', price: 79, inStock: false },
  ]

  const handleAddToCart = (productId: number) => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setSelectedId(productId)
      setIsLoading(false)
    }, 500)
  }

  const totalProducts = products.length
  const inStockCount = products.filter(p => p.inStock).length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Catalog</h1>
        <div className="text-sm text-gray-600">
          {inStockCount} of {totalProducts} in stock
        </div>
      </div>

      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Loading....
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <Card key={product.id} className={selectedId === product.id ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{product.name}</span>
                {!product.inStock && (
                  <span className="text-sm font-normal text-red-600">Out of Stock</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-green-600">
                ${product.price}
              </div>

              {product.inStock ? (
                  <Button
                    onClick={() => handleAddToCart(product.id)}
                    variant="default"
                    className="w-full"
                  >
                    Add to Cart
                  </Button>
              ) : (
                <Button variant="outline" disabled className="w-full">
                  Notify When Available
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No products available
        </div>
      )}
    </div>
  )
}
