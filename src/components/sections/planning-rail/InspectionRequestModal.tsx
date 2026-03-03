import { useState } from 'react';
import { Shipment } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InspectionRequestModalProps {
  shipments: Shipment[];
  onClose: () => void;
}

function fmt(dateStr: string) {
  if (!dateStr) return '___.___.______';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime(timeStr: string) {
  return timeStr || '__:__';
}

export function InspectionRequestModal({ shipments, onClose }: InspectionRequestModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [inspDate, setInspDate] = useState(today);
  const [inspTime, setInspTime] = useState('10:00');
  const [outNum, setOutNum] = useState('');
  const [outDate, setOutDate] = useState(today);

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const addCyrillicFont = () => {
      doc.setFont('helvetica');
    };
    addCyrillicFont();

    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 20;

    const line = (text: string, size = 10, style: 'normal' | 'bold' | 'italic' = 'normal', align: 'left' | 'center' | 'right' = 'left', color = '#000000') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(color);
      if (align === 'center') {
        doc.text(text, pageW / 2, y, { align: 'center' });
      } else if (align === 'right') {
        doc.text(text, pageW - margin, y, { align: 'right' });
      } else {
        doc.text(text, margin, y);
      }
    };

    const nl = (delta = 5) => { y += delta; };

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 5, contentW, 28, 'F');

    line('Начальнику Отдела государственного ветеринарного надзора', 9, 'normal', 'right');
    nl(5);
    line('на Государственной границе Российской Федерации', 9, 'normal', 'right');
    nl(5);
    line('и транспорте по Московскому региону', 9, 'normal', 'right');
    nl(5);
    line('ГУ МВФ «Московский референтный центр Россельхознадзора»', 9, 'bold', 'right');
    nl(5);
    line('Кузьминой Е.В.', 9, 'normal', 'right');
    nl(8);

    line('От: ООО «Полярная Звезда»', 9, 'normal', 'right');
    nl(5);
    line('ИНН 7727844903', 9, 'normal', 'right');
    nl(5);
    line('Адрес: 115516, г. Москва, ул. Промышленная, д. 11, стр. 2', 9, 'normal', 'right');
    nl(5);
    line('Тел.: +7 (495) 661-22-09', 9, 'normal', 'right');
    nl(12);

    if (outNum || outDate) {
      line(`Исх. № ${outNum || '___'} от ${fmt(outDate)}`, 9, 'italic', 'left', '#555555');
      nl(8);
    }

    line('ЗАЯВКА', 14, 'bold', 'center');
    nl(6);
    line('на проведение ветеринарного досмотра', 11, 'normal', 'center');
    nl(8);

    const dateTimeText = `Дата проведения досмотра: ${fmt(inspDate)} в ${fmtTime(inspTime)}`;
    line(dateTimeText, 10, 'normal', 'left');
    nl(7);

    line('ООО «Полярная Звезда» просит произвести ветеринарный досмотр рефрижераторных контейнеров', 10);
    nl(5);
    line('с грузом животного происхождения:', 10);
    nl(8);

    const tableHead = [['№', 'Номер контейнера', 'Груз', 'Клиент', 'Отправитель по ВСД', 'Примечание']];
    const tableBody = shipments.map((s, i) => [
      String(i + 1),
      s.containerNumber || '—',
      s.cargo || '—',
      s.client || '—',
      s.vsdSender || '—',
      s.inspectionNote === 'with_connection_act' ? 'С подключением есть акт' : 'Без подключения',
    ]);

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [50, 80, 140], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 32 },
        2: { cellWidth: 30 },
        3: { cellWidth: 32 },
        4: { cellWidth: 40 },
        5: { cellWidth: 26 },
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    line('Прошу обеспечить доступ к контейнерам, указанным в настоящей заявке.', 10);
    nl(12);

    line('Генеральный директор ООО «Полярная Звезда»', 10, 'normal', 'left');
    nl(5);

    doc.setDrawColor(100, 100, 100);
    doc.line(margin, y, margin + 50, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor('#888888');
    doc.text('(подпись)', margin + 8, y + 4);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');
    doc.text('Сасюк А.Ю.', margin + 55, y);
    nl(10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor('#aaaaaa');
    doc.text('М.П.', margin + 10, y);

    doc.setDrawColor(180, 180, 180);
    doc.circle(margin + 18, y - 3, 12);

    y += 15;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#888888');
    doc.text(`Документ сформирован: ${new Date().toLocaleDateString('ru-RU')}`, margin, y);

    const filename = `Заявка_на_досмотр_${fmt(inspDate).replace(/\./g, '-')}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon name="FileSearch" size={18} className="text-orange-500" />
            <h2 className="text-base font-semibold text-foreground">Заявка на досмотр</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-muted/40 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Выбранные контейнеры ({shipments.length} шт.)</p>
            <div className="flex flex-wrap gap-1.5">
              {shipments.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                  {s.containerNumber}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Дата досмотра</label>
              <Input
                type="date"
                value={inspDate}
                onChange={e => setInspDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Время досмотра</label>
              <Input
                type="time"
                value={inspTime}
                onChange={e => setInspTime(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Исх. №</label>
              <Input
                placeholder="Например: 2026/03-01"
                value={outNum}
                onChange={e => setOutNum(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Дата письма</label>
              <Input
                type="date"
                value={outDate}
                onChange={e => setOutDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Реквизиты документа</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400">Кому: Начальнику ОГВН ГУ МВФ «МРЦ Россельхознадзора» Кузьминой Е.В.</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400">От: ООО «Полярная Звезда», ИНН 7727844903</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400">Подпись: Генеральный директор Сасюк А.Ю., М.П.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button
            onClick={generatePDF}
            className={cn('bg-orange-600 hover:bg-orange-700 text-white')}
          >
            <Icon name="Download" size={14} className="mr-1.5" />
            Сформировать PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
