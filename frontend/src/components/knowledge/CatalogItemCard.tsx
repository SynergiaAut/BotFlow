import { Edit2, Trash2, ShoppingBag } from 'lucide-react'
import { formatCOP } from '@/utils/format-cop'

interface CatalogItemCardProps {
  product: any
  onEdit: () => void
  onDelete: () => void
}

export default function CatalogItemCard({ product, onEdit, onDelete }: CatalogItemCardProps) {
  return (
    <div className="group relative bg-[#090D14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-md">
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#00B4DB] to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="space-y-4">
        {/* Product Image */}
        <div className="aspect-video w-full rounded-xl bg-[#030712] border border-white/5 overflow-hidden relative">
          {product.imagen_url ? (
            <img
              src={product.imagen_url}
              alt={product.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <ShoppingBag className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-white tracking-tight leading-snug truncate flex-1" title={product.nombre}>
              {product.nombre}
            </h4>
            <span className="text-[12px] font-black text-[#00B4DB] shrink-0 font-display">
              {formatCOP(product.precio)}
            </span>
          </div>
          <p className="text-[11px] font-medium text-[#A6B3C4] line-clamp-3 leading-relaxed">
            {product.descripcion || 'Sin descripción'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-2 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
          title="Editar"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition-all"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
