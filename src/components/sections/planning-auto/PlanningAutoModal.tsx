import React from 'react';
import { AutoTask, AutoTaskType, AutoTaskStatus, AUTO_TASK_TYPE_LABEL, AUTO_TASK_STATUS_LABEL } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TABS } from './constants';

interface PlanningAutoModalProps {
  open: boolean;
  editTask: AutoTask | null;
  activeTab: AutoTaskType;
  formData: Omit<AutoTask, 'id'>;
  onOpenChange: (open: boolean) => void;
  onFormChange: (data: Omit<AutoTask, 'id'>) => void;
  onSave: () => void;
}

function FormField({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function PlanningAutoModal({
  open,
  editTask,
  activeTab,
  formData,
  onOpenChange,
  onFormChange,
  onSave,
}: PlanningAutoModalProps) {
  const set = <K extends keyof Omit<AutoTask, 'id'>>(key: K, val: Omit<AutoTask, 'id'>[K]) =>
    onFormChange({ ...formData, [key]: val });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTask ? 'Редактировать запись' : `Добавить — ${AUTO_TASK_TYPE_LABEL[activeTab]}`}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <FormField label="Дата" required>
            <Input type="date" value={formData.date} onChange={e => set('date', e.target.value)} />
          </FormField>
          <FormField label="Тип">
            <Select value={formData.type} onValueChange={v => set('type', v as AutoTaskType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TABS.map(t => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Номер контейнера" required>
            <Input placeholder="AVGU7003537" value={formData.containerNumber} onChange={e => set('containerNumber', e.target.value)} />
          </FormField>
          <FormField label="Перевозчик">
            <Input placeholder="ИП Нагель" value={formData.carrier} onChange={e => set('carrier', e.target.value)} />
          </FormField>
          {formData.type !== 'movement' && (
            <FormField label="Клиент" className="col-span-2">
              <Input placeholder="ООО Викинг" value={formData.client} onChange={e => set('client', e.target.value)} />
            </FormField>
          )}
          <FormField label="Время">
            <Input placeholder="9:00" value={formData.time} onChange={e => set('time', e.target.value)} />
          </FormField>
          <FormField label="Статус">
            <Select value={formData.status} onValueChange={v => set('status', v as AutoTaskStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(AUTO_TASK_STATUS_LABEL) as AutoTaskStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{AUTO_TASK_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Адрес" className="col-span-2">
            <Input placeholder="г. Артём, ул. 1я Рабочая, 83" value={formData.address} onChange={e => set('address', e.target.value)} />
          </FormField>
          <FormField label="Контакт" className="col-span-2">
            <Input placeholder="8 914 07 50 545 Алеся" value={formData.contact} onChange={e => set('contact', e.target.value)} />
          </FormField>
          <FormField label="Терминал постановки КРК">
            <Input placeholder="ПИК" value={formData.terminalFrom} onChange={e => set('terminalFrom', e.target.value)} />
          </FormField>
          <FormField label={formData.type === 'movement' ? 'Терминал сдачи КРК' : formData.type === 'loading' ? 'Ст. отправления' : 'Терминал сдачи порожнего'}>
            <Input placeholder="ВМТП" value={formData.terminalTo} onChange={e => set('terminalTo', e.target.value)} />
          </FormField>
          {(formData.type === 'movement' || formData.type === 'loading') && (
            <FormField label={formData.type === 'movement' ? 'Направление' : 'Ст. назначения'}>
              <Input placeholder="Москва" value={formData.direction ?? ''} onChange={e => set('direction', e.target.value)} />
            </FormField>
          )}
          <FormField label="Груз">
            <Input placeholder="Мясо птицы" value={formData.cargo} onChange={e => set('cargo', e.target.value)} />
          </FormField>
          <FormField label="Температура (тС)">
            <Input placeholder="-18" value={formData.tempMode} onChange={e => set('tempMode', e.target.value)} />
          </FormField>
          <FormField label="Комментарий" className="col-span-2">
            <Input placeholder="Комментарий..." value={formData.comment} onChange={e => set('comment', e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={onSave} disabled={!formData.containerNumber || !formData.date}>
            {editTask ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
