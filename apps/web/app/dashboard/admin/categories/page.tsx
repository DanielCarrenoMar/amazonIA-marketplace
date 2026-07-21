"use client";

import { useEffect, useState } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/dictionary.api";
import type { GroupedCategoryResponseDto } from "event-types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

interface EditingState {
  id: number | null; // null => creando una nueva
  categoryName: string;
  subcategoryName: string;
}

const EMPTY_FORM: EditingState = { id: null, categoryName: "", subcategoryName: "" };

export default function AdminCategoriesPage() {
  const [groups, setGroups] = useState<GroupedCategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EditingState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setGroups(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (categoryName: string, sub: { id: number; subcategoryName: string | null }) => {
    setForm({ id: sub.id, categoryName, subcategoryName: sub.subcategoryName || "" });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.categoryName.trim()) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        categoryName: form.categoryName.trim(),
        subcategoryName: form.subcategoryName.trim() || undefined,
      };
      if (form.id === null) {
        await createCategory(payload);
        toast.success("Categoría creada");
      } else {
        await updateCategory(form.id, payload);
        toast.success("Categoría actualizada");
      }
      setModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la categoría");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, label: string) => {
    const confirmed = window.confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteCategory(id);
      toast.success("Categoría eliminada");
      setGroups(prev =>
        prev
          .map(g => ({ ...g, subcategories: g.subcategories.filter(s => s.id !== id) }))
          .filter(g => g.subcategories.length > 0)
      );
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la categoría");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Cargando categorías...</div>;
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold font-outfit text-muted">
          Categorías de Productos ({groups.reduce((acc, g) => acc + g.subcategories.length, 0)})
        </h2>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1.5" /> Nueva Categoría
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50/50 border-dashed">
          <p className="text-muted">No se encontraron categorías.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map(group => (
            <Card key={group.categoryName} className="p-6">
              <h3 className="text-lg font-bold font-outfit mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-primary" /> {group.categoryName}
              </h3>
              <div className="space-y-2">
                {group.subcategories.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between bg-gray-50/60 rounded-lg px-3 py-2">
                    <span className="text-sm text-foreground">
                      {sub.subcategoryName || <span className="italic text-muted">(sin subcategoría)</span>}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(group.categoryName, sub)}
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === sub.id}
                        onClick={() => handleDelete(sub.id, sub.subcategoryName ? `${group.categoryName} / ${sub.subcategoryName}` : group.categoryName)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id === null ? "Nueva Categoría" : "Editar Categoría"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {form.id === null ? "Crear" : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la categoría *"
            value={form.categoryName}
            onChange={e => setForm(prev => ({ ...prev, categoryName: e.target.value }))}
            placeholder="Ej. Textiles"
          />
          <Input
            label="Subcategoría (opcional)"
            value={form.subcategoryName}
            onChange={e => setForm(prev => ({ ...prev, subcategoryName: e.target.value }))}
            placeholder="Ej. Hamacas"
          />
        </div>
      </Modal>
    </div>
  );
}
