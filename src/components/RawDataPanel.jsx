import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Copy, Search } from 'lucide-react';

function isArrayOfObjects(value) {
  return Array.isArray(value) && value.every((row) => row && typeof row === 'object' && !Array.isArray(row));
}

function getAllColumns(rows) {
  const columnSet = new Set();
  rows.forEach((row) => Object.keys(row || {}).forEach((k) => columnSet.add(k)));
  return Array.from(columnSet);
}

function toCSV(rows, columns) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((c) => escape(row[c])).join(',')).join('\n');
  return header + '\n' + body;
}

export default function RawDataPanel({ title = 'Raw Data', description, data, t }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [view, setView] = useState(isArrayOfObjects(data) ? 'table' : 'json');

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const columns = useMemo(() => (isArrayOfObjects(rows) ? getAllColumns(rows) : []), [rows]);

  const filteredRows = useMemo(() => {
    if (!query || !rows.length) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      Object.values(row || {}).some((v) => String(typeof v === 'object' ? JSON.stringify(v) : v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data ?? {}, null, 2));
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'data').toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    if (!rows.length) return;
    const csv = toCSV(rows, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'data').toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalBadgeText = t ? `${filteredRows.length} ${t('common.total')}` : `${filteredRows.length} total`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {isArrayOfObjects(data) && (
              <>
                <Button variant="outline" size="sm" onClick={downloadCsv}>
                  <Download className="h-4 w-4 mr-2" /> CSV
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={downloadJson}>
              <Download className="h-4 w-4 mr-2" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={copyJson}>
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
            {isArrayOfObjects(data) && (
              <Badge variant="secondary" className="ml-1">{totalBadgeText}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isArrayOfObjects(data) ? (
          <Tabs value={view} onValueChange={setView} className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input className="pl-8" placeholder={t ? t('common.search') : 'Search...'} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
                </div>
                <select className="border rounded-md p-2 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}/page</option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      {columns.map((col) => (
                        <th key={col} className="text-left p-3 font-semibold text-sm border-b whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                        {columns.map((col) => (
                          <td key={col} className="p-3 text-sm align-top">
                            {(() => {
                              const value = row[col];
                              if (value === null || value === undefined) return '';
                              if (typeof value === 'object') return <code className="text-[11px] bg-muted/40 px-1 py-0.5 rounded">{JSON.stringify(value)}</code>;
                              return String(value);
                            })()}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {pageRows.length === 0 && (
                      <tr>
                        <td colSpan={columns.length} className="text-center p-6 text-muted-foreground text-sm">{t ? t('common.noResults') : 'No results'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {(pageStart + 1)}-{Math.min(pageStart + pageSize, filteredRows.length)} of {filteredRows.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                  <span>{currentPage}/{totalPages}</span>
                  <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="json">
              <ScrollArea className="max-h-[480px] rounded-md border">
                <pre className="text-xs p-3 leading-5">{JSON.stringify(data, null, 2)}</pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="max-h-[520px] rounded-md border">
            <pre className="text-xs p-3 leading-5">{JSON.stringify(data ?? {}, null, 2)}</pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}