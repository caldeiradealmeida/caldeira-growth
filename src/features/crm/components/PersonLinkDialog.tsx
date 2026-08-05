import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { usePeopleSearch, useCreatePerson, useLinkPerson } from "../hooks/useLeadDetail";
import type { CgiLead } from "../types";

export function PersonLinkDialog({ lead, trigger }: { lead: CgiLead; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState(lead.name);

  const { data: candidates, isLoading } = usePeopleSearch(search);
  const createPerson = useCreatePerson();
  const linkPerson = useLinkPerson(lead.id);

  async function handleLinkExisting(personId: string) {
    try {
      await linkPerson.mutateAsync(personId);
      toast.success("Oportunidade vinculada à pessoa.");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao vincular.");
    }
  }

  async function handleCreateAndLink() {
    try {
      const person = await createPerson.mutateAsync({
        displayName: newName,
        primaryEmailNormalized: lead.email_normalized,
        phone: lead.phone || null,
      });
      await linkPerson.mutateAsync(person.id);
      toast.success("Pessoa criada e oportunidade vinculada.");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar/vincular.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular a uma pessoa</DialogTitle>
          <DialogDescription>
            O vínculo é sempre manual -- nada é agrupado automaticamente por e-mail.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existing">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Pessoa existente</TabsTrigger>
            <TabsTrigger value="new">Nova pessoa</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3">
            <Input
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {isLoading && <p className="text-sm text-muted-foreground">Buscando...</p>}
              {!isLoading && candidates?.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>
              )}
              {candidates?.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void handleLinkExisting(p.id)}
                  disabled={linkPerson.isPending}
                  className="flex w-full flex-col items-start rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-medium">{p.display_name || "(sem nome)"}</span>
                  <span className="text-muted-foreground">{p.primary_email_normalized}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-person-name">Nome</Label>
              <Input id="new-person-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              E-mail: {lead.email_normalized} · Telefone: {lead.phone || "—"}
            </p>
            <DialogFooter>
              <Button onClick={() => void handleCreateAndLink()} disabled={createPerson.isPending || linkPerson.isPending}>
                Criar pessoa e vincular
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
