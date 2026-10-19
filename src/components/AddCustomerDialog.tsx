import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Copy, Check, Users } from "lucide-react";
import { actions, generatePin, useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddCustomerDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { t } = useLanguage();
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [projectName, setProjectName] = useState("");
  const [duration, setDuration] = useState(7);
  const [pin, setPin] = useState(() => generatePin());
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setCustomer("");
    setProjectName("");
    setDuration(7);
    setPin(generatePin());
    setSelectedTeam([]);
    setCopied(false);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (val) {
      setPin(generatePin());
      setCopied(false);
    }
  };

  const copyPin = (pinValue: string) => {
    navigator.clipboard.writeText(pinValue);
    setCopied(true);
    toast.success(t.toast_pin_copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTeamMember = (id: string) => {
    setSelectedTeam((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !projectName.trim() || submitting) return;

    setSubmitting(true);
    try {
      await actions.addCustomer({
        customer: customer.trim(),
        projectName: projectName.trim(),
        closesInDays: Number(duration) || 7,
        pin: pin.trim(),
        team: selectedTeam,
      });

      toast.success(`${t.toast_customer_created} ${pin}`);
      setOpen(false);
      reset();
    } catch {
      toast.error("Gagal menambahkan customer");
    } finally {
      setSubmitting(false);
    }
  };

  const salesMembers = s.people.filter((p) => p.role === "sales");
  const techMembers = s.people.filter((p) => p.role === "technical");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="btn text-sm px-4 h-9">
            {t.add_customer}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-light tracking-tight">
            {t.modal_add_customer_title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t.modal_add_customer_desc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div>
            <label className="label-mono block mb-1.5" htmlFor="cust-name">
              {t.input_customer_name} *
            </label>
            <input
              id="cust-name"
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder={t.placeholder_customer_name}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="label-mono block mb-1.5" htmlFor="cust-proj">
              {t.input_project_name} *
            </label>
            <input
              id="cust-proj"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t.placeholder_project_name}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-mono block mb-1.5" htmlFor="cust-duration">
                {t.input_duration_days}
              </label>
              <select
                id="cust-duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring cursor-pointer"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
              </select>
            </div>

            <div>
              <label className="label-mono block mb-1.5">
                {t.auto_pin_label}
              </label>
              <div className="flex gap-1.5">
                <div className="flex h-10 flex-1 items-center justify-between rounded-md border border-input bg-muted/40 px-3 font-mono text-base font-semibold tracking-widest">
                  <span>{pin}</span>
                  <button
                    type="button"
                    onClick={() => copyPin(pin)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                    title={t.copy_pin}
                  >
                    {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newPin = generatePin();
                    setPin(newPin);
                    setCopied(false);
                  }}
                  className="flex h-10 items-center gap-1 rounded-md border border-input px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  title={t.regenerate_pin}
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground rounded-md bg-muted/30 p-2.5 border border-border/50">
            💡 {t.customer_card_hint}
          </p>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-mono">
                {t.assign_team_label} ({selectedTeam.length})
              </label>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="size-3.5" /> {s.people.length} available
              </span>
            </div>

            <div className="space-y-4 rounded-md border border-input/60 p-3 bg-muted/10 max-h-48 overflow-y-auto">
              {salesMembers.length > 0 && (
                <div>
                  <p className="label-mono text-[10px] text-muted-foreground mb-1.5">{t.sales_team}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {salesMembers.map((p) => {
                      const checked = selectedTeam.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2.5 rounded border p-2 text-xs cursor-pointer transition-colors ${
                            checked ? "border-foreground bg-accent/60" : "border-border hover:bg-accent/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTeamMember(p.id)}
                            className="rounded border-input size-3.5"
                          />
                          <div className="truncate">
                            <p className="font-medium truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.title}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {techMembers.length > 0 && (
                <div>
                  <p className="label-mono text-[10px] text-muted-foreground mb-1.5">{t.technical_team}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {techMembers.map((p) => {
                      const checked = selectedTeam.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2.5 rounded border p-2 text-xs cursor-pointer transition-colors ${
                            checked ? "border-foreground bg-accent/60" : "border-border hover:bg-accent/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTeamMember(p.id)}
                            className="rounded border-input size-3.5"
                          />
                          <div className="truncate">
                            <p className="font-medium truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.title}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
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
              disabled={!customer.trim() || !projectName.trim()}
              className="btn text-sm px-5 h-9"
            >
              {t.btn_create_customer}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
