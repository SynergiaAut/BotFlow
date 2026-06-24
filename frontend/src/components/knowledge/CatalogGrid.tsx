import { useState, useEffect, useCallback } from 'react'
import { Plus, ShoppingBag, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import CatalogItemCard from './CatalogItemCard'
import CatalogItemForm from './CatalogItemForm'

interface CatalogGridProps {
  botId: string
  onRefresh?: () => void
}

export default function CatalogGrid({ botId, onRefresh }: CatalogGridProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/catalog?botId=${botId}`)
      const data = await res.json()
      if (!res.ok || !data || !data.success) throw new Error(data?.error || 'Error al cargar productos')
      setProducts(data.products || [])
    } catch (err: any) {
      console.error('[CATALOG-GRID] Fetch error:', err)
      toast.error(err.message || 'Error al obtener productos de catálogo.')
    } finally {
      setLoading(false)
    }
  }, [botId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSuccess = () => {
    setIsAdding(false)
    setEditingProduct(null)
    fetchProducts()
    if (onRefresh) onRefresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto del catálogo?')) return

    try {
      const res = await fetch(`/api/catalog/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar producto')

      toast.success('Producto eliminado del catálogo.')
      fetchProducts()
      if (onRefresh) onRefresh()
    } catch (err: any) {
      console.error('[CATALOG-GRID] Delete error:', err)
      toast.error(err.message || 'Error al eliminar el producto.')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Action Header */}
      {!isAdding && !editingProduct && (
        <div className="flex justify-between items-center bg-[#090D14]/30 border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00B4DB]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Inventario del Asistente</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-black">
              {products.length} {products.length === 1 ? 'Ítem' : 'Ítems'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchProducts}
              variant="outline"
              size="icon"
              className="bg-[#090D14] border-white/10 hover:bg-white/5 rounded-xl h-10 w-10"
              title="Actualizar catálogo"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 hover:text-white ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-[#00B4DB] hover:bg-[#26C7EA] text-white rounded-xl h-10 px-4 font-bold text-xs"
            >
              <Plus className="w-4 h-4 mr-2" /> Agregar Producto
            </Button>
          </div>
        </div>
      )}

      {/* Form Area */}
      {(isAdding || editingProduct) && (
        <div className="bg-[#090D14]/40 border border-white/10 p-6 rounded-[24px] shadow-2xl relative">
          <CatalogItemForm
            botId={botId}
            editingProduct={editingProduct}
            onSuccess={handleSuccess}
            onCancel={() => {
              setIsAdding(false)
              setEditingProduct(null)
            }}
          />
        </div>
      )}

      {/* Products Grid */}
      {!isAdding && !editingProduct && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#090D14] border border-white/10 rounded-2xl p-4 space-y-4 animate-pulse">
                  <div className="aspect-video w-full rounded-xl bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-2/3" />
                    <div className="h-3 bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-white/10 rounded-[24px] bg-[#090D14]/10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-[#090D14] rounded-2xl flex items-center justify-center border border-white/10 text-slate-500 shadow-inner">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Catálogo vacío</h4>
                <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  No hay productos registrados para este bot. Los productos registrados se usarán para el RAG semántico en los chats.
                </p>
              </div>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-[#00B4DB] hover:bg-[#26C7EA] text-white rounded-xl h-10 px-5 font-bold text-xs shadow-md"
              >
                Agregar mi primer producto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <CatalogItemCard
                  key={product.id}
                  product={product}
                  onEdit={() => setEditingProduct(product)}
                  onDelete={() => handleDelete(product.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
