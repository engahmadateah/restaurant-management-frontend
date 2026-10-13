import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AttendanceTab } from "./AttendanceTab";
import { ScheduleTab } from "./ScheduleTab";
import { PayrollTab } from "./PayrollTab";

export default function WorkforcePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الورديات والرواتب" description="تسجيل الحضور، جدولة الورديات، وكشوفات الرواتب" />

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">الحضور والانصراف</TabsTrigger>
          <TabsTrigger value="schedule">جدولة الورديات</TabsTrigger>
          <TabsTrigger value="payroll">الرواتب</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleTab />
        </TabsContent>
        <TabsContent value="payroll">
          <PayrollTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
