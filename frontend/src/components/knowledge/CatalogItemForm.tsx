import { useState, useRef, useEffect } from 'react'
import { UploadCloud, ImageIcon, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { compressImage } from '@/utils/image-compressor'

interface CatalogItemFormProps {
  botId: string
  onSuccess: () => void
  editingProduct?: any
  onCancel?: () => void
}

export default function CatalogItemForm({ botId, onSuccess, editingProduct, onCancel }: CatalogItemFormProps) {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingProduct) {
      setNombre(editingProduct.nombre || '')
      setPrecio(editingProduct.precio?.toString() || '')
      setDescripcion(editingProduct.descripcion || '')
      setPreviewUrl(editingProduct.imagen_url || null)
    } else {
      setNombre('')
      setPrecio('')
      setDescripcion('')
      setPreviewUrl(null)
      setImageFile(null)
    }
  }, [editingProduct])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !precio.trim()) {
      return toast.error('El nombre y el precio son campos obligatorios.')
    }

    const numericPrice = parseFloat(precio.replace(/[^0-9.]/g, ''))
    if (isNaN(numericPrice) || numericPrice < 0) {
      return toast.error('Por favor, ingresa un precio válido.')
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('nombre', nombre)
      formData.append('precio', numericPrice.toString())
      formData.append('descripcion', descripcion)
      formData.append('botId', botId)

      if (imageFile) {
        toast('Comprimiendo imagen de producto...')
        const compressedBlob = await compressImage(imageFile, 800, 0.8)
        formData.append('image', compressedBlob, imageFile.name)
      }

      const url = editingProduct ? `/api/catalog/${editingProduct.id}` : '/api/catalog'
      const method = editingProduct ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar el producto')

      toast.success(editingProduct ? 'Producto actualizado con éxito.' : 'Producto agregado al catálogo.')
      onSuccess()
    } catch (err: any) {
      console.error('[CATALOG-FORM] Error:', err)
      toast.error(err.message || 'Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00B4DB]" />
          {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#A6B3C4] uppercase tracking-wider ml-1">Nombre</label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Plan Premium Fast Order"
              className="h-11 bg-[#090D14] border-white/10 rounded-xl px-4 text-sm font-semibold focus-visible:ring-[#00B4DB]/20 focus-visible:border-[#00B4DB] transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#A6B3C4] uppercase tracking-wider ml-1">Precio (COP)</label>
            <Input
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Ej: 149000"
              type="text"
              className="h-11 bg-[#090D14] border-white/10 rounded-xl px-4 text-sm font-semibold focus-visible:ring-[#00B4DB]/20 focus-visible:border-[#00B4DB] transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#A6B3C4] uppercase tracking-wider ml-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              placeholder="Detalla las características del producto o servicio..."
              className="w-full bg-[#090D14] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#00B4DB]/20 focus:border-[#00B4DB] transition-all resize-none shadow-sm text-white"
            />
          </div>
        </div>

        <div className="space-y-2 flex flex-col justify-between">
          <label className="text-[11px] font-bold text-[#A6B3C4] uppercase tracking-wider ml-1">Imagen del Producto</label>
          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`flex-1 min-h-[180px] border-2 border-dashed rounded-[20px] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${
              previewUrl ? 'border-[#00B4DB] bg-[#090D14]/30' : 'border-white/10 bg-[#090D14] hover:border-[#00B4DB]/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
            {previewUrl ? (
              <div className="relative w-full h-full min-h-[180px]">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <UploadCloud className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center p-6 text-center space-y-2">
                <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Haz click para subir una imagen</p>
                  <p className="text-[10px] text-[#A6B3C4] font-medium mt-1">JPEG, PNG o WebP. Compresión automática activada.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 h-11 rounded-xl font-bold text-[13px]"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="flex-[2] bg-[#00B4DB] hover:bg-[#26C7EA] text-white h-11 rounded-xl font-bold text-[13px] tracking-wide transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
