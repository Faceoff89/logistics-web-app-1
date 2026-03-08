import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { AutoTask, AutoTaskType } from '@/data/mock';
import { EMPTY_TASK, getColsForType } from './planning-auto/constants';
import { PlanningAutoFilters } from './planning-auto/PlanningAutoFilters';
import { PlanningAutoTable } from './planning-auto/PlanningAutoTable';
import { PlanningAutoModal } from './planning-auto/PlanningAutoModal';

export default function PlanningAuto() {
  const { autoTasks, addAutoTask, updateAutoTask, deleteManyAutoTasks } = useAppStore();

  const [activeTab, setActiveTab] = useState<AutoTaskType>('movement');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  useEffect(() => { setColFilters({}); }, [activeTab]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<AutoTask | null>(null);
  const [formData, setFormData] = useState<Omit<AutoTask, 'id'>>(EMPTY_TASK('movement'));

  const filtered = useMemo(() => {
    return autoTasks
      .filter(t => t.type === activeTab)
      .filter(t => filterStatus === 'all' || t.status === filterStatus)
      .filter(t => !filterDate || t.date === filterDate)
      .filter(t => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.containerNumber.toLowerCase().includes(q) ||
          t.client.toLowerCase().includes(q) ||
          t.carrier.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q) ||
          t.cargo.toLowerCase().includes(q) ||
          (t.direction || '').toLowerCase().includes(q)
        );
      })
      .filter(t => {
        for (const [key, val] of Object.entries(colFilters)) {
          if (!val) continue;
          if (!String(t[key as keyof AutoTask] ?? '').toLowerCase().includes(val.toLowerCase())) return false;
        }
        return true;
      });
  }, [autoTasks, activeTab, filterStatus, filterDate, search, colFilters]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(t => t.id)));
    }
  }

  function handleDeleteSelected() {
    deleteManyAutoTasks([...selected]);
    setSelected(new Set());
  }

  function openAdd() {
    setEditTask(null);
    setFormData(EMPTY_TASK(activeTab));
    setModalOpen(true);
  }

  function openEdit(task: AutoTask) {
    setEditTask(task);
    setFormData({ ...task });
    setModalOpen(true);
  }

  function handleSave() {
    if (editTask) {
      updateAutoTask(editTask.id, formData);
    } else {
      addAutoTask({ ...formData, id: `at${Date.now()}` });
    }
    setModalOpen(false);
  }

  function handleInlineEdit(id: string, key: keyof AutoTask, val: string) {
    updateAutoTask(id, { [key]: val } as Partial<AutoTask>);
  }

  function exportCSV() {
    const cols = getColsForType(activeTab);
    const headers = cols.map(c => c.label).join(';');
    const rows = filtered.map(t =>
      cols.map(c => {
        const val = t[c.key as keyof AutoTask] ?? '';
        return String(val).replace(/;/g, ',');
      }).join(';')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-auto-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <PlanningAutoFilters
        autoTasks={autoTasks}
        activeTab={activeTab}
        search={search}
        filterStatus={filterStatus}
        filterDate={filterDate}
        selected={selected}
        filteredCount={filtered.length}
        onTabChange={tab => { setActiveTab(tab); setSelected(new Set()); }}
        onSearchChange={setSearch}
        onFilterStatusChange={setFilterStatus}
        onFilterDateChange={setFilterDate}
        onDeleteSelected={handleDeleteSelected}
        onClearSelected={() => setSelected(new Set())}
        onExportCSV={exportCSV}
        onAdd={openAdd}
      />

      <PlanningAutoTable
        filtered={filtered}
        activeTab={activeTab}
        selected={selected}
        colFilters={colFilters}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        onColFilterChange={(key, val) => setColFilters(p => ({ ...p, [key]: val }))}
        onInlineEdit={handleInlineEdit}
        onEdit={openEdit}
      />

      <PlanningAutoModal
        open={modalOpen}
        editTask={editTask}
        activeTab={activeTab}
        formData={formData}
        onOpenChange={setModalOpen}
        onFormChange={setFormData}
        onSave={handleSave}
      />
    </div>
  );
}
