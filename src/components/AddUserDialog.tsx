import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, FolderKanban } from "lucide-react";
import { actions, useStore, type Role } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddUserDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { t } = useLanguage();
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<Role>("technical");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const reset = () => {
    setName("");
    setTitle("");
    setRole("technical");
    setSelectedProjects([]);
  };

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !title.trim() || submitting) return;

    setSubmitting(true);
    try {
      await actions.addPerson({
        name: name.trim(),
        title: title.trim(),
        role,
        projectIds: selectedProjects,
      });

      toast.success(t.toast_user_created);
      setOpen(false);
      reset();
    } catch {
      toast.error("Gagal menambahkan anggota tim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="btn text-sm px-4 h-9">
            {t.add_team_member}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-light tracking-tight">
            {t.modal_add_user_title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t.modal_add_user_desc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div>
            <label className="label-mono block mb-1.5" htmlFor="user-name">
              {t.input_user_name} *
            </label>
            <input
              id="user-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeholder_user_name}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="label-mono block mb-1.5" htmlFor="user-title">
              {t.input_user_title} *
            </label>
            <input
              id="user-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.placeholder_user_title}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="label-mono block mb-2">
              {t.input_user_role} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col gap-1 rounded-md border p-3 cursor-pointer transition-colors ${
                  role === "sales"
                    ? "border-foreground bg-accent/60"
                    : "border-border hover:bg-accent/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Briefcase className="size-4" /> {t.filter_sales}
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value="sales"
                    checked={role === "sales"}
                    onChange={() => setRole("sales")}
                    className="size-3.5"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{t.role_sales_desc}</p>
              </label>

              <label
                className={`flex flex-col gap-1 rounded-md border p-3 cursor-pointer transition-colors ${
                  role === "technical"
                    ? "border-foreground bg-accent/60"
                    : "border-border hover:bg-accent/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Briefcase className="size-4" /> {t.filter_technical}
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value="technical"
                    checked={role === "technical"}
                    onChange={() => setRole("technical")}
                    className="size-3.5"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{t.role_tech_desc}</p>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-mono">
                {t.assign_projects_label} ({selectedProjects.length})
              </label>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FolderKanban className="size-3.5" /> {s.projects.length} projects
              </span>
            </div>

            <div className="space-y-1.5 rounded-md border border-input/60 p-3 bg-muted/10 max-h-48 overflow-y-auto">
              {s.projects.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t.no_customers_found}</p>
              ) : (
                s.projects.map((pr) => {
                  const checked = selectedProjects.includes(pr.id);
                  return (
                    <label
                      key={pr.id}
                      className={`flex items-center justify-between rounded border p-2.5 text-xs cursor-pointer transition-colors ${
                        checked ? "border-foreground bg-accent/60" : "border-border hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProject(pr.id)}
                          className="rounded border-input size-3.5"
                        />
                        <div className="truncate">
                          <p className="font-medium truncate">{pr.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{pr.customer}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted/50 border border-border shrink-0">
                        PIN: {pr.pin || pr.code}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost text-sm px-4 h-9"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !title.trim()}
              className="btn text-sm px-5 h-9"
            >
              {t.btn_create_user}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
