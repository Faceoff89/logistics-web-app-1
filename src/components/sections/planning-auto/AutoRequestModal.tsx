import { useState } from 'react';
import { AutoTask } from '@/data/mock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeadingLevel,
} from 'docx';
import { saveAs } from 'file-saver';

interface AutoRequestModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tasks: AutoTask[];
  userName?: string;
}

const COMPANY = {
  name: 'ООО «Полярная Звезда»',
  address: '196006, г. Санкт-Петербург, ул. Новорощинская, д.4, лит.А, часть пом. 1Н, помещение №761, офис 1216-2',
  ogrn: 'ОГРН 1177847253968, ИНН/КПП 7810701046/781001001',
  bank: 'Расчетный счет: 40702810600600212927 в ПАО Банк «АЛЕКСАНДРОВСКИЙ»',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildDoc(tasks: AutoTask[], signerName: string): Document {
  const today = formatDate(new Date());

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 6,
    color: '000000',
  };
  const cellBorders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const headerCell = (text: string) =>
    new TableCell({
      borders: cellBorders,
      shading: { fill: 'CCCCCC' },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: true, size: 18 })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

  const dataCell = (text: string, center = false) =>
    new TableCell({
      borders: cellBorders,
      children: [
        new Paragraph({
          children: [new TextRun({ text, size: 18 })],
          alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        }),
      ],
    });

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell('№ КТК'),
      headerCell('Направление'),
      headerCell('t°'),
      headerCell('Груз'),
      headerCell('Фут.'),
      headerCell('Тип'),
      headerCell('Перевозчик'),
    ],
  });

  const dataRows = tasks.map(
    (t, i) =>
      new TableRow({
        children: [
          dataCell(t.containerNumber || '—', true),
          dataCell(t.direction || t.terminalTo || '—'),
          dataCell(t.tempMode || '—', true),
          dataCell(t.cargo || '—'),
          dataCell('—', true),
          dataCell('—', true),
          dataCell(t.carrier || '—'),
        ],
      })
  );

  return new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: COMPANY.name, bold: true, size: 22 })] }),
          new Paragraph({ children: [new TextRun({ text: COMPANY.address, size: 18 })] }),
          new Paragraph({ children: [new TextRun({ text: COMPANY.ogrn, size: 18 })] }),
          new Paragraph({ children: [new TextRun({ text: COMPANY.bank, size: 18 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: `Исх. б/н от ${today}`, size: 18 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'Заявка', bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Просьба принять груженные контейнера:', size: 20 })] }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeaderRow, ...dataRows],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'С уважением,', size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: 'Специалист отдела логистики', size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: COMPANY.name, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: signerName, bold: true, size: 20 })] }),
        ],
      },
    ],
  });
}

export function AutoRequestModal({ open, onOpenChange, tasks, userName = '' }: AutoRequestModalProps) {
  const [signerName, setSignerName] = useState(userName);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const doc = buildDoc(tasks, signerName);
      const blob = await Packer.toBlob(doc);
      const today = new Date().toISOString().slice(0, 10);
      saveAs(blob, `Заявка_${today}.docx`);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="FileText" size={18} />
            Формирование заявки
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-0.5">
            <p className="font-semibold text-foreground">{COMPANY.name}</p>
            <p className="text-muted-foreground text-xs">{COMPANY.address}</p>
            <p className="text-muted-foreground text-xs">{COMPANY.ogrn}</p>
            <p className="text-muted-foreground text-xs">{COMPANY.bank}</p>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground mb-2">Контейнеры в заявке ({tasks.length} шт.):</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-medium text-foreground w-28 shrink-0">{t.containerNumber || '—'}</span>
                  <span className="text-muted-foreground">{t.direction || t.terminalTo || '—'}</span>
                  {t.tempMode && <span className="text-blue-600">{t.tempMode}</span>}
                  <span className="text-muted-foreground ml-auto">{t.carrier || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="signer" className="text-sm">ФИО подписанта</Label>
            <Input
              id="signer"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleGenerate} disabled={loading || tasks.length === 0}>
            {loading ? (
              <><Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />Формируем...</>
            ) : (
              <><Icon name="Download" size={14} className="mr-1.5" />Скачать DOCX</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
