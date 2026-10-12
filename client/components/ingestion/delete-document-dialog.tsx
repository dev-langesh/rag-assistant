"use client";

import React, { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { DocumentItem } from "@/types/document";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DeleteDocumentDialogProps {
  document: Pick<DocumentItem, "id" | "filename" | "chunk_count">;
  onDelete: (id: string, filename: string) => Promise<boolean>;
  isDeleting: boolean;
  trigger?: React.ReactNode;
}

export function DeleteDocumentDialog({
  document,
  onDelete,
  isDeleting,
  trigger,
}: DeleteDocumentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirmDelete = async () => {
    const success = await onDelete(document.id, document.filename);
    if (success) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            <>{trigger}</>
          ) : (
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                "size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity",
                isDeleting && "opacity-100 pointer-events-none"
              )}
              title="Delete document"
              disabled={isDeleting}
            />
          )
        }
      >
        {!trigger && (
          <>
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin text-destructive" />
            ) : (
              <Trash2 className="size-3" />
            )}
            <span className="sr-only">Delete {document.filename}</span>
          </>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Delete Ingested Document
          </DialogTitle>
          <DialogDescription className="text-xs pt-1 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              &quot;{document.filename}&quot;
            </span>
            ?
            <br />
            This will permanently remove the document and its{" "}
            <span className="font-medium text-foreground">
              {document.chunk_count} vector chunks
            </span>{" "}
            from PostgreSQL.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2">
          <DialogClose
            render={
              <Button variant="outline" size="sm" disabled={isDeleting} />
            }
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Deleting...
              </>
            ) : (
              "Delete Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
