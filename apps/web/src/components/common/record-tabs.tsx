import { cn } from "@scp/ui";

export type RecordTab = {
  id: string;
  label: string;
};

export function RecordTabs({
  activeTab,
  onChange,
  tabs,
}: {
  activeTab: string;
  onChange: (tab: string) => void;
  tabs: RecordTab[];
}) {
  return (
    <div className="record-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={activeTab === tab.id}
          className={cn(activeTab === tab.id && "active")}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
