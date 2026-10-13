import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoriesTab } from "./CategoriesTab";
import { MenuItemsTab } from "./MenuItemsTab";

export default function MenuPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="قائمة الطعام" description="إدارة التصنيفات والأصناف المعروضة للزبائن" />

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">الأصناف</TabsTrigger>
          <TabsTrigger value="categories">التصنيفات</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <MenuItemsTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
