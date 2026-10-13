import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settingsApi, type SettingsMap } from "@/api/settings";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency } from "@/lib/format";

interface Field {
  key: string;
  label: string;
  type?: "text" | "number" | "toggle";
  hint?: string;
  placeholder?: string;
}

const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: "معلومات المطعم",
    fields: [
      { key: "restaurant_name", label: "اسم المطعم" },
      { key: "phone", label: "رقم الهاتف" },
      { key: "address", label: "العنوان" },
    ],
  },
  {
    title: "المالية والضريبة",
    fields: [
      { key: "currency", label: "رمز العملة", hint: "مثال: ل.س" },
      { key: "tax_rate", label: "نسبة الضريبة", type: "number", hint: "بين 0 و 1 — مثال: 0.16 يعني 16%" },
      { key: "delivery_fee", label: "رسوم التوصيل الثابتة", type: "number" },
    ],
  },
  {
    title: "الطلب المباشر من الزبون",
    fields: [
      {
        key: "qr_ordering_enabled",
        label: "الطلب من الطاولة (QR)",
        type: "toggle",
        hint: "الزبون بيمسح QR الطاولة (من صفحة الطاولات) وبيطلب من موبايله، والطلب بيوصل للمطبخ مباشرة.",
      },
      {
        key: "online_ordering_enabled",
        label: "الطلب الأونلاين (استلام / توصيل)",
        type: "toggle",
        hint: "صفحة الطلب العامة على الرابط /order. الدفع كاش عند الاستلام. الطلب بيدخل المطبخ مباشرة بدون موافقة.",
      },
      {
        key: "online_min_order",
        label: "الحد الأدنى للطلب الأونلاين",
        type: "number",
        hint: "قبل الضريبة والتوصيل. 0 = بدون حد أدنى.",
      },
    ],
  },
  {
    title: "الورديات",
    fields: [
      {
        key: "shift_max_hours",
        label: "أقصى مدة للوردية (ساعات)",
        type: "number",
        placeholder: "12",
        hint: "الوردية المفتوحة أكتر من هالمدة بتنسكر تلقائياً (الموظف نسي الانصراف) وبتنعلّم للمراجعة. بين 1 و 24، الافتراضي 12.",
      },
    ],
  },
  {
    title: "برنامج الولاء",
    fields: [
      { key: "loyalty_points_per_currency", label: "نقاط الولاء لكل وحدة عملة", type: "number", hint: "مثال: 0.001 = نقطة لكل 1000" },
      { key: "loyalty_point_value", label: "قيمة النقطة الواحدة عند الاستبدال", type: "number" },
    ],
  },
];

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));

const REQUIRED_KEYS = [
  "restaurant_name",
  "currency",
  "tax_rate",
  "delivery_fee",
  "loyalty_points_per_currency",
  "loyalty_point_value",
  "shift_max_hours",
  "online_min_order",
];
const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  SECTIONS.flatMap((s) => s.fields.map((f) => [f.key, f.label]))
);

function validate(form: SettingsMap): string | null {
  for (const key of REQUIRED_KEYS) {
    if (form[key] !== undefined && String(form[key]).trim() === "") {
      return `الحقل «${FIELD_LABELS[key] ?? key}» مطلوب`;
    }
  }
  const tax = Number(form.tax_rate);
  if (form.tax_rate !== undefined && (!Number.isFinite(tax) || tax < 0 || tax > 1)) {
    return "نسبة الضريبة لازم تكون بين 0 و 1 (مثلاً 0.16 بدل 16)";
  }
  const shiftHours = form.shift_max_hours;
  if (shiftHours !== undefined && (!Number.isFinite(Number(shiftHours)) || Number(shiftHours) < 1 || Number(shiftHours) > 24)) {
    return "أقصى مدة للوردية لازم تكون بين 1 و 24 ساعة";
  }
  for (const [key, max] of [
    ["delivery_fee", 1_000_000_000],
    ["online_min_order", 1_000_000_000],
    ["loyalty_points_per_currency", 1000],
    ["loyalty_point_value", 1_000_000_000],
  ] as const) {
    const v = form[key];
    if (v !== undefined && (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > max)) {
      return `«${FIELD_LABELS[key] ?? key}» لازم تكون رقم بين 0 و ${max.toLocaleString("en-US")}`;
    }
  }
  return null;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
  const [form, setForm] = useState<SettingsMap>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const dirty = useMemo(() => ALL_KEYS.some((k) => (form[k] ?? "") !== (data?.[k] ?? "")), [form, data]);

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const error = validate(form);
    if (error) {
      toast.error(error);
      return;
    }
    mutation.mutate(
      Object.fromEntries(ALL_KEYS.filter((k) => form[k] !== undefined).map((k) => [k, form[k]]))
    );
  }

  const tax = Number(form.tax_rate) || 0;
  const previewBase = 100000;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الإعدادات" description="إعدادات عامة للمطعم" />

      {isLoading ? (
        <p className="text-sm text-[var(--color-ink-soft)]">جارِ التحميل...</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-6">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {section.fields.map((f) => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <Label htmlFor={f.key}>{f.label}</Label>
                    {f.type === "toggle" ? (
                      <Switch
                        id={f.key}
                        checked={form[f.key] === "1"}
                        onCheckedChange={(on) => setForm((prev) => ({ ...prev, [f.key]: on ? "1" : "0" }))}
                      />
                    ) : (
                    <Input
                      id={f.key}
                      type={f.type ?? "text"}
                      step={f.type === "number" ? "any" : undefined}
                      min={f.type === "number" ? 0 : undefined}
                      placeholder={f.placeholder}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                    )}
                    {f.hint && <p className="text-xs text-[var(--color-ink-soft)]">{f.hint}</p>}
                    {f.key === "tax_rate" && form.tax_rate && (
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        معاينة: فاتورة {formatCurrency(previewBase, form.currency)} + ضريبة{" "}
                        {formatCurrency(previewBase * tax, form.currency)} ={" "}
                        {formatCurrency(previewBase * (1 + tax), form.currency)}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <Button type="submit" disabled={mutation.isPending || !dirty}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ الإعدادات
            </Button>
            <Button type="button" variant="outline" disabled={!dirty} onClick={() => data && setForm(data)}>
              <RotateCcw className="h-4 w-4" />
              تراجع
            </Button>
            {dirty && <span className="text-xs text-[var(--color-warning)]">في تغييرات غير محفوظة</span>}
          </div>
        </form>
      )}
    </div>
  );
}
