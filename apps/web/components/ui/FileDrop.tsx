"use client";

import React, { forwardRef, useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react";

export interface FileDropProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  onFilesChanged?: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  initialFiles?: File[];
}

export const FileDrop = forwardRef<HTMLInputElement, FileDropProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      accept,
      multiple = false,
      disabled = false,
      onFilesChanged,
      maxFiles = 1,
      maxSizeMB = 5,
      initialFiles = [],
      id,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;
    
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles);
    const [internalError, setInternalError] = useState<string | null>(null);

    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
    const [dragOverItemIdx, setDragOverItemIdx] = useState<number | null>(null);

    const generatedId = React.useId();
    const inputId = id || generatedId;

    const handleFiles = useCallback(
      (newFiles: FileList | File[]) => {
        setInternalError(null);
        let filesArray = Array.from(newFiles);
        const rejectedCount = { types: 0 };

        // Validación de tipo (Extensión mime)
        if (accept) {
          const acceptedTypes = accept.split(",").map(type => type.trim());
          const originalCount = filesArray.length;
          filesArray = filesArray.filter(file => {
            return acceptedTypes.some(type => {
              if (type.startsWith(".")) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
              }
              if (type.endsWith("/*")) {
                const baseType = type.split("/")[0];
                return file.type.startsWith(`${baseType}/`);
              }
              return file.type === type;
            });
          });
          rejectedCount.types = originalCount - filesArray.length;

          if (filesArray.length === 0) {
            setInternalError(`Formatos inválidos. Aceptamos: ${accept}`);
            return;
          }
        }

        // Limitación estricta de Peso
        const tooLargeFile = filesArray.find(f => f.size > maxSizeMB * 1024 * 1024);
        if (tooLargeFile) {
          setInternalError(`"${tooLargeFile.name}" sobrepasa el límite. Máx ${maxSizeMB}MB permitidos.`);
          return;
        }

        // Combina con lo ya seleccionado en vez de reemplazarlo, para no perder
        // un lote previo cuando el usuario agrega más archivos.
        let combinedFiles = multiple ? [...selectedFiles, ...filesArray] : filesArray.slice(0, 1);

        let limitMessage: string | null = null;
        if (multiple && maxFiles && combinedFiles.length > maxFiles) {
          combinedFiles = combinedFiles.slice(0, maxFiles);
          limitMessage = `Solo se pueden subir hasta ${maxFiles} archivos.`;
        }

        if (rejectedCount.types > 0) {
          setInternalError(
            `${rejectedCount.types} archivo(s) fueron ignorados por formato inválido. Aceptamos: ${accept}`
          );
        } else if (limitMessage) {
          setInternalError(limitMessage);
        }

        setSelectedFiles(combinedFiles);
        if (onFilesChanged) {
          onFilesChanged(combinedFiles);
        }
      },
      [accept, multiple, maxFiles, maxSizeMB, onFilesChanged, selectedFiles]
    );

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragging(true);
    }, [disabled]);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    }, []);

    const onDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      },
      [disabled, handleFiles]
    );

    const onFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFiles(e.target.files);
        }
      },
      [handleFiles]
    );

    const triggerFileSelect = () => {
      if (disabled) return;
      resolvedRef.current?.click();
    };

    const removeFile = (e: React.MouseEvent, indexToRemove: number) => {
      e.stopPropagation();
      if (disabled) return;
      const filtered = selectedFiles.filter((_, i) => i !== indexToRemove);
      setSelectedFiles(filtered);
      if (onFilesChanged) {
        onFilesChanged(filtered);
      }
      
      // Reiniciar el input interno para que deje cargar el mismo archivo por segunda vez accidentalmente si lo borró
      if (resolvedRef.current) {
        resolvedRef.current.value = '';
      }
    };

    const handleItemDragStart = (e: React.DragEvent, idx: number) => {
      setDraggedItemIdx(idx);
      e.dataTransfer.effectAllowed = "move";
    };

    const handleItemDragOver = (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (idx !== dragOverItemIdx) {
        setDragOverItemIdx(idx);
      }
    };

    const handleItemDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverItemIdx(null);
    };

    const handleItemDrop = (e: React.DragEvent, targetIdx: number) => {
      e.preventDefault();
      setDragOverItemIdx(null);
      if (draggedItemIdx === null || draggedItemIdx === targetIdx || disabled) {
        setDraggedItemIdx(null);
        return;
      }
      
      const newFiles = [...selectedFiles];
      const [removed] = newFiles.splice(draggedItemIdx, 1);
      newFiles.splice(targetIdx, 0, removed);
      
      setSelectedFiles(newFiles);
      if (onFilesChanged) {
        onFilesChanged(newFiles);
      }
      setDraggedItemIdx(null);
    };

    const handleItemDragEnd = () => {
      setDraggedItemIdx(null);
      setDragOverItemIdx(null);
    };

    const displayError = error || internalError;

    return (
      <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
        {/* Etiqueta */}
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
            {label}
            {props.required && <span className="text-brand-urgency ml-1">*</span>}
          </label>
        )}

        {/* ZONA DE ARRASTRE */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerFileSelect}
          className={`
            relative w-full rounded-2xl border-2 border-dashed p-8 transition-all duration-200
            flex flex-col items-center justify-center text-center outline-none
            ${disabled 
              ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60" 
              : "cursor-pointer"
            }
            ${displayError 
              ? "border-brand-urgency bg-brand-urgency/5" 
              : isDragging 
                ? "border-brand-primary bg-brand-primary/10" 
                : !disabled && "border-border bg-white hover:border-brand-primary/60 hover:bg-brand-nature-bg"
            }
          `}
        >
          {/* Input File Escondido */}
          <input
            id={inputId}
            type="file"
            className="hidden"
            ref={resolvedRef}
            multiple={multiple}
            accept={accept}
            disabled={disabled}
            onChange={onFileInputChange}
            {...props}
          />

          {/* Contenido Visual Central */}
          <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
            <div className={`
              p-3.5 rounded-2xl transition-colors duration-200
              ${isDragging || selectedFiles.length > 0 ? "bg-brand-primary text-white" : "bg-brand-primary/10 text-brand-primary"}
            `}>
              <Icon icon="lucide:upload-cloud" className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                <span className="text-brand-primary underline underline-offset-2">Haz clic para buscar</span> o arrastra tus archivos aquí
              </p>
              <p className="text-xs text-muted">
                {accept ? `Soporta: ${accept} ` : "Cualquier extensión soportada. "}
                (Máximo {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>

        {/* LISTADO PREVIEW DE ARCHIVOS SELECCIONADOS */}
        {selectedFiles.length > 0 && (
          <ul className="mt-3 space-y-2">
            {selectedFiles.map((file, idx) => (
              <li 
                key={`${file.name}-${idx}`}
                draggable={!disabled && multiple}
                onDragStart={(e) => handleItemDragStart(e, idx)}
                onDragOver={(e) => handleItemDragOver(e, idx)}
                onDragLeave={handleItemDragLeave}
                onDrop={(e) => handleItemDrop(e, idx)}
                onDragEnd={handleItemDragEnd}
                className={`flex items-center justify-between p-3 bg-white border-2 rounded-xl text-sm transition-all 
                 ${disabled ? "opacity-70" : "hover:shadow-sm"} 
                 ${multiple && !disabled ? "cursor-grab active:cursor-grabbing" : ""}
                 ${dragOverItemIdx === idx ? "border-brand-primary bg-brand-primary/5 scale-[1.02]" : "border-border"}
                 ${draggedItemIdx === idx ? "opacity-50 border-dashed" : "opacity-100"}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-brand-nature-bg text-brand-primary rounded-lg shrink-0 cursor-grab">
                    <Icon icon="lucide:grip-vertical" className="w-4 h-4 text-brand-primary/60" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="font-medium text-foreground truncate">{file.name}</span>
                    <span className="text-xs text-muted">
                      {(file.size / 1024 > 1024) 
                        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
                        : `${(file.size / 1024).toFixed(1)} KB`
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {idx === 0 && multiple && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                      Principal
                    </span>
                  )}
                  {!disabled && (
                    <button 
                      type="button" 
                      onClick={(e) => removeFile(e, idx)}
                      className="p-1.5 text-muted hover:text-brand-urgency hover:bg-brand-urgency/10 rounded-full transition-colors"
                    >
                      <Icon icon="lucide:x" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Mensaje Informativo o Error Explicito */}
        {displayError ? (
          <p className="text-xs text-brand-urgency font-medium pt-1 animate-in fade-in zoom-in-95">{displayError}</p>
        ) : helperText ? (
          <p className="text-xs text-muted pt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FileDrop.displayName = "FileDrop";
